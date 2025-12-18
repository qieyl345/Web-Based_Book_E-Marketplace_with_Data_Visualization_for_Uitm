// Admin dashboard functionality

let allUsers = [];
let allTransactions = [];
let allBooks = [];

// Store chart instances globally for dynamic updates
let salesChartInstance = null;
let revenueChartInstance = null;
let disputeMetricsChartInstance = null;
let topBooksChartInstance = null;
let subjectChartInstance = null;
let transactionSuccessChartInstance = null;
let feedbackDistributionChartInstance = null;
let offerFunnelChartInstance = null;

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
        setupSettingsForm();
        setupChartFilters(); // NEW: Setup filter event listeners

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

async function loadFeedback() {
    console.log('[ADMIN] loadFeedback called');
    const tbody = document.getElementById('feedbackTable');
    if (!tbody) return;

    try {
        const snapshot = await database.ref('feedback').once('value');
        const feedbackList = [];
        snapshot.forEach(child => {
            feedbackList.push({ id: child.key, ...child.val() });
        });

        // Sort by date descending
        feedbackList.sort((a, b) => b.createdAt - a.createdAt);

        if (feedbackList.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">No feedback found</td></tr>';
            return;
        }

        // Fetch transaction status for disputes
        const rows = await Promise.all(feedbackList.map(async (item) => {
            let txnStatus = '';
            let returnStatusBadge = '';
            let canRefund = false;

            if (item.transactionId && item.type === 'dispute') {
                try {
                    const txnSnap = await database.ref(`transactions/${item.transactionId}`).once('value');
                    const txn = txnSnap.val();
                    if (txn) {
                        txnStatus = txn.status;
                        canRefund = (txnStatus === 'return_received');

                        // Create status badge
                        const statusColors = {
                            'warranty_claimed': '#f59e0b',
                            'return_sent': '#3b82f6',
                            'return_received': '#10b981',
                            'dispute_open': '#ef4444'
                        };
                        const statusLabels = {
                            'warranty_claimed': '📦 Warranty Claimed',
                            'return_sent': '🔄 Return Sent',
                            'return_received': '✅ Ready for Refund',
                            'dispute_open': '⚠️ Dispute Open'
                        };

                        if (statusColors[txnStatus]) {
                            returnStatusBadge = `<span style="background: ${statusColors[txnStatus]}; color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; display: inline-block; margin-top: 0.25rem;">${statusLabels[txnStatus]}</span>`;
                        }
                    }
                } catch (e) {
                    console.warn('Could not fetch transaction:', e);
                }
            }

            return `
                <tr>
                    <td>${formatDate(item.createdAt)}</td>
                    <td>${item.buyerName}</td>
                    <td><span class="status-badge ${item.type === 'dispute' ? 'cancelled' : 'completed'}">${item.type}</span></td>
                    <td>${item.rating}/5</td>
                    <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis;">
                        ${item.comment}
                        ${returnStatusBadge}
                    </td>
                    <td><span class="status-badge ${item.status === 'resolved' ? 'completed' : 'pending'}">${item.status}</span></td>
                    <td>
                        ${item.type === 'dispute' && item.status !== 'resolved' ? `
                            <div style="display: flex; gap: 0.25rem; flex-wrap: wrap;">
                                <button class="btn btn-sm ${canRefund ? 'btn-warning' : 'btn-secondary'}" 
                                    onclick="resolveDisputeForBuyer('${item.transactionId || ''}', '${item.id}')" 
                                    title="${canRefund ? 'Refund full amount to buyer' : 'Wait for both parties to confirm return'}"
                                    ${!canRefund ? 'style="opacity: 0.6; cursor: not-allowed;"' : ''}>
                                    <i class="fas fa-undo"></i> ${canRefund ? 'Refund' : 'Waiting...'}
                                </button>
                                <button class="btn btn-sm btn-success" onclick="resolveDisputeForSeller('${item.transactionId || ''}', '${item.id}')" title="Pay seller (minus 10% commission)">
                                    <i class="fas fa-check"></i> Pay Seller
                                </button>
                            </div>
                        ` : ''}
                    </td>
                </tr>
            `;
        }));

        tbody.innerHTML = rows.join('');
    } catch (error) {
        console.error('[ADMIN] Error loading feedback:', error);
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Error loading feedback</td></tr>';
    }
}

// ESCROW: Resolve dispute - REFUND to buyer
// WARRANTY FLOW: Requires both buyer and seller to confirm return first
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

        // WARRANTY FLOW: Check if both parties confirmed the return
        if (txn.status !== 'return_received') {
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

        if (!confirm('Both parties have confirmed the book return. Refund the buyer now?')) return;

        const basePrice = txn.items.reduce((sum, item) => sum + item.bookDetails.price, 0);

        // Refund to buyer's wallet (full amount including what they paid)
        const buyerWalletRef = database.ref(`users/${txn.buyerId}/wallet`);
        const buyerWallet = (await buyerWalletRef.once('value')).val() || {};
        await buyerWalletRef.update({
            balance: (buyerWallet.balance || 0) + txn.amount  // Full refund including commission
        });
        console.log(`[ESCROW] Refunded RM${txn.amount} to buyer`);

        // Clear seller's frozen funds
        for (const item of txn.items) {
            const sellerWalletRef = database.ref(`users/${item.bookDetails.sellerId}/wallet`);
            const sellerWallet = (await sellerWalletRef.once('value')).val() || {};
            await sellerWalletRef.update({
                frozenDispute: Math.max(0, (sellerWallet.frozenDispute || 0) - item.bookDetails.price)
            });
        }
        console.log(`[ESCROW] Cleared seller's frozen funds`);

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
        loadFeedback();

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
        loadFeedback();

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
            loadFeedback();
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

        // Top Books Chart
        console.log('[ADMIN] Creating Top Books Chart...');
        const topBooksCtx = document.getElementById('topBooksChart');
        if (!topBooksCtx) {
            console.error('[ADMIN] topBooksChart canvas not found!');
        } else {
            const topBooksData = calculateTopBooks();
            console.log('[ADMIN] Top books data:', topBooksData);
            new Chart(topBooksCtx.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: topBooksData.labels,
                    datasets: [{
                        label: 'Books Sold',
                        data: topBooksData.data,
                        backgroundColor: '#FFB81C'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    indexAxis: 'y',
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top'
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
            console.log('[ADMIN] Top Books Chart created');
        }

        // Subject Distribution Chart
        console.log('[ADMIN] Creating Subject Distribution Chart...');
        const subjectCtx = document.getElementById('subjectChart');
        if (!subjectCtx) {
            console.error('[ADMIN] subjectChart canvas not found!');
        } else {
            const subjectData = calculateSubjectDistribution();
            console.log('[ADMIN] Subject data:', subjectData);
            new Chart(subjectCtx.getContext('2d'), {
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

function calculateTopBooks() {
    const bookSales = {};

    // Add defensive check for empty transactions
    if (!allTransactions || allTransactions.length === 0) {
        return { labels: ['No Data'], data: [0] };
    }

    allTransactions.forEach(txn => {
        if (txn.items && Array.isArray(txn.items)) {
            txn.items.forEach(item => {
                // Add null checks for bookDetails and title
                if (item && item.bookDetails && item.bookDetails.title) {
                    const title = item.bookDetails.title;
                    bookSales[title] = (bookSales[title] || 0) + 1;
                }
            });
        }
    });

    const sorted = Object.entries(bookSales)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    // Handle case when no books were found
    if (sorted.length === 0) {
        return { labels: ['No Data'], data: [0] };
    }

    return {
        labels: sorted.map(([title]) => title.length > 20 ? title.substring(0, 20) + '...' : title),
        data: sorted.map(([, count]) => count)
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

// CSV Export Implementation
function exportTransactionsToCSV() {
    if (!allTransactions || allTransactions.length === 0) {
        showNotification("No transactions to export", "info");
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
    const rows = allTransactions.map(txn => {
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
    link.setAttribute('download', `transactions_export_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
    showNotification(`Exported ${allTransactions.length} transactions to CSV`, "success");
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
        createDisputeMetricsChart();
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

    new Chart(ctx.getContext('2d'), {
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
    let successful = 0, failed = 0;

    allTransactions.forEach(txn => {
        const status = txn.status?.toLowerCase() || 'unknown';
        if (status === 'completed' || status === 'successful') {
            successful++;
        } else {
            // Count failed, cancelled, and any other status as failed
            failed++;
        }
    });

    return {
        successful,
        failed,
        total: successful + failed
    };
}

async function createFeedbackDistributionChart() {
    const ctx = document.getElementById('feedbackDistributionChart');
    if (!ctx) return;

    const distribution = await calculateFeedbackDistribution();

    new Chart(ctx.getContext('2d'), {
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

async function createDisputeMetricsChart() {
    const ctx = document.getElementById('disputeMetricsChart');
    if (!ctx) return;

    const metrics = await calculateDisputeMetricsWithFilter('all'); // Default to All Time

    disputeMetricsChartInstance = new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: {
            labels: metrics.labels,
            datasets: [
                {
                    label: 'Disputes Opened',
                    data: metrics.opened,
                    backgroundColor: '#EF4444',
                    order: 2
                },
                {
                    label: 'Disputes Resolved',
                    data: metrics.resolved,
                    backgroundColor: '#00A86B',
                    order: 2
                },
                {
                    type: 'line',
                    label: 'Resolution Rate (%)',
                    data: metrics.resolutionRate,
                    borderColor: '#005C99',
                    backgroundColor: 'rgba(0, 92, 153, 0.1)',
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

async function calculateDisputeMetrics() {
    const opened = [0, 0, 0, 0];
    const resolved = [0, 0, 0, 0];
    const resolutionRate = [0, 0, 0, 0];

    try {
        const feedbackSnapshot = await database.ref('feedback').once('value');
        const disputes = [];

        feedbackSnapshot.forEach(child => {
            const feedback = child.val();
            if (feedback.type === 'dispute') {
                disputes.push({ id: child.key, ...feedback });
            }
        });

        // Group by last 4 weeks
        for (let weekIndex = 0; weekIndex < 4; weekIndex++) {
            const weekStart = new Date();
            weekStart.setDate(weekStart.getDate() - (7 * (4 - weekIndex)));
            const weekEnd = new Date();
            weekEnd.setDate(weekEnd.getDate() - (7 * (3 - weekIndex)));

            disputes.forEach(dispute => {
                const createdDate = new Date(dispute.createdAt);
                if (createdDate >= weekStart && createdDate < weekEnd) {
                    opened[weekIndex]++;
                    if (dispute.status === 'resolved') {
                        resolved[weekIndex]++;
                    }
                }
            });

            resolutionRate[weekIndex] = opened[weekIndex] > 0
                ? ((resolved[weekIndex] / opened[weekIndex]) * 100).toFixed(1)
                : 0;
        }
    } catch (error) {
        console.error('[ADMIN] Error calculating dispute metrics:', error);
    }

    return { opened, resolved, resolutionRate };
}

function createOfferFunnelChart() {
    const ctx = document.getElementById('offerFunnelChart');
    if (!ctx) return;

    const funnelData = calculateOfferFunnel();

    new Chart(ctx.getContext('2d'), {
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

    // Dispute Metrics Filter
    const disputeFilter = document.getElementById('disputeMetricsFilter');
    if (disputeFilter) {
        disputeFilter.addEventListener('change', (e) => {
            updateDisputeMetricsChart(e.target.value);
        });
    }

    // Top Books Filter
    const topBooksFilter = document.getElementById('topBooksFilter');
    if (topBooksFilter) {
        topBooksFilter.addEventListener('change', (e) => {
            updateTopBooksChart(e.target.value);
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

function updateSalesChart(range) {
    const salesData = calculateSalesTrendWithFilter(range);

    if (salesChartInstance) {
        salesChartInstance.data.labels = salesData.labels;
        salesChartInstance.data.datasets[0].data = salesData.data;
        salesChartInstance.update();
    }
}

function updateRevenueChart(range) {
    const revenueData = calculateRevenueTrendWithFilter(range);

    if (revenueChartInstance) {
        revenueChartInstance.data.labels = revenueData.labels;
        revenueChartInstance.data.datasets[0].data = revenueData.data;
        revenueChartInstance.update();
    }
}

function updateDisputeMetricsChart(range) {
    const metricsData = calculateDisputeMetricsWithFilter(range);

    if (disputeMetricsChartInstance) {
        disputeMetricsChartInstance.data.labels = metricsData.labels;
        disputeMetricsChartInstance.data.datasets[0].data = metricsData.opened;
        disputeMetricsChartInstance.data.datasets[1].data = metricsData.resolved;
        disputeMetricsChartInstance.data.datasets[2].data = metricsData.resolutionRate;
        disputeMetricsChartInstance.update();
    }
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

async function calculateDisputeMetricsWithFilter(range) {
    let weeks = 4;
    let labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];

    if (range === '12') {
        weeks = 12;
        labels = ['Month 1', 'Month 2', 'Month 3'];
    } else if (range === '24') {
        weeks = 24;
        labels = ['Month 1', 'Month 2', 'Month 3', 'Month 4', 'Month 5', 'Month 6'];
    } else if (range === 'all') {
        // Show all disputes grouped by month
        return calculateAllTimeDisputeMetrics();
    }

    const opened = new Array(range === '4' ? 4 : range === '12' ? 3 : 6).fill(0);
    const resolved = new Array(opened.length).fill(0);
    const resolutionRate = new Array(opened.length).fill(0);

    try {
        const feedbackSnapshot = await database.ref('feedback').once('value');
        const disputes = [];

        feedbackSnapshot.forEach(child => {
            const feedback = child.val();
            if (feedback.type === 'dispute') {
                disputes.push({ id: child.key, ...feedback });
            }
        });

        const daysPerPeriod = range === '4' ? 7 : 30;

        for (let periodIndex = 0; periodIndex < opened.length; periodIndex++) {
            const periodStart = new Date();
            periodStart.setDate(periodStart.getDate() - (daysPerPeriod * (opened.length - periodIndex)));
            const periodEnd = new Date();
            periodEnd.setDate(periodEnd.getDate() - (daysPerPeriod * (opened.length - periodIndex - 1)));

            disputes.forEach(dispute => {
                const createdDate = new Date(dispute.createdAt);
                if (createdDate >= periodStart && createdDate < periodEnd) {
                    opened[periodIndex]++;
                    if (dispute.status === 'resolved') {
                        resolved[periodIndex]++;
                    }
                }
            });

            resolutionRate[periodIndex] = opened[periodIndex] > 0
                ? ((resolved[periodIndex] / opened[periodIndex]) * 100).toFixed(1)
                : 0;
        }
    } catch (error) {
        console.error('[ADMIN] Error calculating dispute metrics:', error);
    }

    return { labels, opened, resolved, resolutionRate };
}

async function calculateAllTimeDisputeMetrics() {
    const monthlyData = {};

    try {
        const feedbackSnapshot = await database.ref('feedback').once('value');

        feedbackSnapshot.forEach(child => {
            const feedback = child.val();
            if (feedback.type === 'dispute') {
                const date = new Date(feedback.createdAt);
                const monthYear = date.toLocaleDateString('en-MY', { month: 'short', year: 'numeric' });

                if (!monthlyData[monthYear]) {
                    monthlyData[monthYear] = { opened: 0, resolved: 0 };
                }

                monthlyData[monthYear].opened++;
                if (feedback.status === 'resolved') {
                    monthlyData[monthYear].resolved++;
                }
            }
        });

        const sortedMonths = Object.keys(monthlyData).sort((a, b) => new Date(a) - new Date(b));

        return {
            labels: sortedMonths,
            opened: sortedMonths.map(m => monthlyData[m].opened),
            resolved: sortedMonths.map(m => monthlyData[m].resolved),
            resolutionRate: sortedMonths.map(m =>
                monthlyData[m].opened > 0
                    ? ((monthlyData[m].resolved / monthlyData[m].opened) * 100).toFixed(1)
                    : 0
            )
        };
    } catch (error) {
        console.error('[ADMIN] Error calculating all time dispute metrics:', error);
        return { labels: [], opened: [], resolved: [], resolutionRate: [] };
    }
}

// ===== UPDATE FUNCTIONS FOR REMAINING CHARTS =====

function updateTopBooksChart(range) {
    const data = calculateTopBooksWithFilter(range);
    if (topBooksChartInstance) {
        topBooksChartInstance.data.labels = data.labels;
        topBooksChartInstance.data.datasets[0].data = data.data;
        topBooksChartInstance.update();
    }
}

function updateSubjectChart(range) {
    const data = calculateSubjectDistributionWithFilter(range);
    if (subjectChartInstance) {
        subjectChartInstance.data.labels = data.labels;
        subjectChartInstance.data.datasets[0].data = data.data;
        subjectChartInstance.update();
    }
}

function updateTransactionSuccessChart(range) {
    const data = calculateTransactionSuccessWithFilter(range);
    if (transactionSuccessChartInstance) {
        transactionSuccessChartInstance.data.datasets[0].data = data.counts;
        transactionSuccessChartInstance.update();
    }
}

async function updateFeedbackDistributionChart(range) {
    const data = await calculateFeedbackDistributionWithFilter(range);
    if (feedbackDistributionChartInstance) {
        feedbackDistributionChartInstance.data.datasets[0].data = data.counts;
        feedbackDistributionChartInstance.update();
    }
}

async function updateOfferFunnelChart(range) {
    const data = await calculateOfferFunnelWithFilter(range);
    if (offerFunnelChartInstance) {
        offerFunnelChartInstance.data.datasets[0].data = data.counts;
        offerFunnelChartInstance.update();
    }
}

// ===== CALCULATION FUNCTIONS WITH FILTERS =====

function calculateTopBooksWithFilter(range) {
    let filteredTransactions = allTransactions;

    if (range !== 'all') {
        const days = parseInt(range);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        filteredTransactions = allTransactions.filter(txn => new Date(txn.createdAt) >= cutoffDate);
    }

    const bookCounts = {};
    filteredTransactions.forEach(txn => {
        if (txn.items && Array.isArray(txn.items)) {
            txn.items.forEach(item => {
                const bookTitle = item.bookDetails?.title || 'Unknown Book';
                bookCounts[bookTitle] = (bookCounts[bookTitle] || 0) + 1;
            });
        }
    });

    const sortedBooks = Object.entries(bookCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    return {
        labels: sortedBooks.map(([title]) => title),
        data: sortedBooks.map(([, count]) => count)
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
                    <td colspan="7" style="text-align: center; padding: 2rem; color: #10b981;">
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

            // Determine return status badge and available actions
            let statusBadge = '';
            let actions = '';

            switch (txn.status) {
                case 'warranty_claimed':
                    // Buyer claimed but hasn't returned yet - show countdown
                    const claimedAt = txn.warrantyClaimedAt || Date.now();
                    const returnDeadline = claimedAt + (7 * 24 * 60 * 60 * 1000);
                    const timeLeft = returnDeadline - Date.now();
                    const daysLeft = Math.max(0, Math.ceil(timeLeft / (24 * 60 * 60 * 1000)));

                    if (daysLeft > 0) {
                        statusBadge = `<span class="badge" style="background: #f59e0b; color: white; padding: 0.25rem 0.5rem; border-radius: 4px;">⚠️ Claimed (${daysLeft}d left)</span>`;
                        actions = `
                            <span style="color: #94a3b8; font-size: 0.75rem;">⏳ ${daysLeft}d to return</span>
                            <button class="btn btn-outline btn-sm" onclick="dismissWarrantyClaim('${orderId}')" style="margin-left: 0.5rem; border: 1px solid #94a3b8; background: transparent; color: #64748b;" title="Dismiss claim manually">
                                <i class="fas fa-times"></i> Dismiss
                            </button>
                        `;
                    } else {
                        statusBadge = '<span class="badge" style="background: #ef4444; color: white; padding: 0.25rem 0.5rem; border-radius: 4px;">❌ Expired</span>';
                        actions = `
                            <span style="color: #ef4444; font-size: 0.75rem;">Will auto-dismiss</span>
                        `;
                    }
                    break;

                case 'return_sent':
                    // Buyer has sent, seller hasn't confirmed receipt
                    statusBadge = '<span class="badge" style="background: #3b82f6; color: white; padding: 0.25rem 0.5rem; border-radius: 4px;">📦 Return Sent</span>';
                    actions = `<span style="color: #94a3b8; font-size: 0.75rem;">⏳ Seller to confirm receipt</span>`;
                    break;

                case 'return_received':
                    // Book is back with seller - only Refund makes sense now
                    statusBadge = '<span class="badge" style="background: #10b981; color: white; padding: 0.25rem 0.5rem; border-radius: 4px;">✅ Ready for Refund</span>';
                    actions = `
                        <button class="btn btn-success btn-sm" onclick="processWarrantyRefund('${orderId}')">
                            <i class="fas fa-undo"></i> Process Refund
                        </button>
                    `;
                    break;
            }

            return `
                <tr>
                    <td><code style="background: #f1f5f9; padding: 0.25rem 0.5rem; border-radius: 4px;">#${orderId.substring(0, 8)}</code></td>
                    <td>${buyerName}</td>
                    <td>${sellerName}</td>
                    <td><span style="color: #ef4444; font-weight: 500;">${issueType}</span></td>
                    <td>${statusBadge}</td>
                    <td style="font-weight: 600;">RM ${amount.toFixed(2)}</td>
                    <td>${actions}</td>
                </tr>
            `;
        }).join('');

    } catch (error) {
        console.error('[ADMIN] Error loading warranty issues:', error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="color: #ef4444;">Error loading warranty issues</td>
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
        await loadFeedback();

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

        const COMMISSION_RATE = 0.10;
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
        await loadFeedback();

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

// Load Payout Queue
async function loadPayoutQueue() {
    console.log('[ADMIN] loadPayoutQueue called');
    const tableBody = document.getElementById('payoutQueueTable');
    const countBadge = document.getElementById('payoutQueueCount');

    if (!tableBody) return;

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
                        No pending payouts in queue
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = payoutQueue.map(txn => {
            const sellerName = txn.items?.[0]?.bookDetails?.sellerName || 'Unknown';
            const orderId = txn.transactionId || txn.id;
            const amount = (txn.basePrice || txn.amount || 0) * 0.9; // After 10% commission
            const expiresAt = txn.warrantyExpiresAt || txn.payoutScheduledAt;
            const daysLeft = expiresAt ? Math.ceil((expiresAt - now) / (24 * 60 * 60 * 1000)) : '?';

            let statusBadge = '';
            if (daysLeft <= 0) {
                statusBadge = '<span class="badge" style="background: #22c55e; color: white; padding: 0.2rem 0.5rem; border-radius: 4px;">Ready</span>';
            } else if (daysLeft <= 2) {
                statusBadge = '<span class="badge" style="background: #f59e0b; color: white; padding: 0.2rem 0.5rem; border-radius: 4px;">Soon</span>';
            } else {
                statusBadge = '<span class="badge" style="background: #64748b; color: white; padding: 0.2rem 0.5rem; border-radius: 4px;">Waiting</span>';
            }

            return `
                <tr>
                    <td>${sellerName}</td>
                    <td><code style="background: #f1f5f9; padding: 0.2rem 0.4rem; border-radius: 4px;">#${orderId.substring(0, 8)}</code></td>
                    <td style="font-weight: 600; color: #22c55e;">RM ${amount.toFixed(2)}</td>
                    <td>${daysLeft > 0 ? `${daysLeft} day(s)` : 'Expired'}</td>
                    <td>${statusBadge}</td>
                </tr>
            `;
        }).join('');

    } catch (error) {
        console.error('[ADMIN] Error loading payout queue:', error);
        tableBody.innerHTML = '<tr><td colspan="5" style="color: #ef4444;">Error loading</td></tr>';
    }
}

// Load Reviews and Disputes (split from old loadFeedback)
async function loadReviewsAndDisputes() {
    console.log('[ADMIN] loadReviewsAndDisputes called');

    try {
        const snapshot = await database.ref('feedback').orderByChild('createdAt').once('value');
        const allFeedback = [];

        snapshot.forEach(child => {
            const feedback = child.val();
            feedback.id = child.key;
            allFeedback.push(feedback);
        });

        // Split into reviews (rating >= 4) and disputes (rating < 4 or dispute type)
        const reviews = allFeedback.filter(f => f.rating >= 4 && f.feedbackType !== 'dispute');
        const disputes = allFeedback.filter(f => f.rating < 4 || f.feedbackType === 'dispute');

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

        // Render reviews
        const reviewsTable = document.getElementById('reviewsTable');
        const reviewsCount = document.getElementById('reviewsCount');

        if (reviewsCount) reviewsCount.textContent = reviews.length;

        if (reviewsTable) {
            if (reviews.length === 0) {
                reviewsTable.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #64748b;">No reviews yet</td></tr>';
            } else {
                reviewsTable.innerHTML = reviews.slice(0, 10).map(f => `
                    <tr>
                        <td>${formatDate(f.createdAt)}</td>
                        <td>${f.buyerName || 'Unknown'}</td>
                        <td>${'⭐'.repeat(f.rating || 0)}</td>
                        <td style="max-width: 250px;">${formatComment(f.comment, 60)}</td>
                    </tr>
                `).join('');
            }
        }

        // Render disputes
        const disputesTable = document.getElementById('disputesTable');
        const disputesCount = document.getElementById('disputesCount');

        if (disputesCount) disputesCount.textContent = disputes.length;

        if (disputesTable) {
            if (disputes.length === 0) {
                disputesTable.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #10b981;">No disputes! 🎉</td></tr>';
            } else {
                disputesTable.innerHTML = disputes.slice(0, 10).map(f => {
                    const statusBadge = f.resolved
                        ? '<span class="badge" style="background: #10b981; color: white; padding: 0.2rem 0.5rem; border-radius: 4px;">Resolved</span>'
                        : '<span class="badge" style="background: #f59e0b; color: white; padding: 0.2rem 0.5rem; border-radius: 4px;">Pending</span>';

                    return `
                        <tr>
                            <td>${formatDate(f.createdAt)}</td>
                            <td>${f.buyerName || 'Unknown'}</td>
                            <td>${'⭐'.repeat(f.rating || 0)}</td>
                            <td style="max-width: 250px;">${formatComment(f.comment, 60)}</td>
                            <td>${statusBadge}</td>
                            <td>
                                ${!f.resolved ? `<button class="btn btn-sm btn-success" onclick="resolveFeedback('${f.id}')">Resolve</button>` : '-'}
                            </td>
                        </tr>
                    `;
                }).join('');
            }
        }

        console.log('[ADMIN] Loaded reviews:', reviews.length, 'disputes:', disputes.length);
    } catch (error) {
        console.error('[ADMIN] Error loading reviews/disputes:', error);
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
                    sellerStats[sellerId] = { name: sellerName, sales: 0, revenue: 0 };
                }
                sellerStats[sellerId].sales++;
                sellerStats[sellerId].revenue += price;
            });
        });

        // Convert to array and sort by revenue
        const leaderboard = Object.entries(sellerStats)
            .map(([id, stats]) => ({ id, ...stats }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);

        if (leaderboard.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #64748b;">No sales data yet</td></tr>';
            return;
        }

        const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
        tableBody.innerHTML = leaderboard.map((seller, index) => `
            <tr>
                <td style="font-size: 1.25rem;">${medals[index] || index + 1}</td>
                <td><strong>${seller.name}</strong></td>
                <td>${seller.sales}</td>
                <td style="color: #22c55e; font-weight: 600;">RM ${seller.revenue.toFixed(2)}</td>
                <td>⭐ 4.5</td>
            </tr>
        `).join('');

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

// Helper: Resolve feedback/dispute
async function resolveFeedback(feedbackId) {
    try {
        await database.ref(`feedback/${feedbackId}`).update({ resolved: true, resolvedAt: Date.now() });
        showNotification('Feedback marked as resolved', 'success');
        await loadReviewsAndDisputes();
    } catch (error) {
        console.error('[ADMIN] Error resolving feedback:', error);
        showNotification('Error resolving feedback', 'error');
    }
}
