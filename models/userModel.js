const sql = require("mssql");
const dbConfig = require("../dbconfig");

async function findUserByNric(nric) {
    try {
        let pool = await sql.connect(dbConfig);
        let result = await pool.request()
            .input("nric", sql.VarChar, nric)
            .query("SELECT * FROM Users WHERE nric = @nric");
        return result.recordset[0]; // Return the user if found
    } catch (err) {
        console.error("Database error (findUserByNric):", err);
        throw err;
    }
}

async function updateUserTokenAndPassword(nric, token, password) {
    try {
        let pool = await sql.connect(dbConfig);
        await pool.request()
            .input("nric", sql.VarChar, nric)
            .input("token", sql.VarChar, token)
            .input("password", sql.VarChar, password)
            .query("UPDATE Users SET token = @token, password = @password WHERE nric = @nric");
    } catch (err) {
        console.error("Database error (updateUserTokenAndPassword):", err);
        throw err;
    }
}

async function checkNric(nric) {
    try {
        let pool = await sql.connect(dbConfig);
        let result = await pool.request()
            .input("nric", sql.VarChar, nric)
            .query("SELECT token FROM Users WHERE nric = @nric");
        return result.recordset[0]; // Return the user if found
    } catch (err) {
        console.error("Database error (findUserByNric):", err);
        throw err;
    }
}

async function loginUser(nric, password) {
    try {
        let pool = await sql.connect(dbConfig);
        let result = await pool.request()
            .input("nric", sql.VarChar, nric)
            .input("password", sql.VarChar, password)
            .query("SELECT * FROM Users WHERE nric = @nric AND password = @password");

        return result.recordset[0]; // Return the user data if credentials are correct
    } catch (err) {
        console.error("Database error (loginUser):", err);
        throw err;
    }
}

async function deductBalanceFromModel(UserID, amount) {
    let transaction;
    try {
        // Connect to the database
        let pool = await sql.connect(dbConfig);
        
        // Start a transaction
        transaction = new sql.Transaction(pool);
        await transaction.begin();

        // Check current balance
        const currentBalanceResult = await transaction.request()
            .input("UserID", sql.Int, UserID)
            .query("SELECT balance FROM Users WHERE UserID = @UserID");
        
        const currentBalance = currentBalanceResult.recordset[0]?.balance;

        // Ensure currentBalance is retrieved
        if (currentBalance === undefined) {
            throw new Error("User not found");
        }

        // Check if sufficient balance exists
        if (currentBalance >= amount) {
            // Deduct the balance
            await transaction.request()
                .input("UserID", sql.Int, UserID)
                .input("amount", sql.Decimal(10, 2), amount)
                .query("UPDATE Users SET balance = balance - @amount WHERE UserID = @UserID");
            
            // Commit the transaction
            await transaction.commit();
            return true; // Balance deducted successfully
        } else {
            throw new Error("Insufficient balance"); // Handle insufficient balance
        }
    } catch (error) {
        if (transaction) {
            // Rollback the transaction if something went wrong
            await transaction.rollback();
        }
        console.error("Error deducting balance:", error);
        throw error; // Re-throw the error to be caught in the controller
    }
}

async function storeWebTokenInDatabase(nric, webToken) {
    try {
        let pool = await sql.connect(dbConfig);
        await pool.request()
            .input("nric", sql.VarChar, nric)
            .input("webToken", sql.VarChar, webToken)
            .query("UPDATE Users SET web_token = @webToken WHERE nric = @nric");
    } catch (err) {
        console.error("Database error (storeWebTokenInDatabase):", err);
        throw err;
    }
}

async function getWebTokenFromDatabase(nric) {
    try {
        let pool = await sql.connect(dbConfig);
        let result = await pool.request()
            .input("nric", sql.VarChar, nric)
            .query("SELECT web_token FROM Users WHERE nric = @nric");
        return result.recordset[0]?.web_token || null; // Return the web_token or null if not found
    } catch (err) {
        console.error("Database error (getWebTokenFromDatabase):", err);
        throw err;
    }
}

async function removeWebTokenFromDatabase(nric) {
    try {
        await sql.connect(dbConfig);

        const result = await sql.query`UPDATE Users SET web_token = NULL WHERE nric = ${nric}`;

        return result.rowsAffected[0];
    } catch (error) {
        throw new Error('Database error: ' + error.message);
    } finally {
        // Close the database connection
        await sql.close();
    }
}

module.exports = { findUserByNric, updateUserTokenAndPassword, checkNric, loginUser, deductBalanceFromModel, 
    storeWebTokenInDatabase,
    getWebTokenFromDatabase,
    removeWebTokenFromDatabase
 };
