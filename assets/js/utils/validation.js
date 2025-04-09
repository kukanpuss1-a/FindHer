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
        const validTariffs = ['Basic', 'Standard', 'Premium', 'Ultimate'];
        const validPrices = ['24 USDT', '34 USDT', '50 USDT', '69 USDT'];

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