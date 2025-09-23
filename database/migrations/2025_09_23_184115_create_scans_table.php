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
        Schema::create('scans', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->unsignedBigInteger('project_id');
            $table->string('video_filename')->nullable();
            $table->string('video_path')->nullable();
            $table->bigInteger('video_size')->nullable();
            $table->integer('frames_extracted')->default(0);
            $table->string('status')->default('uploaded'); // uploaded, extracting, extracted, processing, completed, failed
            $table->json('processing_results')->nullable();
            $table->string('model_path')->nullable();
            $table->string('thumbnail')->nullable();
            $table->timestamps();
            
            $table->foreign('project_id')->references('id')->on('projects')->onDelete('cascade');
            $table->index(['project_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('scans');
    }
};
