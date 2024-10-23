const { findUserByNric, updateUserToken } = require("../models/userModel");

async function registerUser(req, res) {
    const { nric, token } = req.body;

    try {
        // Check if the NRIC exists in the database
        const user = await findUserByNric(nric);
        if (!user) {
            return res.status(404).json({ message: "NRIC not found" });
        }

        // Update the user's FCM token
        await updateUserToken(nric, token);
        return res.status(200).json({ message: "User token updated successfully" });
    } catch (error) {
        console.error("Error during registration:", error);
        return res.status(500).json({ message: "Server error during registration" });
    }
}

module.exports = { registerUser };