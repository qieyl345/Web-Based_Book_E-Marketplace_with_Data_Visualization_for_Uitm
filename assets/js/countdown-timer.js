/**
 * Live Countdown Timer Utility
 * Provides real-time countdown functionality for the 7-day warranty timeline
 */

// Global interval reference for cleanup
let countdownInterval = null;

/**
 * Calculate time remaining until target timestamp
 * @param {number} targetTimestamp - Target time in milliseconds
 * @returns {object} - Object with days, hours, minutes, seconds, and total milliseconds remaining
 */
function calculateTimeRemaining(targetTimestamp) {
    const now = Date.now();
    const diff = targetTimestamp - now;
    
    if (diff <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0, expired: true };
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return { days, hours, minutes, seconds, total: diff, expired: false };
}

/**
 * Format countdown as simple string "5d 14h 23m 12s"
 * @param {number} targetTimestamp - Target time in milliseconds
 * @returns {string} - Formatted countdown string
 */
function formatCountdown(targetTimestamp) {
    const time = calculateTimeRemaining(targetTimestamp);
    
    if (time.expired) {
        return 'Expired';
    }
    
    const parts = [];
    if (time.days > 0) parts.push(`${time.days}d`);
    if (time.hours > 0 || time.days > 0) parts.push(`${time.hours}h`);
    if (time.minutes > 0 || time.hours > 0 || time.days > 0) parts.push(`${time.minutes}m`);
    parts.push(`${time.seconds}s`);
    
    return parts.join(' ');
}

/**
 * Generate HTML for a detailed countdown widget
 * @param {number} targetTimestamp - Target time in milliseconds
 * @param {number} startTimestamp - Start time (for progress calculation)
 * @param {string} label - Widget header label
 * @param {string} icon - Emoji/icon for the widget
 * @returns {string} - HTML string for countdown widget
 */
function generateCountdownWidgetHTML(targetTimestamp, startTimestamp, label, icon = '⏱️') {
    const time = calculateTimeRemaining(targetTimestamp);
    const progressPercent = calculateCountdownProgress(startTimestamp, targetTimestamp);
    const urgencyClass = getUrgencyClass(time);
    const expiryDate = formatDateTime(targetTimestamp);
    
    return `
        <div class="countdown-widget ${urgencyClass}" data-target="${targetTimestamp}" data-start="${startTimestamp}">
            <div class="countdown-header">${icon} ${label}</div>
            <div class="countdown-timer">
                <div class="countdown-unit">
                    <span class="countdown-value countdown-days">${String(time.days).padStart(2, '0')}</span>
                    <span class="countdown-label">Days</span>
                </div>
                <div class="countdown-separator">:</div>
                <div class="countdown-unit">
                    <span class="countdown-value countdown-hours">${String(time.hours).padStart(2, '0')}</span>
                    <span class="countdown-label">Hrs</span>
                </div>
                <div class="countdown-separator">:</div>
                <div class="countdown-unit">
                    <span class="countdown-value countdown-minutes">${String(time.minutes).padStart(2, '0')}</span>
                    <span class="countdown-label">Min</span>
                </div>
                <div class="countdown-separator">:</div>
                <div class="countdown-unit">
                    <span class="countdown-value countdown-seconds">${String(time.seconds).padStart(2, '0')}</span>
                    <span class="countdown-label">Sec</span>
                </div>
            </div>
            <div class="countdown-progress">
                <div class="countdown-progress-bar" style="width: ${progressPercent}%"></div>
            </div>
            <div class="countdown-expiry">Expires: ${expiryDate}</div>
        </div>
    `;
}

/**
 * Calculate progress percentage (how much time has elapsed)
 * @param {number} startTimestamp - When the period started
 * @param {number} endTimestamp - When the period ends
 * @returns {number} - Percentage elapsed (0-100)
 */
function calculateCountdownProgress(startTimestamp, endTimestamp) {
    const now = Date.now();
    const totalDuration = endTimestamp - startTimestamp;
    const elapsed = now - startTimestamp;
    
    if (totalDuration <= 0) return 100;
    if (elapsed <= 0) return 0;
    if (elapsed >= totalDuration) return 100;
    
    return Math.round((elapsed / totalDuration) * 100);
}

/**
 * Get urgency CSS class based on time remaining
 * @param {object} time - Time remaining object
 * @returns {string} - CSS class name
 */
function getUrgencyClass(time) {
    if (time.expired) return 'countdown-expired';
    if (time.days === 0 && time.hours < 1) return 'countdown-critical';
    if (time.days === 0 && time.hours < 24) return 'countdown-urgent';
    if (time.days < 2) return 'countdown-warning';
    return '';
}

/**
 * Format timestamp to readable date/time
 * @param {number} timestamp - Timestamp in milliseconds
 * @returns {string} - Formatted date/time string
 */
function formatDateTime(timestamp) {
    const date = new Date(timestamp);
    const options = { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    };
    return date.toLocaleDateString('en-US', options);
}

/**
 * Update all countdown widgets on the page
 */
function updateAllCountdowns() {
    const widgets = document.querySelectorAll('.countdown-widget[data-target]');
    
    widgets.forEach(widget => {
        const targetTimestamp = parseInt(widget.getAttribute('data-target'));
        const startTimestamp = parseInt(widget.getAttribute('data-start')) || (targetTimestamp - 7 * 24 * 60 * 60 * 1000);
        
        if (isNaN(targetTimestamp)) return;
        
        const time = calculateTimeRemaining(targetTimestamp);
        const progressPercent = calculateCountdownProgress(startTimestamp, targetTimestamp);
        const urgencyClass = getUrgencyClass(time);
        
        // Update countdown values
        const daysEl = widget.querySelector('.countdown-days');
        const hoursEl = widget.querySelector('.countdown-hours');
        const minutesEl = widget.querySelector('.countdown-minutes');
        const secondsEl = widget.querySelector('.countdown-seconds');
        const progressBar = widget.querySelector('.countdown-progress-bar');
        
        if (daysEl) daysEl.textContent = String(time.days).padStart(2, '0');
        if (hoursEl) hoursEl.textContent = String(time.hours).padStart(2, '0');
        if (minutesEl) minutesEl.textContent = String(time.minutes).padStart(2, '0');
        if (secondsEl) secondsEl.textContent = String(time.seconds).padStart(2, '0');
        if (progressBar) progressBar.style.width = `${progressPercent}%`;
        
        // Update urgency class
        widget.classList.remove('countdown-warning', 'countdown-urgent', 'countdown-critical', 'countdown-expired');
        if (urgencyClass) widget.classList.add(urgencyClass);
        
        // Handle expiry
        if (time.expired) {
            widget.classList.add('countdown-expired');
            const header = widget.querySelector('.countdown-header');
            if (header && !header.textContent.includes('EXPIRED')) {
                header.innerHTML = '⌛ TIME EXPIRED';
            }
        }
    });
}

/**
 * Initialize countdown timers with 1-second interval
 */
function initializeCountdownTimers() {
    // Clear any existing interval
    destroyCountdownTimers();
    
    // Initial update
    updateAllCountdowns();
    
    // Start interval for live updates
    countdownInterval = setInterval(updateAllCountdowns, 1000);
    
    console.log('[COUNTDOWN] Live countdown timers initialized');
}

/**
 * Cleanup countdown interval
 */
function destroyCountdownTimers() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
        console.log('[COUNTDOWN] Countdown timers destroyed');
    }
}

// Export functions for use in other modules
window.CountdownTimer = {
    calculateTimeRemaining,
    formatCountdown,
    generateCountdownWidgetHTML,
    calculateCountdownProgress,
    formatDateTime,
    initializeCountdownTimers,
    destroyCountdownTimers,
    updateAllCountdowns
};

// Auto-cleanup on page unload
window.addEventListener('beforeunload', destroyCountdownTimers);
