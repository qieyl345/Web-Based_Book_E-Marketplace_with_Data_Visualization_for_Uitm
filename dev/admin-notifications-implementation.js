// ============================================================================
// ADMIN NOTIFICATION HELPER FUNCTIONS
// Add these to a new file: assets/js/admin-notifications.js
// ============================================================================

/**
 * Send notification to all admins
 */
async function sendAdminNotification(type, message, data = {}, priority = 'medium') {
    try {
        // Get all admin users
        const adminsSnapshot = await database.ref('users')
            .orderByChild('role')
            .equalTo('admin')
            .once('value');

        const adminIds = [];
        adminsSnapshot.forEach(child => {
            adminIds.push(child.key);
        });

        console.log(`[ADMIN-NOTIF] Sending to ${adminIds.length} admins`);

        // Send notification to each admin
        const promises = adminIds.map(adminId => {
            return database.ref('notifications').push({
                recipientId: adminId,
                type: type,
                priority: priority,
                message: message,
                data: data,
                createdAt: Date.now(),
                read: false,
                actionTaken: false
            });
        });

        await Promise.all(promises);
        console.log(`[ADMIN-NOTIF] Sent: ${type}`);

    } catch (error) {
        console.error('[ADMIN-NOTIF] Error:', error);
    }
}

/**
 * Notification type constants
 */
const ADMIN_NOTIFICATION_TYPES = {
    // Critical
    DISPUTE_FILED: 'admin_dispute',
    PAYMENT_FAILURE: 'admin_payment_failure',
    SUSPICIOUS_ACTIVITY: 'admin_suspicious',

    // Monitoring
    NEW_USER: 'admin_new_user',
    NEW_BOOK: 'admin_new_book',
    HIGH_VALUE_TRANSACTION: 'admin_high_value',

    // Moderation
    LOW_RATING: 'admin_low_rating',
    CONTENT_REPORT: 'admin_report',
    NEGATIVE_PATTERN: 'admin_pattern',

    // Transactions
    TRANSACTION_COMPLETE: 'admin_txn_complete',
    STALE_OFFER: 'admin_stale_offer',
    TRANSACTION_CANCELLED: 'admin_txn_cancelled',

    // Milestones
    MILESTONE: 'admin_milestone',
    DAILY_DIGEST: 'admin_digest'
};

// ============================================================================
// EXAMPLE USAGE IN EXISTING CODE
// ============================================================================

/**
 * Example 1: In feedback.js when dispute is filed
 */
async function submitFeedback(feedbackData) {
    // ... existing code ...

    const feedbackRef = await database.ref('feedback').push(feedbackData);

    // NEW: Notify admins if it's a dispute
    if (feedbackData.type === 'dispute') {
        await sendAdminNotification(
            ADMIN_NOTIFICATION_TYPES.DISPUTE_FILED,
            `🚨 New dispute from ${userData.fullName}`,
            {
                feedbackId: feedbackRef.key,
                userId: currentUser.uid,
                transactionId: feedbackData.transactionId
            },
            'high'
        );
    }

    // ... existing code ...
}

/**
 * Example 2: In payment.js after successful payment
 */
async function completeTransaction(transactionData) {
    // ... existing code ...

    const transaction = await database.ref('transactions').push(transactionData);

    // NEW: Notify admins of high-value transactions
    if (transactionData.totalAmount >= 500) {
        await sendAdminNotification(
            ADMIN_NOTIFICATION_TYPES.HIGH_VALUE_TRANSACTION,
            `💰 High-value sale: ${formatCurrency(transactionData.totalAmount)}`,
            {
                transactionId: transaction.key,
                amount: transactionData.totalAmount,
                bookTitle: transactionData.items[0]?.bookDetails?.title
            },
            'medium'
        );
    }

    // ... existing code ...
}

/**
 * Example 3: In auth.js when user registers
 */
async function completeSignup(userData) {
    // ... existing code ...

    await database.ref(`users/${newUser.uid}`).set(userData);

    // NEW: Notify admins of new registration
    await sendAdminNotification(
        ADMIN_NOTIFICATION_TYPES.NEW_USER,
        `👋 New user: ${userData.fullName} (${userData.role})`,
        {
            userId: newUser.uid,
            email: userData.email,
            role: userData.role
        },
        'low'  // Low priority - can batch
    );

    // ... existing code ...
}

/**
 * Example 4: In homepage.js when book is listed
 */
async function publishBook(bookData) {
    // ... existing code ...

    const bookRef = await database.ref('books').push(bookData);

    // NEW: Notify admins of new listing
    await sendAdminNotification(
        ADMIN_NOTIFICATION_TYPES.NEW_BOOK,
        `📚 New listing: ${bookData.title} by ${userData.fullName}`,
        {
            bookId: bookRef.key,
            sellerId: currentUser.uid,
            title: bookData.title
        },
        'low'
    );

    // ... existing code ...
}

/**
 * Example 5: In feedback system for low ratings
 */
async function submitRating(rating, comment, transactionId) {
    // ... existing code ...

    await database.ref('feedback').push({
        rating,
        comment,
        transactionId,
        // ... other fields
    });

    // NEW: Alert admins of poor ratings
    if (rating <= 2) {
        await sendAdminNotification(
            ADMIN_NOTIFICATION_TYPES.LOW_RATING,
            `⭐ Poor rating (${rating}★) from ${userData.fullName}`,
            {
                feedbackId: feedbackRef.key,
                rating,
                transactionId
            },
            'medium'
        );
    }

    // ... existing code ...
}

// ============================================================================
// ENHANCED UI - Update notifications.js
// ============================================================================

/**
 * Add to getNotificationIcon() function
 */
function getNotificationIcon(type) {
    const icons = {
        // Existing icons
        'offer': 'handshake',
        'offer_accepted': 'check-circle',
        'offer_rejected': 'times-circle',
        'counter_offer': 'exchange-alt',
        'message': 'envelope',
        'payment': 'credit-card',
        'delivery': 'truck',

        // NEW: Admin notification icons
        'admin_dispute': 'gavel',
        'admin_payment_failure': 'exclamation-triangle',
        'admin_suspicious': 'shield-alt',
        'admin_new_user': 'user-plus',
        'admin_new_book': 'book',
        'admin_high_value': 'gem',
        'admin_low_rating': 'star-half-alt',
        'admin_report': 'flag',
        'admin_pattern': 'chart-line',
        'admin_txn_complete': 'check',
        'admin_stale_offer': 'clock',
        'admin_txn_cancelled': 'ban',
        'admin_milestone': 'trophy',
        'admin_digest': 'newspaper'
    };
    return icons[type] || 'bell';
}

/**
 * Add priority-based styling
 */
function getPriorityClass(priority) {
    const classes = {
        'critical': 'notif-critical',
        'high': 'notif-high',
        'medium': 'notif-medium',
        'low': 'notif-low'
    };
    return classes[priority] || '';
}

/**
 * Update notification item HTML to include priority
 */
function createNotificationHTML(notif) {
    const priorityClass = getPriorityClass(notif.priority);
    const icon = getNotificationIcon(notif.type);

    return `
        <div class="notification-item ${notif.read ? '' : 'unread'} ${priorityClass}" 
             data-id="${notif.id}" 
             onclick="handleNotificationClick('${notif.id}', '${notif.type}', ...)">
            <div class="notification-icon ${notif.type}">
                <i class="fas fa-${icon}"></i>
            </div>
            <div class="notification-content">
                <p class="notification-message">${notif.message}</p>
                <span class="notification-time">${formatTimeAgo(notif.createdAt)}</span>
            </div>
            ${!notif.read ? '<div class="unread-dot"></div>' : ''}
        </div>
    `;
}
