function goToConversionPage() {
    // Store selected currencies in localStorage (or sessionStorage) for use on the conversion page
    const fromCurrency = document.getElementById('from-currency').value;
    const toCurrency = document.getElementById('to-currency').value;
    
    localStorage.setItem('fromCurrency', fromCurrency);
    localStorage.setItem('toCurrency', toCurrency);
    
    // Redirect to the conversion page
    location.href = 'conversion.html';
}

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

function closePopup() {
    const overlay = document.getElementById('popup-overlay');
    const successPopup = document.getElementById('popup-success');
    
    overlay.style.display = 'none';
    successPopup.style.display = 'none';
}

// On load, set the selected currencies on the conversion page
document.addEventListener('DOMContentLoaded', function () {
    const fromCurrency = localStorage.getItem('fromCurrency');
    const toCurrency = localStorage.getItem('toCurrency');

    if (fromCurrency && toCurrency) {
        document.getElementById('fromCurrencyDisplay').textContent = fromCurrency;
        document.getElementById('toCurrencyDisplay').textContent = toCurrency;
    }
});
