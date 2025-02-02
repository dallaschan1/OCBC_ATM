document.addEventListener("DOMContentLoaded", function () {
  const userId = localStorage.getItem("UserId");
  const ATMID = localStorage.getItem("ATMID");

  const modal = document.getElementById("statusModal");
  const modalOkButton = document.getElementById("modalOkButton");
  const statusMessage = document.getElementById("statusModalMessage");

  const showModal = (message) => {
    statusMessage.textContent = message;
    modal.style.display = "flex"; // Show the modal
  };

  const hideModal = () => {
    modal.style.display = "none"; // Hide the modal
  };

  let atmData = null; // Declare atmData here so it's accessible in the modalOkButton event
  let maintenance = null; // Declare maintenance here so it's accessible in the modalOkButton event

  if (userId && ATMID) {
    const checkBalance = async () => {
      try {
        const response = await fetch('/get-atm/' + ATMID);
        const data = await response.json();
        
        console.log("Full ATM data:", data); // Logs the entire response object
    
        if (data.success) {
          atmData = data.atm; // Store atmData
          console.log("ATM balance:", atmData.Balance); // Access the balance
          console.log("Maintenance status:", atmData.MaintenanceRequired); // Access the maintenanceRequired
    
          if (atmData.Balance <= 0) {
            showModal("The ATM has insufficient funds. Please visit another ATM or contact support.");
          } else if (atmData.MaintenanceRequired === 1) {
            fetch('/get-maintenance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ atm_id: ATMID }) // Sending atm_id in the body
            })
            .then(response => response.json())
            .then(data => {
                console.log("Maintenance data:", data);
                maintenance = data.maintenance[0]; // Store maintenance data
                showModal(`The ATM is under maintenance. Error notice: ${maintenance.maintenance_type}.`);
            });
          }
        } else {
          console.error("Failed to fetch ATM details.");
        }
      } catch (error) {
        console.error("Error fetching ATM details:", error);
      }
    };    

    checkBalance(); // Call the checkBalance function to check the ATM's status

    modalOkButton.addEventListener("click", () => {
      let errorMessage = '';
      if (atmData && atmData.Balance <= 0) {
        errorMessage = 'outofcash';
      } else if (maintenance && atmData.MaintenanceRequired === 1) {
        // Use maintenance error type from fetched maintenance data
        const maintenanceType = maintenance ? maintenance.maintenance_type : 'unknown';
        errorMessage = maintenanceType;
      }
      window.location.href = `/location?errorMessage=${errorMessage}`;
      hideModal();
    });
  } else {
    console.log("User is not logged in or ATMID is not set.");
  }
});
