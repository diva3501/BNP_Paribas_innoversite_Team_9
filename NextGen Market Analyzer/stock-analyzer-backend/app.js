const express = require("express");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

// ---- Rule functions (hardcoded from your doc) ----

function evalPE(value) {
  if (value < 15)
    return `The P/E ratio of ${value} suggests the stock is cheap relative to earnings.`;
  else if (value <= 30)
    return `The P/E ratio of ${value} is fairly typical.`;
  else
    return `The P/E ratio of ${value} indicates the stock is relatively expensive compared to its earnings.`;
}

function evalEPS(value) {
  if (value < 1)
    return `The EPS of ${value} is low; profitability may be a concern.`;
  else if (value < 5)
    return `The EPS of ${value} shows modest profitability.`;
  else
    return `The EPS of ${value} is a strong indicator of the company's profitability.`;
}

function evalDividendYield(value) {
  if (value < 1)
    return `The dividend yield of ${value}% is lower than the market average.`;
  else if (value <= 3)
    return `The dividend yield of ${value}% is around the market norm.`;
  else
    return `The dividend yield of ${value}% is attractive for income-focused investors.`;
}

function evalMarketCap(value) {
  const trillion = 1_000_000_000_000;
  const trillions = (value / trillion).toFixed(1);
  if (value >= 500 * trillion)
    return `The market cap of $${trillions} trillion makes it one of the world’s giants.`;
  else if (value >= 100 * trillion)
    return `The market cap of $${trillions} trillion indicates a very large, stable company.`;
  else
    return `The market capitalization of $${trillions} trillion indicates a sizable player.`;
}

function evalDebtToEquity(value) {
  if (value < 0.5)
    return `The debt-to-equity ratio of ${value} suggests very little leverage.`;
  else if (value <= 1.5)
    return `The debt-to-equity ratio of ${value} suggests a moderate level of leverage.`;
  else
    return `The debt-to-equity ratio of ${value} indicates high leverage; watch for risk.`;
}

function evalROE(value) {
  const pct = (value * 100).toFixed(1);
  if (pct < 8)
    return `The ROE of ${pct}% is below average.`;
  else if (pct <= 15)
    return `The ROE of ${pct}% is healthy.`;
  else
    return `The ROE of ${pct}% is very strong, showing efficient profit generation.`;
}

function evalROA(value) {
  const pct = (value * 100).toFixed(1);
  if (pct < 5)
    return `The ROA of ${pct}% is modest.`;
  else if (pct <= 10)
    return `The ROA of ${pct}% indicates efficient asset utilization.`;
  else
    return `The ROA of ${pct}% is excellent, showing superb asset productivity.`;
}

function evalCurrentRatio(value) {
  if (value < 1)
    return `The current ratio of ${value} signals potential short-term liquidity issues.`;
  else if (value <= 2)
    return `The current ratio of ${value} suggests the company has a good short-term liquidity position.`;
  else
    return `The current ratio of ${value} indicates a very comfortable liquidity cushion.`;
}

function evalQuickRatio(value) {
  if (value < 1)
    return `The quick ratio of ${value} may be insufficient for immediate obligations.`;
  else if (value <= 2)
    return `The quick ratio of ${value} indicates a strong ability to meet short-term obligations.`;
  else
    return `The quick ratio of ${value} shows an exceptionally strong liquidity position.`;
}

function evalBookValue(value) {
  return `The book value per share of ${value} is a measure of the company's net asset value on a per-share basis.`;
}

// ---- API Endpoint ----
app.post("/evaluate", (req, res) => {
  const { stockSymbol, parameters } = req.body;

  // Basic validation
  if (!stockSymbol || typeof stockSymbol !== "string") {
    return res.status(400).json({ error: "Invalid stockSymbol" });
  }
  if (!parameters || typeof parameters !== "object") {
    return res.status(400).json({ error: "Invalid parameters" });
  }

  // Build feedback
  const feedback = {
    priceEarningsRatio: evalPE(parameters.priceEarningsRatio),
    earningsPerShare: evalEPS(parameters.earningsPerShare),
    dividendYield: evalDividendYield(parameters.dividendYield),
    marketCap: evalMarketCap(parameters.marketCap),
    debtToEquityRatio: evalDebtToEquity(parameters.debtToEquityRatio),
    returnOnEquity: evalROE(parameters.returnOnEquity),
    returnOnAssets: evalROA(parameters.returnOnAssets),
    currentRatio: evalCurrentRatio(parameters.currentRatio),
    quickRatio: evalQuickRatio(parameters.quickRatio),
    bookValuePerShare: evalBookValue(parameters.bookValuePerShare),
  };

  // Build summary (concatenate main points)
  const summary = [
    feedback.priceEarningsRatio,
    feedback.earningsPerShare,
    feedback.returnOnEquity,
    feedback.returnOnAssets,
    feedback.currentRatio,
    feedback.quickRatio,
    feedback.debtToEquityRatio,
    feedback.dividendYield,
    feedback.marketCap,
  ].join(" ");

  res.json({ stockSymbol, feedback, summary });
});

// ---- Start server ----
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Stock Evaluator API running on http://localhost:${PORT}`);
});
