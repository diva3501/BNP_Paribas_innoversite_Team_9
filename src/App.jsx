import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  TrendingUp,
  BookmarkPlus,
  Gauge,
  BarChart3,
  Layers,
  Search,
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
      className={`rounded-3xl border border-slate-200 bg-white/80 p-6 
      dark:bg-slate-900/80 dark:border-slate-800 shadow-xl backdrop-blur-md ${className}`}
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

function ToggleButton({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-2xl text-sm font-semibold transition ${
        active
          ? "bg-indigo-600 text-white shadow-lg"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      }`}
    >
      {label}
    </button>
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
      .catch((err) => console.error(err));
  }, [sel]);

  useEffect(() => {
    if (all.length === 0) return;
    Promise.all(
      all.map((s) =>
        axios
          .post("http://127.0.0.1:8000/evaluate", { stockSymbol: s.stockSymbol })
          .then((r) => r.data)
          .catch(() => null)
      )
    ).then((r) => {
      const valid = r.filter(Boolean);
      const sorted = valid.sort((a, b) => b.overall - a.overall);
      setRanking(sorted);
    });
  }, [all]);

  const filtered = useMemo(
    () =>
      all.filter((x) =>
        (x.stockSymbol || "").toLowerCase().includes(q.toLowerCase())
      ),
    [all, q]
  );

  const chartData = {
    labels: ranking.map((r) => r.stockSymbol),
    datasets: [
      {
        label: `${metric.toUpperCase()} Score`,
        data: ranking.map((r) => r[metric]),
        backgroundColor: ranking.map((r) =>
          sel && sel.stockSymbol === r.stockSymbol
            ? "rgba(79,70,229,0.9)" 
            : r[metric] >= 75
            ? "rgba(34,197,94,0.8)" 
            : r[metric] >= 55
            ? "rgba(245,158,11,0.8)" 
            : "rgba(239,68,68,0.8)" 
        ),
        borderRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) =>
            ctx.label === result?.stockSymbol
              ? `⭐ ${ctx.raw}/100 (Selected)`
              : `${ctx.raw}/100`,
        },
      },
    },
    scales: { y: { beginAtZero: true, max: 100 } },
    animation: {
      duration: 900,
      easing: "easeOutBounce",
    },
  };

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
          {filtered.map((s, idx) => (
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
              <div className="text-[11px] text-slate-500">
                P/E: {s.parameters?.priceEarningsRatio}
              </div>
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

        {ranking.length > 0 && (
          <Glass>
            <div className="flex flex-col gap-4">
              <div className="flex gap-3 flex-wrap">
                <Pill
                  icon={Gauge}
                  label="Overall"
                  value={`${result?.overall || ranking[0].overall}/100`}
                  tone="emerald"
                  onClick={() => setMetric("overall")}
                />
                <Pill
                  icon={BarChart3}
                  label="Quality"
                  value={`${result?.quality || ranking[0].quality}/100`}
                  tone="amber"
                  onClick={() => setMetric("quality")}
                />
                <Pill
                  icon={Layers}
                  label="Value"
                  value={`${result?.value || ranking[0].value}/100`}
                  tone="amber"
                  onClick={() => setMetric("value")}
                />
              </div>

              <div>
                <h3 className="font-bold mb-2">Stock Ranking ({metric})</h3>
                <Bar data={chartData} options={chartOptions} />
              </div>
            </div>
          </Glass>
        )}
      </div>

      {boom && <Confetti numberOfPieces={220} recycle={false} gravity={0.25} />}
    </div>
  );
}


function DigitalPortfolioPage() {
  return (
    <Glass>
      <h2 className="text-xl font-bold">Digital Portfolio (Coming Soon)</h2>
    </Glass>
  );
}

export default function App() {
  const [page, setPage] = useState("menu");

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
