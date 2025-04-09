class TelegramHandler {
    constructor() {
        this.webApp = window.Telegram.WebApp;
        this.init();
    }

    init() {
        // Initialize Telegram WebApp
        this.webApp.ready();
        this.webApp.expand();

        // Set color scheme
        this.webApp.setHeaderColor('#000000');
        this.webApp.setBackgroundColor('#000000');

        // Enable closing confirmation
        this.webApp.enableClosingConfirmation();

        // Set up event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Handle back button
        this.webApp.onEvent('backButtonClicked', () => {
            // Handle back button click
            if (document.querySelector('.modal.show')) {
                this.closeModal();
            } else {
                // Add your back navigation logic here
            }
        });
    }

    showModal() {
        const modal = document.getElementById('tariffModal');
        modal.classList.add('show');
        this.webApp.BackButton.show();
    }

    closeModal() {
        const modal = document.getElementById('tariffModal');
        modal.classList.remove('show');
        this.webApp.BackButton.hide();
    }

    sendData(data) {
        try {
            this.webApp.sendData(JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error sending data to Telegram:', error);
            return false;
        }
    }

    showAlert(message) {
        this.webApp.showAlert(message);
    }

    showConfirm(message) {
        return new Promise((resolve) => {
            this.webApp.showConfirm(message, (confirmed) => {
                resolve(confirmed);
            });
        });
    }
}

// Initialize Telegram handler
const telegramHandler = new TelegramHandler(); 