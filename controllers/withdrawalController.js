const withdrawModel = require('../models/withdrawModel');

async function withdraw(req, res) {
    const { userId, amount } = req.body;

    try {
        const success = await withdrawModel.withdraw(userId, amount);
        if (success) {
            res.status(200).json({ message: "Withdrawal successful" });
        } else {
            res.status(400).json({ message: "Insufficient balance" });
        }
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
}


async function dailyWithdraw(req, res) {
    const { userId} = req.query;

    try {
        const success = await withdrawModel.dailyWithdrawal(userId);
        console.log(success);
        if (success) {
            res.status(200).json({ success });
        } else {
            res.status(400).json({ message: "Insufficient balance" });
        }
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
}

module.exports = { withdraw, dailyWithdraw };