// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if running in Telegram WebApp
    if (!window.Telegram?.WebApp) {
        console.error('Telegram WebApp is not available');
        document.body.innerHTML = '<div class="error">This app must be opened in Telegram</div>';
        return;
    }

    // Initialize Telegram WebApp
    window.Telegram.WebApp.expand();
    window.Telegram.WebApp.ready();

    // Setup mock data (for demo purposes)
    setupMockData();

    // Initialize handlers
    const telegram = new TelegramHandler();
    const upload = new UploadHandler();
    const modal = new ModalHandler();
    const navigation = new NavigationHandler();

    // Handle errors
    window.onerror = function(message, source, lineno, colno, error) {
        console.error('Global error:', { message, source, lineno, colno, error });
        if (window.telegramHandler) {
            telegramHandler.showAlert('An error occurred. Please try again.');
        }
        return false;
    };

    // Handle unhandled promise rejections
    window.onunhandledrejection = function(event) {
        console.error('Unhandled promise rejection:', event.reason);
        if (window.telegramHandler) {
            telegramHandler.showAlert('An error occurred. Please try again.');
        }
    };

    // Add loading state to body
    document.body.classList.add('loaded');
});

// Setup mock data for demonstration
function setupMockData() {
    // Set initial FH balance
    window.fhBalance = 0;
    
    // Sample transaction history
    window.transactionHistory = [];
    
    // Sample search history
    window.searchHistory = [
        {
            id: 'search_1',
            image: 'https://via.placeholder.com/150/00e5ff/ffffff?text=Search1',
            date: '2023-11-10',
            results: 'Found on 3 websites'
        },
        {
            id: 'search_2',
            image: 'https://via.placeholder.com/150/ff80ab/ffffff?text=Search2',
            date: '2023-11-15',
            results: 'Found on 5 websites'
        }
    ];
} 