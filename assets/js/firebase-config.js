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
const COMMISSION_RATE = 0.025; // 2.5% commission fee on all transactions

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

    // Display welcome message
    const welcomeMsg = document.getElementById('welcomeMsg');
    if (welcomeMsg && userData.fullName) {
        // Check if new structure exists (with .welcome-name span)
        const welcomeNameSpan = welcomeMsg.querySelector('.welcome-name');
        if (welcomeNameSpan) {
            // New structure with separate spans
            welcomeNameSpan.textContent = userData.fullName;
            welcomeMsg.style.display = 'inline-flex';
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
