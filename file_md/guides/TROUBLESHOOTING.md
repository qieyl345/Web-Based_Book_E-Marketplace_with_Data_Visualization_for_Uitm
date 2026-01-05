# Troubleshooting Guide

> Common issues and solutions for the UiTM Book e-Marketplace

---

## 🔐 Authentication Issues

### "Firebase not defined" error
**Cause:** Firebase scripts not loaded properly

**Solution:**
1. Check internet connection
2. Ensure Firebase scripts are in correct order in HTML:
```html
<!-- Firebase must be loaded FIRST -->
<script src="https://www.gstatic.com/firebasejs/9.x/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.x/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.x/firebase-database-compat.js"></script>
<!-- THEN your custom scripts -->
<script src="assets/js/firebase-config.js"></script>
```

---

### "User not authenticated" on page load
**Cause:** Race condition - page tries to access user before auth completes

**Solution:**
All page scripts should wait for auth:
```javascript
document.addEventListener('DOMContentLoaded', async () => {
    // ALWAYS wait for auth first
    if (typeof waitForAuth === 'function') {
        await waitForAuth();
    }
    // Now safe to use currentUser
});
```

*See `file_md/technical/AUTH_FIX.md` for full details.*

---

### "Invalid ID format" on login
**Cause:** Wrong ID format entered

**Solution:**
- **Student:** 10-digit number (e.g., `2024745815`)
- **Staff:** 6-digit number (e.g., `709265`)
- **Admin:** Type `admin` with password `admin123`

---

### "Only UiTM email addresses allowed"
**Cause:** Trying to register with non-UiTM email

**Solution:**
Only these domains are allowed:
- `@student.uitm.edu.my`
- `@staff.uitm.edu.my`

---

## 💰 Payment Issues

### Payment stuck at "Processing"
**Cause:** Network issue or Firebase timeout

**Solution:**
1. Wait 10 seconds
2. Refresh the page
3. Check if transaction was created in profile
4. If not, try payment again

---

### "Book no longer available" during payment
**Cause:** Another buyer purchased while you were checking out

**Solution:**
- This is expected behavior (race protection)
- Book is automatically removed from cart
- Find another listing or contact seller

---

### Commission calculation seems wrong
**Info:** Commission is 10% of book price

**Calculation:**
```
Book Price:    RM 50.00
Commission:    RM 50.00 × 10% = RM 5.00
Buyer Pays:    RM 55.00
Seller Gets:   RM 45.00 (after commission)
```

---

## 💬 Chat/Negotiation Issues

### "Please wait X second(s)" message
**Cause:** Rate limiting - 2-second cooldown between messages

**Solution:**
- Wait 2 seconds before sending next message
- This prevents spam

---

### "Counter-offer must differ by at least RM 0.50"
**Cause:** Validation rule to prevent trivial negotiations

**Solution:**
- Make your counter-offer at least RM 0.50 different from current price

---

### "Price cannot exceed 10x the original price"
**Cause:** Validation rule to prevent unrealistic prices

**Solution:**
- Keep counter-offer within 10× the original listing price

---

### Can't access someone else's chat
**Cause:** Security rule - only buyer and seller can access their negotiation

**Solution:**
- This is expected behavior
- You can only see chats you're a participant in

---

## 📦 Order/Warranty Issues

### "Warranty period has expired"
**Cause:** Trying to claim warranty after 7 days

**Solution:**
- Warranty must be claimed within 7 days of confirming receipt
- After 7 days, seller is automatically paid

---

### Seller not paid after delivery confirmed
**Info:** Payment goes through escrow process:

```
1. Buyer pays → Funds held in escrow
2. Buyer confirms receipt → 7-day warranty starts
3. After 7 days (no issues) → Seller automatically paid
4. OR buyer claims warranty → Admin resolves
```

**Check:**
- Is the order status "delivered"?
- Has 7 days passed since delivery confirmation?
- Was a warranty claim made?

---

### "Return not confirmed" - Can't get refund
**Cause:** Seller hasn't confirmed receiving the returned book

**Solution:**
1. Contact seller to confirm return
2. Seller must click "Confirm Return Received"
3. Then admin can process refund

---

## 🖼️ Image Upload Issues

### Images not uploading
**Cause:** ImageBB API issue or file too large

**Solution:**
1. Check file size (max 32MB per image)
2. Use JPG/PNG format
3. Try fewer images (max 5)
4. Check internet connection

---

### Images show as broken
**Cause:** ImageBB URL expired or deleted

**Solution:**
- Re-upload images when editing listing
- ImageBB free tier may have limitations

---

## 📱 Display Issues

### Page not loading properly
**Solution:**
1. Hard refresh: `Ctrl + F5`
2. Clear browser cache
3. Try incognito mode
4. Check console for errors (`F12`)

---

### Charts not showing in admin dashboard
**Cause:** Chart.js not loaded or no data

**Solution:**
1. Check if Chart.js script is loaded
2. Ensure there's transaction data to display
3. Check browser console for errors

---

## 🔧 Development Issues

### Local server not starting
**Solution with Node.js:**
```bash
npx http-server -p 8080
```

**Solution with Python:**
```bash
python -m http.server 8000
```

---

### Firebase permission denied
**Cause:** Security rules blocking access

**Check:**
1. Is user authenticated?
2. Is user accessing their own data?
3. Check `config/firebase-rules.json`

---

### Changes not reflecting
**Solution:**
1. Hard refresh (`Ctrl + F5`)
2. Clear browser cache
3. Check if you saved the file
4. Restart local server

---

## 📞 Need More Help?

1. **Check the documentation:**
   - `README.md` - Project overview
   - `file_md/guides/SETUP.md` - Setup guide
   - `file_md/guides/systemWalkthrough.md` - Full system guide

2. **Check the technical docs:**
   - `file_md/technical/AUTH_FIX.md` - Auth issues
   - `file_md/technical/systemCode.md` - Code reference

3. **Review browser console:**
   - Press `F12` → Console tab
   - Look for red error messages

---

*Last updated: 2026-01-05*
