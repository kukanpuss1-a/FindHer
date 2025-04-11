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

// Initialize upload handler
const uploadHandler = new UploadHandler(); 