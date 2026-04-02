<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Http\Requests\AdminResetAccountEmailRequest;
use App\Http\Requests\AdminStoreAccountRequest;
use App\Http\Requests\AdminUpdateAccountIdentityRequest;
use App\Models\RfidCard;
use App\Models\User;
use App\Notifications\AccountActivationSetPassword;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Inertia\Response;

class AdminAccountController extends Controller
{
    public function index(Request $request): Response
    {
        abort_if(Auth::user()->role !== 'admin', 403, 'Akses ditolak.');

        $search = trim((string) $request->query('search', ''));
        $status = (string) $request->query('status', 'all');
        if (!in_array($status, ['all', 'active', 'pending', 'inactive'], true)) {
            $status = 'all';
        }

        $users = User::query()
            ->with([
                'primaryRfidCard' => fn($query) => $query->select([
                    'rfid_cards.id',
                    'rfid_cards.user_id',
                    'rfid_cards.uid',
                ]),
            ])
            ->withCount([
                'rfidCards as rfid_count' => fn($query) => $query->where('is_active', true),
            ])
            ->when($status !== 'all', function ($query) use ($status) {
                $query->where('status', $status);
            })
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($subQuery) use ($search) {
                    $subQuery->where('name', 'like', '%' . $search . '%')
                        ->orWhere('email', 'like', '%' . $search . '%')
                        ->orWhere('role', 'like', '%' . $search . '%')
                        ->orWhereHas('rfidCards', function ($rfidQuery) use ($search) {
                            $rfidQuery->where('uid', 'like', '%' . $search . '%');
                        });
                });
            })
            ->orderByDesc('created_at')
            ->paginate(15, ['id', 'name', 'email', 'role', 'is_active', 'status', 'created_at'])
            ->through(function (User $user) {
                $primaryRfid = $user->primaryRfidCard?->uid;

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'is_active' => $user->is_active,
                    'status' => $user->status,
                    'created_at' => $user->created_at,
                    'rfid_uid' => $primaryRfid ?? $user->rfid_uid,
                    'rfid_count' => (int) ($user->rfid_count ?? 0),
                ];
            })
            ->withQueryString();

        return inertia('Admin/Account/Index', [
            'users' => $users,
            'filters' => [
                'search' => $search,
                'status' => $status,
            ],
        ]);
    }

    public function store(AdminStoreAccountRequest $request)
    {
        abort_if(Auth::user()->role !== 'admin', 403, 'Akses ditolak.');

        $data = $request->validated();

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make(Str::random(40)),
            'role' => $data['role'],
            'rfid_uid' => null,
            'is_active' => false,
            'status' => 'pending',
            'email_verified_at' => null,
        ]);

        $newRfid = trim((string) ($data['rfid_uid'] ?? ''));
        if ($newRfid !== '') {
            RfidCard::create([
                'user_id' => $user->id,
                'uid' => $newRfid,
                'is_active' => true,
            ]);
        }

        if (!$this->sendActivationLink($user)) {
            return redirect()
                ->route('admin.accounts.index')
                ->with('error', 'Akun dibuat, tapi email aktivasi gagal dikirim. Coba "Activate Account".');
        }

        return redirect()
            ->route('admin.accounts.index')
            ->with('success', 'Akun berhasil dibuat. Link aktivasi telah dikirim ke email user.');
    }

    public function activate(User $user)
    {
        abort_if(Auth::user()->role !== 'admin', 403, 'Akses ditolak.');

        if (!$this->sendActivationLink($user)) {
            return back()->with('error', 'Gagal mengirim email aktivasi akun.');
        }

        return back()->with('success', 'Email aktivasi akun berhasil dikirim.');
    }

    public function deactivate(User $user)
    {
        abort_if(Auth::user()->role !== 'admin', 403, 'Akses ditolak.');

        if ($user->id === Auth::id()) {
            return back()->with('error', 'Tidak bisa menonaktifkan akun yang sedang login.');
        }

        if ($user->role === 'admin') {
            $activeAdminCount = User::query()
                ->where('role', 'admin')
                ->where('is_active', true)
                ->whereNull('deleted_at')
                ->count();

            if ($user->is_active && $activeAdminCount <= 1) {
                return back()->with('error', 'Tidak bisa menonaktifkan admin aktif terakhir.');
            }
        }

        DB::transaction(function () use ($user) {
            RfidCard::query()
                ->where('user_id', $user->id)
                ->where('is_active', true)
                ->update(['is_active' => false]);

            $user->forceFill([
                'is_active' => false,
                'status' => 'inactive',
            ])->save();
        });

        return back()->with('success', 'Akun berhasil dinonaktifkan.');
    }

    public function resetEmail(AdminResetAccountEmailRequest $request, User $user)
    {
        abort_if(Auth::user()->role !== 'admin', 403, 'Akses ditolak.');

        $user->forceFill([
            'email' => $request->email,
            'password' => Hash::make(Str::random(40)),
            'is_active' => false,
            'status' => 'pending',
            'email_verified_at' => null,
        ])->save();

        if (!$this->sendActivationLink($user)) {
            return back()->with('error', 'Email diupdate, tapi email aktivasi gagal dikirim.');
        }

        return back()->with('success', 'Email akun diperbarui. Link set password awal sudah dikirim.');
    }

    public function updateIdentity(AdminUpdateAccountIdentityRequest $request, User $user)
    {
        abort_if(Auth::user()->role !== 'admin', 403, 'Akses ditolak.');

        $data = $request->validated();
        $newEmail = trim((string) ($data['email'] ?? ''));
        $newRfid = trim((string) ($data['rfid_uid'] ?? ''));

        $emailChanged = $newEmail !== '' && $newEmail !== $user->email;
        $rfidChanged = $request->has('rfid_uid') && $newRfid !== '';

        if (!$emailChanged && !$rfidChanged) {
            return back()->with('error', 'Tidak ada perubahan email atau RFID.');
        }

        $updates = [];
        if ($emailChanged) {
            $updates['email'] = $newEmail;
            $updates['password'] = Hash::make(Str::random(40));
            $updates['is_active'] = false;
            $updates['status'] = 'pending';
            $updates['email_verified_at'] = null;
        }

        if ($rfidChanged) {
            DB::transaction(function () use ($user, $newRfid, &$updates) {
                RfidCard::query()
                    ->where('user_id', $user->id)
                    ->where('is_active', true)
                    ->update(['is_active' => false]);

                $card = RfidCard::where('uid', $newRfid)->first();
                if ($card) {
                    $card->forceFill([
                        'user_id' => $user->id,
                        'is_active' => true,
                    ])->save();
                } else {
                    RfidCard::create([
                        'user_id' => $user->id,
                        'uid' => $newRfid,
                        'is_active' => true,
                    ]);
                }

                $updates['rfid_uid'] = $newRfid;
            });
        }

        $user->forceFill($updates)->save();

        if ($emailChanged) {
            if (!$this->sendActivationLink($user)) {
                return back()->with('error', 'Data diupdate, tapi email set password awal gagal dikirim.');
            }

            return back()->with('success', 'Email/RFID diupdate. Link set password awal telah dikirim.');
        }

        return back()->with('success', 'RFID berhasil diperbarui.');
    }

    public function destroy(User $user)
    {
        abort_if(Auth::user()->role !== 'admin', 403, 'Akses ditolak.');

        if ($user->id === Auth::id()) {
            return back()->with('error', 'Tidak bisa menghapus akun yang sedang login.');
        }

        if ($user->role === 'admin') {
            $adminCount = User::query()
                ->where('role', 'admin')
                ->whereNull('deleted_at')
                ->count();

            if ($adminCount <= 1) {
                return back()->with('error', 'Tidak bisa menghapus admin terakhir.');
            }
        }

        DB::transaction(function () use ($user) {
            RfidCard::query()
                ->where('user_id', $user->id)
                ->where('is_active', true)
                ->update(['is_active' => false]);

            $user->forceFill([
                'is_active' => false,
                'status' => 'inactive',
            ])->save();
            $user->delete();
        });

        return back()->with('success', 'User berhasil dihapus.');
    }

    private function sendActivationLink(User $user): bool
    {
        try {
            $token = Password::broker()->createToken($user);
            $user->notify(new AccountActivationSetPassword($token));

            return true;
        } catch (\Throwable $th) {
            report($th);
            return false;
        }
    }
}
