window.onload = async function() {
    try {
        const response = await fetch('/update-atm-status', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ATMID: 1,
                Status: 'Inactive'
            })
        });

        if (response.ok) {
            console.log('status updated to Inactive.');
            localStorage.removeItem("UserId")
        } else {
            console.error('Failed to update status.');
        }
    } catch (error) {
        console.error('Error updating status:', error);
    }
};