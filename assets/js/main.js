// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if running in Telegram WebApp
    if (window.Telegram?.WebApp) {
        console.log('Telegram WebApp is available');
        window.Telegram.WebApp.expand();
        window.Telegram.WebApp.ready();
    } else {
        console.warn('Telegram WebApp is not available, running in browser mode');
    }

    // Initialize handlers
    initializeApp();
});

function initializeApp() {
    // Show tariff modal on startup
    const tariffModal = document.getElementById('tariffModal');
    if (tariffModal) {
        showModal(tariffModal);
    }

    // Initialize tariff functions
    initTariffPage();
    initModalHandlers();
    initNavigationHandlers();
    initUploadHandlers();
}

// Modal handling
function showModal(modal) {
    modal.classList.add('show');
}

function hideModal(modal) {
    modal.classList.remove('show');
}

function initModalHandlers() {
    const tariffModal = document.getElementById('tariffModal');
    const closeModalBtn = document.querySelector('.close-modal');
    const selectTariffBtns = document.querySelectorAll('.select-tariff');

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            hideModal(tariffModal);
        });
    }

    // Close modal when clicking outside
    if (tariffModal) {
        tariffModal.addEventListener('click', (event) => {
            if (event.target === tariffModal) {
                hideModal(tariffModal);
            }
        });
    }

    // Handle tariff selection from modal
    selectTariffBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tariffOption = btn.closest('.tariff-option');
            if (tariffOption) {
                const tariffName = tariffOption.querySelector('h3').textContent;
                const tariffPrice = tariffOption.querySelector('.price').textContent;
                const tariffDetails = tariffOption.querySelector('.details').textContent;
                
                // Store in localStorage for later use
                localStorage.setItem('selectedPlan', JSON.stringify({
                    name: tariffName,
                    price: tariffPrice,
                    details: tariffDetails
                }));
                
                hideModal(tariffModal);
            }
        });
    });
}

// Navigation handlers
function initNavigationHandlers() {
    const navItems = document.querySelectorAll('.nav-item');
    const tariffModal = document.getElementById('tariffModal');
    
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remove active class from all items
            navItems.forEach(i => i.classList.remove('active'));
            
            // Add active class to clicked item
            this.classList.add('active');
            
            // Handle page navigation
            const page = this.getAttribute('data-page');
            
            if (page === 'search') {
                showSection('upload-section');
            } else if (page === 'tariffs') {
                showModal(tariffModal);
            } else if (page === 'history') {
                showSection('history-section');
            }
        });
    });
}

function showSection(sectionClass) {
    // Hide all sections
    const sections = ['upload-section', 'preview-section', 'platform-selection', 'search-progress', 'history-section'];
    sections.forEach(section => {
        const element = document.querySelector(`.${section}`);
        if (element) element.style.display = 'none';
    });
    
    // Show requested section
    const section = document.querySelector(`.${sectionClass}`);
    if (section) section.style.display = 'block';
}

// Upload handling
function initUploadHandlers() {
    const uploadBox = document.querySelector('.upload-box');
    const photoInput = document.getElementById('photoInput');
    const previewImage = document.getElementById('previewImage');
    const previewSection = document.querySelector('.preview-section');
    const searchBtn = document.querySelector('.search-btn');
    const resetBtn = document.querySelector('.reset-btn');
    
    if (uploadBox && photoInput) {
        // Handle click on upload box
        uploadBox.addEventListener('click', () => {
            photoInput.click();
        });
        
        // Handle drag and drop
        uploadBox.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadBox.classList.add('drag-over');
        });
        
        uploadBox.addEventListener('dragleave', () => {
            uploadBox.classList.remove('drag-over');
        });
        
        uploadBox.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadBox.classList.remove('drag-over');
            
            if (e.dataTransfer.files.length) {
                photoInput.files = e.dataTransfer.files;
                handleFileUpload(e.dataTransfer.files[0]);
            }
        });
        
        // Handle file selection
        photoInput.addEventListener('change', function() {
            if (this.files.length) {
                handleFileUpload(this.files[0]);
            }
        });
    }
    
    // Handle file upload
    function handleFileUpload(file) {
        if (!file.type.match('image.*')) {
            alert('Please upload an image file');
            return;
        }
        
        if (file.size > 5 * 1024 * 1024) { // 5MB
            alert('File size exceeds 5MB limit');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            if (previewImage) {
                previewImage.src = e.target.result;
                showSection('preview-section');
            }
        };
        reader.readAsDataURL(file);
    }
    
    // Handle search button
    if (searchBtn) {
        searchBtn.addEventListener('click', async function() {
            const hasActivePlan = await checkActivePlan();
            if (hasActivePlan) {
                showSection('platform-selection');
            } else {
                const tariffModal = document.getElementById('tariffModal');
                showModal(tariffModal);
            }
        });
    }
    
    // Handle reset button
    if (resetBtn) {
        resetBtn.addEventListener('click', function() {
            showSection('upload-section');
            if (photoInput) photoInput.value = '';
            if (previewImage) previewImage.src = '';
        });
    }
    
    // Handle platform selection
    const platformOptions = document.querySelectorAll('.platform-option');
    const searchPlatformsBtn = document.querySelector('.search-platforms-btn');
    
    if (platformOptions.length) {
        platformOptions.forEach(option => {
            option.addEventListener('click', function() {
                // Skip if coming soon
                if (this.querySelector('.platform-status.coming-soon')) return;
                
                this.classList.toggle('selected');
            });
        });
    }
    
    if (searchPlatformsBtn) {
        searchPlatformsBtn.addEventListener('click', function() {
            const selectedPlatforms = document.querySelectorAll('.platform-option.selected');
            if (selectedPlatforms.length === 0) {
                alert('Please select at least one platform to search');
                return;
            }
            
            showSection('search-progress');
            simulateSearch();
        });
    }
}

// Check if user has active plan
function checkActivePlan() {
    return new Promise(resolve => {
        const selectedPlan = localStorage.getItem('selectedPlan');
        const hasActivePlan = !!selectedPlan;
        
        setTimeout(() => {
            resolve(hasActivePlan);
        }, 500);
    });
}

// Simulate search process
function simulateSearch() {
    const progressText = document.querySelector('.progress-text');
    let progress = 0;
    
    const interval = setInterval(() => {
        progress += 10;
        if (progressText) {
            if (progress < 30) {
                progressText.textContent = 'Analyzing image...';
            } else if (progress < 60) {
                progressText.textContent = 'Searching in selected platforms...';
            } else if (progress < 90) {
                progressText.textContent = 'Finalizing results...';
            }
        }
        
        if (progress >= 100) {
            clearInterval(interval);
            showSearchResults();
        }
    }, 500);
}

// Show search results
function showSearchResults() {
    // Add to history
    addToHistory();
    
    // Navigate to history section
    showSection('history-section');
}

// Add to history
function addToHistory() {
    const historyContainer = document.getElementById('historyContainer');
    const emptyHistory = document.querySelector('.empty-history');
    
    if (historyContainer && emptyHistory) {
        // Hide empty history message
        emptyHistory.style.display = 'none';
        
        // Create history item
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        
        // Add image thumbnail
        const thumbnail = document.createElement('div');
        thumbnail.className = 'history-thumbnail';
        const img = document.createElement('img');
        img.src = document.getElementById('previewImage').src;
        thumbnail.appendChild(img);
        
        // Add details
        const details = document.createElement('div');
        details.className = 'history-details';
        
        // Add date
        const date = document.createElement('div');
        date.className = 'history-date';
        date.textContent = new Date().toLocaleString();
        
        // Add platforms
        const platforms = document.createElement('div');
        platforms.className = 'history-platforms';
        
        const selectedPlatforms = document.querySelectorAll('.platform-option.selected');
        selectedPlatforms.forEach(platform => {
            const name = platform.querySelector('.platform-name').textContent;
            const platformItem = document.createElement('span');
            platformItem.className = 'history-platform';
            platformItem.textContent = name;
            platforms.appendChild(platformItem);
        });
        
        // Assemble history item
        details.appendChild(date);
        details.appendChild(platforms);
        historyItem.appendChild(thumbnail);
        historyItem.appendChild(details);
        
        // Add to container
        historyContainer.prepend(historyItem);
    }
}

// Tariff and Payment functionality
function initTariffPage() {
    const tariffBtns = document.querySelectorAll('.tariff-buy-btn');
    const paymentSection = document.getElementById('payment-section');
    const tariffSection = document.getElementById('tariff-section');
    const paymentBackBtn = document.getElementById('payment-back-btn');
    const processPaymentBtn = document.getElementById('process-payment-btn');
    const paymentMethodItems = document.querySelectorAll('.payment-method-item');
    const summaryPlanName = document.getElementById('payment-plan-name');
    const summarySearches = document.getElementById('payment-searches');
    const summaryTotalPrice = document.getElementById('payment-total-amount');
    const paymentSuccess = document.getElementById('payment-success');
    const backToSearchBtn = document.getElementById('back-to-search-btn');
    
    // Hide payment section initially
    if (paymentSection) {
        paymentSection.style.display = 'none';
    }
    
    // Handle tariff selection
    if (tariffBtns) {
        tariffBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const tariffId = this.getAttribute('data-tariff-id');
                selectTariff(tariffId);
            });
        });
    }
    
    // Handle payment method selection
    if (paymentMethodItems) {
        paymentMethodItems.forEach(item => {
            item.addEventListener('click', function() {
                // Remove active class from all payment methods
                paymentMethodItems.forEach(i => i.classList.remove('active'));
                
                // Add active class to selected method
                this.classList.add('active');
                
                // Enable process payment button
                if (processPaymentBtn) {
                    processPaymentBtn.removeAttribute('disabled');
                }
            });
        });
    }
    
    // Handle back to tariff button
    if (paymentBackBtn) {
        paymentBackBtn.addEventListener('click', function() {
            showTariffSection();
        });
    }
    
    // Handle process payment button
    if (processPaymentBtn) {
        processPaymentBtn.addEventListener('click', function() {
            processPayment();
        });
    }
    
    // Handle back to search button after successful payment
    if (backToSearchBtn) {
        backToSearchBtn.addEventListener('click', function() {
            if (paymentSection) paymentSection.style.display = 'none';
            showSection('upload-section');
        });
    }
    
    function selectTariff(tariffId) {
        // Get tariff details
        const tariffCard = document.querySelector(`.tariff-card[data-tariff-id="${tariffId}"]`);
        const tariffName = tariffCard.querySelector('.tariff-name').textContent;
        const tariffPrice = tariffCard.querySelector('.tariff-price').textContent;
        const searchCount = tariffCard.querySelector('.tariff-feature-item span').textContent;
        
        // Update payment summary
        if (summaryPlanName && summaryTotalPrice && summarySearches) {
            summaryPlanName.textContent = tariffName;
            summaryTotalPrice.textContent = tariffPrice;
            summarySearches.textContent = searchCount;
        }
        
        // Show payment section
        showPaymentSection();
        
        // Store selected plan
        localStorage.setItem('selectedPlan', JSON.stringify({
            id: tariffId,
            name: tariffName,
            price: tariffPrice,
            searches: searchCount
        }));
    }
    
    function showPaymentSection() {
        if (tariffSection && paymentSection) {
            tariffSection.style.display = 'none';
            paymentSection.style.display = 'block';
            
            // Reset payment UI
            if (paymentMethodItems) {
                paymentMethodItems.forEach(i => i.classList.remove('active'));
            }
            
            if (processPaymentBtn) {
                processPaymentBtn.setAttribute('disabled', 'disabled');
            }
            
            if (paymentSuccess) {
                paymentSuccess.style.display = 'none';
            }
        }
    }
    
    function showTariffSection() {
        if (tariffSection && paymentSection) {
            tariffSection.style.display = 'block';
            paymentSection.style.display = 'none';
        }
    }
    
    function processPayment() {
        // Simulate payment processing
        if (processPaymentBtn) {
            const processingText = processPaymentBtn.textContent;
            processPaymentBtn.textContent = 'Processing...';
            processPaymentBtn.setAttribute('disabled', 'disabled');
            
            // Simulate API call with timeout
            setTimeout(() => {
                // Show success message
                document.querySelector('.payment-methods').style.display = 'none';
                document.querySelector('.payment-summary').style.display = 'none';
                document.querySelector('.payment-actions').style.display = 'none';
                
                if (paymentSuccess) {
                    paymentSuccess.style.display = 'block';
                }
                
                // Reset button
                processPaymentBtn.textContent = processingText;
                
                // Send data to Telegram
                if (window.Telegram?.WebApp) {
                    const planData = localStorage.getItem('selectedPlan');
                    if (planData) {
                        window.Telegram.WebApp.sendData(planData);
                    }
                }
                
            }, 1500);
        }
    }
}

// Navigation toggle for mobile
function toggleMenu() {
    const navMenu = document.querySelector('.nav-menu');
    navMenu.classList.toggle('show');
} 