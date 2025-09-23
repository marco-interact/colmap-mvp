@extends('layouts.app')

@section('content')
<div class="page-header">
    <h1 class="page-title">{{ $project->name }}</h1>
    <div class="header-actions">
        <button type="button" class="btn-secondary" onclick="history.back()">
            <i data-lucide="arrow-left" class="icon"></i>
            Volver
        </button>
        <button type="button" class="btn-primary" onclick="openCreateScanModal()">
            <i data-lucide="plus" class="icon"></i>
            NUEVO SCAN
        </button>
    </div>
</div>

<div class="project-details" style="margin-bottom: 2rem;">
    <div style="background: #2d2d2d; padding: 1.5rem; border-radius: 0.75rem; margin-bottom: 2rem;">
        <h3 style="margin-bottom: 1rem;">Detalles del Proyecto</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
            <div>
                <div style="color: #6b7280; font-size: 0.875rem; margin-bottom: 0.25rem;">Estado</div>
                <div style="color: #4ade80; font-weight: 500;">{{ ucfirst($project->status) }}</div>
            </div>
            <div>
                <div style="color: #6b7280; font-size: 0.875rem; margin-bottom: 0.25rem;">Total Scans</div>
                <div style="color: #ffffff; font-weight: 500;">{{ $project->total_scans }}</div>
            </div>
            <div>
                <div style="color: #6b7280; font-size: 0.875rem; margin-bottom: 0.25rem;">Creado</div>
                <div style="color: #ffffff; font-weight: 500;">{{ $project->created_at->format('d/m/Y') }}</div>
            </div>
            @if($project->settings['location'] ?? null)
            <div>
                <div style="color: #6b7280; font-size: 0.875rem; margin-bottom: 0.25rem;">Ubicación</div>
                <div style="color: #ffffff; font-weight: 500;">{{ $project->settings['location'] }}</div>
            </div>
            @endif
        </div>
        <div style="margin-top: 1rem;">
            <div style="color: #6b7280; font-size: 0.875rem; margin-bottom: 0.25rem;">Descripción</div>
            <div style="color: #a3a3a3; line-height: 1.5;">{{ $project->description }}</div>
        </div>
    </div>
</div>

<div class="scans-section">
    <h2 style="margin-bottom: 1.5rem;">Scans ({{ $scans->count() }})</h2>
    
    @if($scans->count() > 0)
        <div class="projects-grid">
            @foreach($scans as $scan)
                <div class="project-card" onclick="viewScan({{ $scan->id }})">
                    <div class="project-thumbnail">
                        @if($scan->thumbnail)
                            <img src="{{ asset('storage/' . $scan->thumbnail) }}" alt="{{ $scan->name }}">
                        @else
                            <div class="no-image">
                                <i data-lucide="video" style="width: 48px; height: 48px;"></i>
                            </div>
                        @endif
                    </div>
                    <div class="project-info">
                        <div class="project-meta">
                            Estado: {{ ucfirst($scan->status) }}
                        </div>
                        <div class="project-title">{{ $scan->name }}</div>
                        <div class="project-description">{{ $scan->description ?: 'Sin descripción' }}</div>
                        @if($scan->frames_extracted > 0)
                            <div class="project-location">
                                <i data-lucide="image" class="icon"></i>
                                {{ $scan->frames_extracted }} frames extraídos
                            </div>
                        @endif
                    </div>
                </div>
            @endforeach
        </div>
    @else
        <div class="empty-state" style="text-align: center; padding: 3rem;">
            <i data-lucide="video" style="width: 64px; height: 64px; color: #6b7280; margin-bottom: 1rem;"></i>
            <h3 style="color: #a3a3a3; margin-bottom: 0.5rem;">No hay scans aún</h3>
            <p style="color: #6b7280; margin-bottom: 1.5rem;">Crea tu primer scan para comenzar la reconstrucción 3D</p>
            <button type="button" class="btn-primary" onclick="openCreateScanModal()">
                <i data-lucide="plus" class="icon"></i>
                Crear Primer Scan
            </button>
        </div>
    @endif
</div>

<!-- Create Scan Modal -->
<div id="create-scan-modal" class="modal-overlay" style="display: none;">
    <div class="modal">
        <div class="modal-header">
            <h2 class="modal-title">Nuevo Scan</h2>
            <button type="button" class="modal-close" onclick="closeCreateScanModal()">
                <i data-lucide="x"></i>
            </button>
        </div>
        <form id="create-scan-form" class="modal-body">
            @csrf
            <div class="form-group">
                <label for="scan-name">Nombre del Scan <span class="required">*</span></label>
                <input type="text" id="scan-name" name="name" placeholder="Nombre del scan" required>
            </div>

            <div class="form-group">
                <label for="scan-description">Descripción</label>
                <textarea id="scan-description" name="description" placeholder="Descripción del scan"></textarea>
            </div>

            <div class="form-group">
                <label for="video-file">Video File <span class="required">*</span></label>
                <input type="file" id="video-file" name="video" accept=".mp4,.avi,.mov,.mkv" required>
                <div class="field-help">Formatos soportados: MP4, AVI, MOV, MKV (máximo 1GB)</div>
            </div>
        </form>
        <div class="modal-footer">
            <button type="button" class="btn-secondary" onclick="closeCreateScanModal()">
                Cancelar
            </button>
            <button type="button" class="btn-primary" onclick="submitCreateScan()">
                CREAR SCAN
            </button>
        </div>
    </div>
</div>
@endsection

@push('scripts')
<script>
function openCreateScanModal() {
    document.getElementById('create-scan-modal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeCreateScanModal() {
    document.getElementById('create-scan-modal').style.display = 'none';
    document.body.style.overflow = 'auto';
    document.getElementById('create-scan-form').reset();
}

function submitCreateScan() {
    const form = document.getElementById('create-scan-form');
    const formData = new FormData(form);
    formData.append('project_id', {{ $project->id }});
    
    // Show loading state
    const submitBtn = event.target;
    submitBtn.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';
    submitBtn.disabled = true;
    
    fetch('/scans', {
        method: 'POST',
        headers: {
            'X-CSRF-TOKEN': window.DoMapping.csrfToken,
            'Accept': 'application/json',
        },
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            window.location.reload();
        } else {
            console.error('Error creating scan:', data.errors);
            alert('Error creando el scan. Por favor intenta de nuevo.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error creando el scan. Por favor intenta de nuevo.');
    })
    .finally(() => {
        submitBtn.innerHTML = 'CREAR SCAN';
        submitBtn.disabled = false;
    });
}

function viewScan(scanId) {
    window.location.href = `/scans/${scanId}`;
}

// Close modal on outside click
document.getElementById('create-scan-modal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeCreateScanModal();
    }
});
</script>
@endpush
