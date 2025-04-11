class TelegramHandler {
    constructor() {
        try {
            this.webApp = window.Telegram.WebApp;
            this.init();
        } catch (error) {
            console.error('Error initializing TelegramHandler:', error);
        }
    }

    init() {
        try {
            // Initialize Telegram WebApp
            this.webApp.ready();
            this.webApp.expand();

            // Set color scheme
            this.webApp.setHeaderColor('#121212');
            this.webApp.setBackgroundColor('#121212');

            // Enable closing confirmation
            this.webApp.enableClosingConfirmation();

            // Set up event listeners
            this.setupEventListeners();
        } catch (error) {
            console.error('Error in TelegramHandler.init:', error);
        }
    }

    setupEventListeners() {
        try {
            // Handle back button
            this.webApp.onEvent('backButtonClicked', () => {
                this.handleBackButton();
            });

            // Handle theme changes
            this.webApp.onEvent('themeChanged', () => {
                this.applyColorScheme();
            });
        } catch (error) {
            console.error('Error setting up event listeners:', error);
        }
    }

    handleBackButton() {
        try {
            // Handle back button click
            if (document.querySelector('.modal.show')) {
                this.closeModal();
            } else if (document.querySelector('.preview-section') && 
                       document.querySelector('.preview-section').style.display !== 'none') {
                this.handleBackFromPreview();
            } else if (document.getElementById('welcomeScreen') && 
                       document.getElementById('welcomeScreen').style.display === 'flex') {
                // Close welcome screen if open
                if (window.navigationHandler) {
                    window.navigationHandler.hideWelcomeScreen();
                }
            } else {
                // Default to main page if on another page
                if (window.navigationHandler && window.navigationHandler.currentPage !== 'search') {
                    window.navigationHandler.navigateToPage('search');
                }
            }
        } catch (error) {
            console.error('Error handling back button:', error);
        }
    }

    handleBackFromPreview() {
        try {
            const previewSection = document.querySelector('.preview-section');
            const uploadBox = document.querySelector('.upload-box');
            
            if (previewSection && uploadBox) {
                previewSection.style.display = 'none';
                uploadBox.style.display = 'block';
                
                if (window.uploadHandler) {
                    window.uploadHandler.selectedFile = null;
                }
            }
        } catch (error) {
            console.error('Error handling back from preview:', error);
        }
    }

    applyColorScheme() {
        try {
            const colorScheme = this.webApp.colorScheme;
            if (colorScheme === 'dark') {
                document.body.classList.add('dark-theme');
                document.body.classList.remove('light-theme');
            } else {
                document.body.classList.add('light-theme');
                document.body.classList.remove('dark-theme');
            }
        } catch (error) {
            console.error('Error applying color scheme:', error);
        }
    }

    showModal() {
        try {
            const modal = document.querySelector('.modal.show');
            if (modal) {
                this.webApp.BackButton.show();
            }
        } catch (error) {
            console.error('Error showing modal:', error);
        }
    }

    closeModal() {
        try {
            const modals = document.querySelectorAll('.modal');
            modals.forEach(modal => {
                modal.classList.remove('show');
            });
            
            // Only hide back button if preview section is not shown
            const previewSection = document.querySelector('.preview-section');
            if (previewSection && previewSection.style.display === 'none') {
                this.webApp.BackButton.hide();
            }
        } catch (error) {
            console.error('Error closing modal:', error);
        }
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
        try {
            this.webApp.showAlert(message);
        } catch (error) {
            console.error('Error showing alert:', error);
            alert(message);
        }
    }

    showConfirm(message) {
        return new Promise((resolve) => {
            try {
                this.webApp.showConfirm(message, (confirmed) => {
                    resolve(confirmed);
                });
            } catch (error) {
                console.error('Error showing confirmation dialog:', error);
                const confirmed = confirm(message);
                resolve(confirmed);
            }
        });
    }

    showLoadingIndicator() {
        try {
            this.webApp.showPopup({
                title: 'Processing',
                message: 'Please wait while we process your request...',
                buttons: []
            });
        } catch (error) {
            console.error('Error showing loading indicator:', error);
        }
    }

    closeLoadingIndicator() {
        try {
            this.webApp.closePopup();
        } catch (error) {
            console.error('Error closing loading indicator:', error);
        }
    }
}

// Initialize Telegram handler
const telegramHandler = new TelegramHandler(); 