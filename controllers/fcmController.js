// const admin = require('firebase-admin');

// const serviceAccount = require('../atm-app-66706-firebase-adminsdk-fz91r-3355db617f.json');
// if (!admin.apps.length) {
//     admin.initializeApp({
//         credential: admin.credential.cert(serviceAccount)
//     });
// }

// exports.sendFcmMessage = async (req, res) => {
//     const { token, location } = req.body;

//     if (!token) {
//         return res.status(400).json({ error: "Token not provided" });
//     }

//     const locationMessage = `Location: ${location.lat}, ${location.lng}`;

//     const message = {
//         data: {
//             triggerBiometrics: 'true'  // Payload to trigger biometrics
//         },
//         notification: {
//             title: 'Login Request',
//             body: locationMessage
//         },
//         token: token
//     };

//     try {
//         const response = await admin.messaging().send(message);
//         return res.status(200).json({ success: true, response });
//     } catch (error) {
//         console.error('Error sending message:', error);
//         return res.status(500).json({ success: false, error: error.message });
//     }
// };
