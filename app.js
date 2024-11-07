const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const QRCode = require('qrcode');
const cors = require('cors');
const { sendFcmMessage } = require('./controllers/fcmController')
const { registerUser, nricCheck, notifySuccess, login, handleDeductBalance, storeWebToken, getWebToken, removeWebToken, getId,findUserByNameOrPhone } = require('./controllers/userController');
const chatbot = require("./controllers/chatBotController.js");
const axios = require('axios');
const {loginUserByFace, updateUserFace} = require("./models/facialModel.js");
const { PythonShell } = require('python-shell');
const env = require('dotenv').config();
const API_KEY = process.env.GEMINI_API_KEY;
const app = express();
const PORT = 3001;
const sql = require('mssql');
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

app.post('/getting-id', getId);

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

// app.post('/generate-qr', async (req, res) => {
//   const { amount, userId } = req.body;

//   if (!amount || !userId) {
//       return res.status(400).json({ error: 'Amount and userId are required' });
//   }

//   try {
//       // const qrCodeData = `Withdraw: ${amount}, User: ${userId}`;
//       const qrCodeData = {
//         action: 'Withdraw',
//         amount: String(amount),
//         userId: String(userId)
//       };

//       const qrCodeDataString = JSON.stringify(qrCodeData);
//       console.log("QR Code Data:", qrCodeDataString);
//       // Generate QR code as a Base64 string
//       const qrCodeBase64 = await QRCode.toDataURL(qrCodeDataString);
      
//       // Store the QR code in a temporary variable (or session)
//       req.app.locals.qrCode = qrCodeBase64;

//       // Prepare the URL for the QR code display page
//       const redirectUrl = `http://localhost:${PORT}/display-qr`;
//       require('child_process').exec(`start ${redirectUrl}`);
//       res.json({ redirectUrl }); // Send back the redirect URL to the mobile app
//   } catch (error) {
//       console.error(error);
//       res.status(500).json({ error: 'Error generating QR code' });
//   }
// });

// // Endpoint to display the QR code
// app.get('/display-qr', (req, res) => {
//   const qrCodeBase64 = req.app.locals.qrCode; // Get the stored QR code
//   if (!qrCodeBase64) {
//       return res.status(404).send('No QR code generated');
//   }

//   const html = `
//       <!DOCTYPE html>
//       <html lang="en">
//       <head>
//           <meta charset="UTF-8">
//           <meta name="viewport" content="width=device-width, initial-scale=1.0">
//           <title>QR Code</title>
//           <style>
//               body {
//                   display: flex;
//                   flex-direction: column;
//                   justify-content: center;
//                   align-items: center;
//                   height: 100vh;
//                   margin: 0;
//                   text-align: center;
//                   background: #e4e0e0;  
//               }
//               img {
//                   width: 250px;
//                   height: 250px;
//               }
//               h1 {
//                   margin-bottom: 20px;
//               }
//               p {
//                   margin-top: 20px;
//               }
//           </style>
//       </head>
//       <body>
//           <h1>Your QR Code</h1>
//           <img src="${qrCodeBase64}" alt="QR Code" />
//           <p><a href="/">Back to Home</a></p>
//       </body>
//       </html>
//   `;

//   res.send(html);
// });
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

//Facial Login
app.get('/faceLogin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/facialRecog.html'))
})

// Chatbot API
app.post("/chat", chatbot.startChatForUser);

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



// Start the server
app.listen(PORT,'0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

