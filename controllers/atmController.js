const { getAllATM, updateATMStatus, updateATMSuspicion,getATMSuspicion, getATMBalance,withdrawFromATM } = require("../models/atmModel.js");

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

module.exports = { fetchATMs,handleATMStatusUpdate,handleUserSuspicionUpdate,getUserSuspicion, getBalance,withdrawATMbalance };