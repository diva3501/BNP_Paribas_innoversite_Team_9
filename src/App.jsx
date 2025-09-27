import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  TrendingUp,
  BookmarkPlus,
  Gauge,
  BarChart3,
  Layers,
  Search,
  Download,
} from "lucide-react";
import { motion } from "framer-motion";
import Confetti from "react-confetti";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Title,
  Legend,
} from "chart.js";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Title, Legend);

function Glass({ children, className = "" }) {
  return (
    <div
      className={`rounded-3xl border border-slate-200 bg-white/90 p-6 
      dark:bg-slate-900/90 dark:border-slate-800 shadow-xl backdrop-blur-md ${className}`}
    >
      {children}
    </div>
  );
}

function Pill({ icon: Icon, label, value, tone = "blue", onClick }) {
  const toneClass =
    tone === "emerald"
      ? "text-emerald-600"
      : tone === "amber"
      ? "text-amber-600"
      : tone === "rose"
      ? "text-rose-600"
      : "text-indigo-600";
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold 
        border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800 
        hover:bg-slate-50 dark:hover:bg-slate-700 transition ${toneClass}`}
    >
      <Icon className="h-4 w-4" /> {label}: {value}
    </button>
  );
}

function Radial({ value, label }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className="relative h-24 w-24 rounded-full border-8 border-indigo-400 
        flex items-center justify-center font-bold text-lg text-indigo-700 bg-white shadow-lg"
      >
        {value}
      </div>
      <div className="text-xs mt-2">{label}</div>
    </div>
  );
}


function StockResult({ result, addToWatchlist }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-emerald-600" />
          <h3 className="font-bold text-lg">{result.stockSymbol} – Summary</h3>
        </div>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => addToWatchlist(result.stockSymbol)}
            className="inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm 
            border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900 
            hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <BookmarkPlus className="h-4 w-4" /> Watch
          </button>
          <Pill
            icon={Gauge}
            label="Overall"
            value={`${result.overall}/100`}
            tone={
              result.overall >= 75
                ? "emerald"
                : result.overall >= 55
                ? "amber"
                : "rose"
            }
          />
          <Pill
            icon={BarChart3}
            label="Quality"
            value={`${result.quality}/100`}
          />
          <Pill
            icon={Layers}
            label="Value"
            value={`${result.value}/100`}
            tone="amber"
          />
        </div>
      </div>
      <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
        {result.summary}
      </p>
      <div className="grid md:grid-cols-2 gap-3">
        {Object.entries(result.feedback).map(([k, v]) => (
          <motion.div
            key={k}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-slate-200 bg-white p-3 text-sm 
            dark:bg-slate-900 dark:border-slate-700 shadow-sm"
          >
            <div className="font-semibold mb-1">{k}</div>
            <div className="text-slate-600 dark:text-slate-300">{v}</div>
          </motion.div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-6">
        <Radial value={result.overall} label="Overall" />
        <Radial value={result.quality} label="Quality" />
        <Radial value={result.value} label="Value" />
      </div>
    </div>
  );
}

function StocksPage() {
  const [all, setAll] = useState([]);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(null);
  const [result, setResult] = useState(null);
  const [boom, setBoom] = useState(false);
  const [ranking, setRanking] = useState([]);
  const [metric, setMetric] = useState("overall");

  useEffect(() => {
    fetch("/StockTickerSymbols.json")
      .then((r) => r.json())
      .then(setAll)
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!sel) return;
    axios
      .post("http://127.0.0.1:8000/evaluate", { stockSymbol: sel.stockSymbol })
      .then((res) => {
        setResult(res.data);
        setBoom(res.data.overall >= 75);
      })
      .catch(console.error);
  }, [sel]);

  return (
    <div className="grid xl:grid-cols-3 gap-6">
      <Glass className="xl:col-span-1">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-indigo-600" />
            <div className="font-semibold">Stocks</div>
          </div>
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search symbol…"
          className="w-full mb-3 rounded-2xl px-3 py-2 border border-slate-200"
        />
        <div className="max-h-[70vh] overflow-auto grid grid-cols-2 gap-2">
          {all
            .filter((x) =>
              (x.stockSymbol || "").toLowerCase().includes(q.toLowerCase())
            )
            .map((s, idx) => (
              <button
                key={s.stockSymbol + idx}
                onClick={() => setSel(s)}
                className={`rounded-2xl border px-3 py-2 transition text-left ${
                  sel && sel.stockSymbol === s.stockSymbol
                    ? "bg-indigo-100 border-indigo-400"
                    : "bg-white/70 dark:bg-slate-800 border-slate-200 hover:bg-indigo-50"
                }`}
              >
                <div className="font-semibold">{s.stockSymbol}</div>
              </button>
            ))}
        </div>
      </Glass>

      <div className="xl:col-span-2 flex flex-col gap-6">
        <Glass>
          {!result ? (
            <div className="h-[18rem] flex items-center justify-center text-slate-500">
              Select a stock to analyze.
            </div>
          ) : (
            <StockResult result={result} addToWatchlist={() => {}} />
          )}
        </Glass>
      </div>

      {boom && <Confetti numberOfPieces={220} recycle={false} gravity={0.25} />}
    </div>
  );
}


function DigitalPortfolioPage() {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [analysis, setAnalysis] = useState(null);

  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/clients")
      .then((res) => setClients(res.data.slice(0, 10))) 
      .catch(console.error);
  }, []);

  const fetchAnalysis = (clientId) => {
    setSelectedClient(clientId);
    axios
      .get(`http://127.0.0.1:8000/portfolio/${clientId}/analysis`)
      .then((res) => setAnalysis(res.data))
      .catch(console.error);
  };

  const downloadJSON = () => {
    if (!analysis) return;
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(analysis, null, 2));
    const dlAnchorElem = document.createElement("a");
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute(
      "download",
      `portfolio_${selectedClient}.json`
    );
    dlAnchorElem.click();
  };

  const sectorChartData = {
    labels: analysis ? Object.keys(analysis.sector_distribution) : [],
    datasets: [
      {
        label: "Sector % Distribution",
        data: analysis ? Object.values(analysis.sector_distribution) : [],
        backgroundColor: [
          "#6366F1",
          "#10B981",
          "#F59E0B",
          "#EF4444",
          "#8B5CF6",
          "#F43F5E",
        ],
      },
    ],
  };

  const sectorChartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
    },
    scales: { y: { beginAtZero: true, max: 100 } },
  };

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <Glass className="md:col-span-1">
        <h3 className="font-bold mb-3">Clients</h3>
        <div className="space-y-2 max-h-[70vh] overflow-auto">
          {clients.map((c) => (
            <button
              key={c.clientId}
              onClick={() => fetchAnalysis(c.clientId)}
              className={`w-full text-left px-3 py-2 rounded-2xl border ${
                selectedClient === c.clientId
                  ? "bg-indigo-100 border-indigo-400"
                  : "bg-white/70 dark:bg-slate-800 border-slate-200 hover:bg-indigo-50"
              }`}
            >
              {c.clientId} – {c.currency}
            </button>
          ))}
        </div>
      </Glass>

      <div className="md:col-span-2">
        {!analysis ? (
          <Glass>
            <div className="h-64 flex items-center justify-center text-slate-500">
              Select a client to view portfolio analysis.
            </div>
          </Glass>
        ) : (
          <Glass>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-lg">
                Portfolio Analysis – {selectedClient}
              </h3>
              <button
                onClick={downloadJSON}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700"
              >
                <Download className="h-4 w-4" /> Download JSON
              </button>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <Radial
                value={analysis.fund_overlap_score}
                label="Fund Overlap Score"
              />
              <Radial value={analysis.sector_score} label="Sector Score" />
              <Radial
                value={analysis.final_diversification_score}
                label="Final Diversification Score"
              />
            </div>

            <div className="mb-4">
              <h4 className="font-semibold mb-2">Sector Distribution (%)</h4>
              <Bar data={sectorChartData} options={sectorChartOptions} />
            </div>

            <div className="mb-4">
              <h4 className="font-semibold mb-2">Raw Analysis Data</h4>
              <pre className="max-h-60 overflow-auto p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs">
                {JSON.stringify(analysis, null, 2)}
              </pre>
            </div>
          </Glass>
        )}
      </div>
    </div>
  );
}


export default function App() {
  const [page, setPage] = React.useState("menu");

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-indigo-100 via-white to-indigo-50 dark:from-slate-900 dark:to-slate-800">
      {page === "menu" && (
        <div className="flex flex-col items-center gap-6 mt-20">
          <h1 className="text-3xl font-bold">NextGen Market Analyzer</h1>
          <button
            onClick={() => setPage("stocks")}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-700"
          >
            Stock Analyzer
          </button>
          <button
            onClick={() => setPage("portfolio")}
            className="px-6 py-3 bg-green-600 text-white rounded-xl shadow-lg hover:bg-green-700"
          >
            Digital Portfolio
          </button>
        </div>
      )}
      {page === "stocks" && <StocksPage />}
      {page === "portfolio" && <DigitalPortfolioPage />}
    </div>
  );
}
