<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Services\CustomizationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AdminCustomizationController extends Controller
{
    public function index(Request $request, CustomizationService $customizationService)
    {
        abort_if(Auth::user()->role !== 'admin', 403, 'Akses ditolak.');

        $navbar = $customizationService->getNavbar();
        $translationsId = $customizationService->getTranslations('id');
        $translationsEn = $customizationService->getTranslations('en');

        return Inertia::render('Admin/Customization', [
            'navbar' => $navbar,
            'translations' => [
                'id' => $translationsId,
                'en' => $translationsEn,
            ],
        ]);
    }
}
