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


module.exports = { findUserByNric, updateUserTokenAndPassword, checkNric, loginUser };
