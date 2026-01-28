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

The choice of Firebase over traditional backend solutions such as Node.js with MySQL was based on several factors. Firebase provides native WebSocket-based real-time synchronization, eliminating the need for polling or manual WebSocket implementation. The platform offers automatic horizontal scaling handled by Google's infrastructure, removing concerns about server capacity during peak usage. Development speed is significantly improved since no server code needs to be written, tested, or deployed. The cost efficiency of Firebase's generous free tier, which includes 1GB of database storage and 50,000 reads per day, supported the project's budget constraints while the pay-as-you-scale model ensures cost control as usage grows. Declarative JSON security rules enforce access control at the database level without custom middleware. Finally, integrated hosting with global CDN distribution ensures fast content delivery worldwide.

### 1.3 External Services Integration

Several external services were integrated to enhance system functionality. ImageBB API provides free image hosting with CDN delivery for book images, eliminating Firebase Storage costs while offering a simple API integration. The permanent hosting URLs ensure reliable image display across the platform.

Chart.js was selected for admin dashboard visualizations due to its lightweight footprint of only 60KB when gzipped. This canvas-based charting library offers eight chart types that cover all the visualization needs of the admin dashboard, including sales trends, revenue tracking, and user analytics. The library provides easy customization options and is responsive by default.

jsPDF enables client-side PDF generation for transaction receipts without requiring server-side processing. Users can download their receipts immediately after completing a payment, enhancing the user experience and providing documentation for transactions.

Font Awesome 6 was implemented to provide a comprehensive icon library with consistent styling throughout the application. CDN delivery ensures fast loading times, and the professional iconography enhances the user experience without requiring custom SVG creation.

---

## 2. Architecture Design Decisions

### 2.1 Serverless Architecture

UITM-EMPLC employs a serverless architecture where the client browser handles static files including HTML, CSS, and JavaScript, along with the Firebase SDK and real-time listeners. Communication occurs through HTTPS and WebSocket connections to the Firebase backend, which manages authentication services, the realtime database, and security rules. External services including ImageBB for image storage and Cloudflare Pages for static hosting and CDN distribution complete the architecture.

This serverless approach was justified by several key benefits. There is zero DevOps overhead since Firebase handles scaling, backups, and availability automatically. Global performance is ensured through Cloudflare's CDN, which provides low latency for users worldwide. Cost optimization is achieved as the platform only pays for actual usage with no idle server costs. Security is enforced through database rules that execute on Firebase servers and cannot be bypassed by client-side code.

### 2.2 File Structure Organization

The project follows a logical file structure organization designed for maintainability and scalability. The pages directory contains 12 HTML pages, with separation enabling easier navigation and maintenance. The assets/css directory houses 21 CSS files organized by function, including skeleton loaders, animations, and role-based styling, which enables targeted loading and improved maintainability. The assets/js directory contains 23 JavaScript files organized by feature such as auth.js, payment.js, and chat.js, following the single responsibility principle. Configuration files are centralized in the config directory for Firebase rules and deployment settings. Comprehensive documentation is maintained separately in the file_md directory.

### 2.3 Consumer-to-Consumer Model

The Consumer-to-Consumer (C2C) business model was selected based on the target market and platform objectives. UiTM students and staff naturally trade books within their community, making a peer-to-peer marketplace the most appropriate model. The platform promotes sustainability by encouraging textbook reuse, reducing waste and costs for students. Institutional email verification creates a trusted environment where users can transact with confidence. The C2C model eliminates middlemen, enabling direct transactions between users and maximizing value for both buyers and sellers. This approach is also familiar to the target audience, being similar to successful platforms like Carousell and Mudah that are widely used in Malaysia.

---

## 3. Core Feature Justification

### 3.1 Escrow and Warranty System

The escrow and warranty system represents one of the most critical features of UITM-EMPLC. When a buyer completes payment, the funds are held in escrow for a 7-day period. This protects buyers from non-delivery and quality issues while ensuring sellers receive payment once transactions are successfully completed. The 7-day warranty period is an industry-standard protection timeframe used by major C2C platforms worldwide.

The automatic payout mechanism reduces administrative workload by releasing funds automatically if no disputes are raised during the warranty period. This ensures sellers receive their payments predictably without requiring manual intervention. When buyers encounter issues, the warranty claims system provides a formal dispute process that ensures fair resolution with a complete documentation trail for admin review.

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

The authentication system implements several security measures to protect the platform and its users. UiTM email restriction limits access to users with @student.uitm.edu.my and @staff.uitm.edu.my email domains only. This creates a trusted, verified community and prevents external bad actors from accessing the platform. Mandatory email verification ensures that users actually own the email addresses they register with, reducing fake accounts and spam.

Role identification is automated based on user ID format, where 10-digit IDs indicate students and 6-digit IDs indicate staff members. This follows Malaysian education standards and enables automatic role assignment. Firebase handles secure token storage, refresh operations, and automatic session expiry, ensuring robust session management without custom implementation.

### 4.2 Firebase Security Rules

Firebase security rules provide server-side enforcement of access control. All database reads require user authentication, ensuring no public data exposure. Write operations are restricted so that users can only modify their own data, preventing tampering with other users' information. Administrators have override capabilities to access all data for platform moderation purposes. Since these rules execute on Firebase servers, they cannot be bypassed by client-side manipulation.

### 4.3 Input Sanitization

Multiple input sanitization techniques protect the platform from various attack vectors. DOMPurify provides HTML sanitization for user-generated content, preventing cross-site scripting (XSS) attacks in descriptions and chat messages. Input validation occurs both on the client side and through Firebase rules, preventing invalid data entry and database corruption. Rate limiting with a 2-second cooldown on chat messages prevents spam and denial-of-service attacks. Character limits of 500 characters maximum for messages control database size and prevent abuse.

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

The transaction lifecycle was designed with clear status transitions that protect both buyers and sellers. When checkout is initiated, the transaction enters pending_payment status, separating user intent from actual payment. Upon successful payment, the payment_held status indicates that escrow protection is activated. When the buyer confirms receipt, the transaction moves to delivered status and the warranty period begins. If no issues are reported within 7 days, the transaction automatically moves to completed status and the seller receives payment. If the buyer claims warranty within the protection period, the transaction enters warranty_claimed status and the dispute process begins. When a buyer sends a book back, the return_sent status indicates the item is in transit. Upon admin resolution favoring the buyer, the refunded status indicates the buyer has received a full refund.

### 6.2 Timeout Logic

Specific timeout logic was implemented to handle edge cases and protect all parties. If a buyer does not confirm "Order Received" within 7 days, administrators can process a refund under the assumption of non-delivery, protecting buyers from sellers who fail to complete transactions. Conversely, if a buyer claims warranty but fails to return the book within 7 days, automatic payout to the seller occurs under the assumption that the buyer has implicitly accepted the book's condition.

### 6.3 Commission Model

The platform uses a 10% commission rate on all transactions, which aligns with industry standards for C2C platforms such as Carousell and Mudah. Commission collection occurs at the point of payment, ensuring platform revenue on every successful transaction. The commission is displayed in the price breakdown during checkout, promoting transparency and building user trust.

---

## Summary

The UITM-EMPLC system was developed with careful consideration of multiple factors across all aspects of the platform. Technology selection prioritized the optimal balance of development speed, performance, and cost efficiency appropriate for an academic project scope. The security architecture implements multiple layers including email domain restriction, Firebase security rules, and comprehensive input sanitization to create a trusted environment for users.

User experience design incorporates modern visual elements including Glassmorphism styling, skeleton loaders, and real-time updates to deliver a premium, contemporary experience. The business logic built around escrow protection, warranty periods, and dispute resolution systems protects both buyers and sellers while enabling automated processing to reduce administrative overhead. The serverless architecture ensures automatic scalability with user growth without requiring additional infrastructure management.

Each decision was made to balance academic feasibility with production-quality implementation, resulting in a fully functional Consumer-to-Consumer marketplace specifically tailored for the UiTM community. The platform successfully demonstrates how modern web technologies can be combined to create a secure, user-friendly, and efficient online marketplace.

---

**Document Version:** 1.0  
**Last Updated:** January 2026  
**Project:** UITM-EMPLC (UiTM Book e-Marketplace)
