export type RiskBucket = "low" | "moderate" | "high";

export interface Instrument {
  id: string;
  name: string;
  symbol: string;
  bucket: RiskBucket;
  assetClass: string;
  sector: string;
  expectedReturn: number; // annual, decimal
  volatility: number; // annual stdev, decimal
  beta: number; // vs Nifty 50
  liquidityScore: number; // 0..1 (1 = same-day)
  valuationScore: number; // 0..1 (1 = attractive)
  historicalMaxDrawdown: number; // decimal, positive number
  cagr3y: number;
  equitySensitivity: number; // 0..1 exposure to equity shock
  ratesSensitivity: number; // duration-like, years
  notes: string;
}

export interface PortfolioInput {
  totalCapital: number;
  lowPct: number;
  moderatePct: number;
  highPct: number;
  horizonYears: number;
  liquidityNeedPct: number; // % of capital needed within 12 months
  goal: string;
  maxDrawdownPct: number; // acceptable drawdown, %
}

export interface Holding {
  instrument: Instrument;
  weight: number; // fraction of total capital
  amount: number;
  rationale: string;
}

export interface StressResult {
  scenario: string;
  description: string;
  portfolioImpactPct: number;
  valueAfter: number;
}

export interface RiskMetrics {
  expectedReturn: number;
  volatility: number;
  sharpe: number;
  sortino: number;
  maxDrawdown: number;
  var95Annual: number;
  var95Monthly: number;
  cvar95Annual: number;
  beta: number;
  avgCorrelation: number;
  hhi: number;
  topHoldingWeight: number;
  topSectorWeight: number;
  liquidityCoverage: number;
  effectiveHoldings: number;
}

export interface CriticFinding {
  iteration: number;
  code: string;
  severity: "info" | "warning" | "critical";
  message: string;
  action: string;
  resolved: boolean;
}

export interface AgentStep {
  agent: string;
  status: "done" | "skipped";
  summary: string;
  detail: string;
  durationMs: number;
}

export interface MonitorAlert {
  id: string;
  type: "drift" | "volatility" | "market_event" | "limit_breach";
  severity: "info" | "warning" | "critical";
  title: string;
  detail: string;
  recommendation: string;
  requiresApproval: boolean;
}

export interface PortfolioResult {
  input: PortfolioInput;
  holdings: Holding[];
  bucketActual: Record<RiskBucket, number>;
  metrics: RiskMetrics;
  stress: StressResult[];
  findings: CriticFinding[];
  iterations: number;
  agentTrace: AgentStep[];
  alerts: MonitorAlert[];
  explanation: string;
  constraintsSatisfied: boolean;
}