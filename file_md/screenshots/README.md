# Screenshot Guide for Chapter Documentation

This folder is for storing screenshots referenced in Chapters 4, 5, and 6.

## Required Screenshots

### Chapter 4 Screenshots (System Implementation)

| Filename | Description | How to Capture |
|----------|-------------|----------------|
| `4.4.1_login_page.png` | Login page interface | Go to `/pages/login.html` and take screenshot |
| `4.4.2_book_listing.png` | Homepage with filter sidebar | Go to `/index.html` with some books listed |
| `4.4.3_chat_interface.png` | Negotiation chat room | Create an offer and open the chat page |
| `4.4.4_payment_page.png` | FPX bank selection | Go to `/pages/payment.html` with items in cart |
| `4.4.5_admin_dashboard.png` | Admin dashboard with charts | Login as admin, screenshot the full dashboard |

### Chapter 5 Screenshots (Testing & Evaluation)

| Filename | Description | How to Capture |
|----------|-------------|----------------|
| `5.2.1_login_error.png` | Login error for invalid email | Try to login with non-UiTM email |
| `5.2.2_counter_offer_validation.png` | Counter-offer validation error | Try counter-offer with < RM 0.50 difference |
| `5.2.4_payment_success.png` | Payment success modal | Complete a successful payment |
| `5.2.5_admin_charts.png` | Admin charts with filter dropdown | Select a time filter on any chart |

### Chapter 6 Screenshots (Optional)

| Filename | Description | How to Capture |
|----------|-------------|----------------|
| `6_final_homepage.png` | Polished homepage view | Clean homepage with multiple books |
| `6_mobile_responsive.png` | Mobile view | Resize browser to mobile width (375px) |

## Instructions

1. Run the local dev server: `npm run dev`
2. Open browser to `http://localhost:8080`
3. Use test credentials:
   - Student: `2024745815` / `2024745815`
   - Staff: `709265` / `70926500`
   - Admin: `admin` / `admin123`
4. Capture screenshots using Windows Snipping Tool (Win+Shift+S)
5. Save with the exact filenames above
6. Place all screenshots in this folder: `file_md/screenshots/`

## Embedding in Markdown

To embed screenshots in the chapter files, use this format:

```markdown
![Description](screenshots/filename.png)
```

Example:
```markdown
![Login Page Interface](screenshots/4.4.1_login_page.png)
```
