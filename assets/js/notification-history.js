// ===========================================
// NOTIFICATION HISTORY PAGE - Full Page View
// ===========================================

let allNotifications = [];
let currentFilter = 'all';
let notificationHistoryListener = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    console.log('[NOTIF-HISTORY] Initializing notification history page');

    // Wait for auth
    if (typeof waitForAuth === 'function') {
        await waitForAuth();
    }

    if (!currentUser) {
        console.warn('[NOTIF-HISTORY] No user logged in');
        window.location.href = 'login.html';
        return;
    }

    setupFilterButtons();
    setupRealTimeListener();
});

// Setup filter buttons
function setupFilterButtons() {
    const filterBtns = document.querySelectorAll('.filter-btn');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active state
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Apply filter
            currentFilter = btn.dataset.filter;
            renderNotifications();
        });
    });
}

// Setup real-time Firebase listener
function setupRealTimeListener() {
    console.log('[NOTIF-HISTORY] Setting up real-time listener');

    const notifRef = database.ref('notifications')
        .orderByChild('recipientId')
        .equalTo(currentUser.uid);

    // Remove existing listener
    if (notificationHistoryListener) {
        notifRef.off('value', notificationHistoryListener);
    }

    // Real-time listener
    notificationHistoryListener = notifRef.on('value', (snapshot) => {
        console.log('[NOTIF-HISTORY] Real-time update received');

        allNotifications = [];
        snapshot.forEach(child => {
            const notif = child.val();
            notif.id = child.key;
            allNotifications.push(notif);
        });

        // Sort by createdAt descending
        allNotifications.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

        renderNotifications();
    }, (error) => {
        console.error('[NOTIF-HISTORY] Firebase listener error:', error);
    });
}

// Render notifications based on current filter
function renderNotifications() {
    const container = document.getElementById('notificationFullList');
    if (!container) return;

    let filtered = [...allNotifications];

    // Apply filter
    switch (currentFilter) {
        case 'unread':
            filtered = filtered.filter(n => !n.read);
            break;
        case 'offers':
            filtered = filtered.filter(n => ['offer', 'counter_offer', 'offer_accepted', 'offer_rejected'].includes(n.type));
            break;
        case 'transactions':
            filtered = filtered.filter(n => ['transaction', 'payment_received', 'payout_received', 'order_confirmed'].includes(n.type));
            break;
        case 'warranty':
            filtered = filtered.filter(n => ['warranty_claimed', 'return_sent', 'return_received', 'refund_processed'].includes(n.type));
            break;
    }

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-notifications">
                <i class="fas fa-bell-slash"></i>
                <h3>No notifications</h3>
                <p>${currentFilter === 'all' ? 'You have no notifications yet.' : `No ${currentFilter} notifications.`}</p>
            </div>
        `;
        return;
    }

    container.innerHTML = filtered.map(notif => {
        const iconData = getNotificationIconData(notif.type);
        const badgeData = getNotificationBadge(notif.type);
        const timeAgo = formatTimeAgoFull(notif.createdAt);

        return `
            <div class="notification-full-item ${notif.read ? '' : 'unread'}" 
                 onclick="handleHistoryNotificationClick('${notif.id}', '${notif.type}', '${notif.offerId || ''}', '${notif.bookId || ''}', '${notif.transactionId || ''}')">
                <div class="notification-icon-large" style="background: ${iconData.bg};">
                    <i class="fas ${iconData.icon}"></i>
                </div>
                <div class="notification-content">
                    <div class="notification-title">${getNotificationTitle(notif.type)}</div>
                    <div class="notification-message">${notif.message || 'No message'}</div>
                    <div class="notification-meta">
                        <span class="notification-time">
                            <i class="fas fa-clock"></i> ${timeAgo}
                        </span>
                        ${badgeData ? `<span class="notification-badge ${badgeData.class}">${badgeData.text}</span>` : ''}
                    </div>
                </div>
                <div class="notification-actions-btn">
                    ${!notif.read ? `<button onclick="event.stopPropagation(); markNotificationRead('${notif.id}')" title="Mark as read"><i class="fas fa-check"></i></button>` : ''}
                    <button onclick="event.stopPropagation(); deleteNotification('${notif.id}')" title="Delete"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
    }).join('');
}

// Get notification icon data
function getNotificationIconData(type) {
    const icons = {
        // Offers
        'offer': { icon: 'fa-tag', bg: '#3b82f6' },
        'counter_offer': { icon: 'fa-exchange-alt', bg: '#8b5cf6' },
        'offer_accepted': { icon: 'fa-check-circle', bg: '#22c55e' },
        'offer_rejected': { icon: 'fa-times-circle', bg: '#ef4444' },
        // Transactions
        'transaction': { icon: 'fa-shopping-cart', bg: '#10b981' },
        'payment_received': { icon: 'fa-wallet', bg: '#22c55e' },
        'payout_received': { icon: 'fa-money-bill-wave', bg: '#22c55e' },
        'order_confirmed': { icon: 'fa-check-double', bg: '#10b981' },
        'book_sold': { icon: 'fa-shopping-bag', bg: '#10b981' },
        'sale_notification': { icon: 'fa-store', bg: '#10b981' },
        'sale_cancelled': { icon: 'fa-times-circle', bg: '#ef4444' },
        // Warranty/Returns
        'warranty_claimed': { icon: 'fa-exclamation-triangle', bg: '#f59e0b' },
        'return_sent': { icon: 'fa-box', bg: '#3b82f6' },
        'return_received': { icon: 'fa-box-open', bg: '#22c55e' },
        'refund_processed': { icon: 'fa-undo', bg: '#8b5cf6' },
        'claim_dismissed': { icon: 'fa-ban', bg: '#64748b' },
        'claim_auto_dismissed': { icon: 'fa-clock', bg: '#f59e0b' },
        // Admin
        'admin_dispute': { icon: 'fa-gavel', bg: '#ef4444' },
        'admin_notification': { icon: 'fa-shield-alt', bg: '#3b82f6' },
        // Feedback
        'feedback': { icon: 'fa-star', bg: '#eab308' },
        'review_received': { icon: 'fa-star', bg: '#eab308' },
        // System
        'system': { icon: 'fa-cog', bg: '#64748b' },
        'message': { icon: 'fa-comment', bg: '#3b82f6' }
    };
    return icons[type] || { icon: 'fa-bell', bg: '#64748b' };
}

// Get notification title based on type
function getNotificationTitle(type) {
    const titles = {
        // Offers
        'offer': 'New Offer Received',
        'counter_offer': 'Counter Offer',
        'offer_accepted': 'Offer Accepted!',
        'offer_rejected': 'Offer Declined',
        // Transactions
        'transaction': 'New Transaction',
        'payment_received': 'Payment Received',
        'payout_received': 'Payout Complete',
        'order_confirmed': 'Order Confirmed',
        'book_sold': 'Book Sold!',
        'sale_notification': 'New Sale',
        'sale_cancelled': 'Sale Cancelled',
        // Warranty/Returns
        'warranty_claimed': 'Warranty Claim',
        'return_sent': 'Return Initiated',
        'return_received': 'Return Confirmed',
        'refund_processed': 'Refund Processed',
        'claim_dismissed': 'Claim Dismissed',
        'claim_auto_dismissed': 'Claim Auto-Dismissed',
        // Admin
        'admin_dispute': 'Admin Alert',
        'admin_notification': 'System Notice',
        // Feedback
        'feedback': 'New Feedback',
        'review_received': 'New Review',
        // System
        'system': 'System Message',
        'message': 'New Message'
    };
    return titles[type] || 'Notification';
}

// Get badge data
function getNotificationBadge(type) {
    if (['offer', 'counter_offer', 'offer_accepted', 'offer_rejected'].includes(type)) {
        return { class: 'badge-offer', text: 'Offer' };
    }
    if (['transaction', 'payment_received', 'payout_received', 'order_confirmed', 'book_sold', 'sale_notification', 'sale_cancelled'].includes(type)) {
        return { class: 'badge-transaction', text: 'Transaction' };
    }
    if (['warranty_claimed', 'return_sent', 'return_received', 'refund_processed', 'claim_dismissed', 'claim_auto_dismissed'].includes(type)) {
        return { class: 'badge-warranty', text: 'Warranty' };
    }
    if (['admin_dispute', 'admin_notification'].includes(type)) {
        return { class: 'badge-admin', text: 'Admin' };
    }
    if (['feedback', 'review_received'].includes(type)) {
        return { class: 'badge-feedback', text: 'Feedback' };
    }
    if (['system', 'message'].includes(type)) {
        return { class: 'badge-system', text: 'System' };
    }
    return null;
}

// Format time ago (more detailed)
function formatTimeAgoFull(timestamp) {
    if (!timestamp) return 'Unknown';

    const now = Date.now();
    const diff = now - timestamp;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;

    // Format as date
    return new Date(timestamp).toLocaleDateString('en-MY', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Handle notification click - Navigate to appropriate page
function handleHistoryNotificationClick(notifId, type, offerId, bookId, transactionId) {
    // Mark as read first
    markNotificationRead(notifId);

    console.log('[NOTIF-HISTORY] Click handler:', { type, offerId, bookId, transactionId });

    // Determine path prefix based on current page location
    const isInPagesFolder = window.location.pathname.includes('/pages/');
    const pagePrefix = isInPagesFolder ? '' : 'pages/';

    // Navigation map based on notification type
    switch (type) {
        // === OFFER RELATED ===
        case 'offer':
        case 'counter_offer':
        case 'offer_accepted':
        case 'offer_rejected':
            // Go to negotiations tab on profile
            window.location.href = `${pagePrefix}profile.html#negotiations`;
            break;

        // === TRANSACTION/PAYMENT - BUYER ===
        case 'transaction':
        case 'payment_received':
        case 'order_confirmed':
        case 'delivery_confirmed':
            // Go to purchases tab on profile
            window.location.href = `${pagePrefix}profile.html#purchases`;
            break;

        // === TRANSACTION/PAYMENT - SELLER ===
        case 'payout_received':
        case 'sale_notification':
        case 'book_sold':
            // Go to sales tab on profile
            window.location.href = `${pagePrefix}profile.html#sales`;
            break;

        // === WARRANTY/RETURN - BUYER ===
        case 'warranty_claimed':
        case 'return_sent':
        case 'return_received':
        case 'refund_processed':
        case 'claim_dismissed':
        case 'claim_auto_dismissed':
            // Go to purchases tab on profile
            window.location.href = `${pagePrefix}profile.html#purchases`;
            break;

        // === WARRANTY/RETURN - SELLER ===
        case 'warranty_claim_received':
        case 'return_confirmation_needed':
            // Go to sales tab on profile
            window.location.href = `${pagePrefix}profile.html#sales`;
            break;

        // === ADMIN NOTIFICATIONS ===
        case 'admin_dispute':
        case 'admin_warning':
        case 'admin_notification':
            // Admin should go to admin dashboard
            window.location.href = `${pagePrefix}admin.html`;
            break;

        // === FEEDBACK ===
        case 'feedback':
        case 'review_received':
            // Go to profile main page
            window.location.href = `${pagePrefix}profile.html`;
            break;

        // === BOOK RELATED ===
        case 'book_interest':
        case 'book_view':
            if (bookId && bookId !== 'undefined') {
                window.location.href = `${pagePrefix}book-details.html?id=${bookId}`;
            } else {
                window.location.href = `${pagePrefix}profile.html#listings`;
            }
            break;

        // === MESSAGE/CHAT ===
        case 'message':
        case 'chat':
            if (offerId && offerId !== 'undefined') {
                window.location.href = `${pagePrefix}chat.html?offerId=${offerId}`;
            } else {
                window.location.href = `${pagePrefix}profile.html#negotiations`;
            }
            break;

        // === DEFAULT FALLBACK ===
        default:
            // Try to navigate based on available IDs
            if (transactionId && transactionId !== 'undefined') {
                window.location.href = `${pagePrefix}profile.html#purchases`;
            } else if (offerId && offerId !== 'undefined') {
                window.location.href = `${pagePrefix}profile.html#negotiations`;
            } else if (bookId && bookId !== 'undefined') {
                window.location.href = `${pagePrefix}book-details.html?id=${bookId}`;
            } else {
                // Last resort - go to profile
                window.location.href = `${pagePrefix}profile.html`;
            }
            break;
    }
}

// Mark single notification as read
async function markNotificationRead(notifId) {
    try {
        await database.ref(`notifications/${notifId}`).update({ read: true });
        console.log('[NOTIF-HISTORY] Marked notification as read:', notifId);
    } catch (error) {
        console.error('[NOTIF-HISTORY] Error marking read:', error);
    }
}

// Delete notification
async function deleteNotification(notifId) {
    if (!confirm('Delete this notification?')) return;

    try {
        await database.ref(`notifications/${notifId}`).remove();
        console.log('[NOTIF-HISTORY] Deleted notification:', notifId);
        showNotification('Notification deleted', 'success');
    } catch (error) {
        console.error('[NOTIF-HISTORY] Error deleting:', error);
        showNotification('Error deleting notification', 'error');
    }
}

// Mark all notifications as read
async function markAllNotificationsRead() {
    try {
        const updates = {};
        allNotifications.forEach(n => {
            if (!n.read) {
                updates[`notifications/${n.id}/read`] = true;
            }
        });

        if (Object.keys(updates).length > 0) {
            await database.ref().update(updates);
            showNotification('All notifications marked as read', 'success');
        } else {
            showNotification('No unread notifications', 'info');
        }
    } catch (error) {
        console.error('[NOTIF-HISTORY] Error marking all read:', error);
        showNotification('Error marking notifications as read', 'error');
    }
}

// Cleanup listener on page unload
window.addEventListener('beforeunload', () => {
    if (notificationHistoryListener) {
        database.ref('notifications').off('value', notificationHistoryListener);
    }
});
