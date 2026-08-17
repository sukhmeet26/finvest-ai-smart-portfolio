import type { PortfolioInput } from "./finvest/types";

export interface PortfolioPreset {
  id: string;
  name: string;
  tagline: string;
  description: string;
  iconName: string;
  input: PortfolioInput;
}

export const PORTFOLIO_PRESETS: PortfolioPreset[] = [
  {
    id: "conservative-wealth",
    name: "Conservative Wealth",
    tagline: "Capital Preservation & Steady Real Yield",
    description: "Focuses on sovereign debt, AAA accrual bonds, and gold ballast. Low volatility with high liquidity.",
    iconName: "ShieldCheck",
    input: {
      totalCapital: 1000000,
      lowPct: 60,
      moderatePct: 30,
      highPct: 10,
      horizonYears: 4,
      liquidityNeedPct: 20,
      goal: "Capital Preservation & Steady Growth",
      maxDrawdownPct: 8,
    },
  },
  {
    id: "balanced-growth",
    name: "Balanced Multi-Asset",
    tagline: "All-Weather Long-Term Growth",
    description: "Even blend across large-cap equity, REITs, high-grade debt, and gold to optimize Sharpe ratio.",
    iconName: "Scale",
    input: {
      totalCapital: 2500000,
      lowPct: 30,
      moderatePct: 50,
      highPct: 20,
      horizonYears: 7,
      liquidityNeedPct: 10,
      goal: "Long-Term Wealth Accumulation",
      maxDrawdownPct: 15,
    },
  },
  {
    id: "aggressive-alpha",
    name: "Aggressive Alpha",
    tagline: "High Compound Growth & Thematic Beta",
    description: "Maximized exposure to mid-cap momentum, thematic manufacturing, defense, and high-beta equities.",
    iconName: "TrendingUp",
    input: {
      totalCapital: 1500000,
      lowPct: 10,
      moderatePct: 40,
      highPct: 50,
      horizonYears: 10,
      liquidityNeedPct: 5,
      goal: "Financial Independence / FIRE",
      maxDrawdownPct: 25,
    },
  },
  {
    id: "retirement-income",
    name: "Retirement Drawdown Buffer",
    tagline: "High Liquidity & Defensive Yield",
    description: "Generates predictable cash-flow with overnight debt and dividend-yield equity while buffering downside.",
    iconName: "Coins",
    input: {
      totalCapital: 5000000,
      lowPct: 55,
      moderatePct: 35,
      highPct: 10,
      horizonYears: 5,
      liquidityNeedPct: 30,
      goal: "Retirement Income & Stability",
      maxDrawdownPct: 10,
    },
  },
  {
    id: "young-professional",
    name: "Young Professional High-Beta",
    tagline: "Long-Horizon Compounding",
    description: "Optimized for a 15+ year runway capable of absorbing cyclical downturns for superior terminal wealth.",
    iconName: "Zap",
    input: {
      totalCapital: 800000,
      lowPct: 15,
      moderatePct: 35,
      highPct: 50,
      horizonYears: 15,
      liquidityNeedPct: 5,
      goal: "Home Down Payment & Early Wealth Creation",
      maxDrawdownPct: 28,
    },
  },
];
