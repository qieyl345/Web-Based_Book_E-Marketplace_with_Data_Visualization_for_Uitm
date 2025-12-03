# UiTM e-Marketplace Feature Documentation

This document serves as a comprehensive guide to the features and capabilities of the UiTM e-Marketplace platform.

## 🚀 Core Features

### User Authentication & Management
- **Firebase Authentication**: Secure login and registration system.
- **Domain Validation**: Restricted access to `@student.uitm.edu.my` and `@staff.uitm.edu.my` email domains.
- **Role-Based Access Control (RBAC)**:
  - **Student**: Buy and sell books.
  - **Staff**: Buy and sell books.
  - **Admin**: Full system oversight and management.
- **Profile Management**: Users can update personal details, view transaction history, and manage listings.

### Book Management (Marketplace)
- **Listing Creation**: Sellers can list books with details (Title, Author, ISBN, Subject Code, Condition, Price).
- **Image Hosting**: Integration with ImageBB API for hosting up to 5 images per listing.
- **Search & Discovery**:
  - Real-time search by title, author, or subject code.
  - Advanced filtering by condition (New/Used), price range, and campus location.
  - Sorting options (Date, Price, Popularity).
- **View Tracking**: Tracks the number of views for each book listing.

### Shopping & Transactions
- **Shopping Cart**: Persistent cart functionality to manage multiple items.
- **Commission System**: Automated 0.5% commission calculation on transactions.
- **Payment Simulation**:
  - Realistic FPX payment gateway simulation.
  - Support for major banks (Maybank, CIMB, Public Bank, etc.).
  - 90% success rate simulation for testing purposes.
- **Receipt Generation**: Automated PDF receipt generation using `jsPDF`.

## 💬 Negotiation System (Real-Time)

### Offer Management
- **Make Offer**: Buyers can initiate negotiations by making a price offer on a book.
- **Counter Offers**: Sellers can reject, accept, or propose a counter-offer.
- **Status Tracking**: Real-time status updates (Pending, Accepted, Rejected, Counter-offered).

### Chat Interface
- **Direct Messaging**: Real-time chat between buyer and seller for each specific offer.
- **System Messages**: Automated notifications in the chat stream for offer actions (e.g., "Seller accepted offer").
- **History**: Complete audit trail of the negotiation process.

## ⭐ Feedback & Rating System

### Transaction Reviews
- **Star Rating**: 5-star visual rating system.
- **Detailed Feedback**: Text-based comments for specific transactions.
- **Dispute Reporting**: Mechanism to report issues with transactions.
- **Admin Oversight**: All feedback is flagged for admin review before being finalized (if configured) or monitored.

## 🛡️ Admin Dashboard

### Analytics & Visualization
- **Real-time Charts**: Visual data representation using `Chart.js`.
  - Sales trends over time.
  - Revenue overview.
  - Top-selling books and categories.
- **Key Metrics**: Total transactions, commission earned, active users, and total listings.

### Management Tools
- **User Management**: View and manage user accounts.
- **Feedback Moderation**: Review and act on user feedback and disputes.
- **System Configuration**: Adjustable settings for commission rates and listing limits.

## 🔧 Technical Implementation

- **Frontend**: Vanilla JavaScript, HTML5, CSS3 (Responsive Design).
- **Backend**: Firebase Realtime Database.
- **Storage**: ImageBB API for scalable image hosting.
- **Security**: Comprehensive Firebase Security Rules ensuring data privacy and integrity.

## 🗺️ Future Roadmap

The following features are planned for future updates:

- [ ] **Wishlist System**: Allow users to save books for later.
- [ ] **Notifications**: Email and push notifications for offers and messages.
- [ ] **Book Comparison**: Side-by-side comparison of book details.
- [ ] **Saved Searches**: Notify users when a book matching their criteria is listed.
- [ ] **Mobile App**: Native mobile experience (React Native/Flutter).
- [ ] **Advanced Analytics**: Deeper insights for the admin dashboard.
- [ ] **Bulk Operations**: Import/Export functionality for listings.
- [ ] **Verification Badges**: Trusted seller verification system.
- [ ] **Rental System**: Option to rent books instead of buying.
- [ ] **Recommendation Engine**: AI-driven book recommendations.
