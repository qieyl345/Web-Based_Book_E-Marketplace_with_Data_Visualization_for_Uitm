# 📚 UiTM Book e-Marketplace - Complete Technical Documentation

> A peer-to-peer textbook marketplace platform for UiTM Tapah Campus with negotiation, escrow, and real-time analytics.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-ISC-green)
![Firebase](https://img.shields.io/badge/Firebase-Realtime%20Database-orange)
![Commission](https://img.shields.io/badge/Commission-10%25-red)

---

## 📑 Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [System Workflows](#system-workflows)
6. [🔧 Core System Code](#-core-system-code)
7. [Database Schema](#database-schema)
8. [Security Rules](#security-rules)
9. [Installation & Setup](#installation--setup)
10. [UI/UX Design System](#uiux-design-system)
11. [Troubleshooting](#troubleshooting)

---

## Overview

**UiTM Book e-Marketplace** is a web-based platform that facilitates the buying and selling of textbooks within the UiTM Tapah Campus community. The platform features a secure escrow-based payment system, real-time negotiations, warranty protection, and comprehensive admin management.

### Key Highlights

| Feature | Description |
|---------|-------------|
| 🔐 **UiTM-only authentication** | Restricted to `@student.uitm.edu.my` and `@staff.uitm.edu.my` domains |
| 💳 **Escrow payment system** | Funds held securely until transaction completion |
| 🛡️ **7-day warranty protection** | Buyer protection for quality assurance |
| 💬 **Real-time negotiations** | Buyers and sellers can negotiate prices |
| 📊 **Admin dashboard** | 8 interactive charts with comprehensive analytics |
| 💰 **10% commission** | Platform fee automatically deducted from seller earnings |

---

## Features

### 🔐 Authentication & User Management

| Feature | Description |
|---------|-------------|
| **UiTM Email Restriction** | Only UiTM domains allowed |
| **Email Verification** | Users must verify email before access |
| **Role-Based Access** | Student, Staff, and Admin roles |
| **Auto-Admin Creation** | First admin auto-created with special credentials |
| **Profile Management** | Edit name, phone, upload avatar |

### 📚 Book Browsing & Search

| Feature | Description |
|---------|-------------|
| **Book Grid Display** | Visual cards with images, price, condition |
| **Real-time Search** | Search by title, author, or subject code |
| **Advanced Filters** | Filter by condition, price range, campus |
| **Sorting Options** | Sort by price, popularity, date |
| **Image Zoom** | Zoom into book images for inspection |

### 💬 Negotiation System

| Feature | Description |
|---------|-------------|
| **Make Offer** | Buyers can propose their own price |
| **Real-time Chat** | Live messaging between buyer and seller |
| **Counter Offers** | Back-and-forth price negotiation |
| **10x Price Cap** | Offers cannot exceed 10x original price |
| **RM 0.50 Minimum Difference** | Counter-offers must differ by at least RM 0.50 |
| **2-Second Rate Limit** | Prevents spam in chat |

### 💳 Payment & Escrow System

| Feature | Description |
|---------|-------------|
| **FPX Simulation** | 90% success rate simulation |
| **10% Commission** | Platform fee on all transactions |
| **Escrow Hold** | Payment held for 7 days after purchase |
| **Auto-Payout** | Automatic release to seller after warranty |
| **Race Condition Prevention** | Validates book availability before payment |

### 🛡️ Warranty System

| Feature | Description |
|---------|-------------|
| **7-Day Warranty** | Buyer protection period after delivery |
| **Claim Warranty** | Report issues within warranty period |
| **Return Process** | Buyer returns book, seller confirms |
| **Admin Resolution** | Admin decides refund or seller payout |
| **Auto-Dispute** | System flags unconfirmed deliveries after 7 days |

### 📊 Admin Dashboard

| Feature | Description |
|---------|-------------|
| **8 Interactive Charts** | Sales, Revenue, Top Books, Subject Distribution, etc. |
| **Time Filters** | 7 days, 30 days, 90 days, All Time |
| **User Management** | Search and view user details |
| **Dispute Resolution** | Refund buyer OR pay seller actions |
| **CSV Export** | Download transactions as spreadsheet |

---

## Technology Stack

| Category | Technology |
|----------|------------|
| **Frontend** | HTML5, CSS3, JavaScript (ES6+) |
| **Backend** | Firebase Realtime Database |
| **Authentication** | Firebase Authentication |
| **Image Hosting** | ImageBB API |
| **Charts** | Chart.js v4.4.1 |
| **Icons** | Font Awesome 6.4 |
| **PDF Generation** | jsPDF |

---

## Project Structure

```
UITM-EMPLC_ver1/
│
├── index.html                    # Homepage - Book browsing
│
├── pages/
│   ├── admin.html               # Admin dashboard (8 charts)
│   ├── auth.html                # Login/Signup page
│   ├── book-details.html        # Individual book view
│   ├── cart.html                # Shopping cart
│   ├── chat.html                # Negotiation chat
│   ├── feedback.html            # Feedback form
│   ├── notification-history.html # All notifications
│   ├── payment.html             # Payment processing
│   ├── profile.html             # User profile & wallet
│   └── receipt.html             # Transaction receipt
│
├── assets/
│   ├── css/                     # 20 CSS files
│   │   ├── styles.css           # Main stylesheet (83KB)
│   │   ├── uitm-glassmorphism.css # Glassmorphism effects
│   │   ├── role-based-styles.css  # Student/Staff theming
│   │   └── transaction-timeline.css # Timeline UI
│   │
│   ├── js/                      # 21 JavaScript modules
│   │   ├── firebase-config.js   # Firebase setup & constants
│   │   ├── auth.js              # Authentication logic
│   │   ├── admin.js             # Admin dashboard (2500+ lines)
│   │   ├── profile.js           # Profile & wallet (1700+ lines)
│   │   ├── payment.js           # Payment & escrow
│   │   ├── chat.js              # Negotiation system
│   │   └── utils.js             # Utility helpers
│   │
│   └── images/                  # Static assets
│
├── config/
│   ├── firebase-config.json     # Firebase credentials
│   └── firebase-rules.json      # Security rules
│
└── file_md/                     # Documentation
    ├── systemWalkthrough.md     # Complete system guide
    ├── Chapter4.md              # FYP Chapter 4
    ├── Chapter5.md              # FYP Chapter 5
    └── Chapter6.md              # FYP Chapter 6
```

---

## System Workflows

### Authentication Flow

```
User enters ID → Check format (10-digit=Student, 6-digit=Staff, "admin"=Admin)
    → Append email domain → Firebase signInWithEmailAndPassword
    → Load user data → Redirect based on role
```

### Buyer Purchase Flow

```
Browse Books → View Details → Make Offer/Buy Now → Chat Negotiation
    → Offer Accepted → Add to Cart → Payment (90% success)
    → Escrow Held → Meet Seller → Confirm Receipt
    → 7-Day Warranty → No Issues → Auto-Payout to Seller
```

### Escrow & Warranty Flow

```
Payment Success → Status: "payment_held" → Buyer Confirms Receipt
    → Status: "delivered" → Warranty Period (7 days)
    → No Issues: Auto-Payout / Issue: Claim Warranty
    → Return Book → Seller Confirms → Admin Resolves
```

---

## 🔧 Core System Code

This section documents the crucial code that powers the system's core functionality.

### System Constants

**File:** `assets/js/firebase-config.js` (Lines 36-59)

```javascript
// System constants
const COMMISSION_RATE = 0.10; // 10% commission fee on all transactions

// Transaction Status Constants (Enhanced Escrow + Warranty Model)
const TRANSACTION_STATUS = {
    PENDING_PAYMENT: 'pending_payment',     // Checkout initiated
    PAYMENT_HELD: 'payment_held',           // Money held in escrow
    DELIVERED: 'delivered',                 // Buyer confirmed, warranty active
    WARRANTY_CLAIMED: 'warranty_claimed',   // Buyer claimed warranty issue
    RETURN_SENT: 'return_sent',             // Buyer sent book back
    RETURN_RECEIVED: 'return_received',     // Seller received returned book
    COMPLETED: 'completed',                 // Warranty expired, seller paid
    DISPUTE_OPEN: 'dispute_open',           // Legacy dispute status
    REFUNDED: 'refunded',                   // Admin refunded buyer
    CANCELLED: 'cancelled'                  // Transaction cancelled
};

// Warranty period (7 days in milliseconds)
const WARRANTY_PERIOD_DAYS = 7;
const WARRANTY_PERIOD_MS = WARRANTY_PERIOD_DAYS * 24 * 60 * 60 * 1000;

// Auto-release timer (7 days in milliseconds)
const AUTO_RELEASE_DAYS = 7;
const AUTO_RELEASE_MS = AUTO_RELEASE_DAYS * 24 * 60 * 60 * 1000;
```

---

### UiTM Email Validation

**File:** `assets/js/firebase-config.js` (Lines 260-264)

```javascript
// Validate UiTM email domain
function validateUitmEmail(email) {
    const allowedDomains = ['@student.uitm.edu.my', '@staff.uitm.edu.my'];
    return allowedDomains.some(domain => email.endsWith(domain));
}
```

---

### Counter-Offer Validation

**File:** `assets/js/chat.js` (Lines 352-404)

```javascript
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const price = parseFloat(priceInput.value);
    priceError.style.display = 'none';

    // Validation 1: Price must be positive
    if (isNaN(price) || price <= 0) {
        priceError.textContent = 'Please enter a valid price greater than RM 0.00';
        priceError.style.display = 'block';
        return;
    }

    // Validation 2: Cannot exceed 10x original price
    const maxPrice = currentOffer.bookPrice * 10;
    if (price > maxPrice) {
        priceError.textContent = `Price cannot exceed ${formatCurrency(maxPrice)} (10x the original price)`;
        priceError.style.display = 'block';
        return;
    }

    // Validation 3: Must differ by at least RM 0.50
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

    // Add system message and notify other party
    await addSystemMessage(`${userData.fullName} sent a counter-offer of ${formatCurrency(price)}`);
    const otherUserId = currentUser.uid === currentOffer.buyerId 
        ? currentOffer.sellerId 
        : currentOffer.buyerId;
    await sendNotification(otherUserId, 'counter_offer', 
        `${userData.fullName} sent a counter-offer of ${formatCurrency(price)}`);
});
```

---

### Payment & Escrow Creation

**File:** `assets/js/payment.js` (Lines 212-265)

```javascript
async function completeTransaction() {
    const transactionId = 'TXN' + Date.now();
    const fpxTransactionId = 'FPX' + Math.random().toString(36).substr(2, 9).toUpperCase();

    // Create transaction record with ESCROW status
    const transaction = {
        transactionId,
        buyerId: currentUser.uid,
        buyerName: userData.fullName || 'Unknown',
        buyerEmail: userData.email || currentUser.email,
        items: paymentItems,
        amount: paymentTotal,
        basePrice: paymentItems.reduce((sum, item) => sum + item.bookDetails.price, 0),
        commissionFee: paymentTotal - paymentItems.reduce((sum, item) => sum + item.bookDetails.price, 0),
        status: 'payment_held',  // ESCROW: Money held until buyer confirms
        fpxTransactionId,
        selectedBank,
        createdAt: Date.now(),
        meetingLocation: paymentItems[0]?.bookDetails?.campusLocation || 'TBD',
        meetingDate: Date.now() + 86400000, // Tomorrow
        
        // Delivery tracking fields
        deliveryStatus: 'pending',
        expectedDeliveryDate: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
        actualDeliveryDate: null,
        
        // ESCROW fields
        escrowHeldAt: Date.now(),
        autoReleaseAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
        sellerPaidOut: false
    };

    // Save transaction
    await database.ref(`transactions/${transactionId}`).set(transaction);

    // Mark books as 'sold'
    for (const item of paymentItems) {
        await database.ref(`books/${item.bookDetails.id}`).update({
            status: 'sold',
            soldAt: Date.now(),
            buyerId: currentUser.uid
        });
    }

    return transactionId;
}
```

---

### Confirm Order Received (Starts 7-Day Warranty)

**File:** `assets/js/profile.js` (Lines 1357-1403)

```javascript
// Confirm order received by buyer - STARTS WARRANTY PERIOD (seller not paid yet!)
async function confirmOrderReceived(transactionId) {
    console.log('[WARRANTY] confirmOrderReceived called with transactionId:', transactionId);

    try {
        // Get transaction details
        const txnSnapshot = await database.ref(`transactions/${transactionId}`).once('value');
        const txn = txnSnapshot.val();
        if (!txn) throw new Error('Transaction not found');

        const now = Date.now();
        const warrantyExpiresAt = now + WARRANTY_PERIOD_MS; // WARRANTY_PERIOD_MS = 7 days

        // Update transaction status to DELIVERED (NOT completed!)
        // Seller payment is HELD until warranty expires
        await database.ref(`transactions/${transactionId}`).update({
            status: 'delivered',                    // Warranty period starts
            deliveryStatus: 'received',
            actualDeliveryDate: now,
            deliveryConfirmedBy: currentUser.uid,
            warrantyExpiresAt: warrantyExpiresAt,   // 7 days from now
            sellerPaidOut: false,                   // NOT paid yet!
            payoutScheduledAt: warrantyExpiresAt    // Scheduled payout date
        });

        console.log(`[WARRANTY] Status set to 'delivered'. Warranty expires at: ${new Date(warrantyExpiresAt)}`);
        console.log(`[WARRANTY] Seller payout scheduled for after warranty period (7 days)`);

        showNotification("Order confirmed! You have 7 days to claim warranty.", "success");
        await loadPurchaseHistory();

        // Show feedback modal
        if (typeof showFeedbackModal === 'function') {
            await showFeedbackModal(transactionId, 'general', '');
        }
    } catch (error) {
        console.error("Error confirming order:", error);
        showNotification("Failed to confirm order", "error");
    }
}
```

---

### Claim Warranty (Within 7 Days)

**File:** `assets/js/profile.js` (Lines 1406-1437)

```javascript
// Claim warranty - buyer reports issue within 7 days of receiving book
async function claimWarranty(transactionId) {
    console.log('[WARRANTY] claimWarranty called with transactionId:', transactionId);

    try {
        // Get transaction details
        const txnSnapshot = await database.ref(`transactions/${transactionId}`).once('value');
        const txn = txnSnapshot.val();

        if (!txn) throw new Error('Transaction not found');
        if (txn.status !== 'delivered') throw new Error('Cannot claim warranty - order not in delivered status');

        // Check if warranty period has expired
        const now = Date.now();
        if (now > txn.warrantyExpiresAt) {
            throw new Error('Warranty period has expired (7 days)');
        }

        // Show the warranty claim modal for user to fill in details
        document.getElementById('reportTransactionId').value = transactionId;
        document.getElementById('reportIssueForm').reset();
        document.getElementById('reportIssueModal').style.display = 'flex';

    } catch (error) {
        console.error("Error claiming warranty:", error);
        showNotification(error.message || "Failed to claim warranty", "error");
    }
}
```

---

### Auto-Payout System (After 7 Days)

**File:** `assets/js/firebase-config.js` (Lines 348-472)

```javascript
// Check and process any expired warranty payouts
async function checkAndProcessAutoPayouts() {
    if (autoPayoutRunning) {
        console.log('[AUTO-PAYOUT] Already running, skipping...');
        return;
    }

    autoPayoutRunning = true;
    console.log('[AUTO-PAYOUT] Checking for expired warranty payouts...');

    try {
        // Get all transactions with 'delivered' status (in warranty period)
        const snapshot = await database.ref('transactions')
            .orderByChild('status')
            .equalTo('delivered')
            .once('value');

        if (!snapshot.exists()) {
            console.log('[AUTO-PAYOUT] No delivered transactions found');
            return;
        }

        const now = Date.now();
        const promises = [];

        snapshot.forEach(childSnapshot => {
            const txn = childSnapshot.val();
            const txnId = childSnapshot.key;

            // Check if payout is scheduled and warranty expired
            if (txn.payoutScheduledAt && txn.payoutScheduledAt <= now) {
                // Skip if warranty was claimed
                if (txn.warrantyClaimDismissed === false) return;

                console.log(`[AUTO-PAYOUT] Processing payout for ${txnId}`);
                promises.push(processAutoPayout(txnId, txn));
            }
        });

        if (promises.length > 0) {
            await Promise.all(promises);
            console.log(`[AUTO-PAYOUT] Processed ${promises.length} payouts`);
        }
    } catch (error) {
        console.error('[AUTO-PAYOUT] Error:', error);
    } finally {
        autoPayoutRunning = false;
    }
}

// Process a single auto-payout
async function processAutoPayout(transactionId, txn) {
    const amount = txn.amount || txn.basePrice || 0;
    const commission = amount * COMMISSION_RATE;  // 10% commission
    const sellerPayout = amount - commission;

    const sellerId = txn.items?.[0]?.bookDetails?.sellerId;
    if (!sellerId) return;

    // 1. Update transaction status to completed
    await database.ref(`transactions/${transactionId}`).update({
        status: 'completed',
        autoPayoutProcessed: true,
        payoutProcessedAt: Date.now(),
        sellerPayoutAmount: sellerPayout,
        commissionAmount: commission
    });

    // 2. Update seller wallet
    const sellerWalletRef = database.ref(`users/${sellerId}/wallet`);
    const sellerWallet = (await sellerWalletRef.once('value')).val() || {};

    await sellerWalletRef.update({
        balance: (sellerWallet.balance || 0) + sellerPayout,
        pendingEscrow: Math.max(0, (sellerWallet.pendingEscrow || 0) - amount),
        totalEarned: (sellerWallet.totalEarned || 0) + sellerPayout
    });

    // 3. Notify seller about payout
    await database.ref('notifications').push({
        recipientId: sellerId,
        senderId: 'system',
        type: 'payout_received',
        message: `💰 You received RM${sellerPayout.toFixed(2)} for order #${transactionId.substring(0, 8)}! (10% commission deducted)`,
        transactionId: transactionId,
        read: false,
        createdAt: Date.now()
    });

    console.log(`[AUTO-PAYOUT] Released RM${sellerPayout.toFixed(2)} to seller`);
}

// Run auto-payout check when auth is ready
auth.onAuthStateChanged(async (user) => {
    if (user) {
        setTimeout(() => {
            checkAndProcessAutoPayouts();
        }, 3000);  // Wait 3 seconds after login
    }
});
```

---

### Auto-Dispute Check (7 Days Unconfirmed)

**File:** `assets/js/profile.js` (Lines 1292-1354)

```javascript
// Check for auto-disputes on pending orders (7 days unconfirmed)
async function checkForAutoDisputes() {
    try {
        const snapshot = await database.ref('transactions').once('value');
        const now = Date.now();
        const updates = {};
        const disputedTransactions = [];

        snapshot.forEach(childSnapshot => {
            const transaction = childSnapshot.val();
            const transactionId = childSnapshot.key;

            // Check if order is pending and past expected delivery date (7 days)
            if (transaction.deliveryStatus === 'pending' && transaction.expectedDeliveryDate) {
                if (now > transaction.expectedDeliveryDate) {
                    // Mark as disputed
                    updates[`transactions/${transactionId}/deliveryStatus`] = 'disputed';
                    updates[`transactions/${transactionId}/disputeCreatedAt`] = now;
                    updates[`transactions/${transactionId}/disputeReason`] = 
                        'Buyer did not confirm receipt within 7 days';

                    disputedTransactions.push({
                        transactionId,
                        buyerId: transaction.buyerId,
                        buyerName: transaction.buyerName,
                        amount: transaction.amount
                    });
                }
            }
        });

        // Send admin notifications for auto-disputes
        if (disputedTransactions.length > 0 && typeof sendAdminNotification === 'function') {
            for (const dispute of disputedTransactions) {
                await sendAdminNotification(
                    'admin_dispute',
                    `🚨 Auto-Dispute: Order #${dispute.transactionId.substring(0, 8)} expired`,
                    {
                        transactionId: dispute.transactionId,
                        buyerId: dispute.buyerId,
                        reason: 'Buyer did not confirm receipt within 7 days'
                    },
                    'high'
                );
            }
        }

        // Apply updates
        if (Object.keys(updates).length > 0) {
            await database.ref().update(updates);
            console.log(`[AUTO-DISPUTE] Marked ${disputedTransactions.length} order(s) as disputed`);
        }
    } catch (error) {
        console.error("[AUTO-DISPUTE] Error:", error);
    }
}
```

---

### Return Flow (Warranty Claim)

**File:** `assets/js/profile.js` (Lines 1440-1648)

```javascript
// Confirm return sent - buyer confirms they've returned the book
async function confirmReturnSent(transactionId) {
    console.log('[WARRANTY] confirmReturnSent called');

    // Get transaction for seller info
    const txnSnapshot = await database.ref(`transactions/${transactionId}`).once('value');
    const txn = txnSnapshot.val();

    await database.ref(`transactions/${transactionId}`).update({
        status: 'return_sent',
        returnSentAt: Date.now(),
        returnSentBy: currentUser.uid
    });

    // Notify seller that buyer is returning the book
    if (txn && txn.items) {
        for (const item of txn.items) {
            await database.ref('notifications').push({
                recipientId: item.bookDetails.sellerId,
                senderId: currentUser.uid,
                senderName: userData.fullName,
                type: 'return_sent',
                message: `📦 ${userData.fullName} sent back "${item.bookDetails.title}". Please confirm when you receive it.`,
                transactionId: transactionId,
                read: false,
                createdAt: Date.now()
            });
        }
    }

    showNotification("Return confirmed! Please meet the seller to handover the book.", "success");
}

// Seller: Confirm received returned book
async function confirmReturnReceived(transactionId) {
    console.log('[WARRANTY] confirmReturnReceived called by seller');

    await database.ref(`transactions/${transactionId}`).update({
        status: 'return_received',
        returnReceivedAt: Date.now(),
        returnReceivedBy: currentUser.uid
    });

    // Get transaction details
    const txnSnapshot = await database.ref(`transactions/${transactionId}`).once('value');
    const txn = txnSnapshot.val();

    // Notify admin that both parties confirmed - ready for refund
    if (typeof sendAdminNotification === 'function') {
        await sendAdminNotification(
            'admin_dispute',
            `✅ Return Confirmed: Both parties confirmed for order #${transactionId.substring(0, 8)}`,
            {
                transactionId: transactionId,
                buyerId: txn.buyerId,
                action: 'ready_for_refund'
            },
            'high'
        );
    }

    // Notify buyer that seller confirmed
    await database.ref('notifications').push({
        recipientId: txn.buyerId,
        senderId: currentUser.uid,
        senderName: userData.fullName,
        type: 'return_received',
        message: `✅ Seller confirmed receiving your returned book. Admin will process your refund within 24-48 hours.`,
        transactionId: transactionId,
        read: false,
        createdAt: Date.now()
    });

    showNotification("Return confirmed! Admin will now process the refund.", "success");
}
```

---

### Commission Calculation

```javascript
// Commission calculation (10% fee)
const COMMISSION_RATE = 0.10;

// Example calculation:
const bookPrice = 50.00;                           // Buyer sees this price
const commission = bookPrice * COMMISSION_RATE;    // RM 5.00 commission
const buyerPays = bookPrice + commission;          // RM 55.00 total
const sellerReceives = bookPrice - commission;     // RM 45.00 payout
```

---

### Chat Rate Limiting

**File:** `assets/js/chat.js` (Lines 6-7, 238-243)

```javascript
const MESSAGE_COOLDOWN = 2000; // 2 seconds between messages

// Rate limiting check
const now = Date.now();
if (now - lastMessageTime < MESSAGE_COOLDOWN) {
    const remaining = Math.ceil((MESSAGE_COOLDOWN - (now - lastMessageTime)) / 1000);
    showNotification(`Please wait ${remaining} second(s)`, "warning");
    return;
}
lastMessageTime = now;
```

---

## Database Schema

### Users Collection
```json
{
  "users": {
    "uid": {
      "email": "2024745815@student.uitm.edu.my",
      "fullName": "Ahmad Razif",
      "phoneNumber": "0123456789",
      "role": "student",
      "totalSales": 5,
      "totalPurchases": 3,
      "wallet": {
        "balance": 125.50,
        "pendingEscrow": 45.00,
        "frozenDispute": 0,
        "totalEarned": 170.50
      },
      "createdAt": 1702450000000
    }
  }
}
```

### Books Collection
```json
{
  "books": {
    "bookId": {
      "title": "Data Structures and Algorithms",
      "author": "Thomas H. Cormen",
      "isbn": "978-0262033848",
      "subjectCode": "CSC203",
      "condition": "Good",
      "price": 45.00,
      "description": "Minor highlighting",
      "campusLocation": "UiTM Tapah",
      "images": ["https://i.ibb.co/..."],
      "sellerId": "uid123",
      "sellerName": "Ahmad Razif",
      "status": "available",
      "viewCount": 42,
      "createdAt": 1702450000000
    }
  }
}
```

### Transactions Collection
```json
{
  "transactions": {
    "TXN1702450000000": {
      "transactionId": "TXN1702450000000",
      "buyerId": "uid456",
      "buyerName": "Siti Aminah",
      "items": [{ "bookDetails": {...} }],
      "amount": 49.50,
      "basePrice": 45.00,
      "commissionFee": 4.50,
      "status": "payment_held",
      "escrowHeldAt": 1702450000000,
      "autoReleaseAt": 1703054800000,
      "warrantyExpiresAt": null,
      "sellerPaidOut": false
    }
  }
}
```

### Offers Collection
```json
{
  "offers": {
    "offerId": {
      "bookId": "bookId123",
      "bookTitle": "Data Structures",
      "bookPrice": 45.00,
      "buyerId": "uid456",
      "sellerId": "uid123",
      "currentPrice": 40.00,
      "status": "counter_offered",
      "lastActionBy": "uid123",
      "createdAt": 1702450000000
    }
  }
}
```

---

## Security Rules

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
    "offers": {
      "$offerId": {
        ".read": "auth != null && (data.child('buyerId').val() == auth.uid || data.child('sellerId').val() == auth.uid || root.child('users/' + auth.uid + '/role').val() == 'admin')",
        ".write": "auth != null && (data.child('buyerId').val() == auth.uid || data.child('sellerId').val() == auth.uid || !data.exists())"
      }
    },
    "chats": {
      "$offerId": {
        ".read": "auth != null && (root.child('offers/' + $offerId + '/buyerId').val() == auth.uid || root.child('offers/' + $offerId + '/sellerId').val() == auth.uid)"
      }
    },
    "feedback": {
      ".read": "auth != null && root.child('users/' + auth.uid + '/role').val() == 'admin'"
    }
  }
}
```

---

## Installation & Setup

### Prerequisites
- Node.js ≥14.0.0
- Firebase project

### Quick Start

```bash
# Clone the repository
git clone https://github.com/qieyl345/UITM-EMPLC_design-ver1.git

# Navigate to project
cd UITM-EMPLC_ver1

# Install dependencies
npm install

# Start development server
npm run dev
```

### Test Credentials

| Role | ID | Password |
|------|-----|----------|
| Student | `2024745815` | `2024745815` |
| Staff | `709265` | `70926500` |
| Admin | `admin` | `admin123` |

---

## UI/UX Design System

### Color Palette
| Color | Hex | Usage |
|-------|-----|-------|
| **Primary** | #005C99 | UiTM Blue |
| **Secondary** | #00A86B | Success Green |
| **Accent** | #FFB81C | UiTM Gold |
| **Student Theme** | #7C3AED | Purple accent |
| **Staff Theme** | #D97706 | Gold accent |

### Design Features
- Glassmorphism effects
- Role-based theming (Student: Purple, Staff: Gold)
- Smooth CSS transitions
- Skeleton loaders
- Toast notifications
- Responsive design

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| **Auth Issues** | Check Firebase Auth settings, verify UiTM email domain |
| **Image Upload Fails** | Check ImageBB API key, file size < 5MB |
| **Database Connection** | Verify Firebase config, check security rules |
| **Charts Not Loading** | Ensure Chart.js CDN is accessible |
| **Payment Always Fails** | Normal - 10% failure rate is intentional |

---

## License

This project is licensed under the ISC License.

---

<p align="center">
  <strong>UiTM Book e-Marketplace</strong><br>
  Built with ❤️ for UiTM Tapah Campus
</p>
