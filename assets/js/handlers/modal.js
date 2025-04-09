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

// Initialize modal handler
const modalHandler = new ModalHandler(); 