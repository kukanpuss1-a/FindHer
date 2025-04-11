class UploadHandler {
    constructor() {
        try {
            console.log("Initializing UploadHandler");
            this.uploadBox = document.querySelector('.upload-box');
            
            if (!this.uploadBox) {
                console.error("Upload box element not found");
                return;
            }
            
            this.photoInput = document.getElementById('photoInput');
            this.previewSection = document.querySelector('.preview-section');
            this.previewImage = document.getElementById('previewImage');
            this.searchButton = document.querySelector('.btn-search');
            this.cancelButton = document.querySelector('.btn-cancel');
            
            this.selectedFile = null;
            
            this.init();
            console.log("UploadHandler initialized successfully");
        } catch (error) {
            console.error("Error initializing UploadHandler:", error);
        }
    }

    init() {
        try {
            this.setupEventListeners();
        } catch (error) {
            console.error("Error in UploadHandler.init:", error);
        }
    }

    setupEventListeners() {
        try {
            // Handle click on upload box
            if (this.uploadBox && this.photoInput) {
                this.uploadBox.addEventListener('click', () => {
                    this.photoInput.click();
                });
            }

            // Handle file selection
            if (this.photoInput) {
                this.photoInput.addEventListener('change', (event) => {
                    this.handleFileSelect(event);
                });
            }

            // Handle drag and drop
            if (this.uploadBox) {
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
            
            console.log("UploadHandler event listeners set up");
        } catch (error) {
            console.error("Error setting up event listeners:", error);
        }
    }

    handleFileSelect(event) {
        try {
            const file = event.target.files[0];
            
            if (!file) return;
            
            console.log(`File selected: ${file.name}, type: ${file.type}, size: ${file.size} bytes`);

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
            
            // Show back button in Telegram
            if (window.telegramHandler && window.telegramHandler.webApp) {
                window.telegramHandler.webApp.BackButton.show();
            }
        } catch (error) {
            console.error("Error handling file selection:", error);
            this.showError('Error processing the selected file');
        }
    }

    showPreview(file) {
        try {
            console.log("Showing image preview");
            const reader = new FileReader();
            
            reader.onload = (e) => {
                if (this.previewImage) {
                    this.previewImage.src = e.target.result;
                }
                
                // Set the file type badge
                const fileTypeBadge = this.previewSection ? this.previewSection.querySelector('.file-type-badge') : null;
                if (fileTypeBadge) {
                    const extension = file.name.split('.').pop().toUpperCase();
                    fileTypeBadge.textContent = extension;
                }
                
                if (this.previewSection) {
                    this.previewSection.style.display = 'block';
                }
                
                if (this.uploadBox) {
                    this.uploadBox.style.display = 'none';
                }
            };
            
            reader.onerror = (error) => {
                console.error("Error reading file:", error);
                this.showError('Error reading the selected file');
            };

            reader.readAsDataURL(file);
        } catch (error) {
            console.error("Error showing preview:", error);
            this.showError('Error displaying image preview');
        }
    }

    cancelPreview() {
        try {
            console.log("Canceling preview");
            
            if (this.previewSection) {
                this.previewSection.style.display = 'none';
            }
            
            if (this.uploadBox) {
                this.uploadBox.style.display = 'block';
            }
            
            this.selectedFile = null;
            
            // Hide back button in Telegram
            if (window.telegramHandler && window.telegramHandler.webApp) {
                window.telegramHandler.webApp.BackButton.hide();
            }
        } catch (error) {
            console.error("Error canceling preview:", error);
        }
    }

    showError(message) {
        try {
            console.error(`Upload error: ${message}`);
            
            if (!this.uploadBox) return;
            
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
                if (errorMessage.parentNode === this.uploadBox) {
                    errorMessage.remove();
                }
            }, 3000);
        } catch (error) {
            console.error("Error showing error message:", error);
        }
    }

    async processImageSearch() {
        try {
            if (!this.selectedFile) {
                if (window.telegramHandler) {
                    window.telegramHandler.showAlert('No image selected');
                }
                return;
            }
            
            console.log("Processing image search");
            
            // Check if user has enough FH coins
            if (!window.fhBalance || window.fhBalance < 250) {
                if (window.telegramHandler) {
                    window.telegramHandler.showAlert('You need at least 250 FH coins to perform a search. Please purchase coins first.');
                }
                
                // Navigate to tariffs page
                if (window.navigationHandler) {
                    window.navigationHandler.navigateToPage('tariffs');
                }
                return;
            }
            
            // Show loading state
            if (this.searchButton) {
                this.searchButton.disabled = true;
                this.searchButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Searching...';
            }
            
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
            
            console.log("Sending search data to Telegram");
            
            // Send data to Telegram
            let success = false;
            if (window.telegramHandler) {
                success = window.telegramHandler.sendData(searchData);
            }
            
            if (success) {
                // Deduct FH coins
                if (window.modalHandler) {
                    window.modalHandler.updateFHBalance(-250);
                }
                
                // Add to search history
                this.addToSearchHistory(searchData);
                
                // Show success message
                if (window.telegramHandler) {
                    window.telegramHandler.showAlert('Search successful! Results will be available soon.');
                }
                
                // Reset the form
                this.cancelPreview();
            } else {
                if (window.telegramHandler) {
                    window.telegramHandler.showAlert('Failed to process search. Please try again.');
                }
            }
        } catch (error) {
            console.error("Error processing image search:", error);
            if (window.telegramHandler) {
                window.telegramHandler.showAlert('Error processing search');
            }
        } finally {
            // Reset button state
            if (this.searchButton) {
                this.searchButton.disabled = false;
                this.searchButton.innerHTML = '<i class="fa-solid fa-magnifying-glass"></i> Search Online';
            }
        }
    }

    addToSearchHistory(searchData) {
        try {
            console.log("Adding to search history");
            
            // This is a mock function that would typically communicate with a backend
            if (!window.searchHistory) {
                window.searchHistory = [];
            }
            
            // Add to history
            const searchItem = {
                id: 'search_' + Date.now(),
                image: this.previewImage ? this.previewImage.src : '',
                date: new Date().toLocaleDateString(),
                results: 'Processing...',
                status: 'pending'
            };
            
            window.searchHistory.unshift(searchItem);
            
            // Update UI if on history page
            if (window.navigationHandler && window.navigationHandler.currentPage === 'history') {
                window.navigationHandler.loadHistoryData();
            }
            
            // Also add to profile archive tab
            const archiveTab = document.getElementById('archiveTab');
            if (archiveTab) {
                const searchArchive = archiveTab.querySelector('.search-archive');
                if (searchArchive) {
                    // Clear empty state if present
                    const emptyState = searchArchive.querySelector('.empty-state');
                    if (emptyState) {
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
        } catch (error) {
            console.error("Error adding to search history:", error);
        }
    }

    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            try {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve(reader.result);
                reader.onerror = error => reject(error);
            } catch (error) {
                console.error("Error converting file to base64:", error);
                reject(error);
            }
        });
    }
}

// Initialize upload handler
// Note: This is now initialized in bundle.js 