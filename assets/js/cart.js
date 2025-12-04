// Shopping cart page functionality

let cartItems = [];

// Initialize cart page
document.addEventListener('DOMContentLoaded', async () => {
    // Wait for auth to be initialized first
    if (typeof waitForAuth === 'function') {
        await waitForAuth();
    }

    // Redirect admin users to admin dashboard
    if (typeof isAdmin === 'function' && isAdmin()) {
        showNotification("Admin users cannot purchase books. Redirecting to dashboard...", "info");
        setTimeout(() => {
            window.location.href = 'admin.html';  // Already in pages/ directory
        }, 1500);
        return;
    }

    await loadCart();
    setupCheckout();
});

async function loadCart() {
    try {
        const cart = await Cart.getCart();
        cartItems = Object.values(cart.items || {});

        // Validate book availability and remove sold items
        const unavailableBooks = [];
        const validItems = [];

        for (const item of cartItems) {
            try {
                const bookSnapshot = await database.ref(`books/${item.bookDetails.id}`).once('value');
                const bookData = bookSnapshot.val();

                // Check if book exists and is still available
                if (!bookData || bookData.status === 'sold') {
                    unavailableBooks.push(item.bookDetails.title);
                    // Remove from cart
                    await Cart.removeItem(item.bookDetails.id);
                } else {
                    validItems.push(item);
                }
            } catch (error) {
                console.error(`Error checking availability for book ${item.bookDetails.id}:`, error);
            }
        }

        // Update cartItems to only include valid items
        cartItems = validItems;

        // Show notification if books were removed
        if (unavailableBooks.length > 0) {
            const bookList = unavailableBooks.join(', ');
            showNotification(
                `Some books in your cart are no longer available and have been removed: ${bookList}`,
                "warning"
            );
        }

        if (cartItems.length === 0) {
            showEmptyCart();
        } else {
            displayCartItems();
            await displayCartSummary();
        }
    } catch (error) {
        console.error("Error loading cart:", error);
        showNotification("Error loading cart", "error");
    }
}

function showEmptyCart() {
    document.getElementById('emptyCart').style.display = 'block';
    document.getElementById('cartContent').style.display = 'none';
}

function displayCartItems() {
    const cartItemsList = document.getElementById('cartItemsList');

    cartItemsList.innerHTML = cartItems.map((item, index) => `
        <div class="cart-item">
            <div class="cart-item-image">
                <img src="${item.bookDetails.image || '/assets/images/no-image.png'}" alt="${item.bookDetails.title}">
            </div>
            <div class="cart-item-details">
                <h3>${item.bookDetails.title}</h3>
                <div class="cart-item-meta">
                    <span><i class="fas fa-user"></i> ${item.bookDetails.author}</span>
                    <span><i class="fas fa-code"></i> ${item.bookDetails.sellerName}</span>
                    <span><i class="fas fa-map-marker-alt"></i> ${item.bookDetails.campusLocation}</span>
                </div>
            </div>
            <div class="cart-item-actions">
                <div class="cart-item-price">RM ${item.bookDetails.price.toFixed(2)}</div>
                <button class="remove-btn" onclick="removeItem('${item.bookDetails.id}')">
                    <i class="fas fa-trash"></i> Remove
                </button>
            </div>
        </div>
    `).join('');

    // Show the cart content when items are loaded
    document.getElementById('cartContent').style.display = 'grid';
}

async function displayCartSummary() {
    const totals = await Cart.calculateTotal();

    document.getElementById('subtotal').textContent = formatCurrency(totals.subtotal);
    document.getElementById('adminFee').textContent = formatCurrency(totals.commission);
    document.getElementById('total').textContent = formatCurrency(totals.total);
}

function setupCheckout() {
    const checkoutBtn = document.getElementById('checkoutBtn');

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            window.location.href = 'payment.html';
        });
    }
}

async function removeItem(bookId) {
    try {
        const loadingOverlay = document.getElementById('loadingOverlay');
        loadingOverlay.style.display = 'flex';

        await Cart.removeItem(bookId);
        showNotification("Item removed from cart", "success");

        // Reload cart
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    } catch (error) {
        console.error("Error removing item:", error);
        showNotification(error.message, "error");
        loadingOverlay.style.display = 'none';
    }
}
