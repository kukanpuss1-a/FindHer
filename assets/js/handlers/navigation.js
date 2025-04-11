class NavigationHandler {
    constructor() {
        try {
            this.navItems = document.querySelectorAll('.nav-item');
            this.currentPage = 'search';
            this.pages = {
                search: document.getElementById('searchPage'),
                tariffs: document.getElementById('tariffsPage'),
                history: document.getElementById('historyPage'),
                profile: document.getElementById('profilePage')
            };
            this.welcomeScreen = document.getElementById('welcomeScreen');
            this.welcomeButton = document.getElementById('welcomeButton');
            
            this.init();
        } catch (error) {
            console.error('Error initializing NavigationHandler:', error);
        }
    }

    init() {
        try {
            this.setupEventListeners();
            this.showWelcomeScreen();
        } catch (error) {
            console.error('Error in NavigationHandler.init:', error);
        }
    }

    setupEventListeners() {
        try {
            this.navItems.forEach(item => {
                item.addEventListener('click', () => {
                    const page = item.dataset.page;
                    this.navigateToPage(page);
                });
            });

            // Welcome screen continue button
            if (this.welcomeButton) {
                this.welcomeButton.addEventListener('click', () => {
                    this.hideWelcomeScreen();
                });
            }

            // Profile tab navigation
            const profileTabs = document.querySelectorAll('.profile-tab');
            profileTabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    const tabName = tab.dataset.tab;
                    this.switchProfileTab(tabName);
                });
            });
        } catch (error) {
            console.error('Error setting up event listeners:', error);
        }
    }

    navigateToPage(page) {
        try {
            // Remove active class from all items
            this.navItems.forEach(item => {
                item.classList.remove('active');
            });

            // Add active class to selected item
            const selectedItem = document.querySelector(`[data-page="${page}"]`);
            if (selectedItem) {
                selectedItem.classList.add('active');
            }

            // Hide all pages
            Object.values(this.pages).forEach(pageElement => {
                if (pageElement) pageElement.classList.add('hidden');
            });

            // Show selected page
            if (this.pages[page]) {
                this.pages[page].classList.remove('hidden');
            }

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
                case 'profile':
                    this.showProfilePage();
                    break;
            }

            this.currentPage = page;
        } catch (error) {
            console.error('Error navigating to page:', error);
        }
    }

    showWelcomeScreen() {
        try {
            if (this.welcomeScreen) {
                this.welcomeScreen.style.display = 'flex';
                
                // Hide all page content
                Object.values(this.pages).forEach(pageElement => {
                    if (pageElement) pageElement.classList.add('hidden');
                });
                
                console.log('Welcome screen displayed');
            } else {
                console.warn('Welcome screen element not found');
            }
        } catch (error) {
            console.error('Error showing welcome screen:', error);
        }
    }

    hideWelcomeScreen() {
        try {
            if (this.welcomeScreen) {
                this.welcomeScreen.style.opacity = '0';
                this.welcomeScreen.style.pointerEvents = 'none';
                
                console.log('Welcome screen hiding, transition starting');
                
                setTimeout(() => {
                    this.welcomeScreen.style.display = 'none';
                    // Show default page
                    this.navigateToPage('search');
                    console.log('Welcome screen hidden, navigated to search page');
                }, 500);
            }
        } catch (error) {
            console.error('Error hiding welcome screen:', error);
        }
    }

    showSearchPage() {
        try {
            // Reset UI elements if needed
            const previewSection = document.querySelector('.preview-section');
            if (previewSection) {
                previewSection.style.display = 'none';
            }
            
            const uploadBox = document.querySelector('.upload-box');
            if (uploadBox) {
                uploadBox.style.display = 'block';
            }
        } catch (error) {
            console.error('Error showing search page:', error);
        }
    }

    showTariffsPage() {
        // Any specific actions for tariffs page
        // No need to show the modal anymore as tariffs are now a dedicated page
    }

    showHistoryPage() {
        try {
            // Load history data if needed
            this.loadHistoryData();
        } catch (error) {
            console.error('Error showing history page:', error);
        }
    }

    showProfilePage() {
        try {
            // Load user profile data
            this.loadProfileData();
        } catch (error) {
            console.error('Error showing profile page:', error);
        }
    }

    loadHistoryData() {
        try {
            // This would typically fetch data from an API
            // For now, we'll populate with dummy data
            const historySection = document.querySelector('.history-section');
            
            if (historySection) {
                // Clear existing items
                historySection.innerHTML = '';
                
                // Check if there's any history data
                if (window.searchHistory && window.searchHistory.length > 0) {
                    window.searchHistory.forEach(item => {
                        const historyItem = this.createHistoryItem(item);
                        historySection.appendChild(historyItem);
                    });
                } else {
                    // Show empty state
                    historySection.innerHTML = '<div class="empty-state text-center"><p>No search history yet</p></div>';
                }
            }
        } catch (error) {
            console.error('Error loading history data:', error);
        }
    }

    createHistoryItem(item) {
        try {
            const div = document.createElement('div');
            div.className = 'card history-item';
            
            div.innerHTML = `
                <div class="history-item-image">
                    <img src="${item.image || 'https://via.placeholder.com/80'}" alt="Search image">
                </div>
                <div class="history-item-details">
                    <div class="history-item-date">${item.date || new Date().toLocaleDateString()}</div>
                    <div class="history-item-results">${item.results || 'No results found'}</div>
                </div>
            `;
            
            return div;
        } catch (error) {
            console.error('Error creating history item:', error);
            return document.createElement('div');
        }
    }

    loadProfileData() {
        try {
            // Load user profile from Telegram if available
            if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
                const user = window.Telegram.WebApp.initDataUnsafe.user;
                
                const profileName = document.getElementById('profileName');
                const profileUsername = document.getElementById('profileUsername');
                const profileAvatar = document.getElementById('profileAvatar');
                
                if (profileName) {
                    profileName.textContent = user.first_name + (user.last_name ? ' ' + user.last_name : '');
                }
                
                if (profileUsername) {
                    profileUsername.textContent = user.username ? '@' + user.username : '';
                }
                
                // Telegram doesn't provide avatar in WebApp, would need to be fetched separately
            }
        } catch (error) {
            console.error('Error loading profile data:', error);
        }
    }

    switchProfileTab(tabName) {
        try {
            // Update tab UI
            const tabs = document.querySelectorAll('.profile-tab');
            tabs.forEach(tab => {
                tab.classList.remove('active');
            });
            
            const selectedTab = document.querySelector(`.profile-tab[data-tab="${tabName}"]`);
            if (selectedTab) selectedTab.classList.add('active');
            
            // Update content
            const tabContents = document.querySelectorAll('.profile-tab-content');
            tabContents.forEach(content => {
                content.classList.remove('active');
            });
            
            const selectedContent = document.getElementById(`${tabName}Tab`);
            if (selectedContent) selectedContent.classList.add('active');
        } catch (error) {
            console.error('Error switching profile tab:', error);
        }
    }
}

// Initialize navigation handler
// Note: This is now initialized in bundle.js with other handlers 