async function getUserInfo() {
    const accountInput = document.getElementById('account').value.trim();
    if (accountInput.length > 3) {
        try {
            const response = await fetch('/get-user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name: accountInput, phoneNumber: accountInput })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.user) {
                    document.getElementById('user-name').textContent = data.user.name || '--';
                    document.getElementById('user-phone').textContent = data.user.phoneNumber || '--';

                    // Now fetch the suspicion score
                    const userId = data.user.UserID;
                    await checkSuspicion(userId);
                } else {
                    resetUserInfo();
                }
            } else {
                resetUserInfo();
            }
        } catch (error) {
            console.error('Error fetching user info:', error);
            resetUserInfo();
        }
    } else {
        resetUserInfo();
    }
}

async function checkSuspicion(userId) {
    try {
        const response = await fetch('/check-suspicion', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id: userId })
        });

        if (response.ok) {
            const data = await response.json();
            const score = data.score !== null && data.score !== undefined ? data.score : '--';
            document.getElementById('user-score').textContent = score;
            console.log('Suspicion score:', score);
            return score;
        } else {
            console.error('Error fetching suspicion score');
            document.getElementById('user-score').textContent = '--';
        }
    } catch (error) {
        console.error('Error checking suspicion score:', error);
        document.getElementById('user-score').textContent = '--';
    }
    return null;
}

function resetUserInfo() {
    document.getElementById('user-name').textContent = '--';
    document.getElementById('user-phone').textContent = '--';
    document.getElementById('user-score').textContent = '--';
}

// Transfer button click handler
document.querySelector('.btn').addEventListener('click', async function() {
    const accountInput = document.getElementById('account').value.trim();
    const amountInput = document.getElementById('amount').value.trim();

    if (accountInput && amountInput) {
        const userId = await getUserId(accountInput);
        if (userId) {
            const suspicionScore = await checkSuspicion(userId);
            const threshold = 50; // Set your threshold for suspicious score here

            if (suspicionScore && suspicionScore > threshold) {
            
                document.getElementById('suspicion-modal').style.display = 'block';
                
               
                document.getElementById('confirm-btn').onclick = function() {
                  
                    closeModal();
                    showToast('Transfer Successful!');
                };
            } else {
                showToast('Transfer Successful!');
            }
        }
    } else {
        alert("Please fill in all fields.");
    }
});

async function getUserId(accountInput) {
    try {
        const response = await fetch('/get-user', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: accountInput, phoneNumber: accountInput })
        });

        if (response.ok) {
            const data = await response.json();
            return data.user.UserID;
        }
    } catch (error) {
        console.error('Error fetching user ID:', error);
    }
    return null;
}

function closeModal() {
    document.getElementById('suspicion-modal').style.display = 'none';
}

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.style.display = 'block';
    toast.style.opacity = '1';

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            toast.style.display = 'none';
        }, 500);
    }, 3000);
}