document.getElementById('triggerButton').addEventListener('click', async () => {
    const token = "fXYfqNZPRsWNvhEg86PV6z:APA91bHbQbXz994b3EOMWhiYTRzA8nDnAd-yYeW8lLjYAmxBANzPSGxe3LlVHVB4o79c-iYPfy5t6hUaT_ooSxZ78_9VRBo9hQcNLtMvOwtueBIXb9jQdXyDy_lFd9kQaCP1bE-BaLLM";
    const responseDiv = document.getElementById('response');

    // Get user location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;

            // Send the FCM token and location to the backend
            const response = await fetch('/send-message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    token: token, 
                    location: { lat: latitude, lng: longitude } // Include location in the request body
                })
            });

            const data = await response.json();

            if (response.ok) {
                responseDiv.innerText = 'Success: ' + data.message; // Display success message
            } else {
                responseDiv.innerText = 'Error: ' + data.error; // Display error message
            }
        }, (error) => {
            console.error('Error getting location: ', error);
            responseDiv.innerText = 'Error getting location: ' + error.message; // Handle location error
        });
    } else {
        responseDiv.innerText = 'Geolocation is not supported by this browser.';
    }
});