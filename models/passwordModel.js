const sql = require("mssql");
const dbConfig = require("../dbconfig");

async function passwordLogin(UserName, Password) {
    try {
        await sql.connect(dbConfig);
        console.log("hello");
        // Using a parameterized query to avoid SQL injection vulnerabilities.
        let result = await new sql.Request()
            .input('UserName', sql.VarChar, UserName)
            .input('Password', sql.VarChar, Password)
            .query('SELECT * FROM Users WHERE UserName = @UserName AND PasswordHash = @Password');

        if (result.recordset.length === 0) {
            throw new Error('User not found or incorrect credentials');
        }

        return result.recordset[0];
    } catch (err) {
        console.error("Database error (passwordLogin):", err);
        throw err;
    }
}

module.exports = {
    passwordLogin
}
