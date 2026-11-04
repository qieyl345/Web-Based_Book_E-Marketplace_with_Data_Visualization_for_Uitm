# Justification of Chosen Techniques and Features

## Introduction

This document provides a comprehensive justification for the technological decisions and feature implementations in the UITM-EMPLC (UiTM Book e-Marketplace) system development. Each choice was evaluated against alternatives to ensure optimal balance between development efficiency, performance, security, and user experience within the academic project context.

---

## 1. Technology Stack Justification

### 1.1 Frontend Technologies

The frontend of UITM-EMPLC was developed using HTML5, CSS3, and JavaScript (ES6+). HTML5 was selected for its semantic markup capabilities, which provide better accessibility, search engine optimization, and native browser support for multimedia elements, forms, and local storage. This semantic structure is essential for creating a well-organized and maintainable web application.

CSS3 was chosen for its modern styling capabilities, including flexbox, grid layouts, transitions, and animations. These features enable responsive design and premium visual aesthetics without relying on external dependencies. By using custom CSS, the development team maintained full control over the Glassmorphism design system that gives the platform its distinctive modern appearance.

JavaScript (ES6+) was selected as the primary programming language due to its native browser support, which eliminates the need for complex build processes. Modern ES6+ features such as arrow functions, async/await patterns, template literals, and destructuring operations significantly improve code readability and maintainability throughout the application.

The decision to use vanilla JavaScript rather than popular frameworks like React, Vue, or Angular was deliberate and strategic. Vanilla JavaScript offers a lower learning curve, allowing team members to understand and maintain the codebase more easily. It also provides superior performance since there is no virtual DOM overhead, and direct DOM manipulation results in optimal application speed. Additionally, the bundle size remains minimal as no framework code needs to be shipped to the client, resulting in faster download times. The simplicity of direct Firebase SDK integration without additional abstraction layers streamlines development, while static file hosting on Cloudflare Pages eliminates the need for a build pipeline. Furthermore, maintenance is simplified as there are no dependency updates or breaking changes from framework version upgrades to manage.

### 1.2 Backend and Database Technologies

Firebase Realtime Database serves as the backend for UITM-EMPLC. This technology was selected for its real-time synchronization capabilities, which enable instant updates for notifications, chat messages, and transaction status changes. The JSON-based NoSQL structure aligns perfectly with JavaScript objects, creating a natural development workflow. Firebase also provides automatic offline support and conflict resolution, ensuring reliable data handling even when users experience network issues.

Firebase Authentication was implemented to handle user management. This service offers built-in email and password authentication with email verification capabilities. Its seamless integration with Firebase database security rules simplifies access control implementation. Firebase Authentication automatically handles session management, password reset functionality, and security token generation, reducing the complexity of authentication implementation.

The choice of Firebase over traditional backend solutions such as Node.js with MySQL was based on its real-time synchronization, JavaScript integration, and managed services. Firebase provides database rules that are evaluated server-side, but the effectiveness of this project's configured rules is not established by that fact; the current rules need project-specific review. Hosting and service limits, availability, and costs depend on project configuration and usage.

### 1.3 External Services Integration

Several external services were integrated to enhance system functionality. ImageBB API provides free image hosting with CDN delivery for book images, eliminating Firebase Storage costs while offering a simple API integration. The permanent hosting URLs ensure reliable image display across the platform.

Chart.js was selected for admin dashboard visualizations due to its lightweight footprint of only 60KB when gzipped. This canvas-based charting library offers eight chart types that cover all the visualization needs of the admin dashboard, including sales trends, revenue tracking, and user analytics. The library provides easy customization options and is responsive by default.

jsPDF enables client-side PDF generation for transaction receipts without requiring server-side processing. Users can download their receipts immediately after completing a payment, enhancing the user experience and providing documentation for transactions.

Font Awesome 6 was implemented to provide a comprehensive icon library with consistent styling throughout the application. CDN delivery ensures fast loading times, and the professional iconography enhances the user experience without requiring custom SVG creation.

---

## 2. Architecture Design Decisions

### 2.1 Serverless Architecture

UITM-EMPLC employs a serverless architecture where the client browser handles static files including HTML, CSS, and JavaScript, along with the Firebase SDK and real-time listeners. Communication occurs through HTTPS and WebSocket connections to the Firebase backend, which manages authentication services, the realtime database, and security rules. External services including ImageBB for image storage and Cloudflare Pages for static hosting and CDN distribution complete the architecture.

This serverless approach reduces the amount of application-server code to maintain. Hosting performance, backups, availability, and cost depend on the selected service plans and configuration. Database rules are evaluated on Firebase servers, but this does not demonstrate that the rules in this repository adequately protect data.

### 2.2 File Structure Organization

The project follows a logical file structure organization designed for maintainability and scalability. The pages directory contains 12 HTML pages, with separation enabling easier navigation and maintenance. The assets/css directory houses 21 CSS files organized by function, including skeleton loaders, animations, and role-based styling, which enables targeted loading and improved maintainability. The assets/js directory contains 23 JavaScript files organized by feature such as auth.js, payment.js, and chat.js, following the single responsibility principle. Configuration files are centralized in the config directory for Firebase rules and deployment settings. Comprehensive documentation is maintained separately in the file_md directory.

### 2.3 Consumer-to-Consumer Model

The Consumer-to-Consumer (C2C) business model was selected based on the target market and platform objectives. UiTM students and staff naturally trade books within their community, making a peer-to-peer marketplace the most appropriate model. The platform promotes sustainability by encouraging textbook reuse, reducing waste and costs for students. Institutional email verification creates a trusted environment where users can transact with confidence. The C2C model eliminates middlemen, enabling direct transactions between users and maximizing value for both buyers and sellers. This approach is also familiar to the target audience, being similar to successful platforms like Carousell and Mudah that are widely used in Malaysia.

---

## 3. Core Feature Justification

### 3.1 Escrow and Warranty System

The application includes an escrow-style transaction workflow and a 7-day warranty-status flow. Payment is simulated; the repository does not provide a payment processor or third-party escrow service, and the workflow does not establish that real funds are held or protected.

The application includes an automatic status and wallet-update workflow after the configured warranty period. It is not evidence of real payment settlement. Buyers can create warranty claims for admin review, but the repository does not establish that dispute outcomes are independently verified or guaranteed to be fair.

Admin resolution capabilities allow human oversight for complex disputes, maintaining user trust in the platform. Administrators have the flexibility to refund buyers or pay sellers based on the evidence presented in each case.

The 7-day warranty period was specifically chosen because it provides a standard meeting and inspection timeframe for physical goods transactions. This duration balances buyer protection with reasonable seller payout delays, matching the warranty periods of similar platforms such as Shopee Guarantee.

### 3.2 Negotiation System

The negotiation system enables buyers and sellers to agree on mutually acceptable prices before completing transactions. Real-time chat functionality, powered by Firebase listeners, enables instant message delivery and creates a natural conversation flow for price negotiations. The structured counter-offer process prevents confusion by providing clear accept and reject actions that reduce ambiguity.

Several protective measures were implemented within the negotiation system. A 10x price cap prevents abuse and trolling with unrealistic offers. A minimum difference requirement of RM 0.50 for counter-offers encourages meaningful negotiations and prevents time-wasting micro-adjustments. Rate limiting with a 2-second cooldown between messages prevents spam and protects the database from excessive write operations.

### 3.3 FPX Payment Simulation

The payment system simulates FPX (Financial Process Exchange), Malaysia's online payment gateway. The decision to implement a simulation rather than real FPX integration was based on the academic project scope, as real FPX integration requires Malaysian banking licenses and merchant registration that fall outside the project's resources.

The simulation was designed with a 90% success rate to realistically model payment failures and test the system's error handling capabilities. The bank selection interface provides an authentic Malaysian banking experience featuring major banks like Maybank, CIMB, RHB, and Public Bank. A meeting scheduler feature was included as it is essential for coordinating physical book handovers between buyers and sellers.

### 3.4 Admin Dashboard Analytics

The admin dashboard features eight interactive charts designed to provide comprehensive platform insights. The sales trend line chart shows transaction volume over time, helping identify growth patterns and seasonal trends. The revenue bar chart tracks commission earnings to monitor platform financial health. The top books visualization reveals most sold books, informing inventory and demand insights. The seller leaderboard differentiates between student and staff performance, identifying power sellers and informing engagement strategies. The subject distribution pie chart reveals popular book categories and gaps in inventory. The transaction success chart shows completion versus failure rates as a critical health metric for platform reliability. The feedback distribution chart measures user satisfaction through rating analysis. Finally, the dispute metrics visualization tracks opened versus resolved disputes along with resolution rates to ensure efficient dispute handling.

---

## 4. Security Implementation Rationale

### 4.1 Authentication Security

The sign-up code checks for UiTM student and staff email domains in the client before creating an account. The login form accepts an ID or full email. The sign-up path does not itself send an email-verification message, so verification should not be described as mandatory based on this code. These behaviors describe the current implementation and do not establish that authentication has been independently security-reviewed.

### 4.2 Firebase Security Rules

The repository includes Realtime Database rules in `config/firebase-rules.json`, but several nodes permit reads by any authenticated user and some write conditions are broader than per-user ownership. The rules require project-specific review and testing; this document does not establish that they prevent data exposure or tampering.

### 4.3 Input Sanitization

Client-side input checks and message handling are implemented in the browser. The repository does not establish that these controls prevent XSS, abuse, or invalid database writes; they should not be treated as a security assessment.

---

## 5. User Experience Design Choices

### 5.1 Visual Design System

The visual design system was carefully crafted to create a modern, premium user experience. Glassmorphism styling with frosted glass effects creates depth and visual hierarchy throughout the application. This design approach differentiates UITM-EMPLC from basic Bootstrap-based sites and provides a distinctive, memorable aesthetic.

Role-based theming uses purple accents for students and gold accents for staff members. This visual identity reinforcement enables immediate role recognition and creates a personalized experience for different user groups. Skeleton loaders with shimmer animations indicate data fetching progress, reducing perceived load times and providing better user feedback than traditional spinners or blank screens.

### 5.2 Responsive Design

Responsive design implementation follows mobile-first CSS principles, recognizing that the majority of student users access the platform via mobile devices. Native browser layout capabilities through CSS Grid and Flexbox ensure optimal performance across all devices. Adaptive components including cards, tables, and forms automatically adjust to different viewport sizes, ensuring consistent usability across desktops, tablets, and smartphones.

### 5.3 Notification System

The real-time notification system uses Firebase listeners to deliver instant notifications without polling, reducing server load and improving responsiveness. The bell icon badge follows standard UX patterns to display unread notification counts. Type-specific color-coded icons distinguish between different notification types such as offers, purchases, and disputes. Click navigation allows users to navigate directly to relevant pages from notification items, streamlining workflows.

### 5.4 Live Countdown Timer

The live countdown timer feature provides real-time visual feedback for time-sensitive transaction stages. The timer updates every second, creating urgency and keeping users informed of remaining time. Color-coded urgency indicators provide visual cues about approaching deadlines. The dual-view design shows buyers their warranty expiration countdown while showing sellers their payout release countdown, ensuring both parties have relevant information.

---

## 6. System Workflow Justification

### 6.1 Transaction Lifecycle

The application implements transaction status changes and a payment simulation. These client-side workflows do not represent a payment provider or third-party escrow service, and they do not prove that funds are held or protected. Warranty and dispute statuses describe application workflows, not an external guarantee.

### 6.2 Timeout Logic

Specific timeout logic was implemented to handle edge cases and protect all parties. If a buyer does not confirm "Order Received" within 7 days, administrators can process a refund under the assumption of non-delivery, protecting buyers from sellers who fail to complete transactions. Conversely, if a buyer claims warranty but fails to return the book within 7 days, automatic payout to the seller occurs under the assumption that the buyer has implicitly accepted the book's condition.

### 6.3 Commission Model

The platform uses a 10% commission rate on all transactions, which aligns with industry standards for C2C platforms such as Carousell and Mudah. Commission collection occurs at the point of payment, ensuring platform revenue on every successful transaction. The commission is displayed in the price breakdown during checkout, promoting transparency and building user trust.

---

## Summary

The UITM-EMPLC system was developed as an academic marketplace prototype. It includes client-side email-domain checks and a Firebase rules file; their effectiveness has not been independently assessed, and no security assurance is made here.

User experience design incorporates modern visual elements including Glassmorphism styling, skeleton loaders, and real-time updates to deliver a premium, contemporary experience. The business logic built around escrow protection, warranty periods, and dispute resolution systems protects both buyers and sellers while enabling automated processing to reduce administrative overhead. The serverless architecture ensures automatic scalability with user growth without requiring additional infrastructure management.

The project demonstrates a set of Consumer-to-Consumer marketplace workflows for the UiTM community. Production readiness, security, and independent usability outcomes are not established by the evidence included in this repository.

---

**Document Version:** 1.0  
**Last Updated:** January 2026  
**Project:** UITM-EMPLC (UiTM Book e-Marketplace)
