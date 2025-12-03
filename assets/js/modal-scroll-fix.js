// Modal scroll fix
// This script ensures modal content can scroll properly

document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('addBookModal');

    if (modal) {
        // Fix modal CSS for scrolling
        const style = document.createElement('style');
        style.textContent = `
            .modal {
                align-items: flex-start !important;
                padding: 2rem 0 !important;
                overflow-y: auto !important;
            }
            
            .modal-content {
                max-height: calc(100vh - 4rem) !important;
                overflow-y: auto !important;
                overflow-x: hidden !important;
                margin: auto 0 !important;
            }
        `;
        document.head.appendChild(style);
    }
});
