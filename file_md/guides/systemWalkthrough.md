# UiTM Book e-Marketplace - System Walkthrough

> **Complete Guide to System Management Flow, Features & Functions**

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [User Roles & Permissions](#2-user-roles--permissions)
3. [Authentication System](#3-authentication-system)
4. [Buyer Journey](#4-buyer-journey)
5. [Seller Journey](#5-seller-journey)
6. [Negotiation System](#6-negotiation-system)
7. [Payment & Escrow System](#7-payment--escrow-system)
8. [Warranty & Dispute Resolution](#8-warranty--dispute-resolution)
9. [Admin Dashboard](#9-admin-dashboard)
10. [Notification System](#10-notification-system)
11. [Database Structure](#11-database-structure)
12. [Security Implementation](#12-security-implementation)

---

## 1. System Overview

### 1.1 What is UiTM Book e-Marketplace?

A **Consumer-to-Consumer (C2C)** web platform designed specifically for UiTM students and staff to buy, sell, and negotiate prices for used textbooks. The system promotes sustainability, affordability, and trusted transactions within the UiTM community.

### 1.2 Core Features Summary

| Feature | Description |
|---------|-------------|
| **UiTM-Only Access** | Restricted to `@student.uitm.edu.my` and `@staff.uitm.edu.my` emails |
| **Book Listing** | Sellers create listings with images, price, condition, and subject code |
| **Price Negotiation** | Buyers make offers; sellers can accept, reject, or counter |
| **Real-time Chat** | Integrated messaging within negotiation sessions |
| **Simulated Payment** | FPX simulation with 90% success rate |
| **Escrow Protection** | Funds held until buyer confirms receipt |
| **7-Day Warranty** | Post-delivery protection for buyers |
| **Admin Analytics** | 8 interactive charts with time filters |

### 1.3 Technology Stack

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

---

## 2. User Roles & Permissions

### 2.1 Role Hierarchy

```
                    ┌──────────────┐
                    │    ADMIN     │
                    │ (Full Access)│
                    └──────┬───────┘
                           │
           ┌───────────────┴───────────────┐
           ▼                               ▼
    ┌──────────────┐               ┌──────────────┐
    │    STAFF     │               │   STUDENT    │
    │ (Buy & Sell) │               │ (Buy & Sell) │
    └──────────────┘               └──────────────┘
```

### 2.2 Permission Matrix

| Action | Student | Staff | Admin |
|--------|:-------:|:-----:|:-----:|
| Browse books | ✅ | ✅ | ✅ |
| List books for sale | ✅ | ✅ | ❌ |
| Make offers | ✅ | ✅ | ❌ |
| Accept/Reject offers | ✅ | ✅ | ❌ |
| Chat in negotiations | ✅ | ✅ | ❌ |
| Purchase books | ✅ | ✅ | ❌ |
| Submit feedback | ✅ | ✅ | ❌ |
| View admin dashboard | ❌ | ❌ | ✅ |
| Resolve disputes | ❌ | ❌ | ✅ |
| View all feedback | ❌ | ❌ | ✅ |
| Manage users | ❌ | ❌ | ✅ |

### 2.3 Role Identification

| Role | Email Format | Example |
|------|-------------|---------|
| Student | 10-digit ID + `@student.uitm.edu.my` | `2024745815@student.uitm.edu.my` |
| Staff | 6-digit ID + `@staff.uitm.edu.my` | `709265@staff.uitm.edu.my` |
| Admin | `admin@student.uitm.edu.my` | Auto-created on first login |

---

## 3. Authentication System

### 3.1 Login Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         LOGIN FLOW                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  User enters ID │
                    │   & Password    │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Check ID format │
                    └────────┬────────┘
                             │
          ┌──────────────────┼──────────────────┐
          ▼                  ▼                  ▼
   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
   │  10 digits   │  │   6 digits   │  │   "admin"    │
   │   STUDENT    │  │    STAFF     │  │    ADMIN     │
   └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
          │                 │                 │
          ▼                 ▼                 ▼
   ┌──────────────────────────────────────────────────┐
   │              Append email domain                 │
   │  @student.uitm.edu.my / @staff.uitm.edu.my      │
   └────────────────────────┬─────────────────────────┘
                            │
                            ▼
                   ┌─────────────────┐
                   │ Firebase Auth   │
                   │ signInWithEmail │
                   └────────┬────────┘
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
       ┌─────────────┐             ┌─────────────┐
       │   SUCCESS   │             │   FAILURE   │
       └──────┬──────┘             └──────┬──────┘
              │                           │
              ▼                           ▼
    ┌──────────────────┐         ┌──────────────────┐
    │ Redirect based   │         │ Show error       │
    │ on role          │         │ message          │
    └──────────────────┘         └──────────────────┘
              │
    ┌─────────┴─────────┐
    ▼                   ▼
┌─────────┐       ┌─────────────┐
│ Admin → │       │ User →      │
│ admin.  │       │ index.html  │
│ html    │       │ (Homepage)  │
└─────────┘       └─────────────┘
```

### 3.2 Registration Flow

```
User fills signup form
        │
        ▼
┌─────────────────────────────────┐
│ Validate:                       │
│ • UiTM domain email only        │
│ • Password min 6 chars          │
│ • Full name required            │
│ • Phone number (optional)       │
│ • Accept terms                  │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│ Firebase createUserWithEmail... │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│ Create user profile in DB:     │
│ {                               │
│   email, fullName, phoneNumber, │
│   role: "student" or "staff",   │
│   wallet: { balance: 0 },       │
│   createdAt: timestamp          │
│ }                               │
└────────────────┬────────────────┘
                 │
                 ▼
         Send verification email
                 │
                 ▼
        Redirect to login page
```

### 3.3 Auto-Admin Creation

When logging in with `admin` + `admin123` for the first time:

1. System detects admin credentials
2. Automatically creates `admin@student.uitm.edu.my` account
3. Sets role to `admin` in database
4. Logs in and redirects to admin dashboard

**Code Location:** `assets/js/auth.js` (Lines 185-206)

---

## 4. Buyer Journey

### 4.1 Complete Buyer Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                       BUYER JOURNEY                             │
└─────────────────────────────────────────────────────────────────┘

    ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
    │  LOGIN   │ ──▶ │  BROWSE  │ ──▶ │  SELECT  │ ──▶ │  DECIDE  │
    │          │     │  BOOKS   │     │   BOOK   │     │          │
    └──────────┘     └──────────┘     └──────────┘     └────┬─────┘
                                                            │
                          ┌─────────────────────────────────┴─────┐
                          ▼                                       ▼
                   ┌──────────────┐                       ┌──────────────┐
                   │  BUY NOW     │                       │  MAKE OFFER  │
                   │  (Full Price)│                       │ (Negotiate)  │
                   └──────┬───────┘                       └──────┬───────┘
                          │                                      │
                          │                               ┌──────┴──────┐
                          │                               ▼             ▼
                          │                        ┌──────────┐  ┌───────────┐
                          │                        │ ACCEPTED │  │ REJECTED  │
                          │                        └────┬─────┘  └───────────┘
                          │                             │
                          └──────────────┬──────────────┘
                                         ▼
                                  ┌──────────────┐
                                  │   ADD TO     │
                                  │    CART      │
                                  └──────┬───────┘
                                         │
                                         ▼
                                  ┌──────────────┐
                                  │   PAYMENT    │
                                  │  (FPX Sim)   │
                                  └──────┬───────┘
                                         │
                              ┌──────────┴──────────┐
                              ▼                     ▼
                       ┌──────────┐          ┌──────────┐
                       │ SUCCESS  │          │  FAILED  │
                       │  (90%)   │          │  (10%)   │
                       └────┬─────┘          └────┬─────┘
                            │                     │
                            ▼                     ▼
                     ┌──────────────┐      ┌──────────────┐
                     │   RECEIPT    │      │   RETRY      │
                     │    PAGE      │      │   PAYMENT    │
                     └──────┬───────┘      └──────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │  MEET SELLER │
                     │  (Face-to-   │
                     │   face)      │
                     └──────┬───────┘
                            │
                            ▼
                     ┌──────────────┐
                     │   CONFIRM    │
                     │   RECEIPT    │
                     └──────┬───────┘
                            │
                            ▼
                     ┌──────────────┐
                     │  7-DAY       │
                     │  WARRANTY    │
                     └──────┬───────┘
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
       ┌──────────────┐           ┌──────────────┐
       │  NO ISSUES   │           │ CLAIM        │
       │              │           │ WARRANTY     │
       └──────┬───────┘           └──────┬───────┘
              │                          │
              ▼                          ▼
       ┌──────────────┐           ┌──────────────┐
       │ AUTO-PAYOUT  │           │   DISPUTE    │
       │ TO SELLER    │           │ RESOLUTION   │
       └──────┬───────┘           └──────────────┘
              │
              ▼
       ┌──────────────┐
       │   SUBMIT     │
       │   FEEDBACK   │
       └──────────────┘
```

### 4.2 Browse & Search Features

| Feature | Description | Location |
|---------|-------------|----------|
| **Search Bar** | Search by title, author, or subject code | Homepage header |
| **Condition Filter** | New, Like New, Good, Fair | Left sidebar |
| **Price Range** | Min-Max slider | Left sidebar |
| **Campus Filter** | Filter by campus location | Left sidebar |
| **Sort Options** | Newest, Price (Low-High, High-Low) | Above grid |
| **Grid View** | Responsive card layout | Main content |

### 4.3 Book Detail Actions

| Button | Action | Visibility |
|--------|--------|------------|
| **Add to Cart** | Add book at listed price | Buyers only |
| **Buy Now** | Add to cart + redirect to payment | Buyers only |
| **Make Offer** | Open offer modal | Buyers only |
| **Edit Book** | Open edit modal | Seller only |
| **Delete Book** | Confirm deletion | Seller only |

---

## 5. Seller Journey

### 5.1 Listing a Book

```
┌─────────────────────────────────────────────────────────────────┐
│                    SELLER: LIST A BOOK                          │
└─────────────────────────────────────────────────────────────────┘

    ┌──────────────┐
    │ Click "List  │
    │ a Book" btn  │
    └──────┬───────┘
           │
           ▼
    ┌──────────────────────────────────────────────────────┐
    │              FILL BOOK DETAILS                       │
    │  ┌─────────────────────────────────────────────────┐ │
    │  │ • Title (required)                              │ │
    │  │ • Author (required)                             │ │
    │  │ • ISBN (optional)                               │ │
    │  │ • Subject Code (required, e.g., CSC123)         │ │
    │  │ • Condition: New/Like New/Good/Fair             │ │
    │  │ • Price in RM (required)                        │ │
    │  │ • Description (optional)                        │ │
    │  │ • Campus Location (dropdown)                    │ │
    │  │ • Images (up to 5, uploaded to ImageBB)         │ │
    │  └─────────────────────────────────────────────────┘ │
    └──────────────────────────┬───────────────────────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │  Upload images to    │
                    │  ImageBB API         │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │  Save book to        │
                    │  Firebase /books     │
                    │  status: "available" │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │  Book appears in     │
                    │  homepage listing    │
                    └──────────────────────┘
```

### 5.2 Book Data Structure

```json
{
  "id": "auto-generated",
  "title": "Data Structures and Algorithms",
  "author": "Thomas H. Cormen",
  "isbn": "978-0262033848",
  "subjectCode": "CSC203",
  "condition": "Good",
  "price": 45.00,
  "description": "Minor highlighting, otherwise perfect",
  "campusLocation": "UiTM Tapah",
  "images": [
    "https://i.ibb.co/abc123/image1.jpg",
    "https://i.ibb.co/def456/image2.jpg"
  ],
  "sellerId": "uid123",
  "sellerName": "Ahmad Razif",
  "status": "available",
  "viewCount": 0,
  "createdAt": 1702450000000
}
```

### 5.3 Managing Listings

| Action | How | Location |
|--------|-----|----------|
| View my listings | Go to Profile → Listings tab | `/pages/profile.html` |
| Edit listing | Click book → Edit button | Book details page |
| Delete listing | Click book → Delete button | Book details page |
| View negotiations | Go to Profile → Negotiations tab | `/pages/profile.html` |
| Respond to offers | Check notifications or Negotiations tab | Profile page |

---

## 6. Negotiation System

### 6.1 Offer & Counter-Offer Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    NEGOTIATION FLOW                             │
└─────────────────────────────────────────────────────────────────┘

       BUYER                                           SELLER
         │                                               │
         ▼                                               │
  ┌──────────────┐                                       │
  │ Make Offer   │                                       │
  │ (e.g., RM 35)│                                       │
  └──────┬───────┘                                       │
         │                                               │
         │────────── Notification sent ─────────────────▶│
         │                                               │
         │                                        ┌──────┴──────┐
         │                                        │ Review Offer│
         │                                        └──────┬──────┘
         │                                               │
         │                          ┌────────────────────┼────────────────────┐
         │                          ▼                    ▼                    ▼
         │                   ┌──────────┐         ┌──────────┐         ┌──────────┐
         │                   │  ACCEPT  │         │  REJECT  │         │  COUNTER │
         │                   └────┬─────┘         └────┬─────┘         └────┬─────┘
         │                        │                    │                    │
         │◀───────────────────────┘                    │                    │
         │                                             │                    │
         ▼                                             ▼                    │
  ┌──────────────┐                              ┌──────────────┐            │
  │ Proceed to   │                              │ Negotiation  │            │
  │ Payment      │                              │ Closed       │            │
  └──────────────┘                              └──────────────┘            │
                                                                            │
         │◀─────────────────────────────────────────────────────────────────┘
         │
         ▼
  ┌──────────────────────────────────────────────────────────────────────────┐
  │                        BUYER'S TURN                                      │
  │  ┌──────────┐         ┌──────────┐         ┌──────────┐                  │
  │  │  ACCEPT  │         │  REJECT  │         │  COUNTER │                  │
  │  │(RM 40)   │         │          │         │ (RM 38)  │                  │
  │  └────┬─────┘         └────┬─────┘         └────┬─────┘                  │
  └───────┼───────────────────────────────────────────────────────────────────┘
          │
          ▼
   ┌──────────────┐
   │ Continue     │
   │ until        │
   │ Accept/Reject│
   └──────────────┘
```

### 6.2 Counter-Offer Validation Rules

| Rule | Validation | Error Message |
|------|------------|---------------|
| **Minimum Difference** | `|newPrice - currentPrice| >= RM 0.50` | "Counter-offer must differ by at least RM 0.50" |
| **Maximum Price** | `newPrice <= originalPrice × 10` | "Price cannot exceed 10x the original price" |
| **Positive Price** | `newPrice > 0` | "Please enter a valid price greater than RM 0.00" |

### 6.3 Chat System Features

| Feature | Description |
|---------|-------------|
| **Real-time messaging** | Firebase listener updates instantly |
| **System messages** | Auto-generated for offer actions |
| **Rate limiting** | 2-second cooldown between messages |
| **Message length** | Maximum 500 characters |
| **Participants only** | Only buyer & seller can access chat |

### 6.4 Offer Status Flow

```
                    ┌─────────────┐
                    │   PENDING   │ ◀─── Initial state
                    └──────┬──────┘
                           │
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
    │  ACCEPTED   │ │  REJECTED   │ │  COUNTER_   │
    │             │ │             │ │  OFFERED    │
    └──────┬──────┘ └─────────────┘ └──────┬──────┘
           │                               │
           │                               │
           ▼                               │
    ┌─────────────┐                        │
    │  PROCEED    │                        │
    │  TO PAYMENT │                        │
    └─────────────┘                        │
                                           │
                           ┌───────────────┼───────────────┐
                           ▼               ▼               ▼
                    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
                    │  ACCEPTED   │ │  REJECTED   │ │  COUNTER_   │
                    │             │ │             │ │  OFFERED    │
                    └─────────────┘ └─────────────┘ └─────────────┘
```

---

## 7. Payment & Escrow System

### 7.1 Payment Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      PAYMENT FLOW                               │
└─────────────────────────────────────────────────────────────────┘

    ┌──────────────┐
    │  Cart Page   │
    │ (Review)     │
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │ Click        │
    │ "Checkout"   │
    └──────┬───────┘
           │
           ▼
    ┌──────────────────────────────────────────────────────────────┐
    │                    PAYMENT PAGE                              │
    │  ┌────────────────────────────────────────────────────────┐  │
    │  │ ORDER SUMMARY                                          │  │
    │  │ ├── Book: Data Structures          RM 45.00            │  │
    │  │ ├── Subtotal                       RM 45.00            │  │
    │  │ ├── Commission (10%)               RM  4.50            │  │
    │  │ └── TOTAL                          RM 49.50            │  │
    │  └────────────────────────────────────────────────────────┘  │
    │                                                              │
    │  ┌────────────────────────────────────────────────────────┐  │
    │  │ SELECT BANK                                            │  │
    │  │ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │  │
    │  │ │ Maybank │ │  CIMB   │ │  RHB    │ │ Public  │        │  │
    │  │ └─────────┘ └─────────┘ └─────────┘ └─────────┘        │  │
    │  └────────────────────────────────────────────────────────┘  │
    │                                                              │
    │              [ PAY NOW - RM 49.50 ]                          │
    └──────────────────────────────┬───────────────────────────────┘
                                   │
                                   ▼
                        ┌──────────────────────┐
                        │  VALIDATE BOOK       │
                        │  AVAILABILITY        │
                        └──────────┬───────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    ▼                             ▼
             ┌──────────────┐              ┌──────────────┐
             │ AVAILABLE    │              │  SOLD        │
             └──────┬───────┘              └──────┬───────┘
                    │                             │
                    ▼                             ▼
             ┌──────────────┐              ┌──────────────┐
             │ PROCESS      │              │ Remove from  │
             │ PAYMENT      │              │ cart, notify │
             └──────┬───────┘              └──────────────┘
                    │
                    │ (3-second simulation)
                    │
         ┌──────────┴──────────┐
         ▼                     ▼
  ┌──────────────┐      ┌──────────────┐
  │ SUCCESS      │      │  FAILED      │
  │ (90% chance) │      │ (10% chance) │
  └──────┬───────┘      └──────┬───────┘
         │                     │
         ▼                     ▼
  ┌──────────────┐      ┌──────────────┐
  │ Create       │      │ Record       │
  │ Transaction  │      │ Failed TXN   │
  │              │      │ (Analytics)  │
  └──────┬───────┘      └──────┬───────┘
         │                     │
         ▼                     ▼
  ┌──────────────┐      ┌──────────────┐
  │ ESCROW:      │      │ Show retry   │
  │ Hold funds   │      │ option       │
  └──────┬───────┘      └──────────────┘
         │
         ▼
  ┌──────────────┐
  │ Show Receipt │
  │ Page         │
  └──────────────┘
```

### 7.2 Commission Calculation

```
Commission Rate: 10% (COMMISSION_RATE = 0.10)

Example:
  Book Price:     RM 45.00
  Commission:     RM 45.00 × 0.10 = RM 4.50
  Total Paid:     RM 49.50
  
  Seller Receives: RM 45.00 - RM 4.50 (commission) = RM 40.50
```

### 7.3 Escrow Model

```
          BUYER PAYS                        SELLER RECEIVES
              │                                   │
              ▼                                   │
       ┌──────────────┐                           │
       │ RM 49.50     │                           │
       │ (Price+Fee)  │                           │
       └──────┬───────┘                           │
              │                                   │
              ▼                                   │
       ┌──────────────────────────────────────────┐
       │            ESCROW HELD                   │
       │     seller.wallet.pendingEscrow          │
       │            += RM 45.00                   │
       └──────────────────────┬───────────────────┘
                              │
                              ▼
                     ┌─────────────────┐
                     │ Buyer confirms  │
                     │ receipt         │
                     └────────┬────────┘
                              │
                              ▼
                     ┌─────────────────┐
                     │ 7-Day Warranty  │
                     │ Period Starts   │
                     └────────┬────────┘
                              │
               ┌──────────────┴──────────────┐
               ▼                             ▼
        ┌─────────────┐               ┌─────────────┐
        │ NO ISSUES   │               │ WARRANTY    │
        │ (7 days ok) │               │ CLAIMED     │
        └──────┬──────┘               └──────┬──────┘
               │                             │
               ▼                             ▼
        ┌─────────────┐               ┌─────────────┐
        │ AUTO-PAYOUT │               │ DISPUTE     │
        │             │               │ PROCESS     │
        └──────┬──────┘               └─────────────┘
               │
               ▼
       ┌──────────────────────────────────────────┐
       │           SELLER WALLET                  │
       │  pendingEscrow -= RM 45.00               │
       │  balance += RM 40.50 (after commission)  │
       │  totalEarned += RM 40.50                 │
       └──────────────────────────────────────────┘
```

### 7.4 Transaction Status Flow

```
PENDING_PAYMENT ──▶ PAYMENT_HELD ──▶ DELIVERED ──▶ COMPLETED
        │                │               │              │
        │                │               │              └── Seller paid
        │                │               │
        │                │               └── Warranty expired, no issues
        │                │
        │                └── Buyer confirms receipt (warranty starts)
        │
        └── Payment successful, escrow active

Alternative paths:
  PAYMENT_HELD ──▶ WARRANTY_CLAIMED ──▶ RETURN_SENT ──▶ RETURN_RECEIVED ──▶ REFUNDED
  PAYMENT_HELD ──▶ DISPUTE_OPEN ──▶ REFUNDED or COMPLETED (admin decision)
  PENDING_PAYMENT ──▶ FAILED (payment rejected)
```

---

## 8. Warranty & Dispute Resolution

### 8.1 Warranty Timeline

```
     Day 0              Day 7                   Day 14
       │                  │                       │
       ▼                  ▼                       ▼
  ┌─────────┐       ┌───────────┐           ┌─────────┐
  │ DELIVERY│       │ WARRANTY  │           │ AUTO-   │
  │CONFIRMED│       │ EXPIRES   │           │ PAYOUT  │
  └────┬────┘       └───────────┘           └─────────┘
       │                  │
       │◀─── WARRANTY ───▶│
       │     PERIOD       │
       │    (7 days)      │
       │                  │
       │  Buyer can:      │
       │  • Report issue  │
       │  • Claim warranty│
       │  • Request return│
       │                  │
       ▼                  ▼
  ┌─────────────────────────────┐
  │ If no issues raised:        │
  │ Seller receives payout      │
  │ automatically on Day 7      │
  └─────────────────────────────┘
```

### 8.2 Warranty Claim Process

```
                    BUYER
                      │
                      ▼
              ┌──────────────┐
              │ Click "Claim │
              │ Warranty"    │
              └──────┬───────┘
                     │
                     ▼
              ┌──────────────────────────────────────┐
              │ SYSTEM ACTIONS:                      │
              │ 1. Move funds to frozenDispute       │
              │ 2. Status → WARRANTY_CLAIMED         │
              │ 3. Notify admin                      │
              │ 4. Notify seller                     │
              └──────────────────┬───────────────────┘
                                 │
                                 ▼
                         ┌──────────────┐
                         │   SELLER     │
                         │ Notified     │
                         └──────┬───────┘
                                │
              ┌─────────────────┴─────────────────┐
              ▼                                   ▼
       ┌──────────────┐                   ┌──────────────┐
       │ AGREE to     │                   │ DISPUTE      │
       │ Return       │                   │ (Admin)      │
       └──────┬───────┘                   └──────┬───────┘
              │                                  │
              ▼                                  ▼
       ┌──────────────┐                   ┌──────────────┐
       │ Buyer sends  │                   │ Admin        │
       │ book back    │                   │ investigates │
       └──────┬───────┘                   └──────┬───────┘
              │                                  │
              ▼                                  │
       ┌──────────────┐                          │
       │ Seller       │                          │
       │ confirms     │                          │
       │ receipt      │                          │
       └──────┬───────┘                          │
              │                                  │
              └──────────────┬───────────────────┘
                             │
              ┌──────────────┴──────────────┐
              ▼                             ▼
       ┌──────────────┐              ┌──────────────┐
       │   REFUND     │              │  PAY SELLER  │
       │   BUYER      │              │              │
       └──────────────┘              └──────────────┘
```

### 8.3 Dispute Resolution (Admin)

| Action | Effect | When to Use |
|--------|--------|-------------|
| **Refund Buyer** | Full amount returned to buyer's wallet | Book not as described, seller at fault |
| **Pay Seller** | Seller receives payout (minus commission) | Buyer's claim invalid, seller not at fault |

**Refund Flow:**
1. Admin clicks "Refund Buyer"
2. System checks `status === 'return_received'`
3. Buyer wallet: `balance += transaction.amount`
4. Seller wallet: `frozenDispute -= itemPrice`
5. Transaction status: `refunded`

**Pay Seller Flow:**
1. Admin clicks "Pay Seller"
2. Seller wallet: `balance += (itemPrice - commission)`
3. Seller wallet: `frozenDispute -= itemPrice`
4. Transaction status: `completed`

---

## 9. Admin Dashboard

### 9.1 Dashboard Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      ADMIN DASHBOARD                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────┐│
│  │ Total Users │  │Total Books  │  │Transactions │  │Revenue  ││
│  │     156     │  │     89      │  │     234     │  │RM 4,520 ││
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────┘│
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────┐ ┌─────────────────────────────┐│
│  │       SALES TREND           │ │      REVENUE CHART          ││
│  │       (Line Chart)          │ │       (Bar Chart)           ││
│  │  Filter: [7|30|90|All]      │ │  Filter: [7|30|90|All]      ││
│  │                             │ │                             ││
│  │    📈 ───────────           │ │      ▓▓▓  ▓▓▓  ▓▓▓         ││
│  │         ───────             │ │      ▓▓▓  ▓▓▓  ▓▓▓  ▓▓▓    ││
│  └─────────────────────────────┘ └─────────────────────────────┘│
│                                                                 │
│  ┌─────────────────────────────┐ ┌─────────────────────────────┐│
│  │       TOP BOOKS             │ │    SUBJECT DISTRIBUTION     ││
│  │    (Horizontal Bar)         │ │       (Pie Chart)           ││
│  │                             │ │                             ││
│  │  Book A ████████            │ │         ╭───╮               ││
│  │  Book B ██████              │ │       ╭─╯   ╰─╮             ││
│  │  Book C █████               │ │      ╭╯       ╰╮            ││
│  └─────────────────────────────┘ └─────────────────────────────┘│
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  TABS: [Dashboard] [Users] [Feedback] [Settings]                │
└─────────────────────────────────────────────────────────────────┘
```

### 9.2 All 8 Charts

| Chart | Type | Data Source | Filters |
|-------|------|-------------|---------|
| **Sales Trend** | Line | `transactions` count by date | 7/30/90/All days |
| **Revenue** | Bar | `commissionFee` sum by date | 7/30/90/All days |
| **Dispute Metrics** | Bar | Disputes by type/resolution | 7/30/90/All days |
| **Top Books** | Horizontal Bar | Book titles by sales count | None |
| **Subject Distribution** | Pie | Books by `subjectCode` | None |
| **Transaction Success** | Doughnut | Success vs Failed count | None |
| **Feedback Distribution** | Bar | Ratings 1-5 count | None |
| **Offer Funnel** | Bar | Pending→Accepted→Paid | None |

### 9.3 Admin Tabs & Functions

| Tab | Functions |
|-----|-----------|
| **Dashboard** | View stats, charts, recent transactions |
| **Users** | Search users, view details, role management |
| **Feedback** | View all reviews, resolve disputes |
| **Settings** | Platform configuration, export options |

### 9.4 User Management

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER MANAGEMENT TABLE                       │
├─────────────────────────────────────────────────────────────────┤
│ [Search: ________________]                                      │
│                                                                 │
│ ┌──────────────┬──────────────────┬────────┬───────┬──────────┐│
│ │ Name         │ Email            │ Role   │ Sales │ Actions  ││
│ ├──────────────┼──────────────────┼────────┼───────┼──────────┤│
│ │ Ahmad Razif  │ 2024...@student  │Student │   5   │ [View]   ││
│ │ Siti Aminah  │ 709265@staff     │ Staff  │   12  │ [View]   ││
│ │ Admin        │ admin@student    │ Admin  │   0   │ [View]   ││
│ └──────────────┴──────────────────┴────────┴───────┴──────────┘│
└─────────────────────────────────────────────────────────────────┘
```

**View User Modal:**
- Full profile information
- Transaction history
- Wallet balance
- Total sales/purchases
- Account creation date

---

## 10. Notification System

### 10.1 Notification Types

| Type | Icon | Trigger | Message Example |
|------|------|---------|-----------------|
| `offer` | 💰 | New offer made | "Ahmad offered RM 35 for 'Data Structures'" |
| `counter_offer` | 🔄 | Counter-offer sent | "Siti countered with RM 40" |
| `offer_accepted` | ✅ | Offer accepted | "Your offer was accepted!" |
| `offer_rejected` | ❌ | Offer rejected | "Your offer was rejected" |
| `message` | 💬 | New chat message | "New message from Ahmad" |
| `payment` | 💳 | Payment received | "Payment of RM 49.50 received" |
| `dispute` | ⚠️ | Dispute opened | "Warranty claimed on order #TXN123" |

### 10.2 Notification Flow

```
     ACTION                     SYSTEM                      USER
        │                          │                          │
        ▼                          │                          │
  ┌──────────────┐                 │                          │
  │ User makes   │                 │                          │
  │ action       │                 │                          │
  └──────┬───────┘                 │                          │
         │                         │                          │
         ▼                         │                          │
  ┌──────────────┐                 │                          │
  │ Push to      │                 │                          │
  │ /notifications│                │                          │
  └──────┬───────┘                 │                          │
         │                         │                          │
         │                         ▼                          │
         │                  ┌──────────────┐                  │
         │                  │ Firebase     │                  │
         │                  │ listener     │                  │
         │                  │ triggers     │                  │
         │                  └──────┬───────┘                  │
         │                         │                          │
         │                         ▼                          │
         │                  ┌──────────────┐                  │
         │                  │ Update UI:   │                  │
         │                  │ • Badge count│                  │
         │                  │ • Dropdown   │──────────────────▶│
         │                  │ • Sound      │                  │
         │                  │ • Browser    │                  │
         │                  │   notif      │                  │
         │                  └──────────────┘                  │
         │                                                    │
         │                                                    ▼
         │                                             ┌──────────────┐
         │                                             │ User sees    │
         │                                             │ notification │
         │                                             └──────────────┘
```

### 10.3 Notification Features

| Feature | Description |
|---------|-------------|
| **Real-time updates** | Firebase listener for instant notifications |
| **Badge counter** | Shows unread count on bell icon |
| **Dropdown preview** | Last 5 notifications in header |
| **Full history** | `/pages/notifications.html` for all |
| **Mark as read** | Individual or "Mark all as read" |
| **Click navigation** | Clicking notification opens relevant page |
| **Browser notifications** | Desktop notifications (if permitted) |
| **Sound alert** | Audio notification for new messages |

---

## 11. Database Structure

### 11.1 Firebase Realtime Database Schema

```
/ (root)
├── users/
│   └── {uid}/
│       ├── email: string
│       ├── fullName: string
│       ├── phoneNumber: string
│       ├── role: "student" | "staff" | "admin"
│       ├── avatarUrl: string (optional)
│       ├── campusLocation: string
│       ├── totalSales: number
│       ├── totalPurchases: number
│       ├── createdAt: timestamp
│       └── wallet/
│           ├── balance: number
│           ├── pendingEscrow: number
│           ├── frozenDispute: number
│           └── totalEarned: number
│
├── books/
│   └── {bookId}/
│       ├── title: string
│       ├── author: string
│       ├── isbn: string
│       ├── subjectCode: string
│       ├── condition: string
│       ├── price: number
│       ├── description: string
│       ├── campusLocation: string
│       ├── images: array<string>
│       ├── sellerId: uid
│       ├── sellerName: string
│       ├── status: "available" | "sold"
│       ├── viewCount: number
│       └── createdAt: timestamp
│
├── offers/
│   └── {offerId}/
│       ├── bookId: string
│       ├── bookTitle: string
│       ├── bookPrice: number
│       ├── buyerId: uid
│       ├── buyerName: string
│       ├── sellerId: uid
│       ├── sellerName: string
│       ├── currentPrice: number
│       ├── status: "pending" | "counter_offered" | "accepted" | "rejected"
│       ├── lastActionBy: uid
│       ├── createdAt: timestamp
│       └── updatedAt: timestamp
│
├── chats/
│   └── {offerId}/
│       ├── participants/
│       │   ├── {buyerId}: true
│       │   └── {sellerId}: true
│       ├── lastMessage: string
│       ├── lastMessageTimestamp: timestamp
│       └── messages/
│           └── {messageId}/
│               ├── senderId: uid | "system"
│               ├── senderName: string
│               ├── text: string
│               ├── type: "text" | "system"
│               └── timestamp: timestamp
│
├── transactions/
│   └── {transactionId}/
│       ├── transactionId: string
│       ├── buyerId: uid
│       ├── buyerName: string
│       ├── buyerEmail: string
│       ├── items: array<CartItem>
│       ├── amount: number
│       ├── basePrice: number
│       ├── commissionFee: number
│       ├── status: string (see status flow)
│       ├── selectedBank: string
│       ├── createdAt: timestamp
│       ├── deliveryStatus: string
│       ├── deliveredAt: timestamp
│       ├── warrantyExpiresAt: timestamp
│       ├── escrowHeldAt: timestamp
│       ├── autoReleaseAt: timestamp
│       └── sellerPaidOut: boolean
│
├── carts/
│   └── {uid}/
│       ├── items/
│       │   └── {bookId}/ (cart item details)
│       └── updatedAt: timestamp
│
├── notifications/
│   └── {notificationId}/
│       ├── recipientId: uid
│       ├── senderId: uid
│       ├── senderName: string
│       ├── type: string
│       ├── message: string
│       ├── offerId: string (optional)
│       ├── bookId: string (optional)
│       ├── read: boolean
│       └── createdAt: timestamp
│
└── feedback/
    └── {feedbackId}/
        ├── transactionId: string
        ├── buyerId: uid
        ├── buyerName: string
        ├── sellerId: uid
        ├── sellerName: string
        ├── type: "review" | "dispute"
        ├── rating: number (1-5)
        ├── comment: string
        ├── status: "pending" | "resolved"
        └── createdAt: timestamp
```

---

## 12. Security Implementation

### 12.1 Firebase Security Rules Summary

| Node | Read | Write |
|------|------|-------|
| `/users` | Authenticated users | Own profile or admin |
| `/users/$uid/wallet` | Own only | System only (via transactions) |
| `/books` | Authenticated users | Owner or admin; status change allowed for purchase |
| `/offers` | Buyer, seller, or admin | Buyer or seller in offer |
| `/chats` | Buyer or seller in offer | Buyer or seller in offer |
| `/notifications` | Own only | Authenticated users |
| `/feedback` | Admin for all, own entries | Buyer or admin |

### 12.2 Client-Side Validation

| Validation | Location | Rule |
|------------|----------|------|
| Email domain | `auth.js` | Must end with `@student.uitm.edu.my` or `@staff.uitm.edu.my` |
| Counter-offer price | `chat.js` | Difference ≥ RM 0.50, ≤ 10× original |
| Message length | `chat.js` | Maximum 500 characters |
| Message cooldown | `chat.js` | 2 seconds between messages |
| Admin access | `firebase-config.js` | `requireAdmin()` redirects non-admins |

### 12.3 Data Protection

| Protection | Implementation |
|------------|----------------|
| **User isolation** | Firebase rules ensure users can only access their own data |
| **Escrow protection** | Wallet balance cannot be directly modified by users |
| **Chat privacy** | Only offer participants can read/write to chat |
| **Feedback privacy** | Only admins can view all feedback |
| **Transaction integrity** | Status progression enforced by security rules |

---

## Quick Reference Cards

### Test Credentials

| Role | ID | Password |
|------|-----|----------|
| Student | `2024745815` | `2024745815` |
| Staff | `709265` | `70926500` |
| Admin | `admin` | `admin123` |

### Key URLs

| Page | URL |
|------|-----|
| Homepage | `/index.html` |
| Login | `/pages/login.html` |
| Signup | `/pages/signup.html` |
| Profile | `/pages/profile.html` |
| Cart | `/pages/cart.html` |
| Payment | `/pages/payment.html` |
| Chat | `/pages/chat.html?offerId=xxx` |
| Admin | `/pages/admin.html` |

### Key Constants

| Constant | Value | Location |
|----------|-------|----------|
| `COMMISSION_RATE` | 0.10 (10%) | `firebase-config.js` |
| `WARRANTY_PERIOD_DAYS` | 7 | `firebase-config.js` |
| `MESSAGE_COOLDOWN` | 2000ms | `chat.js` |
| `AUTO_RELEASE_DAYS` | 7 | `firebase-config.js` |

---

*Document Version: 1.0*  
*Last Updated: December 2024*  
*Status: Complete System Walkthrough*
