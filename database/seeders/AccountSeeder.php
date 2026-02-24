<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class AccountSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create default accounts for admin, officer, and owner
        $users = [
        [
            'name' => 'Admin',
            'email' => 'admin@gmail.com',
            'password' => bcrypt('admin123'),
            'role' => 'admin',
            'is_active' => true,
        ],
        [
            'name' => 'Officer',
            'email' => 'officer@gmail.com',
            'password' => bcrypt('officer123'),
            'role' => 'officer',
            'is_active' => true,
        ],
        [
            'name' => 'Owner',
            'email' => 'owner@gmail.com',
            'password' => bcrypt('owner123'),
            'role' => 'owner',
            'is_active' => true,
        ],
        ];

        foreach ($users as $user) {
            User::updateOrCreate(
                ['email' => $user['email']],
                $user
            );
        }
    }
}
