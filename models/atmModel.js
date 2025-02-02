const sql = require("mssql");
const dbConfig = require("../dbconfig");

async function getAllATM() {
    try {
        let pool = await sql.connect(dbConfig);
        let result = await pool.request()
            .query("SELECT ATMID, Status, UserSuspicion, MaintenanceRequired FROM ATM");

        return result.recordset; 
    } catch (err) {
        console.error("Database error (getAllATMs):", err);
        throw err;
    }
}

async function getspecificATM(ATMID) {
    try {
        let pool = await sql.connect(dbConfig);
        let result = await pool.request()
            .input("ATMID", sql.Int, ATMID)
            .query("SELECT * FROM ATM WHERE ATMID = @ATMID");

        return result.recordset[0];
    } catch (err) {
        console.error("Database error (getspecificATM):", err);
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

async function updateATMMaintenance(ATMID, MaintenanceRequired) {
    try {
        let pool = await sql.connect(dbConfig);
        const request = pool.request()
            .input("ATMID", sql.Int, ATMID);

        if (MaintenanceRequired === null) {
            request.input("MaintenanceRequired", sql.Int, null);
        } else {
            request.input("MaintenanceRequired", sql.Int, MaintenanceRequired);
        }

        await request.query("UPDATE ATM SET MaintenanceRequired = @MaintenanceRequired WHERE ATMID = @ATMID");
    } catch (err) {
        console.error("Error updating ATM MaintenanceRequired:", err);
    }
}

async function insertToMaintenance(atm_id, maintenance_type, start_date){
    try{
        let pool = await sql.connect(dbConfig);
        await pool.request()
            .input("atm_id", sql.Int, atm_id)
            .input("maintenance_type", sql.VarChar, maintenance_type)
            .input("start_date", sql.DateTime, start_date)
            .query("INSERT INTO atm_maintenance (atm_id, maintenance_type, start_date) VALUES (@atm_id, @maintenance_type, @start_date)");
    } catch (err) {
        console.error("Error inserting maintenance:", err);
    }
}

async function getMaintenance(atm_id){
    try{
        let pool = await sql.connect(dbConfig);
        let result = await pool.request()
            .input("atm_id", sql.Int, atm_id)
            .query("SELECT * FROM atm_maintenance WHERE atm_id = @atm_id");

        return result.recordset;
    } catch (err) {
        console.error("Error inserting maintenance:", err);
    }
}

async function deleteMaintenance(atm_id){
    try{
        let pool = await sql.connect(dbConfig);
        await pool.request()
            .input("atm_id", sql.Int, atm_id)
            .query("DELETE FROM atm_maintenance WHERE atm_id = @atm_id");
    } catch (err) {
        console.error("Error inserting maintenance:", err);
    }
}

async function addingToLog(atm_id, maintenance_type, start_date, end_date){
    try{
        let pool = await sql.connect(dbConfig);
        await pool.request()
            .input("atm_id", sql.Int, atm_id)
            .input("maintenance_type", sql.VarChar, maintenance_type)
            .input("start_date", sql.DateTime, start_date)
            .input("end_date", sql.DateTime, end_date)
            .query("INSERT INTO ATM_log (atm_id, maintenance_type, start_date, end_date) VALUES (@atm_id, @maintenance_type, @start_date, @end_date)");
    } catch (err) {
        console.error("Error inserting maintenance:", err);
    }
}

async function gettingAllLog(atm_id) {
    try {
        let pool = await sql.connect(dbConfig);
        let result = await pool.request()
            .input("atm_id", sql.VarChar, atm_id) // Use input parameter
            .query("SELECT * FROM ATM_log WHERE atm_id = @atm_id"); // Filter by atmId

        return result.recordset;
    } catch (err) {
        console.error("Error fetching maintenance logs:", err);
        return [];
    }
}

async function getComponentsHealth(atm_id){
    try{
        let pool = await sql.connect(dbConfig);
        let result = await pool.request()
            .input("atm_id", sql.Int, atm_id)
            .query("SELECT * FROM ATM_Components_Health WHERE atm_id = @atm_id");

        return result.recordset;
    } catch (err) {
        console.error("Error fetching components health:", err);
    }
}

module.exports = { getAllATM, updateATMStatus, updateATMSuspicion,getATMSuspicion, getATMBalance,withdrawFromATM,updateATMMaintenance, getspecificATM
    ,insertToMaintenance, getMaintenance,deleteMaintenance,addingToLog,gettingAllLog,getComponentsHealth
 };
