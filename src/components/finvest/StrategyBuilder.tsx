import React, { useState } from "react";
import {
  Sliders,
  Wallet,
  Calendar,
  Droplet,
  Target,
  ShieldAlert,
  Play,
  RotateCcw,
  Sparkles,
  Info,
  Lock,
  Unlock,
  AlertTriangle,
} from "lucide-react";
import type { PortfolioInput } from "../../lib/finvest/types";
import { formatINR } from "../../lib/formatters";

interface StrategyBuilderProps {
  input: PortfolioInput;
  onChange: (input: PortfolioInput) => void;
  onSimulate: () => void;
  isSimulating: boolean;
}

const FINANCIAL_GOALS = [
  "Long-Term Wealth Accumulation",
  "Financial Independence / FIRE",
  "Retirement Corpus & Income",
  "Child Higher Education Fund",
  "House Down Payment (3-5 Years)",
  "Capital Preservation & Steady Yield",
  "Aggressive Alpha & Compounder",
];

export function StrategyBuilder({
  input,
  onChange,
  onSimulate,
  isSimulating,
}: StrategyBuilderProps) {
  const [lockedBucket, setLockedBucket] = useState<"low" | "moderate" | "high" | null>(null);

  // Capital adjustments
  const handleAddCapital = (delta: number) => {
    const nextCapital = Math.max(10000, input.totalCapital + delta);
    onChange({ ...input, totalCapital: nextCapital });
  };

  // Smart 3-way linked risk balance
  const handleSliderChange = (bucket: "low" | "moderate" | "high", rawVal: number) => {
    const newVal = Math.max(0, Math.min(100, Math.round(rawVal)));
    const buckets: ("low" | "moderate" | "high")[] = ["low", "moderate", "high"];
    const otherBuckets = buckets.filter((b) => b !== bucket);

    if (lockedBucket && lockedBucket !== bucket) {
      // If one bucket is locked, the other unlocked bucket takes the entire remainder
      const lockedVal = input[`${lockedBucket}Pct`];
      const remainingTarget = 100 - newVal - lockedVal;
      const flexBucket = otherBuckets.find((b) => b !== lockedBucket)!;
      
      if (remainingTarget >= 0) {
        onChange({
          ...input,
          [`${bucket}Pct`]: newVal,
          [`${flexBucket}Pct`]: remainingTarget,
        });
      } else {
        // Exceeds available space
        const adjustedNew = 100 - lockedVal;
        onChange({
          ...input,
          [`${bucket}Pct`]: adjustedNew,
          [`${flexBucket}Pct`]: 0,
        });
      }
      return;
    }

    // Default proportional rebalance between the other 2 buckets
    const remaining = 100 - newVal;
    const [b1, b2] = otherBuckets;
    const currentSumOther = input[`${b1}Pct`] + input[`${b2}Pct`];

    let newB1 = 0;
    let newB2 = 0;

    if (currentSumOther <= 0) {
      newB1 = Math.round(remaining / 2);
      newB2 = remaining - newB1;
    } else {
      newB1 = Math.round((input[`${b1}Pct`] / currentSumOther) * remaining);
      newB2 = remaining - newB1;
    }

    onChange({
      ...input,
      [`${bucket}Pct`]: newVal,
      [`${b1}Pct`]: Math.max(0, newB1),
      [`${b2}Pct`]: Math.max(0, newB2),
    });
  };

  // Quick auto-optimizer based on horizon & drawdown
  const handleAutoOptimize = () => {
    let low = 30;
    let mod = 50;
    let high = 20;

    if (input.horizonYears <= 3 || input.maxDrawdownPct <= 10) {
      low = 60;
      mod = 30;
      high = 10;
    } else if (input.horizonYears >= 10 && input.maxDrawdownPct >= 25) {
      low = 10;
      mod = 40;
      high = 50;
    } else if (input.liquidityNeedPct >= 30) {
      low = Math.max(40, input.liquidityNeedPct);
      mod = Math.round((100 - low) * 0.6);
      high = 100 - low - mod;
    }

    onChange({
      ...input,
      lowPct: low,
      moderatePct: mod,
      highPct: high,
    });
  };

  const totalSum = input.lowPct + input.moderatePct + input.highPct;
  const isDrawdownRiskMismatch = input.highPct >= 40 && input.maxDrawdownPct < 15;
  const isLiquidityShortfallRisk = input.liquidityNeedPct > input.lowPct;

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-5 lg:p-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Strategy & Mandate Inputs
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure capital, risk allocation bounds, liquidity, and drawdown constraints
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleAutoOptimize}
            className="inline-flex items-center gap-1.5 rounded-xl border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI Auto-Balance</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Capital Input */}
        <div className="space-y-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Wallet className="h-3.5 w-3.5 text-indigo-500" />
              Total Investment Capital (INR)
            </label>
            <span className="text-sm font-bold text-foreground">
              {formatINR(input.totalCapital, true)}
            </span>
          </div>

          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
              ₹
            </span>
            <input
              type="number"
              min={10000}
              step={50000}
              value={input.totalCapital}
              onChange={(e) => onChange({ ...input, totalCapital: Math.max(10000, Number(e.target.value) || 10000) })}
              className="w-full rounded-xl border border-input bg-background pl-8 pr-3 py-2.5 text-sm font-semibold text-foreground shadow-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
              placeholder="1000000"
            />
          </div>

          {/* Quick Capital Multiplier Buttons */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {[
              { label: "+1L", val: 100000 },
              { label: "+5L", val: 500000 },
              { label: "+10L", val: 1000000 },
              { label: "+25L", val: 2500000 },
              { label: "+1Cr", val: 10000000 },
            ].map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => handleAddCapital(chip.val)}
                className="rounded-lg border border-border/70 bg-muted/40 px-2 py-0.5 text-[11px] font-semibold text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Investment Horizon & Goal */}
        <div className="space-y-4 lg:col-span-1">
          {/* Horizon */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-blue-500" />
                Investment Horizon
              </label>
              <span className="font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md">
                {input.horizonYears} {input.horizonYears === 1 ? "Year" : "Years"}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={30}
              step={1}
              value={input.horizonYears}
              onChange={(e) => onChange({ ...input, horizonYears: Number(e.target.value) })}
              className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>1y (Tactical)</span>
              <span>7y (Balanced)</span>
              <span>30y (Multi-Decade)</span>
            </div>
          </div>

          {/* Financial Goal */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5 text-purple-500" />
              Primary Financial Objective
            </label>
            <select
              value={input.goal}
              onChange={(e) => onChange({ ...input, goal: e.target.value })}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-medium text-foreground shadow-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
            >
              {FINANCIAL_GOALS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Liquidity Needs & Max Acceptable Drawdown */}
        <div className="space-y-4 lg:col-span-1">
          {/* Liquidity Needs */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-foreground flex items-center gap-1.5">
                <Droplet className="h-3.5 w-3.5 text-teal-500" />
                12-Month Liquidity Requirement
              </label>
              <span className="font-bold text-teal-600 dark:text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-md">
                {input.liquidityNeedPct}% ({formatINR((input.totalCapital * input.liquidityNeedPct) / 100, true)})
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={input.liquidityNeedPct}
              onChange={(e) => onChange({ ...input, liquidityNeedPct: Number(e.target.value) })}
              className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-teal-600"
            />
            {isLiquidityShortfallRisk && (
              <p className="text-[11px] text-amber-500 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 inline" />
                Liquidity need ({input.liquidityNeedPct}%) exceeds low-risk sleeve ({input.lowPct}%)
              </p>
            )}
          </div>

          {/* Max Acceptable Drawdown */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-foreground flex items-center gap-1.5">
                <ShieldAlert className="h-3.5 w-3.5 text-rose-500" />
                Max Acceptable Drawdown
              </label>
              <span className="font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md">
                {input.maxDrawdownPct}% Max Loss
              </span>
            </div>
            <input
              type="range"
              min={2}
              max={50}
              step={1}
              value={input.maxDrawdownPct}
              onChange={(e) => onChange({ ...input, maxDrawdownPct: Number(e.target.value) })}
              className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-rose-600"
            />
            {isDrawdownRiskMismatch && (
              <p className="text-[11px] text-rose-500 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 inline" />
                High equity weight ({input.highPct}%) may breach {input.maxDrawdownPct}% drawdown limit
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 3-Way Linked Risk Allocation Sliders */}
      <div className="mt-6 pt-5 border-t border-border/60">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Risk Bucket Target Allocation
            </h3>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
              Math.abs(totalSum - 100) < 0.1
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
            }`}>
              Total: {totalSum}%
            </span>
          </div>

          <span className="text-[11px] text-muted-foreground">
            Sleeves auto-balance dynamically to maintain exactly 100% total
          </span>
        </div>

        {/* Visual Allocation Ribbon */}
        <div className="h-3.5 w-full rounded-full overflow-hidden flex bg-muted/60 mb-4 shadow-inner">
          <div
            style={{ width: `${input.lowPct}%` }}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300 relative group"
            title={`Low Risk: ${input.lowPct}%`}
          />
          <div
            style={{ width: `${input.moderatePct}%` }}
            className="bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300 relative group"
            title={`Moderate Risk: ${input.moderatePct}%`}
          />
          <div
            style={{ width: `${input.highPct}%` }}
            className="bg-gradient-to-r from-rose-500 to-pink-500 transition-all duration-300 relative group"
            title={`High Risk: ${input.highPct}%`}
          />
        </div>

        {/* Slider Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Low Risk */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span className="text-xs font-semibold text-foreground">Low Risk Sleeve</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setLockedBucket(lockedBucket === "low" ? null : "low")}
                  className="text-muted-foreground hover:text-foreground"
                  title={lockedBucket === "low" ? "Unlock sleeve" : "Lock sleeve while adjusting others"}
                >
                  {lockedBucket === "low" ? <Lock className="h-3 w-3 text-emerald-500" /> : <Unlock className="h-3 w-3" />}
                </button>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                  {input.lowPct}%
                </span>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Liquid Funds, Sovereign G-Secs, AAA Corporate Debt, Gold ETF ({formatINR((input.totalCapital * input.lowPct) / 100, true)})
            </p>
            <input
              type="range"
              min={0}
              max={100}
              value={input.lowPct}
              onChange={(e) => handleSliderChange("low", Number(e.target.value))}
              className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
          </div>

          {/* Moderate Risk */}
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                <span className="text-xs font-semibold text-foreground">Moderate Risk Sleeve</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setLockedBucket(lockedBucket === "moderate" ? null : "moderate")}
                  className="text-muted-foreground hover:text-foreground"
                  title={lockedBucket === "moderate" ? "Unlock sleeve" : "Lock sleeve while adjusting others"}
                >
                  {lockedBucket === "moderate" ? <Lock className="h-3 w-3 text-amber-500" /> : <Unlock className="h-3 w-3" />}
                </button>
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
                  {input.moderatePct}%
                </span>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Nifty 50, Hybrid (65/35), Dividend Yield, Developed FoF, REITs ({formatINR((input.totalCapital * input.moderatePct) / 100, true)})
            </p>
            <input
              type="range"
              min={0}
              max={100}
              value={input.moderatePct}
              onChange={(e) => handleSliderChange("moderate", Number(e.target.value))}
              className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-amber-600"
            />
          </div>

          {/* High Risk */}
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                <span className="text-xs font-semibold text-foreground">High Risk Sleeve</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setLockedBucket(lockedBucket === "high" ? null : "high")}
                  className="text-muted-foreground hover:text-foreground"
                  title={lockedBucket === "high" ? "Unlock sleeve" : "Lock sleeve while adjusting others"}
                >
                  {lockedBucket === "high" ? <Lock className="h-3 w-3 text-rose-500" /> : <Unlock className="h-3 w-3" />}
                </button>
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md">
                  {input.highPct}%
                </span>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Mid-Cap 150, Small-Cap 250, Alpha Momentum, Infra & Tech ({formatINR((input.totalCapital * input.highPct) / 100, true)})
            </p>
            <input
              type="range"
              min={0}
              max={100}
              value={input.highPct}
              onChange={(e) => handleSliderChange("high", Number(e.target.value))}
              className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-rose-600"
            />
          </div>
        </div>

        {/* Action Button: Run Multi-Agent Simulation */}
        <div className="mt-5 flex justify-end">
          <button
            onClick={onSimulate}
            disabled={isSimulating}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:from-blue-700 hover:to-purple-700 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
          >
            {isSimulating ? (
              <>
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Orchestrating 7 Agents...</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-current" />
                <span>Run Agentic Portfolio Simulation</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
