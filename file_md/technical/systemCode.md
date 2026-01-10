# UiTM Book e-Marketplace - System Code Reference

> Complete code documentation for core system functionality

---

## Table of Contents
1. [System Constants](#1-system-constants)
2. [Authentication](#2-authentication)
3. [Counter-Offer Validation](#3-counter-offer-validation)
4. [Payment & Escrow](#4-payment--escrow)
5. [7-Day Warranty System](#5-7-day-warranty-system)
6. [Auto-Payout System](#6-auto-payout-system)
7. [Auto-Dispute System](#7-auto-dispute-system)
8. [Return Flow](#8-return-flow)
9. [Chat Rate Limiting](#9-chat-rate-limiting)
10. [Utility Functions](#10-utility-functions)
11. [Firebase Security Rules](#11-firebase-security-rules)
12. [Shopping Cart System](#12-shopping-cart-system)
13. [Books Module (CRUD)](#13-books-module-crud-operations)
14. [Image Upload (ImageBB)](#14-image-upload-imagebb)
15. [Notification System](#15-notification-system)
16. [Feedback System](#16-feedback-system)
17. [Make Offer System](#17-make-offer-system)
18. [Admin Dashboard Charts](#18-admin-dashboard-charts-chartjs)
19. [PDF Receipt Generation](#19-pdf-receipt-generation-jspdf)
20. [Admin Dispute Resolution](#20-admin-dispute-resolution)

---

## 1. System Constants

**File:** `assets/js/firebase-config.js`

```javascript
// Commission Rate (10% fee on all transactions)
const COMMISSION_RATE = 0.10;

// Transaction Status Constants
const TRANSACTION_STATUS = {
    PENDING_PAYMENT: 'pending_payment',
    PAYMENT_HELD: 'payment_held',
    DELIVERED: 'delivered',
    WARRANTY_CLAIMED: 'warranty_claimed',
    RETURN_SENT: 'return_sent',
    RETURN_RECEIVED: 'return_received',
    COMPLETED: 'completed',
    DISPUTE_OPEN: 'dispute_open',
    REFUNDED: 'refunded',
    CANCELLED: 'cancelled'
};

// Warranty & Auto-Release Timers (7 days)
const WARRANTY_PERIOD_DAYS = 7;
const WARRANTY_PERIOD_MS = WARRANTY_PERIOD_DAYS * 24 * 60 * 60 * 1000;

const AUTO_RELEASE_DAYS = 7;
const AUTO_RELEASE_MS = AUTO_RELEASE_DAYS * 24 * 60 * 60 * 1000;

// Admin Emails
const ADMIN_EMAILS = [
    "admin@student.uitm.edu.my",
    "admin@staff.uitm.edu.my"
];
```

---

## 2. Authentication

### UiTM Email Validation
**File:** `assets/js/firebase-config.js`

```javascript
function validateUitmEmail(email) {
    const allowedDomains = ['@student.uitm.edu.my', '@staff.uitm.edu.my'];
    return allowedDomains.some(domain => email.endsWith(domain));
}
```

### Login ID Format Detection
**File:** `assets/js/auth.js`

```javascript
// Detect user type from ID format
if (userId.length === 10 && /^\d+$/.test(userId)) {
    // 10-digit number = Student
    emailDomain = '@student.uitm.edu.my';
    email = userId + emailDomain;
} else if (userId.length === 6) {
    // 6-digit = Staff
    emailDomain = '@staff.uitm.edu.my';
    email = userId + emailDomain;
} else if (userId.toLowerCase() === 'admin') {
    // Admin login
    email = 'admin@student.uitm.edu.my';
}
```

### Auto-Create Admin
**File:** `assets/js/auth.js`

```javascript
if (isAdminLogin && password === 'admin123') {
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(
            'admin@student.uitm.edu.my', 
            'admin123'
        );
        
        await database.ref('users/' + userCredential.user.uid).set({
            email: 'admin@student.uitm.edu.my',
            fullName: 'System Administrator',
            role: 'admin',
            createdAt: Date.now()
        });
    } catch (signupError) {
        // Handle if already exists
    }
}
```

### Admin Check Function
**File:** `assets/js/firebase-config.js`

```javascript
function isAdmin() {
    if (!userData) return false;
    return userData.role === 'admin' || ADMIN_EMAILS.includes(userData.email);
}

async function requireAdmin() {
    await waitForAuth();
    if (!currentUser) throw new Error('Not authenticated');

    const snapshot = await database.ref(`users/${currentUser.uid}`).once('value');
    const userData = snapshot.val();

    if (!userData || (userData.role !== 'admin' && !ADMIN_EMAILS.includes(userData.email))) {
        window.location.href = '../index.html';
        throw new Error('Not authorized');
    }
    return currentUser;
}
```

---

## 3. Counter-Offer Validation

**File:** `assets/js/chat.js`

```javascript
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const price = parseFloat(priceInput.value);
    priceError.style.display = 'none';

    // VALIDATION 1: Price must be positive
    if (isNaN(price) || price <= 0) {
        priceError.textContent = 'Please enter a valid price greater than RM 0.00';
        priceError.style.display = 'block';
        return;
    }

    // VALIDATION 2: Cannot exceed 10x original price
    const maxPrice = currentOffer.bookPrice * 10;
    if (price > maxPrice) {
        priceError.textContent = `Price cannot exceed ${formatCurrency(maxPrice)} (10x the original price)`;
        priceError.style.display = 'block';
        return;
    }

    // VALIDATION 3: Must differ by at least RM 0.50
    const priceDiff = Math.abs(price - currentOffer.currentPrice);
    if (priceDiff < 0.50) {
        priceError.textContent = 'Counter-offer must differ by at least RM 0.50';
        priceError.style.display = 'block';
        return;
    }

    // Submit counter-offer
    await database.ref(`offers/${currentOfferId}`).update({
        currentPrice: price,
        status: 'counter_offered',
        lastActionBy: currentUser.uid,
        updatedAt: Date.now()
    });

    await addSystemMessage(`${userData.fullName} sent a counter-offer of ${formatCurrency(price)}`);
    
    const otherUserId = currentUser.uid === currentOffer.buyerId 
        ? currentOffer.sellerId : currentOffer.buyerId;
    await sendNotification(otherUserId, 'counter_offer', 
        `${userData.fullName} sent a counter-offer of ${formatCurrency(price)}`);
});
```

---

## 4. Payment & Escrow

### FPX Payment Simulation (90% Success Rate)
**File:** `assets/js/payment.js`

```javascript
async function processPayment() {
    // Validate book availability first
    const { unavailableBooks, availableItems } = await validateBookAvailability();
    
    if (unavailableBooks.length > 0) {
        showNotification(`Books no longer available: ${unavailableBooks.join(', ')}`, "error");
        return;
    }

    processingModal.style.display = 'flex';
    await new Promise(resolve => setTimeout(resolve, 3000)); // 3-sec delay

    // 90% success rate simulation
    const isSuccess = Math.random() < 0.9;

    if (isSuccess) {
        const transactionId = await completeTransaction();
        showPaymentSuccess(transactionId);
    } else {
        // Record failed transaction for analytics
        const failedTransactionId = 'TXN' + Date.now();
        await database.ref(`transactions/${failedTransactionId}`).set({
            transactionId: failedTransactionId,
            buyerId: currentUser.uid,
            status: 'failed',
            failureReason: 'FPX payment processing failed',
            createdAt: Date.now()
        });
        showPaymentFailure();
    }
}
```

### Create Transaction with Escrow
**File:** `assets/js/payment.js`

```javascript
async function completeTransaction() {
    const transactionId = 'TXN' + Date.now();
    const fpxTransactionId = 'FPX' + Math.random().toString(36).substr(2, 9).toUpperCase();

    const transaction = {
        transactionId,
        buyerId: currentUser.uid,
        buyerName: userData.fullName,
        buyerEmail: userData.email,
        items: paymentItems,
        amount: paymentTotal,
        basePrice: paymentItems.reduce((sum, item) => sum + item.bookDetails.price, 0),
        commissionFee: paymentTotal - paymentItems.reduce((sum, item) => sum + item.bookDetails.price, 0),
        
        // ESCROW STATUS
        status: 'payment_held',
        escrowHeldAt: Date.now(),
        autoReleaseAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
        sellerPaidOut: false,
        
        // Delivery tracking
        deliveryStatus: 'pending',
        expectedDeliveryDate: Date.now() + (7 * 24 * 60 * 60 * 1000),
        fpxTransactionId,
        selectedBank,
        createdAt: Date.now()
    };

    await database.ref(`transactions/${transactionId}`).set(transaction);

    // Mark books as sold
    for (const item of paymentItems) {
        await database.ref(`books/${item.bookDetails.id}`).update({
            status: 'sold',
            soldAt: Date.now(),
            buyerId: currentUser.uid
        });
    }

    // Update seller's pending escrow
    for (const item of paymentItems) {
        const sellerWalletRef = database.ref(`users/${item.bookDetails.sellerId}/wallet`);
        const wallet = (await sellerWalletRef.once('value')).val() || {};
        await sellerWalletRef.update({
            pendingEscrow: (wallet.pendingEscrow || 0) + item.bookDetails.price
        });
    }

    return transactionId;
}
```

### Commission Calculation
```javascript
// Commission calculation example
const COMMISSION_RATE = 0.10;  // 10%

const bookPrice = 50.00;
const commission = bookPrice * COMMISSION_RATE;  // RM 5.00
const buyerPays = bookPrice + commission;        // RM 55.00
const sellerReceives = bookPrice - commission;   // RM 45.00
```

---

## 5. 7-Day Warranty System

### Confirm Order Received (Starts Warranty)
**File:** `assets/js/profile.js`

```javascript
async function confirmOrderReceived(transactionId) {
    const txnSnapshot = await database.ref(`transactions/${transactionId}`).once('value');
    const txn = txnSnapshot.val();
    if (!txn) throw new Error('Transaction not found');

    const now = Date.now();
    const warrantyExpiresAt = now + WARRANTY_PERIOD_MS; // 7 days from now

    // Update to DELIVERED status - warranty period starts
    // NOTE: Seller is NOT paid yet!
    await database.ref(`transactions/${transactionId}`).update({
        status: 'delivered',
        deliveryStatus: 'received',
        actualDeliveryDate: now,
        deliveryConfirmedBy: currentUser.uid,
        warrantyExpiresAt: warrantyExpiresAt,
        sellerPaidOut: false,
        payoutScheduledAt: warrantyExpiresAt
    });

    showNotification("Order confirmed! You have 7 days to claim warranty.", "success");
}
```

### Claim Warranty (Within 7 Days)
**File:** `assets/js/profile.js`

```javascript
async function claimWarranty(transactionId) {
    const txnSnapshot = await database.ref(`transactions/${transactionId}`).once('value');
    const txn = txnSnapshot.val();

    if (!txn) throw new Error('Transaction not found');
    if (txn.status !== 'delivered') throw new Error('Order not in delivered status');

    // Check warranty expiry
    const now = Date.now();
    if (now > txn.warrantyExpiresAt) {
        throw new Error('Warranty period has expired (7 days)');
    }

    // Show warranty claim modal
    document.getElementById('reportTransactionId').value = transactionId;
    document.getElementById('reportIssueModal').style.display = 'flex';
}
```

### Submit Warranty Claim
**File:** `assets/js/profile.js`

```javascript
document.getElementById('reportIssueForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const transactionId = document.getElementById('reportTransactionId').value;
    const issueType = document.querySelector('input[name="issueType"]:checked').value;
    const description = document.getElementById('issueDescription').value;

    const txnSnapshot = await database.ref(`transactions/${transactionId}`).once('value');
    const txn = txnSnapshot.val();

    // Update transaction status
    await database.ref(`transactions/${transactionId}`).update({
        status: 'warranty_claimed',
        warrantyClaim: {
            type: issueType,
            description: description,
            claimedAt: Date.now(),
            claimedBy: currentUser.uid
        }
    });

    // Freeze seller's funds
    for (const item of txn.items) {
        const sellerWalletRef = database.ref(`users/${item.bookDetails.sellerId}/wallet`);
        const wallet = (await sellerWalletRef.once('value')).val() || {};
        
        await sellerWalletRef.update({
            pendingEscrow: Math.max(0, (wallet.pendingEscrow || 0) - item.bookDetails.price),
            frozenDispute: (wallet.frozenDispute || 0) + item.bookDetails.price
        });
    }

    // Notify admin
    await sendAdminNotification('admin_dispute', 
        `🚨 Warranty Claim: Order #${transactionId.substring(0, 8)}`,
        { transactionId, issueType, description }, 'high');

    showNotification("Warranty claim submitted. Admin will review your case.", "success");
});
```

---

## 6. Auto-Payout System

**File:** `assets/js/firebase-config.js`

```javascript
let autoPayoutRunning = false;

async function checkAndProcessAutoPayouts() {
    if (autoPayoutRunning) return;
    autoPayoutRunning = true;

    try {
        // Get all transactions in "delivered" status
        const snapshot = await database.ref('transactions')
            .orderByChild('status')
            .equalTo('delivered')
            .once('value');

        if (!snapshot.exists()) return;

        const now = Date.now();
        const promises = [];

        snapshot.forEach(childSnapshot => {
            const txn = childSnapshot.val();
            const txnId = childSnapshot.key;

            // Check if warranty expired
            if (txn.payoutScheduledAt && txn.payoutScheduledAt <= now) {
                if (txn.warrantyClaimDismissed === false) return; // Skip if claimed
                promises.push(processAutoPayout(txnId, txn));
            }
        });

        if (promises.length > 0) {
            await Promise.all(promises);
        }
    } finally {
        autoPayoutRunning = false;
    }
}

async function processAutoPayout(transactionId, txn) {
    const amount = txn.amount || txn.basePrice || 0;
    const commission = amount * COMMISSION_RATE;
    const sellerPayout = amount - commission;

    const sellerId = txn.items?.[0]?.bookDetails?.sellerId;
    if (!sellerId) return;

    // 1. Update transaction to completed
    await database.ref(`transactions/${transactionId}`).update({
        status: 'completed',
        autoPayoutProcessed: true,
        payoutProcessedAt: Date.now(),
        sellerPayoutAmount: sellerPayout,
        commissionAmount: commission
    });

    // 2. Update seller wallet
    const sellerWalletRef = database.ref(`users/${sellerId}/wallet`);
    const wallet = (await sellerWalletRef.once('value')).val() || {};

    await sellerWalletRef.update({
        balance: (wallet.balance || 0) + sellerPayout,
        pendingEscrow: Math.max(0, (wallet.pendingEscrow || 0) - amount),
        totalEarned: (wallet.totalEarned || 0) + sellerPayout
    });

    // 3. Notify seller
    await database.ref('notifications').push({
        recipientId: sellerId,
        type: 'payout_received',
        message: `💰 You received RM${sellerPayout.toFixed(2)} (10% commission deducted)`,
        transactionId,
        read: false,
        createdAt: Date.now()
    });
}

// Run on auth ready
auth.onAuthStateChanged(async (user) => {
    if (user) {
        setTimeout(() => checkAndProcessAutoPayouts(), 3000);
    }
});
```

---

## 7. Auto-Dispute System

**File:** `assets/js/profile.js`

```javascript
async function checkForAutoDisputes() {
    const snapshot = await database.ref('transactions').once('value');
    const now = Date.now();
    const updates = {};
    const disputedTransactions = [];

    snapshot.forEach(childSnapshot => {
        const transaction = childSnapshot.val();
        const transactionId = childSnapshot.key;

        // Check if pending and past 7-day expected delivery
        if (transaction.deliveryStatus === 'pending' && transaction.expectedDeliveryDate) {
            if (now > transaction.expectedDeliveryDate) {
                updates[`transactions/${transactionId}/deliveryStatus`] = 'disputed';
                updates[`transactions/${transactionId}/disputeCreatedAt`] = now;
                updates[`transactions/${transactionId}/disputeReason`] = 
                    'Buyer did not confirm receipt within 7 days';

                disputedTransactions.push({
                    transactionId,
                    buyerId: transaction.buyerId,
                    amount: transaction.amount
                });
            }
        }
    });

    // Notify admin
    for (const dispute of disputedTransactions) {
        await sendAdminNotification('admin_dispute',
            `🚨 Auto-Dispute: Order #${dispute.transactionId.substring(0, 8)} expired`,
            { transactionId: dispute.transactionId, reason: '7 days unconfirmed' },
            'high');
    }

    if (Object.keys(updates).length > 0) {
        await database.ref().update(updates);
    }
}
```

---

## 8. Return Flow

### Buyer: Confirm Return Sent
**File:** `assets/js/profile.js`

```javascript
async function confirmReturnSent(transactionId) {
    const txnSnapshot = await database.ref(`transactions/${transactionId}`).once('value');
    const txn = txnSnapshot.val();

    await database.ref(`transactions/${transactionId}`).update({
        status: 'return_sent',
        returnSentAt: Date.now(),
        returnSentBy: currentUser.uid
    });

    // Notify seller
    for (const item of txn.items) {
        await database.ref('notifications').push({
            recipientId: item.bookDetails.sellerId,
            type: 'return_sent',
            message: `📦 ${userData.fullName} sent back "${item.bookDetails.title}"`,
            transactionId,
            read: false,
            createdAt: Date.now()
        });
    }

    showNotification("Return confirmed! Please meet seller to handover book.", "success");
}
```

### Seller: Confirm Return Received
**File:** `assets/js/profile.js`

```javascript
async function confirmReturnReceived(transactionId) {
    await database.ref(`transactions/${transactionId}`).update({
        status: 'return_received',
        returnReceivedAt: Date.now(),
        returnReceivedBy: currentUser.uid
    });

    const txnSnapshot = await database.ref(`transactions/${transactionId}`).once('value');
    const txn = txnSnapshot.val();

    // Notify admin - ready for refund
    await sendAdminNotification('admin_dispute',
        `✅ Return Confirmed: Order #${transactionId.substring(0, 8)} ready for refund`,
        { transactionId, action: 'ready_for_refund' },
        'high');

    // Notify buyer
    await database.ref('notifications').push({
        recipientId: txn.buyerId,
        type: 'return_received',
        message: `✅ Seller confirmed receiving your returned book. Admin will process refund.`,
        transactionId,
        read: false,
        createdAt: Date.now()
    });

    showNotification("Return confirmed! Admin will process refund.", "success");
}
```

### Admin: Resolve Dispute
**File:** `assets/js/admin.js`

```javascript
async function resolveDisputeForBuyer(transactionId) {
    const txnSnapshot = await database.ref(`transactions/${transactionId}`).once('value');
    const txn = txnSnapshot.val();

    // 1. Refund buyer
    const buyerWalletRef = database.ref(`users/${txn.buyerId}/wallet`);
    const buyerWallet = (await buyerWalletRef.once('value')).val() || {};
    await buyerWalletRef.update({
        balance: (buyerWallet.balance || 0) + txn.amount
    });

    // 2. Remove from seller's frozen funds
    for (const item of txn.items) {
        const sellerWalletRef = database.ref(`users/${item.bookDetails.sellerId}/wallet`);
        const sellerWallet = (await sellerWalletRef.once('value')).val() || {};
        await sellerWalletRef.update({
            frozenDispute: Math.max(0, (sellerWallet.frozenDispute || 0) - item.bookDetails.price)
        });
    }

    // 3. Update transaction
    await database.ref(`transactions/${transactionId}`).update({
        status: 'refunded',
        disputeResolvedAt: Date.now(),
        disputeResolution: 'refund_buyer'
    });
}

async function resolveDisputeForSeller(transactionId) {
    const txnSnapshot = await database.ref(`transactions/${transactionId}`).once('value');
    const txn = txnSnapshot.val();

    // 1. Pay seller (minus commission)
    for (const item of txn.items) {
        const sellerWalletRef = database.ref(`users/${item.bookDetails.sellerId}/wallet`);
        const sellerWallet = (await sellerWalletRef.once('value')).val() || {};
        
        const commission = item.bookDetails.price * COMMISSION_RATE;
        const payout = item.bookDetails.price - commission;
        
        await sellerWalletRef.update({
            frozenDispute: Math.max(0, (sellerWallet.frozenDispute || 0) - item.bookDetails.price),
            balance: (sellerWallet.balance || 0) + payout,
            totalEarned: (sellerWallet.totalEarned || 0) + payout
        });
    }

    // 2. Update transaction
    await database.ref(`transactions/${transactionId}`).update({
        status: 'completed',
        disputeResolvedAt: Date.now(),
        disputeResolution: 'pay_seller'
    });
}
```

---

## 9. Chat Rate Limiting

**File:** `assets/js/chat.js`

```javascript
const MESSAGE_COOLDOWN = 2000; // 2 seconds
let lastMessageTime = 0;

async function sendMessage() {
    const now = Date.now();
    
    // Rate limiting check
    if (now - lastMessageTime < MESSAGE_COOLDOWN) {
        const remaining = Math.ceil((MESSAGE_COOLDOWN - (now - lastMessageTime)) / 1000);
        showNotification(`Please wait ${remaining} second(s)`, "warning");
        return;
    }
    
    lastMessageTime = now;
    
    // Send message...
    const messageData = {
        senderId: currentUser.uid,
        senderName: userData.fullName,
        text: messageText,
        type: 'text',
        timestamp: Date.now()
    };
    
    await database.ref(`chats/${currentOfferId}/messages`).push(messageData);
}
```

---

## 10. Utility Functions

**File:** `assets/js/firebase-config.js`

```javascript
// Format currency
function formatCurrency(amount) {
    return `RM ${parseFloat(amount).toFixed(2)}`;
}

// Format date
function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-MY', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Show notification toast
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 
                        type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

// Wait for Firebase auth
function waitForAuth() {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("Auth timeout")), 10000);
        
        auth.onAuthStateChanged((user) => {
            clearTimeout(timeout);
            if (user) {
                currentUser = user;
                database.ref(`users/${user.uid}`).once('value')
                    .then(snapshot => {
                        userData = snapshot.val();
                        resolve();
                    });
            } else {
                reject(new Error("Not authenticated"));
            }
        });
    });
}
```

**File:** `assets/js/utils.js`

```javascript
// XSS Prevention
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Debounce for search
function debounce(fn, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
}

// Validate UiTM email
function isValidUitmEmail(email) {
    return email.endsWith('@student.uitm.edu.my') || 
           email.endsWith('@staff.uitm.edu.my');
}
```

---

## 11. Firebase Security Rules

**File:** `config/firebase-rules.json`

```json
{
  "rules": {
    "users": {
      ".read": "auth != null",
      "$uid": {
        ".write": "auth != null && (auth.uid == $uid || root.child('users/' + auth.uid + '/role').val() == 'admin')"
      }
    },
    
    "books": {
      ".read": "auth != null",
      "$bookId": {
        ".write": "auth != null && (!data.exists() || data.child('sellerId').val() == auth.uid || root.child('users/' + auth.uid + '/role').val() == 'admin' || (newData.child('status').val() == 'sold' && data.child('status').val() == 'available'))"
      }
    },
    
    "transactions": {
      ".read": "auth != null",
      "$txnId": {
        ".write": "auth != null"
      }
    },
    
    "offers": {
      "$offerId": {
        ".read": "auth != null && (data.child('buyerId').val() == auth.uid || data.child('sellerId').val() == auth.uid || root.child('users/' + auth.uid + '/role').val() == 'admin')",
        ".write": "auth != null && (data.child('buyerId').val() == auth.uid || data.child('sellerId').val() == auth.uid || !data.exists())"
      }
    },
    
    "chats": {
      "$offerId": {
        ".read": "auth != null && (root.child('offers/' + $offerId + '/buyerId').val() == auth.uid || root.child('offers/' + $offerId + '/sellerId').val() == auth.uid)",
        ".write": "auth != null && (root.child('offers/' + $offerId + '/buyerId').val() == auth.uid || root.child('offers/' + $offerId + '/sellerId').val() == auth.uid)"
      }
    },
    
    "notifications": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    
    "feedback": {
      ".read": "auth != null && root.child('users/' + auth.uid + '/role').val() == 'admin'",
      ".write": "auth != null"
    }
  }
}
```

---

---

## 12. Shopping Cart System

**File:** `assets/js/app.js`

```javascript
const Cart = {
    // Get cart for current user
    async getCart() {
        await waitForAuth();
        if (!currentUser) throw new Error("User not authenticated");
        
        const snapshot = await database.ref(`carts/${currentUser.uid}`).once('value');
        return snapshot.val() || { items: {}, totalItems: 0 };
    },

    // Add item to cart
    async addItem(bookId, bookDetails, quantity = 1) {
        await waitForAuth();
        if (!currentUser) throw new Error("User not authenticated");

        const cartRef = database.ref(`carts/${currentUser.uid}`);
        const snapshot = await cartRef.once('value');
        let cart = snapshot.val();

        let newCart = { items: {}, totalItems: 0 };
        if (cart && typeof cart === 'object') {
            if (cart.items) newCart.items = { ...cart.items };
            if (typeof cart.totalItems === 'number') newCart.totalItems = cart.totalItems;
        }

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
    },

    // Remove item from cart
    async removeItem(bookId) {
        await waitForAuth();
        if (!currentUser) throw new Error("User not authenticated");

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
    },

    // Clear cart
    async clear() {
        await waitForAuth();
        if (!currentUser) throw new Error("User not authenticated");
        
        await database.ref(`carts/${currentUser.uid}`).set({
            items: {},
            totalItems: 0
        });
        updateCartCount();
    },

    // Calculate cart total with commission
    async calculateTotal() {
        const cart = await this.getCart();
        let subtotal = 0;

        Object.values(cart.items).forEach(item => {
            subtotal += item.bookDetails.price * item.quantity;
        });

        const commission = subtotal * COMMISSION_RATE;
        const total = subtotal + commission;

        return { subtotal, commission, total, itemCount: cart.totalItems };
    }
};

// Update cart count badge
async function updateCartCount() {
    if (!currentUser) return;
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
}
```

---

## 13. Books Module (CRUD Operations)

**File:** `assets/js/app.js`

```javascript
const Books = {
    // Get all books with filters
    async getBooks(filters = {}) {
        let query = database.ref('books').orderByChild('createdAt');
        const snapshot = await query.once('value');
        let books = [];

        snapshot.forEach((childSnapshot) => {
            const book = childSnapshot.val();
            book.id = childSnapshot.key;
            
            // Filter out sold books
            if (book.status !== 'sold') {
                books.push(book);
            }
        });

        // Apply search filter
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            books = books.filter(book =>
                book.title.toLowerCase().includes(searchLower) ||
                book.author.toLowerCase().includes(searchLower) ||
                (book.subjectCode && book.subjectCode.toLowerCase().includes(searchLower))
            );
        }

        // Apply price filters
        if (filters.minPrice !== undefined) {
            books = books.filter(book => book.price >= filters.minPrice);
        }
        if (filters.maxPrice !== undefined) {
            books = books.filter(book => book.price <= filters.maxPrice);
        }

        // Apply campus filter
        if (filters.campusLocation) {
            books = books.filter(book => book.campusLocation === filters.campusLocation);
        }

        // Sort books
        if (filters.sortBy) {
            switch (filters.sortBy) {
                case 'price-low': books.sort((a, b) => a.price - b.price); break;
                case 'price-high': books.sort((a, b) => b.price - a.price); break;
                case 'popular': books.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0)); break;
                default: books.sort((a, b) => b.createdAt - a.createdAt);
            }
        }

        return books;
    },

    // Add new book listing
    async addBook(bookData) {
        await waitForAuth();
        if (!currentUser) throw new Error("User not authenticated");

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
        return { success: true, bookId: newBookRef.key };
    },

    // Update book
    async updateBook(bookId, updates) {
        await waitForAuth();
        if (!currentUser) throw new Error("User not authenticated");
        await database.ref(`books/${bookId}`).update(updates);
        return { success: true };
    },

    // Delete book
    async deleteBook(bookId) {
        await waitForAuth();
        if (!currentUser) throw new Error("User not authenticated");
        await database.ref(`books/${bookId}`).remove();
        return { success: true };
    },

    // Increment view count (once per session)
    async incrementViewCount(bookId) {
        const viewedBooksKey = 'viewedBooks';
        let viewedBooks = JSON.parse(sessionStorage.getItem(viewedBooksKey) || '[]');

        if (viewedBooks.includes(bookId)) return; // Already viewed

        const bookRef = database.ref(`books/${bookId}`);
        const snapshot = await bookRef.once('value');
        const book = snapshot.val();

        if (book) {
            await bookRef.update({ viewCount: (book.viewCount || 0) + 1 });
            viewedBooks.push(bookId);
            sessionStorage.setItem(viewedBooksKey, JSON.stringify(viewedBooks));
        }
    }
};
```

---

## 14. Image Upload (ImageBB)

**File:** `assets/js/app.js`

```javascript
const IMGBB_API_KEY = "b24ce74b671a4227c2e7132c4509376e";
const IMGBB_UPLOAD_URL = "https://api.imgbb.com/1/upload";

// Upload single image to ImageBB
async function uploadImageToImgBB(imageFile) {
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
}

// Upload multiple images (max 5)
async function uploadMultipleImages(files) {
    const uploadPromises = Array.from(files)
        .slice(0, 5)  // Limit to 5 images
        .map(file => uploadImageToImgBB(file));
    return Promise.all(uploadPromises);
}
```

---

## 15. Notification System

**File:** `assets/js/notifications.js`

```javascript
let notificationListener = null;
let unreadNotificationCount = 0;

function initNotificationSystem() {
    if (!currentUser) return;
    setupBellClickHandler();
    setupFirebaseListener();
    setupOutsideClickHandler();
}

// Firebase real-time listener
function setupFirebaseListener() {
    if (notificationListener) notificationListener.off();

    notificationListener = firebase.database()
        .ref('notifications')
        .orderByChild('recipientId')
        .equalTo(currentUser.uid);

    notificationListener.on('value', (snapshot) => {
        handleNotificationUpdate(snapshot);
    });
}

function handleNotificationUpdate(snapshot) {
    const notifications = [];
    snapshot.forEach((childSnapshot) => {
        notifications.push({ id: childSnapshot.key, ...childSnapshot.val() });
    });

    // Filter for admin users
    let filtered = notifications;
    if (userData && userData.role === 'admin') {
        filtered = notifications.filter(n => n.type === 'admin_dispute');
    }

    filtered.sort((a, b) => b.createdAt - a.createdAt);

    const newUnreadCount = filtered.filter(n => !n.read).length;

    // Play sound for new notifications
    if (newUnreadCount > unreadNotificationCount && unreadNotificationCount > 0) {
        playNotificationSound();
    }

    unreadNotificationCount = newUnreadCount;
    updateNotificationBadge(newUnreadCount);
    updateNotificationList(filtered);
}

// Update badge count
function updateNotificationBadge(count) {
    const badge = document.getElementById('notificationBadge');
    if (!badge) return;

    if (count > 0) {
        badge.style.display = 'block';
        badge.textContent = count > 99 ? '99+' : count;
    } else {
        badge.style.display = 'none';
    }
}

// Mark notification as read
async function handleNotificationClick(notifId, type, offerId, bookId) {
    await firebase.database().ref(`notifications/${notifId}`).update({ read: true });

    const isInPagesDir = window.location.pathname.includes('/pages/');
    const basePath = isInPagesDir ? '' : 'pages/';

    // Navigate based on type
    if (type.includes('offer') || type === 'message') {
        if (offerId) window.location.href = `${basePath}chat.html?offerId=${offerId}`;
    } else if (type === 'payment' || type === 'delivery') {
        window.location.href = `${basePath}profile.html`;
    } else if (bookId) {
        window.location.href = `${basePath}book-details.html?id=${bookId}`;
    }
}

// Mark all as read
async function markAllAsRead() {
    if (!currentUser) return;

    const snapshot = await firebase.database()
        .ref('notifications')
        .orderByChild('recipientId')
        .equalTo(currentUser.uid)
        .once('value');

    const updates = {};
    snapshot.forEach((child) => {
        if (!child.val().read) {
            updates[`notifications/${child.key}/read`] = true;
        }
    });

    if (Object.keys(updates).length > 0) {
        await firebase.database().ref().update(updates);
    }
}

// Getting notification icon
function getNotificationIcon(type) {
    const icons = {
        'offer': 'handshake',
        'offer_accepted': 'check-circle',
        'offer_rejected': 'times-circle',
        'counter_offer': 'exchange-alt',
        'message': 'envelope',
        'payment': 'credit-card',
        'delivery': 'truck',
        'admin_dispute': 'gavel',
        'payout_received': 'money-bill-wave'
    };
    return icons[type] || 'bell';
}

// Time ago formatter
function formatTimeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(timestamp).toLocaleDateString();
}
```

---

## 16. Feedback System

**File:** `assets/js/app.js`

```javascript
const Feedback = {
    async submitFeedback(feedbackData) {
        if (!currentUser) throw new Error("User not authenticated");

        const feedback = {
            ...feedbackData,
            buyerId: currentUser.uid,
            buyerName: userData.fullName,
            createdAt: Date.now(),
            status: 'pending'
        };

        await database.ref('feedback').push(feedback);
        return { success: true, message: "Feedback submitted!" };
    }
};
```

**File:** `assets/js/profile.js` - Feedback Modal

```javascript
async function showFeedbackModal(transactionId, type, prefilledReason) {
    const modal = document.getElementById('feedbackModal');
    if (!modal) return;

    document.getElementById('feedbackTransactionId').value = transactionId;
    document.getElementById('feedbackType').value = type;
    
    if (prefilledReason) {
        document.getElementById('feedbackComment').value = prefilledReason;
    }

    modal.style.display = 'flex';
}

// Star rating click handler
function setupStarRating() {
    const stars = document.querySelectorAll('.star-rating i');
    let selectedRating = 0;

    stars.forEach((star, index) => {
        star.addEventListener('click', () => {
            selectedRating = index + 1;
            stars.forEach((s, i) => {
                s.classList.toggle('active', i < selectedRating);
            });
            document.getElementById('feedbackRating').value = selectedRating;
        });
    });
}

// Submit feedback
document.getElementById('feedbackForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const transactionId = document.getElementById('feedbackTransactionId').value;
    const rating = parseInt(document.getElementById('feedbackRating').value);
    const type = document.getElementById('feedbackType').value;
    const comment = document.getElementById('feedbackComment').value;

    await Feedback.submitFeedback({
        transactionId,
        rating,
        type,
        comment
    });

    showNotification("Thank you for your feedback!", "success");
    document.getElementById('feedbackModal').style.display = 'none';
});
```

---

## 17. Make Offer System

**File:** `assets/js/book-details.js`

```javascript
// Setup Make Offer button
function setupMakeOfferButton() {
    const makeOfferBtn = document.getElementById('makeOfferBtn');
    if (!makeOfferBtn) return;

    makeOfferBtn.addEventListener('click', () => {
        document.getElementById('offerModal').style.display = 'flex';
        document.getElementById('originalPrice').textContent = formatCurrency(currentBook.price);
    });
}

// Submit offer
document.getElementById('offerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const offerPrice = parseFloat(document.getElementById('offerPrice').value);

    // Validation
    if (offerPrice <= 0) {
        showNotification("Please enter a valid offer price", "error");
        return;
    }

    if (offerPrice > currentBook.price * 10) {
        showNotification("Offer cannot exceed 10x the book price", "error");
        return;
    }

    try {
        // Create offer in Firebase
        const offerRef = database.ref('offers').push();
        const offer = {
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

        await offerRef.set(offer);

        // Create chat room
        await database.ref(`chats/${offerRef.key}`).set({
            participants: {
                [currentUser.uid]: true,
                [currentBook.sellerId]: true
            },
            lastMessage: `Offer of ${formatCurrency(offerPrice)} made`,
            lastMessageTimestamp: Date.now()
        });

        // Add system message
        await database.ref(`chats/${offerRef.key}/messages`).push({
            senderId: 'system',
            senderName: 'System',
            text: `${userData.fullName} made an offer of ${formatCurrency(offerPrice)} for "${currentBook.title}"`,
            type: 'system',
            timestamp: Date.now()
        });

        // Notify seller
        await database.ref('notifications').push({
            recipientId: currentBook.sellerId,
            senderId: currentUser.uid,
            senderName: userData.fullName,
            type: 'offer',
            message: `${userData.fullName} made an offer of ${formatCurrency(offerPrice)} for "${currentBook.title}"`,
            offerId: offerRef.key,
            bookId: currentBook.id,
            read: false,
            createdAt: Date.now()
        });

        showNotification("Offer sent! Redirecting to chat...", "success");
        
        setTimeout(() => {
            window.location.href = `chat.html?offerId=${offerRef.key}`;
        }, 1500);

    } catch (error) {
        console.error("Error creating offer:", error);
        showNotification("Failed to send offer", "error");
    }
});
```

---

## 18. Admin Dashboard Charts (Chart.js)

**File:** `assets/js/admin.js`

```javascript
// Chart instances (global for filter updates)
let salesChartInstance = null;
let revenueChartInstance = null;
let topBooksChartInstance = null;
let subjectChartInstance = null;

async function loadCharts() {
    if (typeof Chart === 'undefined') {
        console.error('[ADMIN] Chart.js is not loaded!');
        return;
    }

    // 1. SALES TREND CHART (Line Chart)
    const salesCtx = document.getElementById('salesChart');
    if (salesCtx) {
        const salesData = calculateSalesTrendWithFilter('all');
        salesChartInstance = new Chart(salesCtx.getContext('2d'), {
            type: 'line',
            data: {
                labels: salesData.labels,
                datasets: [{
                    label: 'Transactions',
                    data: salesData.data,
                    borderColor: '#005C99',
                    backgroundColor: 'rgba(0, 92, 153, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                scales: { y: { beginAtZero: true } }
            }
        });
    }

    // 2. REVENUE CHART (Bar Chart)
    const revenueCtx = document.getElementById('revenueChart');
    if (revenueCtx) {
        const revenueData = calculateRevenueWithFilter('all');
        revenueChartInstance = new Chart(revenueCtx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: revenueData.labels,
                datasets: [{
                    label: 'Revenue (RM)',
                    data: revenueData.data,
                    backgroundColor: '#00A86B'
                }]
            },
            options: {
                responsive: true,
                scales: { y: { beginAtZero: true } }
            }
        });
    }

    // 3. TOP BOOKS CHART (Horizontal Bar)
    const topBooksCtx = document.getElementById('topBooksChart');
    if (topBooksCtx) {
        const topBooksData = calculateTopBooks();
        topBooksChartInstance = new Chart(topBooksCtx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: topBooksData.labels,
                datasets: [{
                    label: 'Units Sold',
                    data: topBooksData.data,
                    backgroundColor: ['#005C99', '#00A86B', '#FFB81C', '#E91E63', '#9C27B0']
                }]
            },
            options: {
                indexAxis: 'y',  // Horizontal
                responsive: true
            }
        });
    }

    // 4. SUBJECT DISTRIBUTION (Pie Chart)
    const subjectCtx = document.getElementById('subjectChart');
    if (subjectCtx) {
        const subjectData = calculateSubjectDistribution();
        subjectChartInstance = new Chart(subjectCtx.getContext('2d'), {
            type: 'pie',
            data: {
                labels: subjectData.labels,
                datasets: [{
                    data: subjectData.data,
                    backgroundColor: ['#005C99', '#00A86B', '#FFB81C', '#E91E63', '#9C27B0']
                }]
            },
            options: { responsive: true }
        });
    }
}

// Calculate sales trend data
function calculateSalesTrendWithFilter(period) {
    const now = Date.now();
    let startDate = 0;
    
    switch(period) {
        case '7': startDate = now - (7 * 24 * 60 * 60 * 1000); break;
        case '30': startDate = now - (30 * 24 * 60 * 60 * 1000); break;
        case '90': startDate = now - (90 * 24 * 60 * 60 * 1000); break;
        default: startDate = 0; // All time
    }

    const filtered = allTransactions.filter(t => 
        t.status !== 'cancelled' && t.status !== 'failed' && t.createdAt >= startDate
    );

    // Group by date
    const grouped = {};
    filtered.forEach(txn => {
        const date = new Date(txn.createdAt).toLocaleDateString('en-MY', {
            month: 'short', day: 'numeric'
        });
        grouped[date] = (grouped[date] || 0) + 1;
    });

    return {
        labels: Object.keys(grouped),
        data: Object.values(grouped)
    };
}

// Calculate revenue data
function calculateRevenueWithFilter(period) {
    const now = Date.now();
    let startDate = 0;
    
    switch(period) {
        case '7': startDate = now - (7 * 24 * 60 * 60 * 1000); break;
        case '30': startDate = now - (30 * 24 * 60 * 60 * 1000); break;
        case '90': startDate = now - (90 * 24 * 60 * 60 * 1000); break;
    }

    const filtered = allTransactions.filter(t => 
        t.status !== 'cancelled' && t.status !== 'failed' && t.createdAt >= startDate
    );

    const grouped = {};
    filtered.forEach(txn => {
        const date = new Date(txn.createdAt).toLocaleDateString('en-MY', {
            month: 'short', day: 'numeric'
        });
        grouped[date] = (grouped[date] || 0) + (txn.commissionFee || 0);
    });

    return {
        labels: Object.keys(grouped),
        data: Object.values(grouped)
    };
}

// Calculate top selling books
function calculateTopBooks() {
    const bookSales = {};
    
    allTransactions
        .filter(t => t.status !== 'cancelled' && t.status !== 'failed')
        .forEach(txn => {
            txn.items?.forEach(item => {
                const title = item.bookDetails?.title || 'Unknown';
                bookSales[title] = (bookSales[title] || 0) + 1;
            });
        });

    const sorted = Object.entries(bookSales)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);  // Top 5

    return {
        labels: sorted.map(s => s[0].substring(0, 20) + '...'),
        data: sorted.map(s => s[1])
    };
}

// Calculate subject distribution
function calculateSubjectDistribution() {
    const subjects = {};
    
    allBooks.forEach(book => {
        const code = book.subjectCode || 'Unknown';
        subjects[code] = (subjects[code] || 0) + 1;
    });

    const sorted = Object.entries(subjects)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    return {
        labels: sorted.map(s => s[0]),
        data: sorted.map(s => s[1])
    };
}

// Setup chart filter dropdowns
function setupChartFilters() {
    document.querySelectorAll('.chart-filter').forEach(select => {
        select.addEventListener('change', (e) => {
            const chartId = e.target.dataset.chart;
            const period = e.target.value;

            if (chartId === 'sales' && salesChartInstance) {
                const newData = calculateSalesTrendWithFilter(period);
                salesChartInstance.data.labels = newData.labels;
                salesChartInstance.data.datasets[0].data = newData.data;
                salesChartInstance.update();
            }

            if (chartId === 'revenue' && revenueChartInstance) {
                const newData = calculateRevenueWithFilter(period);
                revenueChartInstance.data.labels = newData.labels;
                revenueChartInstance.data.datasets[0].data = newData.data;
                revenueChartInstance.update();
            }
        });
    });
}
```

---

## 19. Admin Dashboard: System Health

**File:** `assets/js/admin.js`

Displays a summary of key platform health metrics.

```javascript
async function loadSystemHealth() {
    try {
        // 1. Success Rate (completed + refunded vs total non-cancelled)
        const validTxns = allTransactions.filter(txn => txn.status !== 'cancelled');
        const completedTxns = allTransactions.filter(txn =>
            ['completed', 'refunded'].includes(txn.status)
        );
        const successRate = validTxns.length > 0
            ? ((completedTxns.length / validTxns.length) * 100).toFixed(0)
            : 0;
        document.getElementById('healthSuccessRate').textContent = `${successRate}%`;

        // 2. Average Rating (from feedback)
        const feedbackSnapshot = await database.ref('feedback').once('value');
        let totalRating = 0, ratingCount = 0;
        feedbackSnapshot.forEach(child => {
            const feedback = child.val();
            if (feedback.rating) { totalRating += feedback.rating; ratingCount++; }
        });
        const avgRating = ratingCount > 0 ? (totalRating / ratingCount).toFixed(1) : '--';
        document.getElementById('healthAvgRating').textContent = ratingCount > 0 ? `${avgRating} ⭐` : '--';

        // 3. Issue-Free Rate (transactions without warranty claims)
        const claimedTxns = allTransactions.filter(txn =>
            txn.warrantyClaimedAt || ['warranty_claimed', 'return_sent', 'return_received'].includes(txn.status)
        );
        const issueFreeRate = validTxns.length > 0
            ? (((validTxns.length - claimedTxns.length) / validTxns.length) * 100).toFixed(0)
            : 0;
        document.getElementById('healthClaimRate').textContent = `${issueFreeRate}%`;
    } catch (error) {
        console.error('[ADMIN] Error loading system health:', error);
    }
}
```

---

## 20. Admin Dashboard: Payout Queue

**File:** `assets/js/admin.js`

Displays transactions pending auto-payout with a live countdown timer.

```javascript
let payoutCountdownInterval = null;

async function loadPayoutQueue() {
    const tableBody = document.getElementById('payoutQueueTable');
    if (!tableBody) return;

    if (payoutCountdownInterval) clearInterval(payoutCountdownInterval);

    // Get transactions in warranty period (delivered status)
    const payoutQueue = allTransactions.filter(txn => txn.status === 'delivered');

    if (payoutQueue.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5">No pending payouts</td></tr>';
        return;
    }

    // Sort by expiry time (soonest first)
    payoutQueue.sort((a, b) => (a.payoutScheduledAt || Infinity) - (b.payoutScheduledAt || Infinity));

    tableBody.innerHTML = payoutQueue.map(txn => {
        const sellerName = txn.items?.[0]?.bookDetails?.sellerName || 'Unknown';
        const orderId = txn.transactionId || txn.id;
        const amount = (txn.basePrice || txn.amount || 0) * 0.9; // After 10% commission
        const expiresAt = txn.warrantyExpiresAt || txn.payoutScheduledAt;
        const countdownId = `countdown-${orderId.substring(0, 8)}`;
        return `
            <tr>
                <td>${sellerName}</td>
                <td><code>#${orderId.substring(0, 8)}</code></td>
                <td>RM ${amount.toFixed(2)}</td>
                <td><div id="${countdownId}" class="payout-countdown" data-expires="${expiresAt || 0}">--:--:--</div></td>
            </tr>
        `;
    }).join('');

    // Start live countdown updates
    updatePayoutCountdowns();
    payoutCountdownInterval = setInterval(updatePayoutCountdowns, 1000);
}

function updatePayoutCountdowns() {
    const countdowns = document.querySelectorAll('.payout-countdown');
    const now = Date.now();
    countdowns.forEach(el => {
        const expiresAt = parseInt(el.dataset.expires) || 0;
        const timeLeft = expiresAt - now;
        if (timeLeft <= 0) {
            el.innerHTML = '<span style="color: #22c55e;">✅ READY</span>';
        } else {
            const days = Math.floor(timeLeft / (24 * 60 * 60 * 1000));
            const hours = Math.floor((timeLeft % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
            const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
            const seconds = Math.floor((timeLeft % (60 * 1000)) / 1000);
            el.textContent = `${days}d ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    });
}
```

---

## 21. Admin Dashboard: Seller Leaderboard

**File:** `assets/js/admin.js`

Ranks top 5 sellers by total revenue.

```javascript
async function loadSellerLeaderboard() {
    const tableBody = document.getElementById('sellerLeaderboard');
    if (!tableBody) return;

    const sellerStats = {};
    allTransactions.forEach(txn => {
        if (!txn.items || txn.status === 'cancelled') return;
        txn.items.forEach(item => {
            const sellerId = item.bookDetails?.sellerId;
            const sellerName = item.bookDetails?.sellerName || 'Unknown';
            const price = item.bookDetails?.price || 0;
            if (!sellerId) return;

            if (!sellerStats[sellerId]) {
                sellerStats[sellerId] = { name: sellerName, sales: 0, revenue: 0 };
            }
            sellerStats[sellerId].sales++;
            sellerStats[sellerId].revenue += price;
        });
    });

    const leaderboard = Object.entries(sellerStats)
        .map(([id, stats]) => ({ id, ...stats }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

    const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
    tableBody.innerHTML = leaderboard.map((seller, index) => `
        <tr>
            <td>${medals[index]}</td>
            <td><strong>${seller.name}</strong></td>
            <td>${seller.sales}</td>
            <td style="color: #22c55e;">RM ${seller.revenue.toFixed(2)}</td>
        </tr>
    `).join('');
}
```

---

## 22. Admin Dashboard: Activity Log

**File:** `assets/js/admin.js`

Displays a chronological feed of recent platform events.

```javascript
async function loadActivityLog() {
    const logContainer = document.getElementById('activityLog');
    if (!logContainer) return;

    const activities = [];
    allTransactions.forEach(txn => {
        const orderId = (txn.transactionId || txn.id || '').substring(0, 8);
        const buyerName = txn.buyerName || 'Someone';

        if (txn.createdAt) {
            activities.push({ time: txn.createdAt, icon: 'fa-shopping-cart', color: '#3b82f6', text: `${buyerName} purchased order #${orderId}` });
        }
        if (txn.actualDeliveryDate) {
            activities.push({ time: txn.actualDeliveryDate, icon: 'fa-check-circle', color: '#22c55e', text: `Order #${orderId} confirmed received` });
        }
        if (txn.warrantyClaimedAt) {
            activities.push({ time: txn.warrantyClaimedAt, icon: 'fa-exclamation-triangle', color: '#ef4444', text: `Warranty claimed on order #${orderId}` });
        }
        if (txn.payoutProcessedAt) {
            activities.push({ time: txn.payoutProcessedAt, icon: 'fa-wallet', color: '#22c55e', text: `Payout processed for order #${orderId}` });
        }
    });

    activities.sort((a, b) => b.time - a.time);
    logContainer.innerHTML = activities.slice(0, 15).map(activity => `
        <div style="display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem;">
            <i class="fas ${activity.icon}" style="color: ${activity.color};"></i>
            <div>${activity.text}<br><small>${formatDate(activity.time)}</small></div>
        </div>
    `).join('');
}
```

---

## 23. PDF Receipt Generation (jsPDF)

**File:** `assets/js/receipt.js`

```javascript
function generatePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Header
    doc.setFontSize(24);
    doc.setTextColor(0, 92, 153);  // UiTM Blue
    doc.text('UiTM e-Marketplace', 105, 20, { align: 'center' });

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Universiti Teknologi Malaysia, Tapah Campus', 105, 30, { align: 'center' });

    // Transaction details
    doc.setFontSize(12);
    doc.text('Transaction Details', 20, 50);
    doc.setFontSize(10);
    doc.text(`Transaction ID: ${currentTransaction.transactionId}`, 20, 60);
    doc.text(`Date: ${formatDate(currentTransaction.createdAt)}`, 20, 67);
    doc.text(`Status: ${currentTransaction.status.toUpperCase()}`, 20, 74);

    // Buyer info
    doc.setFontSize(12);
    doc.text('Buyer Information', 20, 90);
    doc.setFontSize(10);
    doc.text(`Name: ${currentTransaction.buyerName}`, 20, 100);
    doc.text(`Email: ${currentTransaction.buyerEmail}`, 20, 107);

    // Items table
    let yPos = 130;
    doc.setFontSize(12);
    doc.text('Items Purchased', 20, 120);
    doc.setFontSize(10);
    doc.text('Title', 20, yPos);
    doc.text('Price', 150, yPos);
    yPos += 5;
    doc.line(20, yPos, 190, yPos);
    yPos += 5;

    currentTransaction.items.forEach(item => {
        const title = item.bookDetails.title.length > 40
            ? item.bookDetails.title.substring(0, 40) + '...'
            : item.bookDetails.title;
        doc.text(title, 20, yPos);
        doc.text(formatCurrency(item.bookDetails.price), 150, yPos);
        yPos += 7;
    });

    // Totals
    yPos += 5;
    doc.line(20, yPos, 190, yPos);
    yPos += 7;
    doc.text('Subtotal:', 120, yPos);
    doc.text(formatCurrency(currentTransaction.basePrice), 150, yPos);
    yPos += 7;
    doc.text('Admin Fee (10%):', 120, yPos);
    doc.text(formatCurrency(currentTransaction.commissionFee), 150, yPos);
    yPos += 7;
    doc.setFont('helvetica', 'bold');
    doc.text('Total:', 120, yPos);
    doc.text(formatCurrency(currentTransaction.amount), 150, yPos);

    // Payment info
    yPos += 15;
    doc.setFont('helvetica', 'normal');
    doc.text('Payment Method: FPX Online Banking', 20, yPos);
    yPos += 7;
    doc.text(`FPX Transaction ID: ${currentTransaction.fpxTransactionId}`, 20, yPos);

    // Footer
    yPos += 20;
    doc.setFontSize(10);
    doc.text('Thank you for using UiTM e-Marketplace!', 105, yPos, { align: 'center' });

    // Save PDF
    doc.save(`receipt-${currentTransaction.transactionId}.pdf`);
}
```

---

## 24. Admin Dispute Resolution

**File:** `assets/js/admin.js`

```javascript
// ESCROW: Resolve dispute - REFUND buyer
async function resolveDisputeForBuyer(transactionId, feedbackId) {
    if (!confirm('Refund full amount to buyer? Seller will not be paid.')) return;

    try {
        const txnSnapshot = await database.ref(`transactions/${transactionId}`).once('value');
        const txn = txnSnapshot.val();
        if (!txn) {
            showNotification('Transaction not found', 'error');
            return;
        }

        // Refund to buyer's wallet (full amount)
        const buyerWalletRef = database.ref(`users/${txn.buyerId}/wallet`);
        const buyerWallet = (await buyerWalletRef.once('value')).val() || {};
        await buyerWalletRef.update({
            balance: (buyerWallet.balance || 0) + txn.amount
        });
        console.log(`[ESCROW] Refunded RM${txn.amount} to buyer`);

        // Clear seller's frozen funds
        for (const item of txn.items) {
            const sellerWalletRef = database.ref(`users/${item.bookDetails.sellerId}/wallet`);
            const sellerWallet = (await sellerWalletRef.once('value')).val() || {};
            await sellerWalletRef.update({
                frozenDispute: Math.max(0, (sellerWallet.frozenDispute || 0) - item.bookDetails.price)
            });
        }

        // Update transaction status
        await database.ref(`transactions/${transactionId}`).update({
            status: 'refunded',
            disputeResolvedAt: Date.now(),
            disputeResolvedBy: currentUser.uid,
            disputeDecision: 'refund_buyer'
        });

        // Mark feedback as resolved
        if (feedbackId) {
            await database.ref(`feedback/${feedbackId}`).update({ status: 'resolved' });
        }

        showNotification('Dispute resolved - Buyer refunded RM' + txn.amount.toFixed(2), 'success');
        loadFeedback();

    } catch (error) {
        console.error('Error resolving dispute:', error);
        showNotification('Failed to resolve dispute', 'error');
    }
}

// ESCROW: Resolve dispute - PAY seller
async function resolveDisputeForSeller(transactionId, feedbackId) {
    if (!confirm('Release funds to seller? Buyer will not receive a refund.')) return;

    try {
        const txnSnapshot = await database.ref(`transactions/${transactionId}`).once('value');
        const txn = txnSnapshot.val();
        if (!txn) {
            showNotification('Transaction not found', 'error');
            return;
        }

        const basePrice = txn.items.reduce((sum, item) => sum + item.bookDetails.price, 0);
        const commission = basePrice * COMMISSION_RATE;
        const sellerPayout = basePrice - commission;

        // Release funds to seller
        for (const item of txn.items) {
            const sellerWalletRef = database.ref(`users/${item.bookDetails.sellerId}/wallet`);
            const sellerWallet = (await sellerWalletRef.once('value')).val() || {};

            const itemCommission = item.bookDetails.price * COMMISSION_RATE;
            const itemPayout = item.bookDetails.price - itemCommission;

            await sellerWalletRef.update({
                frozenDispute: Math.max(0, (sellerWallet.frozenDispute || 0) - item.bookDetails.price),
                balance: (sellerWallet.balance || 0) + itemPayout,
                totalEarned: (sellerWallet.totalEarned || 0) + itemPayout
            });
        }
        console.log(`[ESCROW] Released RM${sellerPayout.toFixed(2)} to seller`);

        // Update transaction status
        await database.ref(`transactions/${transactionId}`).update({
            status: 'completed',
            disputeResolvedAt: Date.now(),
            disputeResolvedBy: currentUser.uid,
            disputeDecision: 'release_seller',
            sellerPaidOut: true,
            sellerPayoutAmount: sellerPayout,
            commissionCollected: commission
        });

        // Mark feedback as resolved
        if (feedbackId) {
            await database.ref(`feedback/${feedbackId}`).update({ status: 'resolved' });
        }

        showNotification('Dispute resolved - Seller paid RM' + sellerPayout.toFixed(2), 'success');
        loadFeedback();

    } catch (error) {
        console.error('Error resolving dispute:', error);
        showNotification('Failed to resolve dispute', 'error');
    }
}
```

---

## Quick Reference

### Key Constants
| Constant | Value | Purpose |
|----------|-------|---------|
| `COMMISSION_RATE` | 0.10 (10%) | Platform fee |
| `WARRANTY_PERIOD_DAYS` | 7 | Buyer protection period |
| `MESSAGE_COOLDOWN` | 2000ms | Chat rate limit |

### Transaction Flow
```
pending_payment → payment_held → delivered → completed
                                    ↓
                            warranty_claimed → return_sent → return_received → refunded
```

### File Locations
| Function | File |
|----------|------|
| System Constants | `firebase-config.js` |
| Authentication | `auth.js` |
| Negotiation | `chat.js` |
| Payment/Escrow | `payment.js` |
| Warranty/Returns | `profile.js` |
| System Health | `admin.js` |
| Payout Queue | `admin.js` |
| Seller Leaderboard | `admin.js` |
| Activity Log | `admin.js` |
| Admin Dispute | `admin.js` |

---

*Document Version: 1.1 | Last Updated: January 2026*
