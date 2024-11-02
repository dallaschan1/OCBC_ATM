async function checkSessionTimeout() {
    setInterval(() => {
        const expirationTime = localStorage.getItem('expirationTime');
        if (expirationTime) {
            const currentTime = new Date();
            const expiryDate = new Date(expirationTime);

            if (currentTime >= expiryDate) {
                removeWebToken();
            }
        }
    }, 1000); // Check every second
}

async function removeWebToken() {
    const nric = localStorage.getItem('nric');

    // Make the request to remove the web token
    const response = await fetch('/remove-web-token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ nric })
    });

    if (response.ok) {
        // Clear local storage
        localStorage.removeItem('UserId');
        localStorage.removeItem('nric');
        localStorage.removeItem('webToken');
        localStorage.removeItem('expirationTime');
        console.log('Session expired. User logged out.');
    } else {
        console.error('Error removing web token:', await response.json());
    }
}

// Call this function when the page loads
document.addEventListener('DOMContentLoaded', checkSessionTimeout);
