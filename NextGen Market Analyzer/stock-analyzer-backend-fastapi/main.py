from fastapi import FastAPI, HTTPException
from database import get_connection
from evaluator import StockAnalyzerModel
from models import StockRequest, StockResponse

app = FastAPI(title="NextGen Stock Analyzer")

model = StockAnalyzerModel()

@app.post("/evaluate", response_model=StockResponse)
def evaluate_stock_api(stock_request: StockRequest):
    stock_symbol = stock_request.stockSymbol
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection error")

    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM stocks WHERE stockSymbol = %s", (stock_symbol,))
    row = cursor.fetchone()
    cursor.close()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Stock not found")

    result = model.evaluate(row)
    return result
