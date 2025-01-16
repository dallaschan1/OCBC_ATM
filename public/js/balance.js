document.addEventListener("DOMContentLoaded", function () {
    const userId = localStorage.getItem("UserId");
    const ATMID = localStorage.getItem("ATMID");
  
    const modal = document.getElementById("insufficientFundsModal");
    const modalOkButton = document.getElementById("modalOkButton");
  
    const showModal = () => {
      modal.style.display = "flex";
    };

    const handleModalOkClick = () => {
      modal.style.display = "none";
      window.location.href = "/location";
    };
  
    if (userId && ATMID) {
      const checkBalance = async () => {
        try {
          const response = await fetch('/get-balance', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ ATMID: ATMID })
          });
  
          const data = await response.json();
  
          if (data.success) {
            console.log("ATM balance: ", data.balance);
            if (data.balance <= 0) {
              console.log("Balance is zero. Showing modal...");
              showModal();
            }
          } else {
            console.error("Failed to fetch ATM balance.");
          }
        } catch (error) {
          console.error("Error fetching ATM balance:", error);
        }
      };
  
      const intervalId = setInterval(checkBalance, 3000);
  
      modalOkButton.addEventListener("click", () => {
        clearInterval(intervalId);
        handleModalOkClick();
      });

      window.addEventListener('beforeunload', () => clearInterval(intervalId));
    } else {
      console.log("User is not logged in or ATMID is not set.");
    }
  });
  