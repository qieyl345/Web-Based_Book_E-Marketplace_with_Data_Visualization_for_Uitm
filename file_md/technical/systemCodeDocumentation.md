# System Code Documentation

> **Document Purpose:** This document provides code snippets with paragraph explanations for all key functions in the UITM-EMPLC system, organized by page functionality.

---

## Table of Contents

1. [Authentication (auth.js)](#1-authentication-authjs)
2. [Homepage (homepage.js)](#2-homepage-homepagejs)
3. [Book Details (book-details.js)](#3-book-details-book-detailsjs)
4. [Shopping Cart (cart.js)](#4-shopping-cart-cartjs)
5. [Payment Processing (payment.js)](#5-payment-processing-paymentjs)
6. [Negotiation Chat (chat.js)](#6-negotiation-chat-chatjs)
7. [User Profile (profile.js)](#7-user-profile-profilejs)
8. [Admin Dashboard (admin.js)](#8-admin-dashboard-adminjs)

---

## 1. Authentication (auth.js)

### 1.1 Login Function

```javascript
async function login(email, password, rememberMe = false) {
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;

        if (rememberMe) {
            auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
        } else {
            auth.setPersistence(firebase.auth.Auth.Persistence.SESSION);
        }

        return { success: true, message: "Login successful!" };
    } catch (error) {
        console.error("Login error:", error);
        throw error;
    }
}
```

The login function is an asynchronous function that handles user authentication using Firebase Authentication service. It accepts three parameters: the user's email, password, and an optional rememberMe flag. The function uses Firebase's `signInWithEmailAndPassword()` method to validate the credentials against the authentication database. If the rememberMe option is enabled, the session is set to LOCAL persistence which keeps the user logged in even after the browser is closed. Otherwise, SESSION persistence is used which clears the session when the browser tab closes. Upon successful authentication, the function returns a success object; if authentication fails, it catches the error and re-throws it for the calling function to handle.

---

### 1.2 Signup Function

```javascript
async function signUp(email, password, fullName, phoneNumber, role) {
    try {
        if (!validateUitmEmail(email)) {
            throw new Error("Please use a valid UiTM email address");
        }

        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        const userData = {
            email: user.email,
            fullName: fullName,
            phoneNumber: phoneNumber,
            role: role,
            profilePic: "",
            createdAt: Date.now(),
            totalSales: 0,
            totalPurchases: 0,
            isSeller: false
        };

        await database.ref(`users/${user.uid}`).set(userData);

        return { success: true, message: "Account created successfully!" };
    } catch (error) {
        console.error("Signup error:", error);
        throw error;
    }
}
```

The signup function creates a new user account in the UITM-EMPLC system. It first validates that the provided email belongs to a UiTM domain, ensuring only students and staff with @student.uitm.edu.my or @staff.uitm.edu.my addresses can register. The function then uses Firebase's `createUserWithEmailAndPassword()` method to create an authentication account. After successful authentication account creation, it prepares a user profile object containing the user's personal information, role, and initial statistics such as totalSales and totalPurchases set to zero. This profile data is then stored in Firebase Realtime Database under the path `/users/{uid}`, where uid is the unique identifier assigned by Firebase Authentication. The function returns a success message upon completion or throws an error if any step fails.

---

## 2. Homepage (homepage.js)

### 2.1 Load Books Function

```javascript
async function loadBooks() {
    try {
        const booksGrid = document.getElementById('booksGrid');

        booksGrid.innerHTML = `
            <div class="skeleton-book-card fade-in">
                <div class="skeleton skeleton-image"></div>
                <div class="skeleton-content">
                    <div class="skeleton skeleton-title"></div>
                    <div class="skeleton skeleton-text"></div>
                </div>
            </div>
        `;

        allBooks = await Books.getBooks();
        filteredBooks = [...allBooks];

        displayBooks();
    } catch (error) {
        console.error("Error loading books:", error);
        showNotification("Error loading books", "error");
    }
}
```

The loadBooks function is responsible for fetching and displaying all available books on the homepage. When called, it first displays skeleton loading placeholders in the books grid to provide visual feedback during data fetching. These skeleton cards feature a shimmer animation that creates a polished user experience while the actual data loads. The function then calls the Books.getBooks() method to retrieve all book listings from Firebase Realtime Database. Once the data is received, it stores the books in the allBooks array and creates a copy in filteredBooks for filtering operations. Finally, it calls displayBooks() to render the actual book cards in the grid. If an error occurs during the fetch operation, the function catches it, logs it to the console, and displays an error notification to the user.

---

### 2.2 Perform Search Function

```javascript
function performSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();

    filteredBooks = allBooks.filter(book =>
        book.title.toLowerCase().includes(searchTerm) ||
        book.author.toLowerCase().includes(searchTerm) ||
        (book.subjectCode && book.subjectCode.toLowerCase().includes(searchTerm))
    );

    displayBooks();
}
```

The performSearch function implements the real-time search functionality on the homepage. It retrieves the user's search input from the search field and converts it to lowercase for case-insensitive matching. The function then filters the allBooks array using the JavaScript filter method, checking if the search term appears in either the book's title, author name, or subject code. This multi-field search approach allows users to find books using any of these common identifiers. The filtered results are stored in the filteredBooks array, and the displayBooks function is called to update the book grid with only the matching books. This function is typically called with a debounce delay to prevent excessive filtering during rapid typing.

---

### 2.3 Apply Filters Function

```javascript
function applyFilters() {
    const conditionFilters = document.querySelectorAll('input[name="condition"]:checked');
    const minPrice = document.getElementById('minPrice').value;
    const maxPrice = document.getElementById('maxPrice').value;
    const campusLocation = document.getElementById('campusFilter').value;

    const conditions = Array.from(conditionFilters).map(cb => cb.value);

    filteredBooks = allBooks.filter(book => {
        if (conditions.length > 0 && !conditions.includes(book.condition)) {
            return false;
        }
        if (minPrice && book.price < parseFloat(minPrice)) {
            return false;
        }
        if (maxPrice && book.price > parseFloat(maxPrice)) {
            return false;
        }
        if (campusLocation && book.campusLocation !== campusLocation) {
            return false;
        }
        return true;
    });

    displayBooks();
}
```

The applyFilters function handles the advanced filtering system on the homepage. It collects user-selected filter criteria from multiple form inputs including book condition checkboxes, minimum and maximum price fields, and the campus location dropdown. The function extracts the values from checked condition checkboxes and converts them into an array. It then filters the allBooks array using a series of conditional checks: first verifying if the book's condition matches any selected conditions, then checking if the price falls within the specified range, and finally confirming the campus location matches if one is selected. Each filter is applied only if the user has provided a value, allowing for flexible partial filtering. Books that pass all active filters remain in the filteredBooks array, and the display is updated accordingly.

---

### 2.4 Add Book Form Handler

```javascript
addBookForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loadingOverlay.style.display = 'flex';

    try {
        const title = document.getElementById('bookTitle').value;
        const author = document.getElementById('bookAuthor').value;
        const isbn = document.getElementById('bookISBN').value;
        const subjectCode = document.getElementById('subjectCode').value;
        const condition = document.getElementById('bookCondition').value;
        const price = parseFloat(document.getElementById('bookPrice').value);
        const campusLocation = document.getElementById('campusLocation').value;
        const description = document.getElementById('bookDescription').value;
        const imageFiles = document.getElementById('bookImages').files;

        let images = [];
        if (imageFiles.length > 0) {
            images = await uploadMultipleImages(imageFiles);
        }

        const bookData = { title, author, isbn, subjectCode, condition, price, campusLocation, description, images };

        await Books.addBook(bookData);
        showNotification("Book listed successfully!", "success");
        addBookModal.style.display = 'none';
        loadBooks();
    } catch (error) {
        showNotification(error.message, "error");
    } finally {
        loadingOverlay.style.display = 'none';
    }
});
```

The add book form handler manages the submission of new book listings to the marketplace. When a seller submits the listing form, the handler prevents the default form submission and displays a loading overlay to indicate processing. It then collects all form field values including book details such as title, author, ISBN, subject code, condition, price, campus location, and description. If the seller has uploaded images, the handler calls the uploadMultipleImages function to upload them to ImageBB and retrieve the hosted URLs. All the collected data is packaged into a bookData object and submitted to Firebase using the Books.addBook() method. Upon successful submission, a success notification is displayed, the modal is closed, and the books grid is reloaded to show the newly listed book. If any error occurs during the process, an error notification is shown, and the loading overlay is hidden in the finally block regardless of the outcome.

---

## 3. Book Details (book-details.js)

### 3.1 Load Book Details Function

```javascript
async function loadBookDetails(bookId) {
    try {
        currentBook = await Books.getBook(bookId);

        await Books.incrementViewCount(bookId);

        document.title = `${currentBook.title} - UiTM e-Marketplace`;
        document.getElementById('bookTitleBreadcrumb').textContent = currentBook.title;

        displayBookDetails();
        setupActionButtons();
    } catch (error) {
        throw error;
    }
}
```

The loadBookDetails function retrieves and displays comprehensive information about a specific book. It accepts a bookId parameter extracted from the URL query string and uses it to fetch the book data from Firebase through the Books.getBook() method. The function also increments the book's view count in the database, which is used for popularity tracking and sorting. After fetching the data, it updates the browser tab title to include the book's name for better user experience and updates the breadcrumb navigation. The function then calls displayBookDetails() to populate all the book information fields on the page and setupActionButtons() to configure the action buttons based on the user's role and ownership of the book. If the book is not found or an error occurs, the error is propagated to the calling code which redirects the user back to the homepage.

---

### 3.2 Make Offer Form Handler

```javascript
document.getElementById('offerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const offerPrice = parseFloat(document.getElementById('offerPrice').value);

    if (isNaN(offerPrice) || offerPrice <= 0) {
        showNotification("Please enter a valid price", "error");
        return;
    }

    try {
        const offerData = {
            bookId: currentBook.id,
            bookTitle: currentBook.title,
            bookPrice: currentBook.price,
            buyerId: currentUser.uid,
            buyerName: userData.fullName,
            sellerId: currentBook.sellerId,
            sellerName: currentBook.sellerName,
            currentPrice: offerPrice,
            status: 'pending',
            lastActionBy: currentUser.uid,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        const offerRef = await database.ref('offers').push(offerData);
        const offerId = offerRef.key;

        const chatData = {
            participants: { [currentUser.uid]: true, [currentBook.sellerId]: true },
            lastMessage: `Offer made: RM ${offerPrice.toFixed(2)}`,
            lastMessageTimestamp: Date.now()
        };
        await database.ref(`chats/${offerId}`).set(chatData);

        await database.ref('notifications').push({
            recipientId: currentBook.sellerId,
            type: 'offer',
            message: `${userData.fullName} offered RM ${offerPrice.toFixed(2)} for "${currentBook.title}"`,
            read: false,
            createdAt: Date.now()
        });

        window.location.href = `chat.html?offerId=${offerId}`;
    } catch (error) {
        showNotification("Failed to send offer", "error");
    }
});
```

The make offer form handler processes price negotiation requests from buyers. When a buyer submits an offer, the handler validates that the entered price is a valid positive number. It then creates an offer data object containing all relevant information including book details, buyer and seller identities, the proposed price, and status tracking fields. This offer is pushed to the Firebase offers collection and a unique offerId is generated. The handler also initializes a chat room for the negotiation by creating a chats entry with both participants marked as members. An initial system message is added to the chat, and a notification is sent to the seller alerting them of the new offer. Finally, the buyer is redirected to the chat page where they can continue the negotiation in real-time. This flow creates a seamless transition from viewing a book to actively negotiating its price.

---

## 4. Shopping Cart (cart.js)

### 4.1 Load Cart Function

```javascript
async function loadCart() {
    try {
        const cart = await Cart.getCart();
        cartItems = Object.values(cart.items || {});

        const unavailableBooks = [];
        const validItems = [];

        for (const item of cartItems) {
            const bookSnapshot = await database.ref(`books/${item.bookDetails.id}`).once('value');
            const bookData = bookSnapshot.val();

            if (!bookData || bookData.status === 'sold') {
                unavailableBooks.push(item.bookDetails.title);
                await Cart.removeItem(item.bookDetails.id);
            } else {
                validItems.push(item);
            }
        }

        cartItems = validItems;

        if (unavailableBooks.length > 0) {
            showNotification(
                `Some books in your cart are no longer available and have been removed: ${unavailableBooks.join(', ')}`,
                "warning"
            );
        }

        if (cartItems.length === 0) {
            showEmptyCart();
        } else {
            displayCartItems();
            await displayCartSummary();
        }
    } catch (error) {
        showNotification("Error loading cart", "error");
    }
}
```

The loadCart function retrieves the user's shopping cart and validates the availability of each item. It first fetches the cart data from Firebase and converts the items object into an array. The function then iterates through each cart item, checking if the corresponding book still exists in the database and has not been sold. This race condition prevention is crucial because in a C2C marketplace, books can only be sold once, and another buyer might purchase a book while it sits in someone else's cart. Any unavailable books are automatically removed from the cart, and their titles are collected for notification. The user is warned about any removed items so they understand why their cart contents changed. Finally, if items remain in the cart, they are displayed along with a price summary; otherwise, an empty cart message is shown.

---

### 4.2 Remove Item Function

```javascript
async function removeItem(bookId) {
    try {
        const loadingOverlay = document.getElementById('loadingOverlay');
        loadingOverlay.style.display = 'flex';

        await Cart.removeItem(bookId);
        showNotification("Item removed from cart", "success");

        setTimeout(() => {
            window.location.reload();
        }, 1000);
    } catch (error) {
        console.error("Error removing item:", error);
        showNotification(error.message, "error");
        loadingOverlay.style.display = 'none';
    }
}
```

The removeItem function allows users to remove individual books from their shopping cart. When triggered by clicking the remove button on a cart item, the function displays a loading overlay to indicate the operation is in progress. It then calls the Cart.removeItem() method with the book's ID to remove the item from the user's cart in Firebase. Upon successful removal, a success notification is displayed, and the page is reloaded after a brief delay to reflect the updated cart state. This page reload approach ensures the cart summary is recalculated and displayed correctly. If an error occurs during removal, the function displays an error notification and hides the loading overlay to allow the user to try again.

---

## 5. Payment Processing (payment.js)

### 5.1 Process Payment Function

```javascript
async function processPayment() {
    if (!selectedBank) {
        showNotification("Please select a bank", "error");
        return;
    }

    const { unavailableBooks, availableItems } = await validateBookAvailability();

    if (unavailableBooks.length > 0) {
        showNotification(
            `The following book(s) are no longer available: ${unavailableBooks.join(', ')}`,
            "error"
        );
        if (availableItems.length === 0) {
            setTimeout(() => { window.location.href = 'cart.html'; }, 3000);
            return;
        }
        setTimeout(() => { window.location.reload(); }, 3000);
        return;
    }

    const processingModal = document.getElementById('processingModal');
    processingModal.style.display = 'flex';

    await new Promise(resolve => setTimeout(resolve, 3000));

    const isSuccess = Math.random() < 0.9;

    if (isSuccess) {
        const transactionId = await completeTransaction();
        processingModal.style.display = 'none';
        showPaymentSuccess(transactionId);
    } else {
        processingModal.style.display = 'none';
        showPaymentFailure();
    }
}
```

The processPayment function handles the FPX payment simulation process. It first validates that the user has selected a bank, then performs a final availability check on all books in the cart to prevent race conditions where a book might have been sold during the checkout process. If any books are unavailable, the user is notified and redirected appropriately. Once validation passes, a processing modal is displayed to simulate the FPX payment processing experience. After a 3-second delay that mimics real payment gateway processing, the function determines success or failure randomly with a 90% success rate. On success, the completeTransaction function is called to finalize the purchase, and the user is redirected to the receipt page. On failure, an error modal is displayed with options to retry the payment. This simulation provides a realistic payment experience while demonstrating error handling capabilities.

---

### 5.2 Complete Transaction Function

```javascript
async function completeTransaction() {
    const transactionId = 'TXN' + Date.now();

    const transaction = {
        transactionId,
        buyerId: currentUser.uid,
        buyerName: userData.fullName,
        items: paymentItems,
        amount: paymentTotal,
        status: 'payment_held',
        selectedBank,
        createdAt: Date.now(),
        escrowHeldAt: Date.now(),
        autoReleaseAt: Date.now() + (7 * 24 * 60 * 60 * 1000),
        sellerPaidOut: false
    };

    await database.ref(`transactions/${transactionId}`).set(transaction);

    for (const item of paymentItems) {
        await database.ref(`books/${item.bookDetails.id}`).update({
            status: 'sold',
            soldAt: Date.now(),
            buyerId: currentUser.uid
        });
    }

    await Cart.clear();

    for (const item of paymentItems) {
        const sellerWalletRef = database.ref(`users/${item.bookDetails.sellerId}/wallet`);
        const walletSnapshot = await sellerWalletRef.once('value');
        const wallet = walletSnapshot.val() || {};

        await sellerWalletRef.update({
            pendingEscrow: (wallet.pendingEscrow || 0) + item.bookDetails.price
        });
    }

    return transactionId;
}
```

The completeTransaction function finalizes a successful payment and sets up the escrow system. It generates a unique transaction ID using the current timestamp and creates a comprehensive transaction record containing buyer information, purchased items, payment amount, and escrow tracking fields. The transaction status is set to 'payment_held' indicating funds are in escrow pending buyer confirmation. An auto-release timestamp is calculated for 7 days in the future when the seller will automatically receive payment if no issues are reported. The function then updates each purchased book's status to 'sold' in the database, preventing other users from purchasing them. The buyer's cart is cleared after successful purchase. Finally, the payment amount is added to each seller's pending escrow wallet balance, tracking the funds that are held until the warranty period expires. This comprehensive approach ensures all parties have accurate records and the escrow system functions correctly.

---

## 6. Negotiation Chat (chat.js)

### 6.1 Setup Messages Listener

```javascript
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

        const messageArray = Object.entries(messages).map(([id, msg]) => ({
            id,
            ...msg
        })).sort((a, b) => a.timestamp - b.timestamp);

        messageArray.forEach(msg => {
            const messageEl = createMessageElement(msg);
            chatContainer.appendChild(messageEl);
        });

        chatContainer.scrollTop = chatContainer.scrollHeight;
    });
}
```

The setupMessagesListener function establishes a real-time connection to the chat messages in Firebase. It creates a reference to the messages node under the current offer's chat room and sets up an 'on value' listener that fires whenever the messages change. When triggered, the function clears the chat container and processes the incoming message data. If no messages exist, a placeholder message is displayed. Otherwise, the messages object is converted to an array with IDs preserved, sorted chronologically by timestamp to ensure proper conversation order. Each message is then rendered using the createMessageElement function which handles both regular chat messages and system messages differently. After all messages are displayed, the chat container automatically scrolls to the bottom so users always see the most recent messages. This real-time listener approach means new messages appear instantly without requiring page refreshes.

---

### 6.2 Handle Accept Function

```javascript
async function handleAccept() {
    if (!confirm(`Accept the offer of ${formatCurrency(currentOffer.currentPrice)}?`)) return;

    try {
        await database.ref(`offers/${currentOfferId}`).update({
            status: 'accepted',
            lastActionBy: currentUser.uid,
            updatedAt: Date.now()
        });

        await addSystemMessage(`${userData.fullName} accepted the offer of ${formatCurrency(currentOffer.currentPrice)}`);

        const otherUserId = currentUser.uid === currentOffer.buyerId 
            ? currentOffer.sellerId 
            : currentOffer.buyerId;
        await sendNotification(otherUserId, 'offer_accepted', 
            `Your offer for "${currentOffer.bookTitle}" was accepted!`);

        showNotification("Offer accepted!", "success");
    } catch (error) {
        showNotification("Failed to accept offer. Please try again.", "error");
    }
}
```

The handleAccept function processes the acceptance of a negotiated price by either party. It first displays a confirmation dialog showing the agreed price to prevent accidental acceptances. Upon confirmation, the function updates the offer status in Firebase to 'accepted' and records who performed the action and when. A system message is automatically added to the chat history documenting the acceptance for both parties to see. The function then sends a notification to the other party informing them that the offer has been accepted. For buyers, accepting means they are ready to proceed to payment; for sellers, it means they have agreed to sell at the negotiated price. A success notification confirms the action was completed successfully. This function demonstrates the turn-based negotiation system where each party takes actions and the other is notified.

---

### 6.3 Counter Offer Handler

```javascript
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const price = parseFloat(priceInput.value);

    if (isNaN(price) || price <= 0) {
        priceError.textContent = 'Please enter a valid price greater than RM 0.00';
        priceError.style.display = 'block';
        return;
    }

    const maxPrice = currentOffer.bookPrice * 10;
    if (price > maxPrice) {
        priceError.textContent = `Price cannot exceed ${formatCurrency(maxPrice)} (10x the original price)`;
        priceError.style.display = 'block';
        return;
    }

    const priceDiff = Math.abs(price - currentOffer.currentPrice);
    if (priceDiff < 0.50) {
        priceError.textContent = 'Counter-offer must differ by at least RM 0.50';
        priceError.style.display = 'block';
        return;
    }

    await database.ref(`offers/${currentOfferId}`).update({
        currentPrice: price,
        status: 'counter_offered',
        lastActionBy: currentUser.uid,
        updatedAt: Date.now()
    });

    await addSystemMessage(`${userData.fullName} sent a counter-offer of ${formatCurrency(price)}`);
    await sendNotification(otherUserId, 'counter_offer', 
        `${userData.fullName} sent a counter-offer of ${formatCurrency(price)}`);
});
```

The counter offer handler manages the submission of counter-offers during price negotiations. It implements multiple validation rules to ensure fair and meaningful negotiations. First, it validates that the entered price is a positive number. Then it checks that the price does not exceed 10 times the original book price, preventing unrealistic or trolling offers. The minimum difference validation requires counter-offers to differ by at least RM 0.50 from the current offer, encouraging meaningful negotiation progress rather than micro-adjustments. Once validations pass, the offer is updated in Firebase with the new price, status changed to 'counter_offered', and tracking information updated. A system message documents the counter-offer in the chat, and a notification alerts the other party to respond. This structured approach maintains negotiation integrity while providing flexibility for both parties.

---

## 7. User Profile (profile.js)

### 7.1 Confirm Order Received Function

```javascript
async function confirmOrderReceived(transactionId) {
    if (!confirm('Confirm that you have received the book? This will start the 7-day warranty period.')) return;

    try {
        const now = Date.now();
        const payoutScheduledAt = now + WARRANTY_PERIOD_MS;

        await database.ref(`transactions/${transactionId}`).update({
            status: 'delivered',
            deliveryStatus: 'delivered',
            actualDeliveryDate: now,
            deliveryConfirmedBy: currentUser.uid,
            warrantyExpiresAt: payoutScheduledAt,
            payoutScheduledAt: payoutScheduledAt
        });

        const txnSnapshot = await database.ref(`transactions/${transactionId}`).once('value');
        const txn = txnSnapshot.val();
        const sellerId = txn.items[0]?.bookDetails?.sellerId;

        if (sellerId) {
            await database.ref('notifications').push({
                recipientId: sellerId,
                type: 'order_received',
                message: `Buyer confirmed receipt! Your payout will auto-release in 7 days.`,
                transactionId: transactionId,
                read: false,
                createdAt: now
            });
        }

        showNotification('Order marked as received! 7-day warranty period has started.', 'success');
        window.location.reload();
    } catch (error) {
        showNotification('Failed to confirm receipt', 'error');
    }
}
```

The confirmOrderReceived function handles the buyer's confirmation that they have received their purchased book. This action is critical in the escrow workflow as it transitions the transaction into the warranty period. The function first displays a confirmation dialog explaining that this will start the 7-day warranty countdown. Upon confirmation, it calculates the payout scheduled date by adding the warranty period to the current timestamp. The transaction record is then updated with delivery confirmation details including the actual delivery date, who confirmed it, and when the warranty expires and payout is scheduled. A notification is sent to the seller informing them that the buyer has confirmed receipt and their payment will auto-release after the warranty period. This function represents a key trust-building mechanism in the C2C marketplace, giving buyers time to inspect their purchase while assuring sellers of eventual payment.

---

### 7.2 Claim Warranty Function

```javascript
async function claimWarranty(transactionId) {
    if (!confirm('Report an issue with this order? This will freeze the funds until admin reviews.')) return;

    try {
        await database.ref(`transactions/${transactionId}`).update({
            status: 'warranty_claimed',
            warrantyClaimDismissed: false,
            warrantyClaimedAt: Date.now()
        });

        const txnSnapshot = await database.ref(`transactions/${transactionId}`).once('value');
        const txn = txnSnapshot.val();
        const sellerId = txn.items[0]?.bookDetails?.sellerId;

        if (sellerId) {
            const sellerWalletRef = database.ref(`users/${sellerId}/wallet`);
            const walletSnapshot = await sellerWalletRef.once('value');
            const wallet = walletSnapshot.val() || {};
            const amount = txn.amount || txn.basePrice || 0;

            await sellerWalletRef.update({
                pendingEscrow: Math.max(0, (wallet.pendingEscrow || 0) - amount),
                frozenDispute: (wallet.frozenDispute || 0) + amount
            });
        }

        showNotification('Warranty claim submitted. Please return the book to the seller within 7 days.', 'success');
    } catch (error) {
        showNotification('Failed to submit warranty claim', 'error');
    }
}
```

The claimWarranty function enables buyers to report issues with their purchase within the 7-day warranty period. The function first confirms the user's intent to file a claim and explains that funds will be frozen for admin review. Upon confirmation, the transaction status is updated to 'warranty_claimed' with tracking flags and timestamps. The most important aspect of this function is the wallet adjustment: it moves the transaction amount from the seller's pending escrow to their frozen dispute balance. This prevents automatic payout while the claim is reviewed and protects the buyer's interests. The notification system alerts relevant parties about the claim. Instructions are provided to the buyer about returning the book within 7 days. If the buyer fails to return the book within the timeframe, the system assumes they have accepted the book's condition and proceeds with seller payout, balancing protection for both parties.

---

### 7.3 Load Wallet Function

```javascript
async function loadWallet() {
    const walletContainer = document.getElementById('walletTab');
    
    const walletSnapshot = await database.ref(`users/${currentUser.uid}/wallet`).once('value');
    const wallet = walletSnapshot.val() || {};

    const balance = wallet.balance || 0;
    const pendingEscrow = wallet.pendingEscrow || 0;
    const frozenDispute = wallet.frozenDispute || 0;
    const totalEarned = wallet.totalEarned || 0;

    walletContainer.innerHTML = `
        <div class="wallet-container">
            <div class="wallet-card available">
                <div class="wallet-label">Available Balance</div>
                <div class="wallet-value">${formatCurrency(balance)}</div>
            </div>
            <div class="wallet-card pending">
                <div class="wallet-label">Pending Payout</div>
                <div class="wallet-value">${formatCurrency(pendingEscrow)}</div>
            </div>
            <div class="wallet-card frozen">
                <div class="wallet-label">Frozen (Disputes)</div>
                <div class="wallet-value">${formatCurrency(frozenDispute)}</div>
            </div>
            <div class="wallet-card total">
                <div class="wallet-label">Total Earned</div>
                <div class="wallet-value">${formatCurrency(totalEarned)}</div>
            </div>
        </div>
    `;
}
```

The loadWallet function retrieves and displays the seller's wallet information in the profile wallet tab. It fetches the wallet data from the user's record in Firebase and extracts four key financial metrics: available balance which represents immediately withdrawable funds, pending escrow which shows funds from recent sales still in the warranty period, frozen dispute which indicates funds locked due to active warranty claims, and total earned which tracks lifetime earnings on the platform. Each value is displayed in a styled card with appropriate visual indicators. This comprehensive wallet view helps sellers understand their financial position on the platform, distinguishing between money they can access immediately versus funds that are temporarily held. The wallet system provides transparency into the escrow process and helps sellers plan around the 7-day payout delay.

---

## 8. Admin Dashboard (admin.js)

### 8.1 Resolve Dispute For Buyer Function

```javascript
async function resolveDisputeForBuyer(transactionId, feedbackId) {
    if (!confirm('Refund the buyer? This will return the full amount to the buyer.')) return;

    try {
        const txnSnapshot = await database.ref(`transactions/${transactionId}`).once('value');
        const txn = txnSnapshot.val();
        const sellerId = txn.items[0]?.bookDetails?.sellerId;
        const buyerId = txn.buyerId;
        const amount = txn.amount || txn.basePrice || 0;

        await database.ref(`transactions/${transactionId}`).update({
            status: 'refunded',
            resolvedAt: Date.now(),
            resolvedBy: currentUser.uid,
            resolution: 'buyer_refunded'
        });

        if (sellerId) {
            const sellerWalletRef = database.ref(`users/${sellerId}/wallet`);
            const walletSnapshot = await sellerWalletRef.once('value');
            const wallet = walletSnapshot.val() || {};

            await sellerWalletRef.update({
                frozenDispute: Math.max(0, (wallet.frozenDispute || 0) - amount)
            });
        }

        if (feedbackId) {
            await database.ref(`feedback/${feedbackId}`).update({
                status: 'resolved',
                resolution: 'buyer_refunded'
            });
        }

        await database.ref('notifications').push({
            recipientId: buyerId,
            type: 'dispute_resolved',
            message: `Your dispute has been resolved. Full refund of ${formatCurrency(amount)} processed.`,
            read: false,
            createdAt: Date.now()
        });

        showNotification('Dispute resolved - Buyer refunded', 'success');
        loadFeedback();
    } catch (error) {
        showNotification('Failed to resolve dispute', 'error');
    }
}
```

The resolveDisputeForBuyer function allows administrators to resolve disputes in favor of the buyer by processing a full refund. After confirmation, the function retrieves the transaction details to identify the involved parties and the disputed amount. The transaction status is updated to 'refunded' with resolution details and timestamps for audit purposes. The critical financial adjustment removes the disputed amount from the seller's frozen funds, effectively returning the money to the platform for buyer refund processing. If the dispute originated from a feedback entry, that record is also marked as resolved. Notifications are sent to the buyer confirming the refund resolution. This function represents the admin's power to protect buyers from non-delivery, wrong items, or damaged goods, maintaining trust in the marketplace. The comprehensive update ensures all related records reflect the resolution consistently.

---

### 8.2 Resolve Dispute For Seller Function

```javascript
async function resolveDisputeForSeller(transactionId, feedbackId) {
    if (!confirm('Pay the seller? This will release the frozen funds to the seller.')) return;

    try {
        const txnSnapshot = await database.ref(`transactions/${transactionId}`).once('value');
        const txn = txnSnapshot.val();
        const sellerId = txn.items[0]?.bookDetails?.sellerId;
        const amount = txn.amount || txn.basePrice || 0;
        const commission = amount * COMMISSION_RATE;
        const sellerPayout = amount - commission;

        await database.ref(`transactions/${transactionId}`).update({
            status: 'completed',
            resolvedAt: Date.now(),
            resolvedBy: currentUser.uid,
            resolution: 'seller_paid',
            sellerPayoutAmount: sellerPayout
        });

        if (sellerId) {
            const sellerWalletRef = database.ref(`users/${sellerId}/wallet`);
            const walletSnapshot = await sellerWalletRef.once('value');
            const wallet = walletSnapshot.val() || {};

            await sellerWalletRef.update({
                balance: (wallet.balance || 0) + sellerPayout,
                frozenDispute: Math.max(0, (wallet.frozenDispute || 0) - amount),
                totalEarned: (wallet.totalEarned || 0) + sellerPayout
            });
        }

        await database.ref('notifications').push({
            recipientId: sellerId,
            type: 'payout_received',
            message: `Dispute resolved in your favor. ${formatCurrency(sellerPayout)} added to your balance.`,
            read: false,
            createdAt: Date.now()
        });

        showNotification('Dispute resolved - Seller paid', 'success');
        loadFeedback();
    } catch (error) {
        showNotification('Failed to resolve dispute', 'error');
    }
}
```

The resolveDisputeForSeller function allows administrators to resolve disputes in favor of the seller by releasing frozen funds. This action is appropriate when a buyer made a false claim or failed to return the book as required. After confirmation, the function retrieves the transaction and calculates the seller's payout by deducting the 10% commission from the transaction amount. The transaction is marked as 'completed' with resolution details. The wallet update is comprehensive: it moves funds from frozen dispute to available balance, adds to the seller's total earnings, and ensures the frozen amount is properly decremented. A notification informs the seller that the dispute was resolved in their favor and their balance has been credited. This function balances the buyer protection system by ensuring sellers are not unfairly penalized for legitimate transactions, maintaining trust from both sides of the marketplace.

---

### 8.3 Load Charts Function

```javascript
async function loadCharts() {
    const salesData = calculateSalesTrend();
    const revenueData = calculateRevenueTrend();
    const topSellersData = calculateTopSellers();
    const subjectData = calculateSubjectDistribution();

    if (salesChartInstance) salesChartInstance.destroy();
    salesChartInstance = new Chart(document.getElementById('salesChart'), {
        type: 'line',
        data: {
            labels: salesData.labels,
            datasets: [{
                label: 'Transactions',
                data: salesData.values,
                borderColor: '#6C63FF',
                tension: 0.4,
                fill: true
            }]
        }
    });

    if (revenueChartInstance) revenueChartInstance.destroy();
    revenueChartInstance = new Chart(document.getElementById('revenueChart'), {
        type: 'bar',
        data: {
            labels: revenueData.labels,
            datasets: [{
                label: 'Revenue (RM)',
                data: revenueData.values,
                backgroundColor: '#FFD700'
            }]
        }
    });

    // Additional charts for top sellers, subject distribution, etc.
}
```

The loadCharts function initializes and populates all analytical charts on the admin dashboard. It first calls calculation functions to aggregate the raw transaction and book data into chart-ready formats for sales trends, revenue trends, top sellers, and subject distribution. Before creating new chart instances, the function checks if previous instances exist and destroys them to prevent memory leaks and overlapping renders. The sales chart uses a line graph with smooth tension curves to visualize transaction volume over time, helping admins identify growth patterns and seasonal trends. The revenue chart uses bar graphs to display commission earnings, providing quick insight into platform financial health. Additional charts created in this function include top sellers with color differentiation between students and staff, and a pie chart showing book category distribution. The use of Chart.js provides responsive, interactive visualizations that update dynamically when the underlying data changes.

---

### 8.4 Export Transactions to CSV Function

```javascript
function exportTransactionsToCSV() {
    const startDate = document.getElementById('startDate')?.value;
    const endDate = document.getElementById('endDate')?.value;

    let filteredTransactions = [...allTransactions];

    if (startDate) {
        const startTimestamp = new Date(startDate).getTime();
        filteredTransactions = filteredTransactions.filter(txn => txn.createdAt >= startTimestamp);
    }
    if (endDate) {
        const endTimestamp = new Date(endDate).setHours(23, 59, 59, 999);
        filteredTransactions = filteredTransactions.filter(txn => txn.createdAt <= endTimestamp);
    }

    const headers = ['Transaction ID', 'Date', 'Buyer', 'Amount', 'Commission', 'Status', 'Bank'];
    const rows = filteredTransactions.map(txn => [
        txn.transactionId,
        new Date(txn.createdAt).toLocaleDateString(),
        txn.buyerName,
        txn.amount?.toFixed(2) || '0.00',
        txn.commissionFee?.toFixed(2) || '0.00',
        txn.status,
        txn.selectedBank || 'N/A'
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
}
```

The exportTransactionsToCSV function enables administrators to download transaction data as a spreadsheet file for external analysis or reporting. The function first checks for date range filters, allowing admins to export specific time periods rather than all historical data. Transactions are filtered based on start and end dates if provided. The function then constructs a CSV file programmatically by defining column headers and mapping each transaction to a data row containing the transaction ID, date, buyer name, amount, commission, status, and bank used. The data arrays are joined with commas and newlines to create valid CSV format. A Blob object is created from the CSV content, and a temporary download link is programmatically generated and clicked to trigger the browser's file download. The filename includes the current date for easy identification. This export capability supports administrative tasks like accounting reconciliation, dispute investigation, and business analytics using external tools like Excel.

---

## Summary

This documentation covers the core functions across all major pages of the UITM-EMPLC system. Each function has been explained in context of its role in the overall user experience and system architecture. The codebase demonstrates modern JavaScript practices including async/await patterns, Firebase real-time database integration, and comprehensive error handling throughout.

---

**Document Version:** 1.0  
**Last Updated:** January 2026  
**Project:** UITM-EMPLC (UiTM Book e-Marketplace)
