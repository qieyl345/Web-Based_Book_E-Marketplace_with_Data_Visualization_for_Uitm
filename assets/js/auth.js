// Authentication Functions

// Sign up function
async function signUp(email, password, fullName, phoneNumber, role) {
    try {
        // Validate email domain
        if (!validateUitmEmail(email)) {
            throw new Error("Please use a valid UiTM email address (@student.uitm.edu.my or @staff.uitm.edu.my)");
        }

        // Create user account
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Save user data to database
        const userData = {
            email: user.email,
            fullName: fullName,
            phoneNumber: phoneNumber,
            role: role,
            profilePic: "",
            createdAt: Date.now(),
            totalSales: 0,
            totalPurchases: 0,
            isSeller: false
        };

        await database.ref(`users/${user.uid}`).set(userData);

        return { success: true, message: "Account created successfully!" };
    } catch (error) {
        console.error("Signup error:", error);
        throw error;
    }
}

// Login function
async function login(email, password, rememberMe = false) {
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Set persistence
        if (rememberMe) {
            auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
        } else {
            auth.setPersistence(firebase.auth.Auth.Persistence.SESSION);
        }

        return { success: true, message: "Login successful!" };
    } catch (error) {
        console.error("Login error:", error);
        throw error;
    }
}

// Password reset function
async function resetPassword(email) {
    try {
        await auth.sendPasswordResetEmail(email);
        return { success: true, message: "Password reset email sent!" };
    } catch (error) {
        console.error("Password reset error:", error);
        throw error;
    }
}

// Resend verification email
async function resendVerificationEmail() {
    try {
        if (auth.currentUser) {
            await auth.currentUser.sendEmailVerification();
            return { success: true, message: "Verification email sent!" };
        } else {
            throw new Error("No user is currently logged in");
        }
    } catch (error) {
        console.error("Resend verification error:", error);
        throw error;
    }
}

// Update user profile
async function updateUserProfile(uid, updates) {
    try {
        await database.ref(`users/${uid}`).update(updates);
        userData = { ...userData, ...updates };
        return { success: true, message: "Profile updated successfully!" };
    } catch (error) {
        console.error("Update profile error:", error);
        throw error;
    }
}

// Change password
async function changePassword(newPassword) {
    try {
        if (auth.currentUser) {
            await auth.currentUser.updatePassword(newPassword);
            return { success: true, message: "Password changed successfully!" };
        } else {
            throw new Error("No user is currently logged in");
        }
    } catch (error) {
        console.error("Change password error:", error);
        throw error;
    }
}

// Event listeners for login page
// Global event listener for password toggle to ensure it works on all pages
document.addEventListener('DOMContentLoaded', () => {
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');

    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function () {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
    }
});

if (window.location.pathname.includes('/login')) {
    document.addEventListener('DOMContentLoaded', () => {
        const loginForm = document.getElementById('loginForm');
        const forgotPasswordLink = document.getElementById('forgotPassword');
        const loadingOverlay = document.getElementById('loadingOverlay');

        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                loadingOverlay.style.display = 'flex';

                const userId = document.getElementById('userId').value.trim();
                const password = document.getElementById('password').value;
                const rememberMe = document.getElementById('rememberMe').checked;

                // Determine role and construct email based on ID length
                let emailDomain = '';
                let isAdminLogin = false;
                let email = '';

                if (userId.includes('@')) {
                    email = userId;
                    if (userId.toLowerCase().includes('admin')) {
                        isAdminLogin = true;
                    }
                } else if (userId.toLowerCase() === 'admin') {
                    emailDomain = '@student.uitm.edu.my';
                    isAdminLogin = true;
                    email = 'admin' + emailDomain;
                } else if (userId.length === 10) {
                    emailDomain = '@student.uitm.edu.my';
                    email = userId + emailDomain;
                } else if (userId.length === 6) {
                    emailDomain = '@staff.uitm.edu.my';
                    email = userId + emailDomain;
                } else {
                    showNotification("Invalid ID format. Enter full email, 10-digit Student ID, or 6-digit Staff ID.", "error");
                    loadingOverlay.style.display = 'none';
                    return;
                }

                try {
                    const result = await login(email, password, rememberMe);
                    showNotification(result.message, 'success');
                    setTimeout(() => {
                        // Redirect admin to admin dashboard directly
                        if (isAdminLogin) {
                            window.location.href = 'admin.html';
                        } else {
                            window.location.href = '../index.html';
                        }
                    }, 1500);
                } catch (error) {
                    console.log("Login error caught:", error);
                    console.log("Error code:", error.code);
                    console.log("Error message:", error.message);

                    // Auto-create admin account if it doesn't exist and credentials match
                    // Handle both 'auth/user-not-found' (old) and 'auth/invalid-login-credentials' (new)
                    // Also check for generic "INVALID_LOGIN_CREDENTIALS" string in message
                    if (isAdminLogin && password === 'admin123') {
                        try {
                            console.log("Auto-creating admin account...");
                            // Try to sign up
                            await signUp(email, password, "System Admin", "0123456789", "admin");
                            showNotification("Admin account created! Logging in...", 'success');
                            setTimeout(() => {
                                window.location.href = 'admin.html';
                            }, 1500);
                            return;
                        } catch (createError) {
                            // If signup fails because email already exists, it means the password was wrong
                            if (createError.code === 'auth/email-already-in-use') {
                                showNotification("Invalid password for admin account.", 'error');
                            } else {
                                console.error("Admin auto-creation failed:", createError);
                                showNotification("Failed to create admin account: " + createError.message, 'error');
                            }
                        }
                    } else {
                        showNotification(error.message, 'error');
                    }
                } finally {
                    loadingOverlay.style.display = 'none';
                }
            });
        }

        if (forgotPasswordLink) {
            forgotPasswordLink.addEventListener('click', (e) => {
                e.preventDefault();
                const email = document.getElementById('email').value;

                if (!email) {
                    showNotification("Please enter your email address first", "error");
                    return;
                }

                resetPassword(email)
                    .then(() => {
                        showNotification("Password reset email sent! Check your inbox.", "success");
                    })
                    .catch((error) => {
                        showNotification(error.message, "error");
                    });
            });
        }
    });
}

// Event listeners for signup page
if (window.location.pathname.includes('/signup')) {
    document.addEventListener('DOMContentLoaded', () => {
        const signupForm = document.getElementById('signupForm');
        const loadingOverlay = document.getElementById('loadingOverlay');

        if (signupForm) {
            signupForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                loadingOverlay.style.display = 'flex';

                const fullName = document.getElementById('fullName').value;
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
                const confirmPassword = document.getElementById('confirmPassword').value;
                const phoneNumber = document.getElementById('phoneNumber').value;
                const role = document.getElementById('role').value;
                const acceptTerms = document.getElementById('acceptTerms').checked;

                // Validation
                if (password !== confirmPassword) {
                    showNotification("Passwords do not match!", "error");
                    loadingOverlay.style.display = 'none';
                    return;
                }

                if (password.length < 8) {
                    showNotification("Password must be at least 8 characters!", "error");
                    loadingOverlay.style.display = 'none';
                    return;
                }

                if (!acceptTerms) {
                    showNotification("Please accept the terms and conditions!", "error");
                    loadingOverlay.style.display = 'none';
                    return;
                }

                try {
                    const result = await signUp(email, password, fullName, phoneNumber, role);
                    showNotification(result.message, 'success');
                    setTimeout(() => {
                        window.location.href = '../index.html';
                    }, 2000);
                } catch (error) {
                    showNotification(error.message, 'error');
                } finally {
                    loadingOverlay.style.display = 'none';
                }
            });
        }
    });
}

// Event listeners for verify email page
if (window.location.pathname.includes('/verify-email')) {
    document.addEventListener('DOMContentLoaded', () => {
        const resendBtn = document.getElementById('resendEmail');
        const emailContainer = document.getElementById('emailContainer');

        if (emailContainer && auth.currentUser) {
            emailContainer.innerHTML = `<strong>${auth.currentUser.email}</strong>`;
        }

        if (resendBtn) {
            resendBtn.addEventListener('click', () => {
                resendVerificationEmail()
                    .then((result) => {
                        showNotification(result.message, 'success');
                    })
                    .catch((error) => {
                        showNotification(error.message, 'error');
                    });
            });
        }

        // Check email verification status
        const checkVerification = setInterval(() => {
            if (auth.currentUser) {
                auth.currentUser.reload().then(() => {
                    if (auth.currentUser.emailVerified) {
                        clearInterval(checkVerification);
                        showNotification("Email verified! Redirecting to login...", 'success');
                        setTimeout(() => {
                            window.location.href = 'login.html';
                        }, 2000);
                    }
                });
            }
        }, 2000);
    });
}
