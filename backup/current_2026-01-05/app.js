// Shared app functionality

// Global variables
let searchTimeout = null;
let currentPage = 1;
const booksPerPage = 12;

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    // Wait for auth to be initialized (from firebase-config.js)
    if (typeof waitForAuth === 'function') {
        await waitForAuth();
    }
    setupLogoutButton();
    updateCartCount();
});

// Setup logout button
function setupLogoutButton() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
}

// Update cart count in navigation
async function updateCartCount() {
    if (!currentUser) return;

    try {
        const snapshot = await database.ref(`carts/${currentUser.uid}`).once('value');
        const cart = snapshot.val();
        const cartCount = document.getElementById('cartCount');
        if (cartCount) {
            if (cart && cart.totalItems > 0) {
                cartCount.textContent = cart.totalItems;
                cartCount.style.display = 'inline-block';
            } else {
                cartCount.style.display = 'none';
            }
        }
    } catch (error) {
        console.error("Error updating cart count:", error);
    }
}

// Shopping cart functions
const Cart = {
    // Get cart for current user
    async getCart() {
        // Wait for auth to be initialized (from firebase-config.js)
        if (typeof waitForAuth === 'function') {
            await waitForAuth();
        }

        if (!currentUser) {
            throw new Error("User not authenticated");
        }

        const snapshot = await database.ref(`carts/${currentUser.uid}`).once('value');
        return snapshot.val() || { items: {}, totalItems: 0 };
    },

    // Add item to cart
    async addItem(bookId, bookDetails, quantity = 1) {
        try {
            // Wait for auth to be initialized (from firebase-config.js)
            if (typeof waitForAuth === 'function') {
                await waitForAuth();
            }

            if (!currentUser) {
                throw new Error("User not authenticated");
            }

            const cartRef = database.ref(`carts/${currentUser.uid}`);
            const snapshot = await cartRef.once('value');
            let cart = snapshot.val();

            console.log('Cart addItem debug:', {
                bookId: bookId,
                cart: cart,
                'typeof cart': typeof cart,
                'cart?.items': cart?.items,
                'Object.keys(cart)': cart ? Object.keys(cart) : 'N/A'
            });

            // Create a new cart object to ensure it's valid
            let newCart = {
                items: {},
                totalItems: 0
            };

            // If existing cart has data, merge it safely
            if (cart && typeof cart === 'object') {
                if (cart.items && typeof cart.items === 'object') {
                    newCart.items = { ...cart.items };
                }
                if (typeof cart.totalItems === 'number') {
                    newCart.totalItems = cart.totalItems;
                }
            }

            console.log('New cart after merge:', newCart);

            // Now safely access newCart.items
            if (newCart.items[bookId]) {
                newCart.items[bookId].quantity += quantity;
            } else {
                newCart.items[bookId] = {
                    bookDetails: bookDetails,
                    quantity: quantity,
                    addedAt: Date.now()
                };
                newCart.totalItems += 1;
            }

            await cartRef.set(newCart);
            updateCartCount();
            return { success: true, message: "Item added to cart!" };
        } catch (error) {
            console.error("Add to cart error:", error);
            throw error;
        }
    },

    // Remove item from cart
    async removeItem(bookId) {
        try {
            // Wait for auth to be initialized (from firebase-config.js)
            if (typeof waitForAuth === 'function') {
                await waitForAuth();
            }

            if (!currentUser) {
                throw new Error("User not authenticated");
            }

            const cartRef = database.ref(`carts/${currentUser.uid}`);
            const snapshot = await cartRef.once('value');
            const cart = snapshot.val();

            if (cart && cart.items[bookId]) {
                delete cart.items[bookId];
                cart.totalItems = Object.keys(cart.items).length;
                await cartRef.set(cart);
                updateCartCount();
            }

            return { success: true, message: "Item removed from cart!" };
        } catch (error) {
            console.error("Remove from cart error:", error);
            throw error;
        }
    },

    // Update item quantity
    async updateQuantity(bookId, quantity) {
        try {
            // Wait for auth to be initialized (from firebase-config.js)
            if (typeof waitForAuth === 'function') {
                await waitForAuth();
            }

            if (!currentUser) {
                throw new Error("User not authenticated");
            }

            if (quantity <= 0) {
                return this.removeItem(bookId);
            }

            const cartRef = database.ref(`carts/${currentUser.uid}`);
            const snapshot = await cartRef.once('value');
            const cart = snapshot.val();

            if (cart && cart.items[bookId]) {
                cart.items[bookId].quantity = quantity;
                await cartRef.set(cart);
            }

            return { success: true };
        } catch (error) {
            console.error("Update quantity error:", error);
            throw error;
        }
    },

    // Clear cart
    async clear() {
        try {
            // Wait for auth to be initialized (from firebase-config.js)
            if (typeof waitForAuth === 'function') {
                await waitForAuth();
            }

            if (!currentUser) {
                throw new Error("User not authenticated");
            }

            await database.ref(`carts/${currentUser.uid}`).set({
                items: {},
                totalItems: 0
            });
            updateCartCount();
        } catch (error) {
            console.error("Clear cart error:", error);
            throw error;
        }
    },

    // Calculate cart total
    calculateTotal() {
        return new Promise(async (resolve, reject) => {
            try {
                const cart = await this.getCart();
                let subtotal = 0;

                Object.values(cart.items).forEach(item => {
                    subtotal += item.bookDetails.price * item.quantity;
                });

                const commission = subtotal * COMMISSION_RATE;
                const total = subtotal + commission;

                resolve({
                    subtotal,
                    commission,
                    total,
                    itemCount: cart.totalItems
                });
            } catch (error) {
                reject(error);
            }
        });
    }
};

// Books functions
const Books = {
    // Get all books with optional filters
    async getBooks(filters = {}) {
        return new Promise((resolve, reject) => {
            let query = database.ref('books').orderByChild('createdAt');

            if (filters.condition) {
                query = query.equalTo(filters.condition);
            }

            query.once('value')
                .then((snapshot) => {
                    let books = [];
                    snapshot.forEach((childSnapshot) => {
                        const book = childSnapshot.val();
                        book.id = childSnapshot.key;

                        // Filter out sold books
                        if (book.status !== 'sold') {
                            books.push(book);
                        }
                    });

                    // Apply filters
                    if (filters.search) {
                        const searchLower = filters.search.toLowerCase();
                        books = books.filter(book =>
                            book.title.toLowerCase().includes(searchLower) ||
                            book.author.toLowerCase().includes(searchLower) ||
                            (book.subjectCode && book.subjectCode.toLowerCase().includes(searchLower))
                        );
                    }

                    if (filters.minPrice !== undefined) {
                        books = books.filter(book => book.price >= filters.minPrice);
                    }

                    if (filters.maxPrice !== undefined) {
                        books = books.filter(book => book.price <= filters.maxPrice);
                    }

                    if (filters.campusLocation) {
                        books = books.filter(book => book.campusLocation === filters.campusLocation);
                    }

                    // Sort books
                    if (filters.sortBy) {
                        switch (filters.sortBy) {
                            case 'price-low':
                                books.sort((a, b) => a.price - b.price);
                                break;
                            case 'price-high':
                                books.sort((a, b) => b.price - a.price);
                                break;
                            case 'popular':
                                books.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
                                break;
                            default: // date
                                books.sort((a, b) => b.createdAt - a.createdAt);
                        }
                    }

                    resolve(books);
                })
                .catch(reject);
        });
    },

    // Get book by ID
    async getBook(bookId) {
        return new Promise((resolve, reject) => {
            database.ref(`books/${bookId}`).once('value')
                .then((snapshot) => {
                    const book = snapshot.val();
                    if (book) {
                        book.id = bookId;
                        resolve(book);
                    } else {
                        reject(new Error("Book not found"));
                    }
                })
                .catch(reject);
        });
    },

    // Add new book
    async addBook(bookData) {
        try {
            // Wait for auth to be initialized (from firebase-config.js)
            if (typeof waitForAuth === 'function') {
                await waitForAuth();
            }

            if (!currentUser) {
                throw new Error("User not authenticated");
            }

            const book = {
                ...bookData,
                sellerId: currentUser.uid,
                sellerName: userData.fullName,
                status: 'available',
                viewCount: 0,
                createdAt: Date.now()
            };

            const newBookRef = database.ref('books').push();
            await newBookRef.set(book);

            return { success: true, bookId: newBookRef.key, message: "Book listed successfully!" };
        } catch (error) {
            console.error("Add book error:", error);
            throw error;
        }
    },

    // Update book
    async updateBook(bookId, updates) {
        try {
            // Wait for auth to be initialized (from firebase-config.js)
            if (typeof waitForAuth === 'function') {
                await waitForAuth();
            }

            if (!currentUser) {
                throw new Error("User not authenticated");
            }

            await database.ref(`books/${bookId}`).update(updates);
            return { success: true, message: "Book updated successfully!" };
        } catch (error) {
            console.error("Update book error:", error);
            throw error;
        }
    },

    // Delete book
    async deleteBook(bookId) {
        try {
            // Wait for auth to be initialized (from firebase-config.js)
            if (typeof waitForAuth === 'function') {
                await waitForAuth();
            }

            if (!currentUser) {
                throw new Error("User not authenticated");
            }

            await database.ref(`books/${bookId}`).remove();
            return { success: true, message: "Book deleted successfully!" };
        } catch (error) {
            console.error("Delete book error:", error);
            throw error;
        }
    },

    // Increment view count (only once per session per user)
    async incrementViewCount(bookId) {
        try {
            // Check if this user has already viewed this book in this session
            const viewedBooksKey = 'viewedBooks';
            let viewedBooks = sessionStorage.getItem(viewedBooksKey);

            // Parse existing viewed books or create empty array
            viewedBooks = viewedBooks ? JSON.parse(viewedBooks) : [];

            // If this book has already been viewed in this session, don't increment
            if (viewedBooks.includes(bookId)) {
                console.log('Book already viewed in this session, skipping increment');
                return;
            }

            // Increment the view count in Firebase
            const bookRef = database.ref(`books/${bookId}`);
            const snapshot = await bookRef.once('value');
            const book = snapshot.val();

            if (book) {
                const viewCount = (book.viewCount || 0) + 1;
                await bookRef.update({ viewCount });

                // Mark this book as viewed in this session
                viewedBooks.push(bookId);
                sessionStorage.setItem(viewedBooksKey, JSON.stringify(viewedBooks));
                console.log('View count incremented successfully');
            }
        } catch (error) {
            console.error("Increment view count error:", error);
        }
    }
};

// Feedback functions
const Feedback = {
    async submitFeedback(feedbackData) {
        try {
            if (!currentUser) throw new Error("User not authenticated");

            const feedback = {
                ...feedbackData,
                buyerId: currentUser.uid,
                buyerName: userData.fullName,
                createdAt: Date.now(),
                status: 'pending'
            };

            await database.ref('feedback').push(feedback);
            return { success: true, message: "Feedback submitted successfully!" };
        } catch (error) {
            console.error("Submit feedback error:", error);
            throw error;
        }
    }
};

// Image upload to ImageBB
async function uploadImageToImgBB(imageFile) {
    try {
        const formData = new FormData();
        formData.append('key', IMGBB_API_KEY);
        formData.append('image', imageFile);

        const response = await fetch(IMGBB_UPLOAD_URL, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            return data.data.url;
        } else {
            throw new Error(data.error?.message || "Upload failed");
        }
    } catch (error) {
        console.error("Image upload error:", error);
        throw error;
    }
}

// Upload multiple images
async function uploadMultipleImages(files) {
    const uploadPromises = Array.from(files).slice(0, 5).map(file => uploadImageToImgBB(file));
    return Promise.all(uploadPromises);
}
