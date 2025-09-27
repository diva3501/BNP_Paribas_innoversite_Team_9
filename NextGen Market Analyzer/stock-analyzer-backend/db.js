const mysql = require("mysql2/promise");

const db = mysql.createPool({
  host: "localhost",
  user: "taskmanager",    
  password: "user1234",   
  database: "stock_analyzer"
});

module.exports = db;
