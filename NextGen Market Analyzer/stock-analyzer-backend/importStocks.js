const mysql = require("mysql2/promise");
const fs = require("fs");


const db = mysql.createPool({
  host: "localhost",
  user: "taskmanager",    
  password: "user1234",   
  database: "stock_analyzer"
});


const data = JSON.parse(fs.readFileSync("StockTickerSymbols.json", "utf8"));


function safe(value) {
  return value !== undefined ? value : null;
}

async function importData() {
  for (let stock of data) {
    const p = stock.parameters;
    await db.query(
      `INSERT INTO stocks 
      (stockSymbol, priceEarningsRatio, earningsPerShare, dividendYield, marketCap, debtToEquityRatio, returnOnEquity, returnOnAssets, currentRatio, quickRatio, bookValuePerShare)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        stock.stockSymbol,
        safe(p.priceEarningsRatio),
        safe(p.earningsPerShare),
        safe(p.dividendYield),
        safe(p.marketCap),
        safe(p.debtToEquityRatio),
        safe(p.returnOnEquity),
        safe(p.returnOnAssets),
        safe(p.currentRatio),
        safe(p.quickRatio),
        safe(p.bookValuePerShare),
      ]
    );
  }
  console.log("Data imported successfully!");
  process.exit();
}

importData();
