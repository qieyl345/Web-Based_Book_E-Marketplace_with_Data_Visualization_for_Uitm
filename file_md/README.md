# UiTM e-Marketplace - Web-Based Book Marketplace

A comprehensive web-based book e-marketplace for Universiti Teknologi Malaysia, Tapah campus that enables students and staff to buy/sell new/used books with commission-based administration, real-time negotiation system, data visualization, FPX payment simulation, and feedback system.

## Features

### Core Features
- ✅ **User Authentication** - Firebase Auth with UiTM email domain validation (@student.uitm.edu.my, @staff.uitm.edu.my)
- ✅ **Book Listing** - Sellers can list books with up to 5 images via ImageBB
- ✅ **Search & Filter** - Real-time search by title, author, subject code with price and condition filters
- ✅ **Shopping Cart** - Add, remove, and manage book purchases
- ✅ **Payment Simulation** - FPX payment simulation with 90% success rate
- ✅ **Receipt Generation** - PDF download with complete transaction details
- ✅ **Admin Dashboard** - Real-time data visualization with charts and analytics
- ✅ **User Profiles** - Edit profile, view listings, purchase/sales history
- ✅ **Role-Based Access** - Student, Staff, and Admin roles

### Negotiation System
- ✅ **Offer Management** - Buyers can make initial offers on books
- ✅ **Real-time Chat** - Direct messaging between buyers and sellers
- ✅ **Counter Offers** - Sellers and buyers can counter offer with custom prices
- ✅ **Offer Status Tracking** - Track offer status (pending, accepted, rejected, counter-offered)
- ✅ **Offer History** - Complete history of all offer interactions
- ✅ **System Messages** - Automated notifications for offer actions

### Feedback & Rating System
- ✅ **Transaction Feedback** - Buyers can rate and review sellers after transactions
- ✅ **Star Rating** - 5-star rating system with visual feedback
- ✅ **Feedback Types** - Support for general feedback and dispute reporting
- ✅ **Admin Review** - All feedback marked for admin review
- ✅ **Comment System** - Detailed written feedback for each transaction

### Additional Features
- Commission tracking (0.5% on all transactions)
- View count tracking for books
- Face-to-face meeting coordination
- Responsive design for mobile, tablet, and desktop
- Image hosting and management via ImageBB
- Firebase Realtime Database integration

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Firebase Realtime Database
- **Authentication**: Firebase Authentication
- **Image Hosting**: ImageBB API
- **Charts**: Chart.js
- **PDF Generation**: jsPDF
- **Icons**: Font Awesome 6.4.0

## Project Structure

```
UiTM e-Marketplace/
├── index.html              # Homepage with book listings
├── login.html              # Login page
├── signup.html             # Registration page
├── verify-email.html       # Email verification
├── book-details.html       # Individual book details
├── cart.html               # Shopping cart
├── payment.html            # FPX payment simulation
├── receipt.html            # Transaction receipt
├── profile.html            # User profile
├── admin.html              # Admin dashboard
├── chat.html               # Negotiation chat interface
├── feedback.html           # Transaction feedback & rating
├── firebase-rules.json     # Firebase security rules
├── NEGOTIATION_SYSTEM_DESIGN.md  # Negotiation system documentation
├── README.md               # Documentation
├── assets/
│   ├── css/
│   │   └── styles.css      # Complete UI design system
│   ├── js/
│   │   ├── firebase-config.js  # Firebase setup
│   │   ├── auth.js          # Authentication logic
│   │   ├── app.js           # Shared app functionality
│   │   ├── homepage.js      # Homepage features
│   │   ├── book-details.js  # Book details page (includes Make Offer)
│   │   ├── cart.js          # Shopping cart
│   │   ├── payment.js       # Payment processing
│   │   ├── receipt.js       # Receipt generation
│   │   ├── profile.js       # User profile
│   │   ├── admin.js         # Admin dashboard
│   │   ├── chat.js          # Negotiation chat & offers
│   │   └── verify-email.js  # Email verification
│   └── images/              # Static images
```

## Setup Instructions

### 1. Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Realtime Database
3. Enable Authentication with Email/Password
4. Add your database URL to `assets/js/firebase-config.js`
5. Deploy security rules from `firebase-rules.json`:
   ```bash
   firebase deploy --only database
   ```

### 2. ImageBB Setup

1. Create account at https://api.imgbb.com
2. Get your API key
3. Update `IMGBB_API_KEY` in `assets/js/firebase-config.js`

### 3. Configuration

Update the following in `assets/js/firebase-config.js`:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    databaseURL: "YOUR_DATABASE_URL",  // https://uitm-emarketplace-default-rtdb.asia-southeast1.firebasedatabase.app/
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

const IMGBB_API_KEY = "YOUR_IMGBB_API_KEY";  // d4ab9f9c60c5209559c71421e10bab2b
```

### 4. Admin Access

Add admin emails in `assets/js/firebase-config.js`:

```javascript
const ADMIN_EMAILS = [
    "admin@student.uitm.edu.my",
    "admin@staff.uitm.edu.my"
];
```

### 5. Running the Application

1. Open `login.html` in a web browser
2. Or serve via local web server:
   ```bash
   # Using Python
   python -m http.server 8000

   # Using Node.js
   npx http-server
   ```
3. Navigate to http://localhost:8000

## Database Schema

### Users Collection
```json
{
  "users": {
    "uid": {
      "email": "string",
      "role": "student|staff|admin",
      "fullName": "string",
      "profilePic": "string",
      "phoneNumber": "string",
      "createdAt": "timestamp",
      "totalSales": "number",
      "totalPurchases": "number",
      "isSeller": "boolean"
    }
  }
}
```

### Books Collection
```json
{
  "books": {
    "bookId": {
      "title": "string",
      "author": "string",
      "isbn": "string",
      "subjectCode": "string",
      "condition": "new|used",
      "price": "number",
      "description": "text",
      "images": ["array", "of", "ImageBB", "URLs"],
      "sellerId": "uid",
      "sellerName": "string",
      "status": "available|pending|sold",
      "campusLocation": "string",
      "createdAt": "timestamp",
      "viewCount": "number"
    }
  }
}
```

### Transactions Collection
```json
{
  "transactions": {
    "transactionId": {
      "buyerId": "uid",
      "buyerName": "string",
      "buyerEmail": "string",
      "items": "array",
      "amount": "number",
      "basePrice": "number",
      "commissionFee": "number",
      "status": "pending|completed|cancelled",
      "fpxTransactionId": "string",
      "selectedBank": "string",
      "createdAt": "timestamp",
      "meetingLocation": "string",
      "meetingDate": "timestamp"
    }
  }
}
```

### Carts Collection
```json
{
  "carts": {
    "uid": {
      "items": "object",
      "totalItems": "number"
    }
  }
}
```

### Offers Collection
```json
{
  "offers": {
    "$offerId": {
      "bookId": "string",
      "bookTitle": "string",
      "bookPrice": "number",
      "buyerId": "string",
      "buyerName": "string",
      "sellerId": "string",
      "sellerName": "string",
      "currentPrice": "number",
      "status": "pending|accepted|rejected|counter_offered",
      "lastActionBy": "string",
      "createdAt": "timestamp",
      "updatedAt": "timestamp"
    }
  }
}
```

### Chats Collection
```json
{
  "chats": {
    "$offerId": {
      "messages": {
        "$messageId": {
          "senderId": "string",
          "senderName": "string",
          "text": "string",
          "type": "text|system",
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

### Feedback Collection
```json
{
  "feedback": {
    "$feedbackId": {
      "transactionId": "string",
      "sellerId": "string",
      "buyerId": "string",
      "buyerName": "string",
      "rating": "number",
      "type": "general|dispute",
      "comment": "string",
      "createdAt": "timestamp",
      "status": "pending|reviewed"
    }
  }
}
```

## UI/UX Design System

### Color Palette
- **Primary**: #005C99 (UiTM Blue)
- **Secondary**: #00A86B (Success Green)
- **Accent**: #FFB81C (UiTM Gold)
- **Background**: #FFFFFF, #F8FAFC, #F1F5F9
- **Text**: #1E293B, #475569, #64748B

### Typography
- Font Family: Inter, Poppins, Roboto
- H1: 2.5rem
- H2: 2rem
- H3: 1.5rem
- Body: 1rem

### Components
- Cards with 12px border-radius
- Buttons with 8px border-radius
- Inputs with 8px border-radius
- Box shadows: `0 1px 3px rgba(0, 0, 0, 0.05)` and `0 4px 6px rgba(0, 0, 0, 0.07)`

## Features Implementation

### Payment Flow
1. User adds items to cart
2. Cart review with commission calculation (0.5%)
3. Bank selection (Maybank, CIMB, Public Bank, etc.)
4. FPX simulation (3-second processing)
5. 90% success rate
6. Transaction record creation
7. Receipt generation and PDF download

### Negotiation Flow
1. **Buyer makes initial offer**: Click "Make Offer" button on book details page
2. **Enter offer price**: Modal popup to enter desired price
3. **Chat session created**: Automatic redirect to chat.html with offer ID
4. **Seller receives notification**: Appears in "My Offers" section in profile
5. **Seller responses**: Accept, Reject, or Counter offer
6. **Real-time updates**: Both parties see live status updates
7. **System messages**: Automated messages for each action
8. **Finalization**: Once accepted, proceed to payment flow

### Feedback & Rating Flow
1. **Transaction completion**: Feedback link available on receipt
2. **Navigate to feedback**: Click feedback link with transaction ID and seller ID
3. **Rate transaction**: Select 1-5 stars with visual feedback
4. **Choose feedback type**: General feedback or dispute report
5. **Add comments**: Detailed written feedback
6. **Admin review**: All feedback marked pending for admin review
7. **View history**: Check past feedback in user profile

### Admin Dashboard
- Stats cards: Total transactions, Commission earned, Active users, Books listed
- Charts: Sales trend, Revenue overview, Top selling books, Subject distribution
- Tables: Recent transactions, All users
- Feedback management: View and manage user feedback
- Settings: Commission rate, Max images per book

### Search & Filter
- Real-time search with 500ms debouncing
- Filter by: condition (new/used), price range, campus location
- Sort by: date, price (low-high/high-low), popularity

## Security Rules

Firebase Realtime Database rules implemented:

### Users Collection
- Users can read/write their own data
- Admins can read/write all user data

### Books Collection
- Any authenticated user can read books
- Only seller or admin can write/update book data

### Transactions Collection
- Buyer, seller, or admin can read transaction details
- Buyer or admin can create/update transactions

### Carts Collection
- Private to each user (auth.uid must match cart owner)
- Only cart owner can read/write their cart

### Offers Collection
- Read/Write access for buyer or seller only
- Must be participant in the offer (buyerId or sellerId matches auth.uid)
- Admin has full access

### Chats Collection
- Read/Write access only to offer participants
- Participants are verified via offer ownership
- Admin has full access

### Feedback Collection
- Any authenticated user can read all feedback
- Any authenticated user can write feedback (for transactions)
- Admin can update feedback status

## Browser Compatibility

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Recent Updates (v2.0)

### Negotiation System Implementation
- **NEW**: Complete real-time negotiation system with chat interface
- **NEW**: Make Offer functionality on book details page
- **NEW**: Counter-offer capabilities for both buyers and sellers
- **NEW**: Offer status tracking (pending, accepted, rejected, counter-offered)
- **NEW**: System-generated messages for offer actions
- **NEW**: Complete offer history and audit trail

### Feedback & Rating System
- **NEW**: 5-star rating system for transactions
- **NEW**: Transaction feedback page with visual star ratings
- **NEW**: Support for general feedback and dispute reporting
- **NEW**: Admin review workflow for all feedback
- **NEW**: Feedback collection and storage in Firebase

### Technical Improvements
- **UPDATED**: Firebase security rules for offers, chats, and feedback
- **UPDATED**: Enhanced admin dashboard with feedback management
- **NEW**: NEGOTIATION_SYSTEM_DESIGN.md documentation

## Future Enhancements

- [ ] Book wishlist feature
- [ ] Notification system (email/push notifications for offers, messages)
- [ ] Book comparison feature
- [ ] Saved searches
- [ ] Mobile app development (React Native/Flutter)
- [ ] Advanced analytics for admin
- [ ] Bulk listing import/export
- [ ] Book condition verification system
- [ ] Seller verification badges
- [ ] Book rental option
- [ ] Wishlist to offer automation
- [ ] Price history charts for books
- [ ] Multi-language support (Bahasa Malaysia)
- [ ] Book recommendations based on purchase history
- [ ] Integration with university course registration system

## Troubleshooting

### Authentication Issues
- Ensure email verification is enabled in Firebase console
- Check Firebase Auth settings
- Verify email domain validation

### Image Upload Issues
- Check ImageBB API key validity
- Verify network connectivity
- Check file size limits (32MB max)

### Database Connection
- Verify Firebase configuration
- Check database URL
- Ensure rules are deployed

## Support

For issues and questions:
- Email: support@uitm-marketplace.edu.my
- Documentation: Refer to this README
- Firebase Docs: https://firebase.google.com/docs

## License

This project is developed for UiTM Tapah Campus educational purposes.

## Contributors

- UiTM Tapah Campus Development Team

---

**UiTM e-Marketplace** - Empowering academic community through digital book trading
