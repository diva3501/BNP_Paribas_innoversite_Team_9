const express = require("express");
const mysql = require("mysql2/promise");
const { evaluateStock } = require("./evaluator");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors()); // Allow frontend to fetch

// MySQL connection pool
const db = mysql.createPool({
  host: "localhost",
  user: "taskmanager",
  password: "user1234",
  database: "stock_analyzer"
});

// Endpoint to fetch all stocks (for list & bar chart)
app.get("/stocks", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM stocks ORDER BY stockSymbol ASC");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Endpoint to evaluate a single stock
app.post("/evaluate", async (req, res) => {
  const { stockSymbol } = req.body;
  if (!stockSymbol) return res.status(400).json({ error: "stockSymbol is required" });

  try {
    const [rows] = await db.query("SELECT * FROM stocks WHERE stockSymbol = ?", [stockSymbol]);
    if (rows.length === 0) return res.status(404).json({ error: "Stock not found" });

    const stock = rows[0];

    // Convert NULLs to 0 or handle gracefully in evaluator
    for (let key in stock) {
      if (stock[key] === null && key !== "id" && key !== "stockSymbol") stock[key] = null;
    }

    const result = evaluateStock(stock);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
