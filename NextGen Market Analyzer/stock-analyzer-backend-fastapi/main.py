from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import mysql.connector
from evaluator import StockAnalyzerModel
from pydantic import BaseModel

# --------- FastAPI Setup ---------
app = FastAPI(title="NextGen Stock Analyzer")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allow all frontend origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------- Database Connection ---------
def get_connection():
    try:
        conn = mysql.connector.connect(
            host="localhost",
            user="taskmanager",
            password="user1234",
            database="stock_analyzer"
        )
        return conn
    except mysql.connector.Error as e:
        print("DB Error:", e)
        return None

# --------- Pydantic Models ---------
class StockRequest(BaseModel):
    stockSymbol: str

# --------- Initialize Analyzer ---------
model = StockAnalyzerModel()

# --------- Endpoints ---------
@app.post("/evaluate")
def evaluate_stock(stock_request: StockRequest):
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

    return model.evaluate(row)


@app.get("/stocks")
def list_stocks():
    """Return all stock symbols available in DB"""
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection error")

    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT stockSymbol FROM stocks")
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return rows
