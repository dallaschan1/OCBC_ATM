const { getAllATM, updateATMStatus, updateATMSuspicion,getATMSuspicion, getATMBalance,withdrawFromATM,updateATMMaintenance, getspecificATM
    ,insertToMaintenance,getMaintenance,deleteMaintenance,addingToLog,gettingAllLog,getComponentsHealth } = require("../models/atmModel.js");

async function fetchATMs(req, res) {
    try {
        const atms = await getAllATM();
        if (atms.length > 0) {
            res.status(200).json({ success: true, atms: atms });
        } else {
            res.status(404).json({ success: false, message: "No ATMs found" });
        }
    } catch (error) {
        console.error("Error fetching ATMs:", error);
        res.status(500).json({ success: false, message: "Server error", error: error });
    }
}

async function handleATMStatusUpdate(req, res) {
    const { ATMID, Status } = req.body;

    try {
        await updateATMStatus(ATMID, Status);
        res.status(200).json({ success: true, message: "ATM status updated successfully", ATMID: ATMID});
    } catch (error) {
        res.status(500).json({ success: false, message: "Error updating ATM status" });
    }
}

async function handleUserSuspicionUpdate(req, res) {
    const { ATMID, UserSuspicion } = req.body;

    try {
        await updateATMSuspicion(ATMID, UserSuspicion);
        res.status(200).json({ success: true, message: "ATM status updated successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error updating ATM status" });
    }
}

async function getUserSuspicion(req, res) {
    const { ATMID } = req.body;

    try {
        const userSuspicion = await getATMSuspicion(ATMID);
        res.status(200).json({ success: true, UserSuspicion: userSuspicion });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching ATM UserSuspicion" });
    }
}

async function getBalance(req, res) {
    const { ATMID } = req.body;

    if (!ATMID) {
        return res.status(400).json({ success: false, message: 'ATMID is required' });
    }

    try {
        const balance = await getATMBalance(ATMID);
        res.status(200).json({ success: true, balance: balance });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching ATM balance" });
    }
}

async function withdrawATMbalance(req,res){
    const { ATMID, withdrawalAmount } = req.body;

    if (!ATMID || !withdrawalAmount) {
        return res.status(400).json({ success: false, message: 'ATMID and withdrawalAmount are required' });
    }

    if (withdrawalAmount <= 0) {
        return res.status(400).json({ success: false, message: 'Withdrawal amount must be greater than zero' });
    }
    try {
        const result = await withdrawFromATM(ATMID, withdrawalAmount);
        
        if (result.success) {
            res.json({ success: true, newBalance: result.newBalance });
        } else {
            res.status(400).json({ success: false, message: result.message });
        }
    } catch (error) {
        console.error("Error during withdrawal:", error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

async function handleMaintenanceUpdate(req, res) {
    const { ATMID, MaintenanceRequired } = req.body;

    try {
        await updateATMMaintenance(ATMID, MaintenanceRequired);
        res.status(200).json({ success: true, message: "ATM MaintenanceRequired updated successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error updating ATM status" });
    }
}

async function getATMById(req, res) {
    const { ATMID } = req.params; // Use req.params instead of req.query

    if (!ATMID) {
        return res.status(400).json({ success: false, message: 'ATMID is required' });
    }

    try {
        const atm = await getspecificATM(ATMID);
        if (!atm) {
            return res.status(404).json({ success: false, message: "ATM not found" });
        }
        res.status(200).json({ success: true, atm: atm });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching ATM" });
    }
}

async function insertintoMaintenance(req,res){
    const { atm_id, maintenance_type, start_date } = req.body;

    try {
        await insertToMaintenance(atm_id, maintenance_type, start_date);
        res.status(200).json({ success: true, message: "ATM MaintenanceRequired updated successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error updating ATM status" });
    }
}

async function getATMMaintenance(req,res){
    const { atm_id } = req.body;
    try {
        const maintenance = await getMaintenance(atm_id);
        if (maintenance.length > 0) {
            res.status(200).json({ success: true, maintenance: maintenance });
        } else {
            res.status(404).json({ success: false, message: "No maintenance found" });
        }
    } catch (error) {
        console.error("Error fetching maintenance:", error);
        res.status(500).json({ success: false, message: "Server error", error: error });
    }
}

async function deleteATMMaintenance(req,res){
    const { atm_id } = req.body;
    try {
        await deleteMaintenance(atm_id);
        res.status(200).json({ success: true, message: "ATM MaintenanceRequired updated successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error updating ATM status" });
    }
}

async function addingLog(req,res){
    const { atm_id, maintenance_type, start_date, end_date } = req.body;

    try {
        await addingToLog(atm_id, maintenance_type, start_date, end_date);
        res.status(200).json({ success: true, message: "ATM MaintenanceRequired updated successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error updating ATM status" });
    }
}

async function getAllLog(req, res) {
    try {
        const { atm_id } = req.params; // Get atmId from query parameters
        if (!atm_id) {
            return res.status(400).json({ success: false, message: "atmId is required" });
        }

        const logs = await gettingAllLog(atm_id);
        if (logs.length > 0) {
            res.status(200).json({ success: true, logs });
        } else {
            res.status(404).json({ success: false, message: "No logs found for this ATM" });
        }
    } catch (error) {
        console.error("Error fetching logs:", error);
        res.status(500).json({ success: false, message: "Server error", error });
    }
}

async function getAllComponentsHealth(req,res){
    try {
        const { atm_id } = req.params;
        if (!atm_id) {
            return res.status(400).json({ success: false, message: "atmId is required" });
        }

        const components = await getComponentsHealth(atm_id);
        if (components.length > 0) {
            res.status(200).json({ success: true, components });
        } else {
            res.status(404).json({ success: false, message: "No components found for this ATM" });
        }
    } catch (error) {
        console.error("Error fetching components:", error);
        res.status(500).json({ success: false, message: "Server error", error });
    }
}

module.exports = { fetchATMs,handleATMStatusUpdate,handleUserSuspicionUpdate,getUserSuspicion, getBalance,withdrawATMbalance,handleMaintenanceUpdate,getATMById
    ,insertintoMaintenance,getATMMaintenance,deleteATMMaintenance,addingLog,getAllLog,getAllComponentsHealth };