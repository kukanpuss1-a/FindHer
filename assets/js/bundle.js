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
            } else {
                // Add your back navigation logic here
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
        const modal = document.getElementById('tariffModal');
        modal.classList.add('show');
        this.webApp.BackButton.show();
    }

    closeModal() {
        const modal = document.getElementById('tariffModal');
        modal.classList.remove('show');
        
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
        this.fileTypeBadge = document.querySelector('.file-type-badge');
        this.searchButton = document.querySelector('.btn-search');
        this.cancelButton = document.querySelector('.btn-cancel');
        
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
            this.uploadBox.querySelector('.upload-icon').classList.add('dragover');
        });

        this.uploadBox.addEventListener('dragleave', () => {
            this.uploadBox.classList.remove('dragover');
            this.uploadBox.querySelector('.upload-icon').classList.remove('dragover');
        });

        this.uploadBox.addEventListener('drop', (event) => {
            event.preventDefault();
            this.uploadBox.classList.remove('dragover');
            this.uploadBox.querySelector('.upload-icon').classList.remove('dragover');
            
            const files = event.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileSelect({ target: { files: files } });
            }
        });

        // Handle search button click
        this.searchButton?.addEventListener('click', () => {
            this.sendToTelegram();
        });

        // Handle cancel button click
        this.cancelButton?.addEventListener('click', () => {
            this.resetUpload();
        });
    }

    async handleFileSelect(event) {
        const file = event.target.files[0];
        
        if (!file) return;

        // Validate file
        const validation = await ValidationUtils.validateImage(file);
        if (!validation.isValid) {
            this.showError(validation.error);
            return;
        }

        this.uploadFile = file;
        this.showPreview(file);
        
        // Show back button
        telegramHandler.webApp.BackButton.show();
    }

    showPreview(file) {
        const reader = new FileReader();
        
        // Add loading state to upload box
        this.uploadBox.classList.add('loading');
        
        // Show file extension in badge
        const fileExt = file.name.split('.').pop().toUpperCase();
        this.fileTypeBadge.textContent = fileExt;
        
        reader.onload = (e) => {
            this.previewImage.src = e.target.result;
            this.previewSection.style.display = 'block';
            this.uploadBox.style.display = 'none';
            this.uploadBox.classList.remove('loading');
        };

        reader.readAsDataURL(file);
    }

    resetUpload() {
        this.previewSection.style.display = 'none';
        this.uploadBox.style.display = 'block';
        this.previewImage.src = '';
        this.photoInput.value = '';
        this.uploadFile = null;
        
        // Hide back button
        telegramHandler.webApp.BackButton.hide();
    }

    showError(message) {
        this.uploadBox.classList.add('error');
        
        // Remove existing error message if any
        const existingError = this.uploadBox.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.textContent = message;
        this.uploadBox.appendChild(errorMessage);
        
        // Remove error state after 3 seconds
        setTimeout(() => {
            this.uploadBox.classList.remove('error');
            errorMessage.remove();
        }, 3000);
    }

    async sendToTelegram() {
        if (!this.uploadFile) {
            this.showError('No file selected');
            return;
        }

        try {
            // Add loading overlay
            const loadingOverlay = document.createElement('div');
            loadingOverlay.className = 'loading-overlay';
            
            const spinner = document.createElement('div');
            spinner.className = 'loading-spinner';
            
            const loadingText = document.createElement('div');
            loadingText.className = 'loading-text';
            loadingText.textContent = 'Processing...';
            
            loadingOverlay.appendChild(spinner);
            loadingOverlay.appendChild(loadingText);
            
            this.previewSection.querySelector('.preview-container').appendChild(loadingOverlay);
            
            // Disable search button
            this.searchButton.disabled = true;
            
            // Compress image if it's too large
            let fileToSend = this.uploadFile;
            if (this.uploadFile.size > 1024 * 1024) { // If larger than 1MB
                fileToSend = await HelperUtils.compressImage(this.uploadFile);
            }
            
            // Convert file to base64
            const base64 = await this.fileToBase64(fileToSend);
            
            // Send data to Telegram
            const data = {
                type: 'photo_upload',
                photo: base64,
                filename: fileToSend.name,
                size: fileToSend.size,
                originalSize: this.uploadFile.size,
                timestamp: Date.now()
            };

            const success = telegramHandler.sendData(data);
            
            // Remove loading overlay
            setTimeout(() => {
                loadingOverlay.remove();
                this.searchButton.disabled = false;
                
                if (success) {
                    // Show success message or navigate to result page
                    telegramHandler.showAlert('Photo uploaded successfully! Search results will be available soon.');
                    // Reset upload for next image
                    this.resetUpload();
                } else {
                    this.showError('Failed to send photo to Telegram');
                }
            }, 1500); // Slight delay for better UX
            
        } catch (error) {
            console.error('Error processing photo:', error);
            this.showError('Error processing photo');
            this.searchButton.disabled = false;
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
        this.modal = document.getElementById('tariffModal');
        this.closeButton = this.modal.querySelector('.close-modal');
        this.tariffButtons = this.modal.querySelectorAll('.select-tariff');
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        // Show modal on page load after a short delay
        setTimeout(() => {
            this.showModal();
        }, 800);
    }

    setupEventListeners() {
        // Close modal when clicking the close button
        this.closeButton.addEventListener('click', () => {
            this.closeModal();
        });

        // Close modal when clicking outside
        this.modal.addEventListener('click', (event) => {
            if (event.target === this.modal) {
                this.closeModal();
            }
        });

        // Handle tariff selection
        this.tariffButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                const tariffOption = event.target.closest('.tariff-option');
                const tariffName = tariffOption.querySelector('h3').textContent;
                const tariffPrice = tariffOption.querySelector('.price').textContent;
                this.handleTariffSelection(tariffName, tariffPrice);
            });
        });
    }

    showModal() {
        this.modal.classList.add('show');
        telegramHandler.showModal();
    }

    closeModal() {
        this.modal.classList.remove('show');
        telegramHandler.closeModal();
    }

    async handleTariffSelection(tariffName, tariffPrice) {
        // Validate tariff selection
        const validation = ValidationUtils.validateTariffSelection(tariffName, tariffPrice);
        if (!validation.isValid) {
            telegramHandler.showAlert(validation.error);
            return;
        }
        
        const confirmed = await telegramHandler.showConfirm(
            `Are you sure you want to select the ${tariffName} plan for ${tariffPrice}?`
        );

        if (confirmed) {
            // Show loading indicator
            telegramHandler.showLoadingIndicator();
            
            setTimeout(() => {
                // Simulate API request
                const data = {
                    type: 'tariff_selection',
                    tariff: tariffName,
                    price: tariffPrice,
                    timestamp: Date.now()
                };

                const success = telegramHandler.sendData(data);
                telegramHandler.closeLoadingIndicator();

                if (success) {
                    telegramHandler.showAlert('Tariff selected successfully!');
                    this.closeModal();
                } else {
                    telegramHandler.showAlert('Failed to process tariff selection. Please try again.');
                }
            }, 1000);
        }
    }
}

// Navigation Handler
class NavigationHandler {
    constructor() {
        this.navItems = document.querySelectorAll('.nav-item');
        this.currentPage = 'search';
        
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.navItems.forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                this.navigateToPage(page);
            });
        });
    }

    navigateToPage(page) {
        // Skip if already on the page
        if (this.currentPage === page) return;
        
        // Remove active class from all items
        this.navItems.forEach(item => {
            item.classList.remove('active');
        });

        // Add active class to selected item
        const selectedItem = document.querySelector(`[data-page="${page}"]`);
        selectedItem.classList.add('active');

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
        }

        this.currentPage = page;
    }

    showSearchPage() {
        // Hide modal if it's open
        const modal = document.getElementById('tariffModal');
        if (modal.classList.contains('show')) {
            modalHandler.closeModal();
        }

        // Show upload section
        document.querySelector('.upload-section').style.display = 'block';
        
        // Only hide preview if needed
        if (uploadHandler.uploadFile === null) {
            document.querySelector('.preview-section').style.display = 'none';
        }
    }

    showTariffsPage() {
        // Show tariff modal
        modalHandler.showModal();
    }

    showHistoryPage() {
        // Hide modal if it's open
        const modal = document.getElementById('tariffModal');
        if (modal.classList.contains('show')) {
            modalHandler.closeModal();
        }

        // Hide upload and preview sections
        document.querySelector('.upload-section').style.display = 'none';
        document.querySelector('.preview-section').style.display = 'none';

        // Load history data
        this.loadHistoryData();
    }
    
    async loadHistoryData() {
        try {
            // Show loading spinner
            const container = document.querySelector('.container');
            const existingHistory = container.querySelector('.history-section');
            
            if (existingHistory) {
                existingHistory.remove();
            }
            
            const loadingSpinner = document.createElement('div');
            loadingSpinner.className = 'spinner';
            container.appendChild(loadingSpinner);
            
            // Fetch history data
            // For now, simulating with a delay
            setTimeout(async () => {
                try {
                    const response = await fetch('assets/js/history.json');
                    const data = await response.json();
                    
                    // Remove spinner
                    loadingSpinner.remove();
                    
                    // Display history
                    this.displayHistory(data.history);
                } catch (error) {
                    console.error('Error loading history:', error);
                    loadingSpinner.remove();
                    telegramHandler.showAlert('Failed to load history data');
                }
            }, 800);
            
        } catch (error) {
            console.error('Error in loadHistoryData:', error);
            telegramHandler.showAlert('An error occurred while loading history');
        }
    }
    
    displayHistory(historyData) {
        const container = document.querySelector('.container');
        
        // Create history section
        const historySection = document.createElement('div');
        historySection.className = 'history-section fade-in';
        
        // Add title
        const title = document.createElement('h2');
        title.className = 'section-title';
        title.textContent = 'Search History';
        historySection.appendChild(title);
        
        if (historyData.length === 0) {
            const emptyMessage = document.createElement('p');
            emptyMessage.className = 'text-center';
            emptyMessage.textContent = 'No search history yet';
            historySection.appendChild(emptyMessage);
        } else {
            // Create history items
            historyData.forEach(item => {
                const historyCard = document.createElement('div');
                historyCard.className = 'card mb-2';
                
                const cardContent = `
                    <div class="history-item">
                        <div class="history-item-image">
                            <img src="${item.image}" alt="Search">
                        </div>
                        <div class="history-item-details">
                            <div class="history-item-date">${HelperUtils.formatDate(new Date(item.date))}</div>
                            <div class="history-item-results">
                                <strong>Found on:</strong> ${item.results.map(r => r.platform).join(', ')}
                            </div>
                        </div>
                    </div>
                `;
                
                historyCard.innerHTML = cardContent;
                historySection.appendChild(historyCard);
            });
        }
        
        container.appendChild(historySection);
    }
}

// Validation Utils
class ValidationUtils {
    static validateImage(file) {
        // Check if file exists
        if (!file) {
            return {
                isValid: false,
                error: 'No file selected'
            };
        }

        // Check file type
        if (!file.type.startsWith('image/')) {
            return {
                isValid: false,
                error: 'Please select an image file'
            };
        }

        // Check file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB in bytes
        if (file.size > maxSize) {
            return {
                isValid: false,
                error: 'File size should be less than 5MB'
            };
        }

        // Check image dimensions
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                // Check minimum dimensions
                if (img.width < 100 || img.height < 100) {
                    resolve({
                        isValid: false,
                        error: 'Image dimensions should be at least 100x100 pixels'
                    });
                    return;
                }

                // Check maximum dimensions
                if (img.width > 4096 || img.height > 4096) {
                    resolve({
                        isValid: false,
                        error: 'Image dimensions should not exceed 4096x4096 pixels'
                    });
                    return;
                }

                resolve({
                    isValid: true,
                    error: null
                });
            };
            img.onerror = () => {
                resolve({
                    isValid: false,
                    error: 'Invalid image file'
                });
            };
            img.src = URL.createObjectURL(file);
        });
    }

    static validateTariffSelection(tariffName, tariffPrice) {
        const validTariffs = ['Standard', 'Premium'];
        const validPrices = ['8.99 USDT', '24.99 USDT'];

        if (!validTariffs.includes(tariffName)) {
            return {
                isValid: false,
                error: 'Invalid tariff selected'
            };
        }

        if (!validPrices.includes(tariffPrice)) {
            return {
                isValid: false,
                error: 'Invalid price for selected tariff'
            };
        }

        return {
            isValid: true,
            error: null
        };
    }
}

// Helper Utils
class HelperUtils {
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    static formatDate(date) {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    }

    static generateUniqueId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    static async loadImage(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = url;
        });
    }

    static getImageDimensions(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                resolve({
                    width: img.width,
                    height: img.height
                });
            };
            img.onerror = reject;
            img.src = URL.createObjectURL(file);
        });
    }

    static compressImage(file, maxWidth = 800, maxHeight = 800) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        resolve(new File([blob], file.name, {
                            type: 'image/jpeg',
                            lastModified: Date.now()
                        }));
                    },
                    'image/jpeg',
                    0.7
                );
            };
            img.onerror = reject;
            img.src = URL.createObjectURL(file);
        });
    }
    
    static addHistoryItem(data) {
        // This would typically send data to the server
        // For now, just logging
        console.log('Adding history item:', data);
    }
}

// Initialize handlers
let telegramHandler;
let uploadHandler;
let modalHandler;
let navigationHandler;

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Hide loading screen after 1 second
    setTimeout(() => {
        document.querySelector('.loading-screen')?.classList.add('hidden');
    }, 1000);
    
    // Check if running in Telegram WebApp
    if (!window.Telegram?.WebApp) {
        console.error('Telegram WebApp is not available');
        document.body.innerHTML = '<div style="color:white;text-align:center;padding:20px;">This app must be opened in Telegram</div>';
        return;
    }

    // Initialize handlers
    telegramHandler = new TelegramHandler();
    uploadHandler = new UploadHandler();
    modalHandler = new ModalHandler();
    navigationHandler = new NavigationHandler();

    // Handle errors
    window.onerror = function(message, source, lineno, colno, error) {
        console.error('Global error:', { message, source, lineno, colno, error });
        telegramHandler?.showAlert('An error occurred. Please try again.');
        return false;
    };

    // Handle unhandled promise rejections
    window.onunhandledrejection = function(event) {
        console.error('Unhandled promise rejection:', event.reason);
        telegramHandler?.showAlert('An error occurred. Please try again.');
    };

    // Add loading state to body
    document.body.classList.add('loaded');
}); 