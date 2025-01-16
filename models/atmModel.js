const sql = require("mssql");
const dbConfig = require("../dbconfig");

async function getAllATM() {
    try {
        let pool = await sql.connect(dbConfig);
        let result = await pool.request()
            .query("SELECT ATMID, Status, UserSuspicion FROM ATM");

        return result.recordset; 
    } catch (err) {
        console.error("Database error (getAllATMs):", err);
        throw err;
    }
}

async function updateATMStatus(ATMID, Status) {
    try {
        let pool = await sql.connect(dbConfig);
        await pool.request()
            .input("ATMID", sql.Int, ATMID)
            .input("Status", sql.VarChar, Status)
            .query("UPDATE ATM SET Status = @Status WHERE ATMID = @ATMID");
    } catch (err) {
        console.error("Error updating ATM status:", err);
    }
}

async function updateATMSuspicion(ATMID, UserSuspicion) {
    try {
        let pool = await sql.connect(dbConfig);
        const request = pool.request()
            .input("ATMID", sql.Int, ATMID);

        if (UserSuspicion === null) {
            request.input("UserSuspicion", sql.Int, null);
        } else {
            request.input("UserSuspicion", sql.Int, UserSuspicion);
        }

        await request.query("UPDATE ATM SET UserSuspicion = @UserSuspicion WHERE ATMID = @ATMID");
    } catch (err) {
        console.error("Error updating ATM UserSuspicion:", err);
    }
}

async function getATMSuspicion(ATMID) {
    try {
        let pool = await sql.connect(dbConfig);
        let result = await pool.request()
            .input("ATMID", sql.Int, ATMID)
            .query("SELECT UserSuspicion FROM ATM WHERE ATMID = @ATMID");

        return result.recordset[0].UserSuspicion;
    } catch (err) {
        console.error("Error fetching ATM UserSuspicion:", err);
    }
}

async function getATMBalance(ATMID) {
    try {
      let pool = await sql.connect(dbConfig);
      let result = await pool.request()
        .input("ATMID", sql.Int, ATMID) // Use ATMID from the request
        .query("SELECT Balance FROM ATM WHERE ATMID = @ATMID");
  
      if (result.recordset.length > 0) {
        return result.recordset[0].Balance; // Return the balance
      } else {
        return null; // Return null if ATM not found
      }
    } catch (err) {
      console.error("Error fetching ATM balance:", err);
      throw err;
    }
}

async function withdrawFromATM(ATMID, withdrawalAmount) {
    let pool;
    try {
        pool = await sql.connect(dbConfig);

        const result = await pool.request()
            .input('ATMID', sql.Int, ATMID)
            .query('SELECT Balance FROM ATM WHERE ATMID = @ATMID');

        const atm = result.recordset[0];

        if (!atm) {
            return { success: false, message: 'ATM not found' };
        }

        const currentBalance = atm.Balance;

        if (currentBalance < withdrawalAmount) {
            return { success: false, message: 'Insufficient funds in ATM' };
        }

        const newBalance = currentBalance - withdrawalAmount;

        await pool.request()
            .input('ATMID', sql.Int, ATMID)
            .input('newBalance', sql.Float, newBalance)
            .query('UPDATE ATM SET Balance = @newBalance WHERE ATMID = @ATMID');

        return { success: true, newBalance: newBalance };
    } catch (err) {
        console.error("Error during withdrawal process:", err);
        throw err;
    } finally {
        if (pool) {
            pool.close();
        }
    }
}

module.exports = { getAllATM, updateATMStatus, updateATMSuspicion,getATMSuspicion, getATMBalance,withdrawFromATM };
