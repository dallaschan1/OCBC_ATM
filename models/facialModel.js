const sql = require("mssql");
const dbConfig = require("../dbconfig");

async function loginUserByFace(Face_Data){
    try{
        let pool = await sql.connect(dbConfig);
        let result = await pool.request()
            .input("Face_Data", sql.VarBinary, Face_Data)
            .query("SELECT * FROM Users WHERE Face_Data = @Face_Data");
        return result.recordset[0];
    } catch (err) {
        console.error("Database error (loginUserByFace):", err);
        throw err;
    }
}

async function updateUserFace(nric, Face_Data){
    try {
        let pool = await sql.connect(dbConfig);
        await pool.request()
            .input("nric", sql.VarChar, nric)
            .input("Face_Data", sql.VarBinary, Face_Data)
            .query("UPDATE Users SET Face_Data = @Face_data WHERE nric = @nric")
    } catch (err){
        console.error("Database error (updateUserFace): ", err);
        throw err;
    }
}

module.exports = {loginUserByFace, updateUserFace};