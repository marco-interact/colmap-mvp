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
        // Create default user
        User::factory()->create([
            'name' => 'Carlos Martinez',
            'email' => 'carlos@domapping.com',
        ]);

        // Seed projects
        $this->call([
            ProjectSeeder::class,
        ]);
    }
}
