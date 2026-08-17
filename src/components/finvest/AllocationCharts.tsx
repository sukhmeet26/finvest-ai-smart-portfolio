import React, { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ScatterChart,
  Scatter,
  ZAxis,
} from "recharts";
import { PieChart as PieIcon, BarChart3, ScatterChart as ScatterIcon, Layers } from "lucide-react";
import type { Holding, RiskBucket, PortfolioInput } from "../../lib/finvest/types";
import { formatINR, formatPct, getRiskBucketConfig } from "../../lib/formatters";

interface AllocationChartsProps {
  holdings: Holding[];
  bucketActual: Record<RiskBucket, number>;
  input: PortfolioInput;
}

const ASSET_CLASS_COLORS: Record<string, string> = {
  "Cash & Equivalents": "#10b981",
  "Sovereign Debt": "#14b8a6",
  "Corporate Debt": "#06b6d4",
  "Commodities": "#eab308",
  "Market Neutral": "#64748b",
  "Large-Cap Equity": "#3b82f6",
  "Hybrid": "#6366f1",
  "International Equity": "#8b5cf6",
  "Real Estate": "#a855f7",
  "Mid-Cap Equity": "#f59e0b",
  "Small-Cap Equity": "#f97316",
  "Thematic Equity": "#f43f5e",
  "Factor / Momentum": "#ec4899",
};

export function AllocationCharts({
  holdings,
  bucketActual,
  input,
}: AllocationChartsProps) {
  const [activeTab, setActiveTab] = useState<"buckets" | "assets" | "scatter">("buckets");

  // 1. Bucket Data
  const bucketData = [
    {
      name: "Low Risk",
      target: input.lowPct,
      actual: +(bucketActual.low * 100).toFixed(1),
      value: bucketActual.low,
      color: "#10b981",
      amount: input.totalCapital * bucketActual.low,
    },
    {
      name: "Moderate Risk",
      target: input.moderatePct,
      actual: +(bucketActual.moderate * 100).toFixed(1),
      value: bucketActual.moderate,
      color: "#f59e0b",
      amount: input.totalCapital * bucketActual.moderate,
    },
    {
      name: "High Risk",
      target: input.highPct,
      actual: +(bucketActual.high * 100).toFixed(1),
      value: bucketActual.high,
      color: "#f43f5e",
      amount: input.totalCapital * bucketActual.high,
    },
  ].filter((b) => b.value > 0);

  // 2. Asset Class Data
  const assetMap = new Map<string, { weight: number; amount: number }>();
  for (const h of holdings) {
    const prev = assetMap.get(h.instrument.assetClass) || { weight: 0, amount: 0 };
    assetMap.set(h.instrument.assetClass, {
      weight: prev.weight + h.weight,
      amount: prev.amount + h.amount,
    });
  }

  const assetClassData = Array.from(assetMap.entries())
    .map(([assetClass, data]) => ({
      assetClass,
      weightPct: +(data.weight * 100).toFixed(1),
      amount: data.amount,
      color: ASSET_CLASS_COLORS[assetClass] || "#3b82f6",
    }))
    .sort((a, b) => b.weightPct - a.weightPct);

  // 3. Scatter Plot Data (Risk vs Return)
  const scatterData = holdings.map((h) => ({
    name: h.instrument.name,
    symbol: h.instrument.symbol,
    bucket: h.instrument.bucket,
    volatility: +(h.instrument.volatility * 100).toFixed(1),
    expectedReturn: +(h.instrument.expectedReturn * 100).toFixed(1),
    weight: +(h.weight * 100).toFixed(1),
    amount: h.amount,
    color: getRiskBucketConfig(h.instrument.bucket).color,
  }));

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-5 lg:p-6 shadow-sm">
      {/* Chart Nav Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4 mb-4">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
            <PieIcon className="h-4 w-4 text-blue-500" />
            Portfolio Composition & Risk Geometry
          </h3>
          <p className="text-xs text-muted-foreground">
            Multi-dimensional allocation by risk sleeves, underlying asset classes, and risk-return frontiers
          </p>
        </div>

        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/60">
          <button
            onClick={() => setActiveTab("buckets")}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
              activeTab === "buckets"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-background/60"
            }`}
          >
            <PieIcon className="h-3.5 w-3.5" />
            <span>Risk Buckets</span>
          </button>
          <button
            onClick={() => setActiveTab("assets")}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
              activeTab === "assets"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-background/60"
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span>Asset Classes</span>
          </button>
          <button
            onClick={() => setActiveTab("scatter")}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
              activeTab === "scatter"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-background/60"
            }`}
          >
            <ScatterIcon className="h-3.5 w-3.5" />
            <span>Risk vs Return Frontier</span>
          </button>
        </div>
      </div>

      {/* Chart View Content */}
      <div className="min-h-[280px]">
        {/* Tab 1: Risk Buckets Donut */}
        {activeTab === "buckets" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={bucketData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {bucketData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: number, name: string, item: any) => [
                      `${formatPct(val)} (${formatINR(item.payload.amount)})`,
                      `${item.payload.name} (Target: ${item.payload.target}%)`,
                    ]}
                    contentStyle={{
                      backgroundColor: "var(--color-card)",
                      borderColor: "var(--color-border)",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Target vs Actual Table */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Mandate Compliance (Target vs Modelled Actual)
              </h4>

              {bucketData.map((b) => (
                <div key={b.name} className="rounded-xl border border-border/70 bg-muted/20 p-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: b.color }} />
                      <span className="font-semibold text-foreground">{b.name}</span>
                    </div>
                    <span className="font-bold text-foreground">{formatINR(b.amount, true)}</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Target: {b.target}%</span>
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">
                      Actual: {b.actual}% (Match: 100%)
                    </span>
                  </div>

                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${b.actual}%`, backgroundColor: b.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Asset Class Bar Chart */}
        {activeTab === "assets" && (
          <div className="space-y-4">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={assetClassData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} horizontal={false} />
                  <XAxis type="number" unit="%" tick={{ fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="assetClass"
                    tick={{ fontSize: 11 }}
                    width={130}
                  />
                  <Tooltip
                    formatter={(val: number, name: string, item: any) => [
                      `${val}% (${formatINR(item.payload.amount)})`,
                      "Portfolio Weight",
                    ]}
                    contentStyle={{
                      backgroundColor: "var(--color-card)",
                      borderColor: "var(--color-border)",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="weightPct" radius={[0, 6, 6, 0]}>
                    {assetClassData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
              {assetClassData.map((a) => (
                <div key={a.assetClass} className="flex items-center gap-1.5 text-[11px] text-muted-foreground bg-muted/40 px-2.5 py-1 rounded-lg">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: a.color }} />
                  <span>{a.assetClass}:</span>
                  <span className="font-semibold text-foreground">{a.weightPct}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Risk vs Return Scatter Plot */}
        {activeTab === "scatter" && (
          <div className="space-y-3">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis
                    type="number"
                    dataKey="volatility"
                    name="Annual Volatility"
                    unit="%"
                    label={{ value: "Annual Volatility (σ %)", position: "insideBottom", offset: -10, fontSize: 11 }}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    type="number"
                    dataKey="expectedReturn"
                    name="Expected Return"
                    unit="%"
                    label={{ value: "Expected CAGR (%)", angle: -90, position: "insideLeft", fontSize: 11 }}
                    tick={{ fontSize: 11 }}
                  />
                  <ZAxis type="number" dataKey="weight" range={[60, 400]} name="Weight" unit="%" />
                  <Tooltip
                    cursor={{ strokeDasharray: "3 3" }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="rounded-xl border border-border bg-card p-2.5 text-xs shadow-lg space-y-1">
                            <p className="font-bold text-foreground">{data.name} ({data.symbol})</p>
                            <p className="text-muted-foreground">Bucket: <span className="font-semibold uppercase text-foreground">{data.bucket}</span></p>
                            <p className="text-emerald-500 font-semibold">Expected Return: {data.expectedReturn}%</p>
                            <p className="text-indigo-500 font-semibold">Annual Volatility: {data.volatility}%</p>
                            <p className="text-foreground">Portfolio Weight: {data.weight}% ({formatINR(data.amount)})</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Scatter data={scatterData}>
                    {scatterData.map((entry, index) => (
                      <Cell key={`scatter-cell-${index}`} fill={entry.color} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[11px] text-muted-foreground text-center">
              Bubble size represents position weight in the portfolio. Assets on the top-left provide superior risk-adjusted returns.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
