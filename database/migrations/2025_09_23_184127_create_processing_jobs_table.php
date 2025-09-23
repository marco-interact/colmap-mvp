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
        Schema::create('processing_jobs', function (Blueprint $table) {
            $table->id();
            $table->string('job_id')->unique(); // UUID from Python service
            $table->unsignedBigInteger('scan_id');
            $table->string('type'); // frame_extraction, reconstruction
            $table->string('status'); // pending, processing, completed, failed, cancelled
            $table->integer('progress')->default(0);
            $table->text('message')->nullable();
            $table->json('request_data')->nullable();
            $table->json('results')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            
            $table->foreign('scan_id')->references('id')->on('scans')->onDelete('cascade');
            $table->index(['job_id', 'status']);
            $table->index(['scan_id', 'type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('processing_jobs');
    }
};
