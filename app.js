const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require("dotenv");
dotenv.config();
const path = require('path')
const nodemailer = require('nodemailer');
const express = require('express');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const Web3 = require('web3').default;
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
            res.redirect('/public/html/HomePage.html')
        } else {
            res.send({ success: false, message: 'Face not recognized.' });
            res.redirect('/public/html/login-page.html')
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
        res.redirect('/public/html/HomePage.html')
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

//
app.use(bodyParser.json());
app.use(cors());

let members = [];

// Nodemailer Transporter Setup
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: 'nandithabvs06@gmail.com', // Use environment variables for security
    pass:  'abhl zvij brqf ohve', // App-specific password or OAuth2 token
  },
});

// Add a Member Endpoint
app.post('/add-member', (req, res) => {
  const { name, email, contact, account_number } = req.body;

  if (!name || !email || !contact || !account_number) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  const newMember = {
    id: Date.now(),
    name,
    email,
    contact,
    account_number,
    status: 'Waiting for Approval',
  };

  members.push(newMember);

  const approvalLink = `http://localhost:${PORT}/approve-member/${newMember.id}`;
  const declineLink = `http://localhost:${PORT}/decline-member/${newMember.id}`;
  const reportLink = `http://localhost:${PORT}/report-member/${newMember.id}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
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

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
      return res.status(500).json({ message: 'Failed to send email.', error });
    }
    res.status(201).json({ message: 'Member added and email sent.' });
  });
});

// Approve Member Endpoint
app.get('/approve-member/:id', (req, res) => {
  const { id } = req.params;
  const member = members.find((m) => m.id == id);

  if (member) {
    member.status = 'Accepted';
    return res.send('<p>Thank you! Your membership has been approved.</p>');
  }
  res.status(404).send('Member not found.');
});

// Decline Member Endpoint
app.get('/decline-member/:id', (req, res) => {
  const { id } = req.params;
  members = members.filter((m) => m.id != id);
  res.send('<p>You have declined the invitation.</p>');
});

// Report Member Endpoint
app.get('/report-member/:id', (req, res) => {
  const { id } = req.params;
  members = members.filter((m) => m.id != id);
  res.send('<p>You have declined and reported the invitation.</p>');
});

// Get All Members Endpoint
app.get('/members', (req, res) => {
  res.json(members);
});

// Delete Member Endpoint
app.delete('/delete-member/:id', (req, res) => {
  const { id } = req.params;
  const memberIndex = members.findIndex((m) => m.id == id);

  if (memberIndex !== -1) {
    const removedMember = members.splice(memberIndex, 1)[0];
    return res.status(200).json({ message: `Member ${removedMember.name} deleted successfully.` });
  }
  res.status(404).json({ message: 'Member not found.' });
});


// Start the server
app.listen(PORT,'0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});


