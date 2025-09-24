<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create default user directly
        User::create([
            'name' => 'Carlos Martinez',
            'email' => 'carlos@domapping.com',
            'password' => \Illuminate\Support\Facades\Hash::make('password'),
            'email_verified_at' => now(),
        ]);

        // Seed projects
        $this->call([
            ProjectSeeder::class,
        ]);
    }
}
