/**
 * DoMapping Platform - Main JavaScript Application
 * 
 * Frontend Architecture: Laravel Blade + Vanilla JS + Vite
 * Features: Interactive UI, AJAX functionality, 3D viewer integration
 */

// Global DoMapping namespace
window.DoMapping = {
    // Configuration
    config: {
        apiBase: '/api',
        csrfToken: document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
        routes: {
            projects: {
                index: '/projects',
                store: '/projects',
                show: (id) => `/projects/${id}`,
                update: (id) => `/projects/${id}`,
                destroy: (id) => `/projects/${id}`
            },
            scans: {
                store: '/scans',
                show: (id) => `/scans/${id}`,
                uploadVideo: (id) => `/scans/${id}/upload-video`,
                extractFrames: (id) => `/scans/${id}/extract-frames`,
                startProcessing: (id) => `/scans/${id}/start-processing`
            },
            colmap: {
                healthCheck: '/api/colmap/health-check',
                uploadVideo: '/api/colmap/upload-video',
                extractFrames: '/api/colmap/extract-frames',
                startReconstruction: '/api/colmap/start-reconstruction',
                jobStatus: (jobId) => `/api/colmap/job-status/${jobId}`,
                downloadFile: (jobId, filename) => `/api/colmap/download-file/${jobId}/${filename}`
            }
        }
    },

    // Utility functions
    utils: {
        /**
         * Format file size in human readable format
         */
        formatFileSize(bytes) {
            if (!bytes) return 'N/A';
            const units = ['B', 'KB', 'MB', 'GB'];
            let size = bytes;
            let unitIndex = 0;
            
            while (size > 1024 && unitIndex < units.length - 1) {
                size /= 1024;
                unitIndex++;
            }
            
            return `${Math.round(size * 100) / 100} ${units[unitIndex]}`;
        },

        /**
         * Debounce function for search inputs
         */
        debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },

        /**
         * Show loading state on buttons
         */
        showLoading(button, loadingText = '') {
            const originalText = button.innerHTML;
            button.dataset.originalText = originalText;
            button.innerHTML = loadingText || '<div class="loading-spinner"><div class="spinner"></div></div>';
            button.disabled = true;
            return originalText;
        },

        /**
         * Hide loading state on buttons
         */
        hideLoading(button) {
            const originalText = button.dataset.originalText || button.innerHTML;
            button.innerHTML = originalText;
            button.disabled = false;
            delete button.dataset.originalText;
        },

        /**
         * Show toast notifications
         */
        showToast(message, type = 'info') {
            const toast = document.createElement('div');
            toast.className = `toast toast-${type}`;
            toast.innerHTML = `
                <div class="toast-content">
                    <i data-lucide="${this.getToastIcon(type)}"></i>
                    <span>${message}</span>
                </div>
                <button type="button" class="toast-close" onclick="this.parentElement.remove()">
                    <i data-lucide="x"></i>
                </button>
            `;
            
            document.body.appendChild(toast);
            lucide.createIcons();
            
            // Auto remove after 5 seconds
            setTimeout(() => {
                if (toast.parentElement) {
                    toast.remove();
                }
            }, 5000);
            
            return toast;
        },

        /**
         * Get icon for toast type
         */
        getToastIcon(type) {
            const icons = {
                success: 'check-circle',
                error: 'alert-circle',
                warning: 'alert-triangle',
                info: 'info'
            };
            return icons[type] || icons.info;
        }
    },

    // API helper functions
    api: {
        /**
         * Generic fetch wrapper with error handling
         */
        async request(url, options = {}) {
            const defaultOptions = {
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': window.DoMapping.config.csrfToken,
                    'Accept': 'application/json',
                    ...options.headers
                }
            };

            try {
                const response = await fetch(url, { ...defaultOptions, ...options });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    return await response.json();
                }
                
                return await response.text();
            } catch (error) {
                console.error('API Request failed:', error);
                window.DoMapping.utils.showToast('Error en la comunicación con el servidor', 'error');
                throw error;
            }
        },

        /**
         * Upload file with progress tracking
         */
        async uploadFile(url, formData, onProgress = null) {
            return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                
                // Track upload progress
                if (onProgress) {
                    xhr.upload.addEventListener('progress', (event) => {
                        if (event.lengthComputable) {
                            const percentComplete = (event.loaded / event.total) * 100;
                            onProgress(Math.round(percentComplete));
                        }
                    });
                }
                
                xhr.addEventListener('load', () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            const response = JSON.parse(xhr.responseText);
                            resolve(response);
                        } catch (e) {
                            resolve(xhr.responseText);
                        }
                    } else {
                        reject(new Error(`Upload failed with status: ${xhr.status}`));
                    }
                });
                
                xhr.addEventListener('error', () => {
                    reject(new Error('Upload failed'));
                });
                
                xhr.open('POST', url);
                xhr.setRequestHeader('X-CSRF-TOKEN', window.DoMapping.config.csrfToken);
                xhr.send(formData);
            });
        }
    },

    // Project management functions
    projects: {
        /**
         * Create new project
         */
        async create(formData) {
            try {
                const response = await window.DoMapping.api.request('/projects', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });
                
                if (response.success) {
                    window.DoMapping.utils.showToast('Proyecto creado exitosamente', 'success');
                    return response;
                } else {
                    throw new Error(response.message || 'Error creating project');
                }
            } catch (error) {
                window.DoMapping.utils.showToast('Error al crear el proyecto', 'error');
                throw error;
            }
        },

        /**
         * Search projects
         */
        search(term) {
            const projectCards = document.querySelectorAll('.project-card');
            const searchTerm = term.toLowerCase();
            
            projectCards.forEach(card => {
                const title = card.querySelector('.project-title, .project-name')?.textContent?.toLowerCase() || '';
                const description = card.querySelector('.project-description')?.textContent?.toLowerCase() || '';
                const location = card.querySelector('.project-location')?.textContent?.toLowerCase() || '';
                
                const matches = title.includes(searchTerm) || 
                               description.includes(searchTerm) || 
                               location.includes(searchTerm);
                
                card.style.display = matches ? 'block' : 'none';
            });
        }
    },

    // 3D Viewer integration
    viewer: {
        /**
         * Initialize Three.js viewer
         */
        init(containerId, options = {}) {
            // TODO: Implement Three.js viewer
            console.log('Initializing 3D viewer in:', containerId, options);
        },

        /**
         * Load 3D model
         */
        loadModel(modelUrl, format = 'ply') {
            // TODO: Implement model loading
            console.log('Loading 3D model:', modelUrl, format);
        },

        /**
         * Add measurement tools
         */
        enableMeasurements() {
            // TODO: Implement measurement tools
            console.log('Enabling measurement tools');
        }
    },

    // Initialize application
    init() {
        console.log('🚀 DoMapping Platform initialized');
        
        // Initialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
        // Setup global error handling
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
        });
        
        // Setup CSRF token for all AJAX requests
        if (window.DoMapping.config.csrfToken) {
            // jQuery CSRF setup (if jQuery is present)
            if (typeof $ !== 'undefined') {
                $.ajaxSetup({
                    headers: {
                        'X-CSRF-TOKEN': window.DoMapping.config.csrfToken
                    }
                });
            }
        }
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.DoMapping.init();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.DoMapping;
}