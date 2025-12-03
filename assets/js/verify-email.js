// Verify email page functionality

// Check if user is logged in
document.addEventListener('DOMContentLoaded', () => {
    if (!auth.currentUser) {
        window.location.href = 'pages/login.html';
        return;
    }

    const emailContainer = document.getElementById('emailContainer');
    if (emailContainer && auth.currentUser) {
        emailContainer.innerHTML = `<strong>${auth.currentUser.email}</strong>`;
    }

    // Check verification status periodically
    const checkInterval = setInterval(() => {
        if (auth.currentUser) {
            auth.currentUser.reload().then(() => {
                if (auth.currentUser.emailVerified) {
                    clearInterval(checkInterval);
                    showNotification("Email verified! Redirecting to login...", 'success');
                    setTimeout(() => {
                        window.location.href = 'pages/login.html';
                    }, 2000);
                }
            });
        }
    }, 2000);

    // Resend verification email
    const resendBtn = document.getElementById('resendEmail');
    if (resendBtn) {
        resendBtn.addEventListener('click', async () => {
            try {
                await resendVerificationEmail();
                showNotification("Verification email sent! Check your inbox.", 'success');
            } catch (error) {
                showNotification(error.message, 'error');
            }
        });
    }

    // Modal close handlers
    const modal = document.getElementById('messageModal');
    const modalClose = document.querySelector('.modal-close');

    if (modalClose) {
        modalClose.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
});
