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

    
    def _f(self, metric, thresholds):
        for limit, score in thresholds:
            if metric <= limit:
                return score
        return thresholds[-1][1]

    def _g(self, metric, thresholds):
        for limit, score in thresholds:
            if metric <= limit:
                return score
        return thresholds[-1][1]

    
    def evaluate(self, stock: dict):
        pe = stock.get("priceEarningsRatio")
        dy = stock.get("dividendYield")
        bv = stock.get("bookValuePerShare")
        roe = stock.get("returnOnEquity")
        roa = stock.get("returnOnAssets")
        quick = stock.get("quickRatio")
        current = stock.get("currentRatio")
        de = stock.get("debtToEquityRatio")

        
        v_pe = self._g(pe or 0, [(10, 20), (20, 15), (30, 10), (100, 5), (9999, 0)])
        v_dy = self._g(dy or 0, [(0.5, 5), (1.5, 10), (3, 15), (10, 20), (999, 20)])
        v_bv = self._g(bv or 0, [(5, 5), (20, 10), (50, 15), (200, 20), (9999, 20)])
        value_score = v_pe + v_dy + v_bv

        
        q_roe = self._f((roe or 0) * 100, [(5, 5), (10, 10), (20, 15), (999, 20)])
        q_roa = self._f((roa or 0) * 100, [(3, 5), (7, 10), (12, 15), (999, 20)])
        q_quick = self._f(quick or 0, [(0.8, 5), (1.5, 10), (2.5, 15), (999, 20)])
        q_current = self._f(current or 0, [(1, 5), (2, 10), (3, 15), (999, 20)])
        q_de = self._f(de or 0, [(0.5, 20), (1.5, 15), (3, 10), (999, 5)])
        quality_score = q_roe + q_roa + q_quick + q_current + q_de

        
        overall = round(0.6 * quality_score + 0.4 * value_score)
        overall = max(0, min(100, overall))

        
        feedback = {
            "P/E": self.comment_pe(pe),
            "EPS": self.comment_eps(stock.get("earningsPerShare")),
            "DividendYield": self.comment_dy(dy),
            "MarketCap": self.comment_mc(stock.get("marketCap")),
            "DebtToEquity": self.comment_de(de),
            "ROE": self.comment_roe(roe),
            "ROA": self.comment_roa(roa),
            "CurrentRatio": self.comment_current(current),
            "QuickRatio": self.comment_quick(quick),
            "BookValue": self.comment_bv(bv),
        }

        summary = f"Stock {" ".join(feedback.values())} → Quality={quality_score}, Value={value_score}, Overall={overall}."

        return {
            "stockSymbol": stock.get("stockSymbol", "Unknown"),
            "quality": quality_score,
            "value": value_score,
            "overall": overall,
            "feedback": feedback,
            "summary": summary,
        }
