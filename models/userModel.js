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

async function updateUserToken(nric, token) {
    try {
        let pool = await sql.connect(dbConfig);
        await pool.request()
            .input("nric", sql.VarChar, nric)
            .input("token", sql.VarChar, token)
            .query("UPDATE Users SET token = @token WHERE nric = @nric");
    } catch (err) {
        console.error("Database error (updateUserToken):", err);
        throw err;
    }
}

module.exports = { findUserByNric, updateUserToken };
