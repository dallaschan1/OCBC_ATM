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

async function deductBalanceFromModel(id, amount) {
    let transaction;
    try {
        // Connect to the database
        let pool = await sql.connect(dbConfig);
        
        // Start a transaction
        transaction = new sql.Transaction(pool);
        await transaction.begin();

        // Check current balance
        const currentBalanceResult = await transaction.request()
            .input("id", sql.Int, id)
            .query("SELECT balance FROM Users WHERE id = @id");
        
        const currentBalance = currentBalanceResult.recordset[0]?.balance;

        // Ensure currentBalance is retrieved
        if (currentBalance === undefined) {
            throw new Error("User not found");
        }

        // Check if sufficient balance exists
        if (currentBalance >= amount) {
            // Deduct the balance
            await transaction.request()
                .input("id", sql.Int, id)
                .input("amount", sql.Decimal(10, 2), amount)
                .query("UPDATE Users SET balance = balance - @amount WHERE id = @id");
            
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


module.exports = { findUserByNric, updateUserTokenAndPassword, checkNric, loginUser, deductBalanceFromModel };
