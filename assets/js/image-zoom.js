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

        // Image navigation
        this.images = [];
        this.currentImageIndex = 0;

        this.init();
    }

    init() {
        console.log('🖼️ ImageZoom: Initializing...');

        // Create lightbox element
        this.createLightbox();
        console.log('🖼️ ImageZoom: Lightbox created');

        // Wait a bit for the DOM to be fully ready, then attach listeners
        setTimeout(() => {
            this.attachImageListeners();
        }, 500);

        console.log('🖼️ ImageZoom: Initialization complete');
    }

    attachImageListeners() {
        console.log('🖼️ ImageZoom: Attaching image listeners...');

        const mainImage = document.getElementById('mainBookImage');
        const mainImageContainer = document.querySelector('.main-image');

        console.log('🖼️ ImageZoom: mainImage:', mainImage);
        console.log('🖼️ ImageZoom: mainImageContainer:', mainImageContainer);

        if (mainImageContainer) {
            mainImageContainer.style.cursor = 'pointer';
            console.log('🖼️ ImageZoom: Set cursor to pointer');

            mainImageContainer.addEventListener('click', (e) => {
                console.log('🖼️ ImageZoom: Container clicked!', e);
                e.preventDefault();
                e.stopPropagation();
                this.collectImages();
                console.log('🖼️ ImageZoom: Images collected:', this.images.length, this.images);
                if (this.images.length > 0) {
                    this.openLightbox(0);
                } else {
                    console.error('🖼️ ImageZoom: No images to display!');
                }
            });
            console.log('🖼️ ImageZoom: ✅ Click listener attached to container');
        } else {
            console.error('🖼️ ImageZoom: ❌ .main-image container not found!');
        }

        // Also try attaching to the image itself as backup
        if (mainImage) {
            mainImage.addEventListener('click', (e) => {
                console.log('🖼️ ImageZoom: Image itself clicked!', e);
                e.preventDefault();
                e.stopPropagation();
                this.collectImages();
                if (this.images.length > 0) {
                    this.openLightbox(0);
                }
            });
            console.log('🖼️ ImageZoom: ✅ Click listener attached to image');
        }

        // Thumbnail listeners
        const thumbnails = document.querySelectorAll('.thumbnail');
        console.log('🖼️ ImageZoom: Found thumbnails for click:', thumbnails.length);

        thumbnails.forEach((thumb, index) => {
            thumb.addEventListener('click', () => {
                console.log(`🖼️ ImageZoom: Thumbnail ${index} clicked`);
                if (mainImage) {
                    mainImage.src = thumb.src;
                    document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
                    thumb.classList.add('active');
                }
            });
        });
    }

    collectImages() {
        console.log('🖼️ ImageZoom: collectImages() called');
        this.images = [];
        const mainImage = document.getElementById('mainBookImage');

        console.log('🖼️ ImageZoom: mainImage element:', mainImage);
        console.log('🖼️ ImageZoom: mainImage src:', mainImage?.src);

        if (mainImage) {
            const thumbnails = document.querySelectorAll('.thumbnail');
            console.log('🖼️ ImageZoom: Found thumbnails:', thumbnails.length);

            // Try to collect from thumbnails first
            if (thumbnails.length > 0) {
                thumbnails.forEach((thumb, index) => {
                    console.log(`🖼️ ImageZoom: Thumbnail ${index}:`, thumb.src);
                    if (thumb.src && thumb.src !== '' && !thumb.src.includes('undefined') && !thumb.src.includes('null')) {
                        this.images.push({
                            src: thumb.src,
                            alt: thumb.alt || 'Book image'
                        });
                        console.log(`🖼️ ImageZoom: ✅ Added thumbnail ${index}`);
                    } else {
                        console.log(`🖼️ ImageZoom: ❌ Skipped invalid thumbnail ${index}`);
                    }
                });
            }

            // If no valid images from thumbnails, use the main image
            if (this.images.length === 0) {
                console.log('🖼️ ImageZoom: No valid thumbnails, falling back to main image');
                if (mainImage.src && mainImage.src !== '' && !mainImage.src.includes('undefined') && !mainImage.src.includes('null')) {
                    this.images.push({
                        src: mainImage.src,
                        alt: mainImage.alt || 'Book image'
                    });
                    console.log('🖼️ ImageZoom: ✅ Added main image');
                } else {
                    console.log('🖼️ ImageZoom: ❌ Main image src is invalid');
                }
            }
        } else {
            console.log('🖼️ ImageZoom: ❌ No mainImage element found!');
        }

        console.log('🖼️ ImageZoom: Total images collected:', this.images.length);
    }

    createLightbox() {
        // Create lightbox HTML structure
        const lightbox = document.createElement('div');
        lightbox.className = 'image-lightbox';
        lightbox.id = 'imageLightbox';
        lightbox.innerHTML = `
            <div class="lightbox-close" id="lightboxClose">
                <i class="fas fa-times"></i>
            </div>
            
            <div class="lightbox-nav-btn lightbox-prev" id="lightboxPrev">
                <i class="fas fa-chevron-left"></i>
            </div>
            <div class="lightbox-nav-btn lightbox-next" id="lightboxNext">
                <i class="fas fa-chevron-right"></i>
            </div>
            
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
        const prevBtn = document.getElementById('lightboxPrev');
        const nextBtn = document.getElementById('lightboxNext');

        // Close lightbox
        closeBtn.addEventListener('click', () => this.closeLightbox());
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                this.closeLightbox();
            }
        });

        // Navigation controls
        prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.prevImage();
        });

        nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.nextImage();
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
                } else if (e.key === 'ArrowLeft') {
                    this.prevImage();
                } else if (e.key === 'ArrowRight') {
                    this.nextImage();
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

    openLightbox(index) {
        console.log('🖼️ ImageZoom: openLightbox() called with index:', index);
        console.log('🖼️ ImageZoom: Total images:', this.images.length);

        if (this.images.length === 0) {
            console.error('🖼️ ImageZoom: No images to display!');
            return;
        }

        this.currentImageIndex = index;
        const image = this.images[this.currentImageIndex];

        console.log('🖼️ ImageZoom: Current image:', image);

        const lightbox = document.getElementById('imageLightbox');
        const lightboxImage = document.getElementById('lightboxImage');
        const prevBtn = document.getElementById('lightboxPrev');
        const nextBtn = document.getElementById('lightboxNext');

        if (!image || !image.src) {
            console.error('🖼️ ImageZoom: Invalid image object!');
            return;
        }

        lightboxImage.src = image.src;
        lightboxImage.alt = image.alt;
        lightbox.classList.add('active');

        console.log('🖼️ ImageZoom: ✅ Lightbox opened successfully!');

        // Show/hide nav buttons based on image count
        if (this.images.length > 1) {
            prevBtn.style.display = 'flex';
            nextBtn.style.display = 'flex';
        } else {
            prevBtn.style.display = 'none';
            nextBtn.style.display = 'none';
        }

        // Disable body scroll
        document.body.style.overflow = 'hidden';

        // Reset zoom
        this.resetZoom();
    }

    nextImage() {
        if (this.images.length <= 1) return;

        this.currentImageIndex = (this.currentImageIndex + 1) % this.images.length;
        this.updateLightboxImage();
    }

    prevImage() {
        if (this.images.length <= 1) return;

        this.currentImageIndex = (this.currentImageIndex - 1 + this.images.length) % this.images.length;
        this.updateLightboxImage();
    }

    updateLightboxImage() {
        const lightboxImage = document.getElementById('lightboxImage');
        const image = this.images[this.currentImageIndex];

        // Fade out
        lightboxImage.style.opacity = '0.5';

        setTimeout(() => {
            if (image && image.src) {
                lightboxImage.src = image.src;
                lightboxImage.alt = image.alt;
            }
            lightboxImage.style.opacity = '1';
            this.resetZoom();
        }, 200);
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
    console.log('🖼️ ImageZoom: Script loaded and DOMContentLoaded fired');
    const imageZoomInstance = new ImageZoom();
    console.log('🖼️ ImageZoom: Instance created:', imageZoomInstance);

    // Make it globally accessible for debugging
    window.imageZoomDebug = imageZoomInstance;
});
