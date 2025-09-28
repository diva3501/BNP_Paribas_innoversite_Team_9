import React, {
  useEffect,
  useMemo,
  useState,
  useContext,
  createContext,
} from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  useNavigate,
} from "react-router-dom";
import { BookmarkCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti";
import {
  Home,
  TrendingUp,
  Layers,
  BarChart3,
  Gauge,
  Sparkles,
  ShieldCheck,
  Search,
  Moon,
  Sun,
  ChevronRight,
  ChevronLeft,
  Info,
  GitBranch,
  CheckCircle2,
  AlertTriangle,
  BookmarkPlus,
  Check,
  X,
  Download,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Legend,
  Tooltip as RTooltip,
  ResponsiveContainer,
  Cell,
  BarChart as RBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";


const cn = (...xs) => xs.filter(Boolean).join(" ");
const round2 = (x) => Math.round(x * 100) / 100;

function useTheme() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem("theme");
    if (saved) return saved === "dark";
    return document.documentElement.classList.contains("dark");
  });
  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);
  return [dark, setDark];
}

/* ---------------------- toast ---------------------- */
const ToastCtx = createContext(null);
function useToast() {
  return useContext(ToastCtx);
}
function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const addToast = (title, desc, tone = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, title, desc, tone }]);
    setTimeout(() => removeToast(id), 3000);
  };
  const removeToast = (id) =>
    setToasts((t) => t.filter((x) => x.id !== id));
  return (
    <ToastCtx.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[60] space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "w-72 rounded-2xl border shadow-lg p-3 backdrop-blur-xl",
              "bg-white/90 border-slate-200 text-slate-800",
              "dark:bg-slate-800/90 dark:border-slate-700 dark:text-slate-100",
              t.tone === "success" && "border-emerald-300/60",
              t.tone === "warn" && "border-amber-300/60",
              t.tone === "error" && "border-rose-300/60"
            )}
          >
            <div className="flex items-start gap-2">
              <div className="pt-0.5">
                {t.tone === "success" ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : t.tone === "warn" ? (
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                ) : (
                  <X className="h-4 w-4 text-rose-500" />
                )}
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold">
                  {t.title}
                </div>
                {t.desc && (
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {t.desc}
                  </div>
                )}
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

async function fetchJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to fetch ${path}`);
  return res.json();
}

function evaluateStockRules(input) {
  const p = input?.parameters || {};
  const fb = {};

  const pe = Number(p.priceEarningsRatio);
  if (pe < 15)
    fb.priceEarningsRatio = `The P/E ratio of ${pe} suggests the stock is cheap relative to earnings.`;
  else if (pe <= 30)
    fb.priceEarningsRatio = `The P/E ratio of ${pe} is fairly typical.`;
  else
    fb.priceEarningsRatio = `The P/E ratio of ${pe} indicates the stock is relatively expensive compared to its earnings.`;

  const eps = Number(p.earningsPerShare);
  if (eps < 1)
    fb.earningsPerShare = `The EPS of ${eps} is low; profitability may be a concern.`;
  else if (eps < 5)
    fb.earningsPerShare = `The EPS of ${eps} shows modest profitability.`;
  else
    fb.earningsPerShare = `The EPS of ${eps} is a strong indicator of the company's profitability.`;

  const dy = Number(p.dividendYield);
  if (dy < 1)
    fb.dividendYield = `The dividend yield of ${dy}% is lower than the market average.`;
  else if (dy <= 3)
    fb.dividendYield = `The dividend yield of ${dy}% is around the market norm.`;
  else
    fb.dividendYield = `The dividend yield of ${dy}% is attractive for income focused investors.`;

  const trillion = 1_000_000_000_000;
  const mc = Number(p.marketCap);
  if (mc >= 500 * trillion)
    fb.marketCap = `The market cap of $${(mc / trillion).toFixed(
      1
    )} trillion makes it one of the world’s giants.`;
  else if (mc >= 100 * trillion)
    fb.marketCap = `The market cap of $${(mc / trillion).toFixed(
      1
    )} trillion indicates a very large, stable company.`;
  else
    fb.marketCap = `The market capitalization of $${(
      mc / trillion
    ).toFixed(1)} trillion indicates a sizable player.`;

  const dte = Number(p.debtToEquityRatio);
  if (dte < 0.5)
    fb.debtToEquityRatio = `The debt to equity ratio of ${dte} suggests very little leverage.`;
  else if (dte <= 1.5)
    fb.debtToEquityRatio = `The debt to equity ratio of ${dte} suggests a moderate level of leverage.`;
  else
    fb.debtToEquityRatio = `The debt to equity ratio of ${dte} indicates high leverage; watch for risk.`;

  const roePct = Number(p.returnOnEquity) * 100;
  if (roePct < 8)
    fb.returnOnEquity = `The ROE of ${roePct.toFixed(2)}% is below average.`;
  else if (roePct <= 15)
    fb.returnOnEquity = `The ROE of ${roePct.toFixed(2)}% is healthy.`;
  else
    fb.returnOnEquity = `The ROE of ${roePct.toFixed(
      2
    )}% is very strong, showing efficient profit generation.`;

  const roaPct = Number(p.returnOnAssets) * 100;
  if (roaPct < 5)
    fb.returnOnAssets = `The ROA of ${roaPct.toFixed(2)}% is modest.`;
  else if (roaPct <= 10)
    fb.returnOnAssets = `The ROA of ${roaPct.toFixed(
      2
    )}% indicates efficient asset utilization.`;
  else
    fb.returnOnAssets = `The ROA of ${roaPct.toFixed(
      2
    )}% is excellent, showing superb asset productivity.`;

  const cr = Number(p.currentRatio);
  if (cr < 1)
    fb.currentRatio = `The current ratio of ${cr} signals potential short term liquidity issues.`;
  else if (cr <= 2)
    fb.currentRatio = `The current ratio of ${cr} suggests the company has a good short term liquidity position.`;
  else
    fb.currentRatio = `The current ratio of ${cr} indicates a very comfortable liquidity cushion.`;

  const qr = Number(p.quickRatio);
  if (qr < 1)
    fb.quickRatio = `The quick ratio of ${qr} may be insufficient for immediate obligations.`;
  else if (qr <= 2)
    fb.quickRatio = `The quick ratio of ${qr} indicates a strong ability to meet short term obligations.`;
  else
    fb.quickRatio = `The quick ratio of ${qr} shows an exceptionally strong liquidity position.`;

  const bv = Number(p.bookValuePerShare);
  fb.bookValuePerShare = `The book value per share of ${bv} is a measure of the company's net asset value on a per share basis.`;

  const summary = [
    fb.priceEarningsRatio,
    fb.earningsPerShare,
    fb.returnOnEquity,
    fb.returnOnAssets,
    fb.currentRatio,
    fb.quickRatio,
    fb.debtToEquityRatio,
    fb.dividendYield,
    fb.marketCap,
  ].join(" ");

  const quality = Math.round(
    (roePct >= 15 ? 30 : roePct >= 8 ? 20 : 10) +
      (roaPct >= 10 ? 25 : roaPct >= 5 ? 18 : 10) +
      (qr >= 1 ? 15 : 8) +
      (cr >= 1 && cr <= 2 ? 15 : cr > 2 ? 12 : 6) +
      (dte < 0.5 ? 15 : dte <= 1.5 ? 12 : 6)
  );
  const value = Math.round(
    (pe < 15 ? 30 : pe <= 30 ? 20 : 10) +
      (dy >= 3 ? 25 : dy >= 1 ? 18 : 10) +
      (bv > 0 ? 10 : 0)
  );
  const overall = Math.max(
    0,
    Math.min(100, Math.round(0.6 * quality + 0.4 * value))
  );

  return {
    stockSymbol: input.stockSymbol,
    feedback: fb,
    summary,
    quality,
    value,
    overall,
  };
}


function pairwiseOverlap(wi, wj) {
  const keys = new Set([
    ...Object.keys(wi || {}),
    ...Object.keys(wj || {}),
  ]);
  let s = 0;
  keys.forEach((k) => (s += Math.min(wi?.[k] || 0, wj?.[k] || 0)));
  return s;
}
function averageOverlap(funds) {
  let tot = 0,
    pairs = 0;
  for (let i = 0; i < funds.length; i++) {
    for (let j = i + 1; j < funds.length; j++) {
      tot += pairwiseOverlap(funds[i].holdings, funds[j].holdings);
      pairs += 1;
    }
  }
  return pairs ? tot / pairs : 0;
}
function weightedSectors(funds) {
  const tv = funds.reduce((a, f) => a + Number(f.amount || 0), 0);
  const agg = {};
  for (const f of funds) {
    const w = Number(f.amount || 0) / tv;
    for (const [sec, p] of Object.entries(f.sectors || {})) {
      agg[sec] = (agg[sec] || 0) + w * Number(p);
    }
  }
  return agg;
}
function hhi(sectorWeights) {
  return Object.values(sectorWeights).reduce(
    (a, v) => a + v * v,
    0
  );
}
function buildOverlapMatrix(funds) {
  const n = funds.length;
  const M = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {
      const v =
        i === j
          ? 1
          : pairwiseOverlap(funds[i].holdings, funds[j].holdings);
      M[i][j] = M[j][i] = v;
    }
  }
  return M;
}
function analyzePortfolio(input, alpha = 0.5) {
  const funds = input.funds || [];
  const ov = averageOverlap(funds);
  const overlapScore = (1 - ov) * 100;
  const sectors = weightedSectors(funds);
  const sectorScore = (1 - hhi(sectors)) * 100;
  const finalScore = alpha * overlapScore + (1 - alpha) * sectorScore;
  const totalValue = (funds || []).reduce(
    (a, f) => a + Number(f.amount || 0),
    0
  );
  const findings = [];
  const sortedSectors = Object.entries(sectors).sort(
    (a, b) => b[1] - a[1]
  );
  if (ov > 0.45)
    findings.push("Significant cross-fund holdings overlap.");
  if (sortedSectors[0])
    findings.push(
      `Top sector: ${sortedSectors[0][0]} ${(
        sortedSectors[0][1] * 100
      ).toFixed(0)}%`
    );
  if (sectorScore < 65)
    findings.push("Sector concentration elevated by HHI.");
  const recommendations = [];
  if (sortedSectors[0])
    recommendations.push(
      `Trim ${sortedSectors[0][0]} by 10–15% and add Utilities/Pharma for balance.`
    );
  if (ov > 0.45)
    recommendations.push(
      "Reduce overlapping names (e.g., INFY/HDFCBANK) to lower duplicate exposure."
    );
  return {
    finalScore: round2(finalScore),
    overlapScore: round2(overlapScore),
    sectorScore: round2(sectorScore),
    sectors,
    totalValue,
    findings,
    recommendations,
    overlapsMatrix: buildOverlapMatrix(funds),
  };
}


const Glass = ({ className, children }) => (
  <div
    className={cn(
      "rounded-3xl border shadow-xl p-4 md:p-6 backdrop-blur-xl",

      "bg-white/80 border-emerald-200/60 text-slate-800",

      "dark:bg-slate-800/70 dark:border-slate-700 dark:text-slate-100",
      className
    )}
  >
    {children}
  </div>
);

const Pill = ({ icon: Icon, label, value, tone = "emerald" }) => (
  <div
    className={cn(
      "flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium shadow-sm",
      tone === "emerald" &&
        "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-200 dark:border-emerald-500/30",
      tone === "amber" &&
        "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-200 dark:border-amber-500/30",
      tone === "rose" &&
        "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/15 dark:text-rose-200 dark:border-rose-500/30"
    )}
  >
    <Icon className="h-4 w-4" />
    <span>
      {label}: <b>{value}</b>
    </span>
  </div>
);

const Radial = ({ value = 72, label = "Score" }) => {
  const clamped = Math.max(0, Math.min(100, value));
  const angle = (clamped / 100) * 360;
  const bg = `conic-gradient(rgb(79,70,229) ${angle}deg, rgba(15,23,42,0.08) ${angle}deg)`;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-28 w-28 rounded-full" style={{ background: bg }}>
        <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center shadow-inner dark:bg-slate-900">
          <div className="text-center">
            <div className="text-xl font-extrabold">{clamped}</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">
              {label}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------------------- layout ---------------------- */
function Header({ dark, setDark }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Sparkles className="h-7 w-7 text-indigo-600" />
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
          Invizor
        </h1>
      </div>
      <div className="flex items-center gap-2 md:gap-3">
        <NavLink
          to="/"
          className={({ isActive }) =>
            cn(
              "hidden sm:inline-flex items-center gap-2 text-sm rounded-2xl px-3 py-1.5 border",
              isActive
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white/70 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
            )
          }
        >
          <Home className="h-4 w-4" /> Home
        </NavLink>

        <NavLink
          to="/stocks"
          className={({ isActive }) =>
            cn(
              "inline-flex items-center gap-2 text-sm rounded-2xl px-3 py-1.5 border",
              isActive
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white/70 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
            )
          }
        >
          <TrendingUp className="h-4 w-4" /> Stock Evaluator
        </NavLink>

        <NavLink
          to="/portfolio"
          className={({ isActive }) =>
            cn(
              "inline-flex items-center gap-2 text-sm rounded-2xl px-3 py-1.5 border",
              isActive
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white/70 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
            )
          }
        >
          <Layers className="h-4 w-4" /> Portfolio Analyzer
        </NavLink>

        <NavLink
          to="/watchlist"
          className={({ isActive }) =>
            cn(
              "inline-flex items-center gap-2 text-sm rounded-2xl px-3 py-1.5 border",
              isActive
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white/70 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
            )
          }
        >
          <BookmarkPlus className="h-4 w-4" /> Watchlisted
        </NavLink>

        <button
          onClick={() => setDark(!dark)}
          className="inline-flex items-center gap-2 rounded-2xl px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
        >
          {dark ? (
            <>
              <Sun className="h-4 w-4 text-amber-400" /> Light
            </>
          ) : (
            <>
              <Moon className="h-4 w-4 text-indigo-600" /> Dark
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function Shell({ children }) {
  const [dark, setDark] = useTheme();
  return (
    <ToastProvider>
      <div
        className={cn(
          "h-screen w-screen overflow-hidden text-slate-800 dark:text-slate-100",
          // Light: BNP-ish mint gradient
          "bg-gradient-to-br from-emerald-50 via-white to-emerald-100/40",
          // Dark
          "dark:from-slate-950 dark:via-slate-900 dark:to-slate-950"
        )}
      >
        <div className="h-full w-full px-4 sm:px-6 lg:px-8 py-4 flex flex-col">
          <Header dark={dark} setDark={setDark} />
          <div className="mt-4 flex-1 min-h-0">{children}</div>
          <footer className="mt-4 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5" />Terms and Conditions Apply. Invizor Private Limited
          </footer>
        </div>
      </div>
      <ChatWidget />
    </ToastProvider>
  );
}

const slideshowImages = [
  "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop"
];

const analyzerFeatures = [
  {
    icon: Gauge,
    title: "Data-Driven Insights",
    description: "Leverage quantitative metrics to score stocks and portfolios, removing emotional bias from your investment decisions.",
    color: "text-emerald-500"
  },
  {
    icon: ShieldCheck,
    title: "Uncover Hidden Risks",
    description: "Analyze fund overlaps and sector concentrations to identify and mitigate hidden risks in your client's portfolios.",
    color: "text-blue-500"
  },
  {
    icon: Sparkles,
    title: "Simplify Complex Metrics",
    description: "Our intuitive UI translates complex financial data into clear, actionable recommendations and easy-to-understand visuals.",
    color: "text-indigo-500"
  },
  {
    icon: Layers,
    title: "Holistic Portfolio View",
    description: "Get a complete picture of diversification and asset allocation to build more resilient and balanced investment strategies.",
    color: "text-amber-500"
  }
];

/* ---------------------- Home ---------------------- */
function HomePage() {
  const nav = useNavigate();
  const [imgIdx, setImgIdx] = useState(0);

  const nextImage = () => {
    setImgIdx((prev) => (prev + 1) % slideshowImages.length);
  };
  const prevImage = () => {
    setImgIdx(
      (prev) => (prev - 1 + slideshowImages.length) % slideshowImages.length
    );
  };
  const goToImage = (index) => {
    setImgIdx(index);
  };

  useEffect(() => {
    const timer = setInterval(nextImage, 5000);
    return () => clearInterval(timer);
  }, []);

  const listVariants = {
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.25 }
    },
    hidden: { opacity: 0 }
  };

  const itemVariants = {
    visible: { opacity: 1, x: 0 },
    hidden: { opacity: 0, x: -50 }
  };

  return (
    <div className="grid md:grid-cols-2 gap-6 h-full">
      {/* Left Column */}
      <div className="flex flex-col gap-6">
        {/* Slideshow Container */}
        <div className="relative rounded-3xl overflow-hidden flex-1 group">
          <AnimatePresence>
            <motion.img
              key={imgIdx}
              src={slideshowImages[imgIdx]}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent z-10" />
          <button
            onClick={prevImage}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 bg-white/20 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>
          <button
            onClick={nextImage}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 bg-white/20 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="h-6 w-6 text-white" />
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {slideshowImages.map((_, i) => (
              <button
                key={i}
                onClick={() => goToImage(i)}
                className={cn(
                  "h-2.5 w-2.5 rounded-full transition-all duration-300",
                  i === imgIdx
                    ? "w-6 bg-white"
                    : "bg-white/40 hover:bg-white/70"
                )}
              />
            ))}
          </div>
        </div>
        <Glass>
          <div className="flex items-center justify-between">
            <div className="font-bold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-indigo-400" />
              Stock Evaluator
            </div>
            <button
              onClick={() => nav("/stocks")}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 text-white px-4 py-2 font-semibold shadow-md hover:bg-emerald-500 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
              Open
            </button>
          </div>
        </Glass>
      </div>

      {/* Right Column */}
      <div className="flex flex-col gap-6">
        <Glass className="flex-1 flex flex-col justify-center">
          <h2 className="text-xl font-bold mb-4 text-emerald-600 dark:text-indigo-400">
            Why Use Invizor?
          </h2>
          <motion.ul
            className="space-y-4"
            initial="hidden"
            animate="visible"
            variants={listVariants}
        	>
            {analyzerFeatures.map((feature, i) => (
              <motion.li
                key={i}
                className="flex items-start gap-3 group"
                variants={itemVariants}
            	>
                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full group-hover:scale-110 transition-transform">
                  <feature.icon className={cn("h-5 w-5", feature.color)} />
                </div>
                <div>
                  <h3 className="font-semibold text-base">{feature.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {feature.description}
                  </p>
                </div>
            	</motion.li>
            ))}
        	</motion.ul>
      	</Glass>
        <Glass>
          <div className="flex items-center justify-between">
            <div className="font-bold flex items-center gap-2">
              <Layers className="h-5 w-5 text-emerald-600 dark:text-indigo-400" />
              Portfolio Analyzer
            </div>
            <button
              onClick={() => nav("/portfolio")}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 text-white px-4 py-2 font-semibold shadow-md hover:bg-emerald-500 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
              Open
            </button>
          </div>
      	</Glass>
      </div>
    </div>
  );
}

/* ---------------------- Stocks ---------------------- */
function StocksPage() {
  const toast = useToast();
  const { list: watchlist, toggle, has } = useWatchlist();

  const [all, setAll] = useState([]);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(null);
  const [boom, setBoom] = useState(false);

  useEffect(() => {
    fetchJSON("/StockTickerSymbols.json")
      .then(setAll)
      .catch((e) => {
        console.error(e);
        toast.addToast(
          "Failed to load stocks",
          "Check /public/StockTickerSymbols.json",
          "error"
        );
      });
  }, []);

  useEffect(() => {
    if (!sel) return;
    const out = evaluateStockRules(sel);
    setBoom(out.overall >= 75);
  }, [sel]);

  const filtered = useMemo(
    () =>
      all.filter((x) =>
        (x.stockSymbol || "").toLowerCase().includes(q.toLowerCase())
      ),
    [all, q]
  );

  const onToggleWatch = (symbol) => {
    const wasWatched = has(symbol);
    toggle(symbol);
    toast.addToast(
      wasWatched ? "Removed from Watchlist" : "Added to Watchlist",
      symbol,
      wasWatched ? "warn" : "success"
    );
  };

  return (
    <div className="grid xl:grid-cols-3 gap-6 h-full min-h-0">
      {/* Left list */}
      <Glass className="xl:col-span-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-indigo-600" />
            <div className="font-semibold">Stocks</div>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Watchlist: {watchlist.length}
          </div>
        </div>

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search symbol…"
          className="w-full mb-3 rounded-2xl px-3 py-2 border border-emerald-200 bg-white/80 dark:bg-slate-900/60 dark:border-slate-700"
        />

        <div className="flex-1 min-h-0 overflow-auto grid grid-cols-2 md:grid-cols-3 xl:grid-cols-2 gap-2">
          {filtered.map((s, idx) => {
            const watched = has(s.stockSymbol);
            return (
              <div
                key={s.stockSymbol + idx}
                className={cn(
                  "rounded-2xl px-3 py-2 border",
                  "bg-white text-black border-emerald-300",
                  "dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700"
                )}
              >
             
                <div className="rounded-xl p-3 border bg-white dark:bg-slate-900 border-emerald-100 dark:border-slate-700">
                  <button
                    onClick={() => setSel(s)}
                    className="text-left block w-full bg-transparent"
                  >
                    <div className="font-semibold">{s.stockSymbol}</div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-400">
                      P/E: {s.parameters?.priceEarningsRatio}
                    </div>
                  </button>
                </div>

                <div className="mt-2 flex justify-end">
                  <button
                    onClick={() => onToggleWatch(s.stockSymbol)}
                    className={cn(
                      "inline-flex items-center gap-1.5 text-xs rounded-xl px-2 py-1 border transition",
                      "bg-white text-black border-emerald-300 hover:bg-emerald-50",
                      "dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700 dark:hover:bg-slate-700"
                    )}
                  >
                    {watched ? (
                      <>
                        <BookmarkCheck className="h-3.5 w-3.5" />
                        <span>Added to watchlist</span>
                      </>
                    ) : (
                      <>
                        <BookmarkPlus className="h-3.5 w-3.5" />
                        <span>Watch</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </Glass>

      {/* Right side – one scrollable panel */}
      <div className="xl:col-span-2 min-h-0 h-full">
        <Glass className="h-full min-h-0 overflow-auto">
          <CombinedStockPanel stock={sel} allStocks={all} />
        </Glass>
      </div>

      {boom && (
        <Confetti numberOfPieces={220} recycle={false} gravity={0.25} />
      )}
    </div>
  );
}

function StockResult({ stock }) {
  const { toggle, has } = useWatchlist();
  const out = evaluateStockRules(stock);
  const watched = has(out.stockSymbol);

  const onToggle = () => toggle(out.stockSymbol);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-emerald-600" />
          <h3 className="font-bold">{out.stockSymbol} — Summary</h3>
        </div>
        <div className="flex gap-2 items-center">
          <button
            onClick={onToggle}
            className={cn(
              "inline-flex items-center gap-2 rounded-2xl border px-3 py-1.5 text-sm",
              "border-emerald-300 bg-white hover:bg-emerald-50 text-black",
              "dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-100"
            )}
          >
            {watched ? (
              <>
                <BookmarkCheck className="h-4 w-4" /> Added to watchlist
              </>
            ) : (
              <>
                <BookmarkPlus className="h-4 w-4" /> Add to watchlist
              </>
            )}
          </button>
          <Pill
            icon={Gauge}
            label="Overall"
            value={`${out.overall}/100`}
            tone={out.overall >= 75 ? "emerald" : out.overall >= 55 ? "amber" : "rose"}
          />
          <Pill icon={BarChart3} label="Quality" value={`${out.quality}/100`} />
          <Pill icon={Layers} label="Value" value={`${out.value}/100`} tone="amber" />
        </div>
      </div>

      <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
        {out.summary}
      </p>

      <div className="grid md:grid-cols-2 gap-3">
        {Object.entries(out.feedback).map(([k, v]) => (
          <motion.div
            key={k}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-emerald-200 bg-white p-3 text-sm dark:bg-slate-900 dark:border-slate-700"
          >
            <div className="font-semibold mb-1">{k}</div>
            <div className="text-slate-600 dark:text-slate-300">{v}</div>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <Radial value={out.overall} label="Overall" />
        <Radial value={out.quality} label="Quality" />
        <Radial value={out.value} label="Value" />
      </div>
    </div>
  );
}

function ScoreCharts({ allStocks, selectedSymbol }) {
  const data = useMemo(() => {
    if (!allStocks?.length) return { overall: [], quality: [], value: [] };
    const rows = allStocks.map((s) => {
      const r = evaluateStockRules(s);
      return { symbol: r.stockSymbol, overall: r.overall, quality: r.quality, value: r.value };
    });
    const byOverall = [...rows].sort((a, b) => b.overall - a.overall);
    const byQuality = [...rows].sort((a, b) => b.quality - a.quality);
    const byValue   = [...rows].sort((a, b) => b.value - a.value);
    return { overall: byOverall, quality: byQuality, value: byValue };
  }, [allStocks]);

  const colorFor = (metricValue, isSelected) => {
    if (isSelected) return "#4f46e5";
    if (metricValue >= 75) return "rgba(34,197,94,0.9)";
    if (metricValue >= 55) return "rgba(245,158,11,0.9)";
    return "rgba(239,68,68,0.9)";
  };

  const axisTick = { fontSize: 11 };

  const CustomTooltip = ({ active, payload, label, items }) => {
    if (!active || !payload?.length) return null;
    const rank = Math.max(0, items.findIndex((it) => it.symbol === label)) + 1;
    const value = payload[0]?.value;
    return (
      <div className="rounded-lg border bg-white/95 p-2 text-xs shadow-md dark:bg-slate-800/95 dark:border-slate-700">
        <div className="font-semibold mb-1">No. {rank}</div>
        <div>Symbol: <b>{label}</b></div>
        <div>Score: <b>{value}/100</b></div>
      </div>
    );
  };

  const ChartBlock = ({ title, items, metric }) => (
    <div className="rounded-2xl border p-4 bg-white dark:bg-slate-900 dark:border-slate-700">
      <div className="flex items-center gap-2 mb-2">
        <BarChart3 className="h-4 w-4 text-indigo-600" />
        <div className="font-semibold">{title}</div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <RBarChart data={items}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="symbol" tick={axisTick} interval={0} angle={-45} textAnchor="end" height={70} />
            <YAxis domain={[0, 100]} tick={axisTick} />
            <RTooltip content={<CustomTooltip items={items} />} />
            <Bar dataKey={metric} radius={[8, 8, 0, 0]}>
              {items.map((r, i) => (
                <Cell
                  key={`${metric}-${r.symbol}-${i}`}
                  fill={colorFor(r[metric], r.symbol === selectedSymbol)}
                />
              ))}
            </Bar>
          </RBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  if (!allStocks?.length) return null;

  return (
    <div className="space-y-4">
      <ChartBlock title="Overall Score Ranking" items={data.overall} metric="overall" />
      <ChartBlock title="Quality Score Ranking" items={data.quality} metric="quality" />
      <ChartBlock title="Value Score Ranking" items={data.value} metric="value" />
    </div>
  );
}

function CombinedStockPanel({ stock, allStocks }) {
  if (!stock) {
    return (
      <div className="h-full flex items-center justify-center text-slate-500">
        Select a stock to analyze.
      </div>
    );
  }
  const evaluated = evaluateStockRules(stock);

  return (
    <div className="space-y-6 pb-4">
   
      <StockResult stock={stock} />

      <div className="rounded-2xl border p-4 bg-white dark:bg-slate-900 dark:border-slate-700">
        <div className="flex items-center gap-2 mb-2">
          <Info className="h-4 w-4 text-indigo-600" />
        </div>
        <pre className="text-xs overflow-auto rounded-xl p-3 bg-slate-900 text-emerald-200 shadow-inner">
          {JSON.stringify(evaluated, null, 2)}
        </pre>
      </div>

      <ScoreCharts allStocks={allStocks} selectedSymbol={stock?.stockSymbol} />
    </div>
  );
}

function WatchlistPage() {
  const toast = useToast();
  const { list, has, remove } = useWatchlist();

  const [all, setAll] = useState([]);
  const [sel, setSel] = useState(null);

  useEffect(() => {
    fetchJSON("/StockTickerSymbols.json").then(setAll).catch(console.error);
  }, []);

  const watchStocks = useMemo(
    () => all.filter((s) => has(s.stockSymbol)),
    [all, has, list]
  );

  const handleRemove = (e, symbol) => {
    e.stopPropagation();
    remove(symbol);
    if (sel?.stockSymbol === symbol) setSel(null);
    toast.addToast("Removed from Watchlist", symbol, "warn");
  };

  return (
    <div className="grid xl:grid-cols-3 gap-6 h-full min-h-0">
      <Glass className="xl:col-span-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-3">
          <div className="font-semibold flex items-center gap-2">
            <BookmarkPlus className="h-4 w-4 text-indigo-600" /> Watchlisted
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {watchStocks.length} items
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-auto grid grid-cols-2 md:grid-cols-3 xl:grid-cols-2 gap-2">
          {watchStocks.map((s, idx) => (
            <div
              key={s.stockSymbol + idx}
              onClick={() => setSel(s)}
              className="text-left rounded-2xl border px-3 py-2 bg-white text-black border-emerald-300 hover:bg-emerald-50 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700"
            >
          
              <div className="rounded-xl p-3 border bg-white dark:bg-slate-900 border-emerald-100 dark:border-slate-700">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold">{s.stockSymbol}</div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-400">
                      P/E: {s.parameters?.priceEarningsRatio}
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleRemove(e, s.stockSymbol)}
                    className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-md border border-emerald-300 bg-white text-black hover:bg-emerald-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                    title="Remove from watchlist"
                  >
                    <X className="h-3.5 w-3.5" />
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}

          {watchStocks.length === 0 && (
            <div className="text-sm text-slate-500 dark:text-slate-400">
              No items yet. Add from Stock Evaluator.
            </div>
          )}
        </div>
      </Glass>

      <div className="xl:col-span-2 min-h-0 h-full">
        <Glass className="h-full min-h-0 overflow-auto">
          {sel ? (
            <CombinedStockPanel stock={sel} allStocks={all} />
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500">
              Choose a watchlisted stock.
            </div>
          )}
        </Glass>
      </div>
    </div>
  );
}

function useWatchlist() {
  const [list, setList] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("watchlist") || "[]");
    } catch {
      return [];
    }
  });
  useEffect(() => {
    localStorage.setItem("watchlist", JSON.stringify(list));
  }, [list]);

  const add = (symbol) =>
    setList((l) => (l.includes(symbol) ? l : [...l, symbol]));
  const remove = (symbol) =>
    setList((l) => l.filter((x) => x !== symbol));
  const toggle = (symbol) =>
    setList((l) =>
      l.includes(symbol) ? l.filter((x) => x !== symbol) : [...l, symbol]
    );
  const has = (symbol) => list.includes(symbol);

  return { list, add, remove, toggle, has };
}

const SECTOR_ALIASES = {
  IT: "Technology",
  Banking: "Financials",
  FMCG: "Consumer Staples",
  Pharma: "Healthcare",
  Healthcare: "Healthcare",
};
function toTitle(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function riskFromScores(finalScore, overlapScore, sectorScore) {
  if (finalScore >= 75 && overlapScore >= 70 && sectorScore >= 70)
    return "Low";
  if (finalScore >= 55) return "Moderate";
  return "High";
}
function inferTraderType(sectorWeights) {
  const tech = sectorWeights.IT || sectorWeights.Technology || 0;
  const fin =
    sectorWeights.Banking || sectorWeights.Financials || 0;
  if (tech > fin && tech >= 0.35) return "Growth Investor";
  if (fin >= 0.35) return "Income/Financials Tilt";
  return "Balanced";
}
function buildPortfolioSpecOutput(client) {
  const calc = analyzePortfolio(client, 0.5);
  const sectorDiversification = {};
  Object.entries(calc.sectors).forEach(([k, v]) => {
    const name = SECTOR_ALIASES[k] || toTitle(k);
    sectorDiversification[name] = Math.round(v * 1000) / 10;
  });
  const riskLevel = riskFromScores(
    calc.finalScore,
    calc.overlapScore,
    calc.sectorScore
  );
  const hasCS =
    Object.keys(sectorDiversification).includes("Consumer Staples");
  const hasUtilities =
    Object.keys(sectorDiversification).includes("Utilities");
  const possibleDiversification = [];
  if (!hasCS)
    possibleDiversification.push({
      sector: "Consumer Staples",
      recommendation:
        "Consider adding stocks or funds in the Consumer Staples sector to balance your portfolio.",
    });
  if (!hasUtilities)
    possibleDiversification.push({
      sector: "Utilities",
      recommendation:
        "Investing in Utilities can provide stable dividends and lower volatility.",
    });
  const traderType = inferTraderType(calc.sectors);
  const summary = `Portfolio value ₹${calc.totalValue.toLocaleString()} with diversified exposure. Risk level ${riskLevel}. Consider ${
    possibleDiversification.map((x) => x.sector).join(" and ") ||
    "maintaining current mix"
  }.`;
  return {
    portfolioAnalysis: {
      totalValue: calc.totalValue,
      sectorDiversification,
      riskLevel,
      performance: {
        oneYearReturn: null,
        threeYearReturn: null,
        fiveYearReturn: null,
      },
    },
    possibleDiversification,
    traderType,
    summary,
  };
}

function OverlapTable({ matrix }) {
  if (!matrix) return null;
  return (
    <table className="min-w-full text-sm">
      <thead>
        <tr>
          {matrix.map((_, i) => (
            <th
              key={i}
              className="px-3 py-2 text-left font-semibold text-slate-600 dark:text-slate-300"
            >
              F{i + 1}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {matrix.map((row, i) => (
          <tr key={i}>
            {row.map((v, j) => {
              const pct = Math.round(v * 100);
              const bg = i === j ? "bg-emerald-50 dark:bg-emerald-500/15" : "";
              return (
                <td
                  key={j}
                  className={cn(
                    "px-3 py-2 border border-slate-100 dark:border-slate-800",
                    bg
                  )}
                >
                  <div className="h-6 w-28 rounded-md bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full"
                      style={{
                        width: `${pct}%`,
                        background:
                          "linear-gradient(90deg, rgb(79,70,229), rgb(56,189,248))",
                      }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                    {pct}%
                  </div>
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function PortfolioResult({ client }) {
  const out = analyzePortfolio(client, 0.5);

  const sectorData = Object.entries(out.sectors).map(([k, v]) => ({
    name: SECTOR_ALIASES[k] || toTitle(k),
    value: round2(v * 100),
  }));

  const aggHoldings = {};
  client.funds.forEach((f) => {
    const w = f.amount / out.totalValue; 
    Object.entries(f.holdings || {}).forEach(([stock, p]) => {
      aggHoldings[stock] = (aggHoldings[stock] || 0) + w * p;
    });
  });
  const holdingsData = Object.entries(aggHoldings)
    .map(([stock, pct]) => ({
      name: stock,
      value: round2(pct * 100),
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 14);

  const bright = [
    "#4f46e5",
    "#22c55e",
    "#f59e0b",
    "#ef4444",
    "#06b6d4",
    "#a855f7",
    "#84cc16",
    "#f97316",
    "#14b8a6",
    "#e11d48",
    "#3b82f6",
    "#0ea5e9",
    "#10b981",
    "#f43f5e",
  ];

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-emerald-200 p-4 bg-white dark:bg-slate-900 dark:border-slate-700">
        <div className="flex items-center gap-2 mb-2">
          <Gauge className="h-4 w-4 text-indigo-600" />
          <div className="font-semibold">Final Diversification</div>
        </div>
        <div className="flex items-center gap-6">
          <Radial value={out.finalScore} label="Final" />
          <div className="flex-1 grid grid-cols-2 gap-2 text-sm">
            <Pill
              icon={GitBranch}
              label="Overlap"
              value={`${out.overlapScore}`}
              tone={out.overlapScore >= 65 ? "emerald" : "amber"}
            />
            <Pill
              icon={Layers}
              label="Sector"
              value={`${out.sectorScore}`}
              tone={out.sectorScore >= 65 ? "emerald" : "amber"}
            />
          </div>
        </div>
      </div>

      {/* Pies only (sectors + holdings) with clean legend + % tooltip */}
      <div className="grid md:grid-cols-2 gap-4">
        <Glass>
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="h-4 w-4 text-indigo-600" />
            <div className="font-semibold">Sector Mix</div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sectorData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={false}
                  labelLine={false}
                  paddingAngle={1}
                >
                  {sectorData.map((_, idx) => (
                    <Cell
                      key={idx}
                      fill={bright[idx % bright.length]}
                    />
                  ))}
                </Pie>
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ fontSize: 12 }}
                />
                <RTooltip
                  formatter={(v) => [`${v}%`, ""]}
                  separator=""
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Glass>

        <Glass>
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="h-4 w-4 text-indigo-600" />
            <div className="font-semibold">Holdings (Stocks)</div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={holdingsData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={false}
                  labelLine={false}
                  paddingAngle={1}
                >
                  {holdingsData.map((_, idx) => (
                    <Cell
                      key={idx}
                      fill={bright[(idx * 41) % bright.length]}
                    />
                  ))}
                </Pie>
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ fontSize: 12 }}
                />
                <RTooltip
                  formatter={(v) => [`${v}%`, ""]}
                  separator=""
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Glass>
      </div>

      <div className="rounded-2xl border border-emerald-200 p-4 bg-white dark:bg-slate-900 dark:border-slate-700">
        <div className="flex items-center gap-2 mb-3">
          <Layers className="h-4 w-4 text-indigo-600" />
          <div className="font-semibold">Findings & Recommendations</div>
        </div>
        <ul className="space-y-2 text-sm">
          {out.findings.map((t, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-slate-700 dark:text-slate-200"
            >
              <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-600" />
              {t}
            </li>
          ))}
          {out.recommendations.map((t, i) => (
            <li
              key={"r" + i}
              className="flex items-start gap-2 text-slate-700 dark:text-slate-200"
            >
              <CheckCircle2 className="h-4 w-4 mt-0.5 text-emerald-600" />
              {t}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-emerald-200 p-4 bg-white overflow-x-auto dark:bg-slate-900 dark:border-slate-700">
        <div className="flex items-center gap-2 mb-2">
          <GitBranch className="h-4 w-4 text-indigo-600" />
          <div className="font-semibold">Pairwise Overlap Matrix</div>
        </div>
        <OverlapTable matrix={out.overlapsMatrix} />
      </div>
    </div>
  );
}

function PortfolioPage() {
  const [clients, setClients] = useState([]);
  const [sel, setSel] = useState(null);
  const [boom, setBoom] = useState(false);

  useEffect(() => {
    fetchJSON("/ClientPortfolio.json")
      .then(setClients)
      .catch(console.error);
  }, []);
  useEffect(() => {
    if (sel) {
      const out = analyzePortfolio(sel, 0.5);
      setBoom(out.finalScore >= 70);
    }
  }, [sel]);

  return (
    <div className="grid xl:grid-cols-3 gap-6 h-full min-h-0">

      <Glass className="xl:col-span-1 flex flex-col min-h-0">
        <div className="flex items-center gap-2 mb-3">
          <Search className="h-4 w-4 text-indigo-600" />
          <div className="font-semibold">Clients</div>
        </div>
        <div className="flex-1 min-h-0 overflow-auto grid grid-cols-1 gap-2">
          {clients.map((c) => (
            <button
              key={c.clientId}
              onClick={() => setSel(c)}
              className={cn(
                "text-left rounded-2xl border px-3 py-2 hover:shadow-md transition",
                sel?.clientId === c.clientId
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white/70 dark:bg-slate-800 border-emerald-200 dark:border-slate-700"
              )}
            >
              <div className="font-semibold">{c.clientId}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {c.currency} · {c.funds?.length || 0} funds
              </div>
            </button>
          ))}
        </div>
      </Glass>

      <div className="xl:col-span-2 h-full min-h-0">
        <Glass className="h-full min-h-0 overflow-auto">
          <CombinedPortfolioPanel client={sel} />
        </Glass>
      </div>

      {boom && (
        <Confetti numberOfPieces={260} recycle={false} gravity={0.25} />
      )}
    </div>
  );
}

function CombinedPortfolioPanel({ client }) {
  if (!client) {
    return (
      <div className="h-full flex items-center justify-center text-slate-500">
        Select a client portfolio.
      </div>
    );
  }

  const spec = buildPortfolioSpecOutput(client);

  const downloadJSON = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(spec, null, 2));
    const dl = document.createElement("a");
    dl.setAttribute("href", dataStr);
    dl.setAttribute("download", `${client.clientId}_portfolio.json`);
    dl.click();
  };

  return (
    <div className="space-y-6 pb-6">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg">
          Portfolio Analysis — {client.clientId}
        </h3>
        <button
          onClick={downloadJSON}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl shadow hover:bg-indigo-700"
        >
          <Download className="h-4 w-4" /> Download JSON
        </button>
      </div>

      <PortfolioResult client={client} />

      <div className="rounded-2xl border p-4 bg-white dark:bg-slate-900 dark:border-slate-700">
        <div className="flex items-center gap-2 mb-2">
          <Info className="h-4 w-4 text-indigo-600" />
          <div className="font-semibold">
            Portfolio Analyzer — JSON (spec)
          </div>
        </div>
        <pre className="text-xs overflow-auto rounded-xl p-3 bg-slate-900 text-emerald-200 shadow-inner">
          {JSON.stringify(spec, null, 2)}
        </pre>
      </div>
    </div>
  );
}


function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [inputs, setInputs] = useState({
    debtToEquityRatio: null,
    returnOnEquity: null,
    returnOnAssets: null,
    bookValuePerShare: null,
  });
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hi! I can recommend stocks based on four metrics. Ready?" },
  ]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);

  const ORDER = [
    { key: "debtToEquityRatio", label: "Debt-to-Equity Ratio (e.g., 0.8)" },
    { key: "returnOnEquity",    label: "Return on Equity (decimal, e.g., 0.15)" },
    { key: "returnOnAssets",    label: "Return on Assets (decimal, e.g., 0.09)" },
    { key: "bookValuePerShare", label: "Book Value per Share (e.g., 23.4)" },
  ];

  useEffect(() => {
    if (open && step === 0 && messages.length === 1) {
      setMessages((m) => [
        ...m,
        { sender: "bot", text: `Please enter ${ORDER[0].label}` },
      ]);
    }
  }, [open]); 

  const isNumber = (s) => {
    if (typeof s === "number") return Number.isFinite(s);
    if (typeof s !== "string") return false;
    const n = parseFloat(s.trim());
    return Number.isFinite(n);
  };

  const askNextOrSubmit = async () => {
    if (step < ORDER.length - 1) {
      const next = ORDER[step + 1];
      setMessages((m) => [...m, { sender: "bot", text: `Please enter ${next.label}` }]);
      setStep((s) => s + 1);
      return;
    }

    setLoading(true);
    setMessages((m) => [...m, { sender: "bot", text: "Working on it..." }]);
    try {
      const res = await fetch("http://127.0.0.1:8000/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...inputs, top_n: 10 }),
      });
      const data = await res.json();
      setLoading(false);

      if (data?.error) {
        setMessages((m) => [...m, { sender: "bot", text: `Error: ${data.error}` }]);
        return;
      }

      setMessages((m) => [
        ...m,
        {
          sender: "bot",
          text: "Here are the closest matches:",
          results: (data?.results || []).map((r, i) => ({
            rank: i + 1,
            stockSymbol: r.stockSymbol,
            similarity: r.similarity,
            note: r.note,
            evaluation: r.evaluation,
          })),
          criteria: data?.criteria,
        },
      ]);
    } catch (e) {
      setLoading(false);
      setMessages((m) => [
        ...m,
        { sender: "bot", text: "Sorry, I couldn’t reach the server." },
      ]);
    }
  };

  const onSend = () => {
    const text = draft.trim();
    if (!text) return;
    setMessages((m) => [...m, { sender: "user", text }]);
    setDraft("");

    if (!isNumber(text)) {
      setMessages((m) => [
        ...m,
        { sender: "bot", text: "Sorry, incorrect input format!" },
        { sender: "bot", text: `Please enter ${ORDER[step].label}` },
      ]);
      return;
    }

    const key = ORDER[step].key;
    const val = parseFloat(text);
    setInputs((inp) => ({ ...inp, [key]: val }));

    askNextOrSubmit();
  };

  const toggle = () => {
    setOpen((o) => {
      const next = !o;
      if (!next) {
        setStep(0);
        setInputs({
          debtToEquityRatio: null,
          returnOnEquity: null,
          returnOnAssets: null,
          bookValuePerShare: null,
        });
        setMessages([{ sender: "bot", text: "Hi! I can recommend stocks based on four metrics. Ready?" }]);
        setDraft("");
        setLoading(false);
      }
      return next;
    });
  };

  return (
    <>
      <button
        onClick={toggle}
        className={cn(
          "fixed bottom-5 right-5 z-[70] inline-flex items-center gap-2 px-4 py-2 rounded-2xl shadow-lg",
          "bg-emerald-600 text-white hover:bg-emerald-700",
          "dark:bg-indigo-600 dark:hover:bg-indigo-700"
        )}
      >
        💬 Chat With Us!
      </button>

      {open && (
        <div
          className={cn(
            "fixed bottom-20 right-5 z-[70] w-[360px] max-h-[70vh] rounded-2xl overflow-hidden shadow-2xl",
            "border bg-white/95 border-emerald-200 backdrop-blur-xl",
            "dark:bg-slate-900/95 dark:border-slate-700"
          )}
        >
          <div className="px-4 py-3 border-b border-emerald-200 dark:border-slate-700 flex items-center justify-between">
            <div className="font-semibold">Stock Recommender</div>
            <button
              onClick={toggle}
              className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-3 space-y-2 overflow-auto max-h-[48vh]">
            {messages.map((m, idx) => (
              <div key={idx} className={cn("text-sm", m.sender === "user" ? "text-right" : "text-left")}>
                <div
                  className={cn(
                    "inline-block px-3 py-2 rounded-xl",
                    m.sender === "user"
                      ? "bg-emerald-600 text-white dark:bg-indigo-600"
                      : "bg-emerald-50 text-emerald-900 border border-emerald-200 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700"
                  )}
                >
                  {m.text}
                </div>

                {m.results && (
                  <div className="mt-2">
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                      Criteria:&nbsp;
                      {Object.entries(m.criteria || {})
                        .map(([k, v]) => `${k}=${v}`)
                        .join(", ")}
                    </div>
                    <div className="space-y-2">
                      {m.results.map((r) => (
                        <div
                          key={`${r.rank}-${r.stockSymbol}`}
                          className="rounded-xl border p-2 bg-white/90 dark:bg-slate-800 dark:border-slate-700"
                        >
                          <div className="flex items-center justify-between">
                            <div className="font-semibold">
                              #{r.rank} — {r.stockSymbol}
                            </div>
                            <div className="text-xs">Similarity: {r.similarity}%</div>
                          </div>
                          {r.note && (
                            <div className="text-xs text-amber-600 mt-1">{r.note}</div>
                          )}
                          {r.evaluation && (
                            <div className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                              {typeof r.evaluation === "object"
                                ? Object.entries(r.evaluation)
                                    .filter(([k]) =>
                                      ["overall", "quality", "value"].includes(k)
                                    )
                                    .map(([k, v]) => `${k}: ${v}`)
                                    .join(" · ")
                                : String(r.evaluation)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-emerald-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onSend()}
                placeholder={
                  loading
                    ? "Working..."
                    : step < ORDER.length
                    ? `Type a number for: ${ORDER[step].label}`
                    : "Type to restart…"
                }
                disabled={loading}
                className="flex-1 rounded-xl px-3 py-2 border border-emerald-200 bg-white dark:bg-slate-900 dark:border-slate-700"
              />
              <button
                onClick={onSend}
                disabled={loading}
                className={cn(
                  "px-3 py-2 rounded-xl text-white",
                  "bg-emerald-600 hover:bg-emerald-700",
                  "disabled:opacity-60",
                  "dark:bg-indigo-600 dark:hover:bg-indigo-700"
                )}
              >
                Send
              </button>
            </div>
            <div className="text-[11px] mt-1 text-slate-500 dark:text-slate-400">
              Please enter numbers only. If you enter anything else, I’ll reply:
              <em> “Sorry, incorrect input format!”</em>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ---------------------- App ---------------------- */
export default function App() {
  return (
    <BrowserRouter>
      <Shell>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/stocks" element={<StocksPage />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
          <Route path="/watchlist" element={<WatchlistPage />} />
        </Routes>
      </Shell>
    </BrowserRouter>
  );
}
