class ModalHandler {
    constructor() {
        try {
            console.log("Initializing ModalHandler");
            this.paymentModal = document.getElementById('paymentModal');
            
            if (!this.paymentModal) {
                console.error("Payment modal element not found");
                return;
            }
            
            this.closeButton = this.paymentModal.querySelector('.close-modal');
            this.paymentMethods = this.paymentModal.querySelectorAll('.payment-method');
            this.confirmButton = this.paymentModal.querySelector('.payment-confirm');
            this.coinAmountElement = document.getElementById('coinAmount');
            this.coinPriceElement = document.getElementById('coinPrice');
            
            this.selectedTariff = null;
            this.selectedPaymentMethod = null;
            
            this.init();
            console.log("ModalHandler initialized successfully");
        } catch (error) {
            console.error("Error initializing ModalHandler:", error);
        }
    }

    init() {
        try {
            this.setupEventListeners();
            // We don't show modal on page load anymore
        } catch (error) {
            console.error("Error in ModalHandler.init:", error);
        }
    }

    setupEventListeners() {
        try {
            // Close modal when clicking the close button
            if (this.closeButton) {
                this.closeButton.addEventListener('click', () => {
                    this.closeModal();
                });
            }

            // Close modal when clicking outside
            if (this.paymentModal) {
                this.paymentModal.addEventListener('click', (event) => {
                    if (event.target === this.paymentModal) {
                        this.closeModal();
                    }
                });
            }

            // Handle payment method selection
            if (this.paymentMethods) {
                this.paymentMethods.forEach(method => {
                    method.addEventListener('click', () => {
                        this.selectPaymentMethod(method);
                    });
                });
            }

            // Handle confirm button
            if (this.confirmButton) {
                this.confirmButton.addEventListener('click', () => {
                    this.processPayment();
                });
            }

            // Handle tariff selection on the tariffs page
            const tariffButtons = document.querySelectorAll('.tariff-option .select-tariff');
            if (tariffButtons) {
                tariffButtons.forEach(button => {
                    button.addEventListener('click', () => {
                        const amount = button.dataset.amount;
                        const price = button.dataset.price;
                        this.showPaymentModal(amount, price);
                    });
                });
            }
            
            console.log("ModalHandler event listeners set up");
        } catch (error) {
            console.error("Error setting up event listeners:", error);
        }
    }

    showPaymentModal(coinAmount, price) {
        try {
            console.log(`Showing payment modal for ${coinAmount} coins at ${price} USDT`);
            
            // Set the tariff details
            this.selectedTariff = {
                amount: coinAmount,
                price: price
            };
            
            // Update the UI
            if (this.coinAmountElement) {
                this.coinAmountElement.textContent = coinAmount;
            }
            
            if (this.coinPriceElement) {
                this.coinPriceElement.textContent = price;
            }
            
            // Reset payment method selection
            this.resetPaymentMethodSelection();
            
            // Show the modal
            if (this.paymentModal) {
                this.paymentModal.classList.add('show');
            }
            
            // Notify Telegram
            if (window.telegramHandler) {
                window.telegramHandler.showModal();
            }
        } catch (error) {
            console.error("Error showing payment modal:", error);
        }
    }

    closeModal() {
        try {
            console.log("Closing payment modal");
            
            if (this.paymentModal) {
                this.paymentModal.classList.remove('show');
            }
            
            // Notify Telegram
            if (window.telegramHandler) {
                window.telegramHandler.closeModal();
            }
        } catch (error) {
            console.error("Error closing modal:", error);
        }
    }

    selectPaymentMethod(methodElement) {
        try {
            // Remove active class from all methods
            if (this.paymentMethods) {
                this.paymentMethods.forEach(method => {
                    method.classList.remove('active');
                });
            }
            
            // Add active class to selected method
            methodElement.classList.add('active');
            
            // Store the selected method
            this.selectedPaymentMethod = methodElement.dataset.method;
            console.log(`Payment method selected: ${this.selectedPaymentMethod}`);
            
            // Enable the confirm button
            if (this.confirmButton) {
                this.confirmButton.disabled = false;
            }
        } catch (error) {
            console.error("Error selecting payment method:", error);
        }
    }

    resetPaymentMethodSelection() {
        try {
            if (this.paymentMethods) {
                this.paymentMethods.forEach(method => {
                    method.classList.remove('active');
                });
            }
            
            this.selectedPaymentMethod = null;
            
            if (this.confirmButton) {
                this.confirmButton.disabled = true;
            }
        } catch (error) {
            console.error("Error resetting payment method selection:", error);
        }
    }

    async processPayment() {
        try {
            if (!this.selectedTariff || !this.selectedPaymentMethod) {
                // Show error - should not happen as button should be disabled
                if (window.telegramHandler) {
                    window.telegramHandler.showAlert('Please select a payment method.');
                }
                return;
            }
            
            console.log(`Processing payment: ${this.selectedTariff.amount} coins for ${this.selectedTariff.price} USDT via ${this.selectedPaymentMethod}`);
            
            // Create payment data
            const paymentData = {
                type: 'coin_purchase',
                amount: this.selectedTariff.amount,
                price: this.selectedTariff.price,
                payment_method: this.selectedPaymentMethod,
                timestamp: new Date().toISOString()
            };
            
            // In a real app, we would send this to the backend
            // For now, just show a confirmation
            let confirmMessage = `Purchase ${this.selectedTariff.amount} FH coins for ${this.selectedTariff.price} USDT using ${this.selectedPaymentMethod}?`;
            
            const confirmed = await window.telegramHandler.showConfirm(confirmMessage);
            
            if (confirmed) {
                // Send data to Telegram
                const success = window.telegramHandler.sendData(paymentData);
                
                if (success) {
                    // Add to transaction history (in a real app this would come from the server)
                    this.addToTransactionHistory(paymentData);
                    
                    // Show success message
                    window.telegramHandler.showAlert('Payment processed successfully!');
                    
                    // Update FH balance (mock for demo purposes)
                    this.updateFHBalance(parseInt(this.selectedTariff.amount));
                    
                    // Close the modal
                    this.closeModal();
                } else {
                    window.telegramHandler.showAlert('Failed to process payment. Please try again.');
                }
            }
        } catch (error) {
            console.error("Error processing payment:", error);
            if (window.telegramHandler) {
                window.telegramHandler.showAlert('An error occurred while processing payment.');
            }
        }
    }

    addToTransactionHistory(paymentData) {
        try {
            console.log("Adding transaction to history");
            
            // This is a mock function that would typically communicate with a backend
            // For demo purposes, we'll just add to a local array
            if (!window.transactionHistory) {
                window.transactionHistory = [];
            }
            
            window.transactionHistory.push({
                id: 'tx_' + Date.now(),
                type: 'purchase',
                amount: paymentData.amount,
                price: paymentData.price,
                method: paymentData.payment_method,
                date: new Date().toLocaleDateString(),
                status: 'completed'
            });
            
            // Update the UI if on the profile page
            const transactionsList = document.querySelector('.transaction-list');
            if (transactionsList) {
                this.updateTransactionHistoryUI();
            }
        } catch (error) {
            console.error("Error adding transaction to history:", error);
        }
    }

    updateTransactionHistoryUI() {
        try {
            const transactionsList = document.querySelector('.transaction-list');
            if (!transactionsList) return;
            
            console.log("Updating transaction history UI");
            
            // Clear current items
            transactionsList.innerHTML = '';
            
            if (window.transactionHistory && window.transactionHistory.length > 0) {
                // Add each transaction
                window.transactionHistory.forEach(tx => {
                    const item = document.createElement('div');
                    item.className = 'transaction-item';
                    
                    item.innerHTML = `
                        <div class="transaction-icon">
                            <i class="fa-solid fa-coins"></i>
                        </div>
                        <div class="transaction-details">
                            <div class="transaction-title">Purchase ${tx.amount} FH coins</div>
                            <div class="transaction-date">${tx.date}</div>
                        </div>
                        <div class="transaction-amount">
                            ${tx.price} USDT
                        </div>
                    `;
                    
                    transactionsList.appendChild(item);
                });
            } else {
                // Show empty state
                transactionsList.innerHTML = '<div class="empty-state text-center"><p>No transactions yet</p></div>';
            }
        } catch (error) {
            console.error("Error updating transaction history UI:", error);
        }
    }

    updateFHBalance(amount) {
        try {
            console.log(`Updating FH balance by ${amount}`);
            
            // In a real app, this would come from the server
            // For demo purposes, we'll just update the UI
            if (!window.fhBalance) {
                window.fhBalance = 0;
            }
            
            window.fhBalance += amount;
            console.log(`New FH balance: ${window.fhBalance}`);
            
            // Update all FH balance displays
            const balanceElements = document.querySelectorAll('.currency-amount');
            balanceElements.forEach(el => {
                el.textContent = window.fhBalance;
            });
        } catch (error) {
            console.error("Error updating FH balance:", error);
        }
    }
}

// Initialize modal handler
// Note: This is now initialized in bundle.js 