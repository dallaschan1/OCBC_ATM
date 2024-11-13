const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require("dotenv");
dotenv.config();
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const web3 = require('web3');
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
const API_KEY = process.env.GEMINI_API_KEY;
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

const genAI = new GoogleGenerativeAI(API_KEY); // Replace with your actual API key
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Middleware setup
app.use(bodyParser.json({ limit: '50mb' }));
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

           
            const senderBalance = await web3.eth.getBalance(walletAddress);
            const serverBalance = await web3.eth.getBalance(serverWalletAddress);

            
            const receivedAmount = web3.utils.toBN(serverBalance).sub(web3.utils.toBN(serverBalanceBefore));

            if (!receivedAmount.eq(web3.utils.toBN(weiAmount))) {
                return res.status(400).json({ message: 'No matching ETH transaction found' });
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

       
        const tokenAmount = web3.utils.toBN(amount).mul(web3.utils.toBN(10).pow(web3.utils.toBN(decimals)));

        
        const serverTokenBalanceBefore = await tokenContract.methods.balanceOf(serverWalletAddress).call();
        const senderTokenBalanceBefore = await tokenContract.methods.balanceOf(walletAddress).call();

        

       
        const serverTokenBalanceAfter = await tokenContract.methods.balanceOf(serverWalletAddress).call();

        
        const receivedTokenAmount = web3.utils.toBN(serverTokenBalanceAfter).sub(web3.utils.toBN(serverTokenBalanceBefore));

        if (!receivedTokenAmount.eq(tokenAmount)) {
            return res.status(400).json({ message: 'No matching token transfer found' });
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


// Start the server
app.listen(PORT,'0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

