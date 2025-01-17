document.addEventListener("DOMContentLoaded", async function () {
    const userId = localStorage.getItem("UserId");
  
    if (userId) {
      try {
        const response = await fetch('/update-atm-status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ATMID: 1,      
            Status: 'Active'
          })
        });
  
        const data = await response.json();
        console.log("Response Data:", data);
  
        if (data.success) {
          console.log("ATM status updated to Active.");
          localStorage.setItem("ATMID", data.ATMID);
        } else {
          console.error("Failed to update ATM status.");
        }
      } catch (error) {
        console.error("Error updating ATM status:", error);
      }
    } else {
      console.log("No UserId found in localStorage. User is not logged in.");
    }
});
  