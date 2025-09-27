import React, { useState, useEffect } from "react";
import axios from "axios";
import { Button, Modal } from "react-bootstrap";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const backendURL = "http://127.0.0.1:8000"; // FastAPI backend

function App() {
  const [view, setView] = useState(""); // "stock" or "portfolio"
  const [stocks, setStocks] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [chartData, setChartData] = useState([]);

  // Generate 100 stock symbols
  useEffect(() => {
    const stockSymbols = [];
    for (let i = 1; i <= 100; i++) {
      stockSymbols.push("STK" + i.toString().padStart(3, "0"));
    }
    setStocks(stockSymbols);
  }, []);

  const fetchStockSummary = async (symbol) => {
    try {
      const res = await axios.post(`${backendURL}/evaluate`, { stockSymbol: symbol });
      setSelectedStock(res.data);
      setShowModal(true);
    } catch (err) {
      alert("Error fetching stock data");
      console.error(err);
    }
  };

  const fetchChartData = async () => {
    const data = [];
    for (let symbol of stocks) {
      try {
        const res = await axios.post(`${backendURL}/evaluate`, { stockSymbol: symbol });
        // We will use P/E ratio as a simple metric for ranking
        data.push({
          stock: symbol,
          pe: res.data.feedback.priceEarningsRatio.includes("cheap") ? 10 :
              res.data.feedback.priceEarningsRatio.includes("fairly typical") ? 25 : 50
        });
      } catch (err) {
        data.push({ stock: symbol, pe: 0 });
      }
    }
    setChartData(data);
  };

  return (
    <div className="container mt-5">
      <h1 className="text-center mb-4">NextGen Stock Analyzer</h1>

      <div className="d-flex justify-content-center gap-3 mb-4">
        <Button onClick={() => setView("stock")}>Stock Analyzer</Button>
        <Button onClick={() => setView("portfolio")}>Digital Portfolio</Button>
      </div>

      {view === "stock" && (
        <>
          <h4>Select a stock:</h4>
          <div className="d-flex flex-wrap gap-2 mb-4">
            {stocks.map((symbol) => (
              <Button key={symbol} onClick={() => fetchStockSummary(symbol)}>
                {symbol}
              </Button>
            ))}
          </div>

          <Button variant="success" onClick={fetchChartData}>
            Show Stock Bar Chart
          </Button>

          {chartData.length > 0 && (
            <BarChart width={1000} height={400} data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="stock" interval={0} angle={-45} textAnchor="end" height={100} />
              <YAxis label={{ value: "P/E Score", angle: -90, position: "insideLeft" }} />
              <Tooltip />
              <Bar dataKey="pe" fill="#8884d8" />
            </BarChart>
          )}
        </>
      )}

      {view === "portfolio" && (
        <h4>Digital Portfolio view coming soon...</h4>
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{selectedStock?.stockSymbol}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <h5>Summary</h5>
          <p>{selectedStock?.summary}</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Close</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default App;
