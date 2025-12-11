// Payment page functionality

let selectedBank = null;
let paymentItems = [];
let paymentTotal = 0;

// Initialize payment page
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

    await loadPaymentItems();
    setupBankSelection();
    setupPayment();
});

async function loadPaymentItems() {
    try {
        const cart = await Cart.getCart();
        paymentItems = Object.values(cart.items);

        if (paymentItems.length === 0) {
            window.location.href = '../index.html';
            return;
        }

        displayPaymentItems();
        displayPaymentSummary();
    } catch (error) {
        console.error("Error loading payment items:", error);
        showNotification("Error loading payment", "error");
        setTimeout(() => {
            window.location.href = '../index.html';
        }, 2000);
    }
}

function displayPaymentItems() {
    const paymentItemsContainer = document.getElementById('paymentItems');

    paymentItemsContainer.innerHTML = paymentItems.map(item => `
        <div class="payment-item">
            <div>
                <h4>${item.bookDetails.title}</h4>
                <p>${item.bookDetails.author}</p>
            </div>
            <div>${formatCurrency(item.bookDetails.price)}</div>
        </div>
    `).join('');
}

function displayPaymentSummary() {
    const subtotal = paymentItems.reduce((sum, item) => sum + item.bookDetails.price, 0);
    const commission = subtotal * COMMISSION_RATE;
    paymentTotal = subtotal + commission;

    document.getElementById('paymentSubtotal').textContent = formatCurrency(subtotal);
    document.getElementById('paymentAdminFee').textContent = formatCurrency(commission);
    document.getElementById('paymentTotal').textContent = formatCurrency(paymentTotal);
}

function setupBankSelection() {
    const bankOptions = document.querySelectorAll('.bank-option');

    bankOptions.forEach(option => {
        option.addEventListener('click', () => {
            // Remove selected class from all options
            bankOptions.forEach(opt => opt.classList.remove('selected'));

            // Add selected class to clicked option
            option.classList.add('selected');

            // Store selected bank
            selectedBank = option.dataset.bank;

            // Enable pay button
            document.getElementById('payNowBtn').disabled = false;

            // Show selected bank
            const selectedBankDiv = document.getElementById('selectedBank');
            const bankNameSpan = document.getElementById('bankName');
            bankNameSpan.textContent = option.querySelector('h3').textContent;
            selectedBankDiv.style.display = 'block';
        });
    });
}

function setupPayment() {
    const payBtn = document.getElementById('payNowBtn');

    if (payBtn) {
        payBtn.addEventListener('click', processPayment);
    }
}

async function validateBookAvailability() {
    const unavailableBooks = [];
    const availableItems = [];

    for (const item of paymentItems) {
        try {
            const bookSnapshot = await database.ref(`books/${item.bookDetails.id}`).once('value');
            const bookData = bookSnapshot.val();

            // Check if book exists and is still available
            if (!bookData || bookData.status === 'sold') {
                unavailableBooks.push(item.bookDetails.title);
                // Remove from cart
                await Cart.removeItem(item.bookDetails.id);
            } else {
                availableItems.push(item);
            }
        } catch (error) {
            console.error(`Error checking availability for book ${item.bookDetails.id}:`, error);
            unavailableBooks.push(item.bookDetails.title);
        }
    }

    return { unavailableBooks, availableItems };
}

async function processPayment() {
    if (!selectedBank) {
        showNotification("Please select a bank", "error");
        return;
    }

    // Validate book availability before processing payment
    const { unavailableBooks, availableItems } = await validateBookAvailability();

    if (unavailableBooks.length > 0) {
        const bookList = unavailableBooks.map(title => `• ${title}`).join('\n');
        showNotification(
            `The following book(s) are no longer available and have been removed from your cart:\n${bookList}`,
            "error"
        );

        // If no books are left, redirect to cart
        if (availableItems.length === 0) {
            setTimeout(() => {
                window.location.href = 'cart.html';
            }, 3000);
            return;
        }

        // Reload page to show updated cart
        setTimeout(() => {
            window.location.reload();
        }, 3000);
        return;
    }

    const processingModal = document.getElementById('processingModal');
    processingModal.style.display = 'flex';

    // Simulate FPX processing delay
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 90% success rate
    const isSuccess = Math.random() < 0.9;

    if (isSuccess) {
        try {
            const transactionId = await completeTransaction();
            processingModal.style.display = 'none';
            showPaymentSuccess(transactionId);
        } catch (error) {
            console.error("Error completing transaction:", error);
            processingModal.style.display = 'none';
            showNotification("Payment failed. Please try again.", "error");
        }
    } else {
        // Save failed transaction to Firebase for analytics tracking
        try {
            const failedTransactionId = 'TXN' + Date.now();
            const failedTransaction = {
                transactionId: failedTransactionId,
                buyerId: currentUser.uid,
                buyerName: userData?.fullName || 'Unknown',
                buyerEmail: userData?.email || currentUser.email,
                items: paymentItems,
                amount: paymentTotal,
                basePrice: paymentItems.reduce((sum, item) => sum + item.bookDetails.price, 0),
                commissionFee: paymentTotal - paymentItems.reduce((sum, item) => sum + item.bookDetails.price, 0),
                status: 'failed',
                selectedBank,
                createdAt: Date.now(),
                failureReason: 'FPX payment processing failed'
            };
            await database.ref(`transactions/${failedTransactionId}`).set(failedTransaction);
            console.log('[PAYMENT] Failed transaction recorded:', failedTransactionId);
        } catch (error) {
            console.error('[PAYMENT] Error recording failed transaction:', error);
        }

        processingModal.style.display = 'none';
        showPaymentFailure();
    }
}

async function completeTransaction() {
    // Ensure userData is available
    if (!userData || !currentUser) {
        throw new Error('User data not loaded. Please refresh the page and try again.');
    }

    // Generate transaction ID
    const transactionId = 'TXN' + Date.now();
    const fpxTransactionId = 'FPX' + Math.random().toString(36).substr(2, 9).toUpperCase();

    // Create transaction record
    const transaction = {
        transactionId,
        buyerId: currentUser.uid,
        buyerName: userData.fullName || 'Unknown',
        buyerEmail: userData.email || currentUser.email,
        items: paymentItems,
        amount: paymentTotal,
        basePrice: paymentItems.reduce((sum, item) => sum + item.bookDetails.price, 0),
        commissionFee: paymentTotal - paymentItems.reduce((sum, item) => sum + item.bookDetails.price, 0),
        status: 'completed',
        fpxTransactionId,
        selectedBank,
        createdAt: Date.now(),
        meetingLocation: paymentItems[0]?.bookDetails?.campusLocation || 'To Be Determined',
        meetingDate: Date.now() + 86400000, // Tomorrow
        // Delivery tracking fields
        deliveryStatus: 'pending',
        expectedDeliveryDate: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days from now
        actualDeliveryDate: null,
        deliveryConfirmedBy: null,
        disputeCreatedAt: null
    };

    // Save transaction
    await database.ref(`transactions/${transactionId}`).set(transaction);

    // Mark sold books as 'sold' instead of deleting them
    for (const item of paymentItems) {
        try {
            await database.ref(`books/${item.bookDetails.id}`).update({
                status: 'sold',
                soldAt: Date.now(),
                buyerId: currentUser.uid
            });
        } catch (error) {
            console.warn(`Failed to update status for book ${item.bookDetails.id}:`, error);
        }
    }

    // Update user statistics with error handling
    try {
        // First, read the current user data to ensure we have permission
        const userSnapshot = await database.ref(`users/${currentUser.uid}`).once('value');
        const currentUserData = userSnapshot.val();

        if (currentUserData) {
            await database.ref(`users/${currentUser.uid}`).update({
                totalPurchases: (currentUserData.totalPurchases || 0) + paymentItems.length
            });
        }
    } catch (error) {
        console.warn('Failed to update buyer statistics:', error);
        // Don't throw - this is not critical for payment completion
    }

    // Update seller statistics with error handling
    for (const item of paymentItems) {
        try {
            const sellerRef = database.ref(`users/${item.bookDetails.sellerId}`);
            const sellerSnapshot = await sellerRef.once('value');
            const sellerData = sellerSnapshot.val();

            if (sellerData) {
                await sellerRef.update({
                    totalSales: (sellerData.totalSales || 0) + 1
                });
            }
        } catch (error) {
            console.warn(`Failed to update seller statistics for ${item.bookDetails.sellerId}:`, error);
            // Don't throw - this is not critical for payment completion
        }
    }

    // Clear cart
    await Cart.clear();

    return transactionId;
}

function showPaymentSuccess(transactionId) {
    const resultModal = document.getElementById('paymentResultModal');
    const resultDiv = document.getElementById('paymentResult');

    resultDiv.innerHTML = `
        <div class="text-center">
            <i class="fas fa-check-circle" style="font-size: 4rem; color: var(--success); margin-bottom: 1rem;"></i>
            <h3>Payment Successful!</h3>
            <p>Your payment has been processed successfully.</p>
            <p>You will be redirected to the receipt page shortly.</p>
        </div>
    `;

    resultModal.style.display = 'flex';

    // Redirect after 2 seconds
    setTimeout(() => {
        window.location.href = `receipt.html?txn=${transactionId}`;
    }, 2000);
}

function showPaymentFailure() {
    const resultModal = document.getElementById('paymentResultModal');
    const resultDiv = document.getElementById('paymentResult');

    resultDiv.innerHTML = `
        <div class="text-center">
            <i class="fas fa-times-circle" style="font-size: 4rem; color: var(--error); margin-bottom: 1rem;"></i>
            <h3>Payment Failed</h3>
            <p>Your payment could not be processed. Please try again.</p>
            <div class="modal-actions" style="justify-content: center; margin-top: 2rem;">
                <button class="btn btn-secondary" onclick="document.getElementById('paymentResultModal').style.display='none'">Close</button>
                <button class="btn btn-primary" onclick="window.location.href='payment.html'">Try Again</button>
            </div>
        </div>
    `;

    resultModal.style.display = 'flex';
}
