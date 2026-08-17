import React, { useState } from "react";
import {
  Table as TableIcon,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Info,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import type { Holding, RiskBucket } from "../../lib/finvest/types";
import { formatINR, formatPct, formatScore, getRiskBucketConfig } from "../../lib/formatters";

interface HoldingsTableProps {
  holdings: Holding[];
  totalCapital: number;
}

export function HoldingsTable({ holdings, totalCapital }: HoldingsTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBucket, setSelectedBucket] = useState<RiskBucket | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredHoldings = holdings.filter((h) => {
    const matchesSearch =
      h.instrument.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.instrument.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.instrument.sector.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.instrument.assetClass.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesBucket = selectedBucket === "all" || h.instrument.bucket === selectedBucket;

    return matchesSearch && matchesBucket;
  });

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-5 lg:p-6 shadow-sm space-y-4">
      {/* Table Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
            <TableIcon className="h-4 w-4 text-blue-500" />
            Portfolio Holdings Matrix ({holdings.length} Selected Instruments)
          </h3>
          <p className="text-xs text-muted-foreground">
            Inverse-volatility weighted positions, factor attributes, and agent rationale
          </p>
        </div>

        {/* Search & Bucket Filter */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search symbol, sector..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 w-44 rounded-xl border border-input bg-background pl-8 pr-3 text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>

          {/* Bucket Filter Tabs */}
          <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-xl border border-border/60 text-xs">
            {(["all", "low", "moderate", "high"] as const).map((b) => (
              <button
                key={b}
                onClick={() => setSelectedBucket(b)}
                className={`rounded-lg px-2.5 py-1 font-medium capitalize transition-all ${
                  selectedBucket === b
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/60"
                }`}
              >
                {b === "all" ? "All" : b}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-xl border border-border/70">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-muted/50 border-b border-border/70 text-[11px] font-semibold text-muted-foreground">
              <th className="py-3 px-4">Instrument</th>
              <th className="py-3 px-3">Sleeve</th>
              <th className="py-3 px-3">Asset Class / Sector</th>
              <th className="py-3 px-3 text-right">Weight</th>
              <th className="py-3 px-3 text-right">Capital (INR)</th>
              <th className="py-3 px-3 text-right">Exp. Return</th>
              <th className="py-3 px-3 text-right">Annual Vol</th>
              <th className="py-3 px-3 text-right">Beta</th>
              <th className="py-3 px-3 text-center">Liquidity</th>
              <th className="py-3 px-4 text-center">Rationale</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50 bg-background">
            {filteredHoldings.map((h) => {
              const bucketCfg = getRiskBucketConfig(h.instrument.bucket);
              const isExpanded = expandedId === h.instrument.id;
              const liq = formatScore(h.instrument.liquidityScore);

              return (
                <React.Fragment key={h.instrument.id}>
                  <tr
                    onClick={() => toggleExpand(h.instrument.id)}
                    className="hover:bg-accent/40 cursor-pointer transition-colors"
                  >
                    {/* Symbol & Name */}
                    <td className="py-3 px-4">
                      <div>
                        <span className="font-bold text-foreground">{h.instrument.symbol}</span>
                        <p className="text-[11px] text-muted-foreground line-clamp-1">
                          {h.instrument.name}
                        </p>
                      </div>
                    </td>

                    {/* Bucket */}
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold border ${bucketCfg.badgeClass}`}>
                        {bucketCfg.label}
                      </span>
                    </td>

                    {/* Asset Class / Sector */}
                    <td className="py-3 px-3">
                      <div>
                        <span className="text-foreground font-medium">{h.instrument.assetClass}</span>
                        <p className="text-[10px] text-muted-foreground">{h.instrument.sector}</p>
                      </div>
                    </td>

                    {/* Weight */}
                    <td className="py-3 px-3 text-right">
                      <span className="font-bold text-foreground">{formatPct(h.weight)}</span>
                      <div className="w-12 h-1 bg-muted rounded-full ml-auto mt-1 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(100, h.weight * 300)}%`,
                            backgroundColor: bucketCfg.color,
                          }}
                        />
                      </div>
                    </td>

                    {/* Capital INR */}
                    <td className="py-3 px-3 text-right font-semibold text-foreground">
                      {formatINR(h.amount)}
                    </td>

                    {/* Exp Return */}
                    <td className="py-3 px-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatPct(h.instrument.expectedReturn)}
                    </td>

                    {/* Volatility */}
                    <td className="py-3 px-3 text-right font-medium text-foreground">
                      {formatPct(h.instrument.volatility)}
                    </td>

                    {/* Beta */}
                    <td className="py-3 px-3 text-right font-mono text-muted-foreground">
                      {h.instrument.beta.toFixed(2)}
                    </td>

                    {/* Liquidity */}
                    <td className="py-3 px-3 text-center">
                      <span className={`font-semibold ${liq.color} text-[11px]`}>
                        {liq.text}/10
                      </span>
                    </td>

                    {/* Expand Toggle */}
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                    </td>
                  </tr>

                  {/* Expandable Row Details */}
                  {isExpanded && (
                    <tr className="bg-muted/30 border-b border-border/70">
                      <td colSpan={10} className="py-3 px-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          {/* Engine Rationale */}
                          <div className="space-y-1 rounded-xl border border-blue-500/20 bg-blue-500/5 p-3">
                            <span className="font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                              <Info className="h-3.5 w-3.5" />
                              Portfolio Manager Agent Rationale
                            </span>
                            <p className="text-foreground leading-relaxed">
                              {h.rationale}
                            </p>
                          </div>

                          {/* Instrument Intelligence */}
                          <div className="space-y-1 rounded-xl border border-border/70 bg-background p-3">
                            <span className="font-semibold text-foreground flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                              Market Research Factor Profile
                            </span>
                            <p className="text-muted-foreground leading-relaxed">
                              {h.instrument.notes}
                            </p>
                            <div className="flex flex-wrap gap-3 pt-1 text-[11px] text-muted-foreground border-t border-border/50 mt-1.5">
                              <span>3Y Realized CAGR: <b className="text-foreground">{formatPct(h.instrument.cagr3y)}</b></span>
                              <span>Historical Max DD: <b className="text-foreground">{formatPct(h.instrument.historicalMaxDrawdown)}</b></span>
                              <span>Rates Sensitivity: <b className="text-foreground">{h.instrument.ratesSensitivity}y</b></span>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
