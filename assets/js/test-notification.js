// Test Notification Function - FOR DEBUGGING ONLY
// This file helps diagnose notification display issues

document.addEventListener('DOMContentLoaded', async () => {
    // Wait for auth to be initialized
    if (typeof waitForAuth === 'function') {
        await waitForAuth();
    }

    const testBtn = document.getElementById('testNotificationBtn');

    if (testBtn && currentUser) {
        // Show the test button for logged-in users
        testBtn.style.display = 'inline-block';

        testBtn.addEventListener('click', async () => {
            try {
                console.log('🧪 Creating test notification...');

                const testNotification = {
                    recipientId: currentUser.uid,
                    senderId: 'system',
                    senderName: 'Test System',
                    type: 'message',
                    message: `Test notification created at ${new Date().toLocaleTimeString()}`,
                    read: false,
                    createdAt: Date.now()
                };

                await database.ref('notifications').push(testNotification);

                console.log('✅ Test notification created successfully!');
                showNotification('Test notification created! Check the bell icon.', 'success');

            } catch (error) {
                console.error('❌ Error creating test notification:', error);
                showNotification('Failed to create test notification: ' + error.message, 'error');
            }
        });

        console.log('🧪 Test notification button initialized');
    }
});

// Function to manually check notifications in database
async function checkNotificationsInDatabase() {
    if (!currentUser) {
        console.error('❌ No user logged in');
        return;
    }

    try {
        console.log('🔍 Checking notifications in database for user:', currentUser.uid);

        const snapshot = await database.ref('notifications')
            .orderByChild('recipientId')
            .equalTo(currentUser.uid)
            .once('value');

        const notifications = [];
        snapshot.forEach(child => {
            notifications.push({
                id: child.key,
                ...child.val()
            });
        });

        console.log('📊 Notifications found:', notifications.length);
        console.table(notifications.map(n => ({
            id: n.id,
            message: n.message,
            type: n.type,
            read: n.read,
            createdAt: new Date(n.createdAt).toLocaleString()
        })));

        return notifications;
    } catch (error) {
        console.error('❌ Error checking notifications:', error);
    }
}

// Make function available in console for manual testing
window.checkNotificationsInDatabase = checkNotificationsInDatabase;
console.log('💡 TIP: Run checkNotificationsInDatabase() in console to manually check notifications');
