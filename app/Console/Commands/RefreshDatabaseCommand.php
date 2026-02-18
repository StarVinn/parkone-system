<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class RefreshDatabaseCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'db:reset';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Reset the database and run migrations with seeding';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Memulai proses reset database...');

        // Jalankan perintah migrate:fresh dengan opsi --seed
        $this->call('migrate:fresh', [ '--seed' => true,]);
        $this->call('cache:clear');

        $this->info('Database berhasil direset dan diisi dengan data awal!');
    }
}
