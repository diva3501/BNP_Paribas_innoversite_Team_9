
function evaluateStock(stock) {
  const p = stock;

  function commentPE(value) {
    if (value === null) return "P/E ratio data not available.";
    if (value < 15) return `The P/E ratio of ${value} suggests the stock is cheap relative to earnings.`;
    if (value <= 30) return `The P/E ratio of ${value} is fairly typical.`;
    return `The P/E ratio of ${value} indicates the stock is relatively expensive compared to its earnings.`;
  }

  function commentEPS(value) {
    if (value === null) return "EPS data not available.";
    if (value < 1) return `The EPS of ${value} is low; profitability may be a concern.`;
    if (value < 5) return `The EPS of ${value} shows modest profitability.`;
    return `The EPS of ${value} is a strong indicator of the company's profitability.`;
  }

  function commentDY(value) {
    if (value === null) return "Dividend yield data not available.";
    if (value < 1) return `The dividend yield of ${value}% is lower than the market average.`;
    if (value <= 3) return `The dividend yield of ${value}% is around the market norm.`;
    return `The dividend yield of ${value}% is attractive for income-focused investors.`;
  }

  function commentMarketCap(value) {
    if (value === null) return "Market cap data not available.";
    const trillion = 1e12;
    if (value >= 500 * trillion) return `The market cap of $${(value/trillion).toFixed(1)} trillion makes it one of the world’s giants.`;
    if (value >= 100 * trillion) return `The market cap of $${(value/trillion).toFixed(1)} trillion indicates a very large, stable company.`;
    return `The market capitalization of $${(value/trillion).toFixed(1)} trillion indicates a sizable player.`;
  }

  function commentDE(value) {
    if (value === null) return "Debt-to-equity ratio data not available.";
    if (value < 0.5) return `The debt-to-equity ratio of ${value} suggests very little leverage.`;
    if (value <= 1.5) return `The debt-to-equity ratio of ${value} suggests a moderate level of leverage.`;
    return `The debt-to-equity ratio of ${value} indicates high leverage; watch for risk.`;
  }

  function commentROE(value) {
    if (value === null) return "ROE data not available.";
    const pct = value * 100;
    if (pct < 8) return `The ROE of ${pct.toFixed(1)}% is below average.`;
    if (pct <= 15) return `The ROE of ${pct.toFixed(1)}% is healthy.`;
    return `The ROE of ${pct.toFixed(1)}% is very strong, showing efficient profit generation.`;
  }

  function commentROA(value) {
    if (value === null) return "ROA data not available.";
    const pct = value * 100;
    if (pct < 5) return `The ROA of ${pct.toFixed(1)}% is modest.`;
    if (pct <= 10) return `The ROA of ${pct.toFixed(1)}% indicates efficient asset utilization.`;
    return `The ROA of ${pct.toFixed(1)}% is excellent, showing superb asset productivity.`;
  }

  function commentCurrent(value) {
    if (value === null) return "Current ratio data not available.";
    if (value < 1) return `The current ratio of ${value} signals potential short-term liquidity issues.`;
    if (value <= 2) return `The current ratio of ${value} suggests good liquidity.`;
    return `The current ratio of ${value} indicates a very comfortable liquidity cushion.`;
  }

  function commentQuick(value) {
    if (value === null) return "Quick ratio data not available.";
    if (value < 1) return `The quick ratio of ${value} may be insufficient for immediate obligations.`;
    if (value <= 2) return `The quick ratio of ${value} indicates strong ability to meet obligations.`;
    return `The quick ratio of ${value} shows an exceptionally strong liquidity position.`;
  }

  function commentBV(value) {
    if (value === null) return "Book value per share data not available.";
    return `The book value per share of ${value} is a measure of the company's net asset value on a per-share basis.`;
  }

  const feedback = {
    priceEarningsRatio: commentPE(p.priceEarningsRatio),
    earningsPerShare: commentEPS(p.earningsPerShare),
    dividendYield: commentDY(p.dividendYield),
    marketCap: commentMarketCap(p.marketCap),
    debtToEquityRatio: commentDE(p.debtToEquityRatio),
    returnOnEquity: commentROE(p.returnOnEquity),
    returnOnAssets: commentROA(p.returnOnAssets),
    currentRatio: commentCurrent(p.currentRatio),
    quickRatio: commentQuick(p.quickRatio),
    bookValuePerShare: commentBV(p.bookValuePerShare)
  };

  const summary = Object.values(feedback).join(" ");

  return {
    stockSymbol: p.stockSymbol || "Unknown",
    feedback,
    summary
  };
}

module.exports = { evaluateStock };
