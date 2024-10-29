const { findUserByNric, updateUserTokenAndPassword, checkNric,loginUser } = require("../models/userModel");

async function registerUser(req, res) {
    const { nric, token, password } = req.body;

    try {
        // Check if the NRIC exists in the database
        const user = await findUserByNric(nric);
        if (!user) {
            return res.status(404).json({ message: "NRIC not found" });
        }

        // Update the user's FCM token
        await updateUserTokenAndPassword(nric, token, password);
        return res.status(200).json({ message: "User token updated successfully" });
    } catch (error) {
        console.error("Error during registration:", error);
        return res.status(500).json({ message: "Server error during registration" });
    }
}

async function nricCheck(req, res) {
    const { nric } = req.body;

    if (!nric) {
        return res.status(400).json({ error: "NRIC is required" });
    }

    try {
        const user = await findUserByNric(nric);
        if (user) {
            return res.status(200).json({ token: user.token }); // Return the token if found
        } else {
            return res.status(404).json({ error: "NRIC not found or no linked token" });
        }
    } catch (error) {
        console.error('Error checking NRIC:', error);
        return res.status(500).json({ error: "An error occurred while checking NRIC" });
    }
}

async function login(req, res) {
    const { nric, password } = req.body;
    try {
        const user = await loginUser(nric, password);
        if (user) {
            res.status(200).json({ message: "Login successful", user });
        } else {
            res.status(401).json({ message: "Invalid credentials" });
        }
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
}

module.exports = { registerUser , nricCheck, login };