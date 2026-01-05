// Firebase Configuration for UiTM e-Marketplace
const firebaseConfig = {
    apiKey: "AIzaSyCx57DW7y_PRXxDjRIhaq5Qk8qZa15x_90", // Replace with your actual API key
    authDomain: "uitme-marketplace.firebaseapp.com",
    databaseURL: "https://uitme-marketplace-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "uitme-marketplace",
    storageBucket: "uitme-marketplace.firebasestorage.app",
    messagingSenderId: "638305610963",
    appId: "1:638305610963:web:e85f029a69ae12b4253826",
    measurementId: "G-0LLX3PMXME"
};

// ImageBB Configuration
const IMGBB_API_KEY = "b24ce74b671a4227c2e7132c4509376e";
const IMGBB_UPLOAD_URL = "https://api.imgbb.com/1/upload";

// Admin Email List (customize as needed)
const ADMIN_EMAILS = [
    "admin@student.uitm.edu.my",
    "admin@staff.uitm.edu.my"
];

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
const auth = firebase.auth();
const database = firebase.database();

// Global variables
let currentUser = null;
let userData = null;
let authInitialized = false;
let authCheckPromise = null;

// System constants
const COMMISSION_RATE = 0.10; // 10% commission fee on all transactions

// Transaction Status Constants (Enhanced Escrow + Warranty Model)
const TRANSACTION_STATUS = {
    PENDING_PAYMENT: 'pending_payment',     // Checkout initiated
    PAYMENT_HELD: 'payment_held',           // Money held in escrow, awaiting buyer confirmation
    DELIVERED: 'delivered',                 // Buyer confirmed receipt, 7-day warranty active
    WARRANTY_CLAIMED: 'warranty_claimed',   // Buyer claimed warranty issue
    RETURN_SENT: 'return_sent',             // Buyer confirmed book sent back to seller
    RETURN_RECEIVED: 'return_received',     // Seller confirmed received returned book
    COMPLETED: 'completed',                 // Warranty expired, seller paid out
    DISPUTE_OPEN: 'dispute_open',           // Legacy - buyer opened dispute before confirm
    REFUNDED: 'refunded',                   // Admin refunded buyer
    CANCELLED: 'cancelled'                  // Transaction cancelled
};

// Warranty period (7 days in milliseconds) - buyer can claim after confirming receipt
const WARRANTY_PERIOD_DAYS = 7;
const WARRANTY_PERIOD_MS = WARRANTY_PERIOD_DAYS * 24 * 60 * 60 * 1000;

// Auto-release timer (7 days in milliseconds) - for initial confirmation
const AUTO_RELEASE_DAYS = 7;
const AUTO_RELEASE_MS = AUTO_RELEASE_DAYS * 24 * 60 * 60 * 1000;

// Wait for Firebase auth to initialize
function waitForAuth() {
    if (authInitialized && currentUser) {
        return Promise.resolve();
    }

    if (!authCheckPromise) {
        authCheckPromise = new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error("Auth check timeout"));
            }, 10000); // 10 second timeout

            const unsubscribe = auth.onAuthStateChanged((user) => {
                clearTimeout(timeout);
                unsubscribe(); // Stop listening after first state change
                authInitialized = true;

                if (user) {
                    currentUser = user;
                    // Load user data
                    database.ref(`users/${user.uid}`).once('value')
                        .then((snapshot) => {
                            userData = snapshot.val();
                            if (userData) {
                                updateUIForUser();
                            }
                            resolve();
                        })
                        .catch((error) => {
                            console.error("Error loading user data:", error);
                            reject(error);
                        });
                } else {
                    currentUser = null;
                    userData = null;
                    // Redirect to login for protected pages
                    if (!window.location.pathname.includes('login.html') &&
                        !window.location.pathname.includes('signup.html')) {
                        // Check if already in pages directory
                        const inPagesDir = window.location.pathname.includes('/pages/');
                        window.location.href = inPagesDir ? 'login.html' : 'pages/login.html';
                    }
                    reject(new Error("Not authenticated"));
                }
            });
        });
    }

    return authCheckPromise;
}

// Check if current user is admin
function isAdmin() {
    if (!userData) return false;
    return userData.role === 'admin' || ADMIN_EMAILS.includes(userData.email);
}

// Update UI based on user role
function updateUIForUser() {
    if (!userData) return;

    // Show/hide admin link
    const adminLinks = document.querySelectorAll('.admin-only');
    const cartLinks = document.querySelectorAll('a[href="cart.html"]');
    const profileLinks = document.querySelectorAll('a[href="profile.html"], a[href="pages/profile.html"]');

    if (isAdmin()) {
        adminLinks.forEach(link => link.style.display = 'block');

        // Hide cart and profile links for admin users (they can't purchase)
        cartLinks.forEach(link => link.style.display = 'none');
        profileLinks.forEach(link => link.style.display = 'none');
    } else {
        adminLinks.forEach(link => link.style.display = 'none');

        // Ensure cart and profile links are visible for regular users
        cartLinks.forEach(link => link.style.display = 'block');
        profileLinks.forEach(link => link.style.display = 'block');
    }

    // Display welcome message with role-specific styling
    const welcomeMsg = document.getElementById('welcomeMsg');
    if (welcomeMsg && userData.fullName) {
        // Determine user role based on email domain or role field
        let userRole = 'student'; // Default role
        if (userData.role === 'staff' || (userData.email && userData.email.includes('@staff.uitm.edu.my'))) {
            userRole = 'staff';
        } else if (userData.role === 'admin' || isAdmin()) {
            userRole = 'admin';
        }

        // Role-specific icon and label configuration
        const roleConfig = {
            student: {
                icon: 'fa-graduation-cap',
                label: 'Student',
                className: 'welcome-student'
            },
            staff: {
                icon: 'fa-user-tie',
                label: 'Staff',
                className: 'welcome-staff'
            },
            admin: {
                icon: 'fa-user-shield',
                label: 'Admin',
                className: 'welcome-admin'
            }
        };

        const config = roleConfig[userRole];

        // Check if new structure exists (with .welcome-name span)
        const welcomeNameSpan = welcomeMsg.querySelector('.welcome-name');
        const welcomeIcon = welcomeMsg.querySelector('.welcome-icon');
        let roleBadge = welcomeMsg.querySelector('.welcome-role-badge');

        if (welcomeNameSpan) {
            // New structure with separate spans
            welcomeNameSpan.textContent = userData.fullName;
            welcomeMsg.style.display = 'inline-flex';

            // Update icon based on role
            if (welcomeIcon) {
                welcomeIcon.className = `fas ${config.icon} welcome-icon`;
            }

            // Add role badge if it doesn't exist
            if (!roleBadge) {
                roleBadge = document.createElement('span');
                roleBadge.className = 'welcome-role-badge';
                welcomeMsg.appendChild(roleBadge);
            }
            roleBadge.textContent = config.label;
            roleBadge.className = `welcome-role-badge role-badge-${userRole}`;

            // Add role-specific class to welcome message
            welcomeMsg.classList.remove('welcome-student', 'welcome-staff', 'welcome-admin');
            welcomeMsg.classList.add(config.className);
        } else {
            // Old structure fallback
            welcomeMsg.textContent = `Welcome, ${userData.fullName}`;
            welcomeMsg.style.display = 'inline-block';
        }
    }

    // Update cart count (only for non-admin users)
    if (typeof updateCartCount === 'function' && !isAdmin()) {
        updateCartCount();
    }
}

// Get URL parameters
function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    const results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

// Logout function
function logout() {
    auth.signOut().then(() => {
        // Check if already in pages directory
        const inPagesDir = window.location.pathname.includes('/pages/');
        window.location.href = inPagesDir ? 'login.html' : 'pages/login.html';
    }).catch((error) => {
        console.error("Logout error:", error);
        showNotification("Error logging out", "error");
    });
}

// Check if user is authenticated
async function requireAuth() {
    await waitForAuth();
    if (!currentUser) {
        throw new Error('Not authenticated');
    }
    return currentUser;
}

// Check if user is admin
async function requireAdmin() {
    await waitForAuth();
    if (!currentUser) {
        throw new Error('Not authenticated');
    }

    const snapshot = await database.ref(`users/${currentUser.uid}`).once('value');
    const userData = snapshot.val();

    if (!userData || (userData.role !== 'admin' && !ADMIN_EMAILS.includes(userData.email))) {
        window.location.href = '../index.html';
        throw new Error('Not authorized');
    }

    return currentUser;
}

// Validate UiTM email domain
function validateUitmEmail(email) {
    const allowedDomains = ['@student.uitm.edu.my', '@staff.uitm.edu.my'];
    return allowedDomains.some(domain => email.endsWith(domain));
}

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

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? 'var(--success)' : type === 'error' ? 'var(--error)' : 'var(--info)'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: var(--shadow-medium);
        z-index: 4000;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add notification styles
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(notificationStyles);

// ===========================================
// AUTO-PAYOUT SYSTEM
// Automatically releases funds to sellers when warranty expires
// ===========================================

let autoPayoutRunning = false;

// Check and process any expired warranty payouts
async function checkAndProcessAutoPayouts() {
    // Prevent concurrent runs
    if (autoPayoutRunning) {
        console.log('[AUTO-PAYOUT] Already running, skipping...');
        return;
    }

    autoPayoutRunning = true;
    console.log('[AUTO-PAYOUT] Checking for expired warranty payouts...');

    try {
        // Get all transactions with 'delivered' status (warranty period)
        const snapshot = await database.ref('transactions')
            .orderByChild('status')
            .equalTo('delivered')
            .once('value');

        if (!snapshot.exists()) {
            console.log('[AUTO-PAYOUT] No delivered transactions found');
            autoPayoutRunning = false;
            return;
        }

        const now = Date.now();
        let processedCount = 0;

        // Process each transaction
        const promises = [];
        snapshot.forEach(childSnapshot => {
            const txn = childSnapshot.val();
            const txnId = childSnapshot.key;

            // Check if payout is scheduled and expired
            if (txn.payoutScheduledAt && txn.payoutScheduledAt <= now) {
                // Skip if already claimed warranty
                if (txn.warrantyClaimDismissed === false) {
                    return;
                }

                console.log(`[AUTO-PAYOUT] Processing payout for ${txnId}`);
                promises.push(processAutoPayout(txnId, txn));
                processedCount++;
            }
        });

        if (promises.length > 0) {
            await Promise.all(promises);
            console.log(`[AUTO-PAYOUT] Processed ${processedCount} payouts`);
        } else {
            console.log('[AUTO-PAYOUT] No payouts ready to process');
        }

    } catch (error) {
        console.error('[AUTO-PAYOUT] Error checking payouts:', error);
    } finally {
        autoPayoutRunning = false;
    }
}

// Process a single auto-payout
async function processAutoPayout(transactionId, txn) {
    try {
        const amount = txn.amount || txn.basePrice || 0;
        const commission = amount * COMMISSION_RATE;
        const sellerPayout = amount - commission;

        // Get seller ID from items
        const sellerId = txn.items?.[0]?.bookDetails?.sellerId;
        const buyerId = txn.buyerId;

        if (!sellerId) {
            console.error(`[AUTO-PAYOUT] No seller ID found for ${transactionId}`);
            return;
        }

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
        const sellerWalletSnapshot = await sellerWalletRef.once('value');
        const sellerWallet = sellerWalletSnapshot.val() || {};

        await sellerWalletRef.update({
            balance: (sellerWallet.balance || 0) + sellerPayout,
            pendingEscrow: Math.max(0, (sellerWallet.pendingEscrow || 0) - amount),
            totalEarned: (sellerWallet.totalEarned || 0) + sellerPayout
        });

        // 3. Notify seller about payout
        await database.ref('notifications').push({
            recipientId: sellerId,
            senderId: 'system',
            senderName: 'System',
            type: 'payout_received',
            message: `💰 You received RM${sellerPayout.toFixed(2)} for order #${transactionId.substring(0, 8)}! (10% commission deducted)`,
            transactionId: transactionId,
            read: false,
            createdAt: Date.now()
        });

        // 4. Notify buyer that transaction is complete
        await database.ref('notifications').push({
            recipientId: buyerId,
            senderId: 'system',
            senderName: 'System',
            type: 'order_confirmed',
            message: `✅ Order #${transactionId.substring(0, 8)} is complete! Warranty period has ended. Thank you for your purchase!`,
            transactionId: transactionId,
            read: false,
            createdAt: Date.now()
        });

        console.log(`[AUTO-PAYOUT] Successfully processed payout for ${transactionId}: RM${sellerPayout.toFixed(2)} to seller`);

    } catch (error) {
        console.error(`[AUTO-PAYOUT] Error processing payout for ${transactionId}:`, error);
    }
}

// Run auto-payout check when auth is ready
auth.onAuthStateChanged(async (user) => {
    if (user) {
        // Wait a bit to let the page load first
        setTimeout(() => {
            checkAndProcessAutoPayouts();
        }, 3000);
    }
});

// Export function for manual triggering
window.checkAndProcessAutoPayouts = checkAndProcessAutoPayouts;
