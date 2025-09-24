<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('3d_assets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->onDelete('cascade');
            $table->foreignId('scan_id')->nullable()->constrained()->onDelete('cascade');
            $table->string('name');
            $table->enum('type', ['point_cloud', 'mesh', 'texture', 'model']);
            $table->string('file_path');
            $table->string('file_format'); // .ply, .obj, .fbx, .gltf
            $table->bigInteger('file_size');
            $table->json('metadata')->nullable(); // Scale, dimensions, etc.
            $table->json('processing_params')->nullable(); // COLMAP parameters used
            $table->enum('status', ['processing', 'completed', 'failed'])->default('processing');
            $table->text('error_message')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();
            
            $table->index(['project_id', 'type']);
            $table->index(['scan_id', 'type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('3d_assets');
    }
};
