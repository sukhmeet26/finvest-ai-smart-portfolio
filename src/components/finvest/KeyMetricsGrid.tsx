import React from "react";
import {
  TrendingUp,
  Activity,
  Award,
  ShieldCheck,
  Percent,
  Layers,
  Droplet,
  Compass,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import type { RiskMetrics, PortfolioInput } from "../../lib/finvest/types";
import { formatINR, formatPct, formatRawPct } from "../../lib/formatters";

interface KeyMetricsGridProps {
  metrics: RiskMetrics;
  input: PortfolioInput;
}

export function KeyMetricsGrid({ metrics, input }: KeyMetricsGridProps) {
  const isDrawdownBreached = metrics.maxDrawdown > input.maxDrawdownPct / 100;
  const isLiquiditySufficient = metrics.liquidityCoverage >= input.liquidityNeedPct / 100;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
          <Activity className="h-4 w-4 text-blue-500" />
          Deterministic Risk & Return Metrics
        </h3>
        <span className="text-[11px] text-muted-foreground">
          Risk-Free Rate ($R_f$): 6.50% • Beta Benchmark: Nifty 50
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* 1. Expected Return */}
        <div className="rounded-2xl border border-border/80 bg-card p-3.5 shadow-xs transition-all hover:shadow-md hover:border-blue-500/30">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-medium">Expected CAGR</span>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
            {formatPct(metrics.expectedReturn)}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            +{(metrics.expectedReturn * 100 - 6.5).toFixed(1)}pp over risk-free
          </p>
        </div>

        {/* 2. Volatility */}
        <div className="rounded-2xl border border-border/80 bg-card p-3.5 shadow-xs transition-all hover:shadow-md hover:border-blue-500/30">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-medium">Annual Vol (σ)</span>
            <Activity className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="text-xl font-bold tracking-tight text-foreground">
            {formatPct(metrics.volatility)}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            {metrics.volatility < 0.08 ? "Low Volatility" : metrics.volatility < 0.16 ? "Moderate Vol" : "High Growth Vol"}
          </p>
        </div>

        {/* 3. Sharpe Ratio */}
        <div className="rounded-2xl border border-border/80 bg-card p-3.5 shadow-xs transition-all hover:shadow-md hover:border-blue-500/30">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-medium">Sharpe Ratio</span>
            <Award className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
            {metrics.sharpe.toFixed(2)}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            {metrics.sharpe >= 1.5 ? "Superb Alpha" : metrics.sharpe >= 1.0 ? "Strong Efficiency" : "Adequate Return"}
          </p>
        </div>

        {/* 4. Sortino Ratio */}
        <div className="rounded-2xl border border-border/80 bg-card p-3.5 shadow-xs transition-all hover:shadow-md hover:border-blue-500/30">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-medium">Sortino Ratio</span>
            <ShieldCheck className="h-4 w-4 text-purple-500" />
          </div>
          <div className="text-xl font-bold tracking-tight text-purple-600 dark:text-purple-400">
            {metrics.sortino.toFixed(2)}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            Downside risk-adjusted
          </p>
        </div>

        {/* 5. Max Drawdown */}
        <div className={`rounded-2xl border p-3.5 shadow-xs transition-all hover:shadow-md ${
          isDrawdownBreached
            ? "border-rose-500/40 bg-rose-500/5"
            : "border-border/80 bg-card hover:border-blue-500/30"
        }`}>
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-medium">Model Max DD</span>
            <AlertCircle className={`h-4 w-4 ${isDrawdownBreached ? "text-rose-500" : "text-amber-500"}`} />
          </div>
          <div className={`text-xl font-bold tracking-tight ${
            isDrawdownBreached ? "text-rose-600 dark:text-rose-400" : "text-foreground"
          }`}>
            {formatPct(metrics.maxDrawdown)}
          </div>
          <p className={`text-[10px] mt-1 ${isDrawdownBreached ? "text-rose-500 font-semibold" : "text-muted-foreground"}`}>
            Limit: {input.maxDrawdownPct}% {isDrawdownBreached ? "(Breached)" : "(Safe)"}
          </p>
        </div>

        {/* 6. 1Y 95% VaR */}
        <div className="rounded-2xl border border-border/80 bg-card p-3.5 shadow-xs transition-all hover:shadow-md hover:border-blue-500/30">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-medium">95% Annual VaR</span>
            <Percent className="h-4 w-4 text-teal-500" />
          </div>
          <div className="text-xl font-bold tracking-tight text-foreground">
            {formatPct(metrics.var95Annual)}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            {formatINR(input.totalCapital * metrics.var95Annual, true)} 1-in-20y loss
          </p>
        </div>
      </div>

      {/* Secondary Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Beta vs Nifty */}
        <div className="rounded-xl border border-border/60 bg-muted/20 p-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-[11px] font-medium text-muted-foreground">Beta vs Nifty 50</p>
              <p className="text-sm font-bold text-foreground">{metrics.beta.toFixed(2)}</p>
            </div>
          </div>
          <span className="text-[10px] text-muted-foreground px-2 py-0.5 rounded-md bg-muted/60">
            {metrics.beta < 0.5 ? "Low Beta" : metrics.beta <= 1.0 ? "Market Beta" : "High Beta"}
          </span>
        </div>

        {/* Effective Holdings & HHI */}
        <div className="rounded-xl border border-border/60 bg-muted/20 p-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-[11px] font-medium text-muted-foreground">Effective Holdings</p>
              <p className="text-sm font-bold text-foreground">
                {metrics.effectiveHoldings.toFixed(1)} <span className="text-[10px] text-muted-foreground font-normal">(HHI: {metrics.hhi.toFixed(3)})</span>
              </p>
            </div>
          </div>
          <span className="text-[10px] text-muted-foreground px-2 py-0.5 rounded-md bg-muted/60">
            {metrics.hhi <= 0.15 ? "Well Diversified" : "Concentrated"}
          </span>
        </div>

        {/* 1-Month 95% VaR */}
        <div className="rounded-xl border border-border/60 bg-muted/20 p-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Percent className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-[11px] font-medium text-muted-foreground">1-Month 95% VaR</p>
              <p className="text-sm font-bold text-foreground">{formatPct(metrics.var95Monthly)}</p>
            </div>
          </div>
          <span className="text-[10px] text-muted-foreground">
            {formatINR(input.totalCapital * metrics.var95Monthly, true)}
          </span>
        </div>

        {/* Liquidity Coverage */}
        <div className="rounded-xl border border-border/60 bg-muted/20 p-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Droplet className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-[11px] font-medium text-muted-foreground">Liquidity Coverage</p>
              <p className="text-sm font-bold text-foreground">{formatPct(metrics.liquidityCoverage)}</p>
            </div>
          </div>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
            isLiquiditySufficient
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
          }`}>
            Req: {input.liquidityNeedPct}%
          </span>
        </div>
      </div>
    </div>
  );
}
