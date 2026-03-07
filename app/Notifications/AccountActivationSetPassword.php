<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Lang;

class AccountActivationSetPassword extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public string $token
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $url = config('app.url') . '/set-password/' . $this->token . '?email=' . urlencode($notifiable->email);

        return (new MailMessage)
            ->subject(Lang::get('Aktivasi Akun PARKONE - Atur Password Pertama'))
            ->line(Lang::get('Akun PARKONE kamu sudah dibuat oleh admin.'))
            ->line(Lang::get('Untuk mulai menggunakan akun, silakan buat password pertama melalui link berikut.'))
            ->action(Lang::get('Set Password Pertama'), $url)
            ->line(Lang::get('Link ini akan kedaluwarsa dalam :count menit.', ['count' => config('auth.passwords.' . config('auth.defaults.passwords') . '.expire')]))
            ->line(Lang::get('Jika kamu merasa ini bukan untuk kamu, abaikan email ini.'));
    }

    public function toArray(object $notifiable): array
    {
        return [];
    }
}
