import json
import pandas as pd
from sklearn.tree import DecisionTreeClassifier
from xgboost import XGBClassifier
from sklearn.preprocessing import LabelEncoder

# ------------------- Portfolio Analyzer -------------------
class PortfolioAnalyzer:
    def __init__(self, portfolio: dict):
        self.portfolio = portfolio
        self.total_value = sum(f["value"] for f in portfolio["funds"])

    def compute_overlap(self):
        funds = self.portfolio["funds"]
        overlaps = []
        n = len(funds)
        for i in range(n):
            for j in range(i + 1, n):
                overlap = 0
                for stock in funds[i]["holdings"]:
                    if stock in funds[j]["holdings"]:
                        overlap += min(funds[i]["holdings"][stock],
                                       funds[j]["holdings"][stock])
                overlaps.append(overlap)
        avg_overlap = sum(overlaps) / len(overlaps) if overlaps else 0
        overlap_score = (1 - avg_overlap) * 100
        return round(overlap_score, 2), round(avg_overlap * 100, 2)

    def compute_sector_diversification(self):
        sector_weights = {}
        for fund in self.portfolio["funds"]:
            fund_share = fund["value"] / self.total_value
            for sector, pct in fund["sectors"].items():
                if pct > 1:
                    pct = pct / 100
                sector_weights[sector] = sector_weights.get(sector, 0) + (fund_share * pct)
        hhi = sum((w) ** 2 for w in sector_weights.values())
        sector_score = (1 - hhi) * 100
        return round(sector_score, 2), sector_weights

    def evaluate(self):
        overlap_score, avg_overlap = self.compute_overlap()
        sector_score, sector_weights = self.compute_sector_diversification()
        final_score = 0.5 * overlap_score + 0.5 * sector_score
        return {
            "overlapScore": overlap_score,
            "avgOverlapPercent": avg_overlap,
            "sectorScore": sector_score,
            "finalDiversificationScore": round(final_score, 2),
            "sectorBreakdown": sector_weights
        }

# ------------------- Step 1: Load Historical Data -------------------
def load_portfolios_from_json(file_path):
    with open(file_path, "r") as f:
        return json.load(f)

historical_portfolios = load_portfolios_from_json(
    "C:/Users/Gnana chandrika/Downloads/DataSet 189315c0 (1)/DataSet/ClientPortfolio.json"
)

# ------------------- Step 2: Preprocess Data -------------------
records = []
all_sectors = set()
labels = []

# Collect all sector names (normalize to uppercase)
for portfolio in historical_portfolios:
    analyzer_input = {"funds": [
        {"name": fund.get("fundCode", fund.get("name")),
         "value": fund.get("amount", fund.get("value")),
         "holdings": fund["holdings"],
         "sectors": {k.upper(): v for k, v in fund["sectors"].items()}}  # normalize
        for fund in portfolio["funds"]
    ]}
    analyzer = PortfolioAnalyzer(analyzer_input)
    result = analyzer.evaluate()
    all_sectors.update([s.upper() for s in result["sectorBreakdown"].keys()])

# Build dataset & labels
for portfolio in historical_portfolios:
    analyzer_input = {"funds": [
        {"name": fund.get("fundCode", fund.get("name")),
         "value": fund.get("amount", fund.get("value")),
         "holdings": fund["holdings"],
         "sectors": {k.upper(): v for k, v in fund["sectors"].items()}}  # normalize
        for fund in portfolio["funds"]
    ]}
    analyzer = PortfolioAnalyzer(analyzer_input)
    result = analyzer.evaluate()

    row = {
        "overlapScore": result["overlapScore"],
        "sectorScore": result["sectorScore"],
        "finalDiversificationScore": result["finalDiversificationScore"],
    }
    for sector in all_sectors:
        row[sector] = result["sectorBreakdown"].get(sector, 0)
    records.append(row)

    # Label = least invested sector (normalized)
    least_sector = min(result["sectorBreakdown"], key=lambda k: result["sectorBreakdown"][k])
    labels.append(least_sector.upper())

df = pd.DataFrame(records)

# ------------------- Step 3: Encode Labels -------------------
le = LabelEncoder()
y_encoded = le.fit_transform(labels)

print("Label mapping:", dict(zip(le.classes_, le.transform(le.classes_))))

X = df

# ------------------- Step 4: Train ML Models on Full Data -------------------
dt_model = DecisionTreeClassifier(max_depth=3, random_state=42)
dt_model.fit(X, y_encoded)

xgb_model = XGBClassifier(use_label_encoder=False, eval_metric="mlogloss", random_state=42)
xgb_model.fit(X, y_encoded)

# ------------------- Step 5: Recommend for New Portfolio -------------------
def recommend_new_portfolio(new_portfolio):
    analyzer = PortfolioAnalyzer(new_portfolio)
    result = analyzer.evaluate()

    new_row = {
        "overlapScore": result["overlapScore"],
        "sectorScore": result["sectorScore"],
        "finalDiversificationScore": result["finalDiversificationScore"]
    }
    for sector in all_sectors:
        new_row[sector] = result["sectorBreakdown"].get(sector, 0)
    new_df = pd.DataFrame([new_row])

    dt_pred = le.inverse_transform(dt_model.predict(new_df))[0]
    xgb_pred = le.inverse_transform(xgb_model.predict(new_df))[0]

    sorted_sectors = sorted(result["sectorBreakdown"].items(), key=lambda x: x[1])
    top2 = [s for s, _ in sorted_sectors[:2]]

    return {
        "metrics": result,
        "DecisionTreeSector": dt_pred,
        "XGBoostSector": xgb_pred,
        "RuleBasedTop2": top2
    }

new_customer_portfolio = {
    "funds": [
        {
            "name": "FUND_NEW",
            "value": 1000000,
            "holdings": {"ITC": 0.20, "INFY": 0.30, "HDFCBANK": 0.50},
            "sectors": {"IT": 0.30, "Banking": 0.50, "FMCG": 0.20}
        },
        {
            "name": "FUND_NEW2",
            "value": 1000000,
            "holdings": {"INFY": 0.40, "Reliance": 0.30, "HDFCBANK": 0.30},
            "sectors": {"IT": 0.40, "Banking": 0.30, "FMCG": 0.30}
        },
        {
            "name": "FUND_NEW3",
            "value": 500000,
            "holdings": {"TCS": 0.50, "INFY": 0.30, "ITC": 0.20},
            "sectors": {"IT": 0.80, "FMCG": 0.20}
        }
    ]
}

recommendation_result = recommend_new_portfolio(new_customer_portfolio)

print("\n----- NEW CUSTOMER SECTOR RECOMMENDATION -----")
metrics = recommendation_result["metrics"]
print(f"Overlap Score: {metrics['overlapScore']}%")
print(f"Sector Score: {metrics['sectorScore']}%")
print(f"Final Diversification Score: {metrics['finalDiversificationScore']}%\n")

print("-- Model Predictions --")
print(f"Decision Tree Predicted Sector: {recommendation_result['DecisionTreeSector']}")
print(f"XGBoost Predicted Sector: {recommendation_result['XGBoostSector']}")
print(f"Rule-based Recommended Sectors (Top 2): {recommendation_result['RuleBasedTop2']}")

