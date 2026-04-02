<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Services\CustomizationService;
use Illuminate\Http\Request;

class LocaleController extends Controller
{
    public function update(Request $request)
    {
        $locale = strtolower((string) $request->input('locale', 'id'));
        if (! in_array($locale, CustomizationService::LOCALES, true)) {
            $locale = 'id';
        }

        return back()->withCookie(cookie('app_locale', $locale, 60 * 24 * 365));
    }
}

