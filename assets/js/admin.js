// Admin dashboard functionality

// Debug mode - set to true for verbose console logging
const ADMIN_DEBUG_MODE = false;
function debugLog(...args) {
    if (ADMIN_DEBUG_MODE) console.log('[ADMIN]', ...args);
}
let allUsers = [];
let allTransactions = [];
let allBooks = [];

// Store chart instances globally for dynamic updates
let salesChartInstance = null;
let revenueChartInstance = null;
let warrantyResolutionChartInstance = null;
let topBooksChartInstance = null;
let subjectChartInstance = null;
let transactionSuccessChartInstance = null;
let feedbackDistributionChartInstance = null;
let offerFunnelChartInstance = null;

// ===== ANALYTICS CACHE SYSTEM =====
// Caches chart data for 5 minutes to speed up page revisits
const analyticsCache = {
    data: {},
    ttl: 5 * 60 * 1000, // 5 minutes in milliseconds

    set(key, value) {
        this.data[key] = {
            value: value,
            timestamp: Date.now()
        };
    },

    get(key) {
        const cached = this.data[key];
        if (!cached) return null;

        // Check if cache is still valid
        if (Date.now() - cached.timestamp > this.ttl) {
            delete this.data[key];
            return null;
        }
        return cached.value;
    },

    clear() {
        this.data = {};
        console.log('[ADMIN] Analytics cache cleared');
    }
};

// Initialize admin dashboard
document.addEventListener('DOMContentLoaded', async () => {
    console.log('[ADMIN] DOMContentLoaded fired');

    try {
        // Wait for auth to be initialized first
        console.log('[ADMIN] Checking waitForAuth...');
        if (typeof waitForAuth === 'function') {
            console.log('[ADMIN] waitForAuth is available, awaiting...');
            await waitForAuth();
            console.log('[ADMIN] waitForAuth completed');
        } else {
            console.error('[ADMIN] waitForAuth function not found!');
            return;
        }

        console.log('[ADMIN] Current user:', currentUser);
        console.log('[ADMIN] User data:', userData);

        console.log('[ADMIN] Checking requireAdmin...');
        await requireAdmin();
        console.log('[ADMIN] requireAdmin completed');

        console.log('[ADMIN] Loading dashboard data...');
        await loadDashboardData();
        console.log('[ADMIN] Dashboard data loaded');

        setupExportButton();
        setupUserSearch();
        setupTransactionSearch(); // Setup transaction ID search
        setupSettingsForm();
        setupChartFilters(); // Setup filter event listeners
        setupRealtimeListeners(); // Enable live dashboard updates

        console.log('[ADMIN] Admin initialization complete');
    } catch (error) {
        console.error('[ADMIN] Initialization error:', error);
    }
});

async function loadDashboardData() {
    console.log('[ADMIN] loadDashboardData called');
    try {
        // Load stats FIRST (this fetches all data from Firebase)
        console.log('[ADMIN] Loading stats and data...');
        await loadStats();
        console.log('[ADMIN] Stats loaded');

        // Now load display components (they have the data they need)
        console.log('[ADMIN] Loading display components...');
        await Promise.all([
            loadRecentTransactions(),
            loadUsers(),
            loadCharts(),
            loadWarrantyIssues(),
            loadPayoutQueue(),       // NEW
            loadReviewsAndDisputes(), // NEW: Split feedback
            loadSellerLeaderboard(), // NEW
            loadActivityLog(),       // NEW
            loadQuickStats(),        // NEW
            loadSystemHealth(),      // NEW: System health summary
            loadCriticalAnalytics()
        ]);
        console.log('[ADMIN] All data loaded successfully');
    } catch (error) {
        console.error("[ADMIN] Error loading dashboard:", error);
        showNotification("Error loading dashboard", "error");
    }
}

async function loadStats() {
    console.log('[ADMIN] loadStats called');
    try {
        console.log('[ADMIN] Fetching transactions from Firebase...');
        const transactionsSnapshot = await database.ref('transactions').once('value');
        allTransactions = [];
        let txnCount = 0;
        transactionsSnapshot.forEach(childSnapshot => {
            const transaction = childSnapshot.val();
            transaction.id = childSnapshot.key;
            allTransactions.push(transaction);
            txnCount++;
        });
        console.log(`[ADMIN] Loaded ${txnCount} transactions`);

        // Debug: Show books in transactions
        console.log('[ADMIN] Checking books in transactions...');
        allTransactions.forEach((txn, i) => {
            console.log(`[ADMIN] Transaction ${i + 1}:`, {
                id: txn.transactionId,
                items: txn.items?.map(item => ({
                    bookTitle: item.bookDetails?.title,
                    bookAuthor: item.bookDetails?.author
                })) || []
            });
        });

        // Calculate total commission
        const totalCommission = allTransactions.reduce((sum, txn) => sum + (txn.commissionFee || 0), 0);
        console.log('[ADMIN] Total commission:', totalCommission);

        console.log('[ADMIN] Fetching users from Firebase...');
        const usersSnapshot = await database.ref('users').once('value');
        allUsers = [];
        let userCount = 0;
        usersSnapshot.forEach(childSnapshot => {
            const user = childSnapshot.val();
            user.uid = childSnapshot.key;
            allUsers.push(user);
            userCount++;
        });
        console.log(`[ADMIN] Loaded ${userCount} users`);

        console.log('[ADMIN] Fetching books from Firebase...');
        console.log('[ADMIN] Database path: books');
        console.log('[ADMIN] Current user permissions:', {
            uid: currentUser?.uid,
            email: userData?.email
        });

        const booksSnapshot = await database.ref('books').once('value');
        console.log('[ADMIN] Books snapshot key:', booksSnapshot.key);
        console.log('[ADMIN] Books snapshot exists:', booksSnapshot.exists());
        console.log('[ADMIN] Books snapshot numChildren:', booksSnapshot.numChildren());

        allBooks = [];
        let bookCount = 0;
        booksSnapshot.forEach(childSnapshot => {
            const book = childSnapshot.val();
            book.id = childSnapshot.key;
            allBooks.push(book);
            bookCount++;
            console.log(`[ADMIN] Book ${bookCount}:`, {
                id: book.id,
                title: book.title,
                author: book.author
            });
        });
        console.log(`[ADMIN] Loaded ${bookCount} books total`);

        // Update stats display
        const totalTransactionsEl = document.getElementById('totalTransactions');
        const totalCommissionEl = document.getElementById('totalCommission');
        const totalUsersEl = document.getElementById('totalUsers');
        const totalBooksEl = document.getElementById('totalBooks');

        console.log('[ADMIN] Elements found:', {
            totalTransactions: !!totalTransactionsEl,
            totalCommission: !!totalCommissionEl,
            totalUsers: !!totalUsersEl,
            totalBooks: !!totalBooksEl
        });

        if (totalTransactionsEl) totalTransactionsEl.textContent = allTransactions.length;
        if (totalCommissionEl) totalCommissionEl.textContent = formatCurrency(totalCommission);
        if (totalUsersEl) totalUsersEl.textContent = allUsers.length;
        if (totalBooksEl) totalBooksEl.textContent = allBooks.length;

        console.log('[ADMIN] Stats display updated');
    } catch (error) {
        console.error("[ADMIN] Error loading stats:", error);
    }
}

async function loadRecentTransactions() {
    console.log('[ADMIN] loadRecentTransactions called');
    const tbody = document.getElementById('recentTransactions');

    if (!tbody) {
        console.error('[ADMIN] recentTransactions tbody not found!');
        return;
    }

    console.log('[ADMIN] recentTransactions element found');
    tbody.innerHTML = '<tr><td colspan="6" class="loading-placeholder">Loading...</td></tr>';

    // Sort by date and take latest 10
    const recentTransactions = [...allTransactions]
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
        .slice(0, 10);

    console.log('[ADMIN] Recent transactions to display:', recentTransactions.length);

    tbody.innerHTML = recentTransactions.map(txn => `
        <tr>
            <td>${txn.transactionId || 'N/A'}</td>
            <td>${txn.buyerName || 'N/A'}</td>
            <td>${txn.items?.[0]?.bookDetails?.title || 'N/A'}</td>
            <td>${formatCurrency(txn.amount || 0)}</td>
            <td><span class="status-badge ${txn.status || 'unknown'}">${txn.status || 'unknown'}</span></td>
            <td>${formatDate(txn.createdAt || Date.now())}</td>
        </tr>
    `).join('');

    console.log('[ADMIN] Recent transactions table updated');
}

async function loadUsers() {
    console.log('[ADMIN] loadUsers called');
    const tbody = document.getElementById('usersTable');

    if (!tbody) {
        console.error('[ADMIN] usersTable tbody not found!');
        return;
    }

    console.log('[ADMIN] usersTable element found');
    tbody.innerHTML = '<tr><td colspan="6" class="loading-placeholder">Loading...</td></tr>';

    console.log('[ADMIN] Users to display:', allUsers.length);

    tbody.innerHTML = allUsers.map(user => `
        <tr>
            <td>${user.fullName || 'N/A'}</td>
            <td>${user.email || 'N/A'}</td>
            <td>${user.role || 'N/A'}</td>
            <td>${user.totalSales || 0}</td>
            <td><span class="status-badge active">Active</span></td>
            <td>
                <button class="btn btn-sm btn-secondary" onclick="viewUser('${user.uid || ''}')">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        </tr>
    `).join('');

    console.log('[ADMIN] Users table updated');

    // Expose users globally for role-filter.js
    window.allUsers = allUsers;

    // Trigger role count update if function exists
    if (typeof window.updateRoleCounts === 'function') {
        window.updateRoleCounts();
    }
}

// NOTE: loadFeedback() function removed - replaced by loadReviewsAndDisputes() which has the correct table format

// ESCROW: Resolve dispute - REFUND to buyer
// WARRANTY FLOW: Requires both buyer and seller to confirm return first
// NON-DELIVERY: If seller never delivered, admin can refund directly
async function resolveDisputeForBuyer(transactionId, feedbackId) {
    if (!transactionId) {
        showNotification('Transaction ID is missing.', 'error');
        return;
    }

    try {
        // Get transaction
        const txnSnapshot = await database.ref(`transactions/${transactionId}`).once('value');
        const txn = txnSnapshot.val();
        if (!txn) {
            showNotification('Transaction not found. Please check the transaction ID.', 'error');
            return;
        }

        // Check if this is a non-delivery dispute (seller never delivered, no book to return)
        const isNonDeliveryDispute = txn.status === 'dispute_open' && txn.autoDisputeType === 'no_confirmation';

        // WARRANTY FLOW: Check if both parties confirmed the return
        // EXCEPTION: Non-delivery disputes don't require book return
        if (txn.status !== 'return_received' && !isNonDeliveryDispute) {
            const statusMessages = {
                'warranty_claimed': '⚠️ Buyer has claimed warranty but hasn\'t confirmed sending the book back yet.',
                'return_sent': '⚠️ Buyer says they sent the book, but seller hasn\'t confirmed receiving it yet.',
                'dispute_open': '⚠️ This is a legacy dispute. Both parties must confirm the book return before refund.',
                'delivered': '⚠️ This order is still in warranty period. No warranty claim yet.',
                'payment_held': '⚠️ Buyer hasn\'t confirmed receipt yet.'
            };

            const message = statusMessages[txn.status] || `Current status: ${txn.status}`;
            showNotification(`Cannot refund yet. ${message}`, 'warning');
            return;
        }

        // Different confirmation message based on dispute type
        const confirmMessage = isNonDeliveryDispute
            ? `Non-Delivery Dispute: Buyer never confirmed delivery (seller likely didn't deliver). Refund RM${txn.amount.toFixed(2)} to buyer now?`
            : 'Both parties have confirmed the book return. Refund the buyer now?';

        if (!confirm(confirmMessage)) return;

        const basePrice = txn.items.reduce((sum, item) => sum + item.bookDetails.price, 0);

        // Refund to buyer's wallet (full amount including what they paid)
        const buyerWalletRef = database.ref(`users/${txn.buyerId}/wallet`);
        const buyerWallet = (await buyerWalletRef.once('value')).val() || {};
        await buyerWalletRef.update({
            balance: (buyerWallet.balance || 0) + txn.amount  // Full refund including commission
        });
        console.log(`[ESCROW] Refunded RM${txn.amount} to buyer`);

        // Clear seller's funds (pendingEscrow for non-delivery, frozenDispute for warranty claims)
        for (const item of txn.items) {
            const sellerWalletRef = database.ref(`users/${item.bookDetails.sellerId}/wallet`);
            const sellerWallet = (await sellerWalletRef.once('value')).val() || {};

            if (isNonDeliveryDispute) {
                // Non-delivery: clear from pendingEscrow
                await sellerWalletRef.update({
                    pendingEscrow: Math.max(0, (sellerWallet.pendingEscrow || 0) - item.bookDetails.price)
                });
            } else {
                // Warranty dispute: clear from frozenDispute
                await sellerWalletRef.update({
                    frozenDispute: Math.max(0, (sellerWallet.frozenDispute || 0) - item.bookDetails.price)
                });
            }
        }
        console.log(`[ESCROW] Cleared seller's funds (${isNonDeliveryDispute ? 'pendingEscrow' : 'frozenDispute'})`);

        // Update transaction
        await database.ref(`transactions/${transactionId}`).update({
            status: 'refunded',
            disputeResolvedAt: Date.now(),
            disputeResolvedBy: currentUser.uid,
            disputeDecision: 'refund_buyer'
        });

        // Mark feedback as resolved if provided
        if (feedbackId) {
            await database.ref(`feedback/${feedbackId}`).update({ status: 'resolved' });
        }

        showNotification('Dispute resolved - Buyer refunded RM' + txn.amount.toFixed(2), 'success');
        loadReviewsAndDisputes();

    } catch (error) {
        console.error('Error resolving dispute:', error);
        showNotification('Failed to resolve dispute: ' + error.message, 'error');
    }
}

// ESCROW: Resolve dispute - PAY seller
async function resolveDisputeForSeller(transactionId, feedbackId) {
    if (!confirm('Release funds to seller? Buyer will not receive a refund.')) return;

    try {
        // Get transaction
        const txnSnapshot = await database.ref(`transactions/${transactionId}`).once('value');
        const txn = txnSnapshot.val();
        if (!txn) {
            showNotification('Transaction not found. Please check the transaction ID.', 'error');
            return;
        }

        const basePrice = txn.items.reduce((sum, item) => sum + item.bookDetails.price, 0);
        const commission = basePrice * COMMISSION_RATE;
        const sellerPayout = basePrice - commission;

        // Release funds to seller
        for (const item of txn.items) {
            const sellerWalletRef = database.ref(`users/${item.bookDetails.sellerId}/wallet`);
            const sellerWallet = (await sellerWalletRef.once('value')).val() || {};

            const itemCommission = item.bookDetails.price * COMMISSION_RATE;
            const itemPayout = item.bookDetails.price - itemCommission;

            await sellerWalletRef.update({
                frozenDispute: Math.max(0, (sellerWallet.frozenDispute || 0) - item.bookDetails.price),
                balance: (sellerWallet.balance || 0) + itemPayout,
                totalEarned: (sellerWallet.totalEarned || 0) + itemPayout
            });
        }
        console.log(`[ESCROW] Released RM${sellerPayout.toFixed(2)} to seller`);

        // Update transaction
        await database.ref(`transactions/${transactionId}`).update({
            status: 'completed',
            disputeResolvedAt: Date.now(),
            disputeResolvedBy: currentUser.uid,
            disputeDecision: 'release_seller',
            sellerPaidOut: true,
            sellerPayoutAmount: sellerPayout,
            commissionCollected: commission
        });

        // Mark feedback as resolved if provided
        if (feedbackId) {
            await database.ref(`feedback/${feedbackId}`).update({ status: 'resolved' });
        }

        showNotification('Dispute resolved - Seller paid RM' + sellerPayout.toFixed(2), 'success');
        loadReviewsAndDisputes();

    } catch (error) {
        console.error('Error resolving dispute:', error);
        showNotification('Failed to resolve dispute: ' + error.message, 'error');
    }
}

// Keep old function for backward compatibility
async function resolveDispute(feedbackId) {
    if (confirm('Mark this dispute as resolved? (Note: For fund management, use the Refund/Pay Seller buttons)')) {
        try {
            await database.ref(`feedback/${feedbackId}`).update({ status: 'resolved' });
            showNotification('Dispute marked as resolved', 'success');
            loadReviewsAndDisputes();
        } catch (error) {
            showNotification('Error resolving dispute', 'error');
        }
    }
}

async function loadCharts() {
    console.log('[ADMIN] loadCharts called');

    // Check if Chart.js is loaded
    if (typeof Chart === 'undefined') {
        console.error('[ADMIN] Chart.js is not loaded! Check script tag in HTML');
        return;
    }
    console.log('[ADMIN] Chart.js is available:', typeof Chart);

    try {
        // Sales Trend Chart
        console.log('[ADMIN] Creating Sales Trend Chart...');
        const salesCtx = document.getElementById('salesChart');
        if (!salesCtx) {
            console.error('[ADMIN] salesChart canvas not found!');
        } else {
            const salesData = calculateSalesTrendWithFilter('all'); // Default to All Time
            console.log('[ADMIN] Sales data:', salesData);
            salesChartInstance = new Chart(salesCtx.getContext('2d'), {
                type: 'line',
                data: {
                    labels: salesData.labels,
                    datasets: [{
                        label: 'Transactions',
                        data: salesData.data,
                        borderColor: '#005C99',
                        backgroundColor: 'rgba(0, 92, 153, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                precision: 0
                            }
                        }
                    }
                }
            });
            console.log('[ADMIN] Sales Trend Chart created');
        }

        // Revenue Chart
        console.log('[ADMIN] Creating Revenue Chart...');
        const revenueCtx = document.getElementById('revenueChart');
        if (!revenueCtx) {
            console.error('[ADMIN] revenueChart canvas not found!');
        } else {
            const revenueData = calculateRevenueTrendWithFilter('all'); // Default to All Time
            console.log('[ADMIN] Revenue data:', revenueData);
            revenueChartInstance = new Chart(revenueCtx.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: revenueData.labels,
                    datasets: [{
                        label: 'Commission Earned',
                        data: revenueData.data,
                        backgroundColor: '#00A86B'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function (value) {
                                    return 'RM ' + value;
                                }
                            }
                        }
                    }
                }
            });
            console.log('[ADMIN] Revenue Chart created');
        }

        // Top Sellers by Revenue Chart
        console.log('[ADMIN] Creating Top Sellers Chart...');
        const topSellersCtx = document.getElementById('topSellersChart');
        if (!topSellersCtx) {
            console.error('[ADMIN] topSellersChart canvas not found!');
        } else {
            const topSellersData = calculateTopSellers();
            console.log('[ADMIN] Top sellers data:', topSellersData);
            topBooksChartInstance = new Chart(topSellersCtx.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: topSellersData.labels,
                    datasets: [{
                        label: 'Revenue (RM)',
                        data: topSellersData.data,
                        backgroundColor: topSellersData.colors // Role-based colors
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    indexAxis: 'y',
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top',
                            labels: {
                                generateLabels: function () {
                                    return [
                                        { text: 'Student', fillStyle: '#3b82f6', strokeStyle: '#3b82f6' },
                                        { text: 'Staff', fillStyle: '#8b5cf6', strokeStyle: '#8b5cf6' }
                                    ];
                                }
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    const role = topSellersData.roles ? topSellersData.roles[context.dataIndex] : 'unknown';
                                    const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
                                    return `RM ${context.raw.toFixed(2)} (${roleLabel})`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            beginAtZero: true,
                            ticks: {
                                callback: function (value) {
                                    return 'RM ' + value;
                                }
                            }
                        }
                    }
                }
            });
            console.log('[ADMIN] Top Sellers Chart created');
        }

        // Subject Distribution Chart
        console.log('[ADMIN] Creating Subject Distribution Chart...');
        const subjectCtx = document.getElementById('subjectChart');
        if (!subjectCtx) {
            console.error('[ADMIN] subjectChart canvas not found!');
        } else {
            const subjectData = calculateSubjectDistribution();
            console.log('[ADMIN] Subject data:', subjectData);
            subjectChartInstance = new Chart(subjectCtx.getContext('2d'), {
                type: 'pie',
                data: {
                    labels: subjectData.labels,
                    datasets: [{
                        data: subjectData.data,
                        backgroundColor: [
                            '#005C99',
                            '#00A86B',
                            '#FFB81C',
                            '#3B82F6',
                            '#F59E0B',
                            '#EF4444'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'right'
                        }
                    }
                }
            });
            console.log('[ADMIN] Subject Distribution Chart created');
        }

        console.log('[ADMIN] All charts creation attempted');
    } catch (error) {
        console.error('[ADMIN] Error creating charts:', error);
    }
}

function calculateSalesTrend() {
    const last7Days = [];
    const data = [];

    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toLocaleDateString('en-MY', { month: 'short', day: 'numeric' });
        last7Days.push(dateStr);

        const count = allTransactions.filter(txn => {
            const txnDate = new Date(txn.createdAt);
            return txnDate.toDateString() === date.toDateString();
        }).length;

        data.push(count);
    }

    return { labels: last7Days, data };
}

function calculateRevenueTrend() {
    const last7Days = [];
    const data = [];

    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toLocaleDateString('en-MY', { month: 'short', day: 'numeric' });
        last7Days.push(dateStr);

        const revenue = allTransactions
            .filter(txn => {
                const txnDate = new Date(txn.createdAt);
                return txnDate.toDateString() === date.toDateString();
            })
            .reduce((sum, txn) => sum + (txn.commissionFee || 0), 0);

        data.push(revenue.toFixed(2));
    }

    return { labels: last7Days, data };
}

function calculateTopSellers() {
    const sellerData = {};

    // Add defensive check for empty transactions
    if (!allTransactions || allTransactions.length === 0) {
        return { labels: ['No Data'], data: [0], colors: ['#94a3b8'] };
    }

    allTransactions.forEach(txn => {
        if (txn.items && Array.isArray(txn.items)) {
            txn.items.forEach(item => {
                // Add null checks for bookDetails and seller info
                if (item && item.bookDetails && item.bookDetails.sellerName) {
                    const sellerName = item.bookDetails.sellerName;
                    const sellerId = item.bookDetails.sellerId;
                    const price = item.bookDetails.price || 0;

                    if (!sellerData[sellerName]) {
                        sellerData[sellerName] = { revenue: 0, sellerId: sellerId, role: null };
                    }
                    sellerData[sellerName].revenue += price;
                }
            });
        }
    });

    // Look up seller roles from allUsers
    Object.keys(sellerData).forEach(sellerName => {
        const sellerId = sellerData[sellerName].sellerId;
        const user = allUsers.find(u => u.id === sellerId || u.uid === sellerId);
        if (user) {
            sellerData[sellerName].role = user.role || 'student';
        } else {
            sellerData[sellerName].role = 'student'; // Default to student
        }
    });

    const sorted = Object.entries(sellerData)
        .sort((a, b) => b[1].revenue - a[1].revenue)
        .slice(0, 5);

    // Handle case when no sellers were found
    if (sorted.length === 0) {
        return { labels: ['No Data'], data: [0], colors: ['#94a3b8'] };
    }

    // Role-based colors: Student = Blue (#3b82f6), Staff = Purple (#8b5cf6)
    const roleColors = {
        'student': '#3b82f6',  // Blue
        'staff': '#8b5cf6',    // Purple
        'admin': '#ef4444'     // Red (just in case)
    };

    return {
        labels: sorted.map(([name]) => name.length > 15 ? name.substring(0, 15) + '...' : name),
        data: sorted.map(([, info]) => info.revenue),
        colors: sorted.map(([, info]) => roleColors[info.role] || '#3b82f6'),
        roles: sorted.map(([, info]) => info.role)
    };
}

function calculateSubjectDistribution() {
    const subjectCounts = {};

    // Add defensive check for empty books array
    if (!allBooks || allBooks.length === 0) {
        return { labels: ['No Data'], data: [1] };
    }

    allBooks.forEach(book => {
        // Add null check for book and subjectCode
        if (book && book.subjectCode) {
            subjectCounts[book.subjectCode] = (subjectCounts[book.subjectCode] || 0) + 1;
        }
    });

    const sorted = Object.entries(subjectCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6);

    // Handle case when no subjects were found
    if (sorted.length === 0) {
        return { labels: ['No Data'], data: [1] };
    }

    return {
        labels: sorted.map(([subject]) => subject),
        data: sorted.map(([, count]) => count)
    };
}

function setupExportButton() {
    const exportBtn = document.getElementById('exportTransactions');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            exportTransactionsToCSV();
        });
    }
}

// CSV Export Implementation with Date Range Filter
function exportTransactionsToCSV() {
    // Get date range from inputs
    const dateFromInput = document.getElementById('exportDateFrom');
    const dateToInput = document.getElementById('exportDateTo');

    let filteredTransactions = allTransactions;
    let dateRangeLabel = 'all_time';

    // Apply date filters if provided
    if (dateFromInput?.value || dateToInput?.value) {
        const fromDate = dateFromInput?.value ? new Date(dateFromInput.value) : null;
        const toDate = dateToInput?.value ? new Date(dateToInput.value + 'T23:59:59') : null;

        filteredTransactions = allTransactions.filter(txn => {
            const txnDate = new Date(txn.createdAt);
            if (fromDate && txnDate < fromDate) return false;
            if (toDate && txnDate > toDate) return false;
            return true;
        });

        // Create date label for filename
        const from = dateFromInput?.value || 'start';
        const to = dateToInput?.value || 'today';
        dateRangeLabel = `${from}_to_${to}`;
    }

    if (!filteredTransactions || filteredTransactions.length === 0) {
        showNotification("No transactions found for selected date range", "info");
        return;
    }

    // Define CSV headers
    const headers = [
        'Transaction ID',
        'Date',
        'Buyer Email',
        'Seller Email',
        'Book Title',
        'Book Price (RM)',
        'Commission (RM)',
        'Total Amount (RM)',
        'Status',
        'Payment Method'
    ];

    // Build CSV rows
    const rows = filteredTransactions.map(txn => {
        const bookTitle = txn.items && txn.items[0] && txn.items[0].bookDetails
            ? txn.items[0].bookDetails.title
            : 'N/A';
        const sellerEmail = txn.items && txn.items[0] && txn.items[0].bookDetails
            ? (txn.items[0].bookDetails.sellerEmail || 'N/A')
            : 'N/A';
        const bookPrice = txn.basePrice || (txn.items && txn.items[0] ? txn.items[0].bookDetails.price : 0);

        return [
            txn.id || 'N/A',
            txn.createdAt ? new Date(txn.createdAt).toLocaleString('en-MY') : 'N/A',
            txn.buyerEmail || 'N/A',
            sellerEmail,
            `"${bookTitle.replace(/"/g, '""')}"`, // Escape quotes in title
            bookPrice.toFixed(2),
            (txn.commissionFee || 0).toFixed(2),
            (txn.amount || 0).toFixed(2),
            txn.status || 'N/A',
            txn.paymentMethod || 'FPX'
        ];
    });

    // Combine headers and rows
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');

    // Create and trigger download
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `transactions_${dateRangeLabel}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
    showNotification(`Exported ${filteredTransactions.length} transactions to CSV`, "success");
}

function setupUserSearch() {
    const searchInput = document.getElementById('userSearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const filteredUsers = allUsers.filter(user =>
                user.fullName.toLowerCase().includes(searchTerm) ||
                user.email.toLowerCase().includes(searchTerm)
            );

            const tbody = document.getElementById('usersTable');
            tbody.innerHTML = filteredUsers.map(user => `
                <tr>
                    <td>${user.fullName}</td>
                    <td>${user.email}</td>
                    <td>${user.role || 'N/A'}</td>
                    <td>${user.totalSales || 0}</td>
                    <td><span class="status-badge active">Active</span></td>
                    <td>
                        <button class="btn btn-sm btn-secondary" onclick="viewUser('${user.uid}')">
                            <i class="fas fa-eye"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        });
    }
}

function setupTransactionSearch() {
    const searchInput = document.getElementById('transactionSearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();

            // Filter transactions by transaction ID
            const filteredTransactions = searchTerm
                ? allTransactions.filter(txn =>
                    (txn.transactionId || txn.id || '').toLowerCase().includes(searchTerm)
                )
                : [...allTransactions].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 10);

            const tbody = document.getElementById('recentTransactions');
            if (!tbody) return;

            if (filteredTransactions.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="text-center" style="padding: 2rem; color: #64748b;">No transactions found matching "' + searchTerm + '"</td></tr>';
                return;
            }

            tbody.innerHTML = filteredTransactions
                .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
                .slice(0, searchTerm ? 50 : 10) // Show more results when searching
                .map(txn => `
                    <tr>
                        <td>${txn.transactionId || 'N/A'}</td>
                        <td>${txn.buyerName || 'N/A'}</td>
                        <td>${txn.items?.[0]?.bookDetails?.title || 'N/A'}</td>
                        <td>${formatCurrency(txn.amount || 0)}</td>
                        <td><span class="status-badge ${txn.status || 'unknown'}">${txn.status || 'unknown'}</span></td>
                        <td>${formatDate(txn.createdAt || Date.now())}</td>
                    </tr>
                `).join('');
        });
    }
}

function setupSettingsForm() {
    const settingsForm = document.getElementById('settingsForm');
    if (settingsForm) {
        settingsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            showNotification("Settings saved successfully!", "success");
        });
    }
}

function viewUser(uid) {
    const user = allUsers.find(u => u.uid === uid);
    if (!user) {
        showNotification("User not found", "error");
        return;
    }

    // Create modal HTML with enhanced styling
    const modalHTML = `
        <div id="userDetailsModal" class="modal" style="display: flex; align-items: center; justify-content: center;">
            <div class="modal-content" style="max-width: 700px; max-height: 85vh; overflow-y: auto; margin: 2rem auto; position: relative;">
                <span class="modal-close" onclick="closeUserModal()">&times;</span>
                <h2 style="margin-bottom: 1.5rem; color: var(--primary-uitm);"><i class="fas fa-user-circle"></i> User Details</h2>
                
                <div class="user-details-container" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <!-- Profile Information Card -->
                    <div class="detail-card" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1.25rem;">
                        <h3 style="color: var(--primary-uitm); margin-bottom: 1rem; font-size: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                            <i class="fas fa-id-card"></i> Profile Information
                        </h3>
                        
                        <div class="detail-item" style="margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid #e2e8f0;">
                            <label style="font-size: 0.875rem; color: #64748b; display: block; margin-bottom: 0.25rem;">Full Name</label>
                            <span style="font-weight: 500; color: #1e293b;">${user.fullName || 'N/A'}</span>
                        </div>
                        
                        <div class="detail-item" style="margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid #e2e8f0;">
                            <label style="font-size: 0.875rem; color: #64748b; display: block; margin-bottom: 0.25rem;">Email</label>
                            <span style="font-weight: 500; color: #1e293b; word-break: break-all;">${user.email || 'N/A'}</span>
                        </div>
                        
                        <div class="detail-item" style="margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid #e2e8f0;">
                            <label style="font-size: 0.875rem; color: #64748b; display: block; margin-bottom: 0.25rem;">Phone Number</label>
                            <span style="font-weight: 500; color: #1e293b;">${user.phoneNumber || 'N/A'}</span>
                        </div>
                        
                        <div class="detail-item" style="margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid #e2e8f0;">
                            <label style="font-size: 0.875rem; color: #64748b; display: block; margin-bottom: 0.25rem;">Role</label>
                            <span class="role-badge" style="display: inline-block; background: var(--primary-uitm); color: white; padding: 0.375rem 0.75rem; border-radius: 6px; font-size: 0.875rem; font-weight: 500;">
                                ${user.role === 'admin' ? '<i class="fas fa-user-shield"></i>' : user.role === 'student' ? '<i class="fas fa-user-graduate"></i>' : '<i class="fas fa-user-tie"></i>'} 
                                ${(user.role || 'N/A').toUpperCase()}
                            </span>
                        </div>
                        
                        <div class="detail-item" style="margin-bottom: 0;">
                            <label style="font-size: 0.875rem; color: #64748b; display: block; margin-bottom: 0.25rem;">Seller Status</label>
                            <span style="font-weight: 500; color: ${user.isSeller ? 'var(--success)' : '#64748b'};">
                                <i class="fas ${user.isSeller ? 'fa-check-circle' : 'fa-times-circle'}"></i> 
                                ${user.isSeller ? 'Active Seller' : 'Not a Seller'}
                            </span>
                        </div>
                    </div>
                    
                    <!-- Activity Statistics Card -->
                    <div class="detail-card" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1.25rem;">
                        <h3 style="color: var(--primary-uitm); margin-bottom: 1rem; font-size: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                            <i class="fas fa-chart-line"></i> Activity Statistics
                        </h3>
                        
                        <div class="stat-box" style="background: linear-gradient(135deg, #00A86B 0%, #00c97d 100%); border-radius: 8px; padding: 1.25rem; margin-bottom: 1rem; color: white;">
                            <div style="font-size: 0.875rem; opacity: 0.9; margin-bottom: 0.5rem;">
                                <i class="fas fa-shopping-bag"></i> Total Sales
                            </div>
                            <div style="font-size: 2rem; font-weight: 700;">${user.totalSales || 0}</div>
                            <div style="font-size: 0.75rem; opacity: 0.8; margin-top: 0.25rem;">Books Sold</div>
                        </div>
                        
                        <div class="stat-box" style="background: linear-gradient(135deg, #005C99 0%, #0070b8 100%); border-radius: 8px; padding: 1.25rem; margin-bottom: 1rem; color: white;">
                            <div style="font-size: 0.875rem; opacity: 0.9; margin-bottom: 0.5rem;">
                                <i class="fas fa-shopping-cart"></i> Total Purchases
                            </div>
                            <div style="font-size: 2rem; font-weight: 700;">${user.totalPurchases || 0}</div>
                            <div style="font-size: 0.75rem; opacity: 0.8; margin-top: 0.25rem;">Books Bought</div>
                        </div>
                        
                        <div class="detail-item" style="padding: 1rem; background: white; border: 1px solid #e2e8f0; border-radius: 8px;">
                            <label style="font-size: 0.875rem; color: #64748b; display: block; margin-bottom: 0.5rem;">
                                <i class="far fa-calendar-alt"></i> Member Since
                            </label>
                            <span style="font-weight: 600; color: #1e293b;">
                                ${user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-MY', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                            </span>
                        </div>
                    </div>
                </div>
                
                <!-- User ID Section -->
                <div class="user-id-section" style="margin-top: 1rem; padding: 1rem; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 8px;">
                    <label style="font-size: 0.875rem; color: #64748b; display: block; margin-bottom: 0.5rem;">
                        <i class="fas fa-fingerprint"></i> User ID
                    </label>
                    <code style="background: white; padding: 0.5rem 0.75rem; border-radius: 6px; font-family: monospace; font-size: 0.875rem; color: #1e293b; border: 1px solid #e2e8f0; display: block;">${uid}</code>
                </div>
                
                <div class="modal-actions" style="margin-top: 1.5rem; display: flex; gap: 0.75rem; justify-content: flex-end; padding-top: 1rem; border-top: 1px solid #e2e8f0;">
                    <button class="btn btn-secondary" onclick="closeUserModal()">
                        <i class="fas fa-times"></i> Close
                    </button>
                </div>
            </div>
        </div>
    `;

    // Remove existing modal if any
    const existingModal = document.getElementById('userDetailsModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Add modal to document
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeUserModal() {
    const modal = document.getElementById('userDetailsModal');
    if (modal) {
        modal.remove();
    }
}

// ===== Critical Analytics Charts =====

let allOffers = []; // Will store offers data

async function loadCriticalAnalytics() {
    console.log('[ADMIN] loadCriticalAnalytics called');

    try {
        // Fetch offers data for the offer funnel chart
        const offersSnapshot = await database.ref('offers').once('value');
        allOffers = [];
        offersSnapshot.forEach(child => {
            allOffers.push({ id: child.key, ...child.val() });
        });
        console.log(`[ADMIN] Loaded ${allOffers.length} offers`);

        // Create all critical analytics charts
        createTransactionSuccessChart();
        createFeedbackDistributionChart();
        createWarrantyResolutionChart();
        createOfferFunnelChart();

        console.log('[ADMIN] Critical analytics charts created');
    } catch (error) {
        console.error('[ADMIN] Error loading critical analytics:', error);
    }
}

function createTransactionSuccessChart() {
    const ctx = document.getElementById('transactionSuccessChart');
    if (!ctx) return;

    const successData = calculateTransactionSuccessRate();

    transactionSuccessChartInstance = new Chart(ctx.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: ['Successful', 'Failed'],
            datasets: [{
                data: [
                    successData.successful,
                    successData.failed
                ],
                backgroundColor: ['#00A86B', '#EF4444'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const percentage = successData.total > 0
                                ? ((value / successData.total) * 100).toFixed(1)
                                : 0;
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function calculateTransactionSuccessRate() {
    let successful = 0, failed = 0, inProgress = 0;

    // Define status categories for accurate reporting
    const successStatuses = ['completed', 'successful'];
    const failedStatuses = ['cancelled', 'failed', 'refunded'];
    // Everything else is considered in-progress

    allTransactions.forEach(txn => {
        const status = txn.status?.toLowerCase() || 'unknown';
        if (successStatuses.includes(status)) {
            successful++;
        } else if (failedStatuses.includes(status)) {
            failed++;
        } else {
            // in-progress: payment_held, delivered, warranty_claimed, return_sent, return_received
            inProgress++;
        }
    });

    // For the chart, only show completed vs truly failed (exclude in-progress)
    return {
        successful,
        failed,
        inProgress,
        total: successful + failed + inProgress
    };
}

async function createFeedbackDistributionChart() {
    const ctx = document.getElementById('feedbackDistributionChart');
    if (!ctx) return;

    const distribution = await calculateFeedbackDistribution();

    feedbackDistributionChartInstance = new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: {
            labels: ['1 Star', '2 Stars', '3 Stars', '4 Stars', '5 Stars'],
            datasets: [{
                label: 'Number of Ratings',
                data: distribution.counts,
                backgroundColor: [
                    '#EF4444', // 1 star - red
                    '#F59E0B', // 2 stars - orange
                    '#FFB81C', // 3 stars - yellow
                    '#00A86B', // 4 stars - green
                    '#005C99'  // 5 stars - blue
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: `Avg Rating: ${distribution.average.toFixed(2)} / 5.0`
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
}

async function calculateFeedbackDistribution() {
    const counts = [0, 0, 0, 0, 0]; // For 1-5 stars
    let totalRating = 0;
    let totalCount = 0;

    try {
        const feedbackSnapshot = await database.ref('feedback').once('value');
        feedbackSnapshot.forEach(child => {
            const feedback = child.val();
            const rating = feedback.rating || 0;
            if (rating >= 1 && rating <= 5) {
                counts[rating - 1]++;
                totalRating += rating;
                totalCount++;
            }
        });
    } catch (error) {
        console.error('[ADMIN] Error fetching feedback for distribution:', error);
    }

    return {
        counts,
        average: totalCount > 0 ? totalRating / totalCount : 0,
        total: totalCount
    };
}

async function createWarrantyResolutionChart() {
    const ctx = document.getElementById('warrantyResolutionChart');
    if (!ctx) return;

    const metrics = calculateWarrantyResolutionMetrics('all'); // Default to All Time

    warrantyResolutionChartInstance = new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: {
            labels: metrics.labels,
            datasets: [
                {
                    label: 'Claims Opened',
                    data: metrics.opened,
                    backgroundColor: '#f59e0b',
                    order: 2
                },
                {
                    label: 'Claims Resolved',
                    data: metrics.resolved,
                    backgroundColor: '#22c55e',
                    order: 2
                },
                {
                    type: 'line',
                    label: 'Resolution Rate (%)',
                    data: metrics.resolutionRate,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    yAxisID: 'y1',
                    order: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    },
                    title: {
                        display: true,
                        text: 'Count'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    beginAtZero: true,
                    max: 100,
                    grid: {
                        drawOnChartArea: false
                    },
                    title: {
                        display: true,
                        text: 'Resolution Rate (%)'
                    }
                }
            }
        }
    });
}

// Calculate warranty resolution metrics from transactions (not feedback)
function calculateWarrantyResolutionMetrics(range) {
    // Warranty claim statuses
    const warrantyStatuses = ['warranty_claimed', 'return_sent', 'return_received', 'dispute_open'];
    const resolvedStatuses = ['refunded', 'completed'];

    // Get transactions with warranty claims
    const warrantyClaims = allTransactions.filter(txn =>
        warrantyStatuses.includes(txn.status) ||
        (resolvedStatuses.includes(txn.status) && txn.warrantyClaimedAt)
    );

    let weeks = 4;
    let labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    let daysPerPeriod = 7;

    if (range === '12') {
        weeks = 3;
        labels = ['Month 1', 'Month 2', 'Month 3'];
        daysPerPeriod = 30;
    } else if (range === '24') {
        weeks = 6;
        labels = ['Month 1', 'Month 2', 'Month 3', 'Month 4', 'Month 5', 'Month 6'];
        daysPerPeriod = 30;
    } else if (range === 'all') {
        // Group by month for all time
        const monthlyData = {};

        warrantyClaims.forEach(txn => {
            const claimDate = new Date(txn.warrantyClaimedAt || txn.createdAt);
            const monthYear = claimDate.toLocaleDateString('en-MY', { month: 'short', year: 'numeric' });

            if (!monthlyData[monthYear]) {
                monthlyData[monthYear] = { opened: 0, resolved: 0 };
            }

            monthlyData[monthYear].opened++;
            if (resolvedStatuses.includes(txn.status)) {
                monthlyData[monthYear].resolved++;
            }
        });

        const sortedMonths = Object.keys(monthlyData).sort((a, b) => new Date(a) - new Date(b));

        return {
            labels: sortedMonths.length > 0 ? sortedMonths : ['No Data'],
            opened: sortedMonths.map(m => monthlyData[m].opened),
            resolved: sortedMonths.map(m => monthlyData[m].resolved),
            resolutionRate: sortedMonths.map(m =>
                monthlyData[m].opened > 0
                    ? ((monthlyData[m].resolved / monthlyData[m].opened) * 100).toFixed(1)
                    : 0
            )
        };
    }

    const opened = new Array(weeks).fill(0);
    const resolved = new Array(weeks).fill(0);
    const resolutionRate = new Array(weeks).fill(0);

    for (let periodIndex = 0; periodIndex < weeks; periodIndex++) {
        const periodStart = new Date();
        periodStart.setDate(periodStart.getDate() - (daysPerPeriod * (weeks - periodIndex)));
        const periodEnd = new Date();
        periodEnd.setDate(periodEnd.getDate() - (daysPerPeriod * (weeks - periodIndex - 1)));

        warrantyClaims.forEach(txn => {
            const claimDate = new Date(txn.warrantyClaimedAt || txn.createdAt);
            if (claimDate >= periodStart && claimDate < periodEnd) {
                opened[periodIndex]++;
                if (resolvedStatuses.includes(txn.status)) {
                    resolved[periodIndex]++;
                }
            }
        });

        resolutionRate[periodIndex] = opened[periodIndex] > 0
            ? ((resolved[periodIndex] / opened[periodIndex]) * 100).toFixed(1)
            : 0;
    }

    return { labels, opened, resolved, resolutionRate };
}

function createOfferFunnelChart() {
    const ctx = document.getElementById('offerFunnelChart');
    if (!ctx) return;

    const funnelData = calculateOfferFunnel();

    offerFunnelChartInstance = new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: {
            labels: [
                'Offers Made',
                'Counter Offers',
                'Accepted Offers',
                'Completed Purchases'
            ],
            datasets: [{
                label: 'Count',
                data: funnelData.counts,
                backgroundColor: [
                    '#005C99',
                    '#3B82F6',
                    '#00A86B',
                    '#FFB81C'
                ]
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const value = context.parsed.x;
                            const percentage = funnelData.counts[0] > 0
                                ? ((value / funnelData.counts[0]) * 100).toFixed(1)
                                : 0;
                            return `Count: ${value} (${percentage}% of total)`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
}

function calculateOfferFunnel() {
    let totalOffers = allOffers.length;
    let counterOffers = 0;
    let acceptedOffers = 0;

    allOffers.forEach(offer => {
        if (offer.status === 'counter_offered') {
            counterOffers++;
        }
        if (offer.status === 'accepted') {
            acceptedOffers++;
        }
    });

    // Count completed purchases from accepted offers
    // (checking if transaction exists for accepted offers)
    let completedPurchases = allTransactions.filter(txn => {
        return txn.status === 'completed' && txn.fromOffer === true;
    }).length;

    return {
        counts: [
            totalOffers,
            counterOffers,
            acceptedOffers,
            completedPurchases
        ]
    };
}

// ===== CHART FILTERS =====

function setupChartFilters() {
    // Sales Trend Filter
    const salesTrendFilter = document.getElementById('salesTrendFilter');
    if (salesTrendFilter) {
        salesTrendFilter.addEventListener('change', (e) => {
            updateSalesChart(e.target.value);
        });
    }

    // Revenue Filter
    const revenueFilter = document.getElementById('revenueFilter');
    if (revenueFilter) {
        revenueFilter.addEventListener('change', (e) => {
            updateRevenueChart(e.target.value);
        });
    }

    // Warranty Resolution Filter
    const warrantyResolutionFilter = document.getElementById('warrantyResolutionFilter');
    if (warrantyResolutionFilter) {
        warrantyResolutionFilter.addEventListener('change', (e) => {
            updateWarrantyResolutionChart(e.target.value);
        });
    }

    // Top Sellers Filter
    const topSellersFilter = document.getElementById('topSellersFilter');
    if (topSellersFilter) {
        topSellersFilter.addEventListener('change', (e) => {
            updateTopSellersChart(e.target.value);
        });
    }

    // Subject Distribution Filter
    const subjectFilter = document.getElementById('subjectFilter');
    if (subjectFilter) {
        subjectFilter.addEventListener('change', (e) => {
            updateSubjectChart(e.target.value);
        });
    }

    // Transaction Success Filter
    const transactionSuccessFilter = document.getElementById('transactionSuccessFilter');
    if (transactionSuccessFilter) {
        transactionSuccessFilter.addEventListener('change', (e) => {
            updateTransactionSuccessChart(e.target.value);
        });
    }

    // Feedback Distribution Filter
    const feedbackDistributionFilter = document.getElementById('feedbackDistributionFilter');
    if (feedbackDistributionFilter) {
        feedbackDistributionFilter.addEventListener('change', (e) => {
            updateFeedbackDistributionChart(e.target.value);
        });
    }

    // Offer Funnel Filter
    const offerFunnelFilter = document.getElementById('offerFunnelFilter');
    if (offerFunnelFilter) {
        offerFunnelFilter.addEventListener('change', (e) => {
            updateOfferFunnelChart(e.target.value);
        });
    }
}

// Helper: Show loading state on chart card during updates
function showChartLoading(chartId, isLoading) {
    const canvas = document.getElementById(chartId);
    if (!canvas) return;
    const chartCard = canvas.closest('.chart-card');
    if (chartCard) {
        chartCard.style.opacity = isLoading ? '0.6' : '1';
        chartCard.style.pointerEvents = isLoading ? 'none' : 'auto';
        chartCard.style.transition = 'opacity 0.2s ease';
    }
}

function updateSalesChart(range) {
    showChartLoading('salesChart', true);
    const salesData = calculateSalesTrendWithFilter(range);

    if (salesChartInstance) {
        salesChartInstance.data.labels = salesData.labels;
        salesChartInstance.data.datasets[0].data = salesData.data;
        salesChartInstance.update();
    }
    showChartLoading('salesChart', false);
}

function updateRevenueChart(range) {
    showChartLoading('revenueChart', true);
    const revenueData = calculateRevenueTrendWithFilter(range);

    if (revenueChartInstance) {
        revenueChartInstance.data.labels = revenueData.labels;
        revenueChartInstance.data.datasets[0].data = revenueData.data;
        revenueChartInstance.update();
    }
    showChartLoading('revenueChart', false);
}

function calculateSalesTrendWithFilter(range) {
    if (range === 'all') {
        // Show all time - group by month or week based on data span
        return calculateAllTimeSalesTrend();
    }

    const days = parseInt(range);
    const labels = [];
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toLocaleDateString('en-MY', { month: 'short', day: 'numeric' });
        labels.push(dateStr);

        const count = allTransactions.filter(txn => {
            const txnDate = new Date(txn.createdAt);
            return txnDate.toDateString() === date.toDateString();
        }).length;

        data.push(count);
    }

    return { labels, data };
}

function calculateAllTimeSalesTrend() {
    // Group all transactions by month
    const monthlyData = {};

    allTransactions.forEach(txn => {
        const date = new Date(txn.createdAt);
        const monthYear = date.toLocaleDateString('en-MY', { month: 'short', year: 'numeric' });
        monthlyData[monthYear] = (monthlyData[monthYear] || 0) + 1;
    });

    const sortedMonths = Object.keys(monthlyData).sort((a, b) => {
        return new Date(a) - new Date(b);
    });

    return {
        labels: sortedMonths,
        data: sortedMonths.map(month => monthlyData[month])
    };
}

function calculateRevenueTrendWithFilter(range) {
    if (range === 'all') {
        return calculateAllTimeRevenueTrend();
    }

    const days = parseInt(range);
    const labels = [];
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toLocaleDateString('en-MY', { month: 'short', day: 'numeric' });
        labels.push(dateStr);

        const revenue = allTransactions
            .filter(txn => {
                const txnDate = new Date(txn.createdAt);
                return txnDate.toDateString() === date.toDateString();
            })
            .reduce((sum, txn) => sum + (txn.commissionFee || 0), 0);

        data.push(revenue.toFixed(2));
    }

    return { labels, data };
}

function calculateAllTimeRevenueTrend() {
    const monthlyRevenue = {};

    allTransactions.forEach(txn => {
        const date = new Date(txn.createdAt);
        const monthYear = date.toLocaleDateString('en-MY', { month: 'short', year: 'numeric' });
        monthlyRevenue[monthYear] = (monthlyRevenue[monthYear] || 0) + (txn.commissionFee || 0);
    });

    const sortedMonths = Object.keys(monthlyRevenue).sort((a, b) => {
        return new Date(a) - new Date(b);
    });

    return {
        labels: sortedMonths,
        data: sortedMonths.map(month => monthlyRevenue[month].toFixed(2))
    };
}

// ===== UPDATE FUNCTIONS FOR REMAINING CHARTS =====


function updateTopSellersChart(range) {
    showChartLoading('topSellersChart', true);
    const data = calculateTopSellersWithFilter(range);
    if (topBooksChartInstance) {
        topBooksChartInstance.data.labels = data.labels;
        topBooksChartInstance.data.datasets[0].data = data.data;
        topBooksChartInstance.data.datasets[0].backgroundColor = data.colors; // Apply role colors
        topBooksChartInstance.update();
    }
    showChartLoading('topSellersChart', false);
}

function updateSubjectChart(range) {
    showChartLoading('subjectChart', true);
    const data = calculateSubjectDistributionWithFilter(range);
    if (subjectChartInstance) {
        subjectChartInstance.data.labels = data.labels;
        subjectChartInstance.data.datasets[0].data = data.data;
        subjectChartInstance.update();
    }
    showChartLoading('subjectChart', false);
}

function updateTransactionSuccessChart(range) {
    showChartLoading('transactionSuccessChart', true);
    const data = calculateTransactionSuccessWithFilter(range);
    if (transactionSuccessChartInstance) {
        transactionSuccessChartInstance.data.datasets[0].data = data.counts;
        transactionSuccessChartInstance.update();
    }
    showChartLoading('transactionSuccessChart', false);
}

async function updateFeedbackDistributionChart(range) {
    showChartLoading('feedbackDistributionChart', true);
    const data = await calculateFeedbackDistributionWithFilter(range);
    if (feedbackDistributionChartInstance) {
        feedbackDistributionChartInstance.data.datasets[0].data = data.counts;
        feedbackDistributionChartInstance.update();
    }
    showChartLoading('feedbackDistributionChart', false);
}

function updateWarrantyResolutionChart(range) {
    showChartLoading('warrantyResolutionChart', true);
    const data = calculateWarrantyResolutionMetrics(range);
    if (warrantyResolutionChartInstance) {
        warrantyResolutionChartInstance.data.labels = data.labels;
        warrantyResolutionChartInstance.data.datasets[0].data = data.opened;
        warrantyResolutionChartInstance.data.datasets[1].data = data.resolved;
        warrantyResolutionChartInstance.data.datasets[2].data = data.resolutionRate;
        warrantyResolutionChartInstance.update();
    }
    showChartLoading('warrantyResolutionChart', false);
}

async function updateOfferFunnelChart(range) {
    showChartLoading('offerFunnelChart', true);
    const data = await calculateOfferFunnelWithFilter(range);
    if (offerFunnelChartInstance) {
        offerFunnelChartInstance.data.datasets[0].data = data.counts;
        offerFunnelChartInstance.update();
    }
    showChartLoading('offerFunnelChart', false);
}

// ===== CALCULATION FUNCTIONS WITH FILTERS =====

function calculateTopSellersWithFilter(range) {
    let filteredTransactions = allTransactions;

    if (range !== 'all') {
        const days = parseInt(range);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        filteredTransactions = allTransactions.filter(txn => new Date(txn.createdAt) >= cutoffDate);
    }

    const sellerData = {};
    filteredTransactions.forEach(txn => {
        if (txn.items && Array.isArray(txn.items)) {
            txn.items.forEach(item => {
                const sellerName = item.bookDetails?.sellerName || 'Unknown Seller';
                const sellerId = item.bookDetails?.sellerId;
                const price = item.bookDetails?.price || 0;

                if (!sellerData[sellerName]) {
                    sellerData[sellerName] = { revenue: 0, sellerId: sellerId, role: null };
                }
                sellerData[sellerName].revenue += price;
            });
        }
    });

    // Look up seller roles from allUsers
    Object.keys(sellerData).forEach(sellerName => {
        const sellerId = sellerData[sellerName].sellerId;
        const user = allUsers.find(u => u.id === sellerId || u.uid === sellerId);
        sellerData[sellerName].role = user?.role || 'student';
    });

    const sortedSellers = Object.entries(sellerData)
        .sort((a, b) => b[1].revenue - a[1].revenue)
        .slice(0, 5);

    // Role-based colors
    const roleColors = {
        'student': '#3b82f6',
        'staff': '#8b5cf6',
        'admin': '#ef4444'
    };

    return {
        labels: sortedSellers.map(([name]) => name.length > 15 ? name.substring(0, 15) + '...' : name),
        data: sortedSellers.map(([, info]) => info.revenue),
        colors: sortedSellers.map(([, info]) => roleColors[info.role] || '#3b82f6'),
        roles: sortedSellers.map(([, info]) => info.role)
    };
}

function calculateSubjectDistributionWithFilter(range) {
    let filteredTransactions = allTransactions;

    if (range !== 'all') {
        const days = parseInt(range);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        filteredTransactions = allTransactions.filter(txn => new Date(txn.createdAt) >= cutoffDate);
    }

    const subjectCounts = {};
    filteredTransactions.forEach(txn => {
        if (txn.items && Array.isArray(txn.items)) {
            txn.items.forEach(item => {
                const subject = item.bookDetails?.subjectCode || 'Unknown';
                subjectCounts[subject] = (subjectCounts[subject] || 0) + 1;
            });
        }
    });

    return {
        labels: Object.keys(subjectCounts),
        data: Object.values(subjectCounts)
    };
}

function calculateTransactionSuccessWithFilter(range) {
    let filteredTransactions = allTransactions;

    if (range !== 'all') {
        const days = parseInt(range);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        filteredTransactions = allTransactions.filter(txn => new Date(txn.createdAt) >= cutoffDate);
    }

    let completed = 0;
    let cancelled = 0;
    let failed = 0;

    filteredTransactions.forEach(txn => {
        if (txn.status === 'completed') completed++;
        else if (txn.status === 'cancelled') cancelled++;
        else if (txn.status === 'failed') failed++;
    });

    return {
        counts: [completed, cancelled, failed],
        total: filteredTransactions.length,
        successRate: filteredTransactions.length > 0 ? (completed / filteredTransactions.length * 100).toFixed(1) : 0
    };
}

async function calculateFeedbackDistributionWithFilter(range) {
    let cutoffDate = null;
    if (range !== 'all') {
        const days = parseInt(range);
        cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
    }

    const counts = [0, 0, 0, 0, 0]; // 1-5 stars

    try {
        const feedbackSnapshot = await database.ref('feedback').once('value');
        feedbackSnapshot.forEach(child => {
            const feedback = child.val();
            if (feedback.type === 'feedback' && feedback.rating) {
                const feedbackDate = new Date(feedback.createdAt);
                if (!cutoffDate || feedbackDate >= cutoffDate) {
                    const index = feedback.rating - 1;
                    if (index >= 0 && index < 5) {
                        counts[index]++;
                    }
                }
            }
        });
    } catch (error) {
        console.error('[ADMIN] Error calculating feedback distribution:', error);
    }

    const total = counts.reduce((sum, count) => sum + count, 0);
    const average = total > 0 ? counts.reduce((sum, count, i) => sum + (count * (i + 1)), 0) / total : 0;

    return { counts, average, total };
}

async function calculateOfferFunnelWithFilter(range) {
    let cutoffDate = null;
    if (range !== 'all') {
        const days = parseInt(range);
        cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
    }

    let allOffers = [];
    try {
        const offersSnapshot = await database.ref('offers').once('value');
        offersSnapshot.forEach(child => {
            const offer = child.val();
            const offerDate = new Date(offer.createdAt);
            if (!cutoffDate || offerDate >= cutoffDate) {
                allOffers.push({ id: child.key, ...offer });
            }
        });
    } catch (error) {
        console.error('[ADMIN] Error loading offers:', error);
    }

    let totalOffers = allOffers.length;
    let counterOffers = 0;
    let acceptedOffers = 0;

    allOffers.forEach(offer => {
        if (offer.status === 'counter_offered') counterOffers++;
        if (offer.status === 'accepted') acceptedOffers++;
    });

    let completedPurchases = allTransactions.filter(txn => {
        const txnDate = new Date(txn.createdAt);
        const isInRange = !cutoffDate || txnDate >= cutoffDate;
        return txn.status === 'completed' && txn.fromOffer === true && isInRange;
    }).length;

    return {
        counts: [totalOffers, counterOffers, acceptedOffers, completedPurchases]
    };
}

// Load warranty issues table - transactions with warranty claims
async function loadWarrantyIssues() {
    console.log('[ADMIN] loadWarrantyIssues called');
    const tableBody = document.getElementById('warrantyIssuesTable');
    const countBadge = document.getElementById('warrantyIssuesCount');

    if (!tableBody) {
        console.warn('[ADMIN] warrantyIssuesTable not found');
        return;
    }

    try {
        // Filter transactions with warranty issues
        const warrantyStatuses = ['warranty_claimed', 'return_sent', 'return_received'];
        const warrantyIssues = allTransactions.filter(txn =>
            warrantyStatuses.includes(txn.status)
        );

        console.log(`[ADMIN] Found ${warrantyIssues.length} warranty issues`);

        // Update count badge
        if (countBadge) {
            countBadge.textContent = `${warrantyIssues.length} Active`;
            countBadge.style.background = warrantyIssues.length > 0 ? '#ef4444' : '#10b981';
        }

        if (warrantyIssues.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 2rem; color: #10b981;">
                        <i class="fas fa-check-circle" style="font-size: 2rem; margin-bottom: 0.5rem;"></i><br>
                        No active warranty issues! All transactions are healthy.
                    </td>
                </tr>
            `;
            return;
        }


        // Render warranty issues
        tableBody.innerHTML = warrantyIssues.map(txn => {
            const orderId = txn.transactionId || txn.id;
            const buyerName = txn.buyerName || 'Unknown';
            const sellerName = txn.items?.[0]?.bookDetails?.sellerName || 'Unknown';
            const sellerId = txn.items?.[0]?.bookDetails?.sellerId || '';
            const issueType = txn.warrantyIssueType || 'Not specified';
            const amount = txn.amount || txn.basePrice || 0;

            // Determine return status badge, deadline countdown, and available actions
            let statusBadge = '';
            let returnDeadline = '';
            let actions = '';



            switch (txn.status) {
                case 'warranty_claimed':
                    // Buyer claimed but hasn't returned yet - show countdown
                    const claimedAt = txn.warrantyClaimedAt || Date.now();
                    const deadline = claimedAt + (7 * 24 * 60 * 60 * 1000);
                    const timeLeft = deadline - Date.now();
                    const daysLeft = Math.max(0, Math.ceil(timeLeft / (24 * 60 * 60 * 1000)));

                    statusBadge = '<span style="background: #f59e0b; color: white; padding: 4px 8px; border-radius: 4px; font-weight: 500;">⏳ Awaiting Return</span>';

                    if (daysLeft > 0) {
                        returnDeadline = `<span style="color: #f59e0b; font-weight: 600;">⏱️ ${daysLeft}d left</span>`;
                        actions = `
                            <button class="btn btn-outline btn-sm" onclick="dismissWarrantyClaim('${orderId}')" style="border: 1px solid #94a3b8; background: transparent; color: #64748b;" title="Dismiss claim manually">
                                <i class="fas fa-times"></i> Dismiss
                            </button>
                        `;
                    } else {
                        statusBadge = '<span style="background: #ef4444; color: white; padding: 4px 8px; border-radius: 4px; font-weight: 500;">❌ Return Expired</span>';
                        returnDeadline = '<span style="color: #ef4444; font-weight: 500;">⚠️ Expired</span>';
                        actions = '<span style="color: #94a3b8;">Auto-dismissing...</span>';
                    }
                    break;

                case 'return_sent':
                    // Buyer has sent, seller hasn't confirmed receipt
                    statusBadge = '<span style="background: #3b82f6; color: white; padding: 4px 8px; border-radius: 4px; font-weight: 500;">📦 Return Shipped</span>';
                    returnDeadline = '<span style="color: #3b82f6;">In Transit</span>';
                    actions = '<span style="color: #64748b;">Awaiting seller</span>';
                    break;

                case 'return_received':
                    // Book is back with seller - only Refund makes sense now
                    statusBadge = '<span style="background: #10b981; color: white; padding: 4px 8px; border-radius: 4px; font-weight: 500;">✅ Book Received</span>';
                    returnDeadline = '<span style="color: #10b981;">Completed</span>';
                    actions = `
                        <button class="btn btn-success btn-sm" onclick="processWarrantyRefund('${orderId}')">
                            <i class="fas fa-undo"></i> Refund
                        </button>
                    `;
                    break;

                default:
                    // Fallback for unexpected status
                    statusBadge = `<span style="background: #94a3b8; color: white; padding: 4px 8px; border-radius: 4px; font-weight: 500;">❓ ${txn.status || 'Unknown'}</span>`;
                    returnDeadline = '<span style="color: #94a3b8;">N/A</span>';
                    actions = '<span style="color: #94a3b8;">Review needed</span>';
                    break;
            }



            return `
                <tr>
                    <td><code style="background: #f1f5f9; padding: 0.25rem 0.5rem; border-radius: 4px;">#${orderId.substring(0, 8)}</code></td>
                    <td>${buyerName}</td>
                    <td>${sellerName}</td>
                    <td><span style="color: #ef4444; font-weight: 500;">${issueType}</span></td>
                    <td>${statusBadge}</td>
                    <td><strong>RM ${amount.toFixed(2)}</strong></td>
                    <td>${returnDeadline}</td>
                    <td>${actions}</td>
                </tr>
            `;
        }).join('');

    } catch (error) {
        console.error('[ADMIN] Error loading warranty issues:', error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" style="color: #ef4444;">Error loading warranty issues</td>
            </tr>
        `;
    }
}


// Process warranty refund
async function processWarrantyRefund(transactionId) {
    if (!confirm('Process refund for this transaction? The buyer will receive their money back.')) {
        return;
    }

    try {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) loadingOverlay.style.display = 'flex';

        // Get transaction
        const txnSnapshot = await database.ref(`transactions/${transactionId}`).once('value');
        const txn = txnSnapshot.val();

        if (!txn) throw new Error('Transaction not found');

        // Update transaction status
        await database.ref(`transactions/${transactionId}`).update({
            status: 'refunded',
            disputeResolvedAt: Date.now(),
            resolvedBy: currentUser.uid,
            sellerPaidOut: false
        });

        // Release funds back to buyer (from frozen to buyer's balance)
        if (txn.items) {
            for (const item of txn.items) {
                const sellerWalletRef = database.ref(`users/${item.bookDetails.sellerId}/wallet`);
                const walletSnapshot = await sellerWalletRef.once('value');
                const wallet = walletSnapshot.val() || {};

                await sellerWalletRef.update({
                    frozenDispute: Math.max(0, (wallet.frozenDispute || 0) - item.bookDetails.price)
                });
            }

            // Add to buyer's balance
            const buyerWalletRef = database.ref(`users/${txn.buyerId}/wallet`);
            const buyerWalletSnapshot = await buyerWalletRef.once('value');
            const buyerWallet = buyerWalletSnapshot.val() || {};

            await buyerWalletRef.update({
                balance: (buyerWallet.balance || 0) + txn.amount
            });
        }

        // Notify buyer
        await database.ref('notifications').push({
            recipientId: txn.buyerId,
            senderId: 'admin',
            senderName: 'Admin',
            type: 'refund_processed',
            message: `💰 Your refund of RM${txn.amount.toFixed(2)} has been processed for order #${transactionId.substring(0, 8)}.`,
            transactionId: transactionId,
            read: false,
            createdAt: Date.now()
        });

        showNotification('Refund processed successfully!', 'success');
        await loadWarrantyIssues();
        await loadReviewsAndDisputes();

    } catch (error) {
        console.error('[ADMIN] Error processing refund:', error);
        showNotification('Error processing refund: ' + error.message, 'error');
    } finally {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) loadingOverlay.style.display = 'none';
    }
}

// Dismiss warranty claim (admin determines claim is invalid before return)
async function dismissWarrantyClaim(transactionId) {
    if (!confirm('Dismiss this warranty claim? The transaction will return to normal warranty period and the buyer will NOT be able to claim again.')) {
        return;
    }

    try {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) loadingOverlay.style.display = 'flex';

        // Get transaction data
        const txnSnapshot = await database.ref(`transactions/${transactionId}`).once('value');
        const txn = txnSnapshot.val();

        if (!txn) {
            throw new Error('Transaction not found');
        }

        // Revert to delivered status (normal warranty period continues)
        await database.ref(`transactions/${transactionId}`).update({
            status: 'delivered',
            warrantyClaimDismissed: true,
            dismissedAt: Date.now(),
            dismissedBy: 'admin',
            previousStatus: txn.status,
            disputeReason: null,
            warrantyIssueType: null
        });

        // Notify buyer
        await database.ref('notifications').push({
            recipientId: txn.buyerId,
            senderId: 'admin',
            senderName: 'Admin',
            type: 'claim_dismissed',
            message: `Your warranty claim for order #${transactionId.substring(0, 8)} was reviewed and dismissed. The order will proceed normally.`,
            transactionId: transactionId,
            read: false,
            createdAt: Date.now()
        });

        // Notify seller
        const sellerId = txn.items?.[0]?.bookDetails?.sellerId;
        if (sellerId) {
            await database.ref('notifications').push({
                recipientId: sellerId,
                senderId: 'admin',
                senderName: 'Admin',
                type: 'claim_dismissed',
                message: `The warranty claim on order #${transactionId.substring(0, 8)} was dismissed. Your payout will proceed as normal.`,
                transactionId: transactionId,
                read: false,
                createdAt: Date.now()
            });
        }

        showNotification('Warranty claim dismissed. Transaction returned to normal.', 'success');
        await loadWarrantyIssues();

    } catch (error) {
        console.error('[ADMIN] Error dismissing claim:', error);
        showNotification('Error dismissing claim: ' + error.message, 'error');
    } finally {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) loadingOverlay.style.display = 'none';
    }
}

// Process pay seller (admin decides buyer was wrong) - Legacy, kept for edge cases
async function processPaySeller(transactionId) {
    if (!confirm('Pay the seller? This means the buyer complaint was not valid.')) {
        return;
    }

    try {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) loadingOverlay.style.display = 'flex';

        // Get transaction
        const txnSnapshot = await database.ref(`transactions/${transactionId}`).once('value');
        const txn = txnSnapshot.val();

        if (!txn) throw new Error('Transaction not found');

        // Use global COMMISSION_RATE from firebase-config.js
        const basePrice = txn.items.reduce((sum, item) => sum + item.bookDetails.price, 0);
        const commission = basePrice * COMMISSION_RATE;
        const sellerPayout = basePrice - commission;

        // Update transaction status
        await database.ref(`transactions/${transactionId}`).update({
            status: 'completed',
            sellerPaidOut: true,
            sellerPayoutAmount: sellerPayout,
            commissionCollected: commission,
            payoutProcessedAt: Date.now(),
            disputeResolvedAt: Date.now(),
            resolvedBy: currentUser.uid
        });

        // Release funds to seller
        for (const item of txn.items) {
            const sellerWalletRef = database.ref(`users/${item.bookDetails.sellerId}/wallet`);
            const walletSnapshot = await sellerWalletRef.once('value');
            const wallet = walletSnapshot.val() || {};

            const itemCommission = item.bookDetails.price * COMMISSION_RATE;
            const itemPayout = item.bookDetails.price - itemCommission;

            await sellerWalletRef.update({
                frozenDispute: Math.max(0, (wallet.frozenDispute || 0) - item.bookDetails.price),
                balance: (wallet.balance || 0) + itemPayout,
                totalEarned: (wallet.totalEarned || 0) + itemPayout
            });
        }

        // Notify seller
        await database.ref('notifications').push({
            recipientId: txn.items[0].bookDetails.sellerId,
            senderId: 'admin',
            senderName: 'Admin',
            type: 'payout_received',
            message: `💰 Admin approved your payout of RM${sellerPayout.toFixed(2)} for order #${transactionId.substring(0, 8)}.`,
            transactionId: transactionId,
            read: false,
            createdAt: Date.now()
        });

        showNotification('Seller paid successfully!', 'success');
        await loadWarrantyIssues();
        await loadReviewsAndDisputes();

    } catch (error) {
        console.error('[ADMIN] Error paying seller:', error);
        showNotification('Error paying seller: ' + error.message, 'error');
    } finally {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) loadingOverlay.style.display = 'none';
    }
}

// Load Quick Stats (Summary row at top)
async function loadQuickStats() {
    console.log('[ADMIN] loadQuickStats called');
    try {
        const now = Date.now();
        const oneDayMs = 24 * 60 * 60 * 1000;

        // Active issues (warranty claims)
        const warrantyStatuses = ['warranty_claimed', 'return_sent', 'return_received'];
        const activeIssues = allTransactions.filter(txn => warrantyStatuses.includes(txn.status)).length;
        document.getElementById('activeIssuesCount').textContent = activeIssues;

        // Total escrow held (payment_held + delivered)
        const escrowStatuses = ['payment_held', 'delivered'];
        let totalEscrow = 0;
        allTransactions.forEach(txn => {
            if (escrowStatuses.includes(txn.status)) {
                totalEscrow += txn.amount || txn.basePrice || 0;
            }
        });
        document.getElementById('totalEscrowHeld').textContent = `RM ${totalEscrow.toFixed(0)}`;

        // Pending deliveries
        const pendingDeliveries = allTransactions.filter(txn => txn.status === 'payment_held').length;
        document.getElementById('pendingDeliveries').textContent = pendingDeliveries;

        // Payouts due today (warranty expires soon)
        const payoutsDue = allTransactions.filter(txn => {
            if (txn.status !== 'delivered') return false;
            const expiresAt = txn.warrantyExpiresAt || txn.payoutScheduledAt;
            return expiresAt && expiresAt <= now + oneDayMs;
        }).length;
        document.getElementById('payoutsDueToday').textContent = payoutsDue;

        console.log('[ADMIN] Quick stats loaded:', { activeIssues, totalEscrow, pendingDeliveries, payoutsDue });
    } catch (error) {
        console.error('[ADMIN] Error loading quick stats:', error);
    }
}

// Load System Health Summary
async function loadSystemHealth() {
    console.log('[ADMIN] loadSystemHealth called');
    try {
        // 1. Success Rate (completed + refunded vs total non-cancelled)
        const validTxns = allTransactions.filter(txn => txn.status !== 'cancelled');
        const completedTxns = allTransactions.filter(txn =>
            ['completed', 'refunded'].includes(txn.status)
        );
        const successRate = validTxns.length > 0
            ? ((completedTxns.length / validTxns.length) * 100).toFixed(0)
            : 0;
        document.getElementById('healthSuccessRate').textContent = `${successRate}%`;

        // 2. Average Rating (from feedback)
        const feedbackSnapshot = await database.ref('feedback').once('value');
        let totalRating = 0;
        let ratingCount = 0;
        feedbackSnapshot.forEach(child => {
            const feedback = child.val();
            if (feedback.rating) {
                totalRating += feedback.rating;
                ratingCount++;
            }
        });
        const avgRating = ratingCount > 0 ? (totalRating / ratingCount).toFixed(1) : '--';
        document.getElementById('healthAvgRating').textContent = ratingCount > 0 ? `${avgRating} ⭐` : '--';

        // 3. Issue-Free Rate (transactions without warranty claims)
        const claimedTxns = allTransactions.filter(txn =>
            txn.warrantyClaimedAt ||
            ['warranty_claimed', 'return_sent', 'return_received', 'dispute_open', 'refunded'].includes(txn.status)
        );
        const issueFreeTxns = validTxns.length - claimedTxns.length;
        const issueFreeRate = validTxns.length > 0
            ? ((issueFreeTxns / validTxns.length) * 100).toFixed(0)
            : 0;
        document.getElementById('healthClaimRate').textContent = `${issueFreeRate}%`;

        // 4. Average Resolution Time (for resolved warranty claims)
        const resolvedClaims = allTransactions.filter(txn =>
            txn.disputeResolvedAt && txn.warrantyClaimedAt
        );
        let totalResolutionDays = 0;
        resolvedClaims.forEach(txn => {
            const resolutionTime = txn.disputeResolvedAt - txn.warrantyClaimedAt;
            totalResolutionDays += resolutionTime / (24 * 60 * 60 * 1000); // Convert to days
        });
        const avgResolution = resolvedClaims.length > 0
            ? (totalResolutionDays / resolvedClaims.length).toFixed(1)
            : '--';
        document.getElementById('healthAvgResolution').textContent = resolvedClaims.length > 0 ? `${avgResolution}d` : '--';

        // Update timestamp
        const now = new Date();
        document.getElementById('healthLastUpdated').textContent =
            `Updated ${now.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })}`;

        console.log('[ADMIN] System health loaded:', { successRate, avgRating, issueFreeRate, avgResolution });
    } catch (error) {
        console.error('[ADMIN] Error loading system health:', error);
    }
}

// Load Payout Queue with Live Countdown Timers
let payoutCountdownInterval = null;

async function loadPayoutQueue() {
    console.log('[ADMIN] loadPayoutQueue called');
    const tableBody = document.getElementById('payoutQueueTable');
    const countBadge = document.getElementById('payoutQueueCount');

    if (!tableBody) return;

    // Clear any existing countdown interval
    if (payoutCountdownInterval) {
        clearInterval(payoutCountdownInterval);
    }

    try {
        // Get transactions in warranty period (delivered status)
        const payoutQueue = allTransactions.filter(txn => txn.status === 'delivered');
        const now = Date.now();

        if (countBadge) {
            countBadge.textContent = `${payoutQueue.length} Pending`;
        }

        if (payoutQueue.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 1.5rem; color: #64748b;">
                        <i class="fas fa-check-circle" style="color: #22c55e; margin-right: 0.5rem;"></i>
                        No pending payouts in queue
                    </td>
                </tr>
            `;
            return;
        }

        // Sort by expiry time (soonest first)
        payoutQueue.sort((a, b) => {
            const expiresA = a.warrantyExpiresAt || a.payoutScheduledAt || Infinity;
            const expiresB = b.warrantyExpiresAt || b.payoutScheduledAt || Infinity;
            return expiresA - expiresB;
        });

        tableBody.innerHTML = payoutQueue.map((txn, index) => {
            const sellerName = txn.items?.[0]?.bookDetails?.sellerName || 'Unknown';
            const orderId = txn.transactionId || txn.id;
            const amount = (txn.basePrice || txn.amount || 0) * 0.9; // After 10% commission
            const expiresAt = txn.warrantyExpiresAt || txn.payoutScheduledAt;

            // Generate unique ID for countdown element
            const countdownId = `countdown-${orderId.substring(0, 8)}`;

            return `
                <tr>
                    <td>${sellerName}</td>
                    <td><code style="background: #f1f5f9; padding: 0.2rem 0.4rem; border-radius: 4px;">#${orderId.substring(0, 8)}</code></td>
                    <td style="font-weight: 600; color: #22c55e;">RM ${amount.toFixed(2)}</td>
                    <td>
                        <div id="${countdownId}" 
                             class="payout-countdown" 
                             data-expires="${expiresAt || 0}"
                             style="font-family: 'Courier New', monospace; font-size: 0.85rem;">
                            --:--:--
                        </div>
                    </td>
                    <td>
                        <span class="payout-status-badge" data-countdown-id="${countdownId}">
                            <i class="fas fa-spinner fa-spin"></i>
                        </span>
                    </td>
                </tr>
            `;
        }).join('');

        // Start live countdown updates
        updatePayoutCountdowns();
        payoutCountdownInterval = setInterval(updatePayoutCountdowns, 1000);

    } catch (error) {
        console.error('[ADMIN] Error loading payout queue:', error);
        tableBody.innerHTML = '<tr><td colspan="5" style="color: #ef4444;">Error loading</td></tr>';
    }
}

// Update all payout countdowns
function updatePayoutCountdowns() {
    const countdowns = document.querySelectorAll('.payout-countdown');
    const now = Date.now();

    countdowns.forEach(el => {
        const expiresAt = parseInt(el.dataset.expires) || 0;
        const timeLeft = expiresAt - now;
        const countdownId = el.id;
        const statusBadge = document.querySelector(`[data-countdown-id="${countdownId}"]`);

        if (expiresAt === 0) {
            el.innerHTML = '<span style="color: #94a3b8;">No date set</span>';
            if (statusBadge) {
                statusBadge.innerHTML = '<span class="badge" style="background: #64748b; color: white; padding: 0.2rem 0.5rem; border-radius: 4px;">Unknown</span>';
            }
            return;
        }

        if (timeLeft <= 0) {
            // Expired - ready for payout
            el.innerHTML = `
                <span style="color: #22c55e; font-weight: 600;">
                    <i class="fas fa-check-circle"></i> READY
                </span>
            `;
            if (statusBadge) {
                statusBadge.innerHTML = '<span class="badge" style="background: #22c55e; color: white; padding: 0.2rem 0.5rem; border-radius: 4px; animation: pulse 2s infinite;">Ready</span>';
            }
        } else {
            // Calculate time components
            const days = Math.floor(timeLeft / (24 * 60 * 60 * 1000));
            const hours = Math.floor((timeLeft % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
            const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
            const seconds = Math.floor((timeLeft % (60 * 1000)) / 1000);

            // Format countdown display
            if (days > 0) {
                el.innerHTML = `
                    <span style="color: ${days <= 2 ? '#f59e0b' : '#3b82f6'};">
                        ${days}d ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}
                    </span>
                `;
            } else {
                el.innerHTML = `
                    <span style="color: ${hours < 12 ? '#ef4444' : '#f59e0b'}; font-weight: ${hours < 6 ? '700' : '400'};">
                        ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}
                    </span>
                `;
            }

            // Update status badge
            if (statusBadge) {
                if (days <= 0 && hours < 24) {
                    statusBadge.innerHTML = '<span class="badge" style="background: #ef4444; color: white; padding: 0.2rem 0.5rem; border-radius: 4px;">Today</span>';
                } else if (days <= 2) {
                    statusBadge.innerHTML = '<span class="badge" style="background: #f59e0b; color: white; padding: 0.2rem 0.5rem; border-radius: 4px;">Soon</span>';
                } else {
                    statusBadge.innerHTML = '<span class="badge" style="background: #64748b; color: white; padding: 0.2rem 0.5rem; border-radius: 4px;">Waiting</span>';
                }
            }
        }
    });
}

// Load User Feedback (unified view - all reviews and ratings)
async function loadReviewsAndDisputes() {
    console.log('[ADMIN] loadReviewsAndDisputes called (unified feedback view)');

    try {
        const snapshot = await database.ref('feedback').orderByChild('createdAt').once('value');
        const allFeedback = [];

        snapshot.forEach(child => {
            const feedback = child.val();
            feedback.id = child.key;
            allFeedback.push(feedback);
        });

        // Sort by date descending (most recent first)
        allFeedback.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

        // DEDUPLICATE: Remove duplicate entries (same buyer + rating + comment)
        // This filters out old duplicates that were created before the fix
        const seen = new Set();
        const uniqueFeedback = allFeedback.filter(f => {
            const key = `${f.buyerName || ''}_${f.rating || 0}_${(f.comment || '').substring(0, 50)}`;
            if (seen.has(key)) {
                return false; // Skip duplicate
            }
            seen.add(key);
            return true;
        });

        // Use deduplicated list for display
        const feedbackToDisplay = uniqueFeedback;

        // Helper to truncate and make expandable comment
        const formatComment = (comment, maxLength = 50) => {
            if (!comment) return '-';
            const escaped = comment.replace(/'/g, "\\'").replace(/"/g, "&quot;");
            if (comment.length <= maxLength) {
                return comment;
            }
            const truncated = comment.substring(0, maxLength) + '...';
            return `<span class="comment-preview" title="${escaped}" style="cursor: pointer;" onclick="showFullComment('${escaped}')">${truncated} <i class="fas fa-expand-alt" style="color: #3b82f6; font-size: 0.7rem;"></i></span>`;
        };

        // Helper to get sentiment badge based on rating
        const getSentimentBadge = (rating, feedbackType) => {
            if (feedbackType === 'dispute') {
                return '<span style="background: #fef2f2; color: #dc2626; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 500;"><i class="fas fa-flag"></i> Dispute</span>';
            }
            if (rating >= 4) {
                return '<span style="background: #dcfce7; color: #16a34a; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 500;"><i class="fas fa-smile"></i> Positive</span>';
            } else if (rating === 3) {
                return '<span style="background: #fef3c7; color: #d97706; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 500;"><i class="fas fa-meh"></i> Neutral</span>';
            } else {
                return '<span style="background: #fef2f2; color: #dc2626; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 500;"><i class="fas fa-frown"></i> Negative</span>';
            }
        };

        // Render unified feedback table
        const feedbackTable = document.getElementById('feedbackTable');
        const feedbackCount = document.getElementById('feedbackCount');

        if (feedbackCount) feedbackCount.textContent = feedbackToDisplay.length;

        if (feedbackTable) {
            if (feedbackToDisplay.length === 0) {
                feedbackTable.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #64748b;">No feedback yet</td></tr>';
            } else {
                feedbackTable.innerHTML = feedbackToDisplay.slice(0, 15).map(f => `
                    <tr>
                        <td>${formatDate(f.createdAt)}</td>
                        <td>${f.buyerName || 'Unknown'}</td>
                        <td>${'⭐'.repeat(f.rating || 0)}</td>
                        <td style="max-width: 250px;">${formatComment(f.comment, 60)}</td>
                        <td>${getSentimentBadge(f.rating, f.feedbackType)}</td>
                    </tr>
                `).join('');
            }
        }

        console.log('[ADMIN] Loaded unified feedback:', feedbackToDisplay.length, 'unique entries (filtered from', allFeedback.length, 'total)');
    } catch (error) {
        console.error('[ADMIN] Error loading feedback:', error);
    }
}

// Show full comment in alert/modal
function showFullComment(comment) {
    // Create a nice modal for viewing full comment
    const modalHTML = `
        <div id="commentModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; display: flex; align-items: center; justify-content: center;">
            <div style="background: white; border-radius: 12px; padding: 1.5rem; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h3 style="margin: 0; color: #1e293b;"><i class="fas fa-comment" style="color: #3b82f6;"></i> Full Comment</h3>
                    <button onclick="document.getElementById('commentModal').remove()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #94a3b8;">&times;</button>
                </div>
                <div style="background: #f8fafc; border-radius: 8px; padding: 1rem; color: #334155; line-height: 1.6; white-space: pre-wrap; word-wrap: break-word;">
                    ${comment.replace(/&quot;/g, '"')}
                </div>
                <button onclick="document.getElementById('commentModal').remove()" class="btn btn-primary" style="margin-top: 1rem; width: 100%;">Close</button>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Resolve feedback/dispute - mark as resolved
async function resolveFeedback(feedbackId) {
    if (!confirm('Mark this feedback/dispute as resolved?')) {
        return;
    }

    try {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) loadingOverlay.style.display = 'flex';

        // Update feedback status
        await database.ref(`feedback/${feedbackId}`).update({
            resolved: true,
            resolvedAt: Date.now(),
            resolvedBy: currentUser.uid,
            status: 'resolved'
        });

        showNotification('Feedback marked as resolved!', 'success');

        // Reload the disputes/reviews section
        await loadReviewsAndDisputes();

    } catch (error) {
        console.error('[ADMIN] Error resolving feedback:', error);
        showNotification('Error resolving feedback: ' + error.message, 'error');
    } finally {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) loadingOverlay.style.display = 'none';
    }
}

// Load Seller Leaderboard
async function loadSellerLeaderboard() {
    console.log('[ADMIN] loadSellerLeaderboard called');
    const tableBody = document.getElementById('sellerLeaderboard');

    if (!tableBody) return;

    try {
        // Calculate seller stats from transactions
        const sellerStats = {};

        allTransactions.forEach(txn => {
            if (!txn.items || txn.status === 'cancelled') return;

            txn.items.forEach(item => {
                const sellerId = item.bookDetails?.sellerId;
                const sellerName = item.bookDetails?.sellerName || 'Unknown';
                const price = item.bookDetails?.price || 0;

                if (!sellerId) return;

                if (!sellerStats[sellerId]) {
                    sellerStats[sellerId] = { name: sellerName, sales: 0, revenue: 0, ratings: [] };
                }
                sellerStats[sellerId].sales++;
                sellerStats[sellerId].revenue += price;
            });
        });

        // Fetch feedback to calculate actual seller ratings
        try {
            const feedbackSnapshot = await database.ref('feedback').once('value');
            feedbackSnapshot.forEach(child => {
                const feedback = child.val();
                const sellerId = feedback.sellerId;
                if (sellerId && sellerStats[sellerId] && feedback.rating) {
                    sellerStats[sellerId].ratings.push(feedback.rating);
                }
            });
        } catch (e) {
            console.warn('[ADMIN] Could not fetch feedback for seller ratings:', e);
        }

        // Convert to array and sort by revenue
        const leaderboard = Object.entries(sellerStats)
            .map(([id, stats]) => {
                const avgRating = stats.ratings.length > 0
                    ? (stats.ratings.reduce((a, b) => a + b, 0) / stats.ratings.length)
                    : null;
                return { id, ...stats, avgRating };
            })
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);

        if (leaderboard.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #64748b;">No sales data yet</td></tr>';
            return;
        }

        const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
        tableBody.innerHTML = leaderboard.map((seller, index) => {
            const ratingDisplay = seller.avgRating
                ? `⭐ ${seller.avgRating.toFixed(1)}`
                : '<span style="color: #94a3b8;">No ratings</span>';
            return `
                <tr>
                    <td style="font-size: 1.25rem;">${medals[index] || index + 1}</td>
                    <td><strong>${seller.name}</strong></td>
                    <td>${seller.sales}</td>
                    <td style="color: #22c55e; font-weight: 600;">RM ${seller.revenue.toFixed(2)}</td>
                    <td>${ratingDisplay}</td>
                </tr>
            `;
        }).join('');

        console.log('[ADMIN] Seller leaderboard loaded');
    } catch (error) {
        console.error('[ADMIN] Error loading seller leaderboard:', error);
        tableBody.innerHTML = '<tr><td colspan="5" style="color: #ef4444;">Error loading</td></tr>';
    }
}

// Load Activity Log
async function loadActivityLog() {
    console.log('[ADMIN] loadActivityLog called');
    const logContainer = document.getElementById('activityLog');

    if (!logContainer) return;

    try {
        // Build activity items from recent transactions and notifications
        const activities = [];
        const now = Date.now();

        // Add transaction events
        allTransactions.forEach(txn => {
            const orderId = (txn.transactionId || txn.id || '').substring(0, 8);
            const buyerName = txn.buyerName || 'Someone';

            if (txn.createdAt) {
                activities.push({
                    time: txn.createdAt,
                    icon: 'fa-shopping-cart',
                    color: '#3b82f6',
                    text: `${buyerName} purchased order #${orderId}`
                });
            }

            if (txn.actualDeliveryDate) {
                activities.push({
                    time: txn.actualDeliveryDate,
                    icon: 'fa-check-circle',
                    color: '#22c55e',
                    text: `Order #${orderId} confirmed received`
                });
            }

            if (txn.warrantyClaimedAt) {
                activities.push({
                    time: txn.warrantyClaimedAt,
                    icon: 'fa-exclamation-triangle',
                    color: '#ef4444',
                    text: `Warranty claimed on order #${orderId}`
                });
            }

            if (txn.payoutProcessedAt) {
                activities.push({
                    time: txn.payoutProcessedAt,
                    icon: 'fa-wallet',
                    color: '#22c55e',
                    text: `Payout processed for order #${orderId}`
                });
            }
        });

        // Sort by time descending
        activities.sort((a, b) => b.time - a.time);

        if (activities.length === 0) {
            logContainer.innerHTML = '<div style="text-align: center; color: #64748b; padding: 1rem;">No recent activity</div>';
            return;
        }

        logContainer.innerHTML = activities.slice(0, 15).map(activity => `
            <div style="display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem 0.75rem; border-bottom: 1px solid #f1f5f9; font-size: 0.875rem;">
                <div style="width: 28px; height: 28px; background: ${activity.color}15; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                    <i class="fas ${activity.icon}" style="color: ${activity.color}; font-size: 0.75rem;"></i>
                </div>
                <div style="flex: 1;">
                    <div style="color: #1e293b;">${activity.text}</div>
                    <div style="color: #94a3b8; font-size: 0.7rem;">${formatDate(activity.time)}</div>
                </div>
            </div>
        `).join('');

        console.log('[ADMIN] Activity log loaded with', activities.length, 'items');
    } catch (error) {
        console.error('[ADMIN] Error loading activity log:', error);
        logContainer.innerHTML = '<div style="color: #ef4444; text-align: center;">Error loading activity</div>';
    }
}

// ===== REAL-TIME FIREBASE LISTENERS =====
// Enables live dashboard updates without page refresh

let realtimeListenersActive = false;

function setupRealtimeListeners() {
    if (realtimeListenersActive) {
        console.log('[ADMIN] Real-time listeners already active');
        return;
    }

    console.log('[ADMIN] Setting up real-time Firebase listeners...');

    // Listen for transaction changes
    database.ref('transactions').on('child_added', (snapshot) => {
        if (!realtimeListenersActive) return; // Ignore initial load
        const newTxn = snapshot.val();
        newTxn.id = snapshot.key;

        // Check if transaction already exists
        const exists = allTransactions.some(t => t.id === newTxn.id);
        if (!exists) {
            allTransactions.push(newTxn);
            console.log('[ADMIN] Real-time: New transaction added', newTxn.id);
            refreshDashboardStats();
            showNotification('New transaction received!', 'info');
        }
    });

    database.ref('transactions').on('child_changed', (snapshot) => {
        const updatedTxn = snapshot.val();
        updatedTxn.id = snapshot.key;

        const index = allTransactions.findIndex(t => t.id === updatedTxn.id);
        if (index !== -1) {
            allTransactions[index] = updatedTxn;
            console.log('[ADMIN] Real-time: Transaction updated', updatedTxn.id);
            refreshDashboardStats();
        }
    });

    // Listen for user changes
    database.ref('users').on('child_added', (snapshot) => {
        if (!realtimeListenersActive) return;
        const newUser = snapshot.val();
        newUser.id = snapshot.key;

        const exists = allUsers.some(u => u.id === newUser.id);
        if (!exists) {
            allUsers.push(newUser);
            console.log('[ADMIN] Real-time: New user registered', newUser.id);
            refreshDashboardStats();
        }
    });

    // Listen for feedback changes (disputes, reviews)
    database.ref('feedback').on('child_added', (snapshot) => {
        if (!realtimeListenersActive) return;
        const feedback = snapshot.val();

        if (feedback.type === 'dispute' && feedback.status === 'pending') {
            console.log('[ADMIN] Real-time: New dispute submitted');
            showNotification('New dispute requires attention!', 'warning');
            loadReviewsAndDisputes();
        }
    });

    // Mark listeners as active after initial data is loaded
    setTimeout(() => {
        realtimeListenersActive = true;
        console.log('[ADMIN] Real-time listeners now active');
    }, 3000);
}

// Refresh dashboard stats and charts efficiently
function refreshDashboardStats() {
    // Update stat cards
    const totalTransactionsEl = document.getElementById('totalTransactions');
    const totalUsersEl = document.getElementById('totalUsers');

    if (totalTransactionsEl) totalTransactionsEl.textContent = allTransactions.length;
    if (totalUsersEl) totalUsersEl.textContent = allUsers.length;

    // Recalculate commission
    let totalCommission = 0;
    allTransactions.forEach(txn => {
        totalCommission += txn.commissionFee || 0;
    });
    const totalCommissionEl = document.getElementById('totalCommission');
    if (totalCommissionEl) totalCommissionEl.textContent = formatCurrency(totalCommission);

    // Refresh quick stats
    loadQuickStats();

    // Refresh recent transactions table
    loadRecentTransactions();

    // Update charts with current filter values
    const currentSalesFilter = document.getElementById('salesTrendFilter')?.value || 'all';
    updateSalesChart(currentSalesFilter);

    const currentRevenueFilter = document.getElementById('revenueFilter')?.value || 'all';
    updateRevenueChart(currentRevenueFilter);
}

// Disable real-time listeners (cleanup)
function disableRealtimeListeners() {
    database.ref('transactions').off();
    database.ref('users').off();
    database.ref('feedback').off();
    realtimeListenersActive = false;
    console.log('[ADMIN] Real-time listeners disabled');
}

// ===== PRINT-FRIENDLY REPORT =====
// Generates a clean, printable summary of the dashboard

function printDashboardReport() {
    // ========================================
    // COMPREHENSIVE ADMIN DASHBOARD REPORT
    // ========================================

    // Basic stats
    const stats = {
        transactions: allTransactions.length,
        commission: document.getElementById('totalCommission')?.textContent || 'RM 0.00',
        users: allUsers.length,
        books: allBooks.length
    };

    // Calculate financial summary
    const totalRevenue = allTransactions.reduce((sum, txn) => sum + (txn.amount || 0), 0);
    const completedRevenue = allTransactions
        .filter(txn => txn.status === 'completed')
        .reduce((sum, txn) => sum + (txn.amount || 0), 0);
    const pendingEscrow = allTransactions
        .filter(txn => ['payment_held', 'delivered'].includes(txn.status))
        .reduce((sum, txn) => sum + (txn.amount || 0), 0);
    const frozenFunds = allTransactions
        .filter(txn => ['warranty_claimed', 'return_sent', 'return_received', 'dispute_open'].includes(txn.status))
        .reduce((sum, txn) => sum + (txn.amount || 0), 0);

    // Transaction status breakdown
    const statusCounts = {
        completed: allTransactions.filter(txn => txn.status === 'completed').length,
        pending: allTransactions.filter(txn => txn.status === 'payment_held').length,
        delivered: allTransactions.filter(txn => txn.status === 'delivered').length,
        warranty: allTransactions.filter(txn => ['warranty_claimed', 'return_sent', 'return_received'].includes(txn.status)).length,
        refunded: allTransactions.filter(txn => ['refunded', 'auto_refunded'].includes(txn.status)).length,
        disputed: allTransactions.filter(txn => txn.status === 'dispute_open').length
    };

    // User analytics
    const students = allUsers.filter(u => u.role === 'student').length;
    const staff = allUsers.filter(u => u.role === 'staff').length;

    // Top sellers by transaction count
    const sellerStats = {};
    allTransactions.forEach(txn => {
        const sellerId = txn.items?.[0]?.bookDetails?.sellerId;
        const sellerName = txn.items?.[0]?.bookDetails?.sellerName || 'Unknown';
        if (sellerId) {
            if (!sellerStats[sellerId]) {
                sellerStats[sellerId] = { name: sellerName, count: 0, revenue: 0 };
            }
            sellerStats[sellerId].count++;
            sellerStats[sellerId].revenue += (txn.amount || 0);
        }
    });
    const topSellers = Object.values(sellerStats)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

    // Book analytics
    const booksByCondition = {
        'Brand New': allBooks.filter(b => b.condition === 'Brand New').length,
        'Like New': allBooks.filter(b => b.condition === 'Like New').length,
        'Good': allBooks.filter(b => b.condition === 'Good').length,
        'Fair': allBooks.filter(b => b.condition === 'Fair').length,
        'Poor': allBooks.filter(b => b.condition === 'Poor').length
    };

    // Recent transactions (last 10)
    const recentTxns = allTransactions
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 10);

    // Create print window
    const printWindow = window.open('', '_blank');

    const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Admin Dashboard Report - ${new Date().toLocaleDateString('en-MY')}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; max-width: 900px; margin: 0 auto; font-size: 12px; }
                h1 { color: #46166c; border-bottom: 3px solid #46166c; padding-bottom: 10px; font-size: 24px; }
                h2 { color: #1e293b; margin-top: 25px; font-size: 16px; border-left: 4px solid #46166c; padding-left: 10px; }
                .header-info { display: flex; justify-content: space-between; margin-bottom: 20px; }
                .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 15px 0; }
                .stats-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 15px 0; }
                .stat-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; text-align: center; }
                .stat-box.green { background: #ecfdf5; border-color: #a7f3d0; }
                .stat-box.yellow { background: #fefce8; border-color: #fde047; }
                .stat-box.red { background: #fef2f2; border-color: #fecaca; }
                .stat-box.purple { background: #faf5ff; border-color: #e9d5ff; }
                .stat-value { font-size: 20px; font-weight: bold; color: #1e293b; }
                .stat-label { font-size: 10px; color: #64748b; margin-top: 4px; text-transform: uppercase; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
                th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
                th { background: #46166c; color: white; }
                tr:nth-child(even) { background: #f9fafb; }
                .two-column { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
                .section-box { background: #f8fafc; border-radius: 8px; padding: 15px; margin-top: 10px; }
                .mini-stat { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #e2e8f0; }
                .mini-stat:last-child { border-bottom: none; }
                .footer { margin-top: 30px; text-align: center; color: #94a3b8; font-size: 10px; border-top: 1px solid #e2e8f0; padding-top: 15px; }
                @media print { 
                    body { padding: 0; }
                    .stat-box, .section-box { break-inside: avoid; }
                }
            </style>
        </head>
        <body>
            <h1>📊 UiTM Book e-Marketplace - Admin Report</h1>
            <div class="header-info">
                <div><strong>Generated:</strong> ${new Date().toLocaleString('en-MY')}</div>
                <div><strong>Report Period:</strong> All Time</div>
            </div>
            
            <!-- KEY METRICS -->
            <h2>📈 Key Metrics</h2>
            <div class="stats-grid">
                <div class="stat-box">
                    <div class="stat-value">${stats.transactions}</div>
                    <div class="stat-label">Total Transactions</div>
                </div>
                <div class="stat-box green">
                    <div class="stat-value">${stats.commission}</div>
                    <div class="stat-label">Commission Earned</div>
                </div>
                <div class="stat-box">
                    <div class="stat-value">${stats.users}</div>
                    <div class="stat-label">Registered Users</div>
                </div>
                <div class="stat-box">
                    <div class="stat-value">${stats.books}</div>
                    <div class="stat-label">Books Listed</div>
                </div>
            </div>

            <!-- FINANCIAL SUMMARY -->
            <h2>💰 Financial Summary</h2>
            <div class="stats-grid">
                <div class="stat-box green">
                    <div class="stat-value">RM ${completedRevenue.toFixed(2)}</div>
                    <div class="stat-label">Completed Sales</div>
                </div>
                <div class="stat-box yellow">
                    <div class="stat-value">RM ${pendingEscrow.toFixed(2)}</div>
                    <div class="stat-label">In Escrow</div>
                </div>
                <div class="stat-box red">
                    <div class="stat-value">RM ${frozenFunds.toFixed(2)}</div>
                    <div class="stat-label">Frozen (Disputes)</div>
                </div>
                <div class="stat-box purple">
                    <div class="stat-value">RM ${totalRevenue.toFixed(2)}</div>
                    <div class="stat-label">Total Revenue</div>
                </div>
            </div>

            <!-- TWO COLUMN SECTION -->
            <div class="two-column">
                <!-- TRANSACTION STATUS -->
                <div>
                    <h2>🔄 Transaction Status</h2>
                    <div class="section-box">
                        <div class="mini-stat"><span>✅ Completed</span><strong>${statusCounts.completed}</strong></div>
                        <div class="mini-stat"><span>⏳ Pending Confirmation</span><strong>${statusCounts.pending}</strong></div>
                        <div class="mini-stat"><span>📦 Delivered (Warranty)</span><strong>${statusCounts.delivered}</strong></div>
                        <div class="mini-stat"><span>⚠️ Warranty Claims</span><strong>${statusCounts.warranty}</strong></div>
                        <div class="mini-stat"><span>↩️ Refunded</span><strong>${statusCounts.refunded}</strong></div>
                        <div class="mini-stat"><span>🔴 Open Disputes</span><strong>${statusCounts.disputed}</strong></div>
                    </div>
                </div>

                <!-- USER ANALYTICS -->
                <div>
                    <h2>👥 User Analytics</h2>
                    <div class="section-box">
                        <div class="mini-stat"><span>🎓 Students</span><strong>${students}</strong></div>
                        <div class="mini-stat"><span>👨‍🏫 Staff</span><strong>${staff}</strong></div>
                        <div class="mini-stat"><span>📊 Total Users</span><strong>${allUsers.length}</strong></div>
                    </div>
                    <h2 style="margin-top: 15px;">📚 Books by Condition</h2>
                    <div class="section-box">
                        ${Object.entries(booksByCondition).map(([cond, count]) =>
        `<div class="mini-stat"><span>${cond}</span><strong>${count}</strong></div>`
    ).join('')}
                    </div>
                </div>
            </div>

            <!-- TOP SELLERS -->
            <h2>🏆 Top 5 Sellers by Revenue</h2>
            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Seller Name</th>
                        <th>Sales Count</th>
                        <th>Total Revenue (RM)</th>
                    </tr>
                </thead>
                <tbody>
                    ${topSellers.length > 0 ? topSellers.map((seller, i) => `
                        <tr>
                            <td>${i + 1}</td>
                            <td>${seller.name}</td>
                            <td>${seller.count}</td>
                            <td>${seller.revenue.toFixed(2)}</td>
                        </tr>
                    `).join('') : '<tr><td colspan="4" style="text-align: center;">No sales data</td></tr>'}
                </tbody>
            </table>
            
            <!-- RECENT TRANSACTIONS -->
            <h2>📝 Recent Transactions (Last 10)</h2>
            <table>
                <thead>
                    <tr>
                        <th>Transaction ID</th>
                        <th>Date</th>
                        <th>Buyer</th>
                        <th>Book</th>
                        <th>Amount (RM)</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${recentTxns.map(txn => `
                        <tr>
                            <td>${txn.transactionId?.substring(0, 10) || txn.id?.substring(0, 10) || 'N/A'}...</td>
                            <td>${txn.createdAt ? new Date(txn.createdAt).toLocaleDateString('en-MY') : 'N/A'}</td>
                            <td>${txn.buyerName || txn.buyerEmail?.split('@')[0] || 'N/A'}</td>
                            <td>${txn.items?.[0]?.bookDetails?.title?.substring(0, 20) || 'N/A'}...</td>
                            <td>${(txn.amount || 0).toFixed(2)}</td>
                            <td>${txn.status || 'N/A'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div class="footer">
                <p><strong>UiTM Book e-Marketplace</strong> | Admin Dashboard Report | Confidential</p>
                <p>Generated by System on ${new Date().toLocaleString('en-MY')}</p>
            </div>
            
            <script>
                window.onload = function() { window.print(); }
            </script>
        </body>
        </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();

    showNotification('Comprehensive report generated', 'success');
}
