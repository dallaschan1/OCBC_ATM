const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require("dotenv");
dotenv.config();
const path = require('path')
const nodemailer = require('nodemailer');
const express = require('express');
const bodyParser = require('body-parser');
const Web3 = require('web3').default;
const QRCode = require('qrcode');
const cors = require('cors');
const { sendFcmMessage } = require('./controllers/fcmController')
const { registerUser, nricCheck, notifySuccess, login, handleDeductBalance, storeWebToken, getWebToken, removeWebToken, getId,findUserByNameOrPhone,pincodeSuccess,ATMCardLock,ATMCardUnlock } = require('./controllers/userController');
const chatbot = require("./controllers/chatBotController.js");
const { adminlogin } = require("./controllers/adminController.js");
const { fetchATMs,handleATMStatusUpdate, handleUserSuspicionUpdate,getUserSuspicion,getBalance,withdrawATMbalance,handleMaintenanceUpdate, 
    getATMById,insertintoMaintenance,getATMMaintenance,deleteATMMaintenance,addingLog,getAllLog,getAllComponentsHealth } = require("./controllers/atmController.js");
const axios = require('axios');
const {loginUserByFace, updateUserFace} = require("./models/facialModel.js");
const { PythonShell } = require('python-shell');
const API_KEY = process.env.GEMINI_API_KEY;
const API_KEY2 = process.env.GEMINI_API_KEY2;
const app = express();
const PORT = 3001;
const sql = require('mssql');
const csv = require('csv-parser');
const fs = require('fs');
const multer = require('multer');
const dbConfig = require("./dbconfig.js");
const Password = require('./controllers/PasswordController');
const Withdraw = require('./controllers/withdrawalController');
const dbconfig = require('./dbconfig.js');
const bcrypt = require('bcrypt')
const twilio = require('twilio');


// Database Configuration
const config = {
    user: "fsdp", // Replace with your SQL Server username
    password: "8gL!zR2@hQ3p", // Replace with your password
    server: "localhost",
    database: "fsdp_assignment",
    trustServerCertificate: true,
    options: {
        port: 1433,
        connectionTimeout: 60000, // Connection timeout in milliseconds
    },
};


sql.connect(dbConfig)
    .then((pool) => {
        db = pool;
        console.log("Connected to the database.");
    })
    .catch((error) => console.error("Database connection failed:", error));

// Create Connection Pool
const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        
        return pool;
    })
    .catch(err => {
       
    });

module.exports = { sql, poolPromise };

const genAI = new GoogleGenerativeAI(API_KEY); // Replace with your actual API key
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const genAI2 = new GoogleGenerativeAI(API_KEY2); // Replace with your actual API key
const model2 = genAI2.getGenerativeModel({ model: "gemini-1.5-flash" });

// Middleware setup
app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/a', (req, res) => { res.sendFile(path.join(__dirname, 'public/html/a.html')); });
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

app.get('/card-login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/card-login.html'))
})

app.get('/pincode', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/pincode.html'))
})

app.get('/crypto', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/crypto.html'));
});

app.get('/jHome', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/jointWithdrawal.html'));
});

app.get('/Withdrawal_Auth', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/Withdrawal_Authentication.html'));
});

// app.post('/send-message', sendFcmMessage);

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
app.post("/pincode-success", pincodeSuccess);
app.post("/ATMCardLock", ATMCardLock);
app.post("/ATMCardUnlock", ATMCardUnlock);

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

// ATM
app.get('/atms', fetchATMs);

app.post('/update-atm-status', handleATMStatusUpdate);
app.post('/update-user-suspicion', handleUserSuspicionUpdate);
app.post('/get-user-suspicion', getUserSuspicion);
app.post('/get-balance', getBalance);
app.post('/withdraw-atm-balance', withdrawATMbalance);
app.post('/update-maintenance', handleMaintenanceUpdate);
app.get('/get-atm/:ATMID', getATMById);

app.get("/ATM/:ATMID", async (req,res) => {
    res.sendFile(path.join(__dirname, 'public/html/atm.html'))
});

app.post('/insert-into-maintenance', insertintoMaintenance);
app.post('/get-maintenance', getATMMaintenance);
app.delete('/delete-maintenance', deleteATMMaintenance);
app.get('/get-all-logs/:atm_id', getAllLog);
app.post('/add-log', addingLog);

app.get("/test", async (req,res) => {
    res.sendFile(path.join(__dirname, 'public/html/test.html'))
});

app.get("/maintenance-logs", async (req,res) => {
    res.sendFile(path.join(__dirname, 'public/html/maintenance.html'))
});

app.get("/components-health/:atm_id", getAllComponentsHealth);

app.get('/location', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/location.html'))
});

app.get('/feedback', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/feedback.html'))
});

//Facial Login
const store = multer.memoryStorage();
const use = multer({ store });

app.get('/faceLogin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/facialRecog.html'))
})

app.post('/faceLogin/authenticate', use.single('faceData'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send({ success: false, message: 'No face data received.' });
    }

    const capturedData = req.file.buffer; // Binary face data sent for login

    try {
        // Connect to SQL Server
        await sql.connect(dbConfig);

        // Retrieve the stored face data from SQL Server
        const result = await sql.query`
            SELECT Face_Data FROM Users WHERE nric = 'S1234567A'
        `;
        
        if (result.recordset.length === 0) {
            return res.status(404).send({ success: false, message: 'No face data found for this user.' });
        }

        const storedFaceData = result.recordset[0].Face_Data; // Binary data from the database
        // For simplicity, comparing buffer equality as a placeholder
        // You can replace this with a more sophisticated comparison method
        const isMatch = Buffer.compare(capturedData, storedFaceData) === 0;

        if (isMatch) {
            res.send({ success: true, message: 'Face recognized, login successful.' });
        } else {
            res.send({ success: false, message: 'Face not recognized.' });
        }
    } catch (error) {
        console.error('Error during face authentication:', error);
        res.status(500).send({ success: false, message: 'Error during face authentication.' });
    }
});

app.get('/faceRegist', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/facialRegistration.html'));
});

app.post('/faceRegist/upload-face', use.single('faceData'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No face data received.');
    }

    const binaryData = req.file.buffer; // Binary image data

    try {
        // Connect to SQL Server
        await sql.connect(dbConfig);

        // Insert binary data into FaceData table
        const result = await sql.query`
            update Users SET Face_Data = ${binaryData} WHERE nric = 'S1234567A'
        `;
        res.send('Face data saved to SQL Server.');
    } catch (error) {
        console.error('Error saving to SQL Server:', error);
        res.status(500).send('Error saving face data to SQL Server.');
    }
}); 

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
    console.log("Buy Token Request:", req.body);
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
    console.log("User ID:", userId);
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

app.post('/receiveToken', async (req, res) => {
    const { userId, tokenSymbol, amount } = req.body;

    try {
        const pool = await sql.connect(dbConfig);

        // Get the user's current token balance
        const userTokenResult = await pool.request()
            .input('userID', sql.Int, userId)
            .input('tokenSymbol', sql.NVarChar(10), tokenSymbol)
            .query('SELECT Balance FROM UserTokenBalance WHERE UserID = @userID AND TokenSymbol = @tokenSymbol');

        let newTokenBalance = amount;

        if (userTokenResult.recordset.length > 0) {
            // User already has some balance of this token, add to it
            newTokenBalance += parseFloat(userTokenResult.recordset[0].Balance);
            await pool.request()
                .input('userID', sql.Int, userId)
                .input('tokenSymbol', sql.NVarChar(10), tokenSymbol)
                .input('newTokenBalance', sql.Decimal(18, 8), newTokenBalance)
                .query('UPDATE UserTokenBalance SET Balance = @newTokenBalance WHERE UserID = @userID AND TokenSymbol = @tokenSymbol');
        } else {
            // User doesn't have this token yet, create a new entry
            await pool.request()
                .input('userID', sql.Int, userId)
                .input('tokenSymbol', sql.NVarChar(10), tokenSymbol)
                .input('newTokenBalance', sql.Decimal(18, 8), newTokenBalance)
                .query('INSERT INTO UserTokenBalance (UserID, TokenSymbol, Balance) VALUES (@userID, @tokenSymbol, @newTokenBalance)');
        }

        res.status(200).json({ message: 'Token received and balance updated successfully' });

    } catch (error) {
        console.error('Error processing token reception:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


const csvFilePath = path.join(__dirname, 'python/chart_data_with_categories.csv');

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

app.post('/get-financial-tips', async (req, res) => {
    const transactionData = req.body.transactions;

    // Constructing the prompt for generating tips with explanations
    const prompt = createPromptFromTransactions(transactionData);

    try {
        // Call Gemini AI to generate financial tips
        const result = await model.generateContent(prompt);
        
        // Clean the result: Remove asterisks and other markdown-style formatting
        let tips = result.response.text().split('\n').filter(tip => tip.trim() !== ''); // Split by newlines and remove empty entries

        // Remove the ** from each tip (for Markdown bold formatting)
        tips = tips.map(tip => tip.replace(/\*\*/g, '').trim());

        // Ensure we only return exactly 3 tips
        tips = tips.slice(0, 3);

        // Send the cleaned tips
        res.json({ tips: tips });
    } catch (error) {
        console.error("Error fetching financial tips from Gemini AI:", error);
        res.status(500).json({ error: "Error fetching financial tips" });
    }
});

function createPromptFromTransactions(transactionData) {
    let prompt = "Based on the transaction data, provide **exactly 3 brief financial tips**. Do not focus on specific areas like spending, income management, or saving, but provide general advice based on the overall situation. Include **short explanations**. Do not include any additional text or headers.\n";
    
    // Summarize the total income and outgoing
    let totalIncome = 0;
    let totalOutgoing = 0;
    
    transactionData.forEach(transaction => {
        totalIncome += parseFloat(transaction.IncomingTransactionAmount || 0);
        totalOutgoing += parseFloat(transaction.OutgoingTransactionAmount || 0);
    });

    prompt += `Total Income: $${totalIncome.toFixed(2)}\n`;
    prompt += `Total Outgoing: $${totalOutgoing.toFixed(2)}\n`;

    // Request for general tips based on the overall financial situation
    prompt += "\nGive me exactly 3 general financial tips based on this transaction data, considering the overall income and expenses.";

    return prompt;
}

app.get('/data-visual', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/data.html'));
});

const storage = multer.memoryStorage();  // Storing files in memory for easy processing
const upload = multer({ storage: storage });

// Save the PDF to the database
app.post('/save-pdf', upload.single('pdf'), async (req, res) => {
    try {
      const { UserID } = req.body;  // UserID still comes from the form data
      const pdf = req.file;  // The PDF file sent as form data
  
      if (!UserID || !pdf) {
        return res.status(400).json({ message: 'UserID and PDF are required.' });
      }
  
      // Now pdf.buffer contains the PDF binary data from the Blob
      const buffer = pdf.buffer;
  
      // Establish a database connection
      const pool = await sql.connect(dbconfig);
  
      // Create the query to insert the PDF into the UserReports table
      const query = `
        INSERT INTO [dbo].[UserReports] (UserID, ReportName, ReportData)
        VALUES (@UserID, @ReportName, @ReportData);
      `;
  
      // Prepare the query parameters
      await pool.request()
        .input('UserID', sql.Int, UserID)
        .input('ReportName', sql.VarChar, 'Financial Dashboard Report') // You can customize this if needed
        .input('ReportData', sql.VarBinary, buffer)
        .query(query);
  
      // Close the database connection
      pool.close();
  
      // Respond with a success message
      res.status(200).json({ message: 'PDF saved successfully!' });
    } catch (error) {
      console.error('Error saving PDF:', error);
      res.status(500).json({ message: 'Error saving the PDF to the database.' });
    }
});  


app.get('/download-pdf/:UserID', async (req, res) => {
    const { UserID } = req.params;
  
    try {
      // Establish a database connection
      const pool = await sql.connect(dbconfig);
  
      // Corrected query to fetch the most recent PDF for the given UserID
      const query = `SELECT TOP 1 ReportData, ReportName FROM [dbo].[UserReports] WHERE UserID = @UserID ORDER BY ReportID DESC;`;
  
      // Get the report from the database
      const result = await pool.request()
        .input('UserID', sql.Int, UserID)
        .query(query);
  
      // Check if the report exists
      if (result.recordset.length > 0) {
        const report = result.recordset[0];
  
        // Check if the response has already been sent
        if (res.headersSent) {
          console.log('Response has already been sent.');
          return;
        }
  
        // Set the correct content type for a PDF file
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${report.ReportName}.pdf"`);
        console.log(report.ReportData);
  
        // Send the PDF file (as binary data) to the client
        res.send(report.ReportData);
      } else {
        if (res.headersSent) {
          console.log('Response has already been sent.');
          return;
        }
  
        res.status(404).json({ message: 'PDF not found for this user.' });
      }
  
      // Close the database connection
      pool.close();
      
    } catch (error) {
      // If the response has already been sent, don't send another one
      if (res.headersSent) {
        console.log('Response has already been sent due to an error.');
        return;
      }
  
      console.error('Error downloading PDF:', error);
      res.status(500).json({ message: 'Error fetching the PDF from the database.' });
    }
});


const web3 = new Web3('http://localhost:7545'); 


const serverWalletAddress = '0x8AfeAD84bb47518900607036a6Ad1c8BFADBC24c'; 

// Token contracts
const tokenContracts = [
    { address: '0x38D7a22A658D87d4c9a49A76E03Fdc7C97145f95', name: 'Bitcoin', symbol: 'BTC' },
    { address: '0x0000000000000000000000000000000000000000', name: 'Ethereum', symbol: 'ETH' },
    { address: '0xE7f3C353Cc0074C20bC8dDF098C58EAE365325bc', name: 'Tether', symbol: 'USDT' },
    { address: '0x7Ff9732A5F83e803DA138277d83da20C5b6B4FEE', name: 'BinanceCoin', symbol: 'BNB' },
    { address: '0x4c6FE8b13BE0b7540DFf2c863b7ad0d328C1CF5F', name: 'Cardano', symbol: 'ADA' },
    { address: '0x8E552e48a568a868Ba6EC7A16441dBf9E84Da27c', name: 'Dogecoin', symbol: 'DOGE' },
    { address: '0xcD5184827CDC53BAEa5782B86fBDb2ae07E3F636', name: 'Ripple', symbol: 'XRP' },
    { address: '0x6250D0D50Ca98D98ac4c089F560Bd9943A2c24dE', name: 'Polkadot', symbol: 'DOT' },
    { address: '0xEdf264da3ed4b8Cfc829c50D426764160C0a4B31', name: 'Chainlink', symbol: 'LINK' },
    { address: '0x0d72C4C4C64B0de584C348f7A2e5AE720bf43Cf2', name: 'Litecoin', symbol: 'LTC' }
];


const erc20ABI = [
    // balanceOf
    {
        "constant": true,
        "inputs": [{ "name": "_owner", "type": "address" }],
        "name": "balanceOf",
        "outputs": [{ "name": "balance", "type": "uint256" }],
        "type": "function"
    },
    // decimals
    {
        "constant": true,
        "inputs": [],
        "name": "decimals",
        "outputs": [{ "name": "", "type": "uint8" }],
        "type": "function"
    },
    // symbol
    {
        "constant": true,
        "inputs": [],
        "name": "symbol",
        "outputs": [{ "name": "", "type": "string" }],
        "type": "function"
    },
    // transfer
    {
        "constant": false,
        "inputs": [
            { "name": "_to", "type": "address" },
            { "name": "_value", "type": "uint256" }
        ],
        "name": "transfer",
        "outputs": [{ "name": "", "type": "bool" }],
        "type": "function"
    }
];

app.post('/receive', async (req, res) => {
    const { walletAddress, amount, tokenName } = req.body;

    if (!web3.utils.isAddress(walletAddress)) {
        return res.status(400).json({ message: 'Invalid wallet address' });
    }

    if (!amount || isNaN(amount) || amount <= 0) {
        return res.status(400).json({ message: 'Invalid amount' });
    }

    const token = tokenContracts.find(t => t.name.toLowerCase() === tokenName.toLowerCase());
    if (!token) {
        return res.status(400).json({ message: 'Token not found' });
    }

    if (token.address === '0x0000000000000000000000000000000000000000') {
        try {
            const weiAmount = web3.utils.toWei(amount.toString(), 'ether');

            const serverBalanceBefore = await web3.eth.getBalance(serverWalletAddress);
            const senderBalanceBefore = await web3.eth.getBalance(walletAddress);

            const transaction = await web3.eth.sendTransaction({
                from: walletAddress,
                to: serverWalletAddress,
                value: weiAmount,
                gas: 21000
            });

            const receipt = await web3.eth.getTransactionReceipt(transaction.transactionHash);
            const gasUsed = receipt.gasUsed;
            const txDetails = await web3.eth.getTransaction(transaction.transactionHash);
            const gasPrice = txDetails.gasPrice;
            const gasCost = web3.utils.toBN(gasUsed).mul(web3.utils.toBN(gasPrice));

            const senderBalanceAfter = await web3.eth.getBalance(walletAddress);

            const actualETHSent = web3.utils.toBN(senderBalanceBefore).sub(web3.utils.toBN(senderBalanceAfter)).sub(gasCost);

            if (!actualETHSent.eq(web3.utils.toBN(weiAmount))) {
                return res.status(400).json({
                    message: `Expected ${web3.utils.fromWei(weiAmount, 'ether')} ETH but transferred ${web3.utils.fromWei(actualETHSent, 'ether')} ETH`
                });
            }

            await updateOCBCWallet('ETH', amount);

            res.status(200).json({ message: 'ETH received and balance updated' });

        } catch (error) {
            console.error('Error processing ETH receive:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
        return;
    }

    const tokenContract = new web3.eth.Contract(erc20ABI, token.address);

    try {
        const decimals = await tokenContract.methods.decimals().call();
        const tokenAmount = BigInt(amount) * (BigInt(10) ** BigInt(decimals));
    
        const serverTokenBalanceBefore = BigInt(await tokenContract.methods.balanceOf(serverWalletAddress).call());
        const senderTokenBalanceBefore = BigInt(await tokenContract.methods.balanceOf(walletAddress).call());
    
        const transfer = await tokenContract.methods.transfer(serverWalletAddress, tokenAmount).send({
            from: walletAddress,
            gas: 200000
        });
    
        const serverTokenBalanceAfter = BigInt(await tokenContract.methods.balanceOf(serverWalletAddress).call());
        const receivedTokenAmount = serverTokenBalanceAfter - serverTokenBalanceBefore;
    
        if (receivedTokenAmount !== tokenAmount) {
            return res.status(400).json({
                message: `Expected ${amount} tokens but transferred ${(receivedTokenAmount / (BigInt(10) ** BigInt(decimals))).toString()} tokens`
            });
        }
    
        await updateOCBCWallet(token.symbol, amount);
    
        res.status(200).json({ message: 'Token received and balance updated' });
    
    } catch (error) {
        console.error('Error processing token receive:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
    
});


// Function to update the OCBCWallet balance
async function updateOCBCWallet(tokenSymbol, amount) {
    try {
        const pool = await sql.connect(dbConfig);

        
        const walletResult = await pool.request()
            .input('tokenSymbol', sql.NVarChar(10), tokenSymbol)
            .query('SELECT Balance FROM OCBCWallet WHERE TokenSymbol = @tokenSymbol');

        if (walletResult.recordset.length === 0) {
            
            await pool.request()
                .input('tokenSymbol', sql.NVarChar(10), tokenSymbol)
                .input('newBalance', sql.Decimal(18, 8), amount)
                .query('INSERT INTO OCBCWallet (TokenSymbol, Balance) VALUES (@tokenSymbol, @newBalance)');
        } else {
           
            const currentBalance = parseFloat(walletResult.recordset[0].Balance);
            const newBalance = currentBalance + parseFloat(amount);

            await pool.request()
                .input('tokenSymbol', sql.NVarChar(10), tokenSymbol)
                .input('newBalance', sql.Decimal(18, 8), newBalance)
                .query('UPDATE OCBCWallet SET Balance = @newBalance WHERE TokenSymbol = @tokenSymbol');
        }
    } catch (error) {
        throw error;
    }
}
//ratings
app.use(cors());
app.post('/submit-rating', async (req, res) => {
    const { rating, userId } = req.body;

    // Log the request body to the terminal
    console.log('Received rating data:', req.body);

    if (!rating) {
        console.log('Error: Rating is required.');
        return res.status(400).send({ message: 'Rating is required.' });
    }
    
    if (!userId) {
        console.log('Error: User ID is required.');
        return res.status(400).send({ message: 'User ID is required.' });
    }
    

    try {
        const pool = await sql.connect(dbConfig);
        
        // Log the database interaction to the terminal
        console.log('Inserting rating into the database...');
        
        // Insert the rating into the database
        await pool.request()
            .input('userId', sql.Int, userId)
            .input('rating', sql.Int, rating)
            .query('INSERT INTO Ratings (UserID, Rating) VALUES (@userId, @rating)');
        
        console.log('Rating successfully inserted into the database.');
        
        res.status(200).send({ message: 'Rating submitted successfully!' });
    } catch (error) {
        console.error('Error saving rating to database:', error);
        res.status(500).send({ message: 'Internal server error.' });
    }
});

app.get('/get-low-ratings', async (req, res) => {
    const userId = req.query.userId; // Optional: Use this to filter by userId if needed

    try {
        const pool = await sql.connect(dbConfig);
        
        // Query to fetch low ratings (e.g., Rating < 3)
        const result = await pool.request()
            .input('userId', sql.Int, userId)
            .query('SELECT Rating, UserID, RatingDate FROM Ratings WHERE Rating < 3 AND UserID = @userId');

        res.status(200).json({ ratings: result.recordset });
    } catch (error) {
        console.error('Error fetching ratings:', error);
        res.status(500).send({ message: 'Error fetching low ratings.' });
    }
});

// POST endpoint to submit feedback
app.post('/submit-feedback', async (req, res) => {
    const { userId, rating, feedback } = req.body;

    // Log the request body to the terminal
    console.log('Received feedback data:', req.body);

    if (!userId || rating === undefined || !feedback) {
        console.log('Error: User ID, rating, and feedback text are required.');
        return res.status(400).send({ message: 'User ID, rating, and feedback are required.' });
    }

    try {
        const pool = await sql.connect(dbConfig);

        // Log the database interaction to the terminal
        console.log('Inserting feedback into the database...');
        
        // Insert feedback into the database
        await pool.request()
            .input('userId', sql.Int, userId)
            .input('rating', sql.Int, rating)
            .input('feedback', sql.VarChar(500), feedback)
            .query('INSERT INTO Feedback (UserID, Rating, FeedbackText) VALUES (@userId, @rating, @feedback)');

        console.log('Feedback successfully inserted into the database.');
        
        res.status(200).send({ message: 'Feedback submitted successfully!' });
    } catch (error) {
        console.error('Error saving feedback to database:', error);
        res.status(500).send({ message: 'Internal server error.' });
    }
});

// GET endpoint to fetch feedback for a specific user
app.get('/get-feedback', async (req, res) => {
    const userId = req.query.userId;

    if (!userId) {
        console.log('Error: User ID is required to fetch feedback.');
        return res.status(400).send({ message: 'User ID is required.' });
    }

    try {
        const pool = await sql.connect(dbConfig);

        // Query to fetch feedback for the given userId
        const result = await pool.request()
            .input('userId', sql.Int, userId)
            .query('SELECT FeedbackID, Rating, FeedbackText, FeedbackDate FROM Feedback WHERE UserID = @userId');

        res.status(200).json({ feedback: result.recordset });
    } catch (error) {
        console.error('Error fetching feedback:', error);
        res.status(500).send({ message: 'Error fetching feedback.' });
    }
});

app.post('/updateTransactionCount', async (req, res) => {
    try {
        const { userId } = req.body; // Get userId from request body
        
        if (!userId) {
            return res.status(400).send('User ID is required');
        }

        const pool = await sql.connect('your-mssql-connection-string');
        const result = await pool.request()
            .input('userId', sql.Int, userId) // Parameterized query to prevent SQL injection
            .query('SELECT transactionCount FROM UserTransactionCount WHERE userId = @userId');
        
        let transactionCount;
        
        if (result.recordset.length === 0) {
            // If no record is found, create a new one with a default transaction count of 1
            transactionCount = 1;
            await pool.request()
                .input('userId', sql.Int, userId)
                .input('transactionCount', sql.Int, transactionCount)
                .query('INSERT INTO UserTransactionCount (userId, transactionCount) VALUES (@userId, @transactionCount)');
        } else {
            transactionCount = result.recordset[0].transactionCount;
            transactionCount = transactionCount + 1; // Increment transaction count

            if (transactionCount > 30) {
                transactionCount = 1; // Reset to 1 if it exceeds 30
            }

            // Update the transaction count in the database
            await pool.request()
                .input('userId', sql.Int, userId)
                .input('transactionCount', sql.Int, transactionCount)
                .query('UPDATE UserTransactionCount SET transactionCount = @transactionCount WHERE userId = @userId');
        }

        res.status(200).send({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error updating transaction count');
    }
});
app.get('/getTransactionCount', async (req, res) => {
    try {
        const { userId } = req.query; // Get userId from query parameters
        
        if (!userId) {
            return res.status(400).send('User ID is required');
        }

        const pool = await sql.connect('your-mssql-connection-string');
        const result = await pool.request()
            .input('userId', sql.Int, userId) // Parameterized query to prevent SQL injection
            .query('SELECT transactionCount FROM UserTransactionCount WHERE userId = @userId');
        
        if (result.recordset.length === 0) {
            // If no record is found, initialize with a default transaction count of 1
            await pool.request()
                .input('userId', sql.Int, userId)
                .input('transactionCount', sql.Int, 1) // Default transaction count
                .query('INSERT INTO UserTransactionCount (userId, transactionCount) VALUES (@userId, @transactionCount)');
            
            return res.json({ transactionCount: 1 }); // Return default count of 1
        }

        // Return transaction count as JSON
        res.json({ transactionCount: result.recordset[0].transactionCount });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error retrieving transaction count');
    }
});

// Edit Members
// Nodemailer Transporter Setup
app.get('/More-Options-Shared', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/more-options-shared.html'));
});

app.get('/sharedAcc', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/SharedAccount.html'));
});

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: 'nandithabvs06@gmail.com', // Replace with your email
      pass: 'ffgu bdbe hdcj mvub', // Replace with your Gmail app password
    },
    connectionTimeout: 10000,
  });
  
  // Serve Edit Members HTML
  app.get('/EditMembers', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/EditMembers.html'));
  });
  
  // Add a Member Endpoint
  app.post('/add-member', async (req, res) => {
    const { name, email, contact, account_number } = req.body;
  
    if (!name || !email || !contact || !account_number) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
  
    try {
      const query = `
        INSERT INTO members (name, email, contact, account_number, status)
        OUTPUT Inserted.id
        VALUES (@name, @email, @contact, @account_number, @status)
      `;
  
      const request = db.request();
      request.input('name', sql.VarChar, name);
      request.input('email', sql.VarChar, email);
      request.input('contact', sql.VarChar, contact);
      request.input('account_number', sql.VarChar, account_number);
      request.input('status', sql.VarChar, 'Waiting for Approval');
  
      const result = await request.query(query);
      const insertedId = result.recordset[0].id;
  
      // Construct approval, decline, and report links
      const approvalLink = `http://localhost:${PORT}/approve-member/${insertedId}`;
      const declineLink = `http://localhost:${PORT}/decline-member/${insertedId}`;
      const reportLink = `http://localhost:${PORT}/report-member/${insertedId}`;
  
      // Set up email options
      const mailOptions = {
        from: 'nandithabvs06@gmail.com',
        to: email,
        subject: 'Approval Needed: Shared Account',
        html: `
          <p>Hi ${name},</p>
          <p>You have been invited to join a shared account.</p>
          <p>Please choose an action:</p>
          <a href="${approvalLink}">Accept Invitation</a><br>
          <a href="${declineLink}">Decline Invitation</a><br>
          <a href="${reportLink}">Decline and Report</a>
        `,
      };
  
      // Send the email
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Error sending email:', error);
          return res.status(500).json({ message: 'Failed to send email.', error });
        }
        console.log('Email sent: ', info.response);
        res.status(201).json({
          message: 'Member added successfully! Email has been sent.',
          memberId: insertedId,
        });
      });
    } catch (error) {
      console.error('Error adding member:', error);
      res.status(500).json({ message: 'Failed to add member.', error });
    }
  });
  
  // Get All Members Endpoint
  app.get('/members', async (req, res) => {
    try {
      if (!db) {
        return res.status(500).send('Database not connected');
      }
  
      const result = await db.query('SELECT * FROM members'); // Replace with your table name
      res.json(result.recordset); // `.recordset` contains the rows
    } catch (error) {
      console.error('Error fetching members:', error);
      res.status(500).json({ error: 'Failed to fetch members' });
    }
  });
  
  // Approve Member Endpoint
  app.get('/approve-member/:id', async (req, res) => {
    const { id } = req.params;
  
    try {
      const query = `UPDATE members SET status = 'Accepted' WHERE id = @id`;
      const request = db.request();
      request.input('id', sql.Int, id);
      const result = await request.query(query);
  
      if (result.rowsAffected[0] === 0) {
        return res.status(404).send('<p>Member not found.</p>');
      }
      res.send('<p>Thank you! Your membership has been approved.</p>');
    } catch (error) {
      console.error('Error approving member:', error);
      res.status(500).send('<p>Failed to approve member.</p>');
    }
  });
  
  // Decline Member Endpoint
  app.get('/decline-member/:id', async (req, res) => {
    const { id } = req.params;
  
    try {
      const query = `DELETE FROM members WHERE id = @id`;
      const request = db.request();
      request.input('id', sql.Int, id);
      const result = await request.query(query);
  
      if (result.rowsAffected[0] === 0) {
        return res.status(404).send('<p>Member not found.</p>');
      }
      res.send('<p>You have declined the invitation.</p>');
    } catch (error) {
      console.error('Error declining member:', error);
      res.status(500).send('<p>Failed to decline member.</p>');
    }
  });
  
  // Report Member Endpoint
  app.get('/report-member/:id', async (req, res) => {
    const { id } = req.params;
  
    try {
      const query = `DELETE FROM members WHERE id = @id`;
      const request = db.request();
      request.input('id', sql.Int, id);
      const result = await request.query(query);
  
      if (result.rowsAffected[0] === 0) {
        return res.status(404).send('<p>Member not found.</p>');
      }
      res.send('<p>You have declined and reported the invitation.</p>');
    } catch (error) {
      console.error('Error reporting member:', error);
      res.status(500).send('<p>Failed to report member.</p>');
    }
  });
  
  // Delete Member Endpoint
  app.delete('/delete-member/:id', async (req, res) => {
    const { id } = req.params;
  
    try {
      const query = `DELETE FROM members WHERE id = @id`;
      const request = db.request();
      request.input('id', sql.Int, id);
      const result = await request.query(query);
  
      if (result.rowsAffected[0] === 0) {
        return res.status(404).json({ message: 'Member not found.' });
      }
      res.status(200).json({ message: `Member deleted successfully.` });
    } catch (error) {
      console.error('Error deleting member:', error);
      res.status(500).json({ message: 'Failed to delete member.', error });
    }
  });
  
  // Edit Member Endpoint
  app.put('/edit-member/:id', async (req, res) => {
    const { id } = req.params;
    const { name, email, contact, account_number, status } = req.body;
  
    try {
      const query = `
        UPDATE members 
        SET name = @name, email = @email, contact = @contact, 
            account_number = @account_number, status = @status 
        WHERE id = @id
      `;
      const request = db.request();
      request.input('id', sql.Int, id);
      request.input('name', sql.VarChar, name);
      request.input('email', sql.VarChar, email);
      request.input('contact', sql.VarChar, contact);
      request.input('account_number', sql.VarChar, account_number);
      request.input('status', sql.VarChar, status);
  
      const result = await request.query(query);
  
      if (result.rowsAffected[0] === 0) {
        return res.status(404).json({ message: 'Member not found or update failed.' });
      }
      res.status(200).json({ message: 'Member updated successfully.' });
    } catch (error) {
      console.error('Error editing member:', error);
      res.status(500).json({ message: 'Failed to edit member.', error });
    }
  });
 

//LOAN
app.get("/loanServices", (req, res) => {
    res.sendFile(path.join(__dirname, "public/html", "loanServices.html"));
});

app.get("/applyEligibility", (req, res) => {
    res.sendFile(path.join(__dirname, "public/html", "applyEligibility.html"));
});

// Serve Loan Application Page
app.get("/applyLoan", (req, res) => {
    res.sendFile(path.join(__dirname, "public/html", "loanApplication.html"));
});

// Serve Loan Repayment Page
app.get("/repayLoan", (req, res) => {
    res.sendFile(path.join(__dirname, "public/html", "loanRepayment.html"));
});

// Serve Admin Dashboard Page
app.get("/adminDashboard", (req, res) => {
    res.sendFile(path.join(__dirname, "public/html", "adminDashboard.html"));
});

// Helper function to generate a Unique Loan ID
function generateUniqueId() {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const randomLetters = letters.charAt(Math.floor(Math.random() * 26)) + letters.charAt(Math.floor(Math.random() * 26));
    const randomNumbers = Math.floor(1000 + Math.random() * 9000);
    return randomLetters + randomNumbers;
}

// Apply for Loan Eligibility (Prevents Duplicate Entries)
app.post("/apply-eligibility", async (req, res) => {
    const { name, email, contact, account_number, salary } = req.body;

    if (!name || !email || !contact || !account_number || !salary) {
        return res.status(400).json({ message: "All fields are required." });
    }

    try {
        const existingUser = await db.request()
            .input("email", sql.NVarChar, email)
            .input("contact", sql.NVarChar, contact)
            .input("account_number", sql.NVarChar, account_number)
            .query(`SELECT * FROM loan_eligibility WHERE email = @email OR contact = @contact OR account_number = @account_number`);

        if (existingUser.recordset.length > 0) {
            return res.status(400).json({ message: "A user with this email, contact, or account number already exists." });
        }

        const uniqueId = generateUniqueId();

        await db.request()
            .input("unique_id", sql.NVarChar, uniqueId)
            .input("name", sql.NVarChar, name)
            .input("email", sql.NVarChar, email)
            .input("contact", sql.NVarChar, contact)
            .input("account_number", sql.NVarChar, account_number)
            .input("salary", sql.Decimal(15, 2), salary)
            .query(`INSERT INTO loan_eligibility (unique_id, name, email, contact, account_number, salary, eligibility_status)
                    VALUES (@unique_id, @name, @email, @contact, @account_number, @salary, 'Pending')`);

        res.status(201).json({ message: "Loan eligibility application submitted!" });
    } catch (error) {
        console.error("Error applying for eligibility:", error);
        res.status(500).json({ message: "Failed to apply for loan eligibility.", error });
    }
});

// Fetch Loan Eligibility Applications for Admin Page
app.get("/eligibility", async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM loan_eligibility");
        res.status(200).json(result.recordset);
    } catch (error) {
        console.error("Error fetching eligibility applications:", error);
        res.status(500).json({ message: "Failed to fetch eligibility applications." });
    }
});

// Apply for Loan (Ensure `amount_due` Includes Interest)
app.post("/apply-loan", async (req, res) => {
    const { unique_id, loan_amount, loan_term, interest_rate } = req.body;

    if (!unique_id || !loan_amount || !loan_term || !interest_rate) {
        return res.status(400).json({ message: "All fields are required." });
    }

    try {
        const eligibilityCheck = await db.request()
            .input("unique_id", sql.NVarChar, unique_id)
            .query("SELECT id FROM loan_eligibility WHERE unique_id = @unique_id AND eligibility_status = 'Approved'");

        if (eligibilityCheck.recordset.length === 0) {
            return res.status(403).json({ message: "You are not eligible to apply for a loan." });
        }

        const eligibilityId = eligibilityCheck.recordset[0].id;
        const interestMultiplier = 1 + (parseFloat(interest_rate) / 100);
        const totalRepayment = (parseFloat(loan_amount) * interestMultiplier).toFixed(2); // Ensure correct decimal rounding

        console.log(`Applying Loan -> Loan Amount: ${loan_amount}, Interest Rate: ${interest_rate}%, Total Due: ${totalRepayment}`);

        await db.request()
            .input("eligibility_id", sql.Int, eligibilityId)
            .input("unique_id", sql.NVarChar, unique_id)
            .input("loan_amount", sql.Decimal(15, 2), loan_amount)
            .input("amount_due", sql.Decimal(15, 2), totalRepayment) // Store correct amount with interest
            .query(`INSERT INTO loan_applications (eligibility_id, unique_id, loan_amount, amount_due, loan_status)
                    VALUES (@eligibility_id, @unique_id, @loan_amount, @amount_due, 'Ongoing')`);

        res.status(201).json({ message: "Loan application submitted!", unique_id });
    } catch (error) {
        console.error("Error applying for loan:", error);
        res.status(500).json({ message: "Failed to apply for loan.", error });
    }
});

// Admin Approves or Declines Loan Eligibility (Sends Email)
app.put("/admin/eligibility/:id", async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!["Approved", "Declined"].includes(status)) {
        return res.status(400).json({ message: "Invalid status." });
    }

    try {
        await db.request()
            .input("id", sql.Int, id)
            .input("status", sql.NVarChar, status)
            .query("UPDATE loan_eligibility SET eligibility_status = @status WHERE id = @id");

        const user = await db.request()
            .input("id", sql.Int, id)
            .query("SELECT email, name, unique_id FROM loan_eligibility WHERE id = @id");

        const { email, name, unique_id } = user.recordset[0];

        let subject, message;
        if (status === "Approved") {
            subject = "Loan Eligibility Approved";
            message = `<p>Dear ${name},</p><p>Your loan eligibility has been <strong>approved</strong>.</p><p>Your Unique Loan ID: <b>${unique_id}</b></p>`;
        } else {
            subject = "Loan Eligibility Declined";
            message = `<p>Dear ${name},</p><p>Your loan eligibility application has been <strong>declined</strong>.</p>`;
        }

        await transporter.sendMail({
            from: "yourEmail@gmail.com",
            to: email,
            subject,
            html: message,
        });

        res.status(200).json({ message: `Eligibility ${status.toLowerCase()}! Email sent.` });
    } catch (error) {
        console.error("Error updating eligibility:", error);
        res.status(500).json({ message: "Failed to update eligibility.", error });
    }
});

// Fetch Total Loan Balance for Repayment
app.get("/loan-total-balance/:unique_id", async (req, res) => {
    const { unique_id } = req.params;

    try {
        const result = await db.request()
            .input("unique_id", sql.NVarChar, unique_id)
            .query(`SELECT COALESCE(SUM(amount_due), 0) AS total_due FROM loan_applications WHERE unique_id = @unique_id AND loan_status = 'Ongoing'`);

        res.status(200).json({ total_due: result.recordset[0].total_due || 0 });
    } catch (error) {
        console.error("Error fetching loan balance:", error);
        res.status(500).json({ message: "Error fetching loan balance." });
    }
});

// Process Loan Repayment
app.post("/repay-loan", async (req, res) => {
    const { unique_id, repayment_amount } = req.body;

    try {
        // Retrieve all outstanding loans sorted by oldest first
        const result = await db.request()
            .input("unique_id", sql.NVarChar, unique_id)
            .query(`
                SELECT id, amount_due 
                FROM loan_applications 
                WHERE unique_id = @unique_id AND amount_due > 0 
                ORDER BY id ASC
            `);

        let remainingRepayment = repayment_amount;
        let updatedLoans = [];

        for (const loan of result.recordset) {
            if (remainingRepayment <= 0) break; // Stop if no more repayment left

            let amountToDeduct = Math.min(loan.amount_due, remainingRepayment);
            remainingRepayment -= amountToDeduct;

            // Update the loan's amount_due
            await db.request()
                .input("loan_id", sql.Int, loan.id)
                .input("amount_due", sql.Decimal(15, 2), loan.amount_due - amountToDeduct)
                .query(`
                    UPDATE loan_applications 
                    SET amount_due = @amount_due 
                    WHERE id = @loan_id
                `);

            updatedLoans.push({ loan_id: loan.id, new_amount_due: loan.amount_due - amountToDeduct });

            // Stop processing further loans if the full repayment is used up
            if (remainingRepayment <= 0) break;
        }

        res.status(200).json({
            message: "Repayment applied successfully!",
            remainingRepayment,
            updatedLoans
        });
    } catch (error) {
        console.error(" Error processing repayment:", error);
        res.status(500).json({ message: "Failed to process repayment." });
    }
});


// Fetch Loan History for a User
app.get("/get-loans/:unique_id", async (req, res) => {
    const { unique_id } = req.params;

    try {
        const result = await db.request()
            .input("unique_id", sql.NVarChar, unique_id)
            .query("SELECT id, loan_amount, amount_due, loan_status FROM loan_applications WHERE unique_id = @unique_id");

        res.status(200).json({ loans: result.recordset });
    } catch (error) {
        console.error("Error fetching loan history:", error);
        res.status(500).json({ message: "Failed to fetch loan history." });
    }
});

// card blocking 
// Initialize Twilio Client
const twilioClient = new twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const otpStore = {}; // Temporary store for OTP verification

// Serve Block Card HTML Page
app.get("/blockCard", (req, res) => {
  res.sendFile(path.join(__dirname, "public/html", "blockCard.html"));
});

// **Send OTP for Card Blocking**
app.post("/send-otp", async (req, res) => {
  const { card_number, phone_number } = req.body;

  if (!card_number || !phone_number) {
    return res.status(400).json({ message: "Card number and phone number are required." });
  }

  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("card_number", sql.NVarChar, card_number)
      .input("phone_number", sql.NVarChar, phone_number)
      .query(`
        SELECT user_id FROM atm_users 
        JOIN atm_cards ON atm_users.id = atm_cards.user_id 
        WHERE atm_cards.card_number = @card_number AND atm_users.phone_number = @phone_number
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Invalid card or phone number." });
    }

    // Generate OTP
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[phone_number] = { otp: generatedOtp, expiresAt: Date.now() + 300000 }; // Valid for 5 minutes

    // Send OTP via Twilio
    await twilioClient.messages.create({
      body: `Your OTP for ATM card blocking: ${generatedOtp}`,
      from: process.env.TWILIO_PHONE_NUMBER, // Ensure this is a valid Twilio number
      to: `+65${phone_number}`, // Adjusted for international format
    });

    res.status(200).json({ message: "OTP sent to your phone." });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ message: "Failed to send OTP.", error });
  }
});

// **Verify OTP & Block ATM Card**
app.post("/block-atm-card", async (req, res) => {
  const { card_number, phone_number, otp } = req.body;

  if (!otp || !card_number || !phone_number) {
    return res.status(400).json({ message: "OTP, card number, and phone number are required." });
  }

  try {
    // Check if OTP exists and is valid
    const storedOtp = otpStore[phone_number];
    if (!storedOtp || storedOtp.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP." });
    }

    // Check if OTP has expired
    if (Date.now() > storedOtp.expiresAt) {
      delete otpStore[phone_number]; // Remove expired OTP
      return res.status(400).json({ message: "OTP has expired." });
    }

    // Remove OTP after successful verification
    delete otpStore[phone_number];

    // Block the card in `atm_cards`
    const pool = await poolPromise;
    await pool
      .request()
      .input("card_number", sql.NVarChar, card_number)
      .query(`UPDATE atm_cards SET status = 'Blocked' WHERE card_number = @card_number`);

    // Insert into `blocked_atm_cards`
    await pool
      .request()
      .input("card_number", sql.NVarChar, card_number)
      .query(`
        INSERT INTO blocked_atm_cards (user_id, card_number, status, blocked_at)
        SELECT user_id, card_number, 'Blocked', GETDATE() 
        FROM atm_cards 
        WHERE card_number = @card_number
      `);

    res.status(200).json({ success: true, message: "Card blocked successfully." });
  } catch (error) {
    console.error("Error blocking card:", error);
    res.status(500).json({ success: false, message: "Failed to block card.", error });
  }
});

// **Resend OTP**
app.post("/resend-otp", async (req, res) => {
  const { phone_number } = req.body;

  if (!phone_number) {
    return res.status(400).json({ message: "Phone number is required." });
  }

  try {
    // Check if OTP exists for the phone number
    if (!otpStore[phone_number]) {
      return res.status(400).json({ message: "No OTP request found for this phone number." });
    }

    // Generate a new OTP
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[phone_number] = { otp: generatedOtp, expiresAt: Date.now() + 300000 }; // Valid for 5 minutes

    // Send new OTP via Twilio
    await twilioClient.messages.create({
      body: `Your new OTP for ATM card blocking: ${generatedOtp}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: `+65${phone_number}`,
    });

    res.status(200).json({ message: "New OTP sent to your phone." });
  } catch (error) {
    console.error("Error resending OTP:", error);
    res.status(500).json({ message: "Failed to resend OTP.", error });
  }
}); 

//reapply for card
//
app.post('/predict-wait-time', async (req, res) => {
    const { ATMID, DayOfWeek, TimeOfDay } = req.body;

    // Check for missing parameters
    if (!ATMID || !DayOfWeek || !TimeOfDay) {
        return res.status(400).json({ error: "ATMID, DayOfWeek, and TimeOfDay are required" });
    }

    try {
        // Make a request to the Python API
        const response = await axios.post('http://localhost:5000/predict-wait-time', {
            ATMID,
            DayOfWeek,
            TimeOfDay
        });

        // Forward the Python API response to the client
        return res.status(200).json(response.data);

    } catch (error) {
        console.error("Error calling Python API:", error);

        // Handle specific error responses from the Python API
        if (error.response) {
            const { status, data } = error.response;
            return res.status(status).json(data);
        }

        // Handle internal server errors
        return res.status(500).json({ error: "Internal server error" });
    }
});

// AI MODEL
async function getATMData(atmId) {
    try {
        await sql.connect(dbConfig);
        const result = await sql.query`SELECT * FROM ATM_ML WHERE id = ${atmId}`;
        return result.recordset[0]; // Return first result
    } catch (err) {
        throw new Error("Database query failed: " + err.message);
    }
}

async function callMLModel(atmData) {
    try {
        // Convert last_refilled_date to days_since_last_refill
        const daysSinceLastRefill = Math.floor((Date.now() - new Date(atmData.last_refilled_date)) / (1000 * 60 * 60 * 24));

        const response = await axios.post('http://127.0.0.1:5000/predict', {
            amount_of_cash_left: atmData.amount_of_cash_left,
            max_cash_capacity: atmData.max_cash_capacity,
            
            avg_daily_withdrawal: atmData.avg_daily_withdrawal,
            transaction_count: atmData.transaction_count,
            last_week_withdrawal: atmData.last_week_withdrawal,
            emergency_refill_count: atmData.emergency_refill_count,
            days_since_last_refill: daysSinceLastRefill,
            
            
            
        }, { timeout: 10000 }); // ✅ Added timeout to prevent delays

        return response.data;
    } catch (err) {
        throw new Error("ML Model API call failed: " + err.message);
    }
}

// Function to fetch a specific ATM's data from the database
async function getATMData(atmId) {
    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();
        request.input('id', sql.Int, atmId);  // ✅ Secured query parameter
        const result = await request.query('SELECT * FROM ATM_ML WHERE id = @id');

        return result.recordset.length ? result.recordset[0] : null;
    } catch (err) {
        throw new Error("Database query failed: " + err.message);
    }
}

// API Route: Get ATM prediction by ID
app.get('/predict/:id', async (req, res) => {
    try {
        const atmId = req.params.id;
        const atmData = await getATMData(atmId);

        if (!atmData) {
            return res.status(404).json({ error: "ATM not found" });
        }

        const mlResponse = await callMLModel(atmData);
        res.json(mlResponse);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Function to fetch all ATMs from the database
async function getAllATMs() {
    try {
        await sql.connect(dbConfig);
        const result = await sql.query('SELECT * FROM ATM_ML');
        return result.recordset;
    } catch (err) {
        throw new Error("Database query failed: " + err.message);
    }
}

// API Route: Get all ATMs
app.get('/atmss', async (req, res) => {  // ✅ Kept "atmss" as per your original code
    try {
        const atms = await getAllATMs();
        res.json({ total: atms.length, atms });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API Route: Get a specific ATM by ID (SQL Injection Fixed)
app.get('/atms/:id', async (req, res) => {  // ✅ Kept "atmss" as per your original code
    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();
        request.input('id', sql.Int, req.params.id);
        const result = await request.query('SELECT * FROM ATM_ML WHERE id = @id');

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: "ATM not found" });
        }

        res.json(result.recordset[0]);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Serve HTML pages correctly
app.get('/atm2', (req, res) => res.sendFile(path.join(__dirname, 'public/html/Atm.html')));
app.get('/atm-predict', (req, res) => res.sendFile(path.join(__dirname, 'public/html/AtmPredict.html')));

app.get('/Personalized-Budgetting', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/Personalized.html'));
});

app.post('/analyze-budget', async (req, res) => {
    const { userData, userGoals } = req.body;
    if (!userData || userData.length === 0) {
        return res.status(400).json({ error: 'No user data provided.' });
    }

    const goal = userGoals || 'No specific goals provided';

    const prompt = `
        User Transaction Data:
        ${userData.map(item => `${item.TransactionType}: ${item.TransactionAmount} on ${item.TransactionDate} in ${item.Category}`).join('\n')}

        Task:
        - Create a monthly budget for the user based on their spending data.
        - Identify areas where spending exceeds reasonable limits and provide suggestions for cutting down.
        - Highlight key opportunities for saving and increasing income.
        - Recommend actionable steps to help the user achieve their financial goals.

        User Goals:
        ${goal}

        Present the analysis in the following format:
        
        1. **Real-Time Budget and Suggestions**:
            - **Issues**: List specific spending issues, including areas where the user exceeds a reasonable budget.
            - **Recommendations**: Provide concise suggestions for cutting down spending or increasing savings.
            - **Recommended Budget**: List the suggested spending limits for each category (e.g., 'Dining: $200') without any additional text or explanations in brackets pls.
            Conclusion and overview regarding the budget analysis.

        2. **Goal Alignment and Progress**:
            - **Current Status**: Summarize how the user's current spending aligns with their goals.
            - **Progress**: Provide an update on how close the user is to achieving their goals.
            - **Goals to Reach**: Offer specific amount to reach (e.g., $5000) and why that amount is good for the user.
            - **Strategy**: Suggest a strategy to help the user reach their goals faster.
            
        Ensure each section is formatted with bullet points and is concise, focusing on clarity and directness without unnecessary details.
    `;

    try {
        const result = await model.generateContent(prompt);
        const analysis = result.response.text();

        const recommendedBudgetMatch = analysis.match(/\*\*Recommended Budget\*\*:([\s\S]*?)(?=\n\s*Conclusion|$)/i);
        const realTimeBudgetMatch = analysis.match(/\*\*1\. Real-Time Budget and Suggestions\*\*([\s\S]*?)(?=\*\*2\. Goal Alignment and Progress\*\*)/i);
        const goalAlignmentMatch = analysis.match(/\*\*2\. Goal Alignment and Progress\*\*([\s\S]*)/i);

        const escapeHtml = (text) => {
            let escapedText = text
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/\n/g, '<br>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/    \* (.*?)<br>/g, '<li>$1</li>')
                .replace(/    \* /g, '<li>')
                .replace(/<li>(.*?)<\/li>/g, '<ul><li>$1</li></ul>')
                .replace(/<\/ul><ul>/g, '');
        
            return escapedText;
        };

        const parseRecommendedBudget = (budgetText) => {
            const budgetLines = budgetText.trim().split('\n');
            const budgetJson = budgetLines.reduce((acc, line) => {
                const match = line.match(/(.+):\s*\$?(\d+)/);
                if (match) {
                    const [_, category, amount] = match;
                    acc[category.trim()] = parseFloat(amount.trim());
                }
                return acc;
            }, {});
            return budgetJson;
        };

        const recommendedBudget = recommendedBudgetMatch
            ? parseRecommendedBudget(recommendedBudgetMatch[1])
            : null;

        
        const filteredBudget = recommendedBudget
        ? Object.fromEntries(
                Object.entries(recommendedBudget).filter(
                    ([key]) => key.startsWith('* ') && !key.startsWith('* **')
                )
            )
        : {};

        const pieChartScript = `
            <canvas id="budgetPieChart" width="400" height="400"></canvas>
            <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
            <script>
                const ctx = document.getElementById('budgetPieChart').getContext('2d');
                const chart = new Chart(ctx, {
                    type: 'pie',
                    data: {
                        labels: ${JSON.stringify(Object.keys(filteredBudget).map(key => key.replace('* ', '')))},
                        datasets: [{
                            data: ${JSON.stringify(Object.values(filteredBudget))},
                            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'],
                            hoverBackgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40']
                        }]
                    },
                    options: {
                        plugins: {
                            legend: {
                                labels: {
                                    color: "white",
                                },
                            },
                        }
                    }
                });
            </script>
        `;
    
    
        const realTimeBudget = realTimeBudgetMatch
            ? `<div class="container"><h2>Real-Time Budget and Suggestions</h2><p>${escapeHtml(realTimeBudgetMatch[1].trim())}<h2 class="visual-title">Budget Visualization & Distribution</h2></p>${pieChartScript}</div>`
            : '<div class="container"><h2>Real-Time Budget and Suggestions</h2><p>No data available for Real-Time Budget and Suggestions.</p></div>';

        const goalAlignment = goalAlignmentMatch
            ? `<div class="container"><h2>Goal Alignment and Progress</h2><p>${escapeHtml(goalAlignmentMatch[1].trim())}</p></div>`
            : '<div class="container"><h2>Goal Alignment and Progress</h2><p>No data available for Goal Alignment and Progress.</p></div>';

        res.json({
            budgetAnalysis: `
                <h1>Budget and Goal Analysis</h1>
                ${realTimeBudget}
                ${goalAlignment}
            `,
            recommendedBudget, // Include JSON format for recommended budget
        });
    } catch (error) {
        console.error("Error generating budget analysis:", error);
        res.status(500).json({ error: "Error generating budget analysis" });
    }
});



const accountSid = process.env.Twilio_SID; // Replace with your Twilio Account SID
const authToken = process.env.Twilio_Token;  // Replace with your Twilio Auth Token
const twilioPhoneNumber = '+12194911103'; // Replace with your Twilio phone number
const client = twilio(accountSid, authToken);

app.post('/send-sms', (req, res) => {
    const { phoneNumber, budgetAnalysis } = req.body;

    if (!phoneNumber || !budgetAnalysis) {
        return res.status(400).json({ success: false, message: 'Phone number or budget analysis is missing.' });
    }

    client.messages
        .create({
            body: budgetAnalysis,
            from: twilioPhoneNumber,
            to: phoneNumber
        })
        .then(message => {
            console.log('SMS sent:', message.sid);
            res.json({ success: true });
        })
        .catch(error => {
            console.error('Error sending SMS:', error);
            res.status(500).json({ success: false, message: 'Failed to send SMS.' });
        });
});

app.get("/Components", (req, res) => {
    res.sendFile(path.join(__dirname, "public/html", "components.html"));
});

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

app.post('/send-activity-log', (req, res) => {
    const { message, atmId, activityType } = req.body;

    // Predefined ATM locations
    const atmLocations = {
        '1': '28 Dover Cres, Singapore 130028',
        '2': '325 Clementi Ave 5, Block 325, Singapore 120325',
        '3': '170 Stirling Rd, #01-1147 FairPrice, Singapore 140170'
    };

    // Get the location based on atmId
    const location = atmLocations[atmId] || 'Location not available';

    // Define color mappings based on activity type
    const activityColors = {
        'suspicious': 0xFF9900, // Yellow
        'maintenance': 0xFF9900, // Yellow
        'resolved': 0x4CAF50,    // Green
        'rejected': 0xF44336     // Red
    };

    const activityIcons = {
        'resolved': '✅',    // Check mark for resolved
        'rejected': '❌'      // Cross mark for rejection
    };

    const specificMessage = {
        'suspicious': 'Suspicious activity detected: User attempted a transfer to a suspicious account.',
        'maintenance': 'ATM is down and requires immediate maintenance.',
        'resolved': 'Issue resolved.',
        'rejected': 'Maintenance still not resolved, will require more time.'
    };

    // Use the color based on the activity type
    const color = activityColors[activityType] || 0x000000; // Default to black if no color is found

    // Use the specific message based on activity type or fallback to the provided message
    const logMessage = specificMessage[activityType] || message;

    // Split the message into main activity message and details if it's maintenance
    const [activityMainMessage, maintenanceDetails] = message.split(':');

    // If the activity is maintenance, use the activityMainMessage for the title
    const messageWithIcon = activityType === 'maintenance' 
        ? `${activityIcons[activityType] || ' '} ${activityMainMessage.trim()}` 
        : `${activityIcons[activityType] || ' '} ${message}`;

    // Prepare the Discord embed
    const discordEmbed = {
        title: messageWithIcon, // Title of the embed with icon and message
        color: color, // Use the color from the activityType mapping
        fields: [
            {
                name: 'Log Message:',
                value: logMessage, // The actual log message in the field
                inline: false
            },
            {
                name: 'Details:', 
                value: maintenanceDetails ? maintenanceDetails.trim() : 'No additional details available.', // Display the maintenance details if available
                inline: false
            },
            {
                name: 'Location:',
                value: location, // Use the location based on atmId
                inline: false
            }
        ],
        timestamp: new Date(), // Timestamp to show when the log was created
        footer: {
            text: 'ATM Activity Log'
        }
    };

    const payload = {
        embeds: [discordEmbed] // Send the embed inside an array
    };

    axios.post(DISCORD_WEBHOOK_URL, payload)
        .then(response => {
            console.log('Activity log sent to Discord:', response.data);
            res.status(200).send('Activity log sent');
        })
        .catch(error => {
            console.error('Error sending activity log to Discord:', error);
            res.status(500).send('Error sending activity log');
        });
});

const atmFilepath = path.join(__dirname, 'python/Time/synthetic_atm_data.csv');

app.get('/get-atm-data', (req, res) => {
    const atmData = [];

    // Read CSV data
    fs.createReadStream(atmFilepath)
        .pipe(csv())
        .on('data', (row) => {
            atmData.push(row);
        })
        .on('end', () => {
            res.json(atmData);
        });
});

//Dual Authentication for Joint Account Withdrawal
//Connecting to Twilio
const accsid = "AC33baff172c1798cdc33e072ee2bae343"
const twilAuthToken = "ba37e4f3aa1d543ae548a409671f1894"
const twilNo = "+12762763343"
const twil = twilio(accsid, twilAuthToken);

// Generate OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Endpoint to Request OTPs
app.post("/request-otp", async (req, res) => {
 const { account_number } = req.body;
 if (!account_number) return res.status(400).json({ error: "Account number required" });

 try {
   await sql.connect(dbConfig);
   const result = await sql.query`SELECT phone1, phone2 FROM JointAcc WHERE account_number = ${account_number}`;

   if (result.recordset.length === 0) {
     return res.status(404).json({ error: "Account not found" });
   }

   const { phone1, phone2 } = result.recordset[0];
   const otp1 = generateOTP();
   const otp2 = generateOTP();
   const expires_at = new Date((Date.now() + 5 * 60000)); // Expires in 5 minutes

   await sql.query`INSERT INTO OTPs (account_number, otp1, otp2, expires_at)
                   VALUES (${account_number}, ${otp1}, ${otp2}, ${expires_at})`;

   await twil.messages.create({
     title: "Verification OTP",
     body: `Your ATM withdrawal OTP is: ${otp1}`,
     from: twilNo,
     to: phone1,
   });

   await twil.messages.create({
     title: "Verification OTP",
     body: `Your ATM withdrawal OTP is: ${otp2}`,
     from: twilNo,
     to: phone2,
   });

   res.json({ message: "OTP sent to both users" });
 } catch (error) {
   console.error(error);
   res.status(500).json({ error: "Server error" });
 }
});

// Endpoint to Verify OTPs
app.post("/verify-otp", async (req, res) => {
 const { account_number, otp1, otp2 } = req.body;

 if (!account_number || !otp1 || !otp2) return res.status(400).json({ error: "All fields required" });

 try {
   await sql.connect(dbConfig);
   const result = await sql.query`SELECT * FROM OTPs WHERE account_number = ${account_number}`;

   if (result.recordset.length === 0) {
     return res.status(400).json({ error: "Invalid or expired OTPs" });
   }

   const storedOTP1 = result.recordset[0].otp1;
   const storedOTP2 = result.recordset[0].otp2;

   if (storedOTP1 === otp1 && storedOTP2 === otp2) {
     await sql.query`DELETE FROM OTPs WHERE account_number = ${account_number}`;
     res.json({ message: "Withdrawal Approved" });
   } else {
     res.status(401).json({ error: "Incorrect OTPs" });
   }
 } catch (error) {
   console.error(error);
   res.status(500).json({ error: "Server error" });
 }
});

const readline = require('readline');
const PricingBase = require('twilio/lib/rest/PricingBase.js');

const currency_API_KEY = 'adb301bb5f5f2bcedd8b718a'; 
const currency_BASE_URL = 'https://v6.exchangerate-api.com/v6';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

app.get('/exchange', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/exchange.html'))
})

// API Route to fetch exchange rates
app.get('/convert', async (req, res) => {
    const { from, to, amount } = req.query;

    if (!from || !to || isNaN(amount) || amount <= 0) {
        return res.status(400).json({ error: 'Invalid input' });
    }

    try {
        const response = await axios.get(`${currency_BASE_URL}/${currency_API_KEY}/latest/${from.toUpperCase()}`);
        const rates = response.data.conversion_rates;

        if (!rates[to.toUpperCase()]) {
            return res.status(400).json({ error: 'Currency not supported' });
        }

        const convertedAmount = amount * rates[to.toUpperCase()];
        res.json({ rate: rates[to.toUpperCase()], convertedAmount });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching exchange rates' });
    }
});

// Start the server
app.listen(PORT,'0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});


