import React, { useState } from "react";
import {
  Flame,
  ShieldAlert,
  Sliders,
  TrendingDown,
  RefreshCw,
  AlertTriangle,
  Zap,
} from "lucide-react";
import type { Holding, StressResult } from "../../lib/finvest/types";
import { formatINR, formatPct, formatRawPct } from "../../lib/formatters";

interface StressTestMatrixProps {
  stress: StressResult[];
  holdings: Holding[];
  totalCapital: number;
}

export function StressTestMatrix({
  stress,
  holdings,
  totalCapital,
}: StressTestMatrixProps) {
  // Custom Stress Sandbox State
  const [customEquity, setCustomEquity] = useState(-20);
  const [customRateBps, setCustomRateBps] = useState(100);
  const [customGold, setCustomGold] = useState(10);

  // Compute Custom Sandbox Impact
  const calculateCustomImpact = () => {
    let impact = 0;
    for (const h of holdings) {
      const i = h.instrument;
      const eq = (customEquity / 100) * i.equitySensitivity;
      const rates = (-customRateBps / 10000) * i.ratesSensitivity;
      const gold = i.sector === "Precious Metals" ? customGold / 100 : 0;
      const illiquidityDrag =
        customEquity < -15 ? -(1 - i.liquidityScore) * 0.05 * i.equitySensitivity : 0;
      impact += h.weight * (eq + rates + gold + illiquidityDrag);
    }
    return {
      pct: impact * 100,
      valueAfter: totalCapital * (1 + impact),
    };
  };

  const customResult = calculateCustomImpact();

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-5 lg:p-6 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
            <Flame className="h-4 w-4 text-rose-500" />
            Macro Stress-Testing & Crisis Simulation Engine
          </h3>
          <p className="text-xs text-muted-foreground">
            Multi-factor historical shocks and interactive sandbox simulating systemic tail-risk events
          </p>
        </div>

        <span className="text-[11px] font-semibold text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-xl">
          Deterministic Sensitivity Model
        </span>
      </div>

      {/* 5 Scenario Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {stress.map((s, idx) => {
          const isPositive = s.portfolioImpactPct >= 0;
          const isSevere = s.portfolioImpactPct < -10;

          return (
            <div
              key={s.scenario}
              className={`rounded-xl border p-3.5 space-y-2 transition-all ${
                isSevere
                  ? "border-rose-500/30 bg-rose-500/5 hover:border-rose-500/50"
                  : "border-border/70 bg-background hover:border-blue-500/30"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Scenario #{idx + 1}
                </span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                    isPositive
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {formatRawPct(s.portfolioImpactPct, 1)}
                </span>
              </div>

              <h4 className="text-xs font-bold text-foreground leading-tight">
                {s.scenario}
              </h4>

              <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                {s.description}
              </p>

              <div className="pt-2 border-t border-border/50">
                <span className="text-[10px] text-muted-foreground block">Simulated Value</span>
                <span className="text-xs font-bold text-foreground">
                  {formatINR(s.valueAfter, true)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Custom Stress Sandbox */}
      <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-blue-500" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Custom Crisis Sandbox (Live Shock Simulator)
            </h4>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Sandbox Impact:</span>
            <span
              className={`font-bold px-2.5 py-0.5 rounded-md text-sm ${
                customResult.pct >= 0
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
              }`}
            >
              {formatRawPct(customResult.pct, 2)} ({formatINR(customResult.valueAfter, true)})
            </span>
          </div>
        </div>

        {/* Sliders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Equity Shock */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="font-semibold text-foreground">Equity Shock:</span>
              <span className="font-bold text-rose-500">{customEquity}%</span>
            </div>
            <input
              type="range"
              min={-50}
              max={20}
              step={1}
              value={customEquity}
              onChange={(e) => setCustomEquity(Number(e.target.value))}
              className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
          </div>

          {/* Rate Shock */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="font-semibold text-foreground">Interest Rate Shock:</span>
              <span className="font-bold text-blue-500">+{customRateBps} bps</span>
            </div>
            <input
              type="range"
              min={-200}
              max={400}
              step={25}
              value={customRateBps}
              onChange={(e) => setCustomRateBps(Number(e.target.value))}
              className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          {/* Gold Shock */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="font-semibold text-foreground">Gold Flight-to-Safety:</span>
              <span className="font-bold text-amber-500">+{customGold}%</span>
            </div>
            <input
              type="range"
              min={-20}
              max={40}
              step={2}
              value={customGold}
              onChange={(e) => setCustomGold(Number(e.target.value))}
              className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
