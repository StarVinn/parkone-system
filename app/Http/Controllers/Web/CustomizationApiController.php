<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Services\CustomizationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class CustomizationApiController extends Controller
{
    public function updateTranslationsBulk(Request $request, CustomizationService $customizationService)
    {
        abort_if(Auth::user()->role !== 'admin', 403, 'Akses ditolak.');

        $payload = $request->input('translations');
        if (! is_array($payload)) {
            throw ValidationException::withMessages([
                'translations' => ['Format translations harus object JSON.'],
            ]);
        }

        $id = $payload['id'] ?? null;
        $en = $payload['en'] ?? null;

        if (! is_array($id) || ! is_array($en)) {
            throw ValidationException::withMessages([
                'translations' => ['Translations harus berisi object `id` dan `en`.'],
            ]);
        }

        $customizationService->saveTranslations('id', $id);
        $customizationService->saveTranslations('en', $en);

        return back()->with('success', 'Translations berhasil disimpan.');
    }

    public function updateTranslations(string $locale, Request $request, CustomizationService $customizationService)
    {
        abort_if(Auth::user()->role !== 'admin', 403, 'Akses ditolak.');

        $payload = $request->input('translations');
        if (! is_array($payload)) {
            throw ValidationException::withMessages([
                'translations' => ['Format translations harus object JSON.'],
            ]);
        }

        $customizationService->saveTranslations($locale, $payload);

        return back()->with('success', 'Translations berhasil disimpan.');
    }

    public function updateNavbar(Request $request, CustomizationService $customizationService)
    {
        abort_if(Auth::user()->role !== 'admin', 403, 'Akses ditolak.');

        $payload = $request->input('navbar');
        if (! is_array($payload)) {
            throw ValidationException::withMessages([
                'navbar' => ['Format navbar harus object JSON.'],
            ]);
        }

        $customizationService->saveNavbar($payload);

        return back()->with('success', 'Navbar berhasil disimpan.');
    }
}
