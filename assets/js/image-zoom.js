/**
 * Image Zoom/Lightbox Functionality
 * Allows users to view book images in a lightbox with zoom in/out capabilities
 */

class ImageZoom {
    constructor() {
        this.currentZoom = 1;
        this.minZoom = 1;
        this.maxZoom = 3;
        this.zoomStep = 0.25;
        this.isDragging = false;
        this.startX = 0;
        this.startY = 0;
        this.translateX = 0;
        this.translateY = 0;
        
        this.init();
    }

    init() {
        // Create lightbox element
        this.createLightbox();
        
        // Add click listener to main image
        const mainImage = document.getElementById('mainBookImage');
        if (mainImage) {
            mainImage.parentElement.addEventListener('click', () => {
                this.openLightbox(mainImage.src, mainImage.alt);
            });
        }
    }

    createLightbox() {
        // Create lightbox HTML structure
        const lightbox = document.createElement('div');
        lightbox.className = 'image-lightbox';
        lightbox.id = 'imageLightbox';
        lightbox.innerHTML = `
            <span class="lightbox-close" id="lightboxClose">&times;</span>
            <div class="pan-indicator" id="panIndicator">
                <i class="fas fa-hand-paper"></i> Click and drag to pan
            </div>
            <div class="lightbox-content">
                <img class="lightbox-image" id="lightboxImage" src="" alt="">
            </div>
            <div class="zoom-controls">
                <button class="zoom-btn" id="zoomOut" title="Zoom Out">
                    <i class="fas fa-search-minus"></i>
                </button>
                <div class="zoom-level" id="zoomLevel">100%</div>
                <button class="zoom-btn" id="zoomIn" title="Zoom In">
                    <i class="fas fa-search-plus"></i>
                </button>
                <button class="zoom-btn" id="zoomReset" title="Reset Zoom">
                    <i class="fas fa-undo"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(lightbox);
        
        // Add event listeners
        this.addEventListeners();
    }

    addEventListeners() {
        const lightbox = document.getElementById('imageLightbox');
        const closeBtn = document.getElementById('lightboxClose');
        const zoomInBtn = document.getElementById('zoomIn');
        const zoomOutBtn = document.getElementById('zoomOut');
        const zoomResetBtn = document.getElementById('zoomReset');
        const lightboxImage = document.getElementById('lightboxImage');

        // Close lightbox
        closeBtn.addEventListener('click', () => this.closeLightbox());
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                this.closeLightbox();
            }
        });

        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (lightbox.classList.contains('active')) {
                if (e.key === 'Escape') {
                    this.closeLightbox();
                } else if (e.key === '+' || e.key === '=') {
                    this.zoomIn();
                } else if (e.key === '-') {
                    this.zoomOut();
                } else if (e.key === '0') {
                    this.resetZoom();
                }
            }
        });

        // Zoom controls
        zoomInBtn.addEventListener('click', () => this.zoomIn());
        zoomOutBtn.addEventListener('click', () => this.zoomOut());
        zoomResetBtn.addEventListener('click', () => this.resetZoom());

        // Mouse wheel zoom
        lightboxImage.addEventListener('wheel', (e) => {
            e.preventDefault();
            if (e.deltaY < 0) {
                this.zoomIn();
            } else {
                this.zoomOut();
            }
        });

        // Click to zoom toggle
        lightboxImage.addEventListener('click', (e) => {
            if (this.currentZoom === 1) {
                this.zoomIn();
            } else if (!this.isDragging) {
                this.resetZoom();
            }
        });

        // Pan functionality (when zoomed)
        lightboxImage.addEventListener('mousedown', (e) => {
            if (this.currentZoom > 1) {
                this.isDragging = true;
                this.startX = e.clientX - this.translateX;
                this.startY = e.clientY - this.translateY;
                lightboxImage.style.cursor = 'grabbing';
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                e.preventDefault();
                this.translateX = e.clientX - this.startX;
                this.translateY = e.clientY - this.startY;
                this.updateImageTransform();
            }
        });

        document.addEventListener('mouseup', () => {
            if (this.isDragging) {
                this.isDragging = false;
                const lightboxImage = document.getElementById('lightboxImage');
                if (lightboxImage) {
                    lightboxImage.style.cursor = this.currentZoom > 1 ? 'grab' : 'zoom-in';
                }
            }
        });

        // Touch support for mobile
        lightboxImage.addEventListener('touchstart', (e) => {
            if (this.currentZoom > 1 && e.touches.length === 1) {
                this.isDragging = true;
                this.startX = e.touches[0].clientX - this.translateX;
                this.startY = e.touches[0].clientY - this.translateY;
            }
        });

        lightboxImage.addEventListener('touchmove', (e) => {
            if (this.isDragging && e.touches.length === 1) {
                e.preventDefault();
                this.translateX = e.touches[0].clientX - this.startX;
                this.translateY = e.touches[0].clientY - this.startY;
                this.updateImageTransform();
            }
        });

        lightboxImage.addEventListener('touchend', () => {
            this.isDragging = false;
        });
    }

    openLightbox(imageSrc, imageAlt) {
        const lightbox = document.getElementById('imageLightbox');
        const lightboxImage = document.getElementById('lightboxImage');
        
        lightboxImage.src = imageSrc;
        lightboxImage.alt = imageAlt;
        lightbox.classList.add('active');
        
        // Disable body scroll
        document.body.style.overflow = 'hidden';
        
        // Reset zoom
        this.resetZoom();
    }

    closeLightbox() {
        const lightbox = document.getElementById('imageLightbox');
        lightbox.classList.remove('active');
        
        // Re-enable body scroll
        document.body.style.overflow = '';
        
        // Reset zoom
        this.resetZoom();
    }

    zoomIn() {
        if (this.currentZoom < this.maxZoom) {
            this.currentZoom += this.zoomStep;
            this.updateZoom();
        }
    }

    zoomOut() {
        if (this.currentZoom > this.minZoom) {
            this.currentZoom -= this.zoomStep;
            // Reset translation if zooming out to 1x
            if (this.currentZoom === 1) {
                this.translateX = 0;
                this.translateY = 0;
            }
            this.updateZoom();
        }
    }

    resetZoom() {
        this.currentZoom = 1;
        this.translateX = 0;
        this.translateY = 0;
        this.updateZoom();
    }

    updateZoom() {
        const lightboxImage = document.getElementById('lightboxImage');
        const zoomLevel = document.getElementById('zoomLevel');
        const panIndicator = document.getElementById('panIndicator');
        
        // Update zoom level display
        zoomLevel.textContent = Math.round(this.currentZoom * 100) + '%';
        
        // Update image transform
        this.updateImageTransform();
        
        // Update cursor
        if (this.currentZoom > 1) {
            lightboxImage.classList.add('zoomed');
            lightboxImage.style.cursor = 'grab';
            panIndicator.classList.add('active');
            setTimeout(() => {
                panIndicator.classList.remove('active');
            }, 2000);
        } else {
            lightboxImage.classList.remove('zoomed');
            lightboxImage.style.cursor = 'zoom-in';
            panIndicator.classList.remove('active');
        }
    }

    updateImageTransform() {
        const lightboxImage = document.getElementById('lightboxImage');
        lightboxImage.style.transform = `scale(${this.currentZoom}) translate(${this.translateX / this.currentZoom}px, ${this.translateY / this.currentZoom}px)`;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ImageZoom();
});
