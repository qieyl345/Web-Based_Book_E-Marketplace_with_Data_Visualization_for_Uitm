// Profile page functionality

let myListings = [];
let purchaseHistory = [];
let salesHistory = [];

// Initialize profile page
document.addEventListener('DOMContentLoaded', async () => {
    await requireAuth();
    await checkForAutoDisputes(); // Check for expired orders
    await checkForAutoPayout(); // Check for warranty-expired orders to pay sellers
    await loadProfile();
    await loadMyListings();
    await loadPurchaseHistory();
    await loadSalesHistory();
    await loadNegotiations();
    await loadWallet(); // Load wallet data
    setupProfileEdit();
    setupAvatarUpload();
    setupTabs();
    setupModal();
    setupFeedbackModals();
    setupReportIssueForm(); // Setup report issue modal form
});

async function loadProfile() {
    try {
        const profileImage = document.getElementById('profileImage');
        const profileName = document.getElementById('profileName');
        const profileEmail = document.getElementById('profileEmail');
        const profileRole = document.getElementById('profileRole');
        const profileJoinDate = document.getElementById('profileJoinDate');

        profileImage.src = userData.profilePic || '/assets/images/default-avatar.png';
        profileName.textContent = userData.fullName;
        profileEmail.textContent = userData.email;
        profileRole.textContent = userData.role.charAt(0).toUpperCase() + userData.role.slice(1);
        profileJoinDate.textContent = `Member since: ${formatDate(userData.createdAt)}`;

        // Update edit form
        document.getElementById('editFullName').value = userData.fullName;
        document.getElementById('editPhoneNumber').value = userData.phoneNumber || '';
    } catch (error) {
        console.error("Error loading profile:", error);
        showNotification("Error loading profile", "error");
    }
}

// Update all stats
function updateStats() {
    try {
        document.getElementById('totalListings').textContent = myListings.length;
        document.getElementById('totalSales').textContent = salesHistory.length;
        document.getElementById('totalPurchases').textContent = purchaseHistory.length;
    } catch (error) {
        console.error("Error updating stats:", error);
    }
}

async function loadMyListings() {
    try {
        const snapshot = await database.ref('books').orderByChild('sellerId').equalTo(currentUser.uid).once('value');
        myListings = [];

        snapshot.forEach(childSnapshot => {
            const book = childSnapshot.val();
            book.id = childSnapshot.key;
            myListings.push(book);
        });

        displayMyListings();
        updateStats(); // Update stats after loading
    } catch (error) {
        console.error("Error loading listings:", error);
    }
}

function displayMyListings() {
    const listingsContainer = document.getElementById('myListings');

    if (myListings.length === 0) {
        listingsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-book"></i>
                <h3>No listings yet</h3>
                <p>Start selling your books!</p>
                <a href="index.html" class="btn btn-primary">Browse Books</a>
            </div>
        `;
        return;
    }

    listingsContainer.innerHTML = myListings.map(book => `
        <div class="cart-item listing-item">
            <div class="cart-item-image">
                <img src="${book.images?.[0] || '/assets/images/no-image.png'}" alt="${book.title}">
            </div>
            <div class="cart-item-details" style="flex: 1;">
                <h3 style="margin-bottom: 1rem; color: var(--text-primary);">${book.title}</h3>
                <div class="cart-item-meta" style="display: flex; flex-wrap: wrap; gap: 1rem;">
                    <span style="display: flex; align-items: center; gap: 0.5rem;">
                        <i class="fas fa-user"></i> <strong>Author:</strong> ${book.author}
                    </span>
                    <span style="display: flex; align-items: center; gap: 0.5rem;">
                        <i class="fas fa-tag"></i> <strong>Code:</strong> ${book.subjectCode}
                    </span>
                    <span style="display: flex; align-items: center; gap: 0.5rem;">
                        <i class="fas fa-map-marker-alt"></i> <strong>Campus:</strong> ${book.campusLocation}
                    </span>
                    <span style="display: flex; align-items: center; gap: 0.5rem;">
                        <i class="fas fa-book-open"></i> <strong>Condition:</strong> ${book.condition}
                    </span>
                </div>
            </div>
            <div class="cart-item-actions" style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.75rem; min-width: 150px;">
                <div>
                    <div style="font-size: 0.875rem; color: var(--text-tertiary); margin-bottom: 0.25rem;">Listed Price:</div>
                    <div class="cart-item-price" style="font-size: 1.75rem;">RM ${book.price.toFixed(2)}</div>
                </div>
                <span class="status-badge ${book.status}">${book.status}</span>
            </div>
        </div>
    `).join('');
}

async function loadPurchaseHistory() {
    try {
        const snapshot = await database.ref('transactions').orderByChild('buyerId').equalTo(currentUser.uid).once('value');
        purchaseHistory = [];

        snapshot.forEach(childSnapshot => {
            const transaction = childSnapshot.val();
            transaction.id = childSnapshot.key;
            purchaseHistory.push(transaction);
        });

        // Sort by date (newest first)
        purchaseHistory.sort((a, b) => b.createdAt - a.createdAt);

        displayPurchaseHistory();
        updateStats(); // Update stats after loading
    } catch (error) {
        console.error("Error loading purchase history:", error);
    }
}

function displayPurchaseHistory() {
    const purchaseContainer = document.getElementById('purchaseHistory');

    if (purchaseHistory.length === 0) {
        purchaseContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-shopping-bag"></i>
                <h3>No purchases yet</h3>
                <p>Start buying books from other students!</p>
                <a href="index.html" class="btn btn-primary">Browse Books</a>
            </div>
        `;
        return;
    }

    purchaseContainer.innerHTML = purchaseHistory.map(transaction => {
        const status = transaction.status || 'completed';
        const deliveryStatus = transaction.deliveryStatus || 'completed';
        const now = Date.now();

        // Determine timeline progress based on status
        let timelineHTML = '';
        let escrowInfoHTML = '';
        let showConfirmButton = false;
        let showUnreceiveButton = false;

        // Calculate progress percentage and step states
        const steps = getTimelineSteps(transaction, status, deliveryStatus);
        const progressPercent = calculateProgressPercent(status, deliveryStatus);

        // Generate timeline HTML
        timelineHTML = `
            <div class="transaction-timeline">
                <div class="timeline-progress">
                    <div class="timeline-progress-bar" style="width: ${progressPercent}%"></div>
                </div>
                ${steps.map(step => `
                    <div class="timeline-step ${step.state}">
                        <div class="timeline-icon">
                            <i class="fas ${step.icon}"></i>
                        </div>
                        <div class="timeline-label">
                            ${step.label}
                            ${step.tooltip ? `<span class="info-tooltip" data-tooltip="${step.tooltip}"><i class="fas fa-info-circle" style="font-size: 0.65rem; color: #94a3b8; margin-left: 3px;"></i></span>` : ''}
                        </div>
                        ${step.timestamp ? `<div class="timeline-timestamp">${step.timestamp}</div>` : ''}
                    </div>
                `).join('')}
            </div>
        `;

        // Generate escrow info box based on status
        // WARRANTY FLOW: payment_held -> delivered -> warranty_claimed -> return_sent -> return_received -> refunded OR completed

        let showClaimWarrantyButton = false;
        let showConfirmReturnButton = false;

        if (status === 'payment_held') {
            // Awaiting buyer confirmation
            const timeRemaining = transaction.expectedDeliveryDate - now;
            const daysRemaining = Math.ceil(timeRemaining / (24 * 60 * 60 * 1000));

            escrowInfoHTML = `
                <div class="escrow-info-box warning">
                    <i class="fas fa-shield-alt escrow-info-icon" style="color: #f59e0b;"></i>
                    <div class="escrow-info-text">
                        <strong>💰 Money held in escrow.</strong> 
                        Please confirm received within ${Math.max(0, daysRemaining)} day(s) to start the warranty period.
                    </div>
                </div>
            `;
            showConfirmButton = true;

        } else if (status === 'delivered') {
            // Warranty period active - buyer can claim warranty
            const warrantyTimeLeft = transaction.warrantyExpiresAt - now;
            const warrantyDaysLeft = Math.ceil(warrantyTimeLeft / (24 * 60 * 60 * 1000));

            if (warrantyDaysLeft > 0) {
                escrowInfoHTML = `
                    <div class="escrow-info-box warning">
                        <i class="fas fa-clock escrow-info-icon" style="color: #f59e0b;"></i>
                        <div class="escrow-info-text">
                            <strong>🛡️ Warranty Active:</strong> ${warrantyDaysLeft} day(s) left to report issues. Seller payout after warranty.
                        </div>
                    </div>
                `;
                showClaimWarrantyButton = true;
            } else {
                escrowInfoHTML = `
                    <div class="escrow-info-box success">
                        <i class="fas fa-check-circle escrow-info-icon" style="color: #10b981;"></i>
                        <div class="escrow-info-text">
                            <strong>⏰ Warranty period expired.</strong> Seller payout will be processed soon.
                        </div>
                    </div>
                `;
            }

        } else if (status === 'warranty_claimed') {
            // Buyer claimed warranty, need to return book within 7 days
            const claimedAt = transaction.warrantyClaimedAt || Date.now();
            const returnDeadline = claimedAt + (7 * 24 * 60 * 60 * 1000); // 7 days
            const now = Date.now();
            const timeLeft = returnDeadline - now;
            const daysLeft = Math.ceil(timeLeft / (24 * 60 * 60 * 1000));

            if (timeLeft > 0) {
                // Still have time to return
                escrowInfoHTML = `
                    <div class="escrow-info-box danger">
                        <i class="fas fa-exclamation-triangle escrow-info-icon" style="color: #ef4444;"></i>
                        <div class="escrow-info-text">
                            <strong>📦 Return Required:</strong> Meet at ${transaction.items?.[0]?.bookDetails?.meetupLocation || 'agreed location'}.<br>
                            <span style="color: #f59e0b; font-weight: 600;">⏰ ${daysLeft} day(s) left to send return</span><br>
                            <small style="color: #94a3b8;">Claim will be auto-dismissed if not returned within 7 days.</small>
                        </div>
                    </div>
                `;
                showConfirmReturnButton = true;
            } else {
                // Time expired - this should trigger auto-dismiss
                escrowInfoHTML = `
                    <div class="escrow-info-box warning">
                        <i class="fas fa-clock escrow-info-icon" style="color: #f59e0b;"></i>
                        <div class="escrow-info-text">
                            <strong>⏰ Return period expired</strong><br>
                            <small style="color: #94a3b8;">Your claim will be automatically dismissed. Order will proceed normally.</small>
                        </div>
                    </div>
                `;
                // Trigger auto-dismiss
                autoDismissExpiredWarrantyClaim(transaction.transactionId || transaction.id);
            }

        } else if (status === 'return_sent') {
            // Waiting for seller to confirm
            escrowInfoHTML = `
                <div class="escrow-info-box warning">
                    <i class="fas fa-hourglass-half escrow-info-icon" style="color: #f59e0b;"></i>
                    <div class="escrow-info-text">
                        <strong>⏳ Waiting for seller</strong> to confirm they received the returned book.
                    </div>
                </div>
            `;

        } else if (status === 'return_received') {
            // Both confirmed, waiting for admin
            escrowInfoHTML = `
                <div class="escrow-info-box warning">
                    <i class="fas fa-gavel escrow-info-icon" style="color: #f59e0b;"></i>
                    <div class="escrow-info-text">
                        <strong>👨‍⚖️ Pending Admin:</strong> Return confirmed by both parties. Refund processing within 24-48h.
                    </div>
                </div>
            `;

        } else if (status === 'dispute_open' || deliveryStatus === 'disputed') {
            // Legacy dispute (before confirm)
            escrowInfoHTML = `
                <div class="escrow-info-box danger">
                    <i class="fas fa-gavel escrow-info-icon" style="color: #ef4444;"></i>
                    <div class="escrow-info-text">
                        <strong>Dispute in progress.</strong> Funds are frozen. Admin will review and decide.
                    </div>
                </div>
            `;

        } else if (status === 'completed') {
            escrowInfoHTML = `
                <div class="escrow-info-box success">
                    <i class="fas fa-check-circle escrow-info-icon" style="color: #10b981;"></i>
                    <div class="escrow-info-text">
                        <strong>✅ Transaction Complete!</strong><br>
                        Seller was paid RM${(transaction.sellerPayoutAmount || 0).toFixed(2)} on ${formatDate(transaction.payoutProcessedAt || transaction.actualDeliveryDate)}.
                    </div>
                </div>
            `;

        } else if (status === 'refunded') {
            escrowInfoHTML = `
                <div class="escrow-info-box">
                    <i class="fas fa-undo escrow-info-icon" style="color: #8b5cf6;"></i>
                    <div class="escrow-info-text">
                        <strong>Refunded.</strong> Money has been returned to your wallet.
                    </div>
                </div>
            `;
        }

        return `
            <div class="cart-item purchase-item" style="flex-direction: column;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%;">
                    <div class="cart-item-details" style="flex: 1;">
                        <h3 style="margin-bottom: 0.5rem; color: var(--text-primary);">
                            Transaction #${transaction.transactionId}
                        </h3>
                        <div class="cart-item-meta" style="display: flex; flex-wrap: wrap; gap: 1rem; margin-bottom: 0.5rem;">
                            <span style="display: flex; align-items: center; gap: 0.5rem;">
                                <i class="fas fa-calendar"></i> <strong>Date:</strong> ${formatDate(transaction.createdAt)}
                            </span>
                            <span style="display: flex; align-items: center; gap: 0.5rem;">
                                <i class="fas fa-book"></i> <strong>Items:</strong> ${transaction.items.length} item(s)
                            </span>
                            <span style="display: flex; align-items: center; gap: 0.5rem;">
                                <i class="fas fa-store"></i> <strong>Seller:</strong> ${transaction.items[0]?.bookDetails?.sellerName || 'Unknown'}
                            </span>
                        </div>
                    </div>
                    <div class="cart-item-actions" style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.5rem; min-width: 150px;">
                        <div>
                            <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 0.25rem;">Total Paid:</div>
                            <div class="cart-item-price" style="font-size: 1.5rem;">${formatCurrency(transaction.amount)}</div>
                        </div>
                        <span class="status-badge status-${status}">${status.replace('_', ' ')}</span>
                    </div>
                </div>
                
                ${timelineHTML}
                ${escrowInfoHTML}
                
                ${(showConfirmButton || showClaimWarrantyButton || showConfirmReturnButton) ? `
                    <div class="purchase-action-buttons">
                        ${showConfirmButton ? `
                            <button type="button" class="btn btn-success" onclick="event.stopPropagation(); event.preventDefault(); window.confirmOrderReceived('${transaction.transactionId}'); return false;">
                                <i class="fas fa-check-circle"></i> Confirm Received
                            </button>
                        ` : ''}
                        ${showClaimWarrantyButton ? `
                            <button type="button" class="btn btn-danger" onclick="event.stopPropagation(); event.preventDefault(); window.claimWarranty('${transaction.transactionId}'); return false;">
                                <i class="fas fa-shield-alt"></i> Claim Warranty
                            </button>
                        ` : ''}
                        ${showConfirmReturnButton ? `
                            <button type="button" class="btn btn-warning" onclick="event.stopPropagation(); event.preventDefault(); window.confirmReturnSent('${transaction.transactionId}'); return false;" style="background: linear-gradient(135deg, #f59e0b, #d97706); border: none; color: white;">
                                <i class="fas fa-undo"></i> Confirm Return Sent
                            </button>
                        ` : ''}
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

// Helper function to get timeline steps - WARRANTY FLOW
function getTimelineSteps(transaction, status, deliveryStatus) {
    // Determine step states based on status
    const isPaymentComplete = true; // Always true if we're showing this
    const isEscrowComplete = ['delivered', 'warranty_claimed', 'return_sent', 'return_received', 'completed', 'refunded'].includes(status);
    const isReceivedComplete = ['delivered', 'warranty_claimed', 'return_sent', 'return_received', 'completed', 'refunded'].includes(status);
    const isWarrantyComplete = ['completed', 'refunded'].includes(status);
    const isPayoutComplete = status === 'completed';
    const isRefunded = status === 'refunded';
    const isWarrantyActive = status === 'delivered';
    const isWarrantyClaimed = ['warranty_claimed', 'return_sent', 'return_received'].includes(status);

    // Format warranty expiry for display
    const getWarrantyTimestamp = () => {
        if (isWarrantyClaimed) {
            return transaction.warrantyClaimedAt ? `⚠️ ${formatDate(transaction.warrantyClaimedAt)}` : '⚠️ Claimed';
        }
        if (isWarrantyActive && transaction.warrantyExpiresAt) {
            const daysLeft = Math.ceil((transaction.warrantyExpiresAt - Date.now()) / (24 * 60 * 60 * 1000));
            return `🛡️ ${daysLeft}d left`;
        }
        if (isWarrantyComplete) {
            return transaction.warrantyExpiresAt ? `✓ ${formatDate(transaction.warrantyExpiresAt)}` : '✓ Passed';
        }
        return '';
    };

    const steps = [
        {
            icon: 'fa-credit-card',
            label: 'Paid',
            tooltip: 'Your payment has been processed and secured.',
            state: 'completed',
            timestamp: formatDate(transaction.createdAt)
        },
        {
            icon: 'fa-lock',
            label: 'Escrow',
            tooltip: 'Money is held safely until you confirm receipt of the book.',
            state: isEscrowComplete ? 'completed' : (status === 'payment_held' ? 'active' : ''),
            timestamp: transaction.escrowHeldAt ? formatDate(transaction.escrowHeldAt) : (isEscrowComplete ? '✓ Held' : '')
        },
        {
            icon: 'fa-box-open',
            label: 'Received',
            tooltip: 'Meet the seller at the campus location to collect your book, then click Confirm Received.',
            state: isReceivedComplete ? 'completed' : '',
            timestamp: transaction.actualDeliveryDate ? formatDate(transaction.actualDeliveryDate) : ''
        },
        {
            icon: 'fa-shield-alt',
            label: 'Warranty',
            tooltip: '7-day protection period. If there is any issue with the book, you can claim warranty.',
            state: isWarrantyComplete ? 'completed' :
                (isWarrantyClaimed ? 'disputed' :
                    (isWarrantyActive ? 'active' : '')),
            timestamp: getWarrantyTimestamp()
        },
        {
            icon: 'fa-wallet',
            label: 'Payout',
            tooltip: 'After warranty expires, seller receives payment automatically (minus 10% commission).',
            state: isPayoutComplete ? 'completed' : (isRefunded ? 'refunded' : ''),
            timestamp: isPayoutComplete ? (transaction.payoutProcessedAt ? formatDate(transaction.payoutProcessedAt) : '💰 Paid') :
                (isRefunded ? (transaction.disputeResolvedAt ? formatDate(transaction.disputeResolvedAt) : '↩ Refunded') : '')
        }
    ];

    return steps;
}

// Helper function to calculate progress percentage - WARRANTY FLOW
function calculateProgressPercent(status, deliveryStatus) {
    const progressMap = {
        'payment_held': 20,
        'delivered': 60,
        'warranty_claimed': 65,
        'return_sent': 70,
        'return_received': 80,
        'completed': 100,
        'refunded': 100,
        'dispute_open': 50
    };
    return progressMap[status] || 20;
}

// Helper function to get timeline steps for SELLER view
function getSellerTimelineSteps(transaction, status) {
    const isPaymentComplete = true;
    const isSoldComplete = true;
    const isDeliveredComplete = ['delivered', 'warranty_claimed', 'return_sent', 'return_received', 'completed', 'refunded'].includes(status);
    const isWarrantyComplete = ['completed', 'refunded'].includes(status);
    const isPayoutComplete = status === 'completed';
    const isRefunded = status === 'refunded';
    const isWarrantyActive = status === 'delivered';
    const isWarrantyClaimed = ['warranty_claimed', 'return_sent', 'return_received'].includes(status);

    // Format warranty/payout info
    const getWarrantyTimestamp = () => {
        if (isWarrantyClaimed) {
            return transaction.warrantyClaimedAt ? `⚠️ ${formatDate(transaction.warrantyClaimedAt)}` : '⚠️ Claimed';
        }
        if (isWarrantyActive && transaction.payoutScheduledAt) {
            const daysLeft = Math.ceil((transaction.payoutScheduledAt - Date.now()) / (24 * 60 * 60 * 1000));
            return daysLeft > 0 ? `⏳ ${daysLeft}d to payout` : '💰 Ready';
        }
        if (isWarrantyComplete) {
            return '✓ Passed';
        }
        return '';
    };

    const steps = [
        {
            icon: 'fa-tag',
            label: 'Listed',
            state: 'completed',
            timestamp: transaction.items?.[0]?.bookDetails?.createdAt ? formatDate(transaction.items[0].bookDetails.createdAt) : '✓'
        },
        {
            icon: 'fa-shopping-cart',
            label: 'Sold',
            state: 'completed',
            timestamp: formatDate(transaction.createdAt)
        },
        {
            icon: 'fa-handshake',
            label: 'Delivered',
            state: isDeliveredComplete ? 'completed' : (status === 'payment_held' ? 'active' : ''),
            timestamp: transaction.actualDeliveryDate ? formatDate(transaction.actualDeliveryDate) : (status === 'payment_held' ? '⏳ Pending' : '')
        },
        {
            icon: 'fa-shield-alt',
            label: 'Warranty',
            state: isWarrantyComplete ? 'completed' :
                (isWarrantyClaimed ? 'disputed' :
                    (isWarrantyActive ? 'active' : '')),
            timestamp: getWarrantyTimestamp()
        },
        {
            icon: 'fa-wallet',
            label: 'Paid Out',
            state: isPayoutComplete ? 'completed' : (isRefunded ? 'refunded' : ''),
            timestamp: isPayoutComplete ? (transaction.payoutProcessedAt ? `💰 ${formatDate(transaction.payoutProcessedAt)}` : '💰 Paid') :
                (isRefunded ? '↩ No payout' : '')
        }
    ];

    return steps;
}


// Report Issue - Show modal
function unreceiveOrder(transactionId) {
    console.log('[DEBUG] unreceiveOrder called with transactionId:', transactionId);

    // Set the transaction ID in the hidden field
    document.getElementById('reportTransactionId').value = transactionId;

    // Reset form
    document.getElementById('reportIssueForm').reset();

    // Show modal
    document.getElementById('reportIssueModal').style.display = 'flex';
}

// Close the report issue modal
function closeReportIssueModal() {
    document.getElementById('reportIssueModal').style.display = 'none';
    document.getElementById('reportIssueForm').reset();
}

// Setup Report Issue Form Handler
function setupReportIssueForm() {
    const form = document.getElementById('reportIssueForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const transactionId = document.getElementById('reportTransactionId').value;
        const issueType = form.querySelector('input[name="issueType"]:checked')?.value;
        const description = document.getElementById('issueDescription').value.trim();

        if (!issueType) {
            showNotification("Please select an issue type", "error");
            return;
        }

        if (description.length < 10) {
            showNotification("Please provide a more detailed description (min 10 characters)", "error");
            return;
        }

        // Build the full reason
        const issueLabels = {
            'wrong_item': 'Wrong item received',
            'damaged': 'Item damaged',
            'not_received': 'Item not received',
            'other': 'Other issue'
        };
        const reason = `[${issueLabels[issueType]}] ${description}`;

        // Close modal and process
        closeReportIssueModal();
        await processUnreceiveOrder(transactionId, reason, issueType);
    });

    // Close modal on outside click
    const modal = document.getElementById('reportIssueModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeReportIssueModal();
            }
        });
    }
}

// Make functions globally accessible
window.closeReportIssueModal = closeReportIssueModal;

// Process the unreceive order (called after modal form submission)
async function processUnreceiveOrder(transactionId, reason, issueType) {

    try {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) loadingOverlay.style.display = 'flex';

        // 1. Update transaction status to WARRANTY CLAIMED - FREEZE escrow
        await database.ref(`transactions/${transactionId}`).update({
            status: 'warranty_claimed',  // WARRANTY: Warranty issue reported
            deliveryStatus: 'disputed',
            disputeReason: reason,
            warrantyClaimedAt: Date.now(),
            warrantyIssueType: issueType,
            payoutScheduledAt: null  // CANCEL scheduled auto-payout
        });

        // ESCROW: Move funds from pendingEscrow to frozenDispute
        const txnSnapshot = await database.ref(`transactions/${transactionId}`).once('value');
        const txn = txnSnapshot.val();

        if (txn && txn.items) {
            for (const item of txn.items) {
                try {
                    const sellerWalletRef = database.ref(`users/${item.bookDetails.sellerId}/wallet`);
                    const walletSnapshot = await sellerWalletRef.once('value');
                    const wallet = walletSnapshot.val() || {};

                    await sellerWalletRef.update({
                        pendingEscrow: Math.max(0, (wallet.pendingEscrow || 0) - item.bookDetails.price),
                        frozenDispute: (wallet.frozenDispute || 0) + item.bookDetails.price
                    });
                    console.log(`[ESCROW] Froze RM${item.bookDetails.price} for dispute`);
                } catch (error) {
                    console.warn(`[ESCROW] Failed to freeze funds:`, error);
                }
            }
        }

        // 2. IMMEDIATELY notify admin about the unreceive (don't wait for feedback modal)
        if (typeof sendAdminNotification === 'function') {
            await sendAdminNotification(
                'admin_dispute',
                `🚨 Book Unreceived: ${userData.fullName} reported issue with received book`,
                {
                    transactionId: transactionId,
                    buyerId: currentUser.uid,
                    buyerName: userData.fullName,
                    reason: reason
                },
                'critical'  // Critical priority - book was received but has issues!
            );
            console.log('[UNRECEIVE] Admin notified about book unreceive');
        }

        // 3. Notify SELLER about warranty claim
        if (txn && txn.items) {
            for (const item of txn.items) {
                const notificationData = {
                    recipientId: item.bookDetails.sellerId,
                    senderId: currentUser.uid,
                    senderName: userData.fullName,
                    type: 'warranty_claimed',
                    message: `⚠️ ${userData.fullName} claimed warranty on "${item.bookDetails.title}". Reason: ${issueType}`,
                    transactionId: transactionId,
                    read: false,
                    createdAt: Date.now()
                };
                await database.ref('notifications').push(notificationData);
                console.log('[WARRANTY] Seller notified about warranty claim');
            }
        }

        showNotification("Order marked as unreceived. Admin has been notified. Please complete the feedback form.", "info");

        // Reload purchase history
        await loadPurchaseHistory();

        // Show feedback modal with dispute type and prefilled comment
        if (typeof showFeedbackModal === 'function') {
            await showFeedbackModal(transactionId, 'dispute', `[Book Unreceive] ${reason}`);
        }

    } catch (error) {
        console.error("Error unreceiving order:", error);
        showNotification("Failed to process request", "error");
    } finally {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) loadingOverlay.style.display = 'none';
    }
}

// Auto-dismiss expired warranty claims (7 days without return)
async function autoDismissExpiredWarrantyClaim(transactionId) {
    console.log('[AUTO-DISMISS] Checking warranty claim:', transactionId);

    try {
        // Get transaction data
        const txnSnapshot = await database.ref(`transactions/${transactionId}`).once('value');
        const txn = txnSnapshot.val();

        if (!txn) {
            console.log('[AUTO-DISMISS] Transaction not found');
            return;
        }

        // Double-check it's still warranty_claimed and expired
        if (txn.status !== 'warranty_claimed') {
            console.log('[AUTO-DISMISS] Status is no longer warranty_claimed, skipping');
            return;
        }

        const claimedAt = txn.warrantyClaimedAt || 0;
        const returnDeadline = claimedAt + (7 * 24 * 60 * 60 * 1000); // 7 days

        if (Date.now() < returnDeadline) {
            console.log('[AUTO-DISMISS] Still within return period, skipping');
            return;
        }

        console.log('[AUTO-DISMISS] Return period expired, dismissing claim');

        // Calculate new payout date (7 days from now, since order reverts to warranty period)
        const newPayoutDate = Date.now() + (7 * 24 * 60 * 60 * 1000);

        // Revert to delivered status (warranty period continues from now)
        await database.ref(`transactions/${transactionId}`).update({
            status: 'delivered',
            warrantyClaimDismissed: true,
            autoDismissedAt: Date.now(),
            autoDismissReason: 'Return deadline expired (7 days)',
            previousStatus: 'warranty_claimed',
            disputeReason: null,
            warrantyIssueType: null,
            payoutScheduledAt: newPayoutDate // New 7-day warranty from now
        });

        // Move funds from frozenDispute back to pendingEscrow
        const sellerId = txn.items?.[0]?.bookDetails?.sellerId;
        const amount = txn.amount || txn.basePrice || 0;

        if (sellerId && amount > 0) {
            try {
                const sellerSnapshot = await database.ref(`users/${sellerId}/wallet`).once('value');
                const sellerWallet = sellerSnapshot.val() || {};

                await database.ref(`users/${sellerId}/wallet`).update({
                    pendingEscrow: (sellerWallet.pendingEscrow || 0) + amount,
                    frozenDispute: Math.max(0, (sellerWallet.frozenDispute || 0) - amount)
                });
                console.log('[AUTO-DISMISS] Moved funds back to pendingEscrow');
            } catch (walletError) {
                console.warn('[AUTO-DISMISS] Failed to update wallet:', walletError);
            }
        }

        // Notify buyer
        await database.ref('notifications').push({
            recipientId: txn.buyerId,
            senderId: 'system',
            senderName: 'System',
            type: 'claim_auto_dismissed',
            message: `Your warranty claim for order #${transactionId.substring(0, 8)} was auto-dismissed. You did not send the return within 7 days.`,
            transactionId: transactionId,
            read: false,
            createdAt: Date.now()
        });

        // Notify seller
        if (sellerId) {
            await database.ref('notifications').push({
                recipientId: sellerId,
                senderId: 'system',
                senderName: 'System',
                type: 'claim_auto_dismissed',
                message: `The warranty claim on order #${transactionId.substring(0, 8)} was auto-dismissed. Buyer did not return within 7 days. Your payout will proceed normally.`,
                transactionId: transactionId,
                read: false,
                createdAt: Date.now()
            });
        }

        console.log('[AUTO-DISMISS] Warranty claim auto-dismissed successfully');
        showNotification('Your warranty claim was auto-dismissed due to no return within 7 days.', 'warning');

        // Reload purchase history to update the UI
        await loadPurchaseHistory();

    } catch (error) {
        console.error('[AUTO-DISMISS] Error auto-dismissing claim:', error);
    }
}

async function loadSalesHistory() {
    try {
        const snapshot = await database.ref('transactions').once('value');
        salesHistory = [];

        snapshot.forEach(childSnapshot => {
            const transaction = childSnapshot.val();
            // Check if current user is the seller of any item
            const hasItem = transaction.items && transaction.items.some(item => item.bookDetails.sellerId === currentUser.uid);
            if (hasItem) {
                transaction.id = childSnapshot.key;
                salesHistory.push(transaction);
            }
        });

        // Sort by date (newest first)
        salesHistory.sort((a, b) => b.createdAt - a.createdAt);

        displaySalesHistory();
        updateStats(); // Update stats after loading
    } catch (error) {
        console.error("Error loading sales history:", error);
    }
}

function displaySalesHistory() {
    const salesContainer = document.getElementById('salesHistory');
    const now = Date.now();

    if (salesHistory.length === 0) {
        salesContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-chart-line"></i>
                <h3>No sales yet</h3>
                <p>List your books to start selling!</p>
            </div>
        `;
        return;
    }

    salesContainer.innerHTML = salesHistory.map(transaction => {
        const status = transaction.status || 'pending';
        let statusInfo = '';
        let statusBadge = '';
        let actionButton = '';

        // Generate SELLER timeline
        const steps = getSellerTimelineSteps(transaction, status);
        const progressPercent = calculateProgressPercent(status, '');

        const timelineHTML = `
            <div class="transaction-timeline" style="margin-top: 1rem;">
                <div class="timeline-progress">
                    <div class="timeline-progress-bar" style="width: ${progressPercent}%"></div>
                </div>
                ${steps.map(step => `
                    <div class="timeline-step ${step.state}">
                        <div class="timeline-icon">
                            <i class="fas ${step.icon}"></i>
                        </div>
                        <div class="timeline-label">${step.label}</div>
                        ${step.timestamp ? `<div class="timeline-timestamp">${step.timestamp}</div>` : ''}
                    </div>
                `).join('')}
            </div>
        `;

        // WARRANTY FLOW STATUS INFO FOR SELLER
        if (status === 'payment_held') {
            statusBadge = `<span class="status-badge" style="background: #f59e0b; color: white;">⏳ Awaiting Confirmation</span>`;
            statusInfo = `<div class="escrow-info-box warning" style="margin-top: 0.75rem;">
                <i class="fas fa-clock" style="color: #f59e0b;"></i>
                <div class="escrow-info-text">Waiting for buyer to confirm received order.</div>
            </div>`;

        } else if (status === 'delivered') {
            // Warranty period - seller waits for payout
            const payoutTime = transaction.payoutScheduledAt - now;
            const payoutDays = Math.ceil(payoutTime / (24 * 60 * 60 * 1000));

            if (payoutDays > 0) {
                statusBadge = `<span class="status-badge" style="background: #f59e0b; color: white;">🛡️ Warranty Period</span>`;
                statusInfo = `<div class="escrow-info-box warning" style="margin-top: 0.75rem;">
                    <i class="fas fa-clock" style="color: #f59e0b;"></i>
                    <div class="escrow-info-text"><strong>Payout in ${payoutDays} day(s)</strong><br>Funds held until warranty period expires.</div>
                </div>`;
            } else {
                statusBadge = `<span class="status-badge" style="background: #10b981; color: white;">💰 Payout Processing</span>`;
                statusInfo = `<div class="escrow-info-box success" style="margin-top: 0.75rem;">
                    <i class="fas fa-check-circle" style="color: #10b981;"></i>
                    <div class="escrow-info-text">Warranty expired. Payout will be processed soon.</div>
                </div>`;
            }

        } else if (status === 'warranty_claimed') {
            statusBadge = `<span class="status-badge" style="background: #ef4444; color: white;">⚠️ Warranty Claimed</span>`;
            statusInfo = `<div class="escrow-info-box danger" style="margin-top: 0.75rem;">
                <i class="fas fa-exclamation-triangle" style="color: #ef4444;"></i>
                <div class="escrow-info-text"><strong>Buyer claimed warranty issue</strong><br>Reason: ${transaction.disputeReason || 'Not specified'}<br>Please coordinate with buyer to receive the returned book.</div>
            </div>`;

        } else if (status === 'return_sent') {
            statusBadge = `<span class="status-badge" style="background: #f59e0b; color: white;">📦 Return In Progress</span>`;
            statusInfo = `<div class="escrow-info-box warning" style="margin-top: 0.75rem;">
                <i class="fas fa-box" style="color: #f59e0b;"></i>
                <div class="escrow-info-text"><strong>Buyer has sent the book back</strong><br>Please confirm after you receive the returned book.</div>
            </div>`;
            actionButton = `<button type="button" class="btn btn-success" onclick="event.stopPropagation(); window.confirmReturnReceived('${transaction.transactionId}');" style="margin-top: 0.75rem;">
                <i class="fas fa-check"></i> Confirm Return Received
            </button>`;

        } else if (status === 'return_received') {
            statusBadge = `<span class="status-badge" style="background: #f59e0b; color: white;">👨‍⚖️ Pending Admin</span>`;
            statusInfo = `<div class="escrow-info-box warning" style="margin-top: 0.75rem;">
                <i class="fas fa-gavel" style="color: #f59e0b;"></i>
                <div class="escrow-info-text">Book return confirmed. Waiting for admin to process refund.</div>
            </div>`;

        } else if (status === 'completed') {
            statusBadge = `<span class="status-badge" style="background: #10b981; color: white;">✅ Paid Out</span>`;
            statusInfo = `<div class="escrow-info-box success" style="margin-top: 0.75rem;">
                <i class="fas fa-check-circle" style="color: #10b981;"></i>
                <div class="escrow-info-text"><strong>Payment received!</strong> RM${(transaction.sellerPayoutAmount || 0).toFixed(2)} (after 10% commission)</div>
            </div>`;

        } else if (status === 'refunded') {
            statusBadge = `<span class="status-badge" style="background: #8b5cf6; color: white;">↩️ Refunded</span>`;
            statusInfo = `<div class="escrow-info-box" style="margin-top: 0.75rem; background: #f3e8ff; border-color: #c4b5fd;">
                <i class="fas fa-undo" style="color: #8b5cf6;"></i>
                <div class="escrow-info-text">Transaction was refunded to buyer. No payout.</div>
            </div>`;
        }

        return `
            <div class="cart-item sales-item" style="flex-direction: column;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%;">
                    <div class="cart-item-details" style="flex: 1;">
                        <h3 style="margin-bottom: 1rem; color: var(--text-primary);">Transaction #${transaction.transactionId}</h3>
                        <div class="cart-item-meta" style="display: flex; flex-wrap: wrap; gap: 1rem; margin-bottom: 0.75rem;">
                            <span style="display: flex; align-items: center; gap: 0.5rem;">
                                <i class="fas fa-calendar"></i> <strong>Date:</strong> ${formatDate(transaction.createdAt)}
                            </span>
                            <span style="display: flex; align-items: center; gap: 0.5rem;">
                                <i class="fas fa-user"></i> <strong>Buyer:</strong> ${transaction.buyerName}
                            </span>
                        </div>
                    </div>
                    <div class="cart-item-actions" style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.75rem; min-width: 200px;">
                        <div>
                            <div style="font-size: 0.875rem; color: var(--text-tertiary); margin-bottom: 0.25rem;">Sale Amount:</div>
                            <div class="cart-item-price" style="font-size: 1.75rem;">${formatCurrency(transaction.basePrice)}</div>
                        </div>
                        ${statusBadge}
                    </div>
                </div>
                ${timelineHTML}
                ${statusInfo}
                ${actionButton}
            </div>
        `;
    }).join('');
}

async function loadNegotiations() {
    try {
        const container = document.getElementById('negotiationsList');
        const snapshot = await database.ref('offers').once('value');
        const negotiations = [];

        // Extract student ID from email (e.g. 2023123456@student.uitm.edu.my -> 2023123456)
        const studentId = userData.email ? userData.email.split('@')[0] : '';

        snapshot.forEach(child => {
            const offer = child.val();

            // Check against both UID and Student ID (for legacy/seed data compatibility)
            const isBuyer = offer.buyerId === currentUser.uid || (studentId && offer.buyerId === studentId);
            const isSeller = offer.sellerId === currentUser.uid || (studentId && offer.sellerId === studentId);

            if (isBuyer || isSeller) {
                negotiations.push({ id: child.key, ...offer });
            }
        });

        negotiations.sort((a, b) => b.updatedAt - a.updatedAt);

        if (negotiations.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-handshake"></i>
                    <h3>No offers yet</h3>
                    <p>Offers from buyers will appear here.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = negotiations.map(offer => {
            const isBuyer = offer.buyerId === currentUser.uid;
            const isSeller = offer.sellerId === currentUser.uid;
            const otherParty = isBuyer ? offer.sellerName : offer.buyerName;
            const role = isBuyer ? 'Seller' : 'Buyer';

            const isMyTurn = offer.lastActionBy !== currentUser.uid;
            const isActive = offer.status === 'pending' || offer.status === 'counter_offered';

            // Show action buttons if it's my turn and offer is active
            if (isActive && isMyTurn) {
                return `
                    <div class="cart-item negotiation-item">
                        <div class="cart-item-details" style="flex: 1;">
                            <h3 style="margin-bottom: 1rem; color: var(--text-primary);">${offer.bookTitle}</h3>
                            <div class="cart-item-meta" style="display: flex; flex-wrap: wrap; gap: 1rem; margin-bottom: 1rem;">
                                <span style="display: flex; align-items: center; gap: 0.5rem;">
                                    <i class="fas fa-user"></i> ${role}: <strong>${otherParty}</strong>
                                </span>
                                <span style="display: flex; align-items: center; gap: 0.5rem;">
                                    <i class="fas fa-clock"></i> ${formatDate(offer.updatedAt)}
                                </span>
                                <span style="display: flex; align-items: center; gap: 0.5rem;">
                                    <i class="fas fa-tag"></i> Original Price: ${formatCurrency(offer.bookPrice)}
                                </span>
                            </div>
                            <div style="margin-top: 0.75rem; padding: 0.5rem 1rem; background: #fff3cd; border-left: 3px solid #ffc107; border-radius: 4px;">
                                <small style="color: #856404; font-weight: 600;">
                                    <i class="fas fa-exclamation-circle"></i> Action Required - Respond to this offer
                                </small>
                            </div>
                        </div>
                        <div class="cart-item-actions" style="display: flex; flex-direction: column; align-items: flex-end; gap: 1rem; min-width: 200px;">
                            <div>
                                <div style="font-size: 0.875rem; color: var(--text-tertiary); margin-bottom: 0.25rem;">Offered Price:</div>
                                <div class="cart-item-price" style="font-size: 1.75rem;">${formatCurrency(offer.currentPrice)}</div>
                            </div>
                            <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: flex-end;">
                                <a href="chat.html?offerId=${offer.id}" class="btn btn-primary btn-sm">
                                    <i class="fas fa-comments"></i> Chat
                                </a>
                                <button class="btn btn-success btn-sm" onclick="acceptOffer('${offer.id}', '${offer.buyerId}', '${offer.bookTitle}', ${offer.currentPrice})">
                                    <i class="fas fa-check"></i> Accept
                                </button>
                                <button class="btn btn-danger btn-sm" onclick="rejectOffer('${offer.id}', '${offer.buyerId}', '${offer.bookTitle}')">
                                    <i class="fas fa-times"></i> Reject
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }

            // Regular view (Waiting for other party or Completed)
            let statusBadge = '';
            if (isActive && !isMyTurn) {
                statusBadge = `<span class="status-badge status-pending">Waiting for ${otherParty}</span>`;
            } else {
                statusBadge = `<span class="status-badge status-${offer.status.split('_')[0]}">${offer.status.replace('_', ' ')}</span>`;
            }

            return `
                <div class="cart-item negotiation-item">
                    <div class="cart-item-details" style="flex: 1;">
                        <h3 style="margin-bottom: 1rem; color: var(--text-primary);">${offer.bookTitle}</h3>
                        <div class="cart-item-meta" style="display: flex; flex-wrap: wrap; gap: 1rem; margin-bottom: 0.5rem;">
                            <span style="display: flex; align-items: center; gap: 0.5rem;">
                                <i class="fas fa-user"></i> ${role}: <strong>${otherParty}</strong>
                            </span>
                            <span style="display: flex; align-items: center; gap: 0.5rem;">
                                <i class="fas fa-clock"></i> ${formatDate(offer.updatedAt)}
                            </span>
                            <span style="display: flex; align-items: center; gap: 0.5rem;">
                                <i class="fas fa-tag"></i> Original Price: ${formatCurrency(offer.bookPrice)}
                            </span>
                        </div>
                    </div>
                    <div class="cart-item-actions" style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.75rem; min-width: 200px;">
                        <div>
                            <div style="font-size: 0.875rem; color: var(--text-tertiary); margin-bottom: 0.25rem;">Offered Price:</div>
                            <div class="cart-item-price" style="font-size: 1.75rem;">${formatCurrency(offer.currentPrice)}</div>
                        </div>
                        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; justify-content: flex-end;">
                            ${statusBadge}
                            <a href="chat.html?offerId=${offer.id}" class="btn btn-primary btn-sm">
                                <i class="fas fa-comments"></i> Chat
                            </a>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error("Error loading negotiations:", error);
    }
}

// Accept offer function
async function acceptOffer(offerId, buyerId, bookTitle, offerPrice) {
    if (!confirm(`Accept offer of ${formatCurrency(offerPrice)} for "${bookTitle}"?`)) return;

    try {
        // Update offer status
        await database.ref(`offers/${offerId}`).update({
            status: 'accepted',
            lastActionBy: currentUser.uid,
            updatedAt: Date.now()
        });

        // Send notification to buyer
        const notificationData = {
            recipientId: buyerId,
            senderId: currentUser.uid,
            senderName: userData.fullName,
            type: 'offer_accepted',
            message: `${userData.fullName} accepted your offer of ${formatCurrency(offerPrice)} for "${bookTitle}"`,
            offerId: offerId,
            read: false,
            createdAt: Date.now()
        };
        await database.ref('notifications').push(notificationData);

        showNotification("Offer accepted! Buyer has been notified.", "success");
        loadNegotiations(); // Refresh the list
    } catch (error) {
        console.error("Error accepting offer:", error);
        showNotification("Failed to accept offer", "error");
    }
}

// Reject offer function
async function rejectOffer(offerId, buyerId, bookTitle) {
    if (!confirm(`Reject offer for "${bookTitle}"?`)) return;

    try {
        // Update offer status
        await database.ref(`offers/${offerId}`).update({
            status: 'rejected',
            lastActionBy: currentUser.uid,
            updatedAt: Date.now()
        });

        // Send notification to buyer
        const notificationData = {
            recipientId: buyerId,
            senderId: currentUser.uid,
            senderName: userData.fullName,
            type: 'offer_rejected',
            message: `${userData.fullName} rejected your offer for "${bookTitle}"`,
            offerId: offerId,
            read: false,
            createdAt: Date.now()
        };
        await database.ref('notifications').push(notificationData);

        showNotification("Offer rejected. Buyer has been notified.", "success");
        loadNegotiations(); // Refresh the list
    } catch (error) {
        console.error("Error rejecting offer:", error);
        showNotification("Failed to reject offer", "error");
    }
}

function setupProfileEdit() {
    const editForm = document.getElementById('editProfileForm');
    const modal = document.getElementById('editProfileModal');

    if (editForm) {
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const loadingOverlay = document.getElementById('loadingOverlay');
            // Use a local loading state on the button instead if possible, but overlay is fine
            if (loadingOverlay) loadingOverlay.style.display = 'flex';

            try {
                const fullName = document.getElementById('editFullName').value;
                const phoneNumber = document.getElementById('editPhoneNumber').value;

                await updateUserProfile(currentUser.uid, {
                    fullName,
                    phoneNumber
                });

                showNotification("Profile updated successfully!", "success");
                loadProfile();

                // Close modal
                if (modal) modal.classList.remove('show');

            } catch (error) {
                console.error("Error updating profile:", error);
                showNotification(error.message, "error");
            } finally {
                if (loadingOverlay) loadingOverlay.style.display = 'none';
            }
        });
    }
}

function setupAvatarUpload() {
    const changeAvatarBtn = document.getElementById('changeAvatarBtn');
    const avatarInput = document.getElementById('avatarInput');

    if (changeAvatarBtn && avatarInput) {
        changeAvatarBtn.addEventListener('click', () => {
            avatarInput.click();
        });

        avatarInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                showNotification("Image size must be less than 5MB", "error");
                return;
            }

            const loadingOverlay = document.getElementById('loadingOverlay');
            loadingOverlay.style.display = 'flex';

            try {
                const imageUrl = await uploadImageToImgBB(file);
                await updateUserProfile(currentUser.uid, {
                    profilePic: imageUrl
                });

                document.getElementById('profileImage').src = imageUrl;
                showNotification("Profile picture updated!", "success");
            } catch (error) {
                console.error("Error uploading avatar:", error);
                showNotification("Error uploading image", "error");
            } finally {
                loadingOverlay.style.display = 'none';
            }
        });
    }
}

function setupTabs() {
    const tabLinks = document.querySelectorAll('.tab-link');
    const tabPanels = document.querySelectorAll('.tab-panel');

    tabLinks.forEach(link => {
        link.addEventListener('click', () => {
            const tabName = link.dataset.tab;

            // Remove active class from all tabs
            tabLinks.forEach(l => l.classList.remove('active'));
            tabPanels.forEach(p => p.classList.remove('active'));

            // Add active class to clicked tab
            link.classList.add('active');
            document.getElementById(`${tabName}Tab`).classList.add('active');
        });
    });
}

function setupModal() {
    const modal = document.getElementById('editProfileModal');
    const openBtn = document.getElementById('openEditProfileBtn');
    const closeBtn = document.querySelector('.close-modal');
    const cancelBtn = document.querySelector('.close-modal-btn');

    if (openBtn && modal) {
        openBtn.addEventListener('click', () => {
            modal.classList.add('show');
            // Populate form with current values again to be sure
            document.getElementById('editFullName').value = userData.fullName;
            document.getElementById('editPhoneNumber').value = userData.phoneNumber || '';
        });
    }

    function closeModal() {
        modal.classList.remove('show');
    }

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

    // Close on click outside
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
}

// Check for auto-disputes on pending orders
async function checkForAutoDisputes() {
    try {
        const snapshot = await database.ref('transactions').once('value');
        const now = Date.now();
        const updates = {};
        let disputeCount = 0;
        const disputedTransactions = []; // Track transactions that need admin notification

        snapshot.forEach(childSnapshot => {
            const transaction = childSnapshot.val();
            const transactionId = childSnapshot.key;

            // Check if order is pending and past expected delivery date
            if (transaction.deliveryStatus === 'pending' && transaction.expectedDeliveryDate) {
                if (now > transaction.expectedDeliveryDate) {
                    // Mark as disputed
                    updates[`transactions/${transactionId}/deliveryStatus`] = 'disputed';
                    updates[`transactions/${transactionId}/disputeCreatedAt`] = now;
                    updates[`transactions/${transactionId}/disputeReason`] = 'Buyer did not confirm receipt within 7 days';
                    disputeCount++;

                    // Store transaction info for admin notification
                    disputedTransactions.push({
                        transactionId: transactionId,
                        buyerId: transaction.buyerId,
                        buyerName: transaction.buyerName,
                        amount: transaction.amount
                    });
                }
            }
        });

        // Apply all updates at once
        if (Object.keys(updates).length > 0) {
            // Send admin notifications FIRST (before database update)
            if (disputedTransactions.length > 0 && typeof sendAdminNotification === 'function') {
                for (const dispute of disputedTransactions) {
                    await sendAdminNotification(
                        'admin_dispute',
                        `🚨 Auto-Dispute: Order #${dispute.transactionId.substring(0, 8)} expired - buyer didn't confirm delivery`,
                        {
                            transactionId: dispute.transactionId,
                            buyerId: dispute.buyerId,
                            buyerName: dispute.buyerName,
                            amount: dispute.amount,
                            reason: 'Buyer did not confirm receipt within 7 days'
                        },
                        'high'
                    );
                }
                console.log(`[AUTO-DISPUTE] Notified admin about ${disputedTransactions.length} expired order(s)`);
            }

            // Now update the database
            await database.ref().update(updates);
            if (disputeCount > 0) {
                console.log(`Marked ${disputeCount} order(s) as disputed and notified admins`);
            }
        }
    } catch (error) {
        console.error("Error checking for auto-disputes:", error);
    }
}

// Confirm order received by buyer - STARTS WARRANTY PERIOD (seller not paid yet!)
async function confirmOrderReceived(transactionId) {
    console.log('[WARRANTY] confirmOrderReceived called with transactionId:', transactionId);

    try {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) loadingOverlay.style.display = 'flex';

        // Get transaction details
        const txnSnapshot = await database.ref(`transactions/${transactionId}`).once('value');
        const txn = txnSnapshot.val();

        if (!txn) throw new Error('Transaction not found');

        const now = Date.now();
        const warrantyExpiresAt = now + WARRANTY_PERIOD_MS;

        // Update transaction status to DELIVERED (NOT completed!)
        // Seller payment is HELD until warranty expires
        await database.ref(`transactions/${transactionId}`).update({
            status: 'delivered',                    // Warranty period starts
            deliveryStatus: 'received',
            actualDeliveryDate: now,
            deliveryConfirmedBy: currentUser.uid,
            warrantyExpiresAt: warrantyExpiresAt,   // 7 days from now
            sellerPaidOut: false,                   // NOT paid yet!
            payoutScheduledAt: warrantyExpiresAt    // Scheduled payout date
        });

        console.log(`[WARRANTY] Status set to 'delivered'. Warranty expires at: ${new Date(warrantyExpiresAt).toLocaleString()}`);
        console.log(`[WARRANTY] Seller payout scheduled for after warranty period (7 days)`);

        showNotification("Order confirmed! You have 7 days to claim warranty if there are any issues with the book.", "success");
        await loadPurchaseHistory();

        // Show feedback modal
        if (typeof showFeedbackModal === 'function') {
            await showFeedbackModal(transactionId, 'general', '');
        }

    } catch (error) {
        console.error("Error confirming order:", error);
        showNotification("Failed to confirm order", "error");
    } finally {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) loadingOverlay.style.display = 'none';
    }
}

// Claim warranty - buyer reports issue within 7 days of receiving book
async function claimWarranty(transactionId) {
    console.log('[WARRANTY] claimWarranty called with transactionId:', transactionId);

    try {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) loadingOverlay.style.display = 'flex';

        // Get transaction details
        const txnSnapshot = await database.ref(`transactions/${transactionId}`).once('value');
        const txn = txnSnapshot.val();

        if (!txn) throw new Error('Transaction not found');
        if (txn.status !== 'delivered') throw new Error('Cannot claim warranty - order not in delivered status');

        const now = Date.now();
        if (now > txn.warrantyExpiresAt) {
            throw new Error('Warranty period has expired');
        }

        // Show the warranty claim modal
        document.getElementById('reportTransactionId').value = transactionId;
        document.getElementById('reportIssueForm').reset();
        document.getElementById('reportIssueModal').style.display = 'flex';

    } catch (error) {
        console.error("Error claiming warranty:", error);
        showNotification(error.message || "Failed to claim warranty", "error");
    } finally {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) loadingOverlay.style.display = 'none';
    }
}

// Confirm return sent - buyer confirms they've returned the book
async function confirmReturnSent(transactionId) {
    console.log('[WARRANTY] confirmReturnSent called with transactionId:', transactionId);

    try {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) loadingOverlay.style.display = 'flex';

        // Get transaction first for seller info
        const txnSnapshot = await database.ref(`transactions/${transactionId}`).once('value');
        const txn = txnSnapshot.val();

        await database.ref(`transactions/${transactionId}`).update({
            status: 'return_sent',
            returnSentAt: Date.now(),
            returnSentBy: currentUser.uid
        });

        // Notify seller that buyer is returning the book
        if (txn && txn.items) {
            for (const item of txn.items) {
                const notificationData = {
                    recipientId: item.bookDetails.sellerId,
                    senderId: currentUser.uid,
                    senderName: userData.fullName,
                    type: 'return_sent',
                    message: `📦 ${userData.fullName} has sent back "${item.bookDetails.title}". Please confirm when you receive it.`,
                    transactionId: transactionId,
                    read: false,
                    createdAt: Date.now()
                };
                await database.ref('notifications').push(notificationData);
                console.log('[WARRANTY] Seller notified about return sent');
            }
        }

        console.log('[WARRANTY] Status updated to return_sent');
        showNotification("Return confirmed! Please meet the seller at the agreed location to handover the book.", "success");
        await loadPurchaseHistory();

    } catch (error) {
        console.error("Error confirming return:", error);
        showNotification("Failed to confirm return", "error");
    } finally {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) loadingOverlay.style.display = 'none';
    }
}

// Check for auto-payout - pay sellers after warranty expires
async function checkForAutoPayout() {
    try {
        const snapshot = await database.ref('transactions').once('value');
        const now = Date.now();
        let payoutCount = 0;

        snapshot.forEach(childSnapshot => {
            const transaction = childSnapshot.val();
            const transactionId = childSnapshot.key;

            // Check if warranty expired and seller hasn't been paid
            if (transaction.status === 'delivered' &&
                transaction.warrantyExpiresAt &&
                now > transaction.warrantyExpiresAt &&
                !transaction.sellerPaidOut) {

                // Process payout
                processSellerPayout(transactionId, transaction);
                payoutCount++;
            }
        });

        if (payoutCount > 0) {
            console.log(`[AUTO-PAYOUT] Processed ${payoutCount} seller payout(s)`);
        }
    } catch (error) {
        console.error("[AUTO-PAYOUT] Error:", error);
    }
}

// Process seller payout
async function processSellerPayout(transactionId, txn) {
    try {
        const basePrice = txn.items.reduce((sum, item) => sum + item.bookDetails.price, 0);
        const commission = basePrice * COMMISSION_RATE;
        const sellerPayout = basePrice - commission;

        // Update transaction status
        await database.ref(`transactions/${transactionId}`).update({
            status: 'completed',
            sellerPaidOut: true,
            sellerPayoutAmount: sellerPayout,
            commissionCollected: commission,
            payoutProcessedAt: Date.now()
        });

        // Release funds to seller
        for (const item of txn.items) {
            try {
                const sellerWalletRef = database.ref(`users/${item.bookDetails.sellerId}/wallet`);
                const walletSnapshot = await sellerWalletRef.once('value');
                const wallet = walletSnapshot.val() || {};

                const itemCommission = item.bookDetails.price * COMMISSION_RATE;
                const itemPayout = item.bookDetails.price - itemCommission;

                await sellerWalletRef.update({
                    pendingEscrow: Math.max(0, (wallet.pendingEscrow || 0) - item.bookDetails.price),
                    balance: (wallet.balance || 0) + itemPayout,
                    totalEarned: (wallet.totalEarned || 0) + itemPayout
                });
                console.log(`[AUTO-PAYOUT] Released RM${itemPayout.toFixed(2)} to seller`);
            } catch (error) {
                console.warn(`[AUTO-PAYOUT] Failed to release funds:`, error);
            }
        }

        // Notify seller about payout
        if (txn.items && txn.items.length > 0) {
            const sellerId = txn.items[0].bookDetails.sellerId;
            const bookTitle = txn.items[0].bookDetails.title;
            const notificationData = {
                recipientId: sellerId,
                senderId: 'system',
                senderName: 'UiTM EMPLC',
                type: 'payout_received',
                message: `💰 You've been paid RM${sellerPayout.toFixed(2)} for "${bookTitle}"! The 7-day warranty has expired.`,
                transactionId: transactionId,
                read: false,
                createdAt: Date.now()
            };
            await database.ref('notifications').push(notificationData);
            console.log('[AUTO-PAYOUT] Seller notified about payout');
        }

        console.log(`[AUTO-PAYOUT] Completed payout for transaction ${transactionId}`);
    } catch (error) {
        console.error(`[AUTO-PAYOUT] Error processing payout for ${transactionId}:`, error);
    }
}

// Make functions globally accessible for onclick handlers
window.confirmOrderReceived = confirmOrderReceived;
window.unreceiveOrder = unreceiveOrder;
window.claimWarranty = claimWarranty;
window.confirmReturnSent = confirmReturnSent;
window.confirmReturnReceived = confirmReturnReceived;

// Seller: Confirm received returned book
async function confirmReturnReceived(transactionId) {
    console.log('[WARRANTY] confirmReturnReceived called by seller for:', transactionId);

    try {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) loadingOverlay.style.display = 'flex';

        await database.ref(`transactions/${transactionId}`).update({
            status: 'return_received',
            returnReceivedAt: Date.now(),
            returnReceivedBy: currentUser.uid
        });

        // Get transaction details
        const txnSnapshot = await database.ref(`transactions/${transactionId}`).once('value');
        const txn = txnSnapshot.val();

        // Notify admin that both parties confirmed
        if (typeof sendAdminNotification === 'function') {
            await sendAdminNotification(
                'admin_dispute',
                `✅ Return Confirmed: Both buyer and seller have confirmed the book return for order #${transactionId.substring(0, 8)}`,
                {
                    transactionId: transactionId,
                    buyerId: txn.buyerId,
                    buyerName: txn.buyerName,
                    amount: txn.amount,
                    action: 'ready_for_refund'
                },
                'high'
            );
        }

        // Notify BUYER that seller confirmed receiving the return
        if (txn && txn.buyerId) {
            const notificationData = {
                recipientId: txn.buyerId,
                senderId: currentUser.uid,
                senderName: userData.fullName,
                type: 'return_received',
                message: `✅ Seller confirmed receiving your returned book. Admin will process your refund within 24-48 hours.`,
                transactionId: transactionId,
                read: false,
                createdAt: Date.now()
            };
            await database.ref('notifications').push(notificationData);
            console.log('[WARRANTY] Buyer notified about return received');
        }

        console.log('[WARRANTY] Status updated to return_received');
        showNotification("Return confirmed! Admin will now process the refund.", "success");
        await loadSalesHistory();

    } catch (error) {
        console.error("Error confirming return received:", error);
        showNotification("Failed to confirm return", "error");
    } finally {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) loadingOverlay.style.display = 'none';
    }
}

// Load wallet data for wallet tab
async function loadWallet() {
    try {
        // Get current user's wallet
        const walletSnapshot = await database.ref(`users/${currentUser.uid}/wallet`).once('value');
        const wallet = walletSnapshot.val() || {};

        // Update balance cards
        document.getElementById('walletBalance').textContent = `RM ${(wallet.balance || 0).toFixed(2)}`;
        document.getElementById('walletPending').textContent = `RM ${(wallet.pendingEscrow || 0).toFixed(2)}`;
        document.getElementById('walletFrozen').textContent = `RM ${(wallet.frozenDispute || 0).toFixed(2)}`;
        document.getElementById('walletTotalEarned').textContent = `RM ${(wallet.totalEarned || 0).toFixed(2)}`;

        // Load payout history from transactions
        const txnSnapshot = await database.ref('transactions')
            .orderByChild('payoutProcessedAt')
            .once('value');

        const payouts = [];
        txnSnapshot.forEach(child => {
            const txn = child.val();
            // Check if this user was the seller
            if (txn.items && txn.items.some(item => item.bookDetails.sellerId === currentUser.uid)) {
                if (txn.status === 'completed' && txn.sellerPaidOut) {
                    payouts.push({
                        date: txn.payoutProcessedAt || txn.actualDeliveryDate,
                        amount: txn.sellerPayoutAmount || 0,
                        transactionId: child.key,
                        type: 'payout'
                    });
                } else if (txn.status === 'refunded') {
                    payouts.push({
                        date: txn.disputeResolvedAt,
                        amount: 0,
                        transactionId: child.key,
                        type: 'refund'
                    });
                }
            }
        });

        // Sort by date descending
        payouts.sort((a, b) => b.date - a.date);

        // Display payout history
        const historyContainer = document.getElementById('walletHistory');
        if (payouts.length === 0) {
            historyContainer.innerHTML = `
                <div style="text-align: center; color: var(--text-tertiary); padding: 2rem;">
                    <i class="fas fa-piggy-bank" style="font-size: 2rem; margin-bottom: 0.5rem;"></i>
                    <p>No payout history yet. Start selling books!</p>
                </div>
            `;
        } else {
            historyContainer.innerHTML = payouts.slice(0, 10).map(payout => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid #e5e7eb;">
                    <div>
                        <div style="font-weight: 500; color: ${payout.type === 'payout' ? '#10b981' : '#ef4444'};">
                            ${payout.type === 'payout' ? '💰 Payout Received' : '↩️ Refunded to Buyer'}
                        </div>
                        <div style="font-size: 0.75rem; color: var(--text-tertiary);">
                            Order #${payout.transactionId.substring(0, 8)} • ${formatDate(payout.date)}
                        </div>
                    </div>
                    <div style="font-weight: 600; color: ${payout.type === 'payout' ? '#10b981' : '#ef4444'};">
                        ${payout.type === 'payout' ? '+' : ''}RM ${payout.amount.toFixed(2)}
                    </div>
                </div>
            `).join('');
        }

        console.log('[WALLET] Loaded wallet data:', wallet);
    } catch (error) {
        console.error('[WALLET] Error loading wallet:', error);
    }
}
