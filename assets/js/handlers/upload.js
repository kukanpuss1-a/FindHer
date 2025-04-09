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

// Initialize upload handler
const uploadHandler = new UploadHandler(); 