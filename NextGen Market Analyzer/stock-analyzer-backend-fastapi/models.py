from pydantic import BaseModel
from typing import Dict

class StockRequest(BaseModel):
    stockSymbol: str

class StockResponse(BaseModel):
    stockSymbol: str
    feedback: Dict[str, str]
    summary: str
