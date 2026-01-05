// Negotiation Chat Room - Full Implementation

let currentOfferId = null;
let currentOffer = null;
let messagesListener = null;
let lastMessageTime = 0;
const MESSAGE_COOLDOWN = 2000; // 2 seconds between messages

document.addEventListener('DOMContentLoaded', async () => {
    await waitForAuth();

    const urlParams = new URLSearchParams(window.location.search);
    currentOfferId = urlParams.get('offerId');

    if (!currentOfferId) {
        window.location.href = '../index.html';
        return;
    }

    // Start listening for offer and messages
    setupOfferListener();
    setupMessagesListener();
    setupMessageForm();
    setupCounterOfferModal();
});

// ============ OFFER LISTENER ============
function setupOfferListener() {
    const offerRef = database.ref(`offers/${currentOfferId}`);

    offerRef.on('value', (snapshot) => {
        currentOffer = snapshot.val();

        if (!currentOffer) {
            alert("Offer not found!");
            window.location.href = '../index.html';
            return;
        }

        // Verify participation
        if (currentUser.uid !== currentOffer.buyerId && currentUser.uid !== currentOffer.sellerId) {
            alert("Unauthorized access!");
            window.location.href = '../index.html';
            return;
        }

        updateOfferUI();
    }, (error) => {
        console.error("Error listening to offer:", error);
    });
}

function updateOfferUI() {
    // Offer Details Sidebar
    document.getElementById('bookTitle').textContent = currentOffer.bookTitle;
    document.getElementById('originalPrice').textContent = formatCurrency(currentOffer.bookPrice);
    document.getElementById('currentOffer').textContent = formatCurrency(currentOffer.currentPrice);

    const statusEl = document.getElementById('offerStatus');
    statusEl.textContent = currentOffer.status.replace('_', ' ');
    statusEl.className = `offer-status status-${currentOffer.status.split('_')[0]}`;

    // Other party name & Date
    const otherName = currentUser.uid === currentOffer.buyerId ? currentOffer.sellerName : currentOffer.buyerName;
    document.getElementById('otherPartyName').textContent = otherName;

    const dateEl = document.getElementById('dateDisplay');
    if (dateEl) {
        dateEl.textContent = new Date(currentOffer.createdAt).toLocaleDateString();
    }

    // Update action buttons
    updateActionButtons();
}

function updateActionButtons() {
    const actionBar = document.getElementById('actionBar');
    const statusMessage = document.getElementById('statusMessage');
    const messageForm = document.getElementById('messageForm');
    const isBuyer = currentUser.uid === currentOffer.buyerId;
    const isSeller = !isBuyer;
    const isMyTurn = currentOffer.lastActionBy !== currentUser.uid;

    // Reset
    actionBar.style.display = 'none';
    actionBar.innerHTML = '';
    statusMessage.style.display = 'none';

    // Handle different statuses
    if (currentOffer.status === 'accepted') {
        if (isBuyer) {
            // Buyer sees payment button
            actionBar.style.display = 'flex';
            actionBar.innerHTML = `
                <button id="paymentBtn" class="btn btn-success" style="min-width: 200px;">
                    <i class="fas fa-credit-card"></i> Proceed to Payment
                </button>
            `;
            document.getElementById('paymentBtn').addEventListener('click', proceedToPayment);
        } else {
            // Seller sees waiting message
            statusMessage.style.display = 'block';
            statusMessage.innerHTML = '<i class="fas fa-check-circle" style="color: var(--success);"></i> Offer Accepted. Waiting for buyer payment.';
        }
        // Keep messaging enabled
    }
    else if (currentOffer.status === 'rejected') {
        statusMessage.style.display = 'block';
        statusMessage.innerHTML = '<i class="fas fa-times-circle" style="color: var(--error);"></i> Offer Rejected.';
        // Disable messaging
        messageForm.querySelector('input').disabled = true;
        messageForm.querySelector('button').disabled = true;
    }
    else if (currentOffer.status === 'pending' || currentOffer.status === 'counter_offered') {
        if (isSeller && isMyTurn) {
            // Seller can accept/reject/counter
            actionBar.style.display = 'flex';
            actionBar.innerHTML = `
                <button id="rejectBtn" class="btn btn-danger">
                    <i class="fas fa-times"></i> Reject
                </button>
                <button id="counterBtn" class="btn btn-warning">
                    <i class="fas fa-exchange-alt"></i> Counter Offer
                </button>
                <button id="acceptBtn" class="btn btn-success">
                    <i class="fas fa-check"></i> Accept (${formatCurrency(currentOffer.currentPrice)})
                </button>
            `;
            document.getElementById('rejectBtn').addEventListener('click', handleReject);
            document.getElementById('counterBtn').addEventListener('click', openCounterModal);
            document.getElementById('acceptBtn').addEventListener('click', handleAccept);
        }
        else if (isBuyer && isMyTurn && currentOffer.status === 'counter_offered') {
            // Buyer can accept/reject/counter the seller's counter-offer
            actionBar.style.display = 'flex';
            actionBar.innerHTML = `
                <button id="rejectBtn" class="btn btn-danger">
                    <i class="fas fa-times"></i> Reject
                </button>
                <button id="counterBtn" class="btn btn-warning">
                    <i class="fas fa-exchange-alt"></i> Counter Offer
                </button>
                <button id="acceptBtn" class="btn btn-success">
                    <i class="fas fa-check"></i> Accept (${formatCurrency(currentOffer.currentPrice)})
                </button>
            `;
            document.getElementById('rejectBtn').addEventListener('click', handleReject);
            document.getElementById('counterBtn').addEventListener('click', openCounterModal);
            document.getElementById('acceptBtn').addEventListener('click', handleAccept);
        }
    }
}

// ============ MESSAGE LISTENER ============
function setupMessagesListener() {
    const messagesRef = database.ref(`chats/${currentOfferId}/messages`);
    const chatContainer = document.getElementById('chatMessages');

    messagesRef.on('value', (snapshot) => {
        chatContainer.innerHTML = '';

        const messages = snapshot.val();
        if (!messages) {
            chatContainer.innerHTML = '<div class="loading-placeholder">No messages yet. Start the conversation!</div>';
            return;
        }

        // Convert to array and sort by timestamp
        const messageArray = Object.entries(messages).map(([id, msg]) => ({
            id,
            ...msg
        })).sort((a, b) => a.timestamp - b.timestamp);

        // Display messages
        messageArray.forEach(msg => {
            const messageEl = createMessageElement(msg);
            chatContainer.appendChild(messageEl);
        });

        // Auto-scroll to bottom
        chatContainer.scrollTop = chatContainer.scrollHeight;
    });
}

function createMessageElement(message) {
    const div = document.createElement('div');

    if (message.type === 'system') {
        div.className = 'message system';
        div.textContent = message.text;
    } else {
        const isSent = message.senderId === currentUser.uid;
        div.className = `message ${isSent ? 'sent' : 'received'}`;

        const textNode = document.createTextNode(message.text);
        div.appendChild(textNode);

        const timeSpan = document.createElement('span');
        timeSpan.className = 'message-time';
        timeSpan.textContent = formatMessageTime(message.timestamp);
        div.appendChild(timeSpan);
    }

    return div;
}

function formatMessageTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' +
            date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
}

// ============ MESSAGE SENDING ============
function setupMessageForm() {
    const messageForm = document.getElementById('messageForm');
    const messageInput = document.getElementById('messageInput');

    messageForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const text = messageInput.value.trim();
        if (!text) return;

        // Validate length
        if (text.length > 500) {
            showNotification("Message is too long (max 500 characters)", "error");
            return;
        }

        // Rate limiting
        const now = Date.now();
        if (now - lastMessageTime < MESSAGE_COOLDOWN) {
            const remaining = Math.ceil((MESSAGE_COOLDOWN - (now - lastMessageTime)) / 1000);
            showNotification(`Please wait ${remaining} second${remaining > 1 ? 's' : ''} before sending another message`, "warning");
            return;
        }

        // Disable form during send
        messageInput.disabled = true;
        const submitBtn = messageForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;

        try {
            const messageData = {
                senderId: currentUser.uid,
                senderName: userData.fullName,
                text: text,
                type: 'text',
                timestamp: Date.now()
            };

            await database.ref(`chats/${currentOfferId}/messages`).push(messageData);

            // Update chat metadata
            await database.ref(`chats/${currentOfferId}`).update({
                lastMessage: text,
                lastMessageTimestamp: messageData.timestamp
            });

            // Send notification to other party
            const otherUserId = currentUser.uid === currentOffer.buyerId ? currentOffer.sellerId : currentOffer.buyerId;
            await sendNotification(otherUserId, 'message', `New message from ${userData.fullName}`);

            // Clear input
            messageInput.value = '';
            lastMessageTime = now;

        } catch (error) {
            console.error("Error sending message:", error);
            showNotification("Failed to send message", "error");
        } finally {
            // Re-enable form
            messageInput.disabled = false;
            submitBtn.disabled = false;
            messageInput.focus();
        }
    });
}

// ============ OFFER ACTIONS ============
async function handleAccept() {
    if (!confirm(`Accept the offer of ${formatCurrency(currentOffer.currentPrice)}?`)) return;

    try {
        await database.ref(`offers/${currentOfferId}`).update({
            status: 'accepted',
            lastActionBy: currentUser.uid,
            updatedAt: Date.now()
        });

        // Add system message
        await addSystemMessage(`${userData.fullName} accepted the offer of ${formatCurrency(currentOffer.currentPrice)}`);

        // Notify other party
        const otherUserId = currentUser.uid === currentOffer.buyerId ? currentOffer.sellerId : currentOffer.buyerId;
        await sendNotification(otherUserId, 'offer_accepted', `Your offer for "${currentOffer.bookTitle}" was accepted!`);

        showNotification("Offer accepted!", "success");

    } catch (error) {
        console.error("Accept error:", error);
        showNotification("Failed to accept offer. Please try again.", "error");
    }
}

async function handleReject() {
    if (!confirm("Reject this offer? This cannot be undone.")) return;

    try {
        await database.ref(`offers/${currentOfferId}`).update({
            status: 'rejected',
            lastActionBy: currentUser.uid,
            updatedAt: Date.now()
        });

        // Add system message
        await addSystemMessage(`${userData.fullName} rejected the offer`);

        // Notify other party
        const otherUserId = currentUser.uid === currentOffer.buyerId ? currentOffer.sellerId : currentOffer.buyerId;
        await sendNotification(otherUserId, 'offer_rejected', `Your offer for "${currentOffer.bookTitle}" was rejected.`);

        showNotification("Offer rejected", "success");

    } catch (error) {
        console.error("Reject error:", error);
        showNotification("Failed to reject offer. Please try again.", "error");
    }
}

// ============ COUNTER OFFER ============
function setupCounterOfferModal() {
    const modal = document.getElementById('counterModal');
    const closeBtn = modal.querySelector('.modal-close');
    const form = document.getElementById('counterForm');
    const priceInput = document.getElementById('counterPrice');
    const priceError = document.getElementById('priceError');

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        form.reset();
        priceError.style.display = 'none';
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const price = parseFloat(priceInput.value);
        priceError.style.display = 'none';

        // Validation
        if (isNaN(price) || price <= 0) {
            priceError.textContent = 'Please enter a valid price greater than RM 0.00';
            priceError.style.display = 'block';
            return;
        }

        // Max validation (10x original price)
        const maxPrice = currentOffer.bookPrice * 10;
        if (price > maxPrice) {
            priceError.textContent = `Price cannot exceed ${formatCurrency(maxPrice)} (10x the original price)`;
            priceError.style.display = 'block';
            return;
        }

        // Minimum change validation (at least RM 0.50 difference)
        const priceDiff = Math.abs(price - currentOffer.currentPrice);
        if (priceDiff < 0.50) {
            priceError.textContent = 'Counter-offer must differ by at least RM 0.50';
            priceError.style.display = 'block';
            return;
        }

        try {
            await database.ref(`offers/${currentOfferId}`).update({
                currentPrice: price,
                status: 'counter_offered',
                lastActionBy: currentUser.uid,
                updatedAt: Date.now()
            });

            // Add system message
            await addSystemMessage(`${userData.fullName} sent a counter-offer of ${formatCurrency(price)}`);

            // Notify other party
            const otherUserId = currentUser.uid === currentOffer.buyerId ? currentOffer.sellerId : currentOffer.buyerId;
            await sendNotification(otherUserId, 'counter_offer', `${userData.fullName} sent a counter-offer of ${formatCurrency(price)} for "${currentOffer.bookTitle}"`);

            // Close modal
            modal.style.display = 'none';
            form.reset();
            showNotification("Counter-offer sent!", "success");

        } catch (error) {
            console.error("Counter-offer error:", error);
            showNotification("Failed to send counter-offer", "error");
        }
    });

    // Close on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            form.reset();
            priceError.style.display = 'none';
        }
    });
}

function openCounterModal() {
    const modal = document.getElementById('counterModal');
    modal.style.display = 'flex';
    document.getElementById('counterPrice').focus();
}

// ============ PAYMENT FLOW ============
async function proceedToPayment() {
    try {
        const loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'loading-overlay';
        loadingOverlay.innerHTML = '<div class="spinner"></div>';
        document.body.appendChild(loadingOverlay);

        // Try to fetch the full book details to get campusLocation and other fields
        const bookSnapshot = await database.ref(`books/${currentOffer.bookId}`).once('value');
        const bookDetails = bookSnapshot.val();

        // Prepare cart item data with fallbacks
        // Book might not exist anymore (sold/deleted), so use offer data as fallback
        const cartItemData = {
            id: currentOffer.bookId,
            title: currentOffer.bookTitle,
            author: bookDetails?.author || "Book Author",
            price: currentOffer.currentPrice,
            sellerId: currentOffer.sellerId,
            sellerName: currentOffer.sellerName,
            image: bookDetails?.images?.[0] || null,
            campusLocation: bookDetails?.campusLocation || 'To Be Determined',
            subjectCode: bookDetails?.subjectCode || 'N/A',
            condition: bookDetails?.condition || 'Used',
            isNegotiated: true,
            offerId: currentOfferId
        };

        // Add item to cart with NEGOTIATED price
        await Cart.addItem(currentOffer.bookId, cartItemData);

        showNotification("Proceeding to payment...", "success");
        setTimeout(() => {
            window.location.href = 'payment.html';
        }, 1500);

    } catch (error) {
        console.error("Payment redirect error:", error);
        showNotification("Failed to proceed to payment. Please try again.", "error");
        if (document.querySelector('.loading-overlay')) {
            document.querySelector('.loading-overlay').remove();
        }
    }
}

// ============ HELPERS ============
async function addSystemMessage(text) {
    const messageData = {
        senderId: 'system',
        senderName: 'System',
        text: text,
        type: 'system',
        timestamp: Date.now()
    };
    await database.ref(`chats/${currentOfferId}/messages`).push(messageData);

    // Update chat metadata
    await database.ref(`chats/${currentOfferId}`).update({
        lastMessage: text,
        lastMessageTimestamp: messageData.timestamp
    });
}

async function sendNotification(recipientId, type, message) {
    try {
        await database.ref('notifications').push({
            recipientId: recipientId,
            senderId: currentUser.uid,
            senderName: userData.fullName,
            type: type,
            message: message,
            offerId: currentOfferId,
            bookId: currentOffer?.bookId,
            read: false,
            createdAt: Date.now()
        });
    } catch (error) {
        // Graceful degradation - log error but don't break chat functionality
        console.warn('Failed to send notification:', error);
        // Notification failure should not prevent chat from working
    }
}
