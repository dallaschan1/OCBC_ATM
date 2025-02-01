document.getElementById('convertBtn').addEventListener('click', async () => {
    const fromCurrency = document.getElementById('fromCurrency').value.trim().toUpperCase();
    const toCurrency = document.getElementById('toCurrency').value.trim().toUpperCase();
    const amount = document.getElementById('amount').value.trim();
    const proceedBtn = document.getElementById('proceedBtn');

    if (!fromCurrency || !toCurrency || isNaN(amount) || amount <= 0) {
        document.getElementById('result').innerText = "❌ Please enter valid inputs!";
        proceedBtn.classList.add('hidden'); // Hide proceed button
        return;
    }

    try {
        const response = await fetch(`/convert?from=${fromCurrency}&to=${toCurrency}&amount=${amount}`);
        const data = await response.json();

        if (data.error) {
            document.getElementById('result').innerText = `❌ ${data.error}`;
            proceedBtn.classList.add('hidden');
        } else {
            document.getElementById('result').innerText = 
                `💰 ${amount} ${fromCurrency} = ${data.convertedAmount.toFixed(2)} ${toCurrency} (Rate: ${data.rate})`;
            
            // Show Proceed button
            proceedBtn.classList.remove('hidden');
            
            // Store transaction details in a data attribute
            proceedBtn.setAttribute('data-transaction', JSON.stringify({ fromCurrency, toCurrency, amount, convertedAmount: data.convertedAmount }));
        }
    } catch (error) {
        document.getElementById('result').innerText = "❌ Error fetching data!";
        proceedBtn.classList.add('hidden');
    }
});

// Handle Proceed button click
document.getElementById('proceedBtn').addEventListener('click', () => {
    const transaction = JSON.parse(document.getElementById('proceedBtn').getAttribute('data-transaction'));
    if (transaction) {
        const confirmExchange = confirm(`Proceed with exchanging ${transaction.amount} ${transaction.fromCurrency} to ${transaction.convertedAmount.toFixed(2)} ${transaction.toCurrency}?`);
        if (confirmExchange) {
            alert('✅ Exchange successful!');
        } else {
            alert('❌ Exchange canceled.');
        }
    }
});
