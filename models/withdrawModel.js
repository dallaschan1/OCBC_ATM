const sql = require("mssql");
const dbConfig = require("../dbconfig");

async function withdraw(AccountNumber, WithdrawalAmount) {
    let transaction;

    try {
        await sql.connect(dbConfig);
        console.log(AccountNumber, WithdrawalAmount);
        transaction = new sql.Transaction();
        await transaction.begin();

        // Create a new request for balance check
        const balanceRequest = new sql.Request(transaction);

        // Check if balance is sufficient
        let balanceCheck = await balanceRequest
            .input('AccountNumber', sql.Int, AccountNumber)
            .query('SELECT balance FROM Users WHERE UserID = @AccountNumber');

        if (balanceCheck.recordset.length === 0) {
            throw new Error("Account not found");
        }

        let currentBalance = balanceCheck.recordset[0].balance;
        if (currentBalance < WithdrawalAmount) {
            throw new Error("Insufficient balance");
        }

        // Create a new request for updating balance
        const updateRequest = new sql.Request(transaction);
        await updateRequest
            .input('WithdrawAmount', sql.Decimal(10, 2), WithdrawalAmount)
            .input('AccountNumber', sql.Int, AccountNumber)
            .query('UPDATE Users SET balance = balance - @WithdrawAmount WHERE UserID = @AccountNumber');

        // Create a new request for inserting into Withdraws table
        const withdrawRequest = new sql.Request(transaction);
        await withdrawRequest
            .input('UserID', sql.Int, AccountNumber)
            .input('WithdrawAmount', sql.Decimal(10, 2), WithdrawalAmount)
            .query('INSERT INTO Withdraws (UserID, WithdrawAmount) VALUES (@UserID, @WithdrawAmount)');

        // Commit the transaction
        await transaction.commit();

        // Create a new request for fetching updated balance
        const balanceUpdateRequest = new sql.Request();
        let updatedBalance = await balanceUpdateRequest
            .input('AccountNumber', sql.Int, AccountNumber)
            .query('SELECT balance FROM Users WHERE UserID = @AccountNumber');

        return updatedBalance.recordset[0];

    } catch (err) {
        console.error("Database error (withdraw):", err);
        if (transaction) await transaction.rollback();
        throw err;
    }
}


async function dailyWithdrawal(accountNumber) {
    try {
      await sql.connect(dbConfig);
  
      // Get the current day of the week (e.g., Monday, Tuesday, etc.)
      const currentDay = new Date().toLocaleString('en-SG', { weekday: 'long' });
  
      // Create a new request to fetch withdrawals for the same day of the week
      const request = new sql.Request();
      const result = await request
        .input('AccountNumber', sql.Int, accountNumber)
        .input('CurrentDay', sql.VarChar, currentDay)
        .query(`
          SELECT * FROM Withdraws 
          WHERE UserID = @AccountNumber 
          AND DATENAME(WEEKDAY, WithdrawDate) = @CurrentDay
        `);
  
      return result.recordset;
    } catch (error) {
      console.error('Error fetching daily withdrawals:', error);
      return [];
    }
  }
  

  
module.exports = {
    withdraw,
    dailyWithdrawal
};
