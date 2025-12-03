# Browser Testing Walkthrough

## Overview
This walkthrough documents the initial browser testing of the UiTM e-Marketplace application.

## Steps Taken

1.  **Server Startup**:
    *   Attempted to start a Python HTTP server (`python -m http.server 8000`), but Python was not available.
    *   Successfully started a Node.js HTTP server using `npx http-server -p 8080`.
    *   Server is running at `http://localhost:8080`.

2.  **Login Page Verification**:
    *   Navigated to `http://localhost:8080/login.html`.
    *   Verified that the page loads successfully.
    *   Confirmed the presence of the login form elements (ID input, Password input, Login button).

## Results
The application is successfully running locally. The login page is accessible and renders correctly.

![Login Page Verification](/test_login_page_8080_1763995104751.webp)
