import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, ShieldCheck, Zap } from "lucide-react";
import type { RiskMetrics, PortfolioInput } from "../../lib/finvest/types";
import { projectValue } from "../../lib/finvest/risk-engine";
import { formatINR, formatPct } from "../../lib/formatters";

interface WealthProjectionChartProps {
  input: PortfolioInput;
  metrics: RiskMetrics;
}

export function WealthProjectionChart({
  input,
  metrics,
}: WealthProjectionChartProps) {
  const points = projectValue(input.totalCapital, metrics, input.horizonYears);
  const terminalPoint = points[points.length - 1] || { expected: input.totalCapital, upper: input.totalCapital, lower: input.totalCapital };
  const totalGain = terminalPoint.expected - input.totalCapital;
  const totalGainPct = (totalGain / input.totalCapital) * 100;

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-5 lg:p-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4 mb-4">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            {input.horizonYears}-Year Wealth Compounding Projection
          </h3>
          <p className="text-xs text-muted-foreground">
            Deterministic mean compounding path ($\pm 1\sigma$ annualized volatility corridor)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-1 text-right">
            <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
              Expected Terminal Corpus
            </span>
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
              {formatINR(terminalPoint.expected, true)} (+{totalGainPct.toFixed(1)}%)
            </span>
          </div>
        </div>
      </div>

      {/* Projection Chart */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorUpper" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorExpected" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
            <XAxis
              dataKey="year"
              unit="y"
              label={{ value: "Horizon (Years)", position: "insideBottom", offset: -5, fontSize: 11 }}
              tick={{ fontSize: 11 }}
            />
            <YAxis
              tickFormatter={(val) => formatINR(val, true)}
              tick={{ fontSize: 11 }}
              width={75}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="rounded-xl border border-border bg-card p-3 text-xs shadow-xl space-y-1.5 min-w-[200px]">
                      <p className="font-bold text-foreground border-b border-border/60 pb-1">
                        Year {label} Projection
                      </p>
                      <div className="flex justify-between text-blue-500">
                        <span>Bull Case (+1σ):</span>
                        <span className="font-semibold">{formatINR(data.upper)}</span>
                      </div>
                      <div className="flex justify-between text-emerald-500">
                        <span>Expected Path:</span>
                        <span className="font-bold">{formatINR(data.expected)}</span>
                      </div>
                      <div className="flex justify-between text-amber-500">
                        <span>Bear Case (-1σ):</span>
                        <span className="font-semibold">{formatINR(data.lower)}</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            {/* Confidence Band Upper */}
            <Area
              type="monotone"
              dataKey="upper"
              stroke="#3b82f6"
              strokeDasharray="4 4"
              fill="url(#colorUpper)"
              name="Upper (+1σ)"
            />
            {/* Expected Core Path */}
            <Area
              type="monotone"
              dataKey="expected"
              stroke="#10b981"
              strokeWidth={2.5}
              fill="url(#colorExpected)"
              name="Expected Path"
            />
            {/* Confidence Band Lower */}
            <Area
              type="monotone"
              dataKey="lower"
              stroke="#f59e0b"
              strokeDasharray="4 4"
              fill="transparent"
              name="Lower (-1σ)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Projection Legend / Summary */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-border/50 pt-3 text-xs">
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          <span>Expected Mean:</span>
          <span className="font-semibold text-foreground">{formatINR(terminalPoint.expected, true)}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
          <span>Bull Scenario (+1σ):</span>
          <span className="font-semibold text-foreground">{formatINR(terminalPoint.upper, true)}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
          <span>Bear Scenario (-1σ):</span>
          <span className="font-semibold text-foreground">{formatINR(terminalPoint.lower, true)}</span>
        </div>
      </div>
    </div>
  );
}
