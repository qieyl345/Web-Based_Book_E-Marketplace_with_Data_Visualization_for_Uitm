# Changelog

All notable changes to the UiTM Book e-Marketplace project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-01-05

### 🎉 Initial Production Release

This is the first production-ready release of the UiTM Book e-Marketplace.

### Added

#### Core Features
- **UiTM Email Authentication** - Restricted to @student.uitm.edu.my and @staff.uitm.edu.my
- **Auto-Admin Creation** - First admin login creates admin account automatically
- **Role-Based Access** - Student, Staff, and Admin roles with different permissions

#### Marketplace
- **Book Listing** - Create listings with up to 5 images (ImageBB integration)
- **Search & Filter** - Real-time search by title, author, subject code
- **Condition Filter** - New, Like New, Good, Fair
- **Campus Location Filter** - Filter by campus location
- **Price Range Filter** - Min-max price filtering

#### Negotiation System
- **Make Offer** - Buyers can propose prices below listing
- **Counter-Offer** - Back-and-forth price negotiation
- **Validation Rules** - Minimum RM 0.50 difference, max 10x original price
- **Real-time Chat** - Integrated messaging with 2-second rate limiting
- **System Messages** - Auto-generated for offer actions

#### Payment & Transactions
- **FPX Simulation** - 90% success rate payment simulation
- **10% Commission** - Platform fee on all transactions
- **Escrow System** - Funds held until buyer confirms receipt
- **PDF Receipts** - Auto-generated using jsPDF

#### Warranty & Protection
- **7-Day Warranty** - Post-delivery protection period
- **Warranty Claims** - Report issues within 7 days
- **Return Flow** - Buyer sends back, seller confirms receipt
- **Auto-Payout** - Seller paid automatically after warranty expires
- **Dispute Resolution** - Admin can refund buyer or pay seller

#### Admin Dashboard
- **8 Interactive Charts** - Sales trend, revenue, disputes, etc.
- **Time Filters** - 7 days, 30 days, 90 days, all time
- **User Management** - Search and view user details
- **Feedback Review** - View all user feedback
- **Dispute Management** - Resolve warranty claims

#### Notification System
- **Real-time Notifications** - Firebase listeners for instant updates
- **Badge Counter** - Unread notification count
- **9 Notification Types** - Offers, messages, payments, etc.
- **Click Navigation** - Navigate to relevant pages

#### UI/UX
- **Glassmorphism Design** - Modern frosted glass effects
- **Role-Based Theming** - Purple for students, gold for staff
- **Skeleton Loaders** - Improved perceived performance
- **Responsive Design** - Mobile-friendly layout
- **Live Countdown Timers** - 7-day warranty countdown

### Technical
- **14 HTML Pages** - Complete page structure
- **23 JavaScript Modules** - Modular code organization
- **21 CSS Files** - Separated styling concerns
- **Firebase Realtime Database** - NoSQL data storage
- **Firebase Authentication** - Secure user management
- **Firebase Security Rules** - Role-based data protection

---

## [0.9.0] - 2025-12-XX (Pre-release)

### Added
- Escrow payment system
- 7-day warranty mechanism
- Admin dashboard charts

### Changed
- Commission rate from 0.5% to 10%
- Improved authentication flow

---

## [0.8.0] - 2025-11-XX (Development)

### Added
- Negotiation chat system
- Counter-offer validation
- Real-time messaging

### Fixed
- Authentication race condition (AUTH_FIX.md)

---

## [0.5.0] - 2025-10-XX (Early Development)

### Added
- Basic book listing
- User registration
- Shopping cart
- Simple payment simulation

---

## Future Roadmap

### [1.1.0] - Planned
- [ ] Progressive Web App (PWA) support
- [ ] Push notifications
- [ ] CSV export for admin

### [1.2.0] - Planned
- [ ] Real payment gateway integration
- [ ] Seller rating system
- [ ] Multi-campus support

### [2.0.0] - Long-term
- [ ] Mobile application
- [ ] AI-powered price suggestions
- [ ] Expand beyond books (electronics, notes, etc.)

---

## Version History Summary

| Version | Date | Milestone |
|---------|------|-----------|
| 1.0.0 | 2026-01-05 | Production Release |
| 0.9.0 | 2025-12-XX | Escrow & Warranty |
| 0.8.0 | 2025-11-XX | Negotiation System |
| 0.5.0 | 2025-10-XX | Core Features |

---

*For detailed technical changes, see the commit history and backup folder.*
