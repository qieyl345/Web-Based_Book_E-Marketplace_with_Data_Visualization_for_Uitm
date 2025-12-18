# 📚 UiTM Book e-Marketplace

> A peer-to-peer textbook marketplace platform for UiTM Tapah Campus students and staff.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-ISC-green)
![Firebase](https://img.shields.io/badge/Firebase-Realtime%20Database-orange)

---

## 📑 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [System Workflows](#system-workflows)
- [Installation & Setup](#installation--setup)
- [Configuration](#configuration)
- [Usage Guide](#usage-guide)
- [Security Features](#security-features)
- [Contributing](#contributing)

---

## Overview

**UiTM Book e-Marketplace** is a web-based platform that facilitates the buying and selling of textbooks within the UiTM Tapah Campus community. The platform features a secure escrow-based payment system, real-time negotiations, warranty protection, and comprehensive admin management.

### Key Highlights

- 🔐 **UiTM-only authentication** - Restricted to `@student.uitm.edu.my` and `@staff.uitm.edu.my` domains
- 💳 **Escrow payment system** - Funds held securely until transaction completion
- 🛡️ **7-day warranty protection** - Buyer protection for quality assurance
- 💬 **Real-time negotiations** - Buyers and sellers can negotiate prices
- 📊 **Admin dashboard** - Comprehensive analytics and dispute management

---

## Features

### For Buyers
- Browse and search textbooks by title, author, or subject code
- Filter books by condition, price range, and campus location
- Add books to cart or make price offers
- Secure FPX payment simulation
- 7-day warranty protection with dispute filing

### For Sellers
- List books with multiple images (via ImageBB)
- Receive and respond to price negotiations
- Track sales and wallet balance
- Automatic payout after warranty period

### For Administrators
- Dashboard with real-time analytics
- User management and activity monitoring
- Dispute resolution (refund buyer or pay seller)
- Transaction CSV export

---

## Technology Stack

| Category | Technology |
|----------|------------|
| **Frontend** | HTML5, CSS3, JavaScript (ES6+) |
| **Backend** | Firebase Realtime Database |
| **Authentication** | Firebase Authentication |
| **Hosting** | Cloudflare Pages / http-server |
| **Image Hosting** | ImageBB API |
| **Charts** | Chart.js |
| **Icons** | Font Awesome 6.4 |

---

## Project Structure

```
UITM-EMPLC_ver1/
│
├── index.html                    # Homepage - Book browsing
│
├── pages/
│   ├── admin.html               # Admin dashboard
│   ├── auth.html                # Login/Signup page
│   ├── book-details.html        # Individual book view
│   ├── cart.html                # Shopping cart
│   ├── chat.html                # Negotiation chat
│   ├── feedback.html            # Feedback form
│   ├── notification-history.html # All notifications
│   ├── payment.html             # Payment processing
│   ├── profile.html             # User profile & history
│   └── receipt.html             # Transaction receipt
│
├── assets/
│   ├── css/
│   │   ├── styles.css           # Main stylesheet
│   │   ├── animations.css       # CSS animations
│   │   ├── skeleton-loaders.css # Loading animations
│   │   ├── uitm-glassmorphism.css # Glassmorphism effects
│   │   ├── role-based-styles.css  # Student/Staff theming
│   │   ├── transaction-timeline.css # Timeline UI
│   │   └── ... (20 CSS files total)
│   │
│   ├── js/
│   │   ├── firebase-config.js   # Firebase setup & core utilities
│   │   ├── auth.js              # Authentication logic
│   │   ├── app.js               # Shared app functionality
│   │   ├── admin.js             # Admin dashboard (2500+ lines)
│   │   ├── profile.js           # Profile & wallet (1700+ lines)
│   │   ├── payment.js           # Payment processing
│   │   ├── homepage.js          # Book browsing & filters
│   │   ├── book-details.js      # Book view & edit modal
│   │   ├── cart.js              # Shopping cart
│   │   ├── chat.js              # Negotiation system
│   │   ├── notifications.js     # Notification dropdown
│   │   ├── utils.js             # Utility helpers
│   │   └── ... (21 JS files total)
│   │
│   └── images/                  # Static assets
│
├── config/
│   ├── firebase-config.json     # Firebase credentials
│   └── firebase-rules.json      # Security rules
│
├── file_md/
│   └── systemWalkthrough.md     # System documentation
│
├── .eslintrc.json               # ESLint configuration
├── package.json                 # NPM scripts
└── README.md                    # This file
```

---

## System Workflows

### 1. Authentication Flow

```mermaid
flowchart LR
    A[Visit Site] --> B{Logged In?}
    B -->|No| C[Auth Page]
    C --> D[Sign Up / Login]
    D --> E{Valid UiTM Email?}
    E -->|No| F[Error: Invalid Domain]
    E -->|Yes| G[Email Verification]
    G --> H[Dashboard Access]
    B -->|Yes| H
```

**Key Files:**
- `pages/auth.html` - Login/Signup UI
- `assets/js/auth.js` - Authentication logic
- `assets/js/firebase-config.js` - Firebase initialization

### 2. Buyer Purchase Flow

```mermaid
flowchart TD
    A[Browse Books] --> B[View Book Details]
    B --> C{Purchase Type}
    C -->|Direct| D[Add to Cart]
    C -->|Negotiate| E[Make Offer]
    E --> F[Chat Negotiation]
    F -->|Accepted| D
    D --> G[Payment Page]
    G --> H[FPX Payment]
    H -->|Success| I[Escrow Held]
    I --> J[Receive Book]
    J --> K{Satisfied?}
    K -->|Yes| L[Confirm Receipt]
    K -->|No| M[Claim Warranty]
    L --> N[Seller Paid]
    M --> O[Admin Review]
```

**Key Files:**
- `index.html` - Book browsing
- `pages/book-details.html` - Book view
- `pages/cart.html` - Shopping cart
- `pages/payment.html` - Payment processing
- `assets/js/payment.js` - Transaction logic

### 3. Seller Flow

```mermaid
flowchart TD
    A[List New Book] --> B[Upload Images]
    B --> C[Set Price & Details]
    C --> D[Book Listed]
    D --> E{Buyer Action}
    E -->|Direct Purchase| F[Payment Received]
    E -->|Offer Made| G[Negotiate]
    G -->|Accept| F
    G -->|Reject/Counter| G
    F --> H[Wait for Confirmation]
    H --> I{7-Day Warranty}
    I -->|No Issues| J[Auto Payout]
    I -->|Dispute| K[Admin Review]
    K -->|Seller Wins| J
    K -->|Buyer Wins| L[Refunded]
```

**Key Files:**
- `assets/js/homepage.js` - Book listing modal
- `pages/profile.html` - Sales history
- `assets/js/profile.js` - Wallet & payouts

### 4. Escrow & Warranty System

```
Payment Flow:
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   BUYER PAYS  →  ESCROW HELD  →  WARRANTY PERIOD (7 Days)  │
│        │              │                   │                 │
│        │              │           ┌───────┴────────┐        │
│        │              │           │                │        │
│        │              │      No Issues        Warranty      │
│        │              │           │            Claimed      │
│        │              │           ↓                │        │
│        │              │    AUTO RELEASE       ┌────┴────┐   │
│        │              │    TO SELLER          │         │   │
│        │              │                   Refund    Seller  │
│        │              │                   Buyer     Wins    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Constants (firebase-config.js):**
```javascript
COMMISSION_RATE = 0.10        // 10% platform fee
WARRANTY_PERIOD_DAYS = 7      // 7-day protection
AUTO_RELEASE_DAYS = 7         // Auto-payout after 7 days
```

### 5. Admin Dispute Resolution

```mermaid
flowchart LR
    A[Buyer Reports Issue] --> B[Funds Frozen]
    B --> C[Admin Reviews]
    C --> D{Decision}
    D -->|Buyer Wins| E[Full Refund]
    D -->|Seller Wins| F[Release Payment]
```

**Key Files:**
- `pages/admin.html` - Admin dashboard
- `assets/js/admin.js` - Dispute resolution functions
  - `resolveDisputeForBuyer()` - Refund buyer
  - `resolveDisputeForSeller()` - Pay seller

---

## Installation & Setup

### Prerequisites
- Node.js ≥14.0.0
- npm or yarn
- Firebase project

### Quick Start

```bash
# Clone the repository
git clone https://github.com/qieyl345/UITM-EMPLC_design-ver1.git

# Navigate to project
cd UITM-EMPLC_ver1

# Install dependencies
npm install

# Start development server
npm run dev
```

### Available Scripts

```bash
npm run dev    # Start http-server on port 8080
npm run serve  # Start and open browser
npm run lint   # Run ESLint code checks
```

---

## Configuration

### Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Authentication** (Email/Password)
3. Enable **Realtime Database**
4. Update `assets/js/firebase-config.js`:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

### Database Structure

```
Firebase Realtime Database
├── users/
│   └── {uid}/
│       ├── email, fullName, phoneNumber, role
│       ├── isSeller, totalSales, totalPurchases
│       └── wallet/
│           ├── balance, pending, frozenDispute, totalEarned
│           └── payoutHistory/
│
├── books/
│   └── {bookId}/
│       ├── title, author, isbn, price, condition
│       ├── subjectCode, campusLocation, description
│       ├── sellerId, sellerName, status, images[]
│       └── createdAt, updatedAt, viewCount
│
├── transactions/
│   └── {transactionId}/
│       ├── buyerId, status, amount, basePrice, commissionFee
│       ├── items[], meetingDate, paymentMethod
│       ├── escrowHeldAt, actualDeliveryDate, warrantyExpiresAt
│       └── sellerPaidOut, sellerPayoutAmount
│
├── offers/
│   └── {offerId}/
│       ├── bookId, buyerId, sellerId
│       ├── bookPrice, currentPrice, status
│       └── lastActionBy, createdAt, updatedAt
│
├── chats/
│   └── {offerId}/
│       ├── participants, lastMessage
│       └── messages/
│
├── feedback/
│   └── {feedbackId}/
│       ├── userId, transactionId, rating, type
│       ├── comment, status, createdAt
│
├── notifications/
│   └── {notificationId}/
│       ├── recipientId, type, message, read
│       └── offerId, bookId, createdAt
│
└── carts/
    └── {userId}/
        └── items/
```

---

## Usage Guide

### User Roles

| Role | Access | Domain |
|------|--------|--------|
| **Student** | Buy, Sell, Negotiate | @student.uitm.edu.my |
| **Staff** | Buy, Sell, Negotiate | @staff.uitm.edu.my |
| **Admin** | Full Dashboard Access | Special credentials |

### Transaction Statuses

| Status | Description |
|--------|-------------|
| `pending_payment` | Awaiting payment |
| `payment_held` | Escrow active, awaiting delivery |
| `delivered` | Buyer confirmed receipt |
| `completed` | Transaction finished, seller paid |
| `warranty_claimed` | Buyer filed warranty claim |
| `return_sent` | Buyer sent item back |
| `return_received` | Seller received returned item |
| `refunded` | Buyer refunded |
| `dispute_open` | Under admin review |
| `failed` | Transaction failed |

---

## Security Features

### Authentication
- Firebase Authentication with email verification
- UiTM email domain restriction
- Session management with optional persistence

### Database Security
- Role-based access control via Firebase rules
- Users can only modify their own data
- Admin-only access for sensitive operations

### Client-Side Protection
- Input sanitization via `escapeHtml()` utility
- Form validation helpers
- XSS prevention patterns

### Financial Security
- Escrow-based payment protection
- 7-day warranty period
- Dispute resolution system
- Commission deduction at payout

---

## Core Utilities

### firebase-config.js

```javascript
// Key Functions
waitForAuth()           // Wait for Firebase auth initialization
isAdmin()               // Check if current user is admin
formatCurrency(amount)  // Format as "RM X.XX"
formatDate(timestamp)   // Format date string
showNotification(msg, type)  // Display toast notification
checkAndProcessAutoPayouts() // Process automatic payouts
```

### utils.js

```javascript
// Sanitization
escapeHtml(text)        // Prevent XSS attacks
safeSetText(el, text)   // Safe text content setter

// Performance
debounce(fn, delay)     // Debounce function calls
throttle(fn, limit)     // Throttle function calls

// Validation
isValidEmail(email)     // Email format check
isValidUitmEmail(email) // UiTM domain check
isValidPrice(value)     // Price validation
handleError(error, msg) // Consistent error handling

// UX
showSkeletonLoader(container, type, count)
```

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/NewFeature`
3. Commit changes: `git commit -m "Add NewFeature"`
4. Push to branch: `git push origin feature/NewFeature`
5. Submit a Pull Request

### Code Style
- Run `npm run lint` before committing
- Follow existing patterns in codebase
- Use ES6+ JavaScript features

---

## License

This project is licensed under the ISC License.

---

## Acknowledgments

- **UiTM Tapah Campus** - Project context
- **Firebase** - Backend infrastructure
- **ImageBB** - Image hosting
- **Chart.js** - Dashboard analytics
- **Font Awesome** - Icons

---

<p align="center">
  <strong>UiTM Book e-Marketplace</strong><br>
  Built with ❤️ for UiTM Tapah Campus
</p>
