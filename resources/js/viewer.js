/**
 * DoMapping 3D Viewer
 * 
 * Three.js-based 3D model viewer with measurement tools
 * Supports PLY, OBJ, GLTF formats
 */

class DoMappingViewer {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.model = null;
        this.measurements = {
            enabled: false,
            points: [],
            lines: [],
            distance: 0,
            area: 0,
            volume: 0
        };
        
        this.init();
    }

    init() {
        this.setupScene();
        this.setupCamera();
        this.setupRenderer();
        this.setupControls();
        this.setupLighting();
        this.setupEventListeners();
        this.loadModel();
        this.animate();
    }

    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x111111);
    }

    setupCamera() {
        const container = document.getElementById('viewer-canvas');
        const width = container.clientWidth;
        const height = container.clientHeight;

        this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        this.camera.position.set(5, 5, 5);
    }

    setupRenderer() {
        const container = document.getElementById('viewer-canvas');
        
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true 
        });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        container.appendChild(this.renderer.domElement);
    }

    setupControls() {
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.enableZoom = true;
        this.controls.enablePan = true;
        this.controls.enableRotate = true;
    }

    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);

        // Directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);

        // Point light
        const pointLight = new THREE.PointLight(0x1EE3AD, 0.5);
        pointLight.position.set(-10, 10, -10);
        this.scene.add(pointLight);
    }

    setupEventListeners() {
        // Window resize
        window.addEventListener('resize', () => this.onWindowResize());
        
        // Control buttons
        document.getElementById('reset-view')?.addEventListener('click', () => this.resetView());
        document.getElementById('toggle-measurements')?.addEventListener('click', () => this.toggleMeasurements());
        document.getElementById('download-asset')?.addEventListener('click', () => this.downloadAsset());
        
        // Camera controls
        document.getElementById('camera-front')?.addEventListener('click', () => this.setCameraPosition('front'));
        document.getElementById('camera-back')?.addEventListener('click', () => this.setCameraPosition('back'));
        document.getElementById('camera-left')?.addEventListener('click', () => this.setCameraPosition('left'));
        document.getElementById('camera-right')?.addEventListener('click', () => this.setCameraPosition('right'));
        document.getElementById('camera-top')?.addEventListener('click', () => this.setCameraPosition('top'));
        document.getElementById('camera-bottom')?.addEventListener('click', () => this.setCameraPosition('bottom'));
        
        // Rendering controls
        document.getElementById('show-wireframe')?.addEventListener('change', (e) => this.toggleWireframe(e.target.checked));
        document.getElementById('show-normals')?.addEventListener('change', (e) => this.toggleNormals(e.target.checked));
        document.getElementById('show-bounding-box')?.addEventListener('change', (e) => this.toggleBoundingBox(e.target.checked));
        
        // Measurement controls
        document.getElementById('clear-measurements')?.addEventListener('click', () => this.clearMeasurements());
        document.getElementById('export-measurements')?.addEventListener('click', () => this.exportMeasurements());
        
        // Canvas click for measurements
        this.renderer.domElement.addEventListener('click', (event) => this.onCanvasClick(event));
    }

    async loadModel() {
        const loadingElement = document.getElementById('viewer-loading');
        const errorElement = document.getElementById('viewer-error');
        
        try {
            loadingElement.style.display = 'block';
            errorElement.style.display = 'none';
            
            const asset = window.DoMapping.viewer.asset;
            const loader = this.getLoader(asset.format);
            
            if (!loader) {
                throw new Error(`Unsupported format: ${asset.format}`);
            }
            
            const model = await this.loadModelWithLoader(loader, asset.downloadUrl);
            this.model = model;
            this.scene.add(model);
            
            // Center and scale model
            this.centerAndScaleModel(model);
            
            // Update measurements panel
            this.updateMeasurementsPanel();
            
            loadingElement.style.display = 'none';
            
        } catch (error) {
            console.error('Failed to load model:', error);
            loadingElement.style.display = 'none';
            errorElement.style.display = 'block';
        }
    }

    getLoader(format) {
        switch (format.toLowerCase()) {
            case 'ply':
                return new THREE.PLYLoader();
            case 'obj':
                return new THREE.OBJLoader();
            case 'gltf':
            case 'glb':
                return new THREE.GLTFLoader();
            default:
                return null;
        }
    }

    loadModelWithLoader(loader, url) {
        return new Promise((resolve, reject) => {
            loader.load(
                url,
                (object) => resolve(object),
                (progress) => console.log('Loading progress:', progress),
                (error) => reject(error)
            );
        });
    }

    centerAndScaleModel(model) {
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        // Center the model
        model.position.sub(center);
        
        // Scale to fit in view
        const maxDimension = Math.max(size.x, size.y, size.z);
        const scale = 5 / maxDimension;
        model.scale.setScalar(scale);
        
        // Update controls target
        this.controls.target.set(0, 0, 0);
        this.controls.update();
    }

    toggleMeasurements() {
        this.measurements.enabled = !this.measurements.enabled;
        const panel = document.getElementById('measurements-panel');
        const button = document.getElementById('toggle-measurements');
        
        if (this.measurements.enabled) {
            panel.style.display = 'block';
            button.classList.add('active');
            this.renderer.domElement.style.cursor = 'crosshair';
        } else {
            panel.style.display = 'none';
            button.classList.remove('active');
            this.renderer.domElement.style.cursor = 'grab';
            this.clearMeasurements();
        }
    }

    onCanvasClick(event) {
        if (!this.measurements.enabled) return;
        
        const mouse = new THREE.Vector2();
        const raycaster = new THREE.Raycaster();
        
        mouse.x = (event.clientX / this.renderer.domElement.clientWidth) * 2 - 1;
        mouse.y = -(event.clientY / this.renderer.domElement.clientHeight) * 2 + 1;
        
        raycaster.setFromCamera(mouse, this.camera);
        
        if (this.model) {
            const intersects = raycaster.intersectObject(this.model, true);
            
            if (intersects.length > 0) {
                const point = intersects[0].point;
                this.addMeasurementPoint(point);
            }
        }
    }

    addMeasurementPoint(point) {
        this.measurements.points.push(point);
        
        // Create visual marker
        const geometry = new THREE.SphereGeometry(0.1, 8, 8);
        const material = new THREE.MeshBasicMaterial({ color: 0x1EE3AD });
        const marker = new THREE.Mesh(geometry, material);
        marker.position.copy(point);
        this.scene.add(marker);
        
        // Create line if we have multiple points
        if (this.measurements.points.length >= 2) {
            this.createMeasurementLine();
        }
        
        this.updateMeasurements();
    }

    createMeasurementLine() {
        const points = this.measurements.points.slice(-2);
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ color: 0x1EE3AD, linewidth: 2 });
        const line = new THREE.Line(geometry, material);
        this.scene.add(line);
        this.measurements.lines.push(line);
    }

    updateMeasurements() {
        if (this.measurements.points.length >= 2) {
            const lastTwoPoints = this.measurements.points.slice(-2);
            const distance = lastTwoPoints[0].distanceTo(lastTwoPoints[1]);
            this.measurements.distance += distance;
            
            // Update UI
            document.getElementById('distance-value').textContent = 
                `${this.measurements.distance.toFixed(2)} m`;
        }
    }

    updateMeasurementsPanel() {
        // This would be called when model loads to show initial measurements
        // For now, just initialize the panel
    }

    clearMeasurements() {
        // Remove visual markers and lines
        this.measurements.lines.forEach(line => this.scene.remove(line));
        this.measurements.points.forEach((point, index) => {
            const marker = this.scene.children.find(child => 
                child.position.equals(point) && child.geometry.type === 'SphereGeometry'
            );
            if (marker) this.scene.remove(marker);
        });
        
        // Reset measurements
        this.measurements.points = [];
        this.measurements.lines = [];
        this.measurements.distance = 0;
        
        // Update UI
        document.getElementById('distance-value').textContent = '0.00 m';
    }

    exportMeasurements() {
        const data = {
            asset: window.DoMapping.viewer.asset.name,
            measurements: {
                distance: this.measurements.distance,
                points: this.measurements.points.length
            },
            timestamp: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `measurements-${window.DoMapping.viewer.asset.name}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    resetView() {
        this.camera.position.set(5, 5, 5);
        this.controls.target.set(0, 0, 0);
        this.controls.update();
    }

    setCameraPosition(position) {
        const positions = {
            front: [0, 0, 5],
            back: [0, 0, -5],
            left: [-5, 0, 0],
            right: [5, 0, 0],
            top: [0, 5, 0],
            bottom: [0, -5, 0]
        };
        
        const pos = positions[position];
        if (pos) {
            this.camera.position.set(...pos);
            this.controls.update();
        }
    }

    toggleWireframe(enabled) {
        if (this.model) {
            this.model.traverse((child) => {
                if (child.isMesh) {
                    child.material.wireframe = enabled;
                }
            });
        }
    }

    toggleNormals(enabled) {
        // Implementation for showing normals
        console.log('Toggle normals:', enabled);
    }

    toggleBoundingBox(enabled) {
        // Implementation for showing bounding box
        console.log('Toggle bounding box:', enabled);
    }

    downloadAsset() {
        window.open(window.DoMapping.viewer.asset.downloadUrl, '_blank');
    }

    onWindowResize() {
        const container = document.getElementById('viewer-canvas');
        const width = container.clientWidth;
        const height = container.clientHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize viewer when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (window.DoMapping && window.DoMapping.viewer) {
        new DoMappingViewer();
    }
});
