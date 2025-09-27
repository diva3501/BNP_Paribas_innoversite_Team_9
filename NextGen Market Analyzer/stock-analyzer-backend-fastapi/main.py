from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import mysql.connector
from evaluator import StockAnalyzerModel
from pydantic import BaseModel
import itertools

app = FastAPI(title="NextGen Market & Portfolio Analyzer")

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
    cursor.execute("SELECT stockSymbol FROM stocks")
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    
    return rows


@app.get("/clients")
def get_clients():
    conn = get_portfolio_db_conn()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM clients")
    clients = cursor.fetchall()
    cursor.close()
    conn.close()
    return clients

@app.get("/client/{clientId}")
def get_client_portfolio(clientId: str):
    conn = get_portfolio_db_conn()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT * FROM clients WHERE clientId=%s", (clientId,))
    client = cursor.fetchone()
    if not client:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Client not found")


    cursor.execute("SELECT * FROM funds WHERE clientId=%s", (clientId,))
    funds = cursor.fetchall()

    for fund in funds:
        fund_id = fund["fundId"]
        cursor.execute("SELECT stockSymbol, percent FROM holdings WHERE fundId=%s", (fund_id,))
        fund["holdings"] = cursor.fetchall()
        cursor.execute("SELECT sectorName, percent FROM sectors WHERE fundId=%s", (fund_id,))
        fund["sectors"] = cursor.fetchall()

    cursor.close()
    conn.close()
    return {"client": client, "funds": funds}

@app.get("/portfolio/{clientId}/analysis")
def portfolio_analysis(clientId: str):
    conn = get_portfolio_db_conn()
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
        fund_holdings[fund["fundCode"]] = {h["stockSymbol"]: h["percent"]/100 for h in cursor.fetchall()} 

    overlaps = []
    fund_codes = list(fund_holdings.keys())
    for f1, f2 in itertools.combinations(fund_codes, 2):
        all_stocks = set(fund_holdings[f1].keys()) | set(fund_holdings[f2].keys())
        overlap = sum(min(fund_holdings[f1].get(s, 0), fund_holdings[f2].get(s, 0)) for s in all_stocks)
        overlaps.append(overlap)
    avg_overlap = sum(overlaps)/len(overlaps) if overlaps else 0
    overlap_score = max(0, (1 - avg_overlap) * 100)  

    total_value = sum(f["amount"] for f in funds)
    sector_totals = {}
    for fund in funds:
        cursor.execute("SELECT sectorName, percent FROM sectors WHERE fundId=%s", (fund["fundId"],))
        sectors = cursor.fetchall()
        fund_share = fund["amount"]/total_value
        for s in sectors:
            sector_totals[s["sectorName"]] = sector_totals.get(s["sectorName"], 0) + (s["percent"]/100) * fund_share

    hhi = sum(v**2 for v in sector_totals.values())
    sector_score = max(0, (1 - hhi) * 100)  

    final_score = (overlap_score + sector_score)/2

    cursor.close()
    conn.close()

    return {
        "fund_overlap_score": round(overlap_score, 2),
        "sector_score": round(sector_score, 2),
        "final_diversification_score": round(final_score, 2),
        "sector_distribution": {k: round(v*100,2) for k,v in sector_totals.items()}  # in %
    }

@app.get("/client/{clientId}/holdings")
def client_holdings(clientId: str):
    conn = get_portfolio_db_conn()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT h.stockSymbol, SUM((h.percent/100) * f.amount)/SUM(f.amount) AS weight
        FROM holdings h
        JOIN funds f ON h.fundId=f.fundId
        WHERE f.clientId=%s
        GROUP BY h.stockSymbol
    """, (clientId,))
    holdings = cursor.fetchall()
    cursor.close()
    conn.close()
    return holdings

@app.get("/client/{clientId}/sectors")
def client_sectors(clientId: str):
    conn = get_portfolio_db_conn()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT s.sectorName, SUM((s.percent/100) * f.amount)/SUM(f.amount) AS weight
        FROM sectors s
        JOIN funds f ON s.fundId=f.fundId
        WHERE f.clientId=%s
        GROUP BY s.sectorName
    """, (clientId,))
    sectors = cursor.fetchall()
    cursor.close()
    conn.close()
    return sectors
