# UiTM Book e-Marketplace

A peer-to-peer marketplace platform for buying and selling textbooks within the UiTM Tapah Campus community.

## 🚀 Features

- **User Authentication**: Secure Firebase authentication with UiTM email validation
- **Book Listings**: Create and browse book listings with images
- **Negotiation System**: Make offers and counter-offers
- **Cart & Checkout**: Shopping cart with integrated payment processing
- **Real-time Notifications**: Get instant updates on offers, messages, and transactions
- **Feedback System**: Rate transactions and report disputes
- **Admin Dashboard**: Comprehensive analytics and platform management

## 📋 Prerequisites

- Node.js (v14.0.0 or higher)
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Firebase account with Realtime Database configured
- ImageBB account for image hosting

## 🛠️ Setup Instructions

### 1. Clone the Repository

```powershell
cd "c:\Users\AQIL IMRAN\Documents\FYP\Version Design"
# Repository already cloned
cd UITM-EMPLC_ver1
```

### 2. Install Dependencies

```powershell
npm install
```

### 3. Firebase Configuration

The Firebase configuration is already set up in `assets/js/firebase-config.js`. 

**Important**: Ensure your Firebase project has:
- Realtime Database enabled (Asia Southeast 1)
- Authentication enabled (Email/Password)
- Security rules deployed from `config/firebase-rules.json`

To deploy security rules:
```powershell
firebase deploy --only database
```

### 4. Run Development Server

```powershell
npm run dev
```

The application will be available at `http://localhost:8080`

## 🧪 Test Credentials

### Regular User
- ID: `2024745815`
- Password: `2024745815`

### Admin User
- ID: `admin`
- Password: `admin123`

## 📁 Project Structure

```
UITM-EMPLC_ver1/
├── assets/
│   ├── css/              # Stylesheets
│   ├── js/               # JavaScript files
│   └── images/           # Image assets
├── pages/                # HTML pages
│   ├── admin.html        # Admin dashboard
│   ├── cart.html         # Shopping cart
│   ├── chat.html         # Offer negotiation
│   ├── payment.html      # Checkout
│   ├── profile.html      # User profile
│   └── ...
├── config/               # Configuration files
│   ├── firebase-rules.json
│   └── presentation-dummy-data.json
├── index.html            # Homepage
├── launch.html           # Landing page
└── package.json          # npm configuration
```

## 🔒 Security

- Firebase API keys are exposed in the codebase (client-side keys are public by design)
- Actual security enforced through Firebase Security Rules
- `.gitignore` configured to protect sensitive environment variables
- All database operations validated server-side via security rules

## 🎨 UI/UX Features

- **UITM Design System**: Custom glassmorphism and animations
- **Responsive Design**: Mobile-friendly interface
- **Dark Mode**: Admin dashboard with dark theme
- **Notifications**: Real-time notification system with badge counters
- **Image zoom**: Enhanced book image viewing

## 🐛 Known Issues & Fixes

### Missing CSS References

Some pages are missing `ui-fixes.css` which may affect notification icon visibility. To fix:

1. Open each of these files:
   - `index.html`
   - `pages/admin.html`
   - `pages/login.html`
   - `pages/signup.html`
   - `pages/feedback.html`
   - `pages/verify-email.html`

2. Add this line before the Font Awesome link:
   ```html
   <link rel="stylesheet" href="../assets/css/ui-fixes.css">
   ```

For detailed fix instructions, see `walkthrough.md` in the artifacts folder.

## 📊 Admin Dashboard

Access at `/pages/admin.html` with admin credentials.

Features:
- Transaction analytics with date filters
- Revenue overview
- User management
- Feedback & dispute handling
- Platform settings

## 🔄 Git Workflow

```powershell
# Check status
git status

# Stage changes
git add .

# Commit
git commit -m "Your message"

# Push
git push origin main
```

## 🚀 Deployment

### Firebase Hosting (Recommended)

```powershell
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize hosting
firebase init hosting

# Deploy
firebase deploy --only hosting
```

### Alternative: Static Hosting

The application can be deployed to any static hosting service (Netlify, Vercel, GitHub Pages):

1. Ensure all paths are relative
2. Deploy the entire directory
3. Configure rewrites for SPA behavior if needed

## 📝 Development Guidelines

### Adding New Pages

1. Create HTML file in `pages/` directory
2. Include required CSS (see existing pages as templates)
3. Add Firebase scripts and `firebase-config.js`
4. Include page-specific JavaScript

### Updating Security Rules

1. Edit `config/firebase-rules.json`
2. Deploy: `firebase deploy --only database`
3. Test thoroughly with different user roles

### Adding New Features

1. Update relevant JavaScript modules in `assets/js/`
2. Add corresponding UI in HTML
3. Test with both regular and admin users
4. Update documentation

## 🤝 Contributing

This is an academic project for UiTM. For major changes:

1. Create a feature branch
2. Make changes
3. Test thoroughly
4. Submit for review

## 📄 License

ISC License - Academic Project

## 👥 Team

UITM EMPLC Development Team  
UiTM Tapah Campus

## 📞 Support

For issues or questions about the platform, contact the development team through official UiTM channels.

---

**Version**: 1.0.0  
**Last Updated**: December 2025  
**Status**: ✅ Production Ready
