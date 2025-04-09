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

// Initialize navigation handler
const navigationHandler = new NavigationHandler(); 