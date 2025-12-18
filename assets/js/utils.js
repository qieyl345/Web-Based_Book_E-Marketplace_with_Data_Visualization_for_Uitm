/**
 * UiTM e-Marketplace - Utility Helpers
 * Enhanced utilities for security, UX, and consistent patterns
 */

// ===========================================
// SANITIZATION HELPERS
// Prevent XSS by safely escaping user content
// ===========================================

/**
 * Safely escape HTML special characters
 * Use this when inserting user-generated content into HTML
 * @param {string} text - Raw text to escape
 * @returns {string} HTML-safe escaped text
 */
function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Safely set text content without HTML parsing
 * @param {HTMLElement} element - Target element
 * @param {string} text - Text content to set
 */
function safeSetText(element, text) {
    if (element) {
        element.textContent = text || '';
    }
}

/**
 * Create safe HTML element with escaped text content
 * @param {string} tag - HTML tag name
 * @param {string} text - Text content (will be escaped)
 * @param {object} attributes - Optional attributes
 * @returns {HTMLElement}
 */
function createSafeElement(tag, text, attributes = {}) {
    const element = document.createElement(tag);
    element.textContent = text || '';
    Object.entries(attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
    });
    return element;
}

// ===========================================
// SKELETON LOADER HELPERS
// Generate loading placeholders for better UX
// ===========================================

/**
 * Create a skeleton loader placeholder
 * @param {string} type - Type: 'text', 'card', 'image', 'button', 'table-row'
 * @param {number} count - Number of skeleton items to generate
 * @returns {string} HTML string for skeleton loader
 */
function createSkeletonLoader(type = 'text', count = 1) {
    const skeletons = [];

    for (let i = 0; i < count; i++) {
        switch (type) {
            case 'card':
                skeletons.push(`
                    <div class="skeleton-card">
                        <div class="skeleton skeleton-image"></div>
                        <div class="skeleton skeleton-title"></div>
                        <div class="skeleton skeleton-text"></div>
                        <div class="skeleton skeleton-text short"></div>
                    </div>
                `);
                break;

            case 'image':
                skeletons.push('<div class="skeleton skeleton-image"></div>');
                break;

            case 'button':
                skeletons.push('<div class="skeleton skeleton-button"></div>');
                break;

            case 'table-row':
                skeletons.push(`
                    <tr class="skeleton-row">
                        <td><div class="skeleton skeleton-text"></div></td>
                        <td><div class="skeleton skeleton-text"></div></td>
                        <td><div class="skeleton skeleton-text short"></div></td>
                        <td><div class="skeleton skeleton-text short"></div></td>
                    </tr>
                `);
                break;

            case 'text':
            default:
                skeletons.push('<div class="skeleton skeleton-text"></div>');
                break;
        }
    }

    return skeletons.join('');
}

/**
 * Show skeleton loader in a container
 * @param {HTMLElement|string} container - Container element or selector
 * @param {string} type - Skeleton type
 * @param {number} count - Number of skeleton items
 */
function showSkeletonLoader(container, type = 'card', count = 3) {
    const el = typeof container === 'string'
        ? document.querySelector(container)
        : container;

    if (el) {
        el.innerHTML = `<div class="skeleton-container">${createSkeletonLoader(type, count)}</div>`;
    }
}

// ===========================================
// DEBOUNCE & THROTTLE UTILITIES
// Prevent excessive function calls
// ===========================================

/**
 * Debounce function - delays execution until after wait period
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function - limits execution to once per wait period
 * @param {Function} func - Function to throttle
 * @param {number} limit - Minimum time between executions
 * @returns {Function} Throttled function
 */
function throttle(func, limit = 300) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ===========================================
// FORM VALIDATION HELPERS
// Consistent validation patterns
// ===========================================

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Whether email is valid
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate UiTM email domain
 * @param {string} email - Email to validate
 * @returns {boolean} Whether email is valid UiTM domain
 */
function isValidUitmEmail(email) {
    return email.endsWith('@student.uitm.edu.my') || email.endsWith('@staff.uitm.edu.my');
}

/**
 * Validate price value
 * @param {number|string} value - Price to validate
 * @returns {boolean} Whether price is valid
 */
function isValidPrice(value) {
    const price = parseFloat(value);
    return !isNaN(price) && price > 0 && price < 10000;
}

/**
 * Sanitize and format price
 * @param {number|string} value - Raw price value
 * @returns {number} Clean price value
 */
function sanitizePrice(value) {
    const price = parseFloat(value);
    return isNaN(price) ? 0 : Math.max(0, Math.round(price * 100) / 100);
}

// ===========================================
// ERROR HANDLING HELPERS
// Consistent error messaging
// ===========================================

/**
 * Handle and display error with user-friendly message
 * @param {Error} error - Error object
 * @param {string} fallbackMessage - Fallback message if error message is technical
 */
function handleError(error, fallbackMessage = 'An error occurred. Please try again.') {
    console.error('[Error]:', error);

    // Map technical Firebase errors to user-friendly messages
    const errorMessages = {
        'auth/user-not-found': 'Account not found. Please check your credentials.',
        'auth/wrong-password': 'Incorrect password. Please try again.',
        'auth/email-already-in-use': 'This email is already registered.',
        'auth/weak-password': 'Password is too weak. Use at least 6 characters.',
        'auth/network-request-failed': 'Network error. Please check your connection.',
        'PERMISSION_DENIED': 'You do not have permission to perform this action.'
    };

    const message = errorMessages[error.code] || error.message || fallbackMessage;
    showNotification(message, 'error');
}

// ===========================================
// EXPORT FOR GLOBAL USE
// ===========================================

// Make utilities globally accessible
window.escapeHtml = escapeHtml;
window.safeSetText = safeSetText;
window.createSafeElement = createSafeElement;
window.createSkeletonLoader = createSkeletonLoader;
window.showSkeletonLoader = showSkeletonLoader;
window.debounce = debounce;
window.throttle = throttle;
window.isValidEmail = isValidEmail;
window.isValidUitmEmail = isValidUitmEmail;
window.isValidPrice = isValidPrice;
window.sanitizePrice = sanitizePrice;
window.handleError = handleError;
