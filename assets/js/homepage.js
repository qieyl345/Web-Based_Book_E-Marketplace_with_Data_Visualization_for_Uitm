// Homepage functionality

let allBooks = [];
let filteredBooks = [];

// Initialize homepage
document.addEventListener('DOMContentLoaded', async () => {
    // Wait for auth to be initialized first
    if (typeof waitForAuth === 'function') {
        await waitForAuth();
    }

    // Hide "Sell a Book" button for admin users
    if (typeof isAdmin === 'function' && isAdmin()) {
        const listBookBtn = document.getElementById('listBookBtn');
        if (listBookBtn) {
            listBookBtn.style.display = 'none';
        }
    }

    await loadBooks();
    setupSearch();
    setupFilters();
    setupSort();
    setupAddBook();
});

async function loadBooks() {
    try {
        const booksGrid = document.getElementById('booksGrid');
        booksGrid.innerHTML = '<div class="loading-placeholder">Loading books...</div>';

        allBooks = await Books.getBooks();
        filteredBooks = [...allBooks];

        displayBooks();
    } catch (error) {
        console.error("Error loading books:", error);
        showNotification("Error loading books", "error");
    }
}

function displayBooks() {
    const booksGrid = document.getElementById('booksGrid');

    if (filteredBooks.length === 0) {
        booksGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-book"></i>
                <h2>No books found</h2>
                <p>Try adjusting your search or filters</p>
            </div>
        `;
        return;
    }

    booksGrid.innerHTML = filteredBooks.map(book => `
        <div class="book-card" onclick="viewBook('${book.id}')">
            <img class="book-image" src="${book.images?.[0] || '/assets/images/no-image.png'}" alt="${book.title}">
            <div class="book-card-content">
                <h3 class="book-title">${book.title}</h3>
                <div class="book-meta">
                    <span><i class="fas fa-user"></i> ${book.author}</span>
                    <span><i class="fas fa-code"></i> ${book.subjectCode}</span>
                    <span><i class="fas fa-map-marker-alt"></i> ${book.campusLocation}</span>
                </div>
                <div class="book-price">RM ${book.price.toFixed(2)}</div>
                <span class="condition-badge ${book.condition}">${book.condition}</span>
            </div>
        </div>
    `).join('');
}

function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');

    if (searchBtn) {
        searchBtn.addEventListener('click', performSearch);
    }

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(performSearch, 500);
        });

        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }
}

function performSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();

    filteredBooks = allBooks.filter(book =>
        book.title.toLowerCase().includes(searchTerm) ||
        book.author.toLowerCase().includes(searchTerm) ||
        (book.subjectCode && book.subjectCode.toLowerCase().includes(searchTerm))
    );

    displayBooks();
}

function setupFilters() {
    const applyFiltersBtn = document.getElementById('applyFilters');
    const resetFiltersBtn = document.getElementById('resetFilters');

    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', applyFilters);
    }

    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', resetFilters);
    }
}

function applyFilters() {
    const conditionFilters = document.querySelectorAll('input[name="condition"]:checked');
    const minPrice = document.getElementById('minPrice').value;
    const maxPrice = document.getElementById('maxPrice').value;
    const campusLocation = document.getElementById('campusFilter').value;

    const conditions = Array.from(conditionFilters).map(cb => cb.value);

    filteredBooks = allBooks.filter(book => {
        // Condition filter
        if (conditions.length > 0 && !conditions.includes(book.condition)) {
            return false;
        }

        // Price filter
        if (minPrice && book.price < parseFloat(minPrice)) {
            return false;
        }
        if (maxPrice && book.price > parseFloat(maxPrice)) {
            return false;
        }

        // Campus location filter
        if (campusLocation && book.campusLocation !== campusLocation) {
            return false;
        }

        return true;
    });

    displayBooks();
}

function resetFilters() {
    document.querySelectorAll('input[name="condition"]').forEach(cb => {
        cb.checked = true;
    });
    document.getElementById('minPrice').value = '';
    document.getElementById('maxPrice').value = '';
    document.getElementById('campusFilter').value = '';

    filteredBooks = [...allBooks];
    displayBooks();
}

function setupSort() {
    const sortSelect = document.getElementById('sortBy');
    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            const sortBy = sortSelect.value;

            switch (sortBy) {
                case 'price-low':
                    filteredBooks.sort((a, b) => a.price - b.price);
                    break;
                case 'price-high':
                    filteredBooks.sort((a, b) => b.price - a.price);
                    break;
                case 'popular':
                    filteredBooks.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
                    break;
                default: // date
                    filteredBooks.sort((a, b) => b.createdAt - a.createdAt);
            }

            displayBooks();
        });
    }
}

function setupAddBook() {
    const listBookBtn = document.getElementById('listBookBtn');
    const addBookModal = document.getElementById('addBookModal');
    const addBookForm = document.getElementById('addBookForm');
    const cancelAddBookBtn = document.getElementById('cancelAddBook');
    const modalClose = document.querySelector('#addBookModal .modal-close');
    const bookImagesInput = document.getElementById('bookImages');
    const imagePreview = document.getElementById('imagePreview');

    if (listBookBtn) {
        listBookBtn.addEventListener('click', () => {
            addBookModal.style.display = 'flex';
        });
    }

    if (cancelAddBookBtn) {
        cancelAddBookBtn.addEventListener('click', () => {
            addBookModal.style.display = 'none';
            addBookForm.reset();
            imagePreview.innerHTML = '';
        });
    }

    // Close button (×) handler
    if (modalClose) {
        modalClose.addEventListener('click', () => {
            addBookModal.style.display = 'none';
            addBookForm.reset();
            imagePreview.innerHTML = '';
        });
    }

    // Image preview
    if (bookImagesInput) {
        bookImagesInput.addEventListener('change', (e) => {
            imagePreview.innerHTML = '';
            const files = e.target.files;

            Array.from(files).slice(0, 5).forEach(file => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const div = document.createElement('div');
                    div.className = 'preview-image';
                    div.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
                    imagePreview.appendChild(div);
                };
                reader.readAsDataURL(file);
            });
        });
    }

    if (addBookForm) {
        addBookForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const loadingOverlay = document.getElementById('loadingOverlay');
            loadingOverlay.style.display = 'flex';

            try {
                const title = document.getElementById('bookTitle').value;
                const author = document.getElementById('bookAuthor').value;
                const isbn = document.getElementById('bookISBN').value;
                const subjectCode = document.getElementById('subjectCode').value;
                const condition = document.getElementById('bookCondition').value;
                const price = parseFloat(document.getElementById('bookPrice').value);
                const campusLocation = document.getElementById('campusLocation').value;
                const description = document.getElementById('bookDescription').value;
                const imageFiles = document.getElementById('bookImages').files;

                // Upload images
                let images = [];
                if (imageFiles.length > 0) {
                    try {
                        images = await uploadMultipleImages(imageFiles);
                    } catch (error) {
                        showNotification("Error uploading images", "error");
                        loadingOverlay.style.display = 'none';
                        return;
                    }
                }

                const bookData = {
                    title,
                    author,
                    isbn,
                    subjectCode,
                    condition,
                    price,
                    campusLocation,
                    description,
                    images
                };

                await Books.addBook(bookData);
                showNotification("Book listed successfully!", "success");
                addBookModal.style.display = 'none';
                addBookForm.reset();
                imagePreview.innerHTML = '';
                loadBooks();
            } catch (error) {
                console.error("Error adding book:", error);
                showNotification(error.message, "error");
            } finally {
                loadingOverlay.style.display = 'none';
            }
        });
    }

    // Close modal on outside click
    if (addBookModal) {
        addBookModal.addEventListener('click', (e) => {
            if (e.target === addBookModal) {
                addBookModal.style.display = 'none';
            }
        });
    }
}

function viewBook(bookId) {
    window.location.href = `pages/book-details.html?id=${bookId}`;
}
