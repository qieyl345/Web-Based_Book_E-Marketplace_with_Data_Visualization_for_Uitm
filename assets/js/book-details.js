// Book details page functionality

let currentBook = null;

// Initialize book details page
document.addEventListener('DOMContentLoaded', async () => {
    // Wait for auth to be initialized first
    if (typeof waitForAuth === 'function') {
        await waitForAuth();
    }

    const bookId = getUrlParameter('id');

    if (!bookId) {
        window.location.href = '../index.html';
        return;
    }

    try {
        await loadBookDetails(bookId);
    } catch (error) {
        console.error("Error loading book:", error);
        showNotification("Book not found", "error");
        setTimeout(() => {
            window.location.href = '../index.html';
        }, 2000);
    }
});

async function loadBookDetails(bookId) {
    try {
        currentBook = await Books.getBook(bookId);

        // Increment view count
        await Books.incrementViewCount(bookId);

        // Update page title
        document.title = `${currentBook.title} - UiTM e-Marketplace`;

        // Update breadcrumb
        document.getElementById('bookTitleBreadcrumb').textContent = currentBook.title;

        // Display book details
        displayBookDetails();
        setupActionButtons();
    } catch (error) {
        throw error;
    }
}

function displayBookDetails() {
    // Main image
    const mainImage = document.getElementById('mainBookImage');
    if (currentBook.images && currentBook.images.length > 0) {
        mainImage.src = currentBook.images[0];
    } else {
        mainImage.src = '/assets/images/no-image.png';
    }

    // Book info
    document.getElementById('bookTitle').textContent = currentBook.title;
    document.getElementById('bookAuthor').textContent = currentBook.author;
    document.getElementById('bookISBN').textContent = currentBook.isbn || 'N/A';
    document.getElementById('subjectCode').textContent = currentBook.subjectCode;
    document.getElementById('campusLocation').textContent = currentBook.campusLocation;
    document.getElementById('viewCount').textContent = `${currentBook.viewCount || 0} views`;
    document.getElementById('bookPrice').textContent = `RM ${currentBook.price.toFixed(2)}`;
    document.getElementById('bookDescription').textContent = currentBook.description || 'No description provided';

    // Condition badge
    const conditionBadge = document.getElementById('bookCondition');
    conditionBadge.textContent = currentBook.condition;
    conditionBadge.className = `condition-badge ${currentBook.condition}`;

    // Seller info
    document.getElementById('sellerName').textContent = currentBook.sellerName;
    document.getElementById('sellerLocation').textContent = currentBook.campusLocation;

    // Image thumbnails
    const thumbnailsContainer = document.getElementById('imageThumbnails');
    if (currentBook.images && currentBook.images.length > 0) {
        thumbnailsContainer.innerHTML = currentBook.images.map((img, index) => `
            <div class="thumbnail ${index === 0 ? 'active' : ''}" onclick="changeMainImage('${img}', this)">
                <img src="${img}" alt="Book image ${index + 1}">
            </div>
        `).join('');
    }

    // Show/hide edit buttons for seller
    if (currentUser && currentBook.sellerId === currentUser.uid) {
        document.getElementById('editBookSection').style.display = 'flex';

        // Hide buying options for seller
        const addToCartBtn = document.getElementById('addToCartBtn');
        const buyNowBtn = document.getElementById('buyNowBtn');
        const makeOfferBtn = document.getElementById('makeOfferBtn');

        if (addToCartBtn) addToCartBtn.style.display = 'none';
        if (buyNowBtn) buyNowBtn.style.display = 'none';
        if (makeOfferBtn) makeOfferBtn.style.display = 'none';
    }

    // Hide buying options for admin users (admins can only monitor dashboard)
    if (typeof isAdmin === 'function' && isAdmin()) {
        const addToCartBtn = document.getElementById('addToCartBtn');
        const buyNowBtn = document.getElementById('buyNowBtn');
        const makeOfferBtn = document.getElementById('makeOfferBtn');

        if (addToCartBtn) addToCartBtn.style.display = 'none';
        if (buyNowBtn) buyNowBtn.style.display = 'none';
        if (makeOfferBtn) makeOfferBtn.style.display = 'none';
    }
}

function changeMainImage(imageSrc, thumbnail) {
    document.getElementById('mainBookImage').src = imageSrc;
    document.querySelectorAll('.thumbnail').forEach(th => th.classList.remove('active'));
    thumbnail.classList.add('active');
}

function setupActionButtons() {
    const addToCartBtn = document.getElementById('addToCartBtn');
    const buyNowBtn = document.getElementById('buyNowBtn');
    const makeOfferBtn = document.getElementById('makeOfferBtn');
    const editBookBtn = document.getElementById('editBookBtn');
    const deleteBookBtn = document.getElementById('deleteBookBtn');

    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', async () => {
            try {
                await Cart.addItem(currentBook.id, {
                    id: currentBook.id,
                    title: currentBook.title,
                    author: currentBook.author,
                    price: currentBook.price,
                    image: currentBook.images?.[0],
                    sellerId: currentBook.sellerId,
                    sellerName: currentBook.sellerName,
                    campusLocation: currentBook.campusLocation,
                    subjectCode: currentBook.subjectCode,
                    condition: currentBook.condition
                });
                showNotification("Book added to cart!", "success");
            } catch (error) {
                showNotification(error.message, "error");
            }
        });
    }

    if (buyNowBtn) {
        buyNowBtn.addEventListener('click', async () => {
            try {
                // Add to cart and redirect to payment
                await Cart.addItem(currentBook.id, {
                    id: currentBook.id,
                    title: currentBook.title,
                    author: currentBook.author,
                    price: currentBook.price,
                    image: currentBook.images?.[0],
                    sellerId: currentBook.sellerId,
                    sellerName: currentBook.sellerName,
                    campusLocation: currentBook.campusLocation,
                    subjectCode: currentBook.subjectCode,
                    condition: currentBook.condition
                });
                window.location.href = 'payment.html';
            } catch (error) {
                showNotification(error.message, "error");
            }
        });
    }

    if (makeOfferBtn) {
        makeOfferBtn.addEventListener('click', () => {
            document.getElementById('offerModal').style.display = 'flex';
        });
    }

    // Offer Modal Logic
    const offerModal = document.getElementById('offerModal');
    if (offerModal) {
        const closeBtn = offerModal.querySelector('.modal-close');
        closeBtn.addEventListener('click', () => {
            offerModal.style.display = 'none';
        });

        document.getElementById('offerForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const offerPrice = parseFloat(document.getElementById('offerPrice').value);

            if (isNaN(offerPrice) || offerPrice <= 0) {
                showNotification("Please enter a valid price", "error");
                return;
            }

            try {
                const offerData = {
                    bookId: currentBook.id,
                    bookTitle: currentBook.title,
                    bookPrice: currentBook.price,
                    buyerId: currentUser.uid,
                    buyerName: userData.fullName,
                    sellerId: currentBook.sellerId,
                    sellerName: currentBook.sellerName,
                    currentPrice: offerPrice,
                    status: 'pending',
                    lastActionBy: currentUser.uid,
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                };

                // Create offer
                const offerRef = await database.ref('offers').push(offerData);
                const offerId = offerRef.key;

                // Initialize chat room with system message
                const chatData = {
                    participants: {
                        [currentUser.uid]: true,
                        [currentBook.sellerId]: true
                    },
                    lastMessage: `Offer made: RM ${offerPrice.toFixed(2)}`,
                    lastMessageTimestamp: Date.now()
                };
                await database.ref(`chats/${offerId}`).set(chatData);

                // Add initial system message
                const systemMessage = {
                    senderId: 'system',
                    senderName: 'System',
                    text: `${userData.fullName} made an offer of RM ${offerPrice.toFixed(2)}`,
                    type: 'system',
                    timestamp: Date.now()
                };
                await database.ref(`chats/${offerId}/messages`).push(systemMessage);

                // Send notification to seller
                const notificationData = {
                    recipientId: currentBook.sellerId,
                    senderId: currentUser.uid,
                    senderName: userData.fullName,
                    type: 'offer',
                    message: `${userData.fullName} offered RM ${offerPrice.toFixed(2)} for "${currentBook.title}"`,
                    offerId: offerId,
                    bookId: currentBook.id,
                    read: false,
                    createdAt: Date.now()
                };
                await database.ref('notifications').push(notificationData);

                // Close modal and redirect to chat
                offerModal.style.display = 'none';
                document.getElementById('offerPrice').value = '';
                showNotification("Offer sent! Redirecting to chat...", "success");

                setTimeout(() => {
                    window.location.href = `chat.html?offerId=${offerId}`;
                }, 1500);
            } catch (error) {
                console.error("Offer error:", error);
                showNotification("Failed to send offer", "error");
            }
        });
    }

    if (editBookBtn) {
        editBookBtn.addEventListener('click', () => {
            openEditModal();
        });
    }

    if (deleteBookBtn) {
        deleteBookBtn.addEventListener('click', showDeleteConfirmation);
    }
}

// Edit Book Modal Functions
function openEditModal() {
    const modal = document.getElementById('editBookModal');
    if (!modal || !currentBook) return;

    // Populate form with current book data
    document.getElementById('editBookTitle').value = currentBook.title || '';
    document.getElementById('editBookAuthor').value = currentBook.author || '';
    document.getElementById('editBookISBN').value = currentBook.isbn || '';
    document.getElementById('editSubjectCode').value = currentBook.subjectCode || '';
    document.getElementById('editBookCondition').value = currentBook.condition || 'used';
    document.getElementById('editBookPrice').value = currentBook.price || '';
    document.getElementById('editCampusLocation').value = currentBook.campusLocation || 'Block A';
    document.getElementById('editBookDescription').value = currentBook.description || '';

    modal.style.display = 'flex';
    setupEditFormHandler();
}

function closeEditModal() {
    const modal = document.getElementById('editBookModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function setupEditFormHandler() {
    const form = document.getElementById('editBookForm');
    if (!form) return;

    // Remove existing listener to prevent duplicates
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);

    newForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const loadingOverlay = document.getElementById('loadingOverlay');
        loadingOverlay.style.display = 'flex';

        try {
            const updatedData = {
                title: document.getElementById('editBookTitle').value.trim(),
                author: document.getElementById('editBookAuthor').value.trim(),
                isbn: document.getElementById('editBookISBN').value.trim(),
                subjectCode: document.getElementById('editSubjectCode').value.trim().toUpperCase(),
                condition: document.getElementById('editBookCondition').value,
                price: parseFloat(document.getElementById('editBookPrice').value),
                campusLocation: document.getElementById('editCampusLocation').value,
                description: document.getElementById('editBookDescription').value.trim(),
                updatedAt: Date.now()
            };

            // Validate required fields
            if (!updatedData.title || !updatedData.author || !updatedData.subjectCode || !updatedData.price) {
                throw new Error('Please fill in all required fields');
            }

            if (updatedData.price <= 0) {
                throw new Error('Price must be greater than 0');
            }

            // Update in Firebase
            await database.ref(`books/${currentBook.id}`).update(updatedData);

            // Update local book object
            Object.assign(currentBook, updatedData);

            // Refresh display
            displayBookDetails();
            closeEditModal();

            showNotification('Book updated successfully!', 'success');
        } catch (error) {
            console.error('Error updating book:', error);
            showNotification(error.message || 'Failed to update book', 'error');
        } finally {
            loadingOverlay.style.display = 'none';
        }
    });
}

// Make functions globally accessible
window.closeEditModal = closeEditModal;

function showDeleteConfirmation() {
    const deleteModal = document.getElementById('deleteModal');
    const confirmDeleteBtn = document.getElementById('confirmDelete');
    const cancelDeleteBtn = document.getElementById('cancelDelete');

    deleteModal.style.display = 'flex';

    cancelDeleteBtn.addEventListener('click', () => {
        deleteModal.style.display = 'none';
    });

    confirmDeleteBtn.addEventListener('click', async () => {
        try {
            const loadingOverlay = document.getElementById('loadingOverlay');
            loadingOverlay.style.display = 'flex';

            await Books.deleteBook(currentBook.id);
            showNotification("Book deleted successfully!", "success");

            setTimeout(() => {
                window.location.href = '../index.html';
            }, 1500);
        } catch (error) {
            console.error("Error deleting book:", error);
            showNotification(error.message, "error");
            loadingOverlay.style.display = 'none';
        }
    });

    // Close modal on outside click
    deleteModal.addEventListener('click', (e) => {
        if (e.target === deleteModal) {
            deleteModal.style.display = 'none';
        }
    });
}
