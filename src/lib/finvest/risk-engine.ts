import type { Holding, Instrument, RiskMetrics, StressResult } from "./types";

export const RISK_FREE_RATE = 0.065;
const Z95 = 1.645;
const CVAR_Z95 = 2.063; // E[z | z > 1.645]
const SEMI_DEV_FACTOR = 0.72; // downside deviation proxy for annualised sigma

/** Deterministic correlation model over asset-class / factor relationships. */
export function correlation(a: Instrument, b: Instrument): number {
  if (a.id === b.id) return 1;
  const eqA = a.equitySensitivity >= 0.3;
  const eqB = b.equitySensitivity >= 0.3;
  const goldInvolved = a.sector === "Precious Metals" || b.sector === "Precious Metals";
  if (goldInvolved) return eqA || eqB ? -0.12 : 0.06;
  if (a.assetClass === b.assetClass) return 0.85;
  if (eqA && eqB) {
    if (a.sector === b.sector) return 0.78;
    const intl = a.assetClass === "International Equity" || b.assetClass === "International Equity";
    return intl ? 0.48 : 0.66;
  }
  if (!eqA && !eqB) return 0.55;
  return 0.1;
}

export function covariance(a: Instrument, b: Instrument): number {
  return a.volatility * b.volatility * correlation(a, b);
}

function weightedSum(holdings: Holding[], pick: (i: Instrument) => number): number {
  return holdings.reduce((acc, h) => acc + h.weight * pick(h.instrument), 0);
}

/** sqrt(w' Σ w) with the deterministic correlation model. */
export function portfolioVolatility(holdings: Holding[]): number {
  let variance = 0;
  for (const a of holdings) {
    for (const b of holdings) {
      variance += a.weight * b.weight * covariance(a.instrument, b.instrument);
    }
  }
  return Math.sqrt(Math.max(variance, 0));
}

/** Coherent drawdown aggregation: correlation-weighted quadratic blend of historical drawdowns. */
export function portfolioMaxDrawdown(holdings: Holding[]): number {
  let acc = 0;
  for (const a of holdings) {
    for (const b of holdings) {
      acc +=
        a.weight *
        b.weight *
        a.instrument.historicalMaxDrawdown *
        b.instrument.historicalMaxDrawdown *
        Math.max(correlation(a.instrument, b.instrument), 0);
    }
  }
  return Math.sqrt(Math.max(acc, 0));
}

export function computeMetrics(holdings: Holding[]): RiskMetrics {
  const invested = holdings.reduce((a, h) => a + h.weight, 0) || 1;
  const expectedReturn = weightedSum(holdings, (i) => i.expectedReturn) / invested;
  const volatility = portfolioVolatility(holdings);
  const downside = volatility * SEMI_DEV_FACTOR;
  const maxDrawdown = portfolioMaxDrawdown(holdings);
  const beta = weightedSum(holdings, (i) => i.beta);
  const hhi = holdings.reduce((a, h) => a + h.weight * h.weight, 0);

  let corrNum = 0;
  let corrDen = 0;
  for (let x = 0; x < holdings.length; x++) {
    for (let y = x + 1; y < holdings.length; y++) {
      const a = holdings[x]!;
      const b = holdings[y]!;
      const w = a.weight * b.weight;
      corrNum += w * correlation(a.instrument, b.instrument);
      corrDen += w;
    }
  }

  const sectorMap = new Map<string, number>();
  for (const h of holdings) {
    sectorMap.set(h.instrument.sector, (sectorMap.get(h.instrument.sector) ?? 0) + h.weight);
  }

  return {
    expectedReturn,
    volatility,
    sharpe: volatility > 0 ? (expectedReturn - RISK_FREE_RATE) / volatility : 0,
    sortino: downside > 0 ? (expectedReturn - RISK_FREE_RATE) / downside : 0,
    maxDrawdown,
    var95Annual: Math.max(Z95 * volatility - expectedReturn, 0),
    var95Monthly: Math.max((Z95 * volatility) / Math.sqrt(12) - expectedReturn / 12, 0),
    cvar95Annual: Math.max(CVAR_Z95 * volatility - expectedReturn, 0),
    beta,
    avgCorrelation: corrDen > 0 ? corrNum / corrDen : 0,
    hhi,
    topHoldingWeight: holdings.reduce((m, h) => Math.max(m, h.weight), 0),
    topSectorWeight: Math.max(...[...sectorMap.values()], 0),
    liquidityCoverage: weightedSum(holdings, (i) => i.liquidityScore),
    effectiveHoldings: hhi > 0 ? 1 / hhi : 0,
  };
}

interface Scenario {
  scenario: string;
  description: string;
  equityShock: number;
  rateShockBps: number;
  goldShock: number;
}

export const STRESS_SCENARIOS: Scenario[] = [
  {
    scenario: "Equity correction −20%",
    description: "Broad equity indices fall 20%, policy rates ease 50bps, gold bid up.",
    equityShock: -0.2,
    rateShockBps: -50,
    goldShock: 0.08,
  },
  {
    scenario: "Rate shock +200bps",
    description: "Inflation surprise forces aggressive tightening; duration repriced.",
    equityShock: -0.06,
    rateShockBps: 200,
    goldShock: -0.03,
  },
  {
    scenario: "Global risk-off",
    description: "Growth scare, FPI outflows, INR depreciation, flight to safety.",
    equityShock: -0.13,
    rateShockBps: 40,
    goldShock: 0.12,
  },
  {
    scenario: "Stagflation",
    description: "Weak growth with sticky inflation; both equity and duration hurt.",
    equityShock: -0.15,
    rateShockBps: 150,
    goldShock: 0.15,
  },
  {
    scenario: "2020-style crash",
    description: "Systemic shock, 35% equity drawdown, liquidity stress in small caps.",
    equityShock: -0.35,
    rateShockBps: -100,
    goldShock: 0.05,
  },
];

export function runStressTests(holdings: Holding[], totalCapital: number): StressResult[] {
  return STRESS_SCENARIOS.map((s) => {
    let impact = 0;
    for (const h of holdings) {
      const i = h.instrument;
      const eq = s.equityShock * i.equitySensitivity;
      const rates = (-s.rateShockBps / 10000) * i.ratesSensitivity;
      const gold = i.sector === "Precious Metals" ? s.goldShock : 0;
      const illiquidityDrag =
        s.equityShock < -0.15 ? -(1 - i.liquidityScore) * 0.05 * i.equitySensitivity : 0;
      impact += h.weight * (eq + rates + gold + illiquidityDrag);
    }
    return {
      scenario: s.scenario,
      description: s.description,
      portfolioImpactPct: impact * 100,
      valueAfter: totalCapital * (1 + impact),
    };
  });
}

/** Deterministic projection band using expected return ± 1 sigma over the horizon. */
export function projectValue(totalCapital: number, metrics: RiskMetrics, years: number) {
  const points = [] as { year: number; expected: number; upper: number; lower: number }[];
  for (let y = 0; y <= Math.max(1, Math.round(years)); y++) {
    const drift = Math.pow(1 + metrics.expectedReturn, y);
    const sigma = metrics.volatility * Math.sqrt(y);
    points.push({
      year: y,
      expected: totalCapital * drift,
      upper: totalCapital * drift * (1 + sigma),
      lower: totalCapital * drift * Math.max(1 - sigma, 0.2),
    });
  }
  return points;
}