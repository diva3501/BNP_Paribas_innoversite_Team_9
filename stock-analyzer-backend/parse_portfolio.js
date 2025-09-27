const mysql = require("mysql2/promise");
const fs = require("fs");

// --- Config ---
const DB_NAME = "portfolio_analyzer";
const USER = "taskmanager";
const PASSWORD = "user1234";
const HOST = "localhost";

const JSON_FILE = "ClientPortfolio.json"; // same folder

async function main() {
  // --- Connect to MySQL without DB first ---
  const conn = await mysql.createConnection({ host: HOST, user: USER, password: PASSWORD });

  // --- Create DB if not exists ---
  await conn.query(`CREATE DATABASE IF NOT EXISTS ${DB_NAME}`);
  await conn.query(`USE ${DB_NAME}`);

  // --- Create tables ---
  await conn.query(`
    CREATE TABLE IF NOT EXISTS clients (
      clientId VARCHAR(20) PRIMARY KEY,
      currency VARCHAR(10)
    )
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS funds (
      fundId INT AUTO_INCREMENT PRIMARY KEY,
      clientId VARCHAR(20),
      fundCode VARCHAR(50),
      amount DOUBLE,
      FOREIGN KEY (clientId) REFERENCES clients(clientId)
    )
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS holdings (
      holdingId INT AUTO_INCREMENT PRIMARY KEY,
      fundId INT,
      stockSymbol VARCHAR(50),
      percent DOUBLE,
      FOREIGN KEY (fundId) REFERENCES funds(fundId)
    )
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS sectors (
      sectorId INT AUTO_INCREMENT PRIMARY KEY,
      fundId INT,
      sectorName VARCHAR(100),
      percent DOUBLE,
      FOREIGN KEY (fundId) REFERENCES funds(fundId)
    )
  `);

  // --- Read JSON ---
  const rawData = fs.readFileSync(JSON_FILE, "utf8");
  const data = JSON.parse(rawData);

  // --- Insert data ---
  for (const client of data) {
    await conn.query("INSERT IGNORE INTO clients (clientId, currency) VALUES (?, ?)", [client.clientId, client.currency]);

    for (const fund of client.funds) {
      const [fundRes] = await conn.query(
        "INSERT INTO funds (clientId, fundCode, amount) VALUES (?, ?, ?)",
        [client.clientId, fund.fundCode, fund.amount]
      );
      const fundId = fundRes.insertId;

      for (const [stock, pct] of Object.entries(fund.holdings)) {
        await conn.query(
          "INSERT INTO holdings (fundId, stockSymbol, percent) VALUES (?, ?, ?)",
          [fundId, stock, pct * 100]
        );
      }

      for (const [sector, pct] of Object.entries(fund.sectors)) {
        await conn.query(
          "INSERT INTO sectors (fundId, sectorName, percent) VALUES (?, ?, ?)",
          [fundId, sector, pct * 100]
        );
      }
    }
  }

  console.log("Portfolio data inserted successfully!");
  await conn.end();
}

main().catch(err => console.error(err));
