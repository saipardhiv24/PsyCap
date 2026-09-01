import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import PageLayout from "../components/layout/PageLayout.jsx";
import api from "../utils/api.js";
import {
  Card,
  Badge,
  DeltaPill,
  Skeleton,
  EmptyState,
  Button,
  cx,
} from "../components/ui/primitives.jsx";
import {
  BrainIcon,
  SparkIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  SendIcon,
  WalletIcon,
  PortfolioIcon,
  CheckIcon,
  ShieldIcon,
  TransactionsIcon,
} from "../components/ui/icons.jsx";
import { formatCurrency, formatPercent, formatNumber } from "../utils/format.js";

export default function MentorPage() {
  const [portfolio, setPortfolio] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Q&A State
  const [query, setQuery] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const chatBottomRef = useRef(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [portfolioRes, transactionsRes] = await Promise.all([
        api.get("/portfolio"),
        api.get("/transactions"),
      ]);
      const pData = portfolioRes.data?.data?.portfolio || null;
      const tData = transactionsRes.data?.data?.transactions || [];

      setPortfolio(pData);
      setTransactions(tData);

      // Initialize AI Mentor welcome response based on live portfolio
      if (pData && (pData.holdings?.length > 0 || tData.length > 0)) {
        const initialAiMsg = generateInitialMentorAnalysis(pData, tData);
        setChatHistory([
          {
            role: "assistant",
            text: initialAiMsg,
            time: "Just now",
          },
        ]);
      }
    } catch (error) {
      console.error("Error loading AI mentor data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Derived Analytics
  const holdings = portfolio?.holdings ?? [];
  const hasTradingActivity = holdings.length > 0 || transactions.length > 0;

  const analytics = useMemo(() => {
    if (!portfolio) return null;

    const accountValue = portfolio.account_value || 100000;
    const cashBalance = portfolio.cash_balance || 100000;
    const portfolioValue = portfolio.portfolio_value || 0;
    const totalPL = portfolio.total_pl || 0;
    const returnPercent = portfolio.return_percent || 0;

    const cashPercent = (cashBalance / accountValue) * 100;
    const investedPercent = (portfolioValue / accountValue) * 100;

    // Largest position concentration
    let largestPosition = null;
    let largestPositionWeight = 0;
    if (holdings.length > 0 && portfolioValue > 0) {
      const sorted = [...holdings].sort(
        (a, b) => (b.current_value || 0) - (a.current_value || 0),
      );
      largestPosition = sorted[0];
      largestPositionWeight = ((largestPosition.current_value || 0) / portfolioValue) * 100;
    }

    // Health Score calculation
    let healthScore = 70;
    let healthLabel = "Balanced Risk";
    let healthTone = "primary";

    if (holdings.length >= 3 && cashPercent >= 15 && cashPercent <= 60 && largestPositionWeight < 50) {
      healthScore = 88;
      healthLabel = "Optimal Health";
      healthTone = "positive";
    } else if (largestPositionWeight > 65) {
      healthScore = 58;
      healthLabel = "High Concentration Risk";
      healthTone = "negative";
    } else if (cashPercent > 80) {
      healthScore = 75;
      healthLabel = "Conservative / High Cash";
      healthTone = "neutral";
    }

    // Transaction stats
    const buyCount = transactions.filter(
      (t) => String(t.transaction_type).toUpperCase() === "BUY",
    ).length;
    const sellCount = transactions.filter(
      (t) => String(t.transaction_type).toUpperCase() === "SELL",
    ).length;

    return {
      accountValue,
      cashBalance,
      portfolioValue,
      totalPL,
      returnPercent,
      cashPercent,
      investedPercent,
      largestPosition,
      largestPositionWeight,
      healthScore,
      healthLabel,
      healthTone,
      buyCount,
      sellCount,
      totalTrades: transactions.length,
    };
  }, [portfolio, holdings, transactions]);

  // Handle Q&A Submission
  const handleAskMentor = (questionText) => {
    const prompt = questionText || query;
    if (!prompt.trim() || isAnalyzing) return;

    const userMsg = { role: "user", text: prompt.trim(), time: "Just now" };
    setChatHistory((prev) => [...prev, userMsg]);
    setQuery("");
    setIsAnalyzing(true);

    setTimeout(() => {
      const aiReply = generateAiReply(prompt, portfolio, transactions, analytics);
      setChatHistory((prev) => [
        ...prev,
        { role: "assistant", text: aiReply, time: "Just now" },
      ]);
      setIsAnalyzing(false);
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 600);
  };

  return (
    <PageLayout
      title="AI Mentor"
      subtitle="Understand your simulated trading behavior and portfolio analytics"
    >
      <div className="space-y-6 animate-fade-in">
        {/* Header Title with AI Indicator */}
        <div className="flex items-center justify-between border-b border-border/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm">
              <BrainIcon className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  PSYCAP AI MENTOR
                </span>
                <Badge tone="primary" className="text-[10px] py-0.5 px-2 font-bold">
                  LIVE ANALYTICS
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Actionable feedback derived from your real paper-trading history.
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-2xl" />
              ))}
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <Skeleton className="h-64 rounded-2xl" />
              <Skeleton className="h-64 rounded-2xl" />
            </div>
          </div>
        ) : !hasTradingActivity ? (
          /* Professional Empty State */
          <Card className="p-10">
            <EmptyState
              icon={BrainIcon}
              title="No trading activity yet"
              description="Complete a simulated trade to give your AI Mentor more information about your trading behavior."
              action={
                <Button as="link" to="/stocks" variant="primary" size="md">
                  Explore Markets
                </Button>
              }
            />
          </Card>
        ) : (
          <>
            {/* 1. Portfolio Snapshot Metric Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="p-5">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-semibold">Account Value</span>
                  <WalletIcon className="h-4 w-4" />
                </div>
                <div className="mt-2 text-2xl font-extrabold tracking-tight text-foreground tabular">
                  {formatCurrency(analytics?.accountValue)}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Cash: {formatCurrency(analytics?.cashBalance)}
                </div>
              </Card>

              <Card className="p-5">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-semibold">Total P/L</span>
                  <PortfolioIcon className="h-4 w-4" />
                </div>
                <div
                  className={cx(
                    "mt-2 text-2xl font-extrabold tracking-tight tabular",
                    (analytics?.totalPL || 0) >= 0
                      ? "text-positive"
                      : "text-negative",
                  )}
                >
                  {formatCurrency(analytics?.totalPL)}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">All-time profit & loss</div>
              </Card>

              <Card className="p-5">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-semibold">Return %</span>
                  <SparkIcon className="h-4 w-4" />
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className={cx(
                      "text-2xl font-extrabold tracking-tight tabular",
                      (analytics?.returnPercent || 0) >= 0
                        ? "text-positive"
                        : "text-negative",
                    )}
                  >
                    {formatPercent(analytics?.returnPercent, { withSign: true })}
                  </span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">vs initial $100k capital</div>
              </Card>

              <Card className="p-5">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-semibold">Health & Risk</span>
                  <ShieldIcon className="h-4 w-4" />
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-2xl font-extrabold tracking-tight text-foreground tabular">
                    {analytics?.healthScore}/100
                  </span>
                  <Badge tone={analytics?.healthTone}>
                    {analytics?.healthLabel}
                  </Badge>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">Portfolio risk evaluation</div>
              </Card>
            </div>

            {/* 2. Main Content Bento Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Portfolio Allocation Overview */}
              <Card className="p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h3 className="text-base font-bold text-foreground">
                    Portfolio Overview
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {holdings.length} position{holdings.length === 1 ? "" : "s"}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-muted-foreground">Invested Assets</span>
                    <span className="text-foreground tabular">
                      {formatCurrency(analytics?.portfolioValue)} ({formatPercent(analytics?.investedPercent)})
                    </span>
                  </div>
                  {/* Allocation Bar */}
                  <div className="h-3.5 w-full overflow-hidden rounded-full bg-muted flex">
                    <div
                      className="bg-primary transition-all duration-500"
                      style={{ width: `${Math.min(Math.max(analytics?.investedPercent || 0, 0), 100)}%` }}
                    />
                    <div
                      className="bg-muted-foreground/30 transition-all duration-500"
                      style={{ width: `${Math.min(Math.max(analytics?.cashPercent || 0, 0), 100)}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                    <div className="rounded-xl border border-border bg-muted/30 p-3">
                      <div className="text-muted-foreground font-medium">Available Cash</div>
                      <div className="mt-1 font-bold text-foreground tabular">
                        {formatCurrency(analytics?.cashBalance)}
                      </div>
                    </div>
                    <div className="rounded-xl border border-border bg-muted/30 p-3">
                      <div className="text-muted-foreground font-medium">Invested Equity</div>
                      <div className="mt-1 font-bold text-foreground tabular">
                        {formatCurrency(analytics?.portfolioValue)}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Trading Behavior Analysis */}
              <Card className="p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h3 className="text-base font-bold text-foreground">
                    Trading Behavior
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {analytics?.totalTrades} total trade{analytics?.totalTrades === 1 ? "" : "s"}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-xl border border-border bg-muted/30 p-3">
                    <div className="text-xs text-muted-foreground font-medium">Buys</div>
                    <div className="mt-1 text-lg font-bold text-positive tabular">
                      {analytics?.buyCount}
                    </div>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/30 p-3">
                    <div className="text-xs text-muted-foreground font-medium">Sells</div>
                    <div className="mt-1 text-lg font-bold text-negative tabular">
                      {analytics?.sellCount}
                    </div>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/30 p-3">
                    <div className="text-xs text-muted-foreground font-medium">Buy/Sell Ratio</div>
                    <div className="mt-1 text-lg font-bold text-foreground tabular">
                      {analytics?.sellCount > 0
                        ? (analytics?.buyCount / analytics?.sellCount).toFixed(1)
                        : `${analytics?.buyCount}:0`}
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-xs space-y-1">
                  <div className="font-bold text-primary flex items-center gap-1.5">
                    <BrainIcon className="h-4 w-4" />
                    Behavioral Observation
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    {analytics?.totalTrades <= 3
                      ? "You are building initial positions thoughtfully. Consider pacing purchases across multiple market dips."
                      : analytics?.buyCount > analytics?.sellCount * 2
                        ? "Accumulation bias detected: You buy frequently but sell rarely. Remember to set price targets for taking profits."
                        : "Balanced trading activity: You execute both buy and sell orders selectively based on market movements."}
                  </p>
                </div>
              </Card>

              {/* Diversification Insights */}
              <Card className="p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h3 className="text-base font-bold text-foreground">
                    Diversification
                  </h3>
                  <Badge tone={analytics?.largestPositionWeight > 50 ? "negative" : "positive"}>
                    {analytics?.largestPositionWeight > 50 ? "Concentrated" : "Well Distributed"}
                  </Badge>
                </div>

                <div className="space-y-3 text-xs">
                  {analytics?.largestPosition ? (
                    <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 p-3">
                      <div>
                        <div className="text-muted-foreground font-medium">Largest Single Position</div>
                        <div className="font-bold text-foreground mt-0.5">
                          {analytics.largestPosition.symbol} ({analytics.largestPosition.company_name})
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-foreground tabular">
                          {formatPercent(analytics.largestPositionWeight)}
                        </div>
                        <div className="text-muted-foreground text-[11px]">of equity</div>
                      </div>
                    </div>
                  ) : null}

                  <p className="text-muted-foreground leading-relaxed">
                    {holdings.length === 1
                      ? "Your invested equity is 100% concentrated in 1 stock. Adding 2-4 distinct companies across different sectors reduces single-stock risk."
                      : holdings.length >= 3
                        ? `You hold ${holdings.length} distinct stocks. Your allocation is distributed, lowering portfolio volatility.`
                        : `You hold ${holdings.length} positions. Spreading capital into 3-5 positions provides healthy risk mitigation.`}
                  </p>
                </div>
              </Card>

              {/* Performance Insights */}
              <Card className="p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h3 className="text-base font-bold text-foreground">
                    Performance Insights
                  </h3>
                  <span className="text-xs text-muted-foreground">Unrealized P/L</span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-border bg-muted/30 p-3">
                      <div className="text-muted-foreground font-medium">Profitable Positions</div>
                      <div className="mt-1 font-bold text-positive text-base tabular">
                        {holdings.filter((h) => (h.unrealized_pl || 0) >= 0).length} / {holdings.length}
                      </div>
                    </div>
                    <div className="rounded-xl border border-border bg-muted/30 p-3">
                      <div className="text-muted-foreground font-medium">Unrealized P/L</div>
                      <div
                        className={cx(
                          "mt-1 font-bold text-base tabular",
                          (portfolio?.unrealized_pl || 0) >= 0
                            ? "text-positive"
                            : "text-negative",
                        )}
                      >
                        {formatCurrency(portfolio?.unrealized_pl || 0)}
                      </div>
                    </div>
                  </div>

                  <p className="text-muted-foreground leading-relaxed">
                    {(portfolio?.unrealized_pl || 0) >= 0
                      ? "Your open positions are generating positive unrealized gains. Maintain position sizing discipline when adding to winning trades."
                      : "Your open positions currently reflect unrealized paper losses. Evaluate whether fundamental investment theses remain intact before averaging down."}
                  </p>
                </div>
              </Card>
            </div>

            {/* 3. Learning Opportunities */}
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <SparkIcon className="h-5 w-5 text-primary" />
                  <h3 className="text-base font-bold text-foreground">
                    Learning Opportunities
                  </h3>
                </div>
                <span className="text-xs font-semibold text-primary">Personalized Modules</span>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-border bg-card p-4 space-y-2 transition hover:border-primary/40">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-primary uppercase">Risk Management</span>
                    <Badge tone="primary">Essential</Badge>
                  </div>
                  <h4 className="text-sm font-bold text-foreground">The 2% Rule & Position Sizing</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Never risk more than 2% of total account capital on a single trade to protect against steep drawdowns.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card p-4 space-y-2 transition hover:border-primary/40">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-primary uppercase">Portfolio Theory</span>
                    <Badge tone="neutral">Strategy</Badge>
                  </div>
                  <h4 className="text-sm font-bold text-foreground">Sector Asset Allocation</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Spread investments across technology, healthcare, and consumer goods to reduce correlation risk.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card p-4 space-y-2 transition hover:border-primary/40">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-primary uppercase">Psychology</span>
                    <Badge tone="neutral">Behavioral</Badge>
                  </div>
                  <h4 className="text-sm font-bold text-foreground">Managing FOMO & Loss Aversion</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Stick to predefined exit strategies instead of holding losing trades out of emotional reluctance.
                  </p>
                </div>
              </div>
            </Card>

            {/* 4. Ask Your AI Mentor (Interactive Q&A) */}
            <Card className="p-6 space-y-5 border-primary/30 bg-gradient-to-br from-card via-card to-primary/5">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold shadow-sm">
                    <BrainIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">
                      Ask Your AI Mentor
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Get real-time insights tailored to your live portfolio.
                    </p>
                  </div>
                </div>
              </div>

              {/* Chat Message History */}
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {chatHistory.map((msg, i) => (
                  <div
                    key={i}
                    className={cx(
                      "flex flex-col max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed space-y-1",
                      msg.role === "user"
                        ? "ml-auto bg-primary text-primary-foreground font-medium rounded-tr-none"
                        : "mr-auto bg-muted/80 text-foreground border border-border rounded-tl-none shadow-sm",
                    )}
                  >
                    <div className="flex items-center justify-between text-[10px] opacity-75 font-semibold">
                      <span>{msg.role === "user" ? "You" : "PsyCap AI Mentor"}</span>
                      <span>{msg.time}</span>
                    </div>
                    <div className="whitespace-pre-line text-sm">{msg.text}</div>
                  </div>
                ))}
                {isAnalyzing && (
                  <div className="mr-auto bg-muted/80 text-muted-foreground border border-border rounded-2xl rounded-tl-none p-4 text-xs flex items-center gap-2">
                    <BrainIcon className="h-4 w-4 animate-spin text-primary" />
                    Analyzing portfolio metrics…
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Suggested Questions */}
              <div className="space-y-2 border-t border-border/60 pt-3">
                <span className="text-xs font-semibold text-muted-foreground">
                  Suggested questions:
                </span>
                <div className="flex flex-wrap gap-2">
                  {[
                    "How is my portfolio performing?",
                    "Am I properly diversified?",
                    "What is affecting my P/L?",
                    "How should I manage my cash balance?",
                  ].map((qText) => (
                    <button
                      key={qText}
                      type="button"
                      onClick={() => handleAskMentor(qText)}
                      className="rounded-xl border border-border bg-background/80 px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-primary hover:text-primary hover:bg-card"
                    >
                      {qText}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Input Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAskMentor();
                }}
                className="flex items-center gap-2 pt-1"
              >
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask a question about your portfolio or trading strategy..."
                  className="h-11 flex-1 rounded-xl border border-border bg-background px-4 text-xs font-medium text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={!query.trim() || isAnalyzing}
                >
                  <SendIcon className="h-4 w-4" />
                  Send
                </Button>
              </form>
            </Card>
          </>
        )}
      </div>
    </PageLayout>
  );
}

/**
 * Generate initial analytical summary from portfolio state
 */
function generateInitialMentorAnalysis(portfolio, transactions) {
  const accountValue = portfolio.account_value || 100000;
  const returnPercent = portfolio.return_percent || 0;
  const totalPL = portfolio.total_pl || 0;
  const holdings = portfolio.holdings || [];

  let text = `Hello! I'm your PsyCap AI Mentor. I've analyzed your current paper portfolio:

• Total Account Value: ${formatCurrency(accountValue)}
• Overall Return: ${formatPercent(returnPercent, { withSign: true })} (${formatCurrency(totalPL)})
• Open Positions: ${holdings.length} stock${holdings.length === 1 ? "" : "s"} (${transactions.length} trade execution${transactions.length === 1 ? "" : "s"})`;

  if (holdings.length === 1) {
    text += `\n\nKey Insight: Your equity is currently 100% concentrated in ${holdings[0].symbol}. Consider adding 2-3 additional non-correlated assets to improve your diversification score.`;
  } else if (holdings.length >= 3) {
    text += `\n\nKey Insight: Your portfolio is nicely diversified across ${holdings.length} positions. Keep monitoring individual stock weightings to prevent single-stock concentration.`;
  } else {
    text += `\n\nKey Insight: You have high available cash. Consider deploying capital into quality US equities when favorable market setups appear.`;
  }

  return text;
}

/**
 * Generate AI Mentor responses based on specific question categories & portfolio metrics
 */
function generateAiReply(prompt, portfolio, transactions, analytics) {
  const pLower = prompt.toLowerCase();
  const holdings = portfolio?.holdings || [];

  if (pLower.includes("performing") || pLower.includes("performance") || pLower.includes("p/l")) {
    const ret = portfolio?.return_percent || 0;
    const pl = portfolio?.total_pl || 0;
    const isPos = pl >= 0;
    return `Your portfolio is currently ${isPos ? "up" : "down"} ${formatPercent(ret, { withSign: true })} with an all-time P/L of ${formatCurrency(pl)}.\n\n` +
      `Out of your ${holdings.length} position${holdings.length === 1 ? "" : "s"}, ${holdings.filter((h) => (h.unrealized_pl || 0) >= 0).length} are currently profitable. ` +
      `${isPos ? "Great job maintaining risk management on your winning positions!" : "Remember that paper trading is designed to help you practice risk management without capital risk."}`;
  }

  if (pLower.includes("diversifi") || pLower.includes("concentrat") || pLower.includes("spread")) {
    if (holdings.length === 0) {
      return "You currently have 0 open positions. To build a diversified portfolio, consider spreading your virtual capital across 3 to 5 distinct US equities.";
    }
    if (analytics?.largestPosition) {
      return `Your portfolio currently holds ${holdings.length} stock${holdings.length === 1 ? "" : "s"}. Your largest single position is ${analytics.largestPosition.symbol}, which represents ${formatPercent(analytics.largestPositionWeight)} of your invested capital.\n\n` +
        (analytics.largestPositionWeight > 50
          ? "Warning: Single-stock concentration above 50% increases your portfolio volatility. Consider rebalancing into additional sectors."
          : "Your position sizes are well balanced.");
    }
    return `You hold ${holdings.length} positions. A well-diversified portfolio typically maintains 3 to 6 distinct holdings across technology, healthcare, and finance.`;
  }

  if (pLower.includes("cash") || pLower.includes("capital") || pLower.includes("balance")) {
    const cash = portfolio?.cash_balance || 100000;
    const cashPct = analytics?.cashPercent || 100;
    return `You currently have ${formatCurrency(cash)} (${formatPercent(cashPct)} of total account value) in available cash.\n\n` +
      (cashPct > 70
        ? "You are holding a high cash allocation. This protects capital during market downturns, but deploying cash into growth equities can compound long-term returns."
        : "Your cash balance provides good liquidity for future trading opportunities.");
  }

  // Fallback analytical response
  return `Based on your paper trading activity (${analytics?.totalTrades || 0} trades executed, ${holdings.length} positions open):\n\n` +
    `• Account Value: ${formatCurrency(portfolio?.account_value || 100000)}\n` +
    `• All-Time Return: ${formatPercent(portfolio?.return_percent || 0, { withSign: true })}\n` +
    `• Key Recommendation: Maintain disciplined position sizing (never risking more than 2-5% per trade) and set clear profit targets.`;
}
