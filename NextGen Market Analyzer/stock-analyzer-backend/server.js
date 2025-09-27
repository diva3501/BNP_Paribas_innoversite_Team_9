const express = require("express");
const mysql = require("mysql2/promise");
const { evaluateStock } = require("./evaluator");

const app = express();
app.use(express.json());

const db = mysql.createPool({
  host: "localhost",
  user: "taskmanager",    
  password: "user1234",   
  database: "stock_analyzer"
});


app.post("/evaluate", async (req, res) => {
  const { stockSymbol } = req.body;
  if (!stockSymbol) return res.status(400).json({ error: "stockSymbol is required" });

  try {
    const [rows] = await db.query("SELECT * FROM stocks WHERE stockSymbol = ?", [stockSymbol]);
    if (rows.length === 0) return res.status(404).json({ error: "Stock not found" });

    const stock = { ...rows[0], stockSymbol: rows[0].stockSymbol };
    const result = evaluateStock({ ...stock, parameters: {} , ...stock }); 
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
