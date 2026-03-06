<?php

namespace App\Observers;

use App\Models\User;
use App\Notifications\WelcomeToParkone;

class UserObserver
{
    /**
     * Handle the User "created" event.
     */
    public function created(User $user): void
    {
        // Avoid sending welcome emails during seeding/CLI maintenance commands.
        if (app()->runningInConsole()) {
            return;
        }

        $user->notify(new WelcomeToParkone());
    }
}
