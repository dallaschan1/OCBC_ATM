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


// Start the server
app.listen(PORT,'0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

