class StockAnalyzerModel:
    def __init__(self):
        pass

    def comment_pe(self, value):
        if value is None: return "P/E ratio data not available."
        if value < 15: return f"The P/E ratio of {value} suggests the stock is cheap relative to earnings."
        if value <= 30: return f"The P/E ratio of {value} is fairly typical."
        return f"The P/E ratio of {value} indicates the stock is relatively expensive compared to its earnings."

    def comment_eps(self, value):
        if value is None: return "EPS data not available."
        if value < 1: return f"The EPS of {value} is low; profitability may be a concern."
        if value < 5: return f"The EPS of {value} shows modest profitability."
        return f"The EPS of {value} is a strong indicator of the company's profitability."

    def comment_dy(self, value):
        if value is None: return "Dividend yield data not available."
        if value < 1: return f"The dividend yield of {value}% is lower than the market average."
        if value <= 3: return f"The dividend yield of {value}% is around the market norm."
        return f"The dividend yield of {value}% is attractive for income-focused investors."

    def comment_mc(self, value):
        if value is None: return "Market cap data not available."
        trillion = 1e12
        if value >= 500 * trillion: return f"The market cap of ${(value/trillion):.1f} trillion makes it one of the world’s giants."
        if value >= 100 * trillion: return f"The market cap of ${(value/trillion):.1f} trillion indicates a very large, stable company."
        return f"The market capitalization of ${(value/trillion):.1f} trillion indicates a sizable player."

    def comment_de(self, value):
        if value is None: return "Debt-to-equity ratio data not available."
        if value < 0.5: return f"The debt-to-equity ratio of {value} suggests very little leverage."
        if value <= 1.5: return f"The debt-to-equity ratio of {value} suggests a moderate level of leverage."
        return f"The debt-to-equity ratio of {value} indicates high leverage; watch for risk."

    def comment_roe(self, value):
        if value is None: return "ROE data not available."
        pct = value * 100
        if pct < 8: return f"The ROE of {pct:.1f}% is below average."
        if pct <= 15: return f"The ROE of {pct:.1f}% is healthy."
        return f"The ROE of {pct:.1f}% is very strong, showing efficient profit generation."

    def comment_roa(self, value):
        if value is None: return "ROA data not available."
        pct = value * 100
        if pct < 5: return f"The ROA of {pct:.1f}% is modest."
        if pct <= 10: return f"The ROA of {pct:.1f}% indicates efficient asset utilization."
        return f"The ROA of {pct:.1f}% is excellent, showing superb asset productivity."

    def comment_current(self, value):
        if value is None: return "Current ratio data not available."
        if value < 1: return f"The current ratio of {value} signals potential short-term liquidity issues."
        if value <= 2: return f"The current ratio of {value} suggests good liquidity."
        return f"The current ratio of {value} indicates a very comfortable liquidity cushion."

    def comment_quick(self, value):
        if value is None: return "Quick ratio data not available."
        if value < 1: return f"The quick ratio of {value} may be insufficient for immediate obligations."
        if value <= 2: return f"The quick ratio of {value} indicates strong ability to meet obligations."
        return f"The quick ratio of {value} shows an exceptionally strong liquidity position."

    def comment_bv(self, value):
        if value is None: return "Book value per share data not available."
        return f"The book value per share of {value} is a measure of the company's net asset value on a per-share basis."

    # ----- Evaluation method -----
    def evaluate(self, stock: dict):
        feedback = {
            "priceEarningsRatio": self.comment_pe(stock.get("priceEarningsRatio")),
            "earningsPerShare": self.comment_eps(stock.get("earningsPerShare")),
            "dividendYield": self.comment_dy(stock.get("dividendYield")),
            "marketCap": self.comment_mc(stock.get("marketCap")),
            "debtToEquityRatio": self.comment_de(stock.get("debtToEquityRatio")),
            "returnOnEquity": self.comment_roe(stock.get("returnOnEquity")),
            "returnOnAssets": self.comment_roa(stock.get("returnOnAssets")),
            "currentRatio": self.comment_current(stock.get("currentRatio")),
            "quickRatio": self.comment_quick(stock.get("quickRatio")),
            "bookValuePerShare": self.comment_bv(stock.get("bookValuePerShare"))
        }

        summary = " ".join(feedback.values())
        return {
            "stockSymbol": stock.get("stockSymbol", "Unknown"),
            "feedback": feedback,
            "summary": summary
        }
