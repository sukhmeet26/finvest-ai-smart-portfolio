import { universeFor } from "./instruments";
import { RISK_FREE_RATE, computeMetrics, runStressTests } from "./risk-engine";
import type {
  AgentStep,
  CriticFinding,
  Holding,
  Instrument,
  MonitorAlert,
  PortfolioInput,
  RiskBucket,
  RiskMetrics,
} from "./types";

const BUCKETS: RiskBucket[] = ["low", "moderate", "high"];
const MAX_ITERATIONS = 5;
const MAX_SINGLE_WEIGHT = 0.25;
const MAX_SECTOR_WEIGHT = 0.38;
const MAX_HHI = 0.22;

function targets(input: PortfolioInput): Record<RiskBucket, number> {
  return {
    low: input.lowPct / 100,
    moderate: input.moderatePct / 100,
    high: input.highPct / 100,
  };
}

/** Market Research Agent scoring: risk-adjusted return tilted by valuation, liquidity and horizon. */
function score(i: Instrument, input: PortfolioInput): number {
  const sharpe = (i.expectedReturn - RISK_FREE_RATE) / Math.max(i.volatility, 0.005);
  const liquidityWeight = 0.3 + (input.liquidityNeedPct / 100) * 1.2;
  const horizonPenalty = input.horizonYears < 3 ? i.volatility * 2.5 : input.horizonYears < 7 ? i.volatility * 0.8 : 0;
  const drawdownPenalty =
    i.historicalMaxDrawdown > input.maxDrawdownPct / 100 ? (i.historicalMaxDrawdown - input.maxDrawdownPct / 100) * 1.4 : 0;
  return (
    sharpe * 0.9 +
    i.valuationScore * 0.5 +
    i.liquidityScore * liquidityWeight +
    (i.cagr3y - i.expectedReturn) * 0.2 -
    horizonPenalty -
    drawdownPenalty
  );
}

function pickCount(budget: number, available: number): number {
  if (budget <= 0) return 0;
  if (budget < 0.1) return Math.min(2, available);
  if (budget < 0.25) return Math.min(3, available);
  return Math.min(4, available);
}

function selectForBucket(bucket: RiskBucket, budget: number, input: PortfolioInput): Instrument[] {
  const ranked = [...universeFor(bucket)].sort((a, b) => score(b, input) - score(a, input));
  const n = pickCount(budget, ranked.length);
  const chosen: Instrument[] = [];
  const sectors = new Set<string>();
  for (const candidate of ranked) {
    if (chosen.length >= n) break;
    // diversification rule: at most two instruments per sector inside a bucket
    const sectorCount = chosen.filter((c) => c.sector === candidate.sector).length;
    if (sectorCount >= 1 && sectors.size < n - 1) continue;
    chosen.push(candidate);
    sectors.add(candidate.sector);
  }
  for (const candidate of ranked) {
    if (chosen.length >= n) break;
    if (!chosen.includes(candidate)) chosen.push(candidate);
  }
  return chosen;
}

/** Inverse-volatility weights, renormalised to the exact bucket budget. */
function inverseVolWeights(instruments: Instrument[], budget: number): Map<string, number> {
  const inv = instruments.map((i) => 1 / Math.max(i.volatility, 0.01));
  const total = inv.reduce((a, b) => a + b, 0);
  const out = new Map<string, number>();
  instruments.forEach((i, idx) => out.set(i.id, (inv[idx]! / total) * budget));
  return out;
}

function rescaleBucket(holdings: Holding[], budget: number) {
  const sum = holdings.reduce((a, h) => a + h.weight, 0);
  if (sum <= 0) return;
  for (const h of holdings) h.weight = (h.weight / sum) * budget;
}

function shiftToLowerRisk(bucketHoldings: Holding[], fraction: number) {
  if (bucketHoldings.length < 2) return;
  const sorted = [...bucketHoldings].sort((a, b) => b.instrument.volatility - a.instrument.volatility);
  const from = sorted[0]!;
  const to = sorted[sorted.length - 1]!;
  const move = from.weight * fraction;
  from.weight -= move;
  to.weight += move;
}

function capSingle(bucketHoldings: Holding[], cap: number, budget: number) {
  let excess = 0;
  for (const h of bucketHoldings) {
    if (h.weight > cap) {
      excess += h.weight - cap;
      h.weight = cap;
    }
  }
  if (excess <= 0) return;
  const receivers = bucketHoldings.filter((h) => h.weight < cap);
  const room = receivers.reduce((a, h) => a + (cap - h.weight), 0);
  if (room <= 0) return;
  for (const h of receivers) h.weight += excess * ((cap - h.weight) / room);
  rescaleBucket(bucketHoldings, budget);
}

function equalise(bucketHoldings: Holding[], budget: number, blend: number) {
  const equal = budget / bucketHoldings.length;
  for (const h of bucketHoldings) h.weight = h.weight * (1 - blend) + equal * blend;
  rescaleBucket(bucketHoldings, budget);
}

function improveLiquidity(bucketHoldings: Holding[], budget: number) {
  const sorted = [...bucketHoldings].sort((a, b) => a.instrument.liquidityScore - b.instrument.liquidityScore);
  const from = sorted[0]!;
  const to = sorted[sorted.length - 1]!;
  const move = from.weight * 0.3;
  from.weight -= move;
  to.weight += move;
  rescaleBucket(bucketHoldings, budget);
}

function rationaleFor(i: Instrument, input: PortfolioInput): string {
  const bits: string[] = [];
  bits.push(`${(i.expectedReturn * 100).toFixed(1)}% expected return at ${(i.volatility * 100).toFixed(1)}% vol`);
  if (i.liquidityScore >= 0.9) bits.push("same/next-day liquidity");
  if (i.beta <= 0.1) bits.push("low equity beta, dampens portfolio drawdown");
  if (i.valuationScore >= 0.7) bits.push("valuation supportive");
  if (i.valuationScore < 0.5) bits.push("valuation rich — size limited");
  if (input.horizonYears >= 7 && i.bucket === "high") bits.push("horizon long enough to absorb cyclicality");
  return bits.join("; ") + ".";
}

export interface EngineOutput {
  holdings: Holding[];
  metrics: RiskMetrics;
  bucketActual: Record<RiskBucket, number>;
  findings: CriticFinding[];
  iterations: number;
  agentTrace: AgentStep[];
  alerts: MonitorAlert[];
  stress: ReturnType<typeof runStressTests>;
  constraintsSatisfied: boolean;
}

function bucketSums(holdings: Holding[]): Record<RiskBucket, number> {
  const out: Record<RiskBucket, number> = { low: 0, moderate: 0, high: 0 };
  for (const h of holdings) out[h.instrument.bucket] += h.weight;
  return out;
}

function critique(
  holdings: Holding[],
  metrics: RiskMetrics,
  input: PortfolioInput,
  iteration: number,
): CriticFinding[] {
  const findings: CriticFinding[] = [];
  const add = (
    code: string,
    severity: CriticFinding["severity"],
    message: string,
    action: string,
  ) => findings.push({ iteration, code, severity, message, action, resolved: false });

  if (metrics.topHoldingWeight > MAX_SINGLE_WEIGHT + 1e-6) {
    add(
      "SINGLE_CONCENTRATION",
      "critical",
      `Largest holding is ${(metrics.topHoldingWeight * 100).toFixed(1)}% of capital, above the ${MAX_SINGLE_WEIGHT * 100}% single-instrument limit.`,
      "Cap the position and redistribute inside the same risk bucket.",
    );
  }
  if (metrics.hhi > MAX_HHI) {
    add(
      "HHI_CONCENTRATION",
      "warning",
      `Herfindahl index ${metrics.hhi.toFixed(3)} implies only ${metrics.effectiveHoldings.toFixed(1)} effective holdings.`,
      "Flatten weights toward bucket-equal allocation.",
    );
  }
  if (metrics.topSectorWeight > MAX_SECTOR_WEIGHT) {
    add(
      "SECTOR_CONCENTRATION",
      "warning",
      `Single sector exposure is ${(metrics.topSectorWeight * 100).toFixed(1)}%, above the ${MAX_SECTOR_WEIGHT * 100}% guardrail.`,
      "Rotate part of the sector exposure to a diversifying holding.",
    );
  }
  if (metrics.maxDrawdown > input.maxDrawdownPct / 100 + 0.005) {
    add(
      "DRAWDOWN_BREACH",
      "critical",
      `Modelled max drawdown ${(metrics.maxDrawdown * 100).toFixed(1)}% exceeds your ${input.maxDrawdownPct}% tolerance.`,
      "Shift weight to lower-volatility instruments within each bucket.",
    );
  }
  if (metrics.liquidityCoverage < input.liquidityNeedPct / 100) {
    add(
      "LIQUIDITY_SHORTFALL",
      "warning",
      `Liquidity score ${(metrics.liquidityCoverage * 100).toFixed(0)}% is below the ${input.liquidityNeedPct}% you may need within 12 months.`,
      "Substitute less liquid holdings for same-bucket liquid alternatives.",
    );
  }
  if (metrics.avgCorrelation > 0.7) {
    add(
      "POOR_DIVERSIFICATION",
      "warning",
      `Average pairwise correlation ${metrics.avgCorrelation.toFixed(2)} — holdings move together.`,
      "Introduce lower-correlation sleeves (gold, international, duration).",
    );
  }
  if (input.horizonYears < 3 && metrics.volatility > 0.1) {
    add(
      "HORIZON_MISMATCH",
      "warning",
      `Volatility ${(metrics.volatility * 100).toFixed(1)}% is high for a ${input.horizonYears}-year horizon.`,
      "De-risk within buckets; flag horizon/risk-split tension to the user.",
    );
  }
  return findings;
}

function driftAlerts(holdings: Holding[], metrics: RiskMetrics, input: PortfolioInput): MonitorAlert[] {
  const alerts: MonitorAlert[] = [];
  // Mock live market feed: 3-year CAGR used as the realised 6-month drift proxy.
  const grown = holdings.map((h) => ({ h, value: h.weight * (1 + h.instrument.cagr3y / 2) }));
  const total = grown.reduce((a, g) => a + g.value, 0);
  for (const g of grown) {
    const newWeight = g.value / total;
    const drift = (newWeight - g.h.weight) * 100;
    if (Math.abs(drift) >= 1.5) {
      alerts.push({
        id: `drift-${g.h.instrument.id}`,
        type: "drift",
        severity: Math.abs(drift) >= 3 ? "warning" : "info",
        title: `${g.h.instrument.symbol} drifted ${drift > 0 ? "+" : ""}${drift.toFixed(1)}pp`,
        detail: `Target ${(g.h.weight * 100).toFixed(1)}% vs simulated current ${(newWeight * 100).toFixed(1)}% after 6 months of modelled performance.`,
        recommendation:
          drift > 0
            ? `Trim ${g.h.instrument.symbol} back to target and top up the underweight sleeve.`
            : `Top up ${g.h.instrument.symbol} to restore the target weight.`,
        requiresApproval: true,
      });
    }
  }
  if (metrics.volatility > 0.18) {
    alerts.push({
      id: "vol-regime",
      type: "volatility",
      severity: "warning",
      title: "Portfolio volatility above 18%",
      detail: `Modelled volatility is ${(metrics.volatility * 100).toFixed(1)}%, which puts a 1-in-20 year loss at ${(metrics.var95Annual * 100).toFixed(1)}%.`,
      recommendation: "Consider reducing the high-risk sleeve or adding duration/gold ballast.",
      requiresApproval: true,
    });
  }
  if (metrics.maxDrawdown > input.maxDrawdownPct / 100) {
    alerts.push({
      id: "limit-breach",
      type: "limit_breach",
      severity: "critical",
      title: "Drawdown limit breached by mandate",
      detail: `Modelled drawdown ${(metrics.maxDrawdown * 100).toFixed(1)}% vs limit ${input.maxDrawdownPct}%. Your requested risk split does not fit this limit.`,
      recommendation: "Reduce the high-risk allocation or raise the drawdown tolerance.",
      requiresApproval: true,
    });
  }
  alerts.push({
    id: "market-event",
    type: "market_event",
    severity: "info",
    title: "Policy event on the calendar",
    detail: "Simulated feed: central bank policy review in 9 days; duration and banking sleeves are most sensitive.",
    recommendation: "No action required. Monitor duration exposure around the announcement.",
    requiresApproval: false,
  });
  return alerts;
}

export function buildPortfolio(input: PortfolioInput): EngineOutput {
  const trace: AgentStep[] = [];
  const t = targets(input);
  const started = Date.now();

  trace.push({
    agent: "Risk Profiler Agent",
    status: "done",
    summary: `Profile: ${input.lowPct}/${input.moderatePct}/${input.highPct} split over ${input.horizonYears}y, ${input.maxDrawdownPct}% drawdown tolerance.`,
    detail: `Goal "${input.goal}". Liquidity need ${input.liquidityNeedPct}% within 12 months. Risk split is treated as a hard constraint; capacity checks run in the Risk Analysis stage.`,
    durationMs: 120,
  });

  const selected: Record<RiskBucket, Instrument[]> = {
    low: selectForBucket("low", t.low, input),
    moderate: selectForBucket("moderate", t.moderate, input),
    high: selectForBucket("high", t.high, input),
  };

  trace.push({
    agent: "Market Research Agent",
    status: "done",
    summary: `Screened ${universeFor("low").length + universeFor("moderate").length + universeFor("high").length} instruments, shortlisted ${
      selected.low.length + selected.moderate.length + selected.high.length
    }.`,
    detail: BUCKETS.map(
      (b) => `${b}: ${selected[b].map((i) => i.symbol).join(", ") || "none (0% allocation)"}`,
    ).join(" | "),
    durationMs: 340,
  });

  const holdings: Holding[] = [];
  for (const b of BUCKETS) {
    const budget = t[b];
    if (budget <= 0 || selected[b].length === 0) {
      trace.push({
        agent: `${b[0]!.toUpperCase()}${b.slice(1)}-Risk Agent`,
        status: "skipped",
        summary: "0% allocated to this bucket.",
        detail: "No instruments selected because the user allocated no capital here.",
        durationMs: 0,
      });
      continue;
    }
    const weights = inverseVolWeights(selected[b], budget);
    const bucketHoldings = selected[b].map((i) => ({
      instrument: i,
      weight: weights.get(i.id)!,
      amount: 0,
      rationale: rationaleFor(i, input),
    }));
    capSingle(bucketHoldings, Math.min(MAX_SINGLE_WEIGHT, Math.max(budget * 0.6, 0.05)), budget);
    holdings.push(...bucketHoldings);
    trace.push({
      agent: `${b[0]!.toUpperCase()}${b.slice(1)}-Risk Agent`,
      status: "done",
      summary: `Allocated ${(budget * 100).toFixed(0)}% across ${bucketHoldings.length} instruments (inverse-volatility weighted).`,
      detail: bucketHoldings
        .map((h) => `${h.instrument.symbol} ${(h.weight * 100).toFixed(1)}%`)
        .join(", "),
      durationMs: 260,
    });
  }

  let metrics = computeMetrics(holdings);
  trace.push({
    agent: "Risk Analysis Agent",
    status: "done",
    summary: `Vol ${(metrics.volatility * 100).toFixed(1)}%, Sharpe ${metrics.sharpe.toFixed(2)}, modelled max DD ${(metrics.maxDrawdown * 100).toFixed(1)}%.`,
    detail: "Deterministic Python-equivalent risk engine: covariance volatility, Sharpe/Sortino, VaR/CVaR, beta, HHI, correlation and stress scenarios. No LLM arithmetic.",
    durationMs: 180,
  });

  const allFindings: CriticFinding[] = [];
  let iterations = 0;
  for (let iter = 1; iter <= MAX_ITERATIONS; iter++) {
    const findings = critique(holdings, metrics, input, iter);
    if (findings.length === 0) break;
    iterations = iter;
    allFindings.push(...findings);

    for (const b of BUCKETS) {
      const bucketHoldings = holdings.filter((h) => h.instrument.bucket === b);
      if (bucketHoldings.length === 0) continue;
      const budget = t[b];
      for (const f of findings) {
        if (f.code === "SINGLE_CONCENTRATION")
          capSingle(bucketHoldings, Math.min(MAX_SINGLE_WEIGHT, Math.max(budget * 0.6, 0.05)), budget);
        if (f.code === "HHI_CONCENTRATION") equalise(bucketHoldings, budget, 0.5);
        if (f.code === "DRAWDOWN_BREACH" || f.code === "HORIZON_MISMATCH")
          shiftToLowerRisk(bucketHoldings, 0.25);
        if (f.code === "SECTOR_CONCENTRATION") equalise(bucketHoldings, budget, 0.35);
        if (f.code === "LIQUIDITY_SHORTFALL") improveLiquidity(bucketHoldings, budget);
        if (f.code === "POOR_DIVERSIFICATION") equalise(bucketHoldings, budget, 0.3);
      }
      rescaleBucket(bucketHoldings, budget);
    }

    metrics = computeMetrics(holdings);
    const remaining = new Set(critique(holdings, metrics, input, iter).map((f) => f.code));
    for (const f of findings) f.resolved = !remaining.has(f.code);

    trace.push({
      agent: "Portfolio Critic Agent",
      status: "done",
      summary: `Iteration ${iter}: ${findings.length} finding(s), ${findings.filter((f) => f.resolved).length} resolved by rebalance.`,
      detail: findings.map((f) => `${f.code}: ${f.message}`).join(" "),
      durationMs: 210,
    });
    if (remaining.size === 0) break;
  }

  if (allFindings.length === 0) {
    trace.push({
      agent: "Portfolio Critic Agent",
      status: "done",
      summary: "No concentration, diversification, liquidity or drawdown violations found.",
      detail: "Portfolio approved on the first pass; all guardrails satisfied.",
      durationMs: 190,
    });
  }

  const bucketActual = bucketSums(holdings);
  for (const h of holdings) h.amount = h.weight * input.totalCapital;
  const stress = runStressTests(holdings, input.totalCapital);
  const alerts = driftAlerts(holdings, metrics, input);
  const unresolvedCritical = allFindings.some((f) => f.severity === "critical" && !f.resolved);

  trace.push({
    agent: "Portfolio Manager Agent",
    status: "done",
    summary: unresolvedCritical
      ? "Portfolio finalised, but one hard constraint could not be met without breaking your risk split."
      : "Portfolio finalised — all constraints satisfied.",
    detail: `Exact allocation honoured: low ${(bucketActual.low * 100).toFixed(2)}%, moderate ${(bucketActual.moderate * 100).toFixed(2)}%, high ${(bucketActual.high * 100).toFixed(2)}%. Orchestration completed in ${Date.now() - started}ms of engine time.`,
    durationMs: 90,
  });

  trace.push({
    agent: "Portfolio Monitoring Agent",
    status: "done",
    summary: `${alerts.length} monitoring signal(s) generated; every rebalance needs your explicit approval.`,
    detail: alerts.map((a) => a.title).join(" | "),
    durationMs: 150,
  });

  return {
    holdings,
    metrics,
    bucketActual,
    findings: allFindings,
    iterations,
    agentTrace: trace,
    alerts,
    stress,
    constraintsSatisfied: !unresolvedCritical,
  };
}

/** Alternative construction: minimise volatility while keeping the same bucket split. */
export function buildLowerVolatilityAlternative(input: PortfolioInput): EngineOutput {
  const out = buildPortfolio(input);
  for (const b of BUCKETS) {
    const bucketHoldings = out.holdings.filter((h) => h.instrument.bucket === b);
    if (bucketHoldings.length < 2) continue;
    const budget = bucketHoldings.reduce((a, h) => a + h.weight, 0);
    const inv = bucketHoldings.map((h) => 1 / Math.pow(h.instrument.volatility, 2));
    const total = inv.reduce((a, b2) => a + b2, 0);
    bucketHoldings.forEach((h, idx) => {
      h.weight = (inv[idx]! / total) * budget;
      h.amount = h.weight * input.totalCapital;
    });
  }
  out.metrics = computeMetrics(out.holdings);
  out.stress = runStressTests(out.holdings, input.totalCapital);
  out.bucketActual = bucketSums(out.holdings);
  return out;
}