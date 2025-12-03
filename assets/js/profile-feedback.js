// Setup feedback modals
function setupFeedbackModals() {
    const feedbackModal = document.getElementById('feedbackModal');
    const viewFeedbackModal = document.getElementById('viewFeedbackModal');
    const closeFeedbackBtn = document.getElementById('closeFeedbackModal');
    const closeViewFeedbackBtn = document.getElementById('closeViewFeedbackModal');
    const closeFeedbackModalBtns = document.querySelectorAll('.close-feedback-modal-btn');
    const feedbackForm = document.getElementById('purchaseFeedbackForm');
    const feedbackType = document.getElementById('purchaseFeedbackType');
    const disputeHint = document.getElementById('purchaseDisputeHint');

    // Star rating setup
    const starRating = document.getElementById('purchaseStarRating');
    const ratingValue = document.getElementById('purchaseRatingValue');

    if (starRating) {
        const stars = starRating.querySelectorAll('i');
        stars.forEach(star => {
            star.addEventListener('click', () => {
                const rating = parseInt(star.dataset.rating);
                ratingValue.value = rating;

                // Update star display
                stars.forEach((s, index) => {
                    if (index < rating) {
                        s.classList.add('active');
                        s.style.color = '#fbbf24';
                    } else {
                        s.classList.remove('active');
                        s.style.color = '#d1d5db';
                    }
                });
            });

            // Hover effect
            star.addEventListener('mouseenter', () => {
                const rating = parseInt(star.dataset.rating);
                stars.forEach((s, index) => {
                    if (index < rating) {
                        s.classList.add('hover');
                    } else {
                        s.classList.remove('hover');
                    }
                });
            });
        });

        starRating.addEventListener('mouseleave', () => {
            stars.forEach(s => s.classList.remove('hover'));
        });
    }

    // Show/hide dispute hint based on feedback type
    if (feedbackType && disputeHint) {
        feedbackType.addEventListener('change', () => {
            if (feedbackType.value === 'dispute') {
                disputeHint.style.display = 'block';
            } else {
                disputeHint.style.display = 'none';
            }
        });
    }

    // Close modal handlers
    function closeFeedbackModalFunc() {
        if (feedbackModal) feedbackModal.classList.remove('show');
    }

    function closeViewFeedbackModalFunc() {
        if (viewFeedbackModal) viewFeedbackModal.classList.remove('show');
    }

    if (closeFeedbackBtn) closeFeedbackBtn.addEventListener('click', closeFeedbackModalFunc);
    if (closeViewFeedbackBtn) closeViewFeedbackBtn.addEventListener('click', closeViewFeedbackModalFunc);

    closeFeedbackModalBtns.forEach(btn => {
        btn.addEventListener('click', closeFeedbackModalFunc);
    });

    // Close on click outside
    window.addEventListener('click', (e) => {
        if (e.target === feedbackModal) {
            closeFeedbackModalFunc();
        }
        if (e.target === viewFeedbackModal) {
            closeViewFeedbackModalFunc();
        }
    });

    // Form submission
    if (feedbackForm) {
        feedbackForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await submitPurchaseFeedback();
        });
    }
}

// Show feedback modal
async function showFeedbackModal(transactionId, feedbackType = 'general', prefilledComment = '') {
    const modal = document.getElementById('feedbackModal');
    const transactionIdInput = document.getElementById('feedbackTransactionId');
    const feedbackTypeSelect = document.getElementById('purchaseFeedbackType');
    const commentTextarea = document.getElementById('purchaseFeedbackComment');
    const stars = document.querySelectorAll('#purchaseStarRating i');
    const ratingValue = document.getElementById('purchaseRatingValue');

    // Reset form
    transactionIdInput.value = transactionId;
    feedbackTypeSelect.value = feedbackType;
    commentTextarea.value = prefilledComment;
    ratingValue.value = '';

    // Reset stars
    stars.forEach(s => {
        s.classList.remove('active');
        s.style.color = '#d1d5db';
    });

    // Show/hide dispute hint
    const disputeHint = document.getElementById('purchaseDisputeHint');
    if (feedbackType === 'dispute') {
        disputeHint.style.display = 'block';
    } else {
        disputeHint.style.display = 'none';
    }

    modal.classList.add('show');
}

// Submit purchase feedback
async function submitPurchaseFeedback() {
    const transactionId = document.getElementById('feedbackTransactionId').value;
    const rating = parseInt(document.getElementById('purchaseRatingValue').value);
    const type = document.getElementById('purchaseFeedbackType').value;
    const comment = document.getElementById('purchaseFeedbackComment').value;

    if (!rating || rating < 1 || rating > 5) {
        showNotification("Please select a rating", "error");
        return;
    }

    if (!type) {
        showNotification("Please select feedback type", "error");
        return;
    }

    if (!comment || comment.trim().length < 10) {
        showNotification("Please provide a detailed comment (at least 10 characters)", "error");
        return;
    }

    try {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) loadingOverlay.style.display = 'flex';

        // Get transaction details
        const transactionSnapshot = await database.ref(`transactions/${transactionId}`).once('value');
        const transaction = transactionSnapshot.val();

        if (!transaction) {
            throw new Error("Transaction not found");
        }

        // Get seller info from transaction
        const seller = transaction.items && transaction.items[0] ? transaction.items[0].bookDetails : null;

        const feedbackData = {
            transactionId: transactionId,
            buyerId: currentUser.uid,
            buyerName: userData.fullName,
            buyerEmail: userData.email,
            sellerId: seller ? seller.sellerId : null,
            sellerName: seller ? seller.sellerName : 'Unknown',
            rating: rating,
            type: type,
            comment: comment.trim(),
            status: 'pending',
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        // Save to Firebase
        await database.ref('feedback').push(feedbackData);

        // Send admin notification for low ratings or disputes
        if ((rating <= 2 || type === 'dispute') && typeof sendAdminNotification === 'function') {
            await sendAdminNotification(
                type === 'dispute' ? 'admin_dispute' : 'admin_low_rating',
                type === 'dispute'
                    ? `🚨 Dispute filed by ${feedbackData.buyerName}`
                    : `⭐ Poor rating (${rating}★) from ${feedbackData.buyerName}`,
                {
                    feedbackType: type,
                    rating: rating,
                    transactionId: transactionId,
                    buyerId: feedbackData.buyerId
                },
                type === 'dispute' ? 'high' : 'medium'
            );
        }

        if (loadingOverlay) loadingOverlay.style.display = 'none';
        showNotification("Feedback submitted successfully!", "success");

        // Close modal
        document.getElementById('feedbackModal').classList.remove('show');

        // Reload purchase history
        await loadPurchaseHistory();

    } catch (error) {
        console.error("Error submitting feedback:", error);
        showNotification("Failed to submit feedback. Please try again.", "error");
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) loadingOverlay.style.display = 'none';
    }
}

// Check if transaction has feedback
async function checkTransactionFeedback(transactionId) {
    try {
        const snapshot = await database.ref('feedback')
            .orderByChild('transactionId')
            .equalTo(transactionId)
            .once('value');

        return snapshot.val();
    } catch (error) {
        console.error("Error checking feedback:", error);
        return null;
    }
}

// Show existing feedback
async function viewTransactionFeedback(transactionId) {
    try {
        const feedbackData = await checkTransactionFeedback(transactionId);

        if (!feedbackData) {
            showNotification("No feedback found for this transaction", "info");
            return;
        }

        const feedback = Object.values(feedbackData)[0];
        const modal = document.getElementById('viewFeedbackModal');
        const content = document.getElementById('viewFeedbackContent');

        // Generate star display
        let starsHTML = '';
        for (let i = 1; i <= 5; i++) {
            starsHTML += `<i class="fas fa-star ${i <= feedback.rating ? 'active' : ''}" style="color: ${i <= feedback.rating ? '#fbbf24' : '#d1d5db'};"></i>`;
        }

        content.innerHTML = `
            <div style="margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid #e5e7eb;">
                <strong>Your Rating:</strong>
                <div class="star-rating-display" style="margin-top: 0.5rem;">${starsHTML}</div>
            </div>
            <div style="margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid #e5e7eb;">
                <strong>Type:</strong>
                <span class="feedback-type-badge ${feedback.type}" style="margin-left: 0.5rem;">${feedback.type === 'dispute' ? 'Dispute' : 'General Feedback'}</span>
            </div>
            <div style="margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid #e5e7eb;">
                <strong>Your Comment:</strong>
                <p style="margin-top: 0.5rem; color: var(--text-secondary);">${feedback.comment}</p>
            </div>
            <div style="margin-bottom: 0.5rem;">
                <strong>Status:</strong>
                <span class="feedback-status-badge ${feedback.status}" style="margin-left: 0.5rem;">${feedback.status}</span>
            </div>
            <small style="color: var(--text-tertiary);">Submitted on ${formatDate(feedback.createdAt)}</small>
        `;

        modal.classList.add('show');
    } catch (error) {
        console.error("Error viewing feedback:", error);
        showNotification("Failed to load feedback", "error");
    }
}
