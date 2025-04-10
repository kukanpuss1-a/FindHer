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

// Upload Handler
class UploadHandler {
    constructor() {
        this.uploadBox = document.querySelector('.upload-box');
        this.photoInput = document.getElementById('photoInput');
        this.previewSection = document.querySelector('.preview-section');
        this.previewImage = document.getElementById('previewImage');
        
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

        this.showPreview(file);
        this.sendToTelegram(file);
    }

    showPreview(file) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            this.previewImage.src = e.target.result;
            this.previewSection.style.display = 'block';
            this.uploadBox.style.display = 'none';
        };

        reader.readAsDataURL(file);
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

    async sendToTelegram(file) {
        try {
            this.uploadBox.classList.add('loading');
            
            // Convert file to base64
            const base64 = await this.fileToBase64(file);
            
            // Send data to Telegram
            const data = {
                type: 'photo_upload',
                photo: base64,
                filename: file.name,
                size: file.size
            };

            const success = telegramHandler.sendData(data);
            
            if (!success) {
                this.showError('Failed to send photo to Telegram');
            }
        } catch (error) {
            console.error('Error processing photo:', error);
            this.showError('Error processing photo');
        } finally {
            this.uploadBox.classList.remove('loading');
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
        // Show modal on page load
        this.showModal();
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
        const confirmed = await telegramHandler.showConfirm(
            `Are you sure you want to select the ${tariffName} plan for ${tariffPrice}?`
        );

        if (confirmed) {
            // Send tariff selection to Telegram
            const data = {
                type: 'tariff_selection',
                tariff: tariffName,
                price: tariffPrice
            };

            const success = telegramHandler.sendData(data);

            if (success) {
                telegramHandler.showAlert('Tariff selected successfully!');
                this.closeModal();
            } else {
                telegramHandler.showAlert('Failed to process tariff selection. Please try again.');
            }
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
        document.querySelector('.preview-section').style.display = 'none';
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

        // Show history section (to be implemented)
        // For now, just show a message
        telegramHandler.showAlert('History feature coming soon!');
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
        const validTariffs = ['Basic', 'Standard', 'Premium', 'Ultimate'];
        const validPrices = ['24 USDT', '34 USDT', '50 USDT', '69 USDT'];

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
}

// Initialize handlers
let telegramHandler;
let uploadHandler;
let modalHandler;
let navigationHandler;

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if running in Telegram WebApp
    if (!window.Telegram?.WebApp) {
        console.error('Telegram WebApp is not available');
        document.body.innerHTML = '<div class="error">This app must be opened in Telegram</div>';
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