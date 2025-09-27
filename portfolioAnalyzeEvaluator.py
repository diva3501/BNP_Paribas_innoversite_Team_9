import json

class PortfolioAnalyzer:
    def __init__(self, portfolio: dict):
        self.portfolio = portfolio
        self.total_value = sum(f["value"] for f in portfolio["funds"])

    def compute_overlap(self):
        funds = self.portfolio["funds"]
        overlaps = []
        n = len(funds)

        for i in range(n):
            for j in range(i+1, n):
                overlap = 0
                for stock in funds[i]["holdings"]:
                    if stock in funds[j]["holdings"]:
                        overlap += min(funds[i]["holdings"][stock], funds[j]["holdings"][stock])
                overlaps.append(overlap)

        avg_overlap = sum(overlaps) / len(overlaps) if overlaps else 0
        overlap_score = (1 - avg_overlap/100) * 100
        return round(overlap_score, 2), round(avg_overlap, 2)

    def compute_sector_diversification(self):
        sector_weights = {}
        for fund in self.portfolio["funds"]:
            fund_share = fund["value"] / self.total_value
            for sector, pct in fund["sectors"].items():
                sector_weights[sector] = sector_weights.get(sector, 0) + (fund_share * pct)

        hhi = sum((w) ** 2 for w in sector_weights.values())
        sector_score = (1 - hhi) * 100
        return round(sector_score, 2), sector_weights

    def generate_recommendations(self, overlap_score, avg_overlap, sector_score, sector_weights):
        recs = []

        # Overlap-related
        if overlap_score < 60:
            recs.append(f"High fund overlap detected (~{avg_overlap}%). Consider reducing duplicate stock holdings.")
        else:
            recs.append("Fund overlap is at healthy levels. No major action needed.")

        # Sector diversification
        if sector_score < 60:
            dominant_sector = max(sector_weights, key=sector_weights.get)
            recs.append(f"Portfolio heavily concentrated in {dominant_sector} sector. Consider adding exposure to other sectors.")
        else:
            recs.append("Sector allocation is reasonably diversified.")

        # Balance check
        if self.total_value < 1000000:
            recs.append("Portfolio size is relatively small. Focus on index funds or ETFs for diversification.")
        else:
            recs.append("Portfolio value is sufficient to support multi-sector diversification strategies.")

        return recs

    def evaluate(self):
        overlap_score, avg_overlap = self.compute_overlap()
        sector_score, sector_weights = self.compute_sector_diversification()
        final_score = 0.5 * overlap_score + 0.5 * sector_score

        recommendations = self.generate_recommendations(
            overlap_score, avg_overlap, sector_score, sector_weights
        )

        return {
            "overlapScore": overlap_score,
            "avgOverlapPercent": avg_overlap,
            "sectorScore": sector_score,
            "finalDiversificationScore": round(final_score, 2),
            "sectorBreakdown": sector_weights,
            "recommendations": recommendations
        }


# ---------------- Sample Portfolio Data ----------------
portfolio_json = """
[
  {
    "clientId": "C101",
    "currency": "INR",
    "funds": [
      {
        "fundCode": "FUND_A",
        "amount": 1000000,
        "holdings": {
          "INFY": 0.30,
          "HDFCBANK": 0.50,
          "ITC": 0.20
        },
        "sectors": {
          "IT": 0.30,
          "Banking": 0.50,
          "FMCG": 0.20
        }
      },
      {
        "fundCode": "FUND_B",
        "amount": 1000000,
        "holdings": {
          "INFY": 0.40,
          "RELIANCE": 0.30,
          "HDFCBANK": 0.30
        },
        "sectors": {
          "IT": 0.40,
          "Energy": 0.30,
          "Banking": 0.30
        }
      },
      {
        "fundCode": "FUND_C",
        "amount": 500000,
        "holdings": {
          "TCS": 0.50,
          "INFY": 0.30,
          "ITC": 0.20
        },
        "sectors": {
          "IT": 0.80,
          "FMCG": 0.20
        }
      }
    ]
  }
]
"""

# Load the JSON data
portfolio_data = json.loads(portfolio_json)

# Assuming the first item in the list is the portfolio we want to analyze
client_portfolio = portfolio_data[0]

# Adapt the structure to match the PortfolioAnalyzer's expected input
# The analyzer expects a dictionary with a "funds" key containing a list of fund dictionaries.
# Each fund dictionary needs "value", "holdings", and "sectors" keys.
# The provided JSON has "amount" instead of "value", and "fundCode" instead of "name".
# Also, the holdings and sectors are already in the correct format.

# Create the input for the PortfolioAnalyzer
analyzer_input = {
    "funds": [
        {
            "name": fund["fundCode"],  # Use fundCode as name
            "value": fund["amount"],    # Use amount as value
            "holdings": fund["holdings"],
            "sectors": fund["sectors"]
        }
        for fund in client_portfolio["funds"]
    ]
}


# ---------------- Run Portfolio Analyzer ----------------
portfolio_analyzer = PortfolioAnalyzer(analyzer_input)
portfolio_result = portfolio_analyzer.evaluate()

print("\n----- Portfolio Analysis -----")
print(f"Overlap Score: {portfolio_result['overlapScore']}%")
print(f"Average Fund Overlap: {portfolio_result['avgOverlapPercent']}%")
print(f"Sector Diversification Score: {portfolio_result['sectorScore']}%")
print(f"Final Diversification Score: {portfolio_result['finalDiversificationScore']}%")
print("Sector Breakdown:")
for sector, weight in portfolio_result['sectorBreakdown'].items():
    print(f"  {sector}: {weight*100:.2f}%")
print("\nRecommendations:")
for rec in portfolio_result['recommendations']:
    print(f"- {rec}")