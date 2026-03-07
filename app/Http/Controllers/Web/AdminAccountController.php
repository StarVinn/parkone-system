<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Http\Requests\AdminResetAccountEmailRequest;
use App\Http\Requests\AdminStoreAccountRequest;
use App\Http\Requests\AdminUpdateAccountIdentityRequest;
use App\Models\User;
use App\Notifications\AccountActivationSetPassword;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

class AdminAccountController extends Controller
{
    public function index(Request $request)
    {
        abort_if(Auth::user()->role !== 'admin', 403, 'Akses ditolak.');

        $search = trim((string) $request->query('search', ''));

        $users = User::query()
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($subQuery) use ($search) {
                    $subQuery->where('name', 'like', '%' . $search . '%')
                        ->orWhere('email', 'like', '%' . $search . '%')
                        ->orWhere('role', 'like', '%' . $search . '%')
                        ->orWhere('rfid_uid', 'like', '%' . $search . '%');
                });
            })
            ->orderByDesc('created_at')
            ->paginate(15, ['id', 'name', 'email', 'role', 'rfid_uid', 'is_active', 'created_at'])
            ->withQueryString();

        return inertia('Admin/Account/Index', [
            'users' => $users,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function showCreate()
    {
        abort_if(Auth::user()->role !== 'admin', 403, 'Akses ditolak.');

        return inertia('Admin/Account/Create');
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
            'rfid_uid' => $data['rfid_uid'] ?? null,
            'is_active' => false,
            'email_verified_at' => null,
        ]);

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

    public function resetEmail(AdminResetAccountEmailRequest $request, User $user)
    {
        abort_if(Auth::user()->role !== 'admin', 403, 'Akses ditolak.');

        $user->forceFill([
            'email' => $request->email,
            'password' => Hash::make(Str::random(40)),
            'is_active' => false,
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
        $rfidChanged = $request->has('rfid_uid') && $newRfid !== (string) ($user->rfid_uid ?? '');

        if (!$emailChanged && !$rfidChanged) {
            return back()->with('error', 'Tidak ada perubahan email atau RFID.');
        }

        $updates = [];
        if ($emailChanged) {
            $updates['email'] = $newEmail;
            $updates['password'] = Hash::make(Str::random(40));
            $updates['is_active'] = false;
            $updates['email_verified_at'] = null;
        }

        if ($rfidChanged) {
            $updates['rfid_uid'] = $newRfid !== '' ? $newRfid : null;
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
