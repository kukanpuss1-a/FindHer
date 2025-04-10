// Dom elements
const fileUpload = document.getElementById('fileUpload');
const uploadBtn = document.getElementById('uploadBtn');
const previewContainer = document.getElementById('previewContainer');
const fileNameDisplay = document.getElementById('fileName');
const filePreview = document.getElementById('filePreview');
const startSearchBtn = document.getElementById('startSearch');
const clearBtn = document.getElementById('clearBtn');

// Modal elements
const platformsModal = document.getElementById('platformsModal');
const searchProgressModal = document.getElementById('searchProgressModal');
const searchResultsModal = document.getElementById('searchResultsModal');
const platformOptions = document.querySelectorAll('.platform-option');
const progressFill = document.querySelector('.progress-fill');
const searchStatus = document.querySelector('.search-status');
const searchProgress = document.querySelector('.search-progress');

// History elements
const historyContainer = document.getElementById('historyContainer');
const historySection = document.getElementById('historySection');
const searchResultsList = document.querySelector('.search-results-list');
const contentArea = document.querySelector('.content-area');
const uploadSection = document.getElementById('uploadSection');
const viewHistoryBtn = document.querySelector('.view-history-btn');

// States
let selectedFile = null;
let selectedPlatform = null;
let searchHistory = [];

// Event listeners
fileUpload.addEventListener('change', handleFileUpload);
uploadBtn.addEventListener('click', triggerFileUpload);
startSearchBtn.addEventListener('click', openPlatformsModal);
clearBtn.addEventListener('click', clearUpload);
platformOptions.forEach(option => {
    option.addEventListener('click', selectPlatform);
});

document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', closeModals);
});

document.getElementById('startPlatformSearch').addEventListener('click', startSearch);
document.getElementById('viewResults').addEventListener('click', closeModals);
viewHistoryBtn.addEventListener('click', viewHistory);
document.getElementById('backToUpload').addEventListener('click', backToUpload);

// Functions
function triggerFileUpload() {
    fileUpload.click();
}

function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    selectedFile = file;
    fileNameDisplay.textContent = file.name;
    
    if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(event) {
            filePreview.src = event.target.result;
            filePreview.style.display = 'block';
            previewContainer.classList.add('has-file');
        }
        reader.readAsDataURL(file);
    }
    
    startSearchBtn.disabled = false;
    clearBtn.style.display = 'block';
}

function clearUpload() {
    selectedFile = null;
    fileUpload.value = '';
    fileNameDisplay.textContent = 'Файл не выбран';
    filePreview.src = '';
    filePreview.style.display = 'none';
    previewContainer.classList.remove('has-file');
    startSearchBtn.disabled = true;
    clearBtn.style.display = 'none';
}

function openPlatformsModal() {
    platformsModal.classList.add('show');
    // Reset selected platform
    platformOptions.forEach(opt => opt.classList.remove('selected'));
    selectedPlatform = null;
    document.getElementById('startPlatformSearch').disabled = true;
}

function selectPlatform(e) {
    const platform = e.currentTarget;
    
    // Skip if disabled
    if (platform.classList.contains('disabled')) return;
    
    // Toggle selection
    platformOptions.forEach(opt => opt.classList.remove('selected'));
    platform.classList.add('selected');
    selectedPlatform = platform.dataset.platform;
    document.getElementById('startPlatformSearch').disabled = false;
}

function startSearch() {
    // Close platforms modal
    platformsModal.classList.remove('show');
    
    // Show search progress modal
    searchProgressModal.classList.add('show');
    
    // Reset progress
    progressFill.style.width = '0%';
    searchStatus.textContent = `Поиск изображения в ${selectedPlatform}...`;
    searchProgress.textContent = '0%';
    
    // Simulate search progress
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 5;
        if (progress > 100) progress = 100;
        
        progressFill.style.width = `${progress}%`;
        searchProgress.textContent = `${Math.floor(progress)}%`;
        
        if (progress === 100) {
            clearInterval(interval);
            setTimeout(showSearchResults, 800);
        }
    }, 300);
}

function showSearchResults() {
    // Close progress modal
    searchProgressModal.classList.remove('show');
    
    // Simulate search results
    const foundImages = Math.floor(Math.random() * 12) + 3; // Random 3-15 images
    const searchResult = {
        id: Date.now(),
        platform: selectedPlatform,
        fileName: selectedFile.name,
        timestamp: new Date().toLocaleString(),
        foundImages: foundImages,
        similarity: Math.floor(Math.random() * 40) + 60 // Random 60-100%
    };
    
    // Add to history
    searchHistory.unshift(searchResult);
    
    // Update results modal
    const searchSummary = document.querySelector('.search-summary');
    searchSummary.innerHTML = `
        <div class="result-platform-icon">
            <i class="fas fa-check-circle"></i>
        </div>
        <div class="search-details">
            <h3>Поиск завершен</h3>
            <p>Найдено ${foundImages} изображений на ${selectedPlatform}</p>
        </div>
    `;
    
    // Update history list
    updateHistoryList();
    
    // Show results modal
    searchResultsModal.classList.add('show');
}

function updateHistoryList() {
    // Clear existing history
    searchResultsList.innerHTML = '';
    
    // Add history items
    searchHistory.forEach(result => {
        const historyItem = document.createElement('div');
        historyItem.className = 'search-result-item';
        historyItem.innerHTML = `
            <div class="result-platform-icon">
                <i class="fab fa-${result.platform === 'OnlyFans' ? 'think-peaks' : 'product-hunt'}"></i>
            </div>
            <div class="result-details">
                <div class="result-platform-name">${result.platform}</div>
                <div class="result-match-info">
                    Найдено: ${result.foundImages} изображений | Сходство: ${result.similarity}%
                </div>
                <div class="result-file-name">${result.fileName}</div>
            </div>
        `;
        searchResultsList.appendChild(historyItem);
    });
    
    // Show history section if we have history items
    if (searchHistory.length > 0) {
        historySection.style.display = 'block';
    }
}

function closeModals() {
    platformsModal.classList.remove('show');
    searchProgressModal.classList.remove('show');
    searchResultsModal.classList.remove('show');
}

function viewHistory() {
    uploadSection.style.display = 'none';
    historySection.style.display = 'block';
    searchResultsModal.classList.remove('show');
}

function backToUpload() {
    uploadSection.style.display = 'block';
    historySection.style.display = 'none';
} 