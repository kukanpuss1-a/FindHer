// Telegram Handler
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
        this.webApp.setHeaderColor('#121212');
        this.webApp.setBackgroundColor('#121212');

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
            } else if (document.querySelector('.preview-section').style.display !== 'none') {
                this.handleBackFromPreview();
            } else if (document.getElementById('welcomeScreen').style.display === 'flex') {
                // Close welcome screen if open
                navigationHandler.hideWelcomeScreen();
            } else {
                // Add your back navigation logic here
                // Default to main page if on another page
                if (navigationHandler.currentPage !== 'search') {
                    navigationHandler.navigateToPage('search');
                }
            }
        });

        // Handle theme changes
        this.webApp.onEvent('themeChanged', () => {
            this.applyColorScheme();
        });
    }

    handleBackFromPreview() {
        document.querySelector('.preview-section').style.display = 'none';
        document.querySelector('.upload-box').style.display = 'block';
    }

    applyColorScheme() {
        const colorScheme = this.webApp.colorScheme;
        if (colorScheme === 'dark') {
            document.body.classList.add('dark-theme');
            document.body.classList.remove('light-theme');
        } else {
            document.body.classList.add('light-theme');
            document.body.classList.remove('dark-theme');
        }
    }

    showModal() {
        const modal = document.querySelector('.modal.show');
        if (modal) {
            this.webApp.BackButton.show();
        }
    }

    closeModal() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.classList.remove('show');
        });
        
        // Only hide back button if preview section is not shown
        if (document.querySelector('.preview-section').style.display === 'none') {
            this.webApp.BackButton.hide();
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
        this.webApp.showAlert(message);
    }

    showConfirm(message) {
        return new Promise((resolve) => {
            this.webApp.showConfirm(message, (confirmed) => {
                resolve(confirmed);
            });
        });
    }

    showLoadingIndicator() {
        this.webApp.showPopup({
            title: 'Processing',
            message: 'Please wait while we process your request...',
            buttons: []
        });
    }

    closeLoadingIndicator() {
        this.webApp.closePopup();
    }
}

// Upload Handler
class UploadHandler {
    constructor() {
        this.uploadBox = document.querySelector('.upload-box');
        this.photoInput = document.getElementById('photoInput');
        this.previewSection = document.querySelector('.preview-section');
        this.previewImage = document.getElementById('previewImage');
        this.searchButton = document.querySelector('.btn-search');
        this.cancelButton = document.querySelector('.btn-cancel');
        
        this.selectedFile = null;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Handle click on upload box
        this.uploadBox.addEventListener('click', () => {
            this.photoInput.click();
        });

        // Handle file selection
        this.photoInput.addEventListener('change', (event) => {
            this.handleFileSelect(event);
        });

        // Handle drag and drop
        this.uploadBox.addEventListener('dragover', (event) => {
            event.preventDefault();
            this.uploadBox.classList.add('dragover');
        });

        this.uploadBox.addEventListener('dragleave', () => {
            this.uploadBox.classList.remove('dragover');
        });

        this.uploadBox.addEventListener('drop', (event) => {
            event.preventDefault();
            this.uploadBox.classList.remove('dragover');
            
            const files = event.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileSelect({ target: { files: files } });
            }
        });

        // Handle search button click
        if (this.searchButton) {
            this.searchButton.addEventListener('click', () => {
                this.processImageSearch();
            });
        }

        // Handle cancel button click
        if (this.cancelButton) {
            this.cancelButton.addEventListener('click', () => {
                this.cancelPreview();
            });
        }
    }

    handleFileSelect(event) {
        const file = event.target.files[0];
        
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            this.showError('Please select an image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            this.showError('File size should be less than 5MB');
            return;
        }

        // Store the selected file
        this.selectedFile = file;
        
        // Show preview
        this.showPreview(file);
        
        // Show back button
        telegramHandler.webApp.BackButton.show();
    }

    showPreview(file) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            this.previewImage.src = e.target.result;
            
            // Set the file type badge
            const fileTypeBadge = this.previewSection.querySelector('.file-type-badge');
            if (fileTypeBadge) {
                const extension = file.name.split('.').pop().toUpperCase();
                fileTypeBadge.textContent = extension;
            }
            
            this.previewSection.style.display = 'block';
            this.uploadBox.style.display = 'none';
        };

        reader.readAsDataURL(file);
    }

    cancelPreview() {
        this.previewSection.style.display = 'none';
        this.uploadBox.style.display = 'block';
        this.selectedFile = null;
        
        // Hide back button
        telegramHandler.webApp.BackButton.hide();
    }

    showError(message) {
        this.uploadBox.classList.add('error');
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.textContent = message;
        
        // Remove existing error message if any
        const existingError = this.uploadBox.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        this.uploadBox.appendChild(errorMessage);
        
        // Remove error state after 3 seconds
        setTimeout(() => {
            this.uploadBox.classList.remove('error');
            errorMessage.remove();
        }, 3000);
    }

    async processImageSearch() {
        if (!this.selectedFile) {
            telegramHandler.showAlert('No image selected');
            return;
        }
        
        // Check if user has enough FH coins
        if (!window.fhBalance || window.fhBalance < 250) {
            telegramHandler.showAlert('You need at least 250 FH coins to perform a search. Please purchase coins first.');
            
            // Navigate to tariffs page
            navigationHandler.navigateToPage('tariffs');
            return;
        }
        
        try {
            // Show loading state
            this.searchButton.disabled = true;
            this.searchButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Searching...';
            
            // Convert file to base64
            const base64 = await this.fileToBase64(this.selectedFile);
            
            // Create search data
            const searchData = {
                type: 'image_search',
                photo: base64,
                filename: this.selectedFile.name,
                size: this.selectedFile.size,
                timestamp: new Date().toISOString()
            };
            
            // Send data to Telegram
            const success = telegramHandler.sendData(searchData);
            
            if (success) {
                // Deduct FH coins
                modalHandler.updateFHBalance(-250);
                
                // Add to search history
                this.addToSearchHistory(searchData);
                
                // Show success message
                telegramHandler.showAlert('Search successful! Results will be available soon.');
                
                // Reset the form
                this.cancelPreview();
            } else {
                telegramHandler.showAlert('Failed to process search. Please try again.');
            }
        } catch (error) {
            console.error('Error processing search:', error);
            telegramHandler.showAlert('Error processing search');
        } finally {
            // Reset button state
            this.searchButton.disabled = false;
            this.searchButton.innerHTML = '<i class="fa-solid fa-magnifying-glass"></i> Search Online';
        }
    }

    addToSearchHistory(searchData) {
        // This is a mock function that would typically communicate with a backend
        if (!window.searchHistory) {
            window.searchHistory = [];
        }
        
        // Add to history
        const searchItem = {
            id: 'search_' + Date.now(),
            image: this.previewImage.src,
            date: new Date().toLocaleDateString(),
            results: 'Processing...',
            status: 'pending'
        };
        
        window.searchHistory.unshift(searchItem);
        
        // Update UI if on history page
        if (navigationHandler.currentPage === 'history') {
            navigationHandler.loadHistoryData();
        }
        
        // Also add to profile archive tab
        const archiveTab = document.getElementById('archiveTab');
        if (archiveTab) {
            const searchArchive = archiveTab.querySelector('.search-archive');
            if (searchArchive) {
                // Clear empty state if present
                if (searchArchive.querySelector('.empty-state')) {
                    searchArchive.innerHTML = '';
                }
                
                // Create archive item
                const archiveItem = document.createElement('div');
                archiveItem.className = 'card history-item';
                
                archiveItem.innerHTML = `
                    <div class="history-item-image">
                        <img src="${searchItem.image}" alt="Search image">
                    </div>
                    <div class="history-item-details">
                        <div class="history-item-date">${searchItem.date}</div>
                        <div class="history-item-results">${searchItem.results}</div>
                    </div>
                `;
                
                searchArchive.prepend(archiveItem);
            }
        }
    }

    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }
}

// Modal Handler
class ModalHandler {
    constructor() {
        this.paymentModal = document.getElementById('paymentModal');
        this.closeButton = this.paymentModal.querySelector('.close-modal');
        this.paymentMethods = this.paymentModal.querySelectorAll('.payment-method');
        this.confirmButton = this.paymentModal.querySelector('.payment-confirm');
        this.coinAmountElement = document.getElementById('coinAmount');
        this.coinPriceElement = document.getElementById('coinPrice');
        
        this.selectedTariff = null;
        this.selectedPaymentMethod = null;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        // We don't show modal on page load anymore
    }

    setupEventListeners() {
        // Close modal when clicking the close button
        this.closeButton.addEventListener('click', () => {
            this.closeModal();
        });

        // Close modal when clicking outside
        this.paymentModal.addEventListener('click', (event) => {
            if (event.target === this.paymentModal) {
                this.closeModal();
            }
        });

        // Handle payment method selection
        this.paymentMethods.forEach(method => {
            method.addEventListener('click', () => {
                this.selectPaymentMethod(method);
            });
        });

        // Handle confirm button
        if (this.confirmButton) {
            this.confirmButton.addEventListener('click', () => {
                this.processPayment();
            });
        }

        // Handle tariff selection on the tariffs page
        const tariffButtons = document.querySelectorAll('.tariff-option .select-tariff');
        tariffButtons.forEach(button => {
            button.addEventListener('click', () => {
                const amount = button.dataset.amount;
                const price = button.dataset.price;
                this.showPaymentModal(amount, price);
            });
        });
    }

    showPaymentModal(coinAmount, price) {
        // Set the tariff details
        this.selectedTariff = {
            amount: coinAmount,
            price: price
        };
        
        // Update the UI
        if (this.coinAmountElement) {
            this.coinAmountElement.textContent = coinAmount;
        }
        
        if (this.coinPriceElement) {
            this.coinPriceElement.textContent = price;
        }
        
        // Reset payment method selection
        this.resetPaymentMethodSelection();
        
        // Show the modal
        this.paymentModal.classList.add('show');
        
        // Notify Telegram
        if (window.telegramHandler) {
            telegramHandler.showModal();
        }
    }

    closeModal() {
        this.paymentModal.classList.remove('show');
        
        // Notify Telegram
        if (window.telegramHandler) {
            telegramHandler.closeModal();
        }
    }

    selectPaymentMethod(methodElement) {
        // Remove active class from all methods
        this.paymentMethods.forEach(method => {
            method.classList.remove('active');
        });
        
        // Add active class to selected method
        methodElement.classList.add('active');
        
        // Store the selected method
        this.selectedPaymentMethod = methodElement.dataset.method;
        
        // Enable the confirm button
        if (this.confirmButton) {
            this.confirmButton.disabled = false;
        }
    }

    resetPaymentMethodSelection() {
        this.paymentMethods.forEach(method => {
            method.classList.remove('active');
        });
        
        this.selectedPaymentMethod = null;
        
        if (this.confirmButton) {
            this.confirmButton.disabled = true;
        }
    }

    async processPayment() {
        if (!this.selectedTariff || !this.selectedPaymentMethod) {
            // Show error - should not happen as button should be disabled
            if (window.telegramHandler) {
                telegramHandler.showAlert('Please select a payment method.');
            }
            return;
        }
        
        // Create payment data
        const paymentData = {
            type: 'coin_purchase',
            amount: this.selectedTariff.amount,
            price: this.selectedTariff.price,
            payment_method: this.selectedPaymentMethod,
            timestamp: new Date().toISOString()
        };
        
        // In a real app, we would send this to the backend
        // For now, just show a confirmation
        let confirmMessage = `Purchase ${this.selectedTariff.amount} FH coins for ${this.selectedTariff.price} USDT using ${this.selectedPaymentMethod}?`;
        
        const confirmed = await telegramHandler.showConfirm(confirmMessage);
        
        if (confirmed) {
            // Send data to Telegram
            const success = telegramHandler.sendData(paymentData);
            
            if (success) {
                // Add to transaction history (in a real app this would come from the server)
                this.addToTransactionHistory(paymentData);
                
                // Show success message
                telegramHandler.showAlert('Payment processed successfully!');
                
                // Update FH balance (mock for demo purposes)
                this.updateFHBalance(parseInt(this.selectedTariff.amount));
                
                // Close the modal
                this.closeModal();
            } else {
                telegramHandler.showAlert('Failed to process payment. Please try again.');
            }
        }
    }

    addToTransactionHistory(paymentData) {
        // This is a mock function that would typically communicate with a backend
        // For demo purposes, we'll just add to a local array
        if (!window.transactionHistory) {
            window.transactionHistory = [];
        }
        
        window.transactionHistory.push({
            id: 'tx_' + Date.now(),
            type: 'purchase',
            amount: paymentData.amount,
            price: paymentData.price,
            method: paymentData.payment_method,
            date: new Date().toLocaleDateString(),
            status: 'completed'
        });
        
        // Update the UI if on the profile page
        const transactionsList = document.querySelector('.transaction-list');
        if (transactionsList) {
            this.updateTransactionHistoryUI();
        }
    }

    updateTransactionHistoryUI() {
        const transactionsList = document.querySelector('.transaction-list');
        if (!transactionsList) return;
        
        // Clear current items
        transactionsList.innerHTML = '';
        
        if (window.transactionHistory && window.transactionHistory.length > 0) {
            // Add each transaction
            window.transactionHistory.forEach(tx => {
                const item = document.createElement('div');
                item.className = 'transaction-item';
                
                item.innerHTML = `
                    <div class="transaction-icon">
                        <i class="fa-solid fa-coins"></i>
                    </div>
                    <div class="transaction-details">
                        <div class="transaction-title">Purchase ${tx.amount} FH coins</div>
                        <div class="transaction-date">${tx.date}</div>
                    </div>
                    <div class="transaction-amount">
                        ${tx.price} USDT
                    </div>
                `;
                
                transactionsList.appendChild(item);
            });
        } else {
            // Show empty state
            transactionsList.innerHTML = '<div class="empty-state text-center"><p>No transactions yet</p></div>';
        }
    }

    updateFHBalance(amount) {
        // In a real app, this would come from the server
        // For demo purposes, we'll just update the UI
        if (!window.fhBalance) {
            window.fhBalance = 0;
        }
        
        window.fhBalance += amount;
        
        // Update all FH balance displays
        const balanceElements = document.querySelectorAll('.currency-amount');
        balanceElements.forEach(el => {
            el.textContent = window.fhBalance;
        });
    }
}

// Navigation Handler
class NavigationHandler {
    constructor() {
        this.navItems = document.querySelectorAll('.nav-item');
        this.currentPage = 'search';
        this.pages = {
            search: document.getElementById('searchPage'),
            tariffs: document.getElementById('tariffsPage'),
            history: document.getElementById('historyPage'),
            profile: document.getElementById('profilePage')
        };
        this.welcomeScreen = document.getElementById('welcomeScreen');
        this.welcomeButton = document.getElementById('welcomeButton');
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.showWelcomeScreen();
    }

    setupEventListeners() {
        this.navItems.forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                this.navigateToPage(page);
            });
        });

        // Welcome screen continue button
        if (this.welcomeButton) {
            this.welcomeButton.addEventListener('click', () => {
                this.hideWelcomeScreen();
            });
        }

        // Profile tab navigation
        const profileTabs = document.querySelectorAll('.profile-tab');
        profileTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                this.switchProfileTab(tabName);
            });
        });
    }

    navigateToPage(page) {
        // Remove active class from all items
        this.navItems.forEach(item => {
            item.classList.remove('active');
        });

        // Add active class to selected item
        const selectedItem = document.querySelector(`[data-page="${page}"]`);
        selectedItem.classList.add('active');

        // Hide all pages
        Object.values(this.pages).forEach(pageElement => {
            if (pageElement) pageElement.classList.add('hidden');
        });

        // Show selected page
        if (this.pages[page]) {
            this.pages[page].classList.remove('hidden');
        }

        // Handle page-specific actions
        switch (page) {
            case 'search':
                this.showSearchPage();
                break;
            case 'tariffs':
                this.showTariffsPage();
                break;
            case 'history':
                this.showHistoryPage();
                break;
            case 'profile':
                this.showProfilePage();
                break;
        }

        this.currentPage = page;
    }

    showWelcomeScreen() {
        if (this.welcomeScreen) {
            this.welcomeScreen.style.display = 'flex';
            
            // Hide all page content
            Object.values(this.pages).forEach(pageElement => {
                if (pageElement) pageElement.classList.add('hidden');
            });
        }
    }

    hideWelcomeScreen() {
        if (this.welcomeScreen) {
            this.welcomeScreen.style.opacity = '0';
            this.welcomeScreen.style.pointerEvents = 'none';
            
            setTimeout(() => {
                this.welcomeScreen.style.display = 'none';
                // Show default page
                this.navigateToPage('search');
            }, 500);
        }
    }

    showSearchPage() {
        // Reset UI elements if needed
        const previewSection = document.querySelector('.preview-section');
        if (previewSection) {
            previewSection.style.display = 'none';
        }
    }

    showTariffsPage() {
        // Any specific actions for tariffs page
        // No need to show the modal anymore as tariffs are now a dedicated page
    }

    showHistoryPage() {
        // Load history data if needed
        this.loadHistoryData();
    }

    showProfilePage() {
        // Load user profile data
        this.loadProfileData();
    }

    loadHistoryData() {
        // This would typically fetch data from an API
        // For now, we'll populate with dummy data
        const historySection = document.querySelector('.history-section');
        
        if (historySection) {
            // Clear existing items
            historySection.innerHTML = '';
            
            // Check if there's any history data
            if (window.searchHistory && window.searchHistory.length > 0) {
                window.searchHistory.forEach(item => {
                    const historyItem = this.createHistoryItem(item);
                    historySection.appendChild(historyItem);
                });
            } else {
                // Show empty state
                historySection.innerHTML = '<div class="empty-state text-center"><p>No search history yet</p></div>';
            }
        }
    }

    createHistoryItem(item) {
        const div = document.createElement('div');
        div.className = 'card history-item';
        
        div.innerHTML = `
            <div class="history-item-image">
                <img src="${item.image || 'https://via.placeholder.com/80'}" alt="Search image">
            </div>
            <div class="history-item-details">
                <div class="history-item-date">${item.date || new Date().toLocaleDateString()}</div>
                <div class="history-item-results">${item.results || 'No results found'}</div>
            </div>
        `;
        
        return div;
    }

    loadProfileData() {
        // Load user profile from Telegram if available
        if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
            const user = window.Telegram.WebApp.initDataUnsafe.user;
            
            const profileName = document.getElementById('profileName');
            const profileUsername = document.getElementById('profileUsername');
            const profileAvatar = document.getElementById('profileAvatar');
            
            if (profileName) {
                profileName.textContent = user.first_name + (user.last_name ? ' ' + user.last_name : '');
            }
            
            if (profileUsername) {
                profileUsername.textContent = user.username ? '@' + user.username : '';
            }
            
            // Telegram doesn't provide avatar in WebApp, would need to be fetched separately
        }
    }

    switchProfileTab(tabName) {
        // Update tab UI
        const tabs = document.querySelectorAll('.profile-tab');
        tabs.forEach(tab => {
            tab.classList.remove('active');
        });
        
        const selectedTab = document.querySelector(`.profile-tab[data-tab="${tabName}"]`);
        if (selectedTab) selectedTab.classList.add('active');
        
        // Update content
        const tabContents = document.querySelectorAll('.profile-tab-content');
        tabContents.forEach(content => {
            content.classList.remove('active');
        });
        
        const selectedContent = document.getElementById(`${tabName}Tab`);
        if (selectedContent) selectedContent.classList.add('active');
    }
}

// Check if DOM is already loaded
function domReady(callback) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', callback);
    } else {
        callback();
    }
}

// Initialize handlers after DOM is fully loaded
domReady(() => {
    console.log('DOM Ready - Initializing handlers');
    
    try {
        // Check if running in Telegram WebApp
        if (!window.Telegram?.WebApp) {
            console.error('Telegram WebApp is not available');
            document.body.innerHTML = '<div class="error">This app must be opened in Telegram</div>';
            return;
        }

        // Initialize Telegram WebApp
        window.Telegram.WebApp.expand();
        window.Telegram.WebApp.ready();

        console.log('Creating handler instances');
        
        // Create global handler instances
        window.telegramHandler = new TelegramHandler();
        window.uploadHandler = new UploadHandler();
        window.modalHandler = new ModalHandler();
        window.navigationHandler = new NavigationHandler();

        // Handle errors
        window.onerror = function(message, source, lineno, colno, error) {
            console.error('Global error:', { message, source, lineno, colno, error });
            if (window.telegramHandler) {
                window.telegramHandler.showAlert('An error occurred. Please try again.');
            }
            return false;
        };

        // Handle unhandled promise rejections
        window.onunhandledrejection = function(event) {
            console.error('Unhandled promise rejection:', event.reason);
            if (window.telegramHandler) {
                window.telegramHandler.showAlert('An error occurred. Please try again.');
            }
        };
        
        console.log('Handler initialization complete');
        
        // Hide loading screen
        document.body.classList.add('loaded');
    } catch (error) {
        console.error('Fatal error during initialization:', error);
        // Try to hide loading screen even on error
        document.body.classList.add('loaded');
    }
}); 