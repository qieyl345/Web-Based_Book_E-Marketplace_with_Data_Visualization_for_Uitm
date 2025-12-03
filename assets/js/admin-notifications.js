// ============================================================================
// ADMIN NOTIFICATION SYSTEM
// File: assets/js/admin-notifications.js
// ============================================================================

/**
 * Notification type constants for admins
 */
const ADMIN_NOTIFICATION_TYPES = {
    // Critical Alerts
    DISPUTE_FILED: 'admin_dispute',
    PAYMENT_FAILURE: 'admin_payment_failure',
    SUSPICIOUS_ACTIVITY: 'admin_suspicious',

    // Platform Monitoring
    NEW_USER: 'admin_new_user',
    NEW_BOOK: 'admin_new_book',
    HIGH_VALUE_TRANSACTION: 'admin_high_value',

    // Content Moderation
    LOW_RATING: 'admin_low_rating',
    CONTENT_REPORT: 'admin_report',
    NEGATIVE_PATTERN: 'admin_pattern',

    // Transaction Management
    TRANSACTION_COMPLETE: 'admin_txn_complete',
    STALE_OFFER: 'admin_stale_offer',
    TRANSACTION_CANCELLED: 'admin_txn_cancelled',

    // Milestones
    MILESTONE: 'admin_milestone',
    DAILY_DIGEST: 'admin_digest'
};

/**
 * Send notification to all admin users
 * @param {string} type - Notification type from ADMIN_NOTIFICATION_TYPES
 * @param {string} message - Notification message
 * @param {object} data - Additional data (IDs, amounts, etc.)
 * @param {string} priority - Priority level: 'critical', 'high', 'medium', 'low'
 */
async function sendAdminNotification(type, message, data = {}, priority = 'medium') {
    try {
        console.log(`[ADMIN-NOTIF] Sending ${type} notification...`);

        // Get all admin users
        const adminsSnapshot = await database.ref('users')
            .orderByChild('role')
            .equalTo('admin')
            .once('value');

        const adminIds = [];
        adminsSnapshot.forEach(child => {
            adminIds.push(child.key);
        });

        if (adminIds.length === 0) {
            console.warn('[ADMIN-NOTIF] No admins found in system');
            return;
        }

        console.log(`[ADMIN-NOTIF] Sending to ${adminIds.length} admin(s)`);

        // Create notification for each admin
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
        console.log(`[ADMIN-NOTIF] ✅ Sent: ${type} (${priority})`);

    } catch (error) {
        console.error('[ADMIN-NOTIF] ❌ Error sending notification:', error);
    }
}

/**
 * Get all admins from the system
 * @returns {Promise<Array>} Array of admin user objects
 */
async function getAllAdmins() {
    try {
        const snapshot = await database.ref('users')
            .orderByChild('role')
            .equalTo('admin')
            .once('value');

        const admins = [];
        snapshot.forEach(child => {
            admins.push({
                uid: child.key,
                ...child.val()
            });
        });

        return admins;
    } catch (error) {
        console.error('[ADMIN-NOTIF] Error getting admins:', error);
        return [];
    }
}

console.log('📜 [ADMIN-NOTIF] admin-notifications.js loaded');
