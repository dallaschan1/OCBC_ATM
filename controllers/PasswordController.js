const passwords = require('../models/passwordModel.js');

async function login(req, res) {
    const { userName, password } = req.body;
    console.log(userName, password);
    try {
        const user = await passwords.passwordLogin(userName, password);
        console.log(user);
        if (user) {
            res.status(200).json({ message: "Login successful", user });
        } else {
            res.status(401).json({ message: "Invalid credentials" });
        }
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
}

module.exports = { login };