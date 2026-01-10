# FYP Documentation Reference: UiTM Book e-Marketplace (UITM-EMPLC)

> **PURPOSE**: This document is designed to be uploaded to an AI assistant to help generate FYP (Final Year Project) documentation and reports. It contains comprehensive technical and contextual information about the system.

---

## 📋 AI INSTRUCTIONS

**Dear AI Assistant,**

You are helping write a Final Year Project (FYP) report for a Computer Science student at UiTM (Universiti Teknologi MARA). Please use this reference document to:

1. Write in **formal academic English** suitable for university-level documentation
2. Follow the **standard FYP report structure** (Chapter 1-6)
3. Use **third person perspective** (e.g., "The system provides..." not "I created...")
4. Include **citations** where applicable (reference this system as "UITM-EMPLC")
5. Generate **proper figure/table numbering** (e.g., "Figure 4.1", "Table 5.2")
6. Use **IEEE or APA citation style** if references are needed
7. Write content that is **plagiarism-free** and original

---

## 📚 PROJECT METADATA

| Field | Value |
|-------|-------|
| **Project Title** | UiTM Book e-Marketplace (UITM-EMPLC) |
| **Full Title** | Development of a Consumer-to-Consumer (C2C) Textbook Marketplace with Escrow Payment and Warranty Protection for UiTM Tapah Campus |
| **Project Type** | Web-based Application Development |
| **Domain** | E-Commerce / Consumer-to-Consumer (C2C) Marketplace |
| **Target Users** | UiTM Students and Staff |
| **Platform** | Web Application (Responsive) |
| **Development Approach** | Agile Methodology |
| **Version** | 1.0.0 |
| **Status** | Completed / Production-Ready |

---

## CHAPTER 1: INTRODUCTION

### 1.1 Background of Study

The rising cost of textbooks has become a significant financial burden for university students globally. In Malaysia, students at Universiti Teknologi MARA (UiTM) face similar challenges, spending substantial amounts on academic materials each semester. Many textbooks become obsolete after course completion, creating an opportunity for a sustainable peer-to-peer marketplace.

**Key Statistics to Mention:**
- Average Malaysian university student spends RM 500-1,000 on textbooks per semester
- Over 80% of textbooks are used for only one semester
- Students often resort to informal channels (WhatsApp groups, bulletin boards) to buy/sell used books
- These informal methods lack buyer protection and payment security

**Current Problems:**
1. No centralized platform for UiTM students to trade textbooks
2. Informal trading lacks trust and transaction security
3. No buyer protection against fraudulent sellers
4. No standardized pricing or negotiation system
5. Geographic limitations within campus locations

### 1.2 Problem Statement

The absence of a dedicated, secure textbook trading platform within the UiTM community has created several issues:

1. **Trust Deficit**: Students are reluctant to purchase from unknown sellers due to lack of verification and accountability.

2. **Payment Insecurity**: Direct bank transfers provide no recourse if the seller fails to deliver the book as described.

3. **Limited Reach**: Informal channels (WhatsApp groups, notice boards) have limited visibility and are difficult to search.

4. **No Standardized Process**: Price negotiations, meeting arrangements, and quality verification vary widely, leading to disputes.

5. **No Buyer Protection**: If a purchased book is damaged, incorrect, or not as described, buyers have no formal complaint mechanism.

### 1.3 Project Objectives

The main objectives of this project are:

1. **To develop** a web-based Consumer-to-Consumer (C2C) marketplace platform exclusively for UiTM students and staff to buy and sell used textbooks.

2. **To implement** a secure escrow-based payment system that holds funds until transaction completion, protecting both buyers and sellers.

3. **To design** a real-time negotiation system allowing buyers to propose prices and engage in counter-offer discussions with sellers.

4. **To integrate** a 7-day warranty protection mechanism that allows buyers to claim issues if the received book does not match the listing.

5. **To create** an administrative dashboard with analytics for monitoring platform transactions, user activity, and dispute resolution.

### 1.4 Project Scope

**In Scope:**
- User registration restricted to UiTM email domains (@student.uitm.edu.my, @staff.uitm.edu.my)
- Book listing with multiple images, condition description, and pricing
- Real-time chat-based price negotiation system
- FPX payment simulation (90% success rate for testing)
- Escrow holding of funds for 7 days post-purchase
- 7-day warranty claim and dispute resolution process
- 7-day warranty claim and dispute resolution process
- Admin dashboard with System Health, Payout Queue, and interactive analytics
- Notification system for transaction updates
- PDF receipt generation

**Out of Scope:**
- Integration with actual banking APIs (FPX is simulated)
- Mobile application development (web-responsive only)
- Physical delivery/shipping services
- Multi-campus support beyond UiTM Tapah

### 1.5 Project Significance

This project contributes to:

1. **Financial Relief**: Enables students to recover costs from unused textbooks and purchase required materials at reduced prices.

2. **Sustainability**: Promotes textbook recycling within the campus community, reducing paper waste.

3. **Trust Building**: The escrow and warranty system creates a secure trading environment that encourages participation.

4. **Community Building**: Strengthens peer connections within the UiTM community through a shared platform.

5. **Technical Innovation**: Demonstrates implementation of escrow mechanics, real-time chat, and administrative analytics in a web application.

---

## CHAPTER 2: LITERATURE REVIEW (Key Points)

### 2.1 E-Commerce Marketplace Models

| Model | Description | Example |
|-------|-------------|---------|
| **B2C** | Business-to-Consumer | Amazon, Lazada |
| **C2C** | Consumer-to-Consumer | Carousell, eBay |
| **C2B** | Consumer-to-Business | Freelancer platforms |

**UITM-EMPLC Classification**: Consumer-to-Consumer (C2C) marketplace restricted to a specific community (UiTM).

### 2.2 Existing Solutions Analysis

| Platform | Strengths | Weaknesses |
|----------|-----------|------------|
| **Carousell** | Large user base, easy listing | No escrow, no buyer protection |
| **Mudah.my** | Popular in Malaysia | No verification, fraud risks |
| **Facebook Marketplace** | Social integration | No payment protection |
| **BookFinder** | Academic focus | US-centric, no local support |

**Gap Identified**: No platform offers UiTM-specific access with escrow protection and warranty claims.

### 2.3 Escrow Payment Systems

Escrow systems provide transaction security by:
1. Holding buyer payment until conditions are met
2. Releasing funds to seller only after buyer confirmation
3. Providing dispute resolution mechanism

**UITM-EMPLC Implementation**: 7-day escrow hold with warranty claim option.

### 2.4 Real-time Web Technologies

Technologies used for real-time features:
- **Firebase Realtime Database**: Synchronizes data across clients instantly
- **WebSocket-like functionality**: Firebase listeners provide push-based updates
- **Event-driven architecture**: UI updates automatically on data changes

---

## CHAPTER 3: METHODOLOGY

### 3.1 Development Methodology

**Agile Methodology** was adopted for this project because:
- Allows iterative development and continuous improvement
- Enables quick response to requirement changes
- Supports incremental delivery of features

**Sprint Breakdown:**
1. Sprint 1: Authentication and user management
2. Sprint 2: Book listing and browsing
3. Sprint 3: Negotiation and chat system
4. Sprint 4: Payment and escrow implementation
5. Sprint 5: Warranty and dispute resolution
6. Sprint 6: Admin dashboard and analytics

### 3.2 Technology Stack

| Layer | Technology | Justification |
|-------|------------|---------------|
| **Frontend** | HTML5, CSS3, JavaScript (ES6+) | Standard web technologies, no framework dependencies |
| **Backend** | Firebase Realtime Database | Real-time sync, serverless architecture |
| **Authentication** | Firebase Authentication | Secure, supports email/password |
| **Image Storage** | ImageBB API | Free tier suitable for prototype |
| **Charts** | Chart.js v4.4.1 | Open-source, easy integration |
| **PDF** | jsPDF | Client-side PDF generation |
| **Icons** | Font Awesome 6.4 | Comprehensive icon library |

### 3.3 System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │   HTML5     │  │   CSS3      │  │  JavaScript     │  │
│  │  (14 pages) │  │ (21 files)  │  │   (23 modules)  │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   SERVICE LAYER                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │ Firebase    │  │ Firebase    │  │    ImageBB      │  │
│  │    Auth     │  │ Realtime DB │  │      API        │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 3.4 Database Design

**Entity-Relationship Overview:**

| Entity | Primary Key | Relationships |
|--------|-------------|---------------|
| Users | uid | Has many Books, Transactions, Offers |
| Books | bookId | Belongs to User (seller), Has many Offers |
| Transactions | transactionId | Belongs to User (buyer), Contains Books |
| Offers | offerId | Belongs to Buyer and Seller, References Book |
| Chats | offerId | Contains Messages, Links to Offer |
| Feedback | feedbackId | Belongs to Transaction |
| Notifications | notificationId | Belongs to User (recipient) |

---

## CHAPTER 4: IMPLEMENTATION

### 4.1 System Modules

The system consists of the following main modules:

#### 4.1.1 Authentication Module

**Features:**
- UiTM email domain restriction (@student.uitm.edu.my, @staff.uitm.edu.my)
- Role detection based on ID format (10-digit = Student, 6-digit = Staff)
- Email verification requirement
- Auto-admin creation for first admin login
- Remember me functionality

**Key Code Implementation:**

```javascript
// Role identification logic (auth.js)
function determineUserRole(userId) {
    if (userId === 'admin') return 'admin';
    if (/^\d{10}$/.test(userId)) return 'student';  // 10 digits
    if (/^\d{6}$/.test(userId)) return 'staff';     // 6 digits
    return null;
}

// Email domain validation (firebase-config.js)
function validateUitmEmail(email) {
    const allowedDomains = ['@student.uitm.edu.my', '@staff.uitm.edu.my'];
    return allowedDomains.some(domain => email.endsWith(domain));
}
```

#### 4.1.2 Book Listing Module

**Features:**
- Multi-image upload (up to 5 images via ImageBB API)
- Condition categorization (New, Like New, Good, Fair)
- Subject code tagging for academic relevance
- Campus location for meetup convenience
- Real-time search and filtering

**Database Schema for Books:**

```json
{
  "bookId": {
    "title": "Data Structures and Algorithms",
    "author": "Thomas H. Cormen",
    "isbn": "978-0262033848",
    "subjectCode": "CSC203",
    "condition": "Good",
    "price": 45.00,
    "description": "Minor highlighting, otherwise perfect",
    "campusLocation": "UiTM Tapah",
    "images": ["https://i.ibb.co/..."],
    "sellerId": "uid123",
    "sellerName": "Ahmad Razif",
    "status": "available",
    "viewCount": 42,
    "createdAt": 1702450000000
  }
}
```

#### 4.1.3 Negotiation Module

**Features:**
- Real-time chat messaging
- Offer and counter-offer system
- Validation rules (minimum RM 0.50 difference, maximum 10x original price)
- Rate limiting (2-second cooldown between messages)
- System messages for automated notifications

**Counter-Offer Validation Rules:**

| Rule | Condition | Error Message |
|------|-----------|---------------|
| Positive Price | price > 0 | "Please enter a valid price greater than RM 0.00" |
| Maximum Cap | price ≤ originalPrice × 10 | "Price cannot exceed 10x the original price" |
| Minimum Difference | |newPrice - currentPrice| ≥ 0.50 | "Counter-offer must differ by at least RM 0.50" |

**Chat Rate Limiting:**

```javascript
const MESSAGE_COOLDOWN = 2000; // 2 seconds

if (Date.now() - lastMessageTime < MESSAGE_COOLDOWN) {
    const remaining = Math.ceil((MESSAGE_COOLDOWN - (Date.now() - lastMessageTime)) / 1000);
    showNotification(`Please wait ${remaining} second(s)`, "warning");
    return;
}
```

#### 4.1.4 Payment & Escrow Module

**Features:**
- FPX payment simulation (90% success rate)
- 10% platform commission on all transactions
- Escrow holding for 7 days post-payment
- Race condition prevention (validates book availability before payment)
- PDF receipt generation

**Commission Calculation:**

```javascript
const COMMISSION_RATE = 0.10; // 10%

// Example calculation:
const bookPrice = 50.00;                        // Listed price
const commission = bookPrice * COMMISSION_RATE; // RM 5.00
const buyerPays = bookPrice + commission;       // RM 55.00
const sellerReceives = bookPrice - commission;  // RM 45.00
```

**Escrow Transaction Record:**

```javascript
const transaction = {
    transactionId: 'TXN' + Date.now(),
    buyerId: currentUser.uid,
    items: paymentItems,
    amount: paymentTotal,
    basePrice: itemsSubtotal,
    commissionFee: paymentTotal - itemsSubtotal,
    status: 'payment_held',        // ESCROW status
    escrowHeldAt: Date.now(),
    autoReleaseAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
    sellerPaidOut: false
};
```

#### 4.1.5 Warranty & Dispute Module

**Features:**
- 7-day warranty period after buyer confirms receipt
- Warranty claim with issue description
- Return flow (buyer sends back, seller confirms)
- Admin resolution (refund buyer OR pay seller)
- Auto-payout after warranty expires with no issues

**Warranty Timeline:**

```
Day 0: Buyer confirms receipt → Warranty starts
Day 1-7: Buyer can claim warranty if issues
Day 7: Warranty expires → Auto-payout to seller (if no claim)
```

**Transaction Status Flow:**

```
pending_payment → payment_held → delivered → completed
                        ↓
                warranty_claimed → return_sent → return_received → refunded
                        ↓
                  dispute_open → (admin decision) → refunded OR completed
```

**Key Functions:**

```javascript
// Confirm order received - starts 7-day warranty
async function confirmOrderReceived(transactionId) {
    const warrantyExpiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000);
    
    await database.ref(`transactions/${transactionId}`).update({
        status: 'delivered',
        actualDeliveryDate: Date.now(),
        warrantyExpiresAt: warrantyExpiresAt,
        sellerPaidOut: false,
        payoutScheduledAt: warrantyExpiresAt
    });
}

// Auto-payout after warranty expires
async function processAutoPayout(transactionId, txn) {
    const commission = txn.amount * COMMISSION_RATE;
    const sellerPayout = txn.amount - commission;
    
    await database.ref(`transactions/${transactionId}`).update({
        status: 'completed',
        sellerPayoutAmount: sellerPayout
    });
    
    await database.ref(`users/${sellerId}/wallet`).update({
        balance: currentBalance + sellerPayout,
        totalEarned: totalEarned + sellerPayout
    });
}
```

#### 4.1.6 Admin Dashboard Module

**Features:**
- 8 interactive Chart.js visualizations
- Time period filters (7 days, 30 days, 90 days, All time)
- User management and search
- Feedback and dispute review
- CSV export functionality

**Dashboard Charts & Modules:**

| Chart/Module | Type | Data Displayed |
|-------|------|----------------|
| System Health | Summary | Transaction success rates & active issues |
| Payout Queue | Live List | Timer for upcoming seller payouts |
| Sales Trend | Line | Transaction count over time |
| Revenue | Bar | Commission earnings by period |
| Top Books | Horizontal Bar | Best-selling books |
| Seller Leaderboard | Horizontal Bar | Sellers by revenue (Student vs Staff) |
| Subject Distribution | Pie | Books by subject code |
| Transaction Success | Doughnut | Success vs Failure rate |
| Feedback Distribution | Bar | Ratings 1-5 count |
| Offer Funnel | Bar | Pending → Accepted → Purchased |

**Dispute Resolution Functions:**

```javascript
// Refund buyer - admin action
async function resolveDisputeForBuyer(transactionId) {
    await database.ref(`transactions/${transactionId}`).update({
        status: 'refunded',
        resolvedBy: 'admin',
        resolvedAt: Date.now()
    });
    
    // Return funds to buyer
    await updateBuyerWallet(transactionId, 'refund');
}

// Pay seller - admin action
async function resolveDisputeForSeller(transactionId) {
    await database.ref(`transactions/${transactionId}`).update({
        status: 'completed',
        resolvedBy: 'admin',
        resolvedAt: Date.now()
    });
    
    // Release funds to seller
    await processSellerPayout(transactionId);
}
```

#### 4.1.7 Notification Module

**Features:**
- Real-time notifications via Firebase listeners
- Badge counter for unread notifications
- Notification dropdown preview (last 5)
- Full notification history page
- Mark as read (individual and bulk)
- Click navigation to relevant pages

**Notification Types:**

| Type | Icon | Trigger |
|------|------|---------|
| offer | 💰 | New offer made |
| counter_offer | 🔄 | Counter-offer sent |
| offer_accepted | ✅ | Offer accepted |
| offer_rejected | ❌ | Offer rejected |
| message | 💬 | New chat message |
| payment | 💳 | Payment received |
| payout_received | 💵 | Seller received payout |
| warranty_claimed | ⚠️ | Buyer claimed warranty |
| dispute | 🚨 | Dispute opened |

### 4.2 User Interface Design

**Design Principles:**
- Glassmorphism effects (frosted glass backgrounds)
- Role-based theming (Purple for students, Gold for staff)
- Skeleton loaders for improved perceived performance
- Toast notifications for non-intrusive feedback
- Responsive design for mobile compatibility

**Color Palette:**

| Color | Hex | Usage |
|-------|-----|-------|
| Primary | #005C99 | UiTM Blue - headers, buttons |
| Secondary | #00A86B | Success states |
| Accent | #FFB81C | UiTM Gold - highlights |
| Student Theme | #7C3AED | Purple accent for students |
| Staff Theme | #D97706 | Gold accent for staff |

### 4.3 Security Implementation

**Authentication Security:**
- Firebase Authentication with email/password
- UiTM email domain restriction
- Email verification requirement
- Session management with optional persistence

**Database Security Rules:**

```json
{
  "rules": {
    "users": {
      ".read": "auth != null",
      "$uid": {
        ".write": "auth.uid == $uid || isAdmin()"
      }
    },
    "books": {
      ".read": "auth != null",
      "$bookId": {
        ".write": "isSeller($bookId) || isAdmin() || isMarkingSold()"
      }
    },
    "offers": {
      "$offerId": {
        ".read": "isParticipant($offerId)",
        ".write": "isParticipant($offerId)"
      }
    },
    "chats": {
      "$offerId": {
        ".read": "isOfferParticipant($offerId)",
        ".write": "isOfferParticipant($offerId)"
      }
    }
  }
}
```

**Client-Side Protection:**
- Input sanitization via escapeHtml() function
- XSS prevention patterns
- Rate limiting on chat messages
- Price validation on counter-offers

---

## CHAPTER 5: TESTING

### 5.1 Testing Strategy

| Test Type | Description | Tools Used |
|-----------|-------------|------------|
| Unit Testing | Individual function testing | Manual testing, console logging |
| Integration Testing | Module interaction testing | Browser DevTools |
| User Acceptance Testing | End-user scenario testing | Test users with different roles |
| Security Testing | Authentication and authorization | Firebase security rules simulator |

### 5.2 Test Cases

#### 5.2.1 Authentication Test Cases

| Test ID | Test Case | Expected Result | Status |
|---------|-----------|-----------------|--------|
| TC-A01 | Login with valid student email | Successful login, redirect to homepage | PASS |
| TC-A02 | Login with valid staff email | Successful login, redirect to homepage | PASS |
| TC-A03 | Login with non-UiTM email | Error message displayed | PASS |
| TC-A04 | Login with invalid password | Error message displayed | PASS |
| TC-A05 | Admin login with admin/admin123 | Redirect to admin dashboard | PASS |
| TC-A06 | Access admin page without admin role | Redirect to homepage | PASS |

#### 5.2.2 Negotiation Test Cases

| Test ID | Test Case | Expected Result | Status |
|---------|-----------|-----------------|--------|
| TC-N01 | Make offer below listing price | Offer submitted, seller notified | PASS |
| TC-N02 | Counter-offer with < RM 0.50 difference | Error message displayed | PASS |
| TC-N03 | Counter-offer exceeding 10x price | Error message displayed | PASS |
| TC-N04 | Accept offer | Chat closed, proceed to payment enabled | PASS |
| TC-N05 | Reject offer | Negotiation closed | PASS |
| TC-N06 | Send message within 2-second cooldown | Warning message displayed | PASS |

#### 5.2.3 Payment Test Cases

| Test ID | Test Case | Expected Result | Status |
|---------|-----------|-----------------|--------|
| TC-P01 | Complete payment (90% success rate) | Transaction created, escrow held | PASS |
| TC-P02 | Payment failure (10% failure rate) | Retry option displayed | PASS |
| TC-P03 | Purchase already-sold book | Error message, removed from cart | PASS |
| TC-P04 | Commission calculation (10%) | Correct amounts displayed | PASS |

#### 5.2.4 Warranty Test Cases

| Test ID | Test Case | Expected Result | Status |
|---------|-----------|-----------------|--------|
| TC-W01 | Confirm order received | Status changes to delivered, warranty starts | PASS |
| TC-W02 | Claim warranty within 7 days | Warranty claim modal opens | PASS |
| TC-W03 | Claim warranty after 7 days | Error message displayed | PASS |
| TC-W04 | Auto-payout after 7 days (no claim) | Seller wallet updated | PASS |
| TC-W05 | Return flow completed | Status ready for admin refund | PASS |

### 5.3 Test Credentials

| Role | ID | Password | Full Email |
|------|-----|----------|------------|
| Student | 2024745815 | 2024745815 | 2024745815@student.uitm.edu.my |
| Staff | 709265 | 70926500 | 709265@staff.uitm.edu.my |
| Admin | admin | admin123 | admin@student.uitm.edu.my |

---

## CHAPTER 6: RESULTS AND DISCUSSION

### 6.1 System Achievements

| Objective | Achievement | Evidence |
|-----------|-------------|----------|
| Develop C2C marketplace | ✅ Completed | 14 HTML pages, 23 JS modules |
| Implement escrow payment | ✅ Completed | 7-day hold with auto-payout |
| Design negotiation system | ✅ Completed | Real-time chat with counter-offers |
| Integrated warranty protection | ✅ Completed | 7-day claim period, return flow |
| Create admin dashboard | ✅ Completed | System Health, Payout Queue & Analytics |

### 6.2 System Statistics

| Metric | Value |
|--------|-------|
| Total HTML Pages | 14 |
| Total JavaScript Files | 23 |
| Total CSS Files | 21 |
| Total Lines of Code | 15,000+ |
| Firebase Collections | 7 |
| Admin Dashboard Charts | 8 |
| Notification Types | 9 |

### 6.3 Key Features Delivered

1. **UiTM-Only Authentication**: Successfully restricts access to verified UiTM email users only.

2. **Escrow Payment System**: Funds are held for 7 days, protecting both buyers and sellers.

3. **Real-time Negotiation**: Chat-based price negotiation with validation rules prevents abuse.

4. **7-Day Warranty**: Buyers can claim issues within the warranty period, with return flow support.

5. **Admin Dashboard**: Comprehensive analytics with 8 charts and dispute resolution capabilities.

6. **Role-Based Theming**: Visual differentiation between student and staff users enhances UX.

### 6.4 Limitations

1. **Simulated Payment**: FPX payment is simulated; real banking integration would require PCI compliance.

2. **Single Campus**: Currently focused on UiTM Tapah; multi-campus support would require additional logic.

3. **No Mobile App**: Web-responsive design only; native mobile apps could improve UX.

4. **Manual Dispute Resolution**: Admin must manually resolve disputes; ML-based automation could be explored.

### 6.5 Future Enhancements

1. **Real Payment Integration**: Integrate with Malaysian payment gateways (FPX, Touch 'n Go, GrabPay).

2. **Multi-Campus Expansion**: Support all UiTM campuses with location-based filtering.

3. **Mobile Application**: Develop native iOS/Android apps for better mobile experience.

4. **AI-Based Pricing**: Suggest fair prices based on book condition and market data.

5. **Automated Dispute Resolution**: Use machine learning to detect fraudulent claims.

6. **Seller Verification Badge**: Implement a trust score system based on transaction history.

---

## APPENDIX A: DATABASE SCHEMA

### A.1 Users Collection

```json
{
  "users": {
    "{uid}": {
      "email": "string",
      "fullName": "string",
      "phoneNumber": "string",
      "role": "student | staff | admin",
      "avatarUrl": "string (optional)",
      "totalSales": "number",
      "totalPurchases": "number",
      "createdAt": "timestamp",
      "wallet": {
        "balance": "number",
        "pendingEscrow": "number",
        "frozenDispute": "number",
        "totalEarned": "number"
      }
    }
  }
}
```

### A.2 Books Collection

```json
{
  "books": {
    "{bookId}": {
      "title": "string",
      "author": "string",
      "isbn": "string",
      "subjectCode": "string",
      "condition": "New | Like New | Good | Fair",
      "price": "number",
      "description": "string",
      "campusLocation": "string",
      "images": ["string"],
      "sellerId": "uid",
      "sellerName": "string",
      "status": "available | sold",
      "viewCount": "number",
      "createdAt": "timestamp"
    }
  }
}
```

### A.3 Transactions Collection

```json
{
  "transactions": {
    "{transactionId}": {
      "transactionId": "string",
      "buyerId": "uid",
      "buyerName": "string",
      "items": [{ "bookDetails": {} }],
      "amount": "number",
      "basePrice": "number",
      "commissionFee": "number",
      "status": "string",
      "escrowHeldAt": "timestamp",
      "warrantyExpiresAt": "timestamp",
      "autoReleaseAt": "timestamp",
      "sellerPaidOut": "boolean"
    }
  }
}
```

### A.4 Offers Collection

```json
{
  "offers": {
    "{offerId}": {
      "bookId": "string",
      "bookTitle": "string",
      "bookPrice": "number",
      "buyerId": "uid",
      "sellerId": "uid",
      "currentPrice": "number",
      "status": "pending | counter_offered | accepted | rejected",
      "lastActionBy": "uid",
      "createdAt": "timestamp"
    }
  }
}
```

---

## APPENDIX B: SECURITY RULES

```json
{
  "rules": {
    "users": {
      ".read": "auth != null",
      "$uid": {
        ".write": "auth != null && (auth.uid == $uid || root.child('users/' + auth.uid + '/role').val() == 'admin')",
        "wallet": {
          ".write": "auth != null",
          ".validate": "newData.child('balance').isNumber()"
        }
      }
    },
    "books": {
      ".read": "auth != null",
      "$bookId": {
        ".write": "auth != null && (!data.exists() || data.child('sellerId').val() == auth.uid || root.child('users/' + auth.uid + '/role').val() == 'admin')"
      }
    },
    "transactions": {
      ".read": "auth != null",
      "$transactionId": {
        ".write": "auth != null"
      }
    },
    "offers": {
      "$offerId": {
        ".read": "auth != null && (data.child('buyerId').val() == auth.uid || data.child('sellerId').val() == auth.uid)",
        ".write": "auth != null"
      }
    },
    "chats": {
      "$offerId": {
        ".read": "auth != null && (root.child('offers/' + $offerId + '/buyerId').val() == auth.uid || root.child('offers/' + $offerId + '/sellerId').val() == auth.uid)",
        ".write": "auth != null"
      }
    },
    "notifications": {
      ".read": "auth != null",
      "$notificationId": {
        ".write": "auth != null"
      }
    },
    "feedback": {
      ".read": "auth != null && root.child('users/' + auth.uid + '/role').val() == 'admin'",
      "$feedbackId": {
        ".write": "auth != null"
      }
    }
  }
}
```

---

## APPENDIX C: SYSTEM CONSTANTS

```javascript
// Core Constants (firebase-config.js)
const COMMISSION_RATE = 0.10;           // 10% platform fee
const WARRANTY_PERIOD_DAYS = 7;         // 7-day warranty
const AUTO_RELEASE_DAYS = 7;            // Auto-payout after 7 days

// Chat Constants (chat.js)
const MESSAGE_COOLDOWN = 2000;          // 2 seconds between messages
const MAX_MESSAGE_LENGTH = 500;         // Characters per message

// Offer Validation (chat.js)
const MIN_COUNTER_DIFFERENCE = 0.50;    // Minimum RM 0.50 difference
const MAX_PRICE_MULTIPLIER = 10;        // Max 10x original price

// Payment Simulation (payment.js)
const PAYMENT_SUCCESS_RATE = 0.90;      // 90% success rate
```

---

## APPENDIX D: FILE STRUCTURE

```
UITM-EMPLC_ver1/
├── index.html                      # Homepage
├── pages/
│   ├── admin.html                  # Admin dashboard
│   ├── login.html                  # Login page
│   ├── signup.html                 # Registration
│   ├── book-details.html           # Book details
│   ├── cart.html                   # Shopping cart
│   ├── chat.html                   # Negotiation
│   ├── feedback.html               # Feedback form
│   ├── notifications.html          # Notification history
│   ├── payment.html                # Payment processing
│   ├── profile.html                # User profile
│   ├── receipt.html                # Transaction receipt
│   └── verify-email.html           # Email verification
├── assets/
│   ├── css/ (21 files)
│   ├── js/ (23 files)
│   └── images/
├── config/
│   ├── firebase-rules.json
│   └── firebase.json
└── file_md/ (documentation)
```

---

## APPENDIX E: REFERENCES

1. Firebase Documentation. (2024). Firebase Realtime Database. Retrieved from https://firebase.google.com/docs/database

2. Chart.js Documentation. (2024). Chart.js v4.4.1. Retrieved from https://www.chartjs.org/docs/

3. Mozilla Developer Network. (2024). JavaScript ES6+ Features. Retrieved from https://developer.mozilla.org/

4. ImageBB API Documentation. (2024). Image Upload API. Retrieved from https://api.imgbb.com/

5. Font Awesome. (2024). Icon Library v6.4. Retrieved from https://fontawesome.com/

---

**END OF FYP DOCUMENTATION REFERENCE**

*Note to AI: Use this document as the primary source for generating FYP report content. Expand on sections as needed, add proper academic formatting, and ensure all content is original and plagiarism-free.*
