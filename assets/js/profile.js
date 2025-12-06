// Profile page functionality

let myListings = [];
let purchaseHistory = [];
let salesHistory = [];

// Initialize profile page
document.addEventListener('DOMContentLoaded', async () => {
    await requireAuth();
    await checkForAutoDisputes(); // Check for expired orders
    await loadProfile();
    await loadMyListings();
    await loadPurchaseHistory();
    await loadSalesHistory();
    await loadNegotiations();
    setupProfileEdit();
    setupAvatarUpload();
    setupTabs();
    setupModal();
    setupFeedbackModals();
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
        const deliveryStatus = transaction.deliveryStatus || 'completed';
        const expectedDeliveryDate = transaction.expectedDeliveryDate;
        const now = Date.now();

        // Calculate days remaining
        let daysRemaining = 0;
        let statusText = '';
        let showConfirmButton = false;
        let showUnreceiveButton = false;

        if (deliveryStatus === 'pending' && expectedDeliveryDate) {
            const timeRemaining = expectedDeliveryDate - now;
            daysRemaining = Math.ceil(timeRemaining / (24 * 60 * 60 * 1000));

            if (daysRemaining > 0) {
                statusText = `<small style="color: #ff9800;">${daysRemaining} day(s) left to confirm</small>`;
                showConfirmButton = true;
            } else {
                statusText = `<small style="color: #f44336;">Overdue</small>`;
            }
        } else if (deliveryStatus === 'received') {
            statusText = `<small style="color: #4caf50;">✓ Received on ${formatDate(transaction.actualDeliveryDate)}</small>`;

            // Check if within 7 days of receipt
            if (transaction.actualDeliveryDate) {
                const daysSinceReceived = (now - transaction.actualDeliveryDate) / (24 * 60 * 60 * 1000);
                if (daysSinceReceived <= 7) {
                    showUnreceiveButton = true;
                    const daysLeftToUnreceive = Math.ceil(7 - daysSinceReceived);
                    statusText += `<br><small style="color: #ff9800;">(Can unreceive for ${daysLeftToUnreceive} more days)</small>`;
                }
            }
        } else if (deliveryStatus === 'disputed') {
            statusText = `<small style="color: #f44336;">⚠ Disputed</small>`;
        }

        return `
            <div class="cart-item purchase-item">
                <div class="cart-item-details" style="flex: 1;">
                    <h3 style="margin-bottom: 1rem; color: var(--text-primary);">Transaction #${transaction.transactionId}</h3>
                    <div class="cart-item-meta" style="display: flex; flex-wrap: wrap; gap: 1rem; margin-bottom: 0.75rem;">
                        <span style="display: flex; align-items: center; gap: 0.5rem;">
                            <i class="fas fa-calendar"></i> <strong>Date:</strong> ${formatDate(transaction.createdAt)}
                        </span>
                        <span style="display: flex; align-items: center; gap: 0.5rem;">
                            <i class="fas fa-shopping-bag"></i> <strong>Items:</strong> ${transaction.items.length} item(s)
                        </span>
                    </div>
                    ${statusText ? `
                        <div style="margin-top: 0.75rem; padding: 0.5rem 1rem; background: ${daysRemaining > 0 ? '#fff3cd' : deliveryStatus === 'received' ? '#d4edda' : '#f8d7da'}; border-left: 3px solid ${daysRemaining > 0 ? '#ffc107' : deliveryStatus === 'received' ? '#28a745' : '#dc3545'}; border-radius: 4px;">
                            ${statusText}
                        </div>
                    ` : ''}
                </div>
                <div class="cart-item-actions" style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.75rem; min-width: 200px;">
                    <div>
                        <div style="font-size: 0.875rem; color: var(--text-tertiary); margin-bottom: 0.25rem;">Total Amount:</div>
                        <div class="cart-item-price" style="font-size: 1.75rem;">${formatCurrency(transaction.amount)}</div>
                    </div>
                    <span class="status-badge status-${deliveryStatus}">${deliveryStatus}</span>
                    ${showConfirmButton ? `
                        <button class="btn btn-success btn-sm" onclick="confirmOrderReceived('${transaction.transactionId}')">
                            <i class="fas fa-check"></i> Confirm Received
                        </button>
                    ` : ''}
                    ${showUnreceiveButton ? `
                        <button class="btn btn-danger btn-sm" onclick="unreceiveOrder('${transaction.transactionId}')">
                            <i class="fas fa-undo"></i> Book Unreceive
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Unreceive order (within 7 days)
async function unreceiveOrder(transactionId) {
    const reason = prompt("Please provide a reason for unreceiving this book (e.g., wrong book, damaged, etc.):");
    if (reason === null) return; // User cancelled
    if (reason.trim() === "") {
        alert("You must provide a reason.");
        return;
    }

    try {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) loadingOverlay.style.display = 'flex';

        // 1. Update transaction status to disputed
        await database.ref(`transactions/${transactionId}`).update({
            deliveryStatus: 'disputed',
            disputeReason: reason,
            disputeCreatedAt: Date.now()
        });

        showNotification("Order marked as unreceived. Please complete the feedback form.", "info");

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
        const deliveryStatus = transaction.deliveryStatus || 'completed';
        let deliveryBadge = '';
        let deliveryBadgeColor = '';

        if (deliveryStatus === 'pending') {
            deliveryBadge = 'Awaiting Confirmation';
            deliveryBadgeColor = 'background: #ff9800; color: white;';
        } else if (deliveryStatus === 'received') {
            deliveryBadge = 'Confirmed';
            deliveryBadgeColor = 'background: #4caf50; color: white;';
        } else if (deliveryStatus === 'disputed') {
            deliveryBadge = 'Disputed';
            deliveryBadgeColor = 'background: #f44336; color: white;';
        }

        return `
            <div class="cart-item sales-item">
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
                    ${deliveryBadge ? `
                        <div style="margin-top: 0.5rem;">
                            <span class="status-badge" style="${deliveryBadgeColor} padding: 0.4rem 0.8rem; border-radius: 4px; font-size: 0.875rem;">
                                <i class="fas fa-truck"></i> ${deliveryBadge}
                            </span>
                        </div>
                    ` : ''}
                </div>
                <div class="cart-item-actions" style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.75rem; min-width: 200px;">
                    <div>
                        <div style="font-size: 0.875rem; color: var(--text-tertiary); margin-bottom: 0.25rem;">Sale Amount:</div>
                        <div class="cart-item-price" style="font-size: 1.75rem;">${formatCurrency(transaction.basePrice)}</div>
                    </div>
                    <span class="status-badge ${transaction.status}">${transaction.status}</span>
                </div>
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

        snapshot.forEach(childSnapshot => {
            const transaction = childSnapshot.val();
            const transactionId = childSnapshot.key;

            // Check if order is pending and past expected delivery date
            if (transaction.deliveryStatus === 'pending' && transaction.expectedDeliveryDate) {
                if (now > transaction.expectedDeliveryDate) {
                    // Mark as disputed
                    updates[`transactions/${transactionId}/deliveryStatus`] = 'disputed';
                    updates[`transactions/${transactionId}/disputeCreatedAt`] = now;
                    disputeCount++;
                }
            }
        });

        // Apply all updates at once
        if (Object.keys(updates).length > 0) {
            await database.ref().update(updates);
            if (disputeCount > 0) {
                console.log(`Marked ${disputeCount} order(s) as disputed`);
            }
        }
    } catch (error) {
        console.error("Error checking for auto-disputes:", error);
    }
}

// Confirm order received by buyer
async function confirmOrderReceived(transactionId) {
    if (!confirm('Confirm that you have received this order?')) return;

    try {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) loadingOverlay.style.display = 'flex';

        // Update transaction
        await database.ref(`transactions/${transactionId}`).update({
            deliveryStatus: 'received',
            actualDeliveryDate: Date.now(),
            deliveryConfirmedBy: currentUser.uid
        });

        showNotification("Order marked as received!", "success");

        // Reload purchase history to reflect changes
        await loadPurchaseHistory();

        // Show feedback modal for the buyer to rate their experience
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


