<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Lang;

class CustomResetPassword extends Notification
{
    use Queueable;

    // Tambahkan properti token
    public $token;

    /**
     * Terima token saat notifikasi dibuat
     */
    public function __construct($token)
    {
        $this->token = $token;
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Buat tampilan email
     */
    public function toMail(object $notifiable): MailMessage
    {
        // Buat URL yang mengarah ke route reset-password kamu
        // Kita juga tambahkan email sebagai query string agar otomatis terisi di form
        $url = url('/reset-password/' . $this->token . '?email=' . urlencode($notifiable->email));

        return (new MailMessage)
            ->subject(Lang::get('Reset Password PARKONE')) // Subject email
            ->line(Lang::get('Kami menerima permintaan reset password untuk akun PARKONE kamu.'))
            ->action(Lang::get('Reset Password'), $url) // Tombol action ke URL tadi
            ->line(Lang::get('Link ini akan kedaluwarsa dalam :count menit.', ['count' => config('auth.passwords.'.config('auth.defaults.passwords').'.expire')]))
            ->line(Lang::get('Jika kamu tidak merasa melakukan permintaan ini, abaikan email ini.'));
    }

    public function toArray(object $notifiable): array
    {
        return [];
    }
}
