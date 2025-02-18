const { findUserByNric, updateUserTokenAndPassword, checkNric,loginUser, deductBalanceFromModel,
     storeWebTokenInDatabase, getWebTokenFromDatabase,removeWebTokenFromDatabase, findUserByNameOrPhoneNumber,getPinCode,updateLock,updateUnlock } = require("../models/userModel");

async function registerUser(req, res) {
    const { nric, token, PasswordHash } = req.body;

    try {
        // Check if the NRIC exists in the database
        const user = await findUserByNric(nric);
        if (!user) {
            return res.status(404).json({ message: "NRIC not found" });
        }

        // Update the user's FCM token
        await updateUserTokenAndPassword(nric, token, PasswordHash);
        return res.status(200).json({ message: "User token updated successfully" });
    } catch (error) {
        console.error("Error during registration:", error);
        return res.status(500).json({ message: "Server error during registration" });
    }
}

async function nricCheck(req, res) {
    const { nric } = req.body;

    if (!nric) {
        return res.status(400).json({ error: "NRIC is required" });
    }

    try {
        const user = await findUserByNric(nric);
        if (user) {
            return res.status(200).json({ token: user.token }); // Return the token if found
        } else {
            return res.status(404).json({ error: "NRIC not found or no linked token" });
        }
    } catch (error) {
        console.error('Error checking NRIC:', error);
        return res.status(500).json({ error: "An error occurred while checking NRIC" });
    }
}

// async function getId(req, res) {
//     const { nric } = req.body;

//     if (!nric) {
//         return res.status(400).json({ error: "NRIC is required" });
//     }

//     try {
//         const user = await findUserByNric(nric);
//         if (user) {
//             return res.status(200).json({ UserID: user.UserID }); // Return the token if found
//         } else {
//             return res.status(404).json({ error: "No id found" });
//         }
//     } catch (error) {
//         console.error('Error checking NRIC:', error);
//         return res.status(500).json({ error: "An error occurred while checking NRIC" });
//     }
// }

async function getId(req, res) {
    const nric = req.query.nric;

    if (!nric) {
        return res.status(400).json({ error: "NRIC is required" });
    }

    try {
        const user = await findUserByNric(nric);

        if (user) {
            return res.status(200).json({ UserID: user.UserID });
        } else {
            return res.status(404).json({ error: "No ID found" });
        }
    } catch (error) {
        console.error('Error checking NRIC:', error);
        return res.status(500).json({ error: "An error occurred while checking NRIC" });
    }
}

// Mobile phone login
async function login(req, res) {
    const { nric, PasswordHash } = req.body;
    try {
        const user = await loginUser(nric, PasswordHash);
        if (user) {
            res.status(200).json({ message: "Login successful", user });
        } else {
            res.status(401).json({ message: "Invalid credentials" });
        }
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
}

async function handleDeductBalance (req, res) {
    const { UserID, amount } = req.body;

    try {
        const success = await deductBalanceFromModel(UserID, amount);

        if (success) {
            res.status(200).json({ message: "Balance deducted successfully" });
        } else {
            res.status(400).json({ message: "Error updating balance" });
        }
    } catch (error) {
        if (error.message === "Insufficient balance") {
            res.status(400).json({ message: "Insufficient balance" });
        } else {
            res.status(500).json({ message: "Database error" });
        }
    }
};

// async function storeWebToken(req, res) {
//     const { nric, webToken } = req.body;

//     if (!nric || !webToken) {
//         return res.status(400).json({ error: "NRIC and web token are required." });
//     }

//     try {
//         // Store the web token in the database
//         await storeWebTokenInDatabase(nric, webToken);
//         res.status(200).json({ message: "Web token stored successfully." });
//     } catch (error) {
//         console.error("Error storing web token:", error);
//         res.status(500).json({ error: "Failed to store web token." });
//     }
// }

// async function getWebToken(req, res) {
//     const { nric } = req.body; // NRIC passed as query parameter

//     if (!nric) {
//         return res.status(400).json({ error: "NRIC is required." });
//     }

//     try {
//         const webToken = await getWebTokenFromDatabase(nric);
//         if (webToken) {
//             res.status(200).json({ web_token: webToken });
//         } else {
//             res.status(404).json({ web_token: null });
//         }
//     } catch (error) {
//         console.error("Error checking web token:", error);
//         res.status(500).json({ error: "Failed to check web token." });
//     }
// }

// async function removeWebToken(req, res) {
//     const { nric } = req.body;
//     if (!nric) {
//         return res.status(400).json({ error: 'NRIC is required.' });
//     }
//     try {
//         const rowsAffected = await removeWebTokenFromDatabase(nric);

//         if (rowsAffected === 0) {
//             return res.status(404).json({ error: 'User not found or web token was not set.' });
//         }

//         res.status(200).json({ message: 'Web token removed successfully.' });
//     } catch (error) {
//         console.error('Error removing web token:', error);
//         res.status(500).json({ error: 'An error occurred while removing the web token.' });
//     }
// }

async function findUserByNameOrPhone(req, res) {
    const { UserName, phoneNumber } = req.body;

    if (!UserName && !phoneNumber) {
        return res.status(400).json({ error: "Either name or phone number is required." });
    }

    try {
        const user = await findUserByNameOrPhoneNumber(UserName, phoneNumber);
        if (user) {
            const { name, phoneNumber, UserID } = user;
            return res.status(200).json({ message: "User found", user: { UserName, phoneNumber, UserID } });
        } else {
            return res.status(404).json({ message: "User not found" });
        }
    } catch (error) {
        console.error("Error finding user by name or phone number:", error);
        return res.status(500).json({ error: "Server error while finding user" });
    }
}

async function pincodeSuccess(req, res) {
    const { pincode } = req.body;

    if (!pincode) {
        return res.status(400).json({ error: "NRIC and pincode are required." });
    }

    try {
        const user = await getPinCode(pincode);
        if (user) {
            res.status(200).json({ message: "Pincode successful", user });
        } else {
            res.status(401).json({ message: "Invalid pincode" });
        }
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
}

async function ATMCardLock(req, res) {
    const { pincode } = req.body;

    if (!pincode) {
        return res.status(400).json({ error: "pincode is required" });
    }

    try {
        const affectedRows = await updateLock(pincode);

        return res.status(200).json({ message: "ATM Card locked" });

    } catch (error) {
        console.error('Error checking pincode:', error);
        return res.status(500).json({ error: "An error occurred while checking pincode" });
    }
}

async function ATMCardUnlock(req, res) {
    const { pincode } = req.body;

    if (!pincode) {
        return res.status(400).json({ error: "pincode is required" });
    }

    try {
        const affectedRows = await updateUnlock(pincode);

        return res.status(200).json({ message: "ATM Card unlocked" });

    } catch (error) {
        console.error('Error checking pincode:', error);
        return res.status(500).json({ error: "An error occurred while checking pincode" });
    }
}

module.exports = { registerUser , nricCheck, login, handleDeductBalance, getId, findUserByNameOrPhone,pincodeSuccess,ATMCardLock,ATMCardUnlock };