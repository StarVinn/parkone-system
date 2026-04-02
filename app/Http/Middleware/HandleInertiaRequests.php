<?php

namespace App\Http\Middleware;

use App\Services\CustomizationService;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $Request): ?string
    {
        return parent::version($Request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request)
    {
        $locale = (string) ($request->cookie('app_locale') ?? 'id');
        if (! in_array($locale, CustomizationService::LOCALES, true)) {
            $locale = 'id';
        }

        $customizationService = app(CustomizationService::class);
        $strings = $customizationService->getTranslations($locale);
        $navbar = $customizationService->getNavbar();

        return array_merge(parent::share($request), [
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error'   => fn () => $request->session()->get('error'),
                'visitor_vehicle' => fn () => $request->session()->get('visitor_vehicle'),
            ],
            'auth' => [
                'user' => $request->user(), // Ini yang bikin {auth.user.name} bisa jalan
            ],
            'i18n' => [
                'locale' => $locale,
                'strings' => $strings,
            ],
            'nav' => $navbar,
        ]);
    }
}
