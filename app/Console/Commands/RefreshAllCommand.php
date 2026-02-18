<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class RefreshAllCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:refresh';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Refresh all data';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Memulai pembersihan aplikasi...');

        // Panggil perintah lain menggunakan $this->call()
        $this->call('cache:clear');
        $this->call('config:clear');
        $this->call('view:clear');
        $this->call('route:clear');

        $this->info('Semua perintah berhasil dijalankan!');
    }
}
