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
        this.webApp.setHeaderColor('#0F1923');
        this.webApp.setBackgroundColor('#0F1923');

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
                // If preview is shown, go back to upload
                document.querySelector('.preview-section').style.display = 'none';
                document.querySelector('.upload-section').style.display = 'block';
                document.querySelector('.upload-box').style.display = 'block';
            } else {
                // Add your back navigation logic here
            }
        });

        // Add theme change handling
        this.webApp.onEvent('themeChanged', () => {
            this.updateColorScheme();
        });
    }

    updateColorScheme() {
        // Adjust colors based on Telegram theme if needed
        const colorScheme = this.webApp.colorScheme;
        document.body.setAttribute('data-theme', colorScheme);
    }

    showModal() {
        const modal = document.getElementById('tariffModal');
        modal.classList.add('show');
        this.webApp.BackButton.show();
    }

    closeModal() {
        const modal = document.getElementById('tariffModal');
        modal.classList.remove('show');
        
        // If we're on the main upload screen, hide back button
        if (document.querySelector('.preview-section').style.display === 'none') {
            this.webApp.BackButton.hide();
        }
    }

    sendData(data) {
        try {
            this.webApp.showPopup({
                title: "Sending Data",
                message: "Sending data to Telegram...",
                buttons: [{type: "ok"}]
            });
            
            setTimeout(() => {
                this.webApp.sendData(JSON.stringify(data));
            }, 1000);
            return true;
        } catch (error) {
            console.error('Error sending data to Telegram:', error);
            return false;
        }
    }

    showAlert(message) {
        this.webApp.showPopup({
            title: "Info",
            message: message,
            buttons: [{type: "ok"}]
        });
    }

    showConfirm(message) {
        return new Promise((resolve) => {
            this.webApp.showPopup({
                title: "Confirm",
                message: message,
                buttons: [
                    {type: "cancel", text: "Cancel"},
                    {type: "ok", text: "Confirm"}
                ]
            }, (buttonId) => {
                resolve(buttonId === 'ok');
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
        this.searchBtn = document.querySelector('.search-btn');
        this.resetBtn = document.querySelector('.reset-btn');
        this.platformSelection = document.querySelector('.platform-selection');
        
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

        // Reset button
        if (this.resetBtn) {
            this.resetBtn.addEventListener('click', () => {
                this.resetUpload();
            });
        }

        // Search button
        if (this.searchBtn) {
            this.searchBtn.addEventListener('click', () => {
                this.startSearch();
            });
        }
    }

    resetUpload() {
        this.photoInput.value = '';
        this.previewSection.style.display = 'none';
        this.uploadBox.style.display = 'block';
        telegramHandler.webApp.BackButton.hide();
    }

    startSearch() {
        // Show loading animation
        this.addLoadingOverlay();
        
        // Check if user has an active plan
        this.checkActivePlan().then(hasPlan => {
            if (hasPlan) {
                // Show platform selection
                this.removeLoadingOverlay();
                this.previewSection.style.display = 'none';
                this.platformSelection.style.display = 'block';
                platformHandler.init();
            } else {
                // Remove loading and show tariff modal
                this.removeLoadingOverlay();
                telegramHandler.showAlert("Please select a plan to start searching");
                modalHandler.showModal();
            }
        });
    }

    addLoadingOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        
        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';
        
        const text = document.createElement('div');
        text.className = 'loading-text';
        text.textContent = 'Processing your image...';
        
        overlay.appendChild(spinner);
        overlay.appendChild(text);
        
        this.previewSection.appendChild(overlay);
    }

    removeLoadingOverlay() {
        const overlay = this.previewSection.querySelector('.loading-overlay');
        if (overlay) {
            overlay.remove();
        }
    }

    checkActivePlan() {
        return new Promise((resolve) => {
            // In a real app, this would check with a server
            // For now, simulate the check with 50% chance of having a plan
            
            // Check if we have a stored plan in localStorage
            const storedPlan = localStorage.getItem('selectedPlan');
            const hasPlan = storedPlan ? true : false;
            
            // Simulate some processing time
            setTimeout(() => {
                resolve(hasPlan);
            }, 800);
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
        telegramHandler.webApp.BackButton.show();
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
            if (!file) {
                file = await this.getFileFromPreview();
            }
            
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

            // Remove loading overlay
            this.removeLoadingOverlay();

            // Show success message
            this.showSuccessMessage();

            const success = telegramHandler.sendData(data);
            
            if (!success) {
                this.showError('Failed to send photo to Telegram');
            }
        } catch (error) {
            console.error('Error processing photo:', error);
            this.showError('Error processing photo');
            this.removeLoadingOverlay();
        } finally {
            this.uploadBox.classList.remove('loading');
        }
    }

    getFileFromPreview() {
        return new Promise((resolve, reject) => {
            try {
                // Convert the preview image back to a File object
                fetch(this.previewImage.src)
                    .then(res => res.blob())
                    .then(blob => {
                        const file = new File([blob], "image.jpg", {
                            type: "image/jpeg"
                        });
                        resolve(file);
                    });
            } catch (error) {
                reject(error);
            }
        });
    }

    showSuccessMessage() {
        const successMsg = document.createElement('div');
        successMsg.className = 'upload-success-message';
        successMsg.innerHTML = '<i class="fas fa-check-circle"></i> Photo processed successfully!';
        
        // Add after preview image
        this.previewSection.appendChild(successMsg);
        
        // Remove after 5 seconds
        setTimeout(() => {
            successMsg.remove();
        }, 5000);
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

// Platform Handler
class PlatformHandler {
    constructor() {
        this.platformOptions = document.querySelectorAll('.platform-option');
        this.searchButton = document.querySelector('.search-platforms-btn');
        this.platformSelection = document.querySelector('.platform-selection');
        this.searchProgress = document.querySelector('.search-progress');
        this.previewSection = document.querySelector('.preview-section');
        this.historySection = document.querySelector('.history-section');
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Handle platform selection
        this.platformOptions.forEach(option => {
            option.addEventListener('click', () => {
                // Skip if coming soon
                if (option.querySelector('.platform-status.coming-soon')) {
                    telegramHandler.showAlert("This platform is coming soon. Please try OnlyFans for now.");
                    return;
                }
                
                // Toggle selected state (only for available platforms)
                if (!option.querySelector('.platform-status.coming-soon')) {
                    option.classList.toggle('selected');
                }
            });
        });

        // Handle search button
        this.searchButton.addEventListener('click', () => {
            this.startSearch();
        });
    }

    startSearch() {
        // Check if at least one platform is selected
        const selectedPlatforms = document.querySelectorAll('.platform-option.selected');
        if (selectedPlatforms.length === 0) {
            telegramHandler.showAlert("Please select at least one platform to search.");
            return;
        }

        // Hide platform selection, show search progress
        this.platformSelection.style.display = 'none';
        this.searchProgress.style.display = 'block';

        // Get the platforms that were selected
        const platforms = Array.from(selectedPlatforms).map(platform => {
            return {
                name: platform.querySelector('.platform-name').textContent,
                id: platform.dataset.platform
            };
        });

        // Simulate search process
        this.simulateSearchProcess(platforms);
    }

    simulateSearchProcess(platforms) {
        // Get the image from preview
        const imageUrl = document.getElementById('previewImage').src;
        
        // Update progress text
        const progressText = document.querySelector('.progress-text');
        let platformIndex = 0;
        
        // Update progress text periodically
        const updateInterval = setInterval(() => {
            if (platformIndex < platforms.length) {
                progressText.textContent = `Scanning ${platforms[platformIndex].name}...`;
                platformIndex++;
            } else {
                clearInterval(updateInterval);
            }
        }, 2000);
        
        // Simulate search completion after 6 seconds
        setTimeout(() => {
            clearInterval(updateInterval);
            this.completeSearch(platforms, imageUrl);
        }, 6000);
    }

    completeSearch(platforms, imageUrl) {
        // Hide search progress
        this.searchProgress.style.display = 'none';
        
        // Generate random results
        const results = this.generateSearchResults(platforms);
        
        // Add to history
        this.addToHistory(imageUrl, results);
        
        // Show history section
        this.historySection.style.display = 'block';
        
        // Update navigation to history
        document.querySelector('.nav-item[data-page="history"]').click();
    }

    generateSearchResults(platforms) {
        const results = [];
        
        platforms.forEach(platform => {
            // Generate random results (with higher chance of finding something on OnlyFans)
            const foundCount = platform.id === 'onlyfans' ? 
                Math.floor(Math.random() * 3) + 1 : // 1-3 results for OnlyFans
                Math.floor(Math.random() * 2);      // 0-1 results for others
            
            if (foundCount > 0) {
                results.push({
                    platform: platform.name,
                    count: foundCount,
                    date: new Date(),
                    links: this.generateFakeLinks(platform.name, foundCount)
                });
            }
        });
        
        return results;
    }

    generateFakeLinks(platform, count) {
        const links = [];
        const usernames = ['sophia_hot', 'emma_sexy', 'mia_love', 'lisa_dreams', 'amanda_joy'];
        
        for (let i = 0; i < count; i++) {
            const randomUsername = usernames[Math.floor(Math.random() * usernames.length)];
            links.push({
                username: randomUsername,
                url: `https://${platform.toLowerCase().replace(/\s+/g, '')}.com/${randomUsername}`,
                confidence: Math.floor(Math.random() * 20) + 80 // 80-99% confidence
            });
        }
        
        return links;
    }

    addToHistory(imageUrl, results) {
        const historyContainer = document.getElementById('historyContainer');
        
        // Remove empty history message if it exists
        const emptyHistory = historyContainer.querySelector('.empty-history');
        if (emptyHistory) {
            emptyHistory.remove();
        }
        
        // Create history item
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        
        // Add timestamp
        const timestamp = document.createElement('div');
        timestamp.className = 'history-timestamp';
        timestamp.textContent = HelperUtils.formatDate(new Date());
        
        // Add image thumbnail
        const thumbnail = document.createElement('div');
        thumbnail.className = 'history-thumbnail';
        const img = document.createElement('img');
        img.src = imageUrl;
        thumbnail.appendChild(img);
        
        // Add results
        const resultsContainer = document.createElement('div');
        resultsContainer.className = 'history-results';
        
        if (results.length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'no-results';
            noResults.textContent = 'No matches found';
            resultsContainer.appendChild(noResults);
        } else {
            results.forEach(result => {
                const resultItem = document.createElement('div');
                resultItem.className = 'result-item';
                
                const platformName = document.createElement('div');
                platformName.className = 'platform-name';
                platformName.textContent = `${result.platform}: `;
                
                const resultCount = document.createElement('span');
                resultCount.className = 'result-count';
                resultCount.textContent = `${result.count} match${result.count > 1 ? 'es' : ''}`;
                
                const resultLinks = document.createElement('div');
                resultLinks.className = 'result-links';
                
                result.links.forEach(link => {
                    const linkItem = document.createElement('a');
                    linkItem.href = 'javascript:void(0)'; // Dummy link
                    linkItem.className = 'result-link';
                    linkItem.textContent = `@${link.username} (${link.confidence}% match)`;
                    
                    // Show alert when clicked
                    linkItem.addEventListener('click', () => {
                        telegramHandler.showAlert(`This would open ${link.url} in a new window.`);
                    });
                    
                    resultLinks.appendChild(linkItem);
                });
                
                platformName.appendChild(resultCount);
                resultItem.appendChild(platformName);
                resultItem.appendChild(resultLinks);
                resultsContainer.appendChild(resultItem);
            });
        }
        
        // Assemble history item
        historyItem.appendChild(timestamp);
        historyItem.appendChild(thumbnail);
        historyItem.appendChild(resultsContainer);
        
        // Add to container
        historyContainer.prepend(historyItem);
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
            // Show simulated processing
            const button = this.modal.querySelector(`div.tariff-option:has(h3:contains('${tariffName}')) button.select-tariff`);
            if (button) {
                const originalText = button.textContent;
                button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
                button.disabled = true;
                
                setTimeout(() => {
                    button.innerHTML = '<i class="fas fa-check"></i> Selected!';
                    
                    setTimeout(() => {
                        // Send tariff selection to Telegram
                        const data = {
                            type: 'tariff_selection',
                            tariff: tariffName,
                            price: tariffPrice
                        };

                        const success = telegramHandler.sendData(data);

                        if (success) {
                            telegramHandler.showAlert('Tariff selected successfully! You can now start searching.');
                            this.closeModal();
                            
                            // Update button state
                            button.innerHTML = originalText;
                            button.disabled = false;
                        } else {
                            telegramHandler.showAlert('Failed to process tariff selection. Please try again.');
                            button.innerHTML = originalText;
                            button.disabled = false;
                        }
                    }, 1000);
                }, 2000);
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

        // If preview is not showing, show upload section
        const previewSection = document.querySelector('.preview-section');
        const uploadSection = document.querySelector('.upload-section');
        const uploadBox = document.querySelector('.upload-box');
        
        if (previewSection.style.display !== 'block') {
            uploadSection.style.display = 'block';
            uploadBox.style.display = 'block';
            previewSection.style.display = 'none';
            telegramHandler.webApp.BackButton.hide();
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

        // Hide all sections except history
        document.querySelector('.upload-section').style.display = 'none';
        document.querySelector('.preview-section').style.display = 'none';
        document.querySelector('.platform-selection').style.display = 'none';
        document.querySelector('.search-progress').style.display = 'none';

        // Show history section
        document.querySelector('.history-section').style.display = 'block';
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
    static generateUniqueId(prefix = 'id') {
        return `${prefix}_${Math.random().toString(36).substring(2, 11)}`;
    }

    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    static formatDate(date) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        return `${day}.${month}.${year} ${hours}:${minutes}`;
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

// Plan Handler
class PlanHandler {
    constructor() {
        this.planCards = document.querySelectorAll('.tariff-card');
        this.buyButtons = document.querySelectorAll('.tariff-buy-btn');
        this.paymentMethods = document.querySelectorAll('.payment-method-item');
        this.payButton = document.querySelector('.payment-button');
        this.paymentSection = document.querySelector('.payment-section');
        this.tariffSection = document.querySelector('.tariff-section');
        this.paymentSuccessBlock = document.querySelector('.payment-success');
        this.backToSearchBtn = document.querySelector('.back-to-search-btn');
        
        this.selectedPlan = null;
        this.selectedPaymentMethod = null;
    }

    init() {
        this.initEventListeners();
    }

    initEventListeners() {
        // Plan selection
        this.planCards.forEach(card => {
            card.addEventListener('click', () => {
                this.selectPlan(card);
            });
        });

        // Buy button clicks
        this.buyButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent the card click event
                const card = button.closest('.tariff-card');
                this.selectPlan(card);
                this.showPaymentMethods();
            });
        });

        // Payment method selection
        this.paymentMethods.forEach(method => {
            method.addEventListener('click', () => {
                this.selectPaymentMethod(method);
            });
        });

        // Pay button click
        if (this.payButton) {
            this.payButton.addEventListener('click', () => {
                this.processPayment();
            });
        }

        // Back to search button click
        if (this.backToSearchBtn) {
            this.backToSearchBtn.addEventListener('click', () => {
                this.hidePaymentSuccess();
                document.querySelector('.upload-section').classList.remove('hidden');
                document.querySelector('.tariff-section').classList.add('hidden');
            });
        }
    }

    selectPlan(card) {
        // Remove 'selected' class from all cards
        this.planCards.forEach(c => c.classList.remove('selected'));
        
        // Add 'selected' class to the clicked card
        card.classList.add('selected');
        
        // Store the selected plan
        this.selectedPlan = {
            id: card.dataset.planId,
            name: card.querySelector('.tariff-name').textContent,
            price: card.querySelector('.tariff-price').textContent,
        };
    }

    showPaymentMethods() {
        this.tariffSection.classList.add('hidden');
        this.paymentSection.classList.remove('hidden');
    }

    selectPaymentMethod(method) {
        // Remove 'selected' class from all methods
        this.paymentMethods.forEach(m => m.classList.remove('selected'));
        
        // Add 'selected' class to the clicked method
        method.classList.add('selected');
        
        // Store the selected payment method
        this.selectedPaymentMethod = method.dataset.method;
        
        // Enable the pay button
        this.payButton.disabled = false;
    }

    processPayment() {
        if (!this.selectedPlan || !this.selectedPaymentMethod) {
            return;
        }

        // Show loading state
        this.payButton.textContent = 'Processing...';
        this.payButton.disabled = true;

        // Simulate payment processing
        setTimeout(() => {
            // Store the selected plan in localStorage
            localStorage.setItem('selectedPlan', JSON.stringify(this.selectedPlan));
            
            // Show success message
            this.showPaymentSuccess();
        }, 2000);
    }

    showPaymentSuccess() {
        this.paymentSection.classList.add('hidden');
        this.paymentSuccessBlock.classList.remove('hidden');
    }

    hidePaymentSuccess() {
        this.paymentSuccessBlock.classList.add('hidden');
    }
}

// Initialize handlers
let telegramHandler;
let uploadHandler;
let modalHandler;
let navigationHandler;
let platformHandler;
let planHandler;

// Add CSS selector support for jQuery-like syntax
if (!HTMLElement.prototype.querySelectorAll) {
    Element.prototype.querySelectorAll = function(selector) {
        return document.querySelectorAll(selector);
    }
}

// Add contains selector for easier element selection
HTMLElement.prototype.contains = function(text) {
    return this.textContent.includes(text);
};

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
    platformHandler = new PlatformHandler();
    planHandler = new PlanHandler();

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