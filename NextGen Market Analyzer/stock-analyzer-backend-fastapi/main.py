
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import mysql.connector
import itertools
import math

from evaluator import StockAnalyzerModel


app = FastAPI(title="NextGen Stock & Portfolio Analyzer")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_stock_db_conn():
    return mysql.connector.connect(
        host="localhost",
        user="taskmanager",
        password="user1234",
        database="stock_analyzer"
    )

def get_portfolio_db_conn():
    return mysql.connector.connect(
        host="localhost",
        user="taskmanager",
        password="user1234",
        database="portfolio_analyzer"
    )


class StockRequest(BaseModel):
    stockSymbol: str

class RecommendRequest(BaseModel):
    
    debtToEquityRatio: Optional[float] = None
    returnOnEquity: Optional[float] = None        
    returnOnAssets: Optional[float] = None
    bookValuePerShare: Optional[float] = None
    top_n: Optional[int] = 10

model = StockAnalyzerModel()


@app.post("/evaluate")
def evaluate_stock(stock_request: StockRequest):
    stock_symbol = stock_request.stockSymbol
    conn = get_stock_db_conn()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection error")
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM stocks WHERE stockSymbol = %s", (stock_symbol,))
    row = cursor.fetchone()
    cursor.close()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Stock not found")
    return model.evaluate(row)

@app.get("/stocks")
def list_stocks():
    conn = get_stock_db_conn()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection error")
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT stockSymbol FROM stocks ORDER BY stockSymbol")
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return rows


@app.get("/clients")
def get_clients():
    conn = get_portfolio_db_conn()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection error")
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM clients")
    clients = cursor.fetchall()
    cursor.close()
    conn.close()
    return clients

@app.get("/portfolio/{clientId}/analysis")
def portfolio_analysis(clientId: str):
    conn = get_portfolio_db_conn()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection error")
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT * FROM funds WHERE clientId=%s", (clientId,))
    funds = cursor.fetchall()
    if not funds:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="No funds found for client")

    
    fund_holdings = {}
    for fund in funds:
        cursor.execute("SELECT stockSymbol, percent FROM holdings WHERE fundId=%s", (fund["fundId"],))
        rows = cursor.fetchall()
        
        fund_holdings[fund["fundCode"]] = {r["stockSymbol"]: (r["percent"] / 100.0) for r in rows}

    
    overlaps = []
    fund_codes = list(fund_holdings.keys())
    for f1, f2 in itertools.combinations(fund_codes, 2):
        all_stocks = set(fund_holdings[f1].keys()) | set(fund_holdings[f2].keys())
        overlap = sum(min(fund_holdings[f1].get(s, 0.0), fund_holdings[f2].get(s, 0.0)) for s in all_stocks)
        overlaps.append(overlap)
    avg_overlap = sum(overlaps) / len(overlaps) if overlaps else 0.0
    overlap_score = max(0.0, (1.0 - avg_overlap) * 100.0)

    
    total_value = sum(f["amount"] for f in funds) or 1.0
    sector_totals: Dict[str, float] = {}
    for fund in funds:
        cursor.execute("SELECT sectorName, percent FROM sectors WHERE fundId=%s", (fund["fundId"],))
        rows = cursor.fetchall()
        fund_share = (fund["amount"] / total_value)
        for r in rows:
            sector_name = r["sectorName"]
            sector_totals[sector_name] = sector_totals.get(sector_name, 0.0) + (r["percent"] / 100.0) * fund_share

    
    hhi = sum(v * v for v in sector_totals.values())
    sector_score = max(0.0, (1.0 - hhi) * 100.0)

    final_score = (overlap_score + sector_score) / 2.0

    cursor.close()
    conn.close()

    
    sector_distribution = {k: round(v * 100.0, 2) for k, v in sector_totals.items()}

    return {
        "fund_overlap_score": round(overlap_score, 2),
        "sector_score": round(sector_score, 2),
        "final_diversification_score": round(final_score, 2),
        "sector_distribution": sector_distribution
    }

@app.get("/client/{clientId}/holdings")
def client_holdings(clientId: str):
    conn = get_portfolio_db_conn()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT h.stockSymbol, SUM((h.percent/100.0) * f.amount)/SUM(f.amount) AS weight
        FROM holdings h
        JOIN funds f ON h.fundId=f.fundId
        WHERE f.clientId=%s
        GROUP BY h.stockSymbol
    """, (clientId,))
    holdings = cursor.fetchall()
    cursor.close()
    conn.close()
    
    return [{"stockSymbol": r["stockSymbol"], "weightPct": round((r["weight"] or 0.0) * 100, 4)} for r in holdings]

@app.get("/client/{clientId}/sectors")
def client_sectors(clientId: str):
    conn = get_portfolio_db_conn()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT s.sectorName, SUM((s.percent/100.0) * f.amount)/SUM(f.amount) AS weight
        FROM sectors s
        JOIN funds f ON s.fundId=f.fundId
        WHERE f.clientId=%s
        GROUP BY s.sectorName
    """, (clientId,))
    sectors = cursor.fetchall()
    cursor.close()
    conn.close()
    return [{"sectorName": r["sectorName"], "weightPct": round((r["weight"] or 0.0) * 100, 4)} for r in sectors]


@app.post("/recommend")
def recommend(req: RecommendRequest):
    
    provided = {k: v for k, v in req.__dict__.items() if k != "top_n" and v is not None}
    if not provided:
        
        return {
            "error": "No filter parameters provided. Please supply at least one of: debtToEquityRatio, returnOnEquity, returnOnAssets, bookValuePerShare."
        }

    conn = get_stock_db_conn()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection error")
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM stocks")
    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    if not rows:
        return {"error": "No stock data available"}

    
    metrics = ["debtToEquityRatio", "returnOnEquity", "returnOnAssets", "bookValuePerShare"]
    ranges: Dict[str, Dict[str, float]] = {}
    for m in metrics:
        vals = [r[m] for r in rows if r.get(m) is not None]
        if vals:
            mn = min(vals)
            mx = max(vals)
            
            denom = mx - mn if (mx - mn) > 1e-9 else max(abs(mx), 1.0)
            ranges[m] = {"min": mn, "max": mx, "denom": denom}
        else:
            ranges[m] = {"min": 0.0, "max": 0.0, "denom": 1.0}

    def compute_similarity(stock_row: Dict[str, Any]) -> Dict[str, Any]:
        
        norm_diffs = []
        missing_count = 0
        for k, user_val in provided.items():
            stock_val = stock_row.get(k)
            if stock_val is None:
                
                norm = 1.0
                missing_count += 1
            else:
                rng = ranges.get(k, {"denom": 1.0, "min": 0.0})
                denom = rng["denom"] if rng["denom"] != 0 else 1.0
                
                diff = abs(stock_val - user_val)
                norm = min(1.0, diff / denom)
            norm_diffs.append(norm)
        
        avg_dist = sum(norm_diffs) / max(1, len(norm_diffs))
        similarity = max(0.0, (1.0 - avg_dist)) * 100.0
        
        inaccessible = (missing_count == len(provided))
        return {"stock": stock_row, "similarity": round(similarity, 2), "inaccessible": inaccessible}

    scored = [compute_similarity(r) for r in rows]
    
    scored_sorted = sorted(scored, key=lambda x: (x["inaccessible"], -x["similarity"]))

    top_n = max(1, int(req.top_n or 10))
    results = []
    for entry in scored_sorted[:top_n]:
        stock_row = entry["stock"]
        
        if entry["inaccessible"]:
            results.append({
                "stockSymbol": stock_row.get("stockSymbol"),
                "similarity": entry["similarity"],
                "note": "Requested metrics not available for this stock."
            })
        else:
            
            eval_out = model.evaluate(stock_row)
            results.append({
                "stockSymbol": stock_row.get("stockSymbol"),
                "similarity": entry["similarity"],
                "evaluation": eval_out
            })

    
    return {
        "criteria": provided,
        "top_n": top_n,
        "results": results
    }
