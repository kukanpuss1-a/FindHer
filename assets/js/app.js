document.addEventListener('DOMContentLoaded', function() {
    initApp();
});

// Global variables
let fhBalance = 0;
let currentUser = null;
let isAuthenticated = false;

// Variables for payments and platforms
let selectedPaymentMethod = null;
let selectedCryptoCurrency = null;
let selectedCoinPackage = null;
let selectedPlatforms = ['onlyfans']; // By default, only OnlyFans is available

// Initialize the application
function initApp() {
    // Hide loading screen once the app is ready
    setTimeout(() => {
        document.body.classList.add('loaded');
    }, 1000);

    // Initially hide the bottom navigation
    const bottomNav = document.querySelector('.bottom-nav');
    if (bottomNav) {
        bottomNav.classList.add('hidden');
    }

    // Init Telegram WebApp
    if (window.Telegram && window.Telegram.WebApp) {
        try {
            window.Telegram.WebApp.ready();
            const tgUser = window.Telegram.WebApp.initDataUnsafe.user;
            if (tgUser) {
                currentUser = tgUser;
                isAuthenticated = true;
                updateUserInfo(tgUser);
            }
        } catch (e) {
            console.error("Failed to initialize Telegram WebApp:", e);
        }
    }

    // Set up event listeners
    setupEventListeners();
    
    // First-time user sees welcome screen, returning user goes to search page
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    if (hasSeenWelcome) {
        showMainApp();
    } else {
        document.getElementById('welcomeScreen').classList.remove('hidden');
        document.getElementById('searchPage').classList.add('hidden');
    }
    
    // Load user balance
    loadUserBalance();
    
    // Load history data
    loadHistoryData();
}

// Show main app (after welcome screen)
function showMainApp() {
    // Hide welcome screen with animation
    const welcomeScreen = document.getElementById('welcomeScreen');
    if (welcomeScreen) {
        welcomeScreen.classList.add('hidden');
    }
    
    // Show search page
    const searchPage = document.getElementById('searchPage');
    if (searchPage) {
        searchPage.classList.remove('hidden');
        searchPage.classList.add('fade-in');
    }
    
    // Show bottom navigation with animation
    setTimeout(() => {
        const bottomNav = document.querySelector('.bottom-nav');
        if (bottomNav) {
            bottomNav.classList.remove('hidden');
        }
    }, 300);
}

// Set up all event listeners
function setupEventListeners() {
    // Welcome screen continue button
    const welcomeButton = document.querySelector('.welcome-button');
    if (welcomeButton) {
        welcomeButton.addEventListener('click', function() {
            localStorage.setItem('hasSeenWelcome', 'true');
            showMainApp();
        });
    }
    
    // Bottom navigation
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            navigateToPage(page);
        });
    });
    
    // Upload photo functionality
    const uploadBox = document.querySelector('.upload-box');
    if (uploadBox) {
        uploadBox.addEventListener('click', function() {
            document.getElementById('photoInput').click();
        });
    }
    
    // Photo input change
    const photoInput = document.getElementById('photoInput');
    if (photoInput) {
        photoInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                // Check file size (50MB limit)
                if (file.size > 50 * 1024 * 1024) {
                    showNotification('File size exceeds 50MB limit. Please choose a smaller file.', 'error');
                    return;
                }
                
                // Preview the image
                const reader = new FileReader();
                reader.onload = function(e) {
                    document.getElementById('previewImage').src = e.target.result;
                    document.querySelector('.preview-section').style.display = 'block';
                    
                    // Add animation
                    document.querySelector('.preview-section').classList.add('fade-in');
                    
                    // Don't hide upload section, just make it less visible
                    const uploadSection = document.querySelector('.upload-section');
                    uploadSection.style.opacity = '0.2';
                    uploadSection.style.transform = 'scale(0.95)';
                    uploadSection.style.transition = 'all 0.3s ease';
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    // Preview cancel button
    const cancelButton = document.querySelector('.btn-cancel');
    if (cancelButton) {
        cancelButton.addEventListener('click', function() {
            document.querySelector('.preview-section').style.display = 'none';
            document.getElementById('photoInput').value = '';
            
            // Restore upload section
            const uploadSection = document.querySelector('.upload-section');
            uploadSection.style.opacity = '1';
            uploadSection.style.transform = 'scale(1)';
        });
    }
    
    // Search button in preview
    const searchButton = document.querySelector('.btn-search');
    if (searchButton) {
        searchButton.addEventListener('click', function() {
            if (fhBalance < 250) {
                showNotification('Insufficient FH balance. Please purchase more coins.', 'error');
                navigateToPage('coins');
                return;
            }
            
            // Open platforms selection modal
            openModal('platformsModal');
        });
    }
    
    // Profile search button
    const searchNowButton = document.querySelector('.search-now-button');
    if (searchNowButton) {
        searchNowButton.addEventListener('click', function() {
            navigateToPage('search');
        });
    }
    
    // Action buttons in profile
    const actionButtons = document.querySelectorAll('.action-button');
    actionButtons.forEach(button => {
        button.addEventListener('click', function() {
            const action = this.textContent.trim();
            if (action.includes('Search Archive')) {
                navigateToPage('history');
            } else if (action.includes('Transactions')) {
                showNotification('Transaction history will be available soon.', 'info');
            }
        });
    });

    // Coins page buy buttons
    const buyButtons = document.querySelectorAll('.buy-button');
    if (buyButtons) {
        buyButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Get package details
                const amount = parseInt(this.getAttribute('data-amount'), 10);
                const price = parseFloat(this.getAttribute('data-price'));
                
                // Store selected package
                selectedCoinPackage = {
                    amount: amount,
                    price: price
                };
                
                // Update payment modal
                document.getElementById('coinAmount').textContent = amount;
                document.getElementById('coinPrice').textContent = price;
                
                // Show payment modal
                openModal('paymentModal');
            });
        });
    }
    
    // Payment method selection
    const paymentMethods = document.querySelectorAll('.payment-method');
    if (paymentMethods) {
        paymentMethods.forEach(method => {
            method.addEventListener('click', function() {
                // Remove selected class from all methods
                paymentMethods.forEach(m => m.classList.remove('selected'));
                
                // Add selected class to clicked method
                this.classList.add('selected');
                
                // Store selected method
                selectedPaymentMethod = this.getAttribute('data-method');
                
                // Enable proceed button
                document.querySelector('.payment-confirm').disabled = false;
            });
        });
    }
    
    // Payment confirm button
    const paymentConfirm = document.querySelector('.payment-confirm');
    if (paymentConfirm) {
        paymentConfirm.addEventListener('click', function() {
            if (selectedPaymentMethod === 'cryptobot') {
                // Open crypto selection modal for CryptoBot
                closeModal('paymentModal');
                openModal('cryptoBotModal');
            } else {
                // For other payment methods, simulate payment process
                processPayment(selectedPaymentMethod);
            }
        });
    }
    
    // CryptoBot currency selection
    const cryptoMethods = document.querySelectorAll('.crypto-method');
    if (cryptoMethods) {
        cryptoMethods.forEach(method => {
            method.addEventListener('click', function() {
                // Remove selected class from all methods
                cryptoMethods.forEach(m => m.classList.remove('selected'));
                
                // Add selected class to clicked method
                this.classList.add('selected');
                
                // Store selected crypto
                selectedCryptoCurrency = this.getAttribute('data-crypto');
                
                // Enable confirm button
                document.querySelector('.crypto-confirm').disabled = false;
            });
        });
    }
    
    // CryptoBot confirm button
    const cryptoConfirm = document.querySelector('.crypto-confirm');
    if (cryptoConfirm) {
        cryptoConfirm.addEventListener('click', function() {
            // Process payment with CryptoBot and selected cryptocurrency
            processPayment('cryptobot', selectedCryptoCurrency);
            closeModal('cryptoBotModal');
        });
    }
    
    // Modal close buttons
    const closeButtons = document.querySelectorAll('.close-modal');
    if (closeButtons) {
        closeButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Get the parent modal
                const modal = this.closest('.modal');
                if (modal) {
                    closeModal(modal.id);
                }
            });
        });
    }
    
    // Platform selection
    const platformMethods = document.querySelectorAll('.platform-method:not(.disabled)');
    if (platformMethods) {
        platformMethods.forEach(platform => {
            platform.addEventListener('click', function() {
                // Toggle active class
                this.classList.toggle('active');
                
                // Update selected platforms
                const platformId = this.getAttribute('data-platform');
                if (this.classList.contains('active')) {
                    // Add to selected platforms if not already included
                    if (!selectedPlatforms.includes(platformId)) {
                        selectedPlatforms.push(platformId);
                    }
                } else {
                    // Remove from selected platforms
                    selectedPlatforms = selectedPlatforms.filter(p => p !== platformId);
                }
            });
        });
    }
    
    // Platform confirm button
    const platformConfirm = document.querySelector('.platform-confirm');
    if (platformConfirm) {
        platformConfirm.addEventListener('click', function() {
            // Process search with selected platforms
            processSearch(selectedPlatforms);
            closeModal('platformsModal');
        });
    }
}

// Navigate to specific page
function navigateToPage(page) {
    // Hide all pages
    const pages = document.querySelectorAll('.page-content');
    pages.forEach(p => {
        p.classList.add('hidden');
    });
    
    // Remove active class from all nav items
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.classList.remove('active');
    });
    
    // Show selected page
    const targetPage = document.getElementById(page + 'Page');
    if (targetPage) {
        targetPage.classList.remove('hidden');
        targetPage.classList.add('fade-in');
    }
    
    // Set active nav item
    const activeNavItem = document.querySelector(`.nav-item[data-page="${page}"]`);
    if (activeNavItem) {
        activeNavItem.classList.add('active');
    }
}

// Update user information
function updateUserInfo(user) {
    if (!user) return;
    
    // Update profile
    const profileName = document.getElementById('profileName');
    const profileUsername = document.getElementById('profileUsername');
    const profileAvatar = document.getElementById('profileAvatar');
    
    if (profileName) {
        profileName.textContent = user.first_name || 'User';
    }
    
    if (profileUsername) {
        profileUsername.textContent = user.username ? '@' + user.username : '@user';
    }
    
    if (profileAvatar) {
        // Try to use Telegram avatar
        if (user.photo_url) {
            profileAvatar.src = user.photo_url;
        } else {
            // Use default Telegram avatar
            const defaultAvatar = document.getElementById('defaultAvatar');
            if (defaultAvatar) {
                profileAvatar.src = defaultAvatar.src;
            } else {
                // Fallback to a default placeholder
                profileAvatar.src = 'https://t.me/i/userpic/320/default_profile.jpg';
            }
        }
    }
}

// Load user balance
function loadUserBalance() {
    const savedBalance = localStorage.getItem('fhBalance');
    if (savedBalance !== null) {
        fhBalance = parseInt(savedBalance, 10);
    }
    updateBalanceDisplay();
}

// Update balance displays
function updateBalanceDisplay() {
    const balanceDisplays = document.querySelectorAll('.currency-badge span');
    balanceDisplays.forEach(display => {
        display.textContent = fhBalance + ' FH';
    });
}

// Load search history
function loadHistoryData() {
    const savedHistory = localStorage.getItem('searchHistory');
    let historyData = [];
    
    if (savedHistory) {
        try {
            historyData = JSON.parse(savedHistory);
        } catch (e) {
            console.error('Failed to parse history data', e);
        }
    }
    
    if (historyData.length === 0) {
        // Sample data
        historyData = [
            {
                id: 'search_1',
                date: '2023-11-10',
                results: 'Found on 3 websites'
            },
            {
                id: 'search_2',
                date: '2023-11-15',
                results: 'Found on 5 websites'
            }
        ];
    }
    
    renderHistoryItems(historyData);
}

// Render history items
function renderHistoryItems(historyData) {
    const historySection = document.querySelector('.history-section');
    if (!historySection) return;
    
    historySection.innerHTML = '';
    
    historyData.forEach(item => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
            <div class="history-item-image">
                <i class="fa-regular fa-image"></i>
            </div>
            <div class="history-item-details">
                <div class="history-item-date">${item.date}</div>
                <div class="history-item-results">${item.results}</div>
            </div>
        `;
        
        historySection.appendChild(historyItem);
    });
}

// Add new search to history
function addSearchToHistory(platforms = ['onlyfans']) {
    const savedHistory = localStorage.getItem('searchHistory');
    let historyData = [];
    
    if (savedHistory) {
        try {
            historyData = JSON.parse(savedHistory);
        } catch (e) {
            console.error('Failed to parse history data', e);
        }
    }
    
    // Create new search entry
    const newSearch = {
        id: 'search_' + Date.now(),
        date: new Date().toISOString().slice(0, 10),
        results: 'Processing... Please check back later.',
        platforms: platforms
    };
    
    // Add to history
    historyData.unshift(newSearch);
    
    // Save updated history
    localStorage.setItem('searchHistory', JSON.stringify(historyData));
    
    // Update UI if on history page
    if (!document.getElementById('historyPage').classList.contains('hidden')) {
        renderHistoryItems(historyData);
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element if it doesn't exist
    let notification = document.getElementById('notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        document.body.appendChild(notification);
    }
    
    // Set type class
    notification.className = 'notification';
    notification.classList.add(type);
    
    // Set message
    notification.textContent = message;
    
    // Show notification
    notification.classList.add('show');
    
    // Hide after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Process payment
function processPayment(method, cryptoType = null) {
    // Show loading screen
    document.body.classList.remove('loaded');
    
    // Simulate payment process
    setTimeout(() => {
        // Add coins to balance
        if (selectedCoinPackage) {
            fhBalance += selectedCoinPackage.amount;
            updateBalanceDisplay();
            localStorage.setItem('fhBalance', fhBalance);
            
            // Add transaction to history
            addTransaction(selectedCoinPackage.amount, selectedCoinPackage.price, method, cryptoType);
        }
        
        // Hide loading and show success
        document.body.classList.add('loaded');
        
        // Show success notification
        let methodName = method === 'cryptobot' ? `CryptoBot (${cryptoType})` : method;
        showNotification(`Payment successful via ${methodName}! Added ${selectedCoinPackage.amount} FH coins.`, 'success');
        
        // Reset selection
        selectedPaymentMethod = null;
        selectedCryptoCurrency = null;
        selectedCoinPackage = null;
    }, 2000);
}

// Process search with selected platforms
function processSearch(platforms) {
    // Check if user has enough balance
    if (fhBalance < 250) {
        showNotification('Insufficient FH balance. Please purchase more coins.', 'error');
        navigateToPage('coins');
        return;
    }
    
    // Show loading screen
    document.body.classList.remove('loaded');
    
    // Simulate search process
    setTimeout(() => {
        // Deduct coins
        fhBalance -= 250;
        updateBalanceDisplay();
        localStorage.setItem('fhBalance', fhBalance);
        
        // Add search to history with platforms
        addSearchToHistory(platforms);
        
        // Hide loading and show results
        document.body.classList.add('loaded');
        
        // Show success notification
        showNotification(`Search completed on ${platforms.join(', ')}!`, 'success');
        
        // Reset UI
        document.querySelector('.preview-section').style.display = 'none';
        document.getElementById('photoInput').value = '';
        
        // Restore upload section
        const uploadSection = document.querySelector('.upload-section');
        uploadSection.style.opacity = '1';
        uploadSection.style.transform = 'scale(1)';
    }, 3000);
}

// Add transaction to history
function addTransaction(amount, price, method, cryptoType = null) {
    const savedTransactions = localStorage.getItem('transactions');
    let transactions = [];
    
    if (savedTransactions) {
        try {
            transactions = JSON.parse(savedTransactions);
        } catch (e) {
            console.error('Failed to parse transactions', e);
        }
    }
    
    // Create new transaction
    const methodName = method === 'cryptobot' ? `CryptoBot (${cryptoType})` : method;
    const newTransaction = {
        id: 'tx_' + Date.now(),
        date: new Date().toISOString().slice(0, 10),
        amount: amount,
        price: price,
        method: methodName
    };
    
    // Add to transactions
    transactions.unshift(newTransaction);
    
    // Save updated transactions
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

// Open modal
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
    }
}

// Close modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
    }
} 