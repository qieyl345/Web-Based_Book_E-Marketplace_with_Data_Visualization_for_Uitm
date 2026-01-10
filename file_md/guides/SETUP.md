# Quick Setup Guide

## 1. Update Firebase Configuration

Edit `assets/js/firebase-config.js` and replace with your actual Firebase credentials:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_ACTUAL_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.asia-southeast1.firebasedatabase.app/",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

## 2. Firebase Setup Steps

### Create Firebase Project
1. Go to https://console.firebase.google.com
2. Click "Add project"
3. Enter project name: `uitm-emarketplace`
4. Disable Google Analytics
5. Create project

### Enable Authentication
1. In Firebase Console, go to Authentication
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable "Email/Password"
5. Save

### Setup Realtime Database
1. Go to Realtime Database
2. Click "Create database"
3. Start in test mode (for development)
4. Choose location: asia-southeast1 (Singapore)
5. Enable database

### Get Configuration
1. Click on gear icon → Project settings
2. Scroll to "Your apps"
3. Click "Web" icon
4. Register app with nickname
5. Copy firebaseConfig object

## 3. Deploy Security Rules

In Firebase Console:
1. Go to Realtime Database → Rules
2. Copy rules from `firebase-rules.json`
3. Click "Publish"

Or using Firebase CLI:
```bash
npm install -g firebase-tools
firebase login
firebase init database
firebase deploy --only database
```

## 4. ImageBB API Setup

1. Go to https://api.imgbb.com
2. Create account
3. Go to API section
4. Copy API key
5. Update in `assets/js/firebase-config.js`:
```javascript
const IMGBB_API_KEY = "YOUR_IMGBB_API_KEY";
```

## 5. Set Admin Emails

In `assets/js/firebase-config.js`, update:
```javascript
const ADMIN_EMAILS = [
    "your-admin@student.uitm.edu.my",
    "your-admin@staff.uitm.edu.my"
];
```

## 6. Run the Application

### Option 1: Direct File Access
Open `login.html` in your browser (may have CORS limitations)

### Option 2: Local Server (Recommended)

**Using Python:**
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```
Then open: http://localhost:8000

**Using Node.js:**
```bash
npx http-server
```
Then open: http://localhost:8080

**Using PHP:**
```bash
php -S localhost:8000
```

## 7. Test the Application

1. Open http://localhost:8000/login.html
2. Create account with:
   - Email: test@student.uitm.edu.my
   - Password: Test123!
3. Check email for verification link
4. After verification, login
5. Browse homepage
6. List a book
7. Add to cart
8. Test payment flow

### 7.1 Verification
Once you have tested the basic flows, you can perform a full User Acceptance Test (UAT) using the provided questionnaire:
- **[View UAT Questions](../../UAT.md)**


## 8. Default Admin Setup

To make yourself an admin:
1. Register with your UiTM email
2. In Firebase Console → Realtime Database → users
3. Find your user record
4. Change `role` from "student" or "staff" to "admin"
5. Refresh the app
6. You should now see "Admin" link in navigation

## 9. Commission Rate

Current rate: 10% (can be changed in `assets/js/firebase-config.js`)

To modify:
```javascript
const COMMISSION_RATE = 0.10; // 10%
```

## 10. Troubleshooting

### "Firebase not defined" error
- Check that Firebase scripts are loaded before your custom scripts
- Verify internet connection

### "Permission denied" errors
- Firebase security rules may be too strict
- Check that user is authenticated
- Verify rules in Firebase Console

### Images not uploading
- Check ImageBB API key
- Verify file size (max 32MB)
- Check console for errors

### Payment not working
- This is a simulation - 90% success rate is intentional
- Check browser console for errors

## 11. Production Checklist

- [ ] Update Firebase config with production settings
- [ ] Enable Firebase App Check
- [ ] Set up custom domain
- [ ] Enable HTTPS
- [ ] Configure CORS
- [ ] Set up monitoring
- [ ] Configure backups
- [ ] Set up CI/CD pipeline
- [ ] Security audit
- [ ] Performance optimization

## 12. Development Tips

### View Firebase Data
1. Go to Firebase Console
2. Select your project
3. Go to Realtime Database
4. View data in JSON format

### Monitor Authentication
1. Go to Firebase Console → Authentication
2. View users tab
3. Check email verification status

### Debug JavaScript
1. Open Developer Tools (F12)
2. Go to Console tab
3. Check for error messages
4. Use console.log() for debugging

## 13. Useful Firebase Console URLs

- Project Overview: https://console.firebase.google.com/project/YOUR_PROJECT_ID
- Authentication: https://console.firebase.google.com/project/YOUR_PROJECT_ID/authentication
- Database: https://console.firebase.google.com/project/YOUR_PROJECT_ID/database
- Storage: https://console.firebase.google.com/project/YOUR_PROJECT_ID/storage
- Functions: https://console.firebase.google.com/project/YOUR_PROJECT_ID/functions

## Need Help?

Check the main README.md for detailed documentation.
