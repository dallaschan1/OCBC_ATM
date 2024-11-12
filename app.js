const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const QRCode = require('qrcode');
const cors = require('cors');
const { sendFcmMessage } = require('./controllers/fcmController')
const { registerUser, nricCheck, notifySuccess, login, handleDeductBalance, storeWebToken, getWebToken, removeWebToken, getId,findUserByNameOrPhone } = require('./controllers/userController');
const chatbot = require("./controllers/chatBotController.js");
const { adminlogin } = require("./controllers/adminController.js");
const { fetchATMs,handleATMStatusUpdate, handleUserSuspicionUpdate,getUserSuspicion } = require("./controllers/atmController.js");
const axios = require('axios');
const {loginUserByFace, updateUserFace} = require("./models/facialModel.js");
const { PythonShell } = require('python-shell');
const env = require('dotenv').config();
const API_KEY = process.env.GEMINI_API_KEY;
const app = express();
const PORT = 3001;
const sql = require('mssql');
const csv = require('csv-parser');
const fs = require('fs');
const dbConfig = require("./dbconfig.js");
const Password = require('./controllers/PasswordController');
const Withdraw = require('./controllers/withdrawalController');

// Middleware setup
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));


app.get('/Home', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/html/HomePage.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/html/login-page.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/index.html'));
});

app.get('/fingerprint', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/html/fingerprint.html'));
});

app.get('/crypto', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/crypto.html'));
});

app.post('/send-message', sendFcmMessage);

app.post('/register', registerUser);

app.post('/check-nric', nricCheck);

app.get('/getting-id', getId);

let authStatus = false;

app.post('/notify-success', (req, res) => {
    const { authStatus: status } = req.body;
    if (status === "success") {
        authStatus = true;
        return res.status(200).json({ success: true });
    }
    return res.status(400).json({ error: "Authentication failed" });
});

app.get('/check-auth-status', (req, res) => {
    res.status(200).json({ authenticated: authStatus });
});

app.post("/login", login);

let qrCodeData = null;

// Endpoint to receive data and store it
app.post('/generate-qr', (req, res) => {
    const { amount, userId } = req.body;

    if (!amount || !userId) {
        return res.status(400).json({ error: 'Amount and userId are required' });
    }

    // Store the data in a temporary variable
    qrCodeData = {
        action: 'Withdraw',
        amount: String(amount),
        userId: String(userId)
    };

    // Send back a response indicating that the data has been received
    res.json({ message: 'Data received successfully' });
});

// Endpoint to display the QR code and generate it on page load
app.get('/display-qr', async (req, res) => {
    if (!qrCodeData) {
        return res.status(404).send('No data available to generate QR code');
    }

    try {
        // Convert the QR code data to a JSON string
        const qrCodeDataString = JSON.stringify(qrCodeData);
        console.log("Generating QR Code for data:", qrCodeDataString);

        // Generate the QR code as a Base64 string
        const qrCodeBase64 = await QRCode.toDataURL(qrCodeDataString);

        // Render the HTML page with the generated QR code
        const html = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>QR Code</title>
                <style>
                    body {
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        margin: 0;
                        text-align: center;
                        background: #e4e0e0;
                    }
                    img {
                        width: 250px;
                        height: 250px;
                    }
                    h1 {
                        margin-bottom: 20px;
                    }
                    p {
                        margin-top: 20px;
                    }
                </style>
            </head>
            <body>
                <h1>Your QR Code</h1>
                <img src="${qrCodeBase64}" alt="QR Code" />
                <p><a href="/">Back to Home</a></p>
            </body>
            </html>
        `;

        res.send(html);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error generating QR code');
    }
});

app.post('/deduct-balance', handleDeductBalance);

app.post('/get-user', findUserByNameOrPhone);

app.post('/check-suspicion', async (req, res) => {
    const userId = req.body.id;
    try {
        const response = await axios.post('http://localhost:5000/check-suspicion', { id: userId });
        const { suspicious_count, overall_suspicious, score } = response.data;

        const suspicious = overall_suspicious === true;

        if (overall_suspicious) {
            return res.status(200).json({ message: "User transactions are suspicious", suspicious_count, score, suspicious: true  });
        } else {
            return res.status(200).json({ message: "User transactions are not suspicious", suspicious_count, score, suspicious: false });
        }
    } catch (error) {
        console.error("Error calling Flask API:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

app.get('/transfer', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/transfer-fund.html'))
})

app.post('/admin-login', adminlogin);

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/admin.html'))
})

app.get('/adminHome', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/adminHome.html'))
})

app.get('/atms', fetchATMs);

app.post('/update-atm-status', handleATMStatusUpdate);
app.post('/update-user-suspicion', handleUserSuspicionUpdate);
app.post('/get-user-suspicion', getUserSuspicion);

app.get('/feedback', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/feedback.html'))
});

//Facial Login
app.get('/faceLogin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/facialRecog.html'))
})

// Chatbot API
app.post("/homePageChat", chatbot.startChatForHomePage);
app.post("/fingerPrintChat", chatbot.startChatForFingerPrint);
app.post("/loginPageChat", chatbot.startChatForLoginPage);
app.post("/moreServicesChat", chatbot.startChatForMoreServices);
app.post("/transferFund", chatbot.startChatForTransferFund);

app.post('/PasswordLogin', Password.login);
app.post('/withdraw', Withdraw.withdraw);
app.get('/withdraw', Withdraw.dailyWithdraw);
app.get('/More-Options', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/more-options.html'));
});

// Crypto API
app.post('/buyToken', async (req, res) => {
    const { userId, tokenSymbol, amount, price } = req.body;

    try {
        const pool = await sql.connect(dbConfig);

        // Get user's balance
        const userResult = await pool.request()
            .input('userID', sql.Int, userId)
            .query('SELECT balance FROM Users WHERE UserID = @userID');

        if (userResult.recordset.length === 0) {
            return res.status(400).json({ message: 'User not found' });
        }

        const userBalance = userResult.recordset[0].balance;
        const totalCost = amount * price;

        // Check if user has enough balance
        if (userBalance < totalCost) {
            return res.status(400).json({ message: 'Insufficient cash balance' });
        }

        // Update user's balance
        await pool.request()
            .input('userID', sql.Int, userId)
            .input('newBalance', sql.Decimal(18, 2), userBalance - totalCost)
            .query('UPDATE Users SET balance = @newBalance WHERE UserID = @userID');

        // Update user's token balance
        const userTokenResult = await pool.request()
            .input('userID', sql.Int, userId)
            .input('tokenSymbol', sql.NVarChar(10), tokenSymbol)
            .query('SELECT Balance FROM UserTokenBalance WHERE UserID = @userID AND TokenSymbol = @tokenSymbol');

        let newTokenBalance = amount;

        if (userTokenResult.recordset.length > 0) {
            newTokenBalance += parseFloat(userTokenResult.recordset[0].Balance);
            await pool.request()
                .input('userID', sql.Int, userId)
                .input('tokenSymbol', sql.NVarChar(10), tokenSymbol)
                .input('newTokenBalance', sql.Decimal(18, 8), newTokenBalance)
                .query('UPDATE UserTokenBalance SET Balance = @newTokenBalance WHERE UserID = @userID AND TokenSymbol = @tokenSymbol');
        } else {
            await pool.request()
                .input('userID', sql.Int, userId)
                .input('tokenSymbol', sql.NVarChar(10), tokenSymbol)
                .input('newTokenBalance', sql.Decimal(18, 8), newTokenBalance)
                .query('INSERT INTO UserTokenBalance (UserID, TokenSymbol, Balance) VALUES (@userID, @tokenSymbol, @newTokenBalance)');
        }

        // Update OCBCWallet token balance
        const walletResult = await pool.request()
            .input('tokenSymbol', sql.NVarChar(10), tokenSymbol)
            .query('SELECT Balance FROM OCBCWallet WHERE TokenSymbol = @tokenSymbol');

        if (walletResult.recordset.length === 0) {
            return res.status(400).json({ message: 'Token not found in OCBC wallet' });
        }

        const newWalletBalance = parseFloat(walletResult.recordset[0].Balance) - amount;

        await pool.request()
            .input('tokenSymbol', sql.NVarChar(10), tokenSymbol)
            .input('newWalletBalance', sql.Decimal(18, 8), newWalletBalance)
            .query('UPDATE OCBCWallet SET Balance = @newWalletBalance WHERE TokenSymbol = @tokenSymbol');

        res.status(200).json({ message: 'Token purchase successful' });

    } catch (error) {
        console.error('Error processing token purchase:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/sellToken', async (req, res) => {
    const { userId, tokenSymbol, amount, price } = req.body;

    try {
        const pool = await sql.connect(dbConfig);

        // Get user's token balance
        const userTokenResult = await pool.request()
            .input('userID', sql.Int, userId)
            .input('tokenSymbol', sql.NVarChar(10), tokenSymbol)
            .query('SELECT Balance FROM UserTokenBalance WHERE UserID = @userID AND TokenSymbol = @tokenSymbol');

        if (userTokenResult.recordset.length === 0 || parseFloat(userTokenResult.recordset[0].Balance) < amount) {
            return res.status(400).json({ message: 'Insufficient token balance' });
        }

        const userTokenBalance = parseFloat(userTokenResult.recordset[0].Balance);
        const usdAmount = amount * price;

        // Update user's token balance
        const newTokenBalance = userTokenBalance - amount;
        if (newTokenBalance > 0) {
            await pool.request()
                .input('userID', sql.Int, userId)
                .input('tokenSymbol', sql.NVarChar(10), tokenSymbol)
                .input('newTokenBalance', sql.Decimal(18, 8), newTokenBalance)
                .query('UPDATE UserTokenBalance SET Balance = @newTokenBalance WHERE UserID = @userID AND TokenSymbol = @tokenSymbol');
        } else {
            await pool.request()
                .input('userID', sql.Int, userId)
                .input('tokenSymbol', sql.NVarChar(10), tokenSymbol)
                .query('DELETE FROM UserTokenBalance WHERE UserID = @userID AND TokenSymbol = @tokenSymbol');
        }

        // Update user's balance
        const userResult = await pool.request()
            .input('userID', sql.Int, userId)
            .query('SELECT balance FROM Users WHERE UserID = @userID');

        if (userResult.recordset.length === 0) {
            return res.status(400).json({ message: 'User not found' });
        }

        const userBalance = userResult.recordset[0].balance;
        const newBalance = userBalance + usdAmount;

        await pool.request()
            .input('userID', sql.Int, userId)
            .input('newBalance', sql.Decimal(18, 2), newBalance)
            .query('UPDATE Users SET balance = @newBalance WHERE UserID = @userID');

        // Update OCBCWallet token balance
        const walletResult = await pool.request()
            .input('tokenSymbol', sql.NVarChar(10), tokenSymbol)
            .query('SELECT Balance FROM OCBCWallet WHERE TokenSymbol = @tokenSymbol');

        if (walletResult.recordset.length === 0) {
            return res.status(400).json({ message: 'Token not found in OCBC wallet' });
        }

        const newWalletBalance = parseFloat(walletResult.recordset[0].Balance) + amount;

        await pool.request()
            .input('tokenSymbol', sql.NVarChar(10), tokenSymbol)
            .input('newWalletBalance', sql.Decimal(18, 8), newWalletBalance)
            .query('UPDATE OCBCWallet SET Balance = @newWalletBalance WHERE TokenSymbol = @tokenSymbol');

        res.status(200).json({ message: 'Token sale successful' });

    } catch (error) {
        console.error('Error processing token sale:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/transfer', async (req, res) => {
    const { userId, tokenSymbol, fee, amount } = req.body;

    try {
        const pool = await sql.connect(dbConfig);

        // Get user's token balance
        const userTokenResult = await pool.request()
            .input('userID', sql.Int, userId)
            .input('tokenSymbol', sql.NVarChar(10), tokenSymbol)
            .query('SELECT Balance FROM UserTokenBalance WHERE UserID = @userID AND TokenSymbol = @tokenSymbol');

        if (userTokenResult.recordset.length === 0 || parseFloat(userTokenResult.recordset[0].Balance) < amount) {
            return res.status(400).json({ message: 'Insufficient token balance' });
        }

        const userTokenBalance = parseFloat(userTokenResult.recordset[0].Balance);
        const newTokenBalance = userTokenBalance - amount;

        // Deduct tokens from user's account
        if (newTokenBalance > 0) {
            await pool.request()
                .input('userID', sql.Int, userId)
                .input('tokenSymbol', sql.NVarChar(10), tokenSymbol)
                .input('newTokenBalance', sql.Decimal(18, 8), newTokenBalance)
                .query('UPDATE UserTokenBalance SET Balance = @newTokenBalance WHERE UserID = @userID AND TokenSymbol = @tokenSymbol');
        } else {
            await pool.request()
                .input('userID', sql.Int, userId)
                .input('tokenSymbol', sql.NVarChar(10), tokenSymbol)
                .query('DELETE FROM UserTokenBalance WHERE UserID = @userID AND TokenSymbol = @tokenSymbol');
        }

        // Deduct fee from user's balance
        const userResult = await pool.request()
            .input('userID', sql.Int, userId)
            .query('SELECT balance FROM Users WHERE UserID = @userID');

        if (userResult.recordset.length === 0) {
            return res.status(400).json({ message: 'User not found' });
        }

        const userBalance = userResult.recordset[0].balance;
        if (userBalance < fee) {
            return res.status(400).json({ message: 'Insufficient cash balance for the fee' });
        }

        const newBalance = userBalance - fee;

        await pool.request()
            .input('userID', sql.Int, userId)
            .input('newBalance', sql.Decimal(18, 2), newBalance)
            .query('UPDATE Users SET balance = @newBalance WHERE UserID = @userID');

        res.status(200).json({ message: 'Token transfer successful, fee deducted' });

    } catch (error) {
        console.error('Error processing token transfer:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.get('/getTokens/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const pool = await sql.connect(dbConfig);

        // Retrieve all tokens and their balances for the user
        const userTokensResult = await pool.request()
            .input('userID', sql.Int, userId)
            .query('SELECT TokenSymbol, balance AS Balance FROM UserTokenBalance WHERE UserID = @userID');

        if (userTokensResult.recordset.length === 0) {
            return res.status(200).json({ message: 'No tokens found for the user', tokens: [] });
        }

        res.status(200).json({ tokens: userTokensResult.recordset });

    } catch (error) {
        console.error('Error retrieving tokens:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.get('/balance/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const pool = await sql.connect(dbConfig);

        // Retrieve the user's balance
        const userResult = await pool.request()
            .input('userID', sql.Int, userId)
            .query('SELECT balance AS CashBalance FROM Users WHERE UserID = @userID');

        if (userResult.recordset.length === 0) {
            return res.status(400).json({ message: 'User not found' });
        }

        const userCashBalance = userResult.recordset[0].CashBalance;

        res.status(200).json({ balance: userCashBalance });

    } catch (error) {
        console.error('Error retrieving user balance:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

const csvFilePath = path.join(__dirname, 'python/synthetic_transactions_updated.csv');

app.get('/get-transaction-data', (req, res) => {
    const transactionData = [];
  
    // Read CSV data
    fs.createReadStream(csvFilePath)
    .pipe(csv())
    .on('data', (row) => {
        transactionData.push(row);
    })
    .on('end', () => {
        res.json(transactionData); // Send all transaction data
    });
});

app.post('/get-financial-tips', (req, res) => {
    const transactionData = req.body.transactions;
    
    const tips = generateFinancialTips(transactionData);
    res.json({ tips });
});

function generateFinancialTips(transactionData) {
    let totalIncome = 0;
    let totalExpenses = 0;
    let tips = new Set(); // Use a Set to prevent duplicate tips

    transactionData.forEach(transaction => {
      totalIncome += parseFloat(transaction.IncomingTransactionAmount || 0);
      totalExpenses += parseFloat(transaction.OutgoingTransactionAmount || 0);

      // Tip for late-night transactions
      if (parseInt(transaction.TransactionTime.split(':')[0]) > 22) {
        tips.add("You have late-night transactions. Try to avoid unnecessary purchases at night.");
      }

      // Tip based on high-value transactions
      if (parseFloat(transaction.MaxIncomingAmount) > 1000) {
        tips.add("You often receive large transactions. Ensure you are budgeting effectively.");
      }

      if (parseFloat(transaction.MaxOutgoingAmount) > 1000) {
        tips.add("You are spending large amounts. Review your expenses to avoid overspending.");
      }
    });

    // Analyze income vs expenses and add tips
    if (totalExpenses > totalIncome) {
      tips.add("You're spending more than you're earning. Consider reducing expenses and saving more.");
    }

    // Additional tips based on your 5 requested tips:
    // 1. Frequent Small Transactions
    let smallTransactionCount = transactionData.filter(t => parseFloat(t.IncomingTransactionAmount || 0) < 100).length
      + transactionData.filter(t => parseFloat(t.OutgoingTransactionAmount || 0) < 100).length;

    if (smallTransactionCount > 5) { // Threshold can be adjusted
      tips.add("You often make small transactions. Consider consolidating them to save on fees or manage your budget more effectively.");
    }

    // 2. Unusual Frequency of Transactions (based on time)
    let timeWindowInMinutes = 60; // Time window (in minutes) to check for unusual frequency (e.g., 60 minutes)
    let transactionTimestamps = transactionData.map(transaction => new Date(transaction.TransactionDate).getTime());

    // Sort transaction timestamps in ascending order
    transactionTimestamps.sort((a, b) => a - b);

    // Check the time difference between consecutive transactions
    for (let i = 1; i < transactionTimestamps.length; i++) {
    let timeDiffInMinutes = (transactionTimestamps[i] - transactionTimestamps[i - 1]) / (1000 * 60);
    if (timeDiffInMinutes < timeWindowInMinutes) {
        tips.add("You make a lot of transactions in a short period. Be mindful of your spending habits and track your spending frequency.");
        break;
    }
    }

    // 3. Regular Large Outgoing Transactions
    let largeOutgoingCount = transactionData.filter(t => parseFloat(t.OutgoingTransactionAmount || 0) > 500).length;
    if (largeOutgoingCount > 3) { // Adjust the count threshold as needed
      tips.add("You regularly make large outgoing transactions. Ensure you have a clear purpose for these expenses, such as investment or savings.");
    }

    // Convert the Set to an array and return
    return Array.from(tips);
}


app.get('/data-visual', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/data.html'));
});


// Start the server
app.listen(PORT,'0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

