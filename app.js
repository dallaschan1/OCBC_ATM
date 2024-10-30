const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const QRCode = require('qrcode');
const cors = require('cors');
const { sendFcmMessage } = require('./controllers/fcmController')
const { registerUser, nricCheck, notifySuccess, login, handleDeductBalance, storeWebToken } = require('./controllers/userController');
const chatbot = require("./controllers/chatBotController.js");
const env = require('dotenv').config();
const API_KEY = process.env.GEMINI_API_KEY;
const app = express();
const PORT = 3001;



// Middleware setup
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));


app.get('/Home', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/html/HomePage.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/html/index.html'));
});

// app.get('/fingerprint', (req, res) => {
//   res.sendFile(path.join(__dirname, 'public/html/fingerprint.html'));
// });

// app.post('/send-message', sendFcmMessage);

// app.post('/register', registerUser);

// app.post('/check-nric', nricCheck);

// let authStatus = false;

// app.post('/notify-success', (req, res) => {
//     const { authStatus: status } = req.body;
//     if (status === "success") {
//         authStatus = true;
//         return res.status(200).json({ success: true });
//     }
//     return res.status(400).json({ error: "Authentication failed" });
// });

// app.get('/check-auth-status', (req, res) => {
//     res.status(200).json({ authenticated: authStatus });
// });

// app.post("/login", login);

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

// app.post('/deduct-balance', handleDeductBalance);

// Chatbot API
app.post("/chat", chatbot.startChatForUser);


// Start the server
app.listen(PORT,'0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

