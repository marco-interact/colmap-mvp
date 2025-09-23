@extends('layouts.app')

@section('content')
<div class="page-header">
    <h1 class="page-title">Mis Proyectos</h1>
    <div class="header-actions">
        <div class="search-input">
            <input type="text" placeholder="Search Project" id="project-search">
            <i data-lucide="search" class="search-icon"></i>
        </div>
        <button type="button" class="btn-primary" onclick="openCreateProjectModal()">
            <i data-lucide="plus" class="icon"></i>
            NEW PROJECT
        </button>
    </div>
</div>

<div class="projects-grid" id="projects-grid">
    @forelse($projects as $project)
        <div class="project-card" onclick="viewProject({{ $project->id }})">
            <div class="project-thumbnail">
                @if($project->thumbnail)
                    <img src="{{ asset('storage/' . $project->thumbnail) }}" alt="{{ $project->name }}">
                @else
                    <div class="no-image">
                        <i data-lucide="folder" style="width: 48px; height: 48px;"></i>
                    </div>
                @endif
            </div>
            <div class="project-info">
                <div class="project-meta">
                    Actualizado: {{ $project->updated_at->format('d-m-Y') }}
                </div>
                <div class="project-title">{{ $project->name }}</div>
                <div class="project-description">{{ $project->description }}</div>
                @if($project->location)
                    <div class="project-location">
                        <i data-lucide="map-pin" class="icon"></i>
                        {{ $project->location }}
                    </div>
                @endif
            </div>
        </div>
    @empty
        <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
            <i data-lucide="folder-plus" style="width: 64px; height: 64px; color: #6b7280; margin-bottom: 1rem;"></i>
            <h3 style="color: #a3a3a3; margin-bottom: 0.5rem;">No hay proyectos aún</h3>
            <p style="color: #6b7280; margin-bottom: 1.5rem;">Crea tu primer proyecto para comenzar</p>
            <button type="button" class="btn-primary" onclick="openCreateProjectModal()">
                <i data-lucide="plus" class="icon"></i>
                Crear Primer Proyecto
            </button>
        </div>
    @endforelse
</div>

<!-- Create Project Modal -->
<div id="create-project-modal" class="modal-overlay" style="display: none;">
    <div class="modal">
        <div class="modal-header">
            <h2 class="modal-title">Nuevo Proyecto</h2>
            <button type="button" class="modal-close" onclick="closeCreateProjectModal()">
                <i data-lucide="x"></i>
            </button>
        </div>
        <form id="create-project-form" class="modal-body">
            @csrf
            <div class="form-group">
                <label for="project-name">Nombre <span class="required">Mandatory</span></label>
                <input type="text" id="project-name" name="name" placeholder="Nombre del Proyecto" required>
                <div class="field-help">¿Olvidaste tu contraseña?</div>
            </div>

            <div class="form-group">
                <label for="project-description">Descripción <span class="required">Mandatory</span></label>
                <textarea id="project-description" name="description" placeholder="Descripción del Proyecto" required></textarea>
                <div class="field-help">¿Olvidaste tu contraseña?</div>
            </div>

            <div class="form-group">
                <label for="project-location">Ubicación <span class="required">Mandatory</span></label>
                <input type="text" id="project-location" name="location" placeholder="Buscar Ubicación" required>
                <div class="field-help">¿No encuentras la ubicación?</div>
            </div>

            <div class="form-group">
                <label for="space-type">Tipo de Espacio <span class="required">Mandatory</span></label>
                <select id="space-type" name="space_type" required>
                    <option value="">Selecciona el tipo de espacio a escanear</option>
                    <option value="interior">Interior</option>
                    <option value="exterior">Exterior</option>
                    <option value="industrial">Industrial</option>
                    <option value="residential">Residencial</option>
                    <option value="commercial">Comercial</option>
                </select>
            </div>

            <div class="form-group">
                <label for="project-type">Tipo de Proyecto <span class="required">Mandatory</span></label>
                <select id="project-type" name="project_type" required>
                    <option value="">Selecciona el tipo de proyecto</option>
                    <option value="reconstruction">Reconstrucción 3D</option>
                    <option value="measurement">Mediciones</option>
                    <option value="inspection">Inspección</option>
                    <option value="modeling">Modelado</option>
                    <option value="documentation">Documentación</option>
                </select>
            </div>
        </form>
        <div class="modal-footer">
            <button type="button" class="btn-secondary" onclick="closeCreateProjectModal()">
                Cancelar
            </button>
            <button type="button" class="btn-primary" onclick="submitCreateProject()">
                CREAR PROYECTO
            </button>
        </div>
    </div>
</div>
@endsection

@push('scripts')
<script>
function openCreateProjectModal() {
    document.getElementById('create-project-modal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeCreateProjectModal() {
    document.getElementById('create-project-modal').style.display = 'none';
    document.body.style.overflow = 'auto';
    document.getElementById('create-project-form').reset();
}

function submitCreateProject() {
    const form = document.getElementById('create-project-form');
    const formData = new FormData(form);
    
    // Show loading state
    const submitBtn = event.target;
    submitBtn.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';
    submitBtn.disabled = true;
    
    fetch(window.DoMapping.routes.projects.store, {
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
            // Reload page to show new project
            window.location.reload();
        } else {
            // Handle validation errors
            console.error('Error creating project:', data.errors);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    })
    .finally(() => {
        submitBtn.innerHTML = 'CREAR PROYECTO';
        submitBtn.disabled = false;
    });
}

function viewProject(projectId) {
    window.location.href = `/projects/${projectId}`;
}

// Search functionality
document.getElementById('project-search').addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase();
    const projectCards = document.querySelectorAll('.project-card');
    
    projectCards.forEach(card => {
        const title = card.querySelector('.project-title').textContent.toLowerCase();
        const description = card.querySelector('.project-description').textContent.toLowerCase();
        
        if (title.includes(searchTerm) || description.includes(searchTerm)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
});

// Close modal on outside click
document.getElementById('create-project-modal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeCreateProjectModal();
    }
});

// Initialize icons after modal content changes
document.addEventListener('DOMContentLoaded', function() {
    lucide.createIcons();
});
</script>
@endpush
