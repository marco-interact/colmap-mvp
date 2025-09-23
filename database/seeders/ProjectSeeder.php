<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Project;
use App\Models\User;

class ProjectSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $user = User::first();
        
        if (!$user) {
            // Create a default user if none exists
            $user = User::create([
                'name' => 'Carlos Martinez',
                'email' => 'carlos@domapping.com',
                'email_verified_at' => now(),
                'password' => bcrypt('password'),
            ]);
        }

        // Create sample projects matching the screenshots
        Project::create([
            'name' => 'ITECSA Nave Industrial',
            'description' => 'Render de sitio de obra para Desarrollo Industrial',
            'location' => 'Playa del Carmen',
            'user_id' => $user->id,
            'status' => 'completed',
            'settings' => json_encode([
                'space_type' => 'industrial',
                'project_type' => 'reconstruction'
            ]),
            'thumbnail' => 'samples/itecsa-industrial.jpg', // Will show 3D model preview
            'total_scans' => 1,
            'last_processed_at' => now()->subDays(2),
            'created_at' => now()->subDays(7),
            'updated_at' => now()->subDays(2),
        ]);

        Project::create([
            'name' => 'Casa Residencial Moderna',
            'description' => 'Escaneo 3D completo para documentación arquitectónica',
            'location' => 'Cancún, Quintana Roo',
            'user_id' => $user->id,
            'status' => 'processing',
            'settings' => json_encode([
                'space_type' => 'residential',
                'project_type' => 'documentation'
            ]),
            'total_scans' => 3,
            'last_processed_at' => now()->subHours(6),
            'created_at' => now()->subDays(3),
            'updated_at' => now()->subHours(6),
        ]);

        Project::create([
            'name' => 'Centro Comercial Plaza Norte',
            'description' => 'Levantamiento 3D para remodelación comercial',
            'location' => 'Mérida, Yucatán',
            'user_id' => $user->id,
            'status' => 'pending',
            'settings' => json_encode([
                'space_type' => 'commercial',
                'project_type' => 'modeling'
            ]),
            'total_scans' => 0,
            'last_processed_at' => null,
            'created_at' => now()->subDays(1),
            'updated_at' => now()->subDays(1),
        ]);
    }
}
