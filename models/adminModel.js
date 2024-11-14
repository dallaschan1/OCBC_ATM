const sql = require("mssql");
const dbConfig = require("../dbconfig");

async function loginAdmin(UserName, PasswordHash) {
    try {
        let pool = await sql.connect(dbConfig);
        let result = await pool.request()
            .input("UserName", sql.VarChar, UserName)
            .input("PasswordHash", sql.VarChar, PasswordHash)
            .query("SELECT * FROM Admin WHERE UserName = @UserName AND PasswordHash = @PasswordHash");

        return result.recordset[0]; // Return the user data if credentials are correct
    } catch (err) {
        console.error("Database error (loginUser):", err);
        throw err;
    }
}

module.exports = { loginAdmin};
