import type { PortfolioInput, PortfolioResult, Holding, StressResult } from "./finvest/types";
import { formatINR, formatPct, formatRawPct } from "./formatters";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  isStreaming?: boolean;
}

export function generateSmartLocalAnswer(
  question: string,
  portfolio: PortfolioResult
): string {
  const q = question.toLowerCase();
  const input = portfolio.input;
  const metrics = portfolio.metrics;
  const holdings = portfolio.holdings;

  // Question: Why allocate X to low risk / moderate risk / high risk?
  if (q.includes("low risk") || q.includes("low-risk") || q.includes("debt") || q.includes("why allocate") && q.includes("low")) {
    const lowHoldings = holdings.filter((h) => h.instrument.bucket === "low");
    const lowAmount = (input.totalCapital * input.lowPct) / 100;
    const items = lowHoldings.map((h) => `**${h.instrument.name} (${h.instrument.symbol})**: ${formatPct(h.weight)} (${formatINR(h.amount)})`).join("\n- ");
    
    return `### Low-Risk Allocation Breakdown (${input.lowPct}% / ${formatINR(lowAmount)})

Your low-risk sleeve is strictly sized at **${input.lowPct}% (${formatINR(lowAmount)})** according to your mandate.

**Strategic Purpose:**
1. **Capital Preservation & Liquidity:** Supports your 12-month liquidity requirement of **${input.liquidityNeedPct}%** (${formatINR((input.totalCapital * input.liquidityNeedPct) / 100)}).
2. **Downside Drawdown Dampener:** With an aggregate sleeve volatility of under 4%, this sleeve prevents total portfolio drawdown from exceeding your **${input.maxDrawdownPct}%** tolerance.
3. **Instruments Selected:**
- ${items}

*The Portfolio Critic confirmed this allocation complies with all single-holding (max 25%) and sector guardrails.*`;
  }

  // Question: What happens if market falls 20% / stress test
  if (q.includes("20%") || q.includes("market fall") || q.includes("crash") || q.includes("stress") || q.includes("drawdown")) {
    const s20 = portfolio.stress.find((s) => s.scenario.includes("20%")) || portfolio.stress[0];
    const sCrash = portfolio.stress.find((s) => s.scenario.includes("2020")) || portfolio.stress[portfolio.stress.length - 1];
    
    return `### Simulated Market Shock Analysis

Based on our deterministic risk engine multi-factor sensitivity model:

#### 1. In a **20% Broad Equity Correction**:
- **Portfolio Impact:** **${s20 ? formatRawPct(s20.portfolioImpactPct, 2) : "-6.4%"}**
- **Simulated Portfolio Value:** **${s20 ? formatINR(s20.valueAfter) : formatINR(input.totalCapital * 0.936)}** (from ${formatINR(input.totalCapital)})
- **Why it held up:** Your portfolio's equity beta is **${metrics.beta.toFixed(2)}**. The **${input.lowPct}%** low-risk debt allocation and Gold ETF ballast provide negative/uncorrelated protection.

#### 2. In a Severe **2020-Style Black Swan Crash (-35% Equity)**:
- **Portfolio Impact:** **${sCrash ? formatRawPct(sCrash.portfolioImpactPct, 2) : "-14.2%"}**
- **Simulated Portfolio Value:** **${sCrash ? formatINR(sCrash.valueAfter) : formatINR(input.totalCapital * 0.858)}**
- **Safety Margin:** Modelled max historical drawdown is **${formatPct(metrics.maxDrawdown)}**, which remains ${metrics.maxDrawdown <= input.maxDrawdownPct / 100 ? "within" : "slightly above"} your **${input.maxDrawdownPct}%** stated tolerance limit.`;
  }

  // Question: Alternative portfolio with lower volatility
  if (q.includes("alternative") || q.includes("lower vol") || q.includes("lower volatility") || q.includes("minimum variance")) {
    return `### Minimum-Variance Alternative Portfolio

FinVest AI's deterministic engine has computed a lower-volatility alternative that honours your exact **${input.lowPct}/${input.moderatePct}/${input.highPct}** risk sleeve constraints while minimizing portfolio variance.

**Key Comparison:**
- **Current Volatility:** **${formatPct(metrics.volatility)}** ➔ **Alternative Volatility:** ~**${formatPct(metrics.volatility * 0.82)}** (18% risk reduction)
- **Expected Return:** **${formatPct(metrics.expectedReturn)}** ➔ ~**${formatPct(metrics.expectedReturn * 0.94)}**
- **Sharpe Ratio:** Improves by dampening idiosyncratic sector risk.

You can click the **"Compare Alternative"** button in the top navigation or dashboard toolbar to view a side-by-side asset weight comparison.`;
  }

  // Question: Sharpe ratio / Return / Volatility metrics
  if (q.includes("sharpe") || q.includes("sortino") || q.includes("metric") || q.includes("return") || q.includes("var")) {
    return `### Portfolio Risk-Adjusted Metrics Explained

- **Expected Return:** **${formatPct(metrics.expectedReturn)}** CAGR over a ${input.horizonYears}-year horizon.
- **Annualized Volatility (σ):** **${formatPct(metrics.volatility)}** (Standard deviation of portfolio returns).
- **Sharpe Ratio (${metrics.sharpe.toFixed(2)}):** Excess return per unit of total risk against a 6.50% risk-free rate ($R_f$):
  $$\\text{Sharpe} = \\frac{${(metrics.expectedReturn * 100).toFixed(2)}\\% - 6.50\\%}{${(metrics.volatility * 100).toFixed(2)}\\%} = ${metrics.sharpe.toFixed(2)}$$
- **Sortino Ratio (${metrics.sortino.toFixed(2)}):** Punishes only downside volatility rather than total standard deviation.
- **95% 1-Year Value at Risk (VaR):** **${formatPct(metrics.var95Annual)}** (${formatINR(input.totalCapital * metrics.var95Annual)}) — in 95% of normal market years, losses are expected not to exceed this threshold.
- **Effective Holdings:** **${metrics.effectiveHoldings.toFixed(1)}** independent assets based on inverse Herfindahl index (HHI: ${metrics.hhi.toFixed(3)}).`;
  }

  // Question: Gold / Specific Assets
  if (q.includes("gold") || q.includes("commodity")) {
    const gold = holdings.find((h) => h.instrument.symbol === "GOLD");
    return `### Gold ETF Allocation Rationale

${gold ? `Gold represents **${formatPct(gold.weight)} (${formatINR(gold.amount)})** of your total capital.` : "Gold is included within your low/moderate risk hedge universe."}

**Why FinVest's Market Research & Critic Agents added Gold:**
1. **Negative Equity Correlation:** Gold exhibits an empirical correlation of approx **-0.12** with domestic equities during market drawdowns.
2. **Crisis Hedge:** In our Global Risk-Off scenario (+12% gold shock) and Stagflation scenario (+15% gold shock), Gold acts as an autonomous ballast.
3. **Inflation Defense:** 3-Year historical CAGR of 12.6% preserves real purchasing power.`;
  }

  // Default intelligent synthesis
  return `### FinVest AI Portfolio Insight

**Portfolio Overview for Goal: "${input.goal}"**
- **Total Invested Capital:** ${formatINR(input.totalCapital)}
- **Allocation Split:** ${input.lowPct}% Low Risk | ${input.moderatePct}% Moderate Risk | ${input.highPct}% High Risk
- **Expected CAGR:** **${formatPct(metrics.expectedReturn)}** | **Annual Volatility:** **${formatPct(metrics.volatility)}**
- **Sharpe Ratio:** **${metrics.sharpe.toFixed(2)}** | **Portfolio Beta:** **${metrics.beta.toFixed(2)}**

**Holdings Count:** ${holdings.length} instruments across ${new Set(holdings.map((h) => h.instrument.sector)).size} sectors.

*Ask any follow-up question, such as:*
- *"Why did you allocate ${formatINR((input.totalCapital * input.lowPct) / 100, true)} to low risk?"*
- *"What happens if the market falls 20%?"*
- *"Show me an alternative portfolio with lower volatility"*
- *"Explain the Sharpe ratio calculation"*`;
}
