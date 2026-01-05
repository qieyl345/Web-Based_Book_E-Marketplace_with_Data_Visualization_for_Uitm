// ============================================================================
// NOTIFICATION SYSTEM - Rewritten from scratch for simplicity and reliability
// ============================================================================

let notificationListener = null;
let unreadNotificationCount = 0;

// ============================================================================
// MAIN INITIALIZATION
// ============================================================================

function initNotificationSystem() {
    console.log('🔔 [NOTIF] Starting notification system initialization...');

    // Check if user is logged in
    if (!currentUser) {
        console.log('⏳ [NOTIF] No user logged in yet, waiting...');
        return;
    }

    console.log(`✅ [NOTIF] User logged in: ${currentUser.uid}`);

    // Setup notification bell click handler
    setupBellClickHandler();

    // Setup Firebase real-time listener
    setupFirebaseListener();

    // Setup click-outside-to-close handler
    setupOutsideClickHandler();

    console.log('✅ [NOTIF] Notification system fully initialized!');
}

// ============================================================================
// FIREBASE LISTENER
// ============================================================================

function setupFirebaseListener() {
    console.log('📡 [NOTIF] Setting up Firebase listener...');

    // Remove any existing listener first
    if (notificationListener) {
        notificationListener.off();
        console.log('🗑️ [NOTIF] Removed old listener');
    }

    // Create Firebase query for this user's notifications
    notificationListener = firebase.database()
        .ref('notifications')
        .orderByChild('recipientId')
        .equalTo(currentUser.uid);

    console.log(`📡 [NOTIF] Created listener for user: ${currentUser.uid}`);

    // Attach the listener
    notificationListener.on('value', (snapshot) => {
        console.log('🔥 [NOTIF] Firebase listener triggered!');
        console.log('📦 [NOTIF] Snapshot data:', snapshot.val());

        handleNotificationUpdate(snapshot);
    }, (error) => {
        console.error('❌ [NOTIF] Firebase listener error:', error);
    });

    console.log('✅ [NOTIF] Firebase listener attached successfully');
}

function handleNotificationUpdate(snapshot) {
    const notifications = [];

    snapshot.forEach((childSnapshot) => {
        notifications.push({
            id: childSnapshot.key,
            ...childSnapshot.val()
        });
    });

    console.log(`📊 [NOTIF] Found ${notifications.length} total notifications`);

    // Filter notifications for admin users - only show dispute notifications
    let filteredNotifications = notifications;
    if (userData && userData.role === 'admin') {
        filteredNotifications = notifications.filter(n => n.type === 'admin_dispute');
        console.log(`📊 [NOTIF] Admin user - filtered to ${filteredNotifications.length} dispute notifications`);
    }

    // Sort by timestamp (newest first)
    filteredNotifications.sort((a, b) => b.createdAt - a.createdAt);

    // Count unread (from filtered notifications)
    const newUnreadCount = filteredNotifications.filter(n => !n.read).length;
    console.log(`📊 [NOTIF] Unread: ${newUnreadCount}`);

    // Check if this is a NEW notification (sound/alert)
    if (newUnreadCount > unreadNotificationCount && unreadNotificationCount > 0) {
        console.log('🆕 [NOTIF] NEW notification detected!');
        playNotificationSound();
        showBrowserNotification(filteredNotifications.find(n => !n.read));
    }

    unreadNotificationCount = newUnreadCount;

    // Update UI
    updateNotificationBadge(newUnreadCount);
    updateNotificationList(filteredNotifications);
}

// ============================================================================
// UI UPDATES
// ============================================================================

function updateNotificationBadge(count) {
    const badge = document.getElementById('notificationBadge');
    if (!badge) return;

    if (count > 0) {
        badge.style.display = 'block';
        badge.textContent = count > 99 ? '99+' : count;
        console.log(`✅ [NOTIF] Badge updated: ${count}`);
    } else {
        badge.style.display = 'none';
        console.log('✅ [NOTIF] Badge hidden (no unread)');
    }
}

function updateNotificationList(notifications) {
    const listElement = document.getElementById('notificationList');
    if (!listElement) return;

    if (notifications.length === 0) {
        listElement.innerHTML = `
            <div class="notification-empty">
                <i class="fas fa-bell-slash"></i>
                <p>No notifications yet</p>
            </div>
        `;
        console.log('📋 [NOTIF] Displayed empty state');
        return;
    }

    // Display up to 10 most recent notifications
    const html = notifications.slice(0, 10).map(notif => {
        const timeAgo = formatTimeAgo(notif.createdAt);
        const icon = getNotificationIcon(notif.type);
        const readClass = notif.read ? '' : 'unread';
        const priorityClass = getPriorityClass(notif.priority);

        const iconData = getNotificationIconData(notif.type);
        return `
            <div class="notification-item ${readClass} ${priorityClass}" 
                 data-id="${notif.id}" 
                 onclick="handleNotificationClick('${notif.id}', '${notif.type}', '${notif.offerId || ''}', '${notif.bookId || ''}')">
                <div class="notification-icon" style="background: ${iconData.bg};">
                    <i class="fas ${iconData.icon}"></i>
                </div>
                <div class="notification-content">
                    <p class="notification-message">${notif.message}</p>
                    <span class="notification-time">${timeAgo}</span>
                </div>
                ${!notif.read ? '<div class="unread-dot"></div>' : ''}
            </div>
        `;
    }).join('');

    // Determine the path to notifications page
    const isInPagesDir = window.location.pathname.includes('/pages/');
    const notifPagePath = isInPagesDir ? 'notifications.html' : 'pages/notifications.html';

    // Add View All link at the bottom
    const viewAllLink = `
        <div class="notification-view-all" style="text-align: center; padding: 0.75rem; border-top: 1px solid #e2e8f0;">
            <a href="${notifPagePath}" style="color: #3b82f6; font-size: 0.875rem; font-weight: 600; text-decoration: none;">
                <i class="fas fa-list"></i> View All Notifications
            </a>
        </div>
    `;

    listElement.innerHTML = html + viewAllLink;
    console.log(`📋 [NOTIF] Displayed ${notifications.length} notifications with View All link`);
}

// ============================================================================
// BELL CLICK HANDLER
// ============================================================================

function setupBellClickHandler() {
    const bell = document.getElementById('notificationBell');
    if (!bell) {
        console.warn('⚠️ [NOTIF] Bell element not found in DOM');
        return;
    }

    bell.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log('🔔 [NOTIF] Bell clicked!');
        toggleNotificationDropdown();
    });

    console.log('✅ [NOTIF] Bell click handler attached');
}

function toggleNotificationDropdown() {
    const dropdown = document.getElementById('notificationDropdown');
    if (!dropdown) return;

    const isShowing = dropdown.classList.contains('show');

    if (isShowing) {
        dropdown.classList.remove('show');
        console.log('📤 [NOTIF] Dropdown closed');
    } else {
        dropdown.classList.add('show');
        console.log('📥 [NOTIF] Dropdown opened');
    }
}

// ============================================================================
// CLICK OUTSIDE TO CLOSE
// ============================================================================

function setupOutsideClickHandler() {
    document.addEventListener('click', (e) => {
        const dropdown = document.getElementById('notificationDropdown');
        const bell = document.getElementById('notificationBell');

        if (!dropdown || !bell) return;

        // If click is outside both dropdown and bell, close dropdown
        if (!dropdown.contains(e.target) && !bell.contains(e.target)) {
            dropdown.classList.remove('show');
        }
    });

    console.log('✅ [NOTIF] Outside click handler attached');
}

// ============================================================================
// NOTIFICATION CLICK HANDLER
// ============================================================================

async function handleNotificationClick(notifId, type, offerId, bookId) {
    console.log(`🖱️ [NOTIF] Notification clicked: ${notifId}`);

    // Mark as read
    try {
        await firebase.database().ref(`notifications/${notifId}`).update({ read: true });
        console.log(`✅ [NOTIF] Marked as read: ${notifId}`);
    } catch (error) {
        console.error('❌ [NOTIF] Error marking as read:', error);
    }

    // Determine base path adjustment
    const isInPagesDir = window.location.pathname.includes('/pages/');
    const basePath = isInPagesDir ? '' : 'pages/';
    const rootPath = isInPagesDir ? '../' : '';

    // Navigate based on notification type
    if (type.includes('offer') || type === 'message') {
        if (offerId) {
            window.location.href = `${basePath}chat.html?offerId=${offerId}`;
        }
    } else if (type === 'payment' || type === 'delivery') {
        window.location.href = `${basePath}profile.html`;
    } else if (bookId) {
        window.location.href = `${basePath}book-details.html?id=${bookId}`;
    }

    // Close dropdown
    const dropdown = document.getElementById('notificationDropdown');
    if (dropdown) dropdown.classList.remove('show');
}

// ============================================================================
// MARK ALL AS READ
// ============================================================================

async function markAllAsRead() {
    console.log('📖 [NOTIF] Marking all as read...');

    if (!currentUser) return;

    try {
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
            console.log(`✅ [NOTIF] Marked ${Object.keys(updates).length} notifications as read`);
        }

        // Close dropdown
        const dropdown = document.getElementById('notificationDropdown');
        if (dropdown) dropdown.classList.remove('show');

    } catch (error) {
        console.error('❌ [NOTIF] Error marking all as read:', error);
    }
}

// ============================================================================
// NOTIFICATION SOUND
// ============================================================================

function playNotificationSound() {
    try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjGH0fPTgjMGHm7A7+OZRQ4PVqzn77BdGAlCmuD1xW8eBTGG0PTTfC4FI3fH8t2RQQsVXrTq66lWFApGn+DyvmwhBjGH0fPTgjMGHW7A7uSaRQ4QV6vn8LFdGAlDmOD1xW8fBTGH0PPTfC0FJHfH8t2RQQsVXrPq66lWFApGnt/yvmwhBjGH0fPTgjMHHW6/7uSaRQ0QVqzn8LBdGQlDl9/1xm8fBTGH0fPTejYFJHfH8t2RQQoVXrPq66lXFApGnt/yvm0hBjCH0fPTgjIHHW6/7uSaRQ8RVqvn8LBdGAlDl9/1xm4fBTGH0fPTejYFJHfH8t2RQQoVXrPq66lXFQpGnt/yvmwhBjCH0fPTgjIGH26/7uSaRQ0QVqvn8LBdGAlDmN/1xW4fBTGH0fPSejYFJHfH8t2RQQoUXrTo7KpXEwlFn+DyvmwhBi+H0fPTgjIGH2y/7uSZRQ0QVavp8LBdGAlDmN/1xG4fBS+H0fPSejYFI3fH8dyRQgoUXbTo7KpXEwlFn+DyvmshBi+H0fPTgzIGH2y/7uSZRQ0QVavp8LBdGAlDmN/1xG4fBS+G0fPSejYFI3fH8dyRQgoUXbTo7KpXEwlFn9/yvmshBi+H0fPTgzIGH2y/7eSZRQ0QVavp8LBdGAlDmN/1xG4fBS+G0fPSejYFI3fH8dyRQgoUXbTo7KpXEwlFn9/yvmshBi+H0fPTgzIGH2y/7eSZRQ0QVavp8LBdGAlDmN/1xG4fBS+G0fPSejYFI3fH8dyRQgoUXbTo7KpXEwlFn9/yvmshBi+H0fPTgzIGH2y/7eSZRQ0QVavp8LBdGAlDmN/1xG4fBS+G0fPSejYFI3fH8dyRQgoUXbTo7KpXEwlFn9/yvmshBi+H0fPTgzIGH2y/7eSZRQ0QVavp8LBdGAlDmN/1xG4fBS+G0fPSejYFI3fH8dyRQgoUXbTo7KpXEwlFn9/yvmshBi+H0fPTgzIGH2y/7eSZRQ0QVavp8LBdGAlDmN/1xG4fBS+G0fPSejYFI3fH8dyRQgoUXbTo7KpXEwlFn9/yvmshBi+H0fPTgzIGH2y/7eSZRQ0QVavp8LBdGAlDmN/1xG4fBS+G0fPSejYFI3fH8dyRQgoUXbTo7KpXEwlFn9/yvmshBi+H0fPTgzIGH2y/7eSZRQ0QVavp8LBdGAlDmN/1xG4fBS+G0fPSejYFI3fH8dyRQgoUXbTo7KpXEwlFn9/yv2shBi+H0fPTgzIGH2y/7eSZRQ0QVavp8LBdGAlDmN/1xG4fBS+G0fPSejYFI3fH8dyRQgoUXbTo7KpXEwlFn9/yv2shBi+H0fPU==');
        audio.volume = 0.3;
        audio.play().catch(e => console.log('🔇 [NOTIF] Sound not played:', e));
        console.log('🔊 [NOTIF] Played notification sound');
    } catch (error) {
        console.log('🔇 [NOTIF] Sound notification not supported');
    }
}

// ============================================================================
// BROWSER NOTIFICATION (DESKTOP)
// ============================================================================

function showBrowserNotification(notification) {
    if (!('Notification' in window)) {
        console.log('🔇 [NOTIF] Browser notifications not supported');
        return;
    }

    if (Notification.permission === 'granted') {
        createBrowserNotification(notification);
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                createBrowserNotification(notification);
            }
        });
    }
}

function createBrowserNotification(notification) {
    const notif = new Notification('UiTM e-Marketplace', {
        body: notification.message,
        icon: 'assets/images/logo.png',
        tag: notification.id
    });

    notif.onclick = () => {
        window.focus();
        handleNotificationClick(
            notification.id,
            notification.type,
            notification.offerId,
            notification.bookId
        );
        notif.close();
    };

    console.log('🖥️ [NOTIF] Browser notification shown');
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Get notification icon data with background colors (matches notification-history.js)
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
        'payment': { icon: 'fa-credit-card', bg: '#22c55e' },
        'delivery': { icon: 'fa-truck', bg: '#3b82f6' },
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
        'admin_payment_failure': { icon: 'fa-exclamation-triangle', bg: '#ef4444' },
        'admin_suspicious': { icon: 'fa-shield-alt', bg: '#f59e0b' },
        'admin_new_user': { icon: 'fa-user-plus', bg: '#22c55e' },
        'admin_new_book': { icon: 'fa-book', bg: '#3b82f6' },
        'admin_high_value': { icon: 'fa-gem', bg: '#8b5cf6' },
        'admin_low_rating': { icon: 'fa-star-half-alt', bg: '#f59e0b' },
        'admin_report': { icon: 'fa-flag', bg: '#ef4444' },
        'admin_pattern': { icon: 'fa-chart-line', bg: '#3b82f6' },
        'admin_txn_complete': { icon: 'fa-check', bg: '#22c55e' },
        'admin_stale_offer': { icon: 'fa-clock', bg: '#f59e0b' },
        'admin_txn_cancelled': { icon: 'fa-ban', bg: '#ef4444' },
        'admin_milestone': { icon: 'fa-trophy', bg: '#eab308' },
        'admin_digest': { icon: 'fa-newspaper', bg: '#64748b' },
        // Feedback
        'feedback': { icon: 'fa-star', bg: '#eab308' },
        'review_received': { icon: 'fa-star', bg: '#eab308' },
        // System
        'system': { icon: 'fa-cog', bg: '#64748b' },
        'message': { icon: 'fa-comment', bg: '#3b82f6' }
    };
    return icons[type] || { icon: 'fa-bell', bg: '#64748b' };
}

function getNotificationIcon(type) {
    const icons = {
        // User notifications
        'offer': 'handshake',
        'offer_accepted': 'check-circle',
        'offer_rejected': 'times-circle',
        'counter_offer': 'exchange-alt',
        'message': 'envelope',
        'payment': 'credit-card',
        'delivery': 'truck',

        // Admin notifications
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

function getPriorityClass(priority) {
    if (!priority) return '';
    const classes = {
        'critical': 'notif-critical',
        'high': 'notif-high',
        'medium': 'notif-medium',
        'low': 'notif-low'
    };
    return classes[priority] || '';
}

function formatTimeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(timestamp).toLocaleDateString();
}

// ============================================================================
// AUTO-INITIALIZATION
// ============================================================================

console.log('📜 [NOTIF] notifications.js loaded');

// Try to initialize immediately if auth is ready
if (typeof currentUser !== 'undefined' && currentUser) {
    console.log('⚡ [NOTIF] User already logged in, initializing immediately');
    initNotificationSystem();
} else {
    console.log('⏳ [NOTIF] Waiting for authentication...');

    // Wait for auth using the waitForAuth promise from firebase-config.js
    if (typeof waitForAuth === 'function') {
        waitForAuth().then(() => {
            console.log('✅ [NOTIF] Authentication completed, initializing notifications');
            initNotificationSystem();
        });
    } else {
        console.warn('⚠️ [NOTIF] waitForAuth not found, will retry in 2 seconds');
        setTimeout(() => {
            if (currentUser) {
                initNotificationSystem();
            }
        }, 2000);
    }
}
