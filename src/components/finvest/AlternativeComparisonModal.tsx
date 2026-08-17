import React from "react";
import {
  GitCompare,
  X,
  TrendingUp,
  ShieldCheck,
  Activity,
  ArrowRight,
  Check,
  Zap,
} from "lucide-react";
import type { PortfolioResult, Holding } from "../../lib/finvest/types";
import { buildLowerVolatilityAlternative } from "../../lib/finvest/orchestrator";
import { formatINR, formatPct } from "../../lib/formatters";

interface AlternativeComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPortfolio: PortfolioResult;
  onApplyAlternative?: (altHoldings: Holding[]) => void;
}

export function AlternativeComparisonModal({
  isOpen,
  onClose,
  currentPortfolio,
  onApplyAlternative,
}: AlternativeComparisonModalProps) {
  if (!isOpen) return null;

  const alt = buildLowerVolatilityAlternative(currentPortfolio.input);
  const curM = currentPortfolio.metrics;
  const altM = alt.metrics;

  const volDelta = ((altM.volatility - curM.volatility) / curM.volatility) * 100;
  const returnDelta = ((altM.expectedReturn - curM.expectedReturn) / curM.expectedReturn) * 100;
  const sharpeDelta = altM.sharpe - curM.sharpe;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <GitCompare className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight text-foreground">
                Minimum-Variance Alternative Portfolio
              </h3>
              <p className="text-xs text-muted-foreground">
                Mathematical optimization minimizing portfolio variance while strictly preserving your {currentPortfolio.input.lowPct}/{currentPortfolio.input.moderatePct}/{currentPortfolio.input.highPct} risk split
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* High-Level Comparison Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Volatility Reduction */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Volatility Risk Delta
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-foreground">{formatPct(curM.volatility)}</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatPct(altM.volatility)}
              </span>
            </div>
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              {volDelta.toFixed(1)}% Risk Reduction
            </p>
          </div>

          {/* Expected Return */}
          <div className="rounded-xl border border-border/70 bg-background p-4 space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Expected Return (CAGR)
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-foreground">{formatPct(curM.expectedReturn)}</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <span className="text-xl font-bold text-foreground">
                {formatPct(altM.expectedReturn)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {returnDelta > 0 ? `+${returnDelta.toFixed(1)}%` : `${returnDelta.toFixed(1)}%`}
            </p>
          </div>

          {/* Sharpe Efficiency */}
          <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Sharpe Ratio Efficiency
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-foreground">{curM.sharpe.toFixed(2)}</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                {altM.sharpe.toFixed(2)}
              </span>
            </div>
            <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              {sharpeDelta >= 0 ? `+${sharpeDelta.toFixed(2)}` : sharpeDelta.toFixed(2)} Sharpe Delta
            </p>
          </div>
        </div>

        {/* Holdings Comparison Table */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Weight Distribution Comparison
          </h4>
          <div className="overflow-x-auto rounded-xl border border-border/70">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border/70 text-[11px] text-muted-foreground">
                <tr>
                  <th className="py-2.5 px-3">Instrument</th>
                  <th className="py-2.5 px-3">Risk Bucket</th>
                  <th className="py-2.5 px-3 text-right">Current Weight</th>
                  <th className="py-2.5 px-3 text-right">Alternative Weight</th>
                  <th className="py-2.5 px-3 text-right">Delta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {currentPortfolio.holdings.map((h) => {
                  const altH = alt.holdings.find((a) => a.instrument.id === h.instrument.id);
                  const altWeight = altH ? altH.weight : 0;
                  const deltaWeight = (altWeight - h.weight) * 100;

                  return (
                    <tr key={h.instrument.id} className="hover:bg-muted/20">
                      <td className="py-2.5 px-3 font-semibold text-foreground">
                        {h.instrument.symbol} - <span className="font-normal text-muted-foreground">{h.instrument.name}</span>
                      </td>
                      <td className="py-2.5 px-3 capitalize text-muted-foreground">{h.instrument.bucket}</td>
                      <td className="py-2.5 px-3 text-right font-medium text-foreground">{formatPct(h.weight)}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-foreground">{formatPct(altWeight)}</td>
                      <td className={`py-2.5 px-3 text-right font-semibold ${
                        deltaWeight > 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : deltaWeight < 0
                          ? "text-rose-600 dark:text-rose-400"
                          : "text-muted-foreground"
                      }`}>
                        {deltaWeight > 0 ? `+${deltaWeight.toFixed(1)}pp` : deltaWeight < 0 ? `${deltaWeight.toFixed(1)}pp` : "0.0pp"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-2 border-t border-border/60">
          <button
            onClick={onClose}
            className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
