# Quick Setup Guide

## 1. Update Firebase Configuration

Edit `assets/js/firebase-config.js` with the web configuration for a Firebase project you control. This file currently contains project-specific values; do not reuse them for a different project.

```javascript
const firebaseConfig = {
    apiKey: "YOUR_ACTUAL_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.asia-southeast1.firebasedatabase.app",
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
3. Enter a project name and create the project
4. Update `assets/js/firebase-config.js` with the web app settings for this project
5. Update the default project ID in `config/.firebaserc`

### Enable Authentication
1. In Firebase Console, go to Authentication
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable "Email/Password"
5. Save

### Setup Realtime Database
1. Go to Realtime Database
2. Click "Create database"
3. Choose the database mode appropriate for your project
4. Choose location: asia-southeast1 (Singapore)
5. Enable database

### Get Configuration
1. Click on gear icon → Project settings
2. Scroll to "Your apps"
3. Click "Web" icon
4. Register app with nickname
5. Copy firebaseConfig object

## 3. Deploy Realtime Database Rules

Review `config/firebase-rules.json` for your use case before publishing. In Firebase Console, open Realtime Database → Rules, use the rules file, and publish.

Or using Firebase CLI:
```bash
npm install -g firebase-tools
firebase login
firebase deploy --config config/firebase.json --only database --project YOUR_FIREBASE_PROJECT_ID
```

## 4. ImageBB API Setup

1. Go to https://api.imgbb.com
2. Create account
3. Go to API section
4. Copy API key
5. Set your own key in `assets/js/firebase-config.js`. Any key previously published in the repository should be treated as exposed and replaced with a key you control:
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

### Local Server (Recommended)

**Using Python:**
```bash
# Python 3
python -m http.server 8000
```
Then open `http://localhost:8000/pages/login.html`.

**Using Node.js:**
```bash
npm run dev
```
Then open `http://localhost:8080/pages/login.html`.

**Using PHP:**
```bash
php -S localhost:8000
```
Then open `http://localhost:8000/pages/login.html`.

## 7. Test the Application

1. Install dependencies with `npm install` from the repository root.
2. Run `npm run dev` and open `http://localhost:8080/pages/signup.html`.
3. Register an account in the Firebase project you configured, using an email domain accepted by the application.
4. Log in using the student/staff ID or full email associated with the account.
5. Exercise the marketplace flows with accounts and data in your own project.

### 7.1 Verification
Once you have tested the basic flows, you can perform a full User Acceptance Test (UAT) using the provided questionnaire:
- **[View UAT Questions](../../UAT.md)**


## 8. Admin Setup

Create the admin account through Firebase Authentication in your own project, then assign its user record the admin role in Realtime Database. Add the account email to `ADMIN_EMAILS` in `assets/js/firebase-config.js` for the client-side admin checks. Admin accounts are no longer created automatically by the login form.

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
