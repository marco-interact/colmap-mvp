@extends('layouts.app', ['active' => 'viewer'])

@section('content')
<div class="viewer-container">
    <div class="viewer-header">
        <div class="viewer-info">
            <h1 class="viewer-title">{{ $asset->name }}</h1>
            <div class="viewer-meta">
                <span class="asset-type">{{ ucfirst($asset->type) }}</span>
                <span class="asset-format">{{ strtoupper($asset->file_format) }}</span>
                <span class="asset-size">{{ $asset->formatted_file_size }}</span>
            </div>
        </div>
        
        <div class="viewer-controls">
            <button class="btn-secondary" id="reset-view">
                <i data-lucide="refresh-cw"></i>
                Reset View
            </button>
            <button class="btn-secondary" id="toggle-measurements">
                <i data-lucide="ruler"></i>
                Measurements
            </button>
            <button class="btn-primary" id="download-asset">
                <i data-lucide="download"></i>
                Download
            </button>
        </div>
    </div>

    <div class="viewer-main">
        <div class="viewer-canvas-container">
            <canvas id="viewer-canvas"></canvas>
            
            <!-- Loading overlay -->
            <div class="viewer-loading" id="viewer-loading">
                <div class="loading-spinner">
                    <div class="spinner"></div>
                </div>
                <p>Loading 3D model...</p>
            </div>
            
            <!-- Error overlay -->
            <div class="viewer-error" id="viewer-error" style="display: none;">
                <i data-lucide="alert-circle"></i>
                <p>Failed to load 3D model</p>
                <button class="btn-primary" onclick="location.reload()">Retry</button>
            </div>
        </div>

        <div class="viewer-sidebar">
            <div class="viewer-panel">
                <h3>Model Information</h3>
                <div class="model-info">
                    <div class="info-item">
                        <label>Type:</label>
                        <span>{{ ucfirst($asset->type) }}</span>
                    </div>
                    <div class="info-item">
                        <label>Format:</label>
                        <span>{{ strtoupper($asset->file_format) }}</span>
                    </div>
                    <div class="info-item">
                        <label>Size:</label>
                        <span>{{ $asset->formatted_file_size }}</span>
                    </div>
                    @if($asset->metadata)
                        @foreach($asset->metadata as $key => $value)
                            <div class="info-item">
                                <label>{{ ucfirst(str_replace('_', ' ', $key)) }}:</label>
                                <span>{{ is_array($value) ? json_encode($value) : $value }}</span>
                            </div>
                        @endforeach
                    @endif
                </div>
            </div>

            <div class="viewer-panel">
                <h3>View Controls</h3>
                <div class="view-controls">
                    <div class="control-group">
                        <label>Camera Position</label>
                        <div class="camera-controls">
                            <button class="btn-sm" id="camera-front">Front</button>
                            <button class="btn-sm" id="camera-back">Back</button>
                            <button class="btn-sm" id="camera-left">Left</button>
                            <button class="btn-sm" id="camera-right">Right</button>
                            <button class="btn-sm" id="camera-top">Top</button>
                            <button class="btn-sm" id="camera-bottom">Bottom</button>
                        </div>
                    </div>
                    
                    <div class="control-group">
                        <label>Rendering</label>
                        <div class="rendering-controls">
                            <label class="checkbox-label">
                                <input type="checkbox" id="show-wireframe">
                                Wireframe
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" id="show-normals">
                                Normals
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" id="show-bounding-box">
                                Bounding Box
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            <div class="viewer-panel" id="measurements-panel" style="display: none;">
                <h3>Measurements</h3>
                <div class="measurements-info">
                    <div class="measurement-item">
                        <label>Distance:</label>
                        <span id="distance-value">0.00 m</span>
                    </div>
                    <div class="measurement-item">
                        <label>Area:</label>
                        <span id="area-value">0.00 m²</span>
                    </div>
                    <div class="measurement-item">
                        <label>Volume:</label>
                        <span id="volume-value">0.00 m³</span>
                    </div>
                </div>
                <div class="measurement-controls">
                    <button class="btn-secondary btn-sm" id="clear-measurements">
                        Clear All
                    </button>
                    <button class="btn-primary btn-sm" id="export-measurements">
                        Export
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Asset data for JavaScript -->
<script>
window.DoMapping.viewer = {
    asset: {
        id: {{ $asset->id }},
        name: "{{ $asset->name }}",
        type: "{{ $asset->type }}",
        format: "{{ $asset->file_format }}",
        downloadUrl: "{{ route('api.assets.download', $asset) }}",
        metadata: @json($asset->metadata ?? [])
    }
};
</script>
@endsection

@push('styles')
<style>
.viewer-container {
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: #111;
}

.viewer-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 2rem;
    background: #1a1a1a;
    border-bottom: 1px solid #333;
}

.viewer-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: #fff;
    margin: 0;
}

.viewer-meta {
    display: flex;
    gap: 1rem;
    margin-top: 0.5rem;
    font-size: 0.875rem;
    color: #a3a3a3;
}

.viewer-controls {
    display: flex;
    gap: 0.75rem;
}

.viewer-main {
    flex: 1;
    display: flex;
    position: relative;
}

.viewer-canvas-container {
    flex: 1;
    position: relative;
    background: #000;
}

#viewer-canvas {
    width: 100%;
    height: 100%;
    display: block;
}

.viewer-loading,
.viewer-error {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    color: #a3a3a3;
}

.viewer-sidebar {
    width: 300px;
    background: #1a1a1a;
    border-left: 1px solid #333;
    padding: 1.5rem;
    overflow-y: auto;
}

.viewer-panel {
    margin-bottom: 2rem;
}

.viewer-panel h3 {
    font-size: 1rem;
    font-weight: 600;
    color: #fff;
    margin: 0 0 1rem 0;
}

.model-info,
.view-controls {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.info-item,
.measurement-item {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem 0;
    border-bottom: 1px solid #333;
}

.info-item label,
.measurement-item label {
    font-weight: 500;
    color: #a3a3a3;
}

.control-group {
    margin-bottom: 1.5rem;
}

.control-group label {
    display: block;
    font-weight: 500;
    color: #fff;
    margin-bottom: 0.5rem;
}

.camera-controls {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
}

.rendering-controls {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: #a3a3a3;
    cursor: pointer;
}

.measurements-info {
    margin-bottom: 1rem;
}

.measurement-controls {
    display: flex;
    gap: 0.5rem;
}

@media (max-width: 768px) {
    .viewer-main {
        flex-direction: column;
    }
    
    .viewer-sidebar {
        width: 100%;
        height: 300px;
    }
    
    .viewer-header {
        flex-direction: column;
        gap: 1rem;
        align-items: flex-start;
    }
}
</style>
@endpush

@push('scripts')
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/PLYLoader.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/OBJLoader.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
<script src="{{ asset('js/viewer.js') }}"></script>
@endpush
