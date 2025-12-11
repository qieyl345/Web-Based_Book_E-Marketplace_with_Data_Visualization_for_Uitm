// Receipt page functionality

let currentTransaction = null;

// Initialize receipt page
document.addEventListener('DOMContentLoaded', async () => {
    // Wait for auth to be initialized first.
    if (typeof waitForAuth === 'function') {
        await waitForAuth();
    }

    const transactionId = getUrlParameter('txn');

    if (!transactionId) {
        window.location.href = '../index.html';
        return;
    }

    try {
        await loadTransaction(transactionId);
        setupDownloadPDF();
    } catch (error) {
        console.error("Error loading transaction:", error);
        showNotification("Transaction not found", "error");
        setTimeout(() => {
            window.location.href = '../index.html';
        }, 2000);
    }
});

async function loadTransaction(transactionId) {
    try {
        const snapshot = await database.ref(`transactions/${transactionId}`).once('value');
        currentTransaction = snapshot.val();

        if (!currentTransaction) {
            throw new Error("Transaction not found");
        }

        displayReceipt();
    } catch (error) {
        throw error;
    }
}

function displayReceipt() {
    // Transaction details
    document.getElementById('transactionId').textContent = currentTransaction.transactionId;
    document.getElementById('transactionDate').textContent = formatDate(currentTransaction.createdAt);

    const statusBadge = document.getElementById('transactionStatus');
    statusBadge.textContent = currentTransaction.status;
    statusBadge.className = `status-badge ${currentTransaction.status}`;

    // Buyer info
    document.getElementById('buyerName').textContent = currentTransaction.buyerName;
    document.getElementById('buyerEmail').textContent = currentTransaction.buyerEmail;
    document.getElementById('buyerPhone').textContent = userData.phoneNumber || 'N/A';

    // Seller info
    const seller = Object.values(currentTransaction.items)[0].bookDetails;
    document.getElementById('sellerName').textContent = seller.sellerName;
    document.getElementById('sellerLocation').textContent = seller.campusLocation;

    // Items
    const receiptItems = document.getElementById('receiptItems');
    receiptItems.innerHTML = currentTransaction.items.map(item => `
        <tr>
            <td>${item.bookDetails.title}</td>
            <td>${item.bookDetails.subjectCode || 'N/A'}</td>
            <td>${item.bookDetails.condition || 'N/A'}</td>
            <td>${formatCurrency(item.bookDetails.price)}</td>
        </tr>
    `).join('');

    // Totals
    document.getElementById('receiptSubtotal').textContent = formatCurrency(currentTransaction.basePrice);
    document.getElementById('receiptAdminFee').textContent = formatCurrency(currentTransaction.commissionFee);
    document.getElementById('receiptTotal').textContent = formatCurrency(currentTransaction.amount);

    // Payment info
    document.getElementById('fpxTransactionId').textContent = currentTransaction.fpxTransactionId;

    // Meeting info
    document.getElementById('meetingLocation').textContent = currentTransaction.meetingLocation;
    document.getElementById('meetingTime').textContent = formatDate(currentTransaction.meetingDate);
}

function setupDownloadPDF() {
    const downloadBtn = document.getElementById('downloadPdfBtn');

    if (downloadBtn) {
        downloadBtn.addEventListener('click', generatePDF);
    }
}

function generatePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Set font
    doc.setFont('helvetica');

    // Header
    doc.setFontSize(24);
    doc.setTextColor(0, 92, 153); // UiTM Blue
    doc.text('UiTM e-Marketplace', 105, 20, { align: 'center' });

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Universiti Teknologi Malaysia, Tapah Campus', 105, 30, { align: 'center' });

    // Transaction details
    doc.setFontSize(12);
    doc.text('Transaction Details', 20, 50);
    doc.setFontSize(10);
    doc.text(`Transaction ID: ${currentTransaction.transactionId}`, 20, 60);
    doc.text(`Date: ${formatDate(currentTransaction.createdAt)}`, 20, 67);
    doc.text(`Status: ${currentTransaction.status.toUpperCase()}`, 20, 74);

    // Buyer info
    doc.setFontSize(12);
    doc.text('Buyer Information', 20, 90);
    doc.setFontSize(10);
    doc.text(`Name: ${currentTransaction.buyerName}`, 20, 100);
    doc.text(`Email: ${currentTransaction.buyerEmail}`, 20, 107);

    // Seller info
    const seller = Object.values(currentTransaction.items)[0].bookDetails;
    doc.setFontSize(12);
    doc.text('Seller Information', 20, 123);
    doc.setFontSize(10);
    doc.text(`Name: ${seller.sellerName}`, 20, 133);
    doc.text(`Location: ${seller.campusLocation}`, 20, 140);

    // Items table
    doc.setFontSize(12);
    doc.text('Items Purchased', 20, 156);

    let yPos = 165;
    doc.setFontSize(10);
    doc.text('Title', 20, yPos);
    doc.text('Price', 150, yPos);
    yPos += 5;
    doc.line(20, yPos, 190, yPos);
    yPos += 5;

    currentTransaction.items.forEach(item => {
        if (yPos > 270) {
            doc.addPage();
            yPos = 20;
        }

        const title = item.bookDetails.title.length > 40
            ? item.bookDetails.title.substring(0, 40) + '...'
            : item.bookDetails.title;

        doc.text(title, 20, yPos);
        doc.text(formatCurrency(item.bookDetails.price), 150, yPos);
        yPos += 7;
    });

    // Totals
    yPos += 5;
    doc.line(20, yPos, 190, yPos);
    yPos += 7;
    doc.text('Subtotal:', 120, yPos);
    doc.text(formatCurrency(currentTransaction.basePrice), 150, yPos);
    yPos += 7;
    doc.text('Admin Fee (10%):', 120, yPos);
    doc.text(formatCurrency(currentTransaction.commissionFee), 150, yPos);
    yPos += 7;
    doc.setFont('helvetica', 'bold');
    doc.text('Total:', 120, yPos);
    doc.text(formatCurrency(currentTransaction.amount), 150, yPos);

    // Payment info
    yPos += 15;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text('Payment Information', 20, yPos);
    doc.setFontSize(10);
    yPos += 10;
    doc.text('Payment Method: FPX Online Banking', 20, yPos);
    yPos += 7;
    doc.text(`FPX Transaction ID: ${currentTransaction.fpxTransactionId}`, 20, yPos);

    // Meeting info
    yPos += 15;
    doc.setFontSize(12);
    doc.text('Face-to-Face Meeting', 20, yPos);
    doc.setFontSize(10);
    yPos += 10;
    doc.text(`Location: ${currentTransaction.meetingLocation}`, 20, yPos);
    yPos += 7;
    doc.text(`Suggested Time: ${formatDate(currentTransaction.meetingDate)}`, 20, yPos);

    // Instructions
    yPos += 15;
    doc.setFontSize(12);
    doc.text('Instructions:', 20, yPos);
    doc.setFontSize(10);
    yPos += 10;
    const instructions = [
        '• Contact the seller to arrange a convenient meeting time',
        '• Bring valid student/staff ID for verification',
        '• Inspect the book before completing the transaction',
        '• Have exact change ready if possible'
    ];

    instructions.forEach(instruction => {
        if (yPos > 270) {
            doc.addPage();
            yPos = 20;
        }
        doc.text(instruction, 20, yPos);
        yPos += 7;
    });

    // Footer
    yPos += 15;
    doc.setFontSize(10);
    doc.text('Thank you for using UiTM e-Marketplace!', 105, yPos, { align: 'center' });
    doc.setFontSize(8);
    doc.text('This is a computer-generated receipt. No signature is required.', 105, yPos + 5, { align: 'center' });

    // Save PDF
    doc.save(`receipt-${currentTransaction.transactionId}.pdf`);
}
