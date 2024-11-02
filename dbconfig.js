module.exports = {
    user: "tester", // Replace with your SQL Server login username
    password: "tester", // Replace with your SQL Server login password
    server: "localhost",
    database: "fsdp_assignment",
    trustServerCertificate: true,
    options: {
      port: 1433, // Default SQL Server port
      connectionTimeout: 60000, // Connection timeout in milliseconds
    },
  };