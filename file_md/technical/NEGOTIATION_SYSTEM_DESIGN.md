# Negotiation & Chat System Design

## 1. Database Structure (Firebase Realtime Database)

We will introduce two new root nodes: `offers` and `chats`.

### `offers` Node
Stores the state of negotiations.

```json
{
  "offers": {
    "$offerId": {
      "bookId": "string",
      "bookTitle": "string",
      "bookPrice": "number", // Original price
      "buyerId": "string",
      "buyerName": "string",
      "sellerId": "string",
      "sellerName": "string",
      "currentPrice": "number", // The latest agreed/proposed price
      "status": "pending", // pending, accepted, rejected, counter_offered
      "lastActionBy": "string", // uid of user who made the last move
      "createdAt": "timestamp",
      "updatedAt": "timestamp",
      "history": {
        "$historyId": {
          "action": "string", // offer, counter, accept, reject
          "price": "number",
          "timestamp": "timestamp",
          "userId": "string"
        }
      }
    }
  }
}
```

### `chats` Node
Stores the actual messages between buyer and seller. We will link chats to offers.

```json
{
  "chats": {
    "$offerId": { // Using offerId as the chat room ID for simplicity
      "messages": {
        "$messageId": {
          "senderId": "string",
          "senderName": "string",
          "text": "string",
          "type": "text", // text, system (for automated offer logs)
          "timestamp": "timestamp"
        }
      },
      "participants": {
        "$uid": true
      },
      "lastMessage": "string",
      "lastMessageTimestamp": "timestamp"
    }
  }
}
```

## 2. User Flows

### A. Buyer: Make Initial Offer
1.  **UI:** "Make Offer" button on `book-details.html`.
2.  **Action:** Opens a modal to enter offer price.
3.  **Logic:**
    *   Creates a new entry in `offers`.
    *   Creates a corresponding entry in `chats`.
    *   Sends a system message to the chat: "Buyer made an offer of RM XX.XX".
    *   Redirects user to the new `chat.html?offerId=...` page.

### B. Seller: Receive & Respond
1.  **UI:** Notification or "My Offers" section in `profile.html`.
2.  **Action:** Clicks to view offer (opens `chat.html`).
3.  **Options:**
    *   **Accept:** Updates offer status to `accepted`. System message: "Seller accepted the offer of RM XX.XX".
    *   **Reject:** Updates offer status to `rejected`. System message: "Seller rejected the offer".
    *   **Counter:** Opens modal to enter new price. Updates status to `counter_offered`. System message: "Seller sent a counter-offer of RM XX.XX".

### C. Buyer: Respond to Counter
1.  **UI:** Sees new status in chat.
2.  **Options:** Same as Seller (Accept, Reject, Counter).

## 3. Frontend Implementation Plan

### New Files
*   `chat.html`: The main interface for negotiation and messaging.
*   `assets/js/chat.js`: Logic for real-time chat and offer management.

### Modified Files
*   `book-details.html`: Add "Make Offer" button.
*   `assets/js/book-details.js`: Handle "Make Offer" click.
*   `profile.html`: Add "Negotiations" tab to list active offers.
*   `assets/js/profile.js`: Load and display list of offers.
*   `firebase-rules.json`: Update security rules for `offers` and `chats`.

## 4. Security Rules
*   **Offers:** Read/Write only if `auth.uid` matches `buyerId` or `sellerId`.
*   **Chats:** Read/Write only if `auth.uid` is in `participants`.

## 5. Spam Prevention
*   We will implement a simple client-side check first (limit 3 active offers per book per user).
*   (Future) Cloud Functions for strict rate limiting.