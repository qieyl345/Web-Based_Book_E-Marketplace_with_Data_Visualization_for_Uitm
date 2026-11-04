# 📚 Book E-Marketplace with Real-Time Data Visualization

> A Firebase-backed academic book marketplace prototype for UiTM students and staff, with buying, selling, negotiation, and dashboard features.

![Platform](https://img.shields.io/badge/Platform-Web-8A2BE2?style=for-the-badge)
![Firebase](https://img.shields.io/badge/Backend-Firebase-FFCA28?style=for-the-badge)

---

## 🎯 Project Summary

This project is a **C2C book marketplace prototype** for UiTM students and staff to buy and sell used academic books. It includes account-role workflows, negotiation, an escrow-style transaction flow, 7-day warranty tracking, and dashboards for analytics.

The system is designed to reflect a realistic campus marketplace with practical business logic and a polished user interface.

---

## 🌐 Try the live demo

Open the [UiTM e-Marketplace login page](https://uitmbookmarketplace.pages.dev/pages/login).

First-time users can select **Sign Up**, register with a valid UiTM student or staff email address, and choose their role. Set a password of at least 8 characters. On successful registration, the app signs in the new account and redirects to the home page. If you need to sign in later, use your student/staff ID or full email and the password you set. Existing users can use **Forgot Password?** if needed. No shared demo credentials are provided. If registration is unavailable, the demo owner may need to provision or enable access in the hosted Firebase project.

After signing in, browse and filter book listings, open a listing for details, and use the available marketplace actions. The live site is configured with a hosted backend, so registration, profile, or marketplace data may be stored remotely. Only enter information you are comfortable submitting to that service.

## ✨ Core Features

- **Student/Staff/Admin roles** with role-aware views
- **Book listing and browsing** with search and filters
- **Real-time negotiation chat** between buyer and seller
- **Escrow-style transaction flow** with warranty tracking
- **Interactive dashboard** with Chart.js analytics
- **Notification system** for updates and actions
- **User profile, wallet, and purchase history**
- **Admin dispute resolution and platform monitoring**

---

## 🏗️ Tech Stack

| Area | Stack |
|------|-------|
| Frontend | HTML5, CSS3, JavaScript |
| Backend | Firebase Realtime Database |
| Authentication | Firebase Authentication |
| Visualization | Chart.js |
| Asset Upload | ImageBB |
| PDF Export | jsPDF |
| Styling | Custom CSS + glassmorphism UI |

---

## 🧠 Project Goals

- Build a practical marketplace for academic resource trading
- Support buyer-seller interactions
- Implement trust-building features such as escrow and warranty
- Showcase full-stack development and data visualization
- Demonstrate a scalable UI and role-based system design

---

## 📊 Implementation Highlights

- Student, staff, and admin account-role workflows
- Negotiation, transaction, and warranty flows
- Admin dashboard charts and Firebase-backed updates

---

## 🚀 Getting Started

### Prerequisites
- Node.js 14+ and npm
- A Firebase project with Email/Password Authentication and Realtime Database enabled
- Internet access for Firebase and image upload services

### Setup

```bash
git clone https://github.com/qieyl345/Web-Based_Book_E-Marketplace_with_Data_Visualization_for_Uitm.git
cd Web-Based_Book_E-Marketplace_with_Data_Visualization_for_Uitm
npm install
npm run dev
```

Open `http://localhost:8080` and choose **Login** or **Sign up**. The app is a static frontend; `npm run dev` serves it locally and does not provision Firebase services.

### Configure services

- Firebase client settings and the admin email list are in `assets/js/firebase-config.js`. They currently contain project-specific values; replace them only with values for a Firebase project you control.
- Image upload uses an ImageBB key configured in the same file. Use your own key and treat any previously published key as exposed.
- Database rules and Firebase CLI configuration are in `config/firebase-rules.json`, `config/firebase.json`, and `config/.firebaserc`. Update the project ID and review the rules for your use case before deploying. Deploy with Firebase CLI from the repository root, specifying your project explicitly: `firebase deploy --config config/firebase.json --only database --project YOUR_FIREBASE_PROJECT_ID`.
- See [`file_md/guides/SETUP.md`](file_md/guides/SETUP.md) for detailed setup steps.

Create test accounts in the Firebase project you control. No demo passwords are published here. Firebase and ImageBB configuration in the application source is project-specific and should be reviewed before connecting another project. The hard-coded admin account bootstrap has been removed; existing admin accounts continue to use ordinary Firebase login. The project owner should review and rotate any credentials previously disclosed in the source or documentation.

---

## 📁 Repository Structure

```text
Web-Based_Book_E-Marketplace_with_Data_Visualization_for_Uitm/
├── index.html
├── pages/
├── assets/
├── config/
├── docs/
├── file_md/
├── backup/
├── package.json
├── README.md
├── UAT.md
└── .gitignore
```

---

## 🔐 Account and credential note

Previously listed demo logins have been removed from the documentation. Removing them here does not disable accounts or invalidate credentials that may already have been disclosed. If those accounts are active, the project owner must reset or disable them in the associated Firebase Authentication project; this repository change does not modify any external service.

---

## 🔎 Access and transaction behavior

- Client-side UiTM email checks and role-aware UI
- Escrow-style transaction, warranty, and dispute workflows
- The repository does not establish that the application or its database rules have undergone a security review or are production-ready.

---

## 🔗 Useful Links

- GitHub Profile: [@qieyl345](https://github.com/qieyl345)
- Project Repository: [Book E-Marketplace](https://github.com/qieyl345/Web-Based_Book_E-Marketplace_with_Data_Visualization_for_Uitm)
- LinkedIn: [Aqil Imran](https://www.linkedin.com/in/aqil-imran-bin-norhidzam-05b010280/)

---

## 📝 License

No license file is present. `package.json` lists `ISC`, while prior README content claimed MIT; the intended project license is unconfirmed. Confirm it with the project owner before adding a license or making a license claim.

---

## 👤 Author

Aqil Imran Bin Norhidzam

Made with ❤️ for practical, user-centered development.
