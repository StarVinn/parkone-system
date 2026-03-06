<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class WelcomeToParkone extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Get the notification's delivery channels.
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Selamat Datang di PARKONE')
            ->greeting('Halo ' . $notifiable->name . ',')
            ->line('Akun kamu berhasil dibuat dan sudah terdaftar di sistem PARKONE.')
            ->line('Sekarang kamu bisa login untuk mengelola aktivitas parkir dengan lebih cepat dan rapi.')
            ->action('Masuk ke PARKONE', url('/login'))
            ->line('Terima kasih sudah menggunakan PARKONE.');
    }

    /**
     * Get the array representation of the notification.
     */
    public function toArray(object $notifiable): array
    {
        return [];
    }
}
