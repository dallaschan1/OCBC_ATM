const { getAllATM, updateATMStatus, updateATMSuspicion,getATMSuspicion } = require("../models/atmModel.js");

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
        res.status(200).json({ success: true, message: "ATM status updated successfully" });
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

module.exports = { fetchATMs,handleATMStatusUpdate,handleUserSuspicionUpdate,getUserSuspicion };