// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if running in Telegram WebApp
    if (!window.Telegram?.WebApp) {
        console.error('Telegram WebApp is not available');
        document.body.innerHTML = '<div class="error">This app must be opened in Telegram</div>';
        return;
    }

    // Initialize handlers
    const telegram = new TelegramHandler();
    const upload = new UploadHandler();
    const modal = new ModalHandler();
    const navigation = new NavigationHandler();

    // Handle errors
    window.onerror = function(message, source, lineno, colno, error) {
        console.error('Global error:', { message, source, lineno, colno, error });
        telegramHandler.showAlert('An error occurred. Please try again.');
        return false;
    };

    // Handle unhandled promise rejections
    window.onunhandledrejection = function(event) {
        console.error('Unhandled promise rejection:', event.reason);
        telegramHandler.showAlert('An error occurred. Please try again.');
    };

    // Add loading state to body
    document.body.classList.add('loaded');
}); 