const { loginAdmin } = require("../models/adminModel.js");

async function adminlogin(req, res) {
    const { UserName, PasswordHash } = req.body;
    try {
        const user = await loginAdmin(UserName, PasswordHash);
        if (user) {
            res.status(200).json({ success: true, message: "Login successful", user });
        } else {
            res.status(401).json({ success: false, message: "Invalid credentials" });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error", error });
    }
}

module.exports = { adminlogin };