// Comprehensive mock data for conversion rates including SGD
const conversionRates = {
    "usd-gbp": 0.77, "gbp-usd": 1.30,
    "usd-eur": 0.85, "eur-usd": 1.18,
    "usd-jpy": 110.25, "jpy-usd": 0.0091,
    "usd-aud": 1.34, "aud-usd": 0.75,
    "usd-cny": 6.47, "cny-usd": 0.15,
    "usd-inr": 74.35, "inr-usd": 0.013,
    "usd-myr": 4.18, "myr-usd": 0.24,
    "usd-vnd": 23000, "vnd-usd": 0.000043,
    "usd-php": 50.35, "php-usd": 0.02,
    "usd-krw": 1180.50, "krw-usd": 0.00085,
    "usd-thb": 32.85, "thb-usd": 0.03,
    "usd-sgd": 1.35, "sgd-usd": 0.74, // SGD conversions
    "sgd-gbp": 0.55, "gbp-sgd": 1.82,
    "sgd-eur": 0.63, "eur-sgd": 1.59,
    "sgd-jpy": 82.00, "jpy-sgd": 0.012,
    "sgd-aud": 0.98, "aud-sgd": 1.02,
    "sgd-cny": 4.78, "cny-sgd": 0.21,
    "sgd-inr": 55.00, "inr-sgd": 0.018,
    "sgd-myr": 3.05, "myr-sgd": 0.33,
    "sgd-vnd": 17300, "vnd-sgd": 0.000058,
    "sgd-php": 37.50, "php-sgd": 0.027,
    "sgd-krw": 865.00, "krw-sgd": 0.0012,
    "sgd-thb": 24.50, "thb-sgd": 0.041,
    // Add more as necessary for full coverage
};

// Function to get the conversion rate between selected currencies
function getConversionRate(fromCurrency, toCurrency) {
    const key = `${fromCurrency}-${toCurrency}`;
    const reverseKey = `${toCurrency}-${fromCurrency}`;
    
    if (conversionRates[key]) {
        return conversionRates[key];
    } else if (conversionRates[reverseKey]) {
        // If reverse conversion exists, calculate the reciprocal
        return 1 / conversionRates[reverseKey];
    } else {
        // Default fallback if the conversion rate is not defined
        return null;
    }
}

// Function to update the displayed conversion rate
function updateConversionRate() {
    const fromCurrency = document.getElementById('from-currency').value;
    const toCurrency = document.getElementById('to-currency').value;
    const conversionRateElement = document.querySelector('.conversion-rate');

    const rate = getConversionRate(fromCurrency, toCurrency);

    if (rate) {
        conversionRateElement.textContent = `1 ${fromCurrency.toUpperCase()} equals ${rate} ${toCurrency.toUpperCase()}`;
    } else {
        conversionRateElement.textContent = "Conversion rate not available";
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const amountInput = document.getElementById('amount-input');
    const fromCurrencyDropdown = document.getElementById('from-currency');
    const toCurrencyDropdown = document.getElementById('to-currency');

    // Initialize with default values
    updateConversionRate();

    // Event listeners for dropdown changes and amount input
    fromCurrencyDropdown.addEventListener('change', function () {
        updateConversionRate();
    });

    toCurrencyDropdown.addEventListener('change', function () {
        updateConversionRate();
    });

    amountInput.addEventListener('input', function () {
        const amount = amountInput.value || 0;
        document.querySelector('.amount-display').textContent = `Amount: ${amount}`;
    });
});

// Function to show deposit/withdraw pop-ups
function showPopup(type) {
    const overlay = document.getElementById('popup-overlay');
    const depositPopup = document.getElementById('popup-deposit');
    const withdrawPopup = document.getElementById('popup-withdraw');
    const amountInput = document.getElementById('amount-input').value;
    
    overlay.style.display = 'block';

    if (type === 'deposit') {
        document.getElementById('depositAmount').textContent = `${amountInput}`;
        depositPopup.style.display = 'block';
    } else if (type === 'withdraw') {
        document.getElementById('withdrawAmount').textContent = `${amountInput}`;
        withdrawPopup.style.display = 'block';
    }
}

// Function to complete the transaction (deposit or withdraw)
function completeTransaction(type) {
    const overlay = document.getElementById('popup-overlay');
    const depositPopup = document.getElementById('popup-deposit');
    const withdrawPopup = document.getElementById('popup-withdraw');
    const successPopup = document.getElementById('popup-success');
    const amount = document.getElementById('amount-input').value;
    
    overlay.style.display = 'none';
    depositPopup.style.display = 'none';
    withdrawPopup.style.display = 'none';

    if (type === 'deposit') {
        document.getElementById('transactionMessage').textContent = `Deposited ${amount} successfully.`;
    } else if (type === 'withdraw') {
        document.getElementById('transactionMessage').textContent = `Withdrew ${amount} successfully.`;
    }
    
    successPopup.style.display = 'block';
    overlay.style.display = 'block';
}

// Function to close the success pop-up
function closePopup() {
    const overlay = document.getElementById('popup-overlay');
    const successPopup = document.getElementById('popup-success');
    
    overlay.style.display = 'none';
    successPopup.style.display = 'none';
}
