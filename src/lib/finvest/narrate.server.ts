import { generateText } from "ai";
import { CHAT_MODEL, createLovableAiGatewayProvider, gatewayErrorMessage } from "../ai-gateway.server";
import type { EngineOutput } from "./orchestrator";
import type { PortfolioInput } from "./types";

const DISCLAIMER =
  "FinVest AI is a research and simulation tool. Nothing here is personalised financial advice.";

const SYSTEM = `You are the Portfolio Manager Agent of FinVest AI, a portfolio research and simulation platform for Indian investors.
Rules:
- NEVER compute or invent numbers. Every figure you cite must be copied verbatim from the deterministic risk-engine data provided to you.
- Explain reasoning in plain language: why each sleeve and instrument was chosen, what the risk metrics mean, what the trade-offs are.
- Use Indian conventions (lakh/crore, INR) when the data uses rupees.
- Be concise, use markdown headings and bullets, no more than ~350 words unless asked for detail.
- Always frame output as simulation/decision support, not advice.`;

function engineFacts(input: PortfolioInput, e: EngineOutput): string {
  const m = e.metrics;
  return JSON.stringify({
    userConstraints: input,
    bucketActualPct: {
      low: +(e.bucketActual.low * 100).toFixed(2),
      moderate: +(e.bucketActual.moderate * 100).toFixed(2),
      high: +(e.bucketActual.high * 100).toFixed(2),
    },
    holdings: e.holdings.map((h) => ({
      name: h.instrument.name,
      symbol: h.instrument.symbol,
      bucket: h.instrument.bucket,
      assetClass: h.instrument.assetClass,
      sector: h.instrument.sector,
      weightPct: +(h.weight * 100).toFixed(2),
      amountRupees: Math.round(h.amount),
      expectedReturnPct: +(h.instrument.expectedReturn * 100).toFixed(2),
      volatilityPct: +(h.instrument.volatility * 100).toFixed(2),
      beta: h.instrument.beta,
      liquidityScore: h.instrument.liquidityScore,
      valuationScore: h.instrument.valuationScore,
      historicalMaxDrawdownPct: +(h.instrument.historicalMaxDrawdown * 100).toFixed(1),
      cagr3yPct: +(h.instrument.cagr3y * 100).toFixed(1),
      engineRationale: h.rationale,
      researchNote: h.instrument.notes,
    })),
    riskMetrics: {
      expectedReturnPct: +(m.expectedReturn * 100).toFixed(2),
      volatilityPct: +(m.volatility * 100).toFixed(2),
      sharpe: +m.sharpe.toFixed(2),
      sortino: +m.sortino.toFixed(2),
      maxDrawdownPct: +(m.maxDrawdown * 100).toFixed(2),
      var95AnnualPct: +(m.var95Annual * 100).toFixed(2),
      var95MonthlyPct: +(m.var95Monthly * 100).toFixed(2),
      cvar95AnnualPct: +(m.cvar95Annual * 100).toFixed(2),
      beta: +m.beta.toFixed(2),
      avgCorrelation: +m.avgCorrelation.toFixed(2),
      hhi: +m.hhi.toFixed(3),
      effectiveHoldings: +m.effectiveHoldings.toFixed(1),
      topHoldingPct: +(m.topHoldingWeight * 100).toFixed(2),
      topSectorPct: +(m.topSectorWeight * 100).toFixed(2),
      liquidityCoveragePct: +(m.liquidityCoverage * 100).toFixed(0),
    },
    stressTests: e.stress.map((s) => ({
      scenario: s.scenario,
      description: s.description,
      impactPct: +s.portfolioImpactPct.toFixed(2),
      valueAfterRupees: Math.round(s.valueAfter),
    })),
    criticFindings: e.findings,
    rebalanceIterations: e.iterations,
    monitoringAlerts: e.alerts,
    constraintsSatisfied: e.constraintsSatisfied,
  });
}

async function callModel(prompt: string, system = SYSTEM): Promise<string> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) return `AI narration unavailable: server AI key is not configured. ${DISCLAIMER}`;
  try {
    const gateway = createLovableAiGatewayProvider(key);
    const result = await generateText({ model: gateway(CHAT_MODEL), system, prompt });
    return result.text.trim();
  } catch (error) {
    console.error("[finvest] gateway error", error);
    return gatewayErrorMessage(error);
  }
}

export function buildContext(input: PortfolioInput, e: EngineOutput): string {
  return engineFacts(input, e);
}

export async function narratePortfolio(input: PortfolioInput, e: EngineOutput): Promise<string> {
  return callModel(
    `Deterministic risk-engine output (JSON, authoritative):\n${engineFacts(input, e)}\n\n` +
      `Write the allocation decision report with these sections:\n` +
      `## Why this portfolio\n## Sleeve-by-sleeve reasoning (low / moderate / high)\n## Risk picture\n## What the critic agent changed\n## Key trade-offs and watch-outs\n` +
      `Reference specific instruments by name and their weights. Explain how the exact ${input.lowPct}/${input.moderatePct}/${input.highPct} split was honoured.`,
  );
}

export async function answerQuestion(
  question: string,
  context: string,
  history: { role: "user" | "assistant"; content: string }[],
): Promise<string> {
  const transcript = history
    .slice(-8)
    .map((m) => `${m.role === "user" ? "User" : "FinVest"}: ${m.content}`)
    .join("\n");
  return callModel(
    `Deterministic risk-engine output for the user's current portfolio (JSON, authoritative — the only source of numbers):\n${context}\n\n` +
      (transcript ? `Conversation so far:\n${transcript}\n\n` : "") +
      `User question: ${question}\n\n` +
      `Answer grounded strictly in the JSON above. If the answer needs a number that is not present, say which engine calculation would be required instead of estimating. Keep it under 250 words.`,
  );
}