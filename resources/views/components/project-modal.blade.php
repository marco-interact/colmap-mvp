{{-- Project Modal Component --}}
<div id="create-project-modal" class="modal-overlay" style="display: none;">
    <div class="modal project-modal">
        <div class="modal-header">
            <h2 class="modal-title">Nuevo Proyecto</h2>
            <button type="button" class="modal-close" onclick="closeModal('create-project-modal')">
                <i data-lucide="x"></i>
            </button>
        </div>
        
        <form id="create-project-form" class="modal-body">
            @csrf
            
            <div class="form-group">
                <label for="project-name" class="form-label">
                    Nombre
                    <span class="mandatory-indicator">Mandatory</span>
                </label>
                <input 
                    type="text" 
                    id="project-name" 
                    name="name" 
                    class="form-control"
                    placeholder="Nombre del Proyecto" 
                    required
                >
            </div>

            <div class="form-group">
                <label for="project-description" class="form-label">
                    Descripción
                    <span class="mandatory-indicator">Mandatory</span>
                </label>
                <textarea 
                    id="project-description" 
                    name="description" 
                    class="form-control"
                    placeholder="Descripción del Proyecto" 
                    required
                ></textarea>
            </div>

            <div class="form-group">
                <label for="project-location" class="form-label">
                    Ubicación
                    <span class="mandatory-indicator">Mandatory</span>
                </label>
                <input 
                    type="text" 
                    id="project-location" 
                    name="location" 
                    class="form-control"
                    placeholder="Buscar Ubicación" 
                    required
                >
                <div class="field-help">¿No encuentras la ubicación?</div>
            </div>

            <div class="form-group">
                <label for="space-type" class="form-label">
                    Tipo de Espacio
                    <span class="mandatory-indicator">Mandatory</span>
                </label>
                <select id="space-type" name="space_type" class="form-control" required>
                    <option value="">Selecciona el tipo de espacio a escanear</option>
                    <option value="interior">Interior</option>
                    <option value="exterior">Exterior</option>
                    <option value="industrial">Industrial</option>
                    <option value="residential">Residencial</option>
                    <option value="commercial">Comercial</option>
                </select>
            </div>

            <div class="form-group">
                <label for="project-type" class="form-label">
                    Tipo de Proyecto
                    <span class="mandatory-indicator">Mandatory</span>
                </label>
                <select id="project-type" name="project_type" class="form-control" required>
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
            <button type="button" class="btn-secondary" onclick="closeModal('create-project-modal')">
                Cancelar
            </button>
            <button type="button" class="btn-primary btn-full-width" id="submit-project" onclick="submitCreateProject()">
                CREAR PROYECTO
            </button>
        </div>
    </div>
</div>
