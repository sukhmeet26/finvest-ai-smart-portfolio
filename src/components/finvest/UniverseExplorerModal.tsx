import React, { useState } from "react";
import {
  Database,
  X,
  Search,
  Filter,
  TrendingUp,
  ShieldCheck,
  Activity,
  Layers,
} from "lucide-react";
import { INSTRUMENT_UNIVERSE } from "../../lib/finvest/instruments";
import type { RiskBucket, Instrument } from "../../lib/finvest/types";
import { formatPct, formatScore, getRiskBucketConfig } from "../../lib/formatters";

interface UniverseExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UniverseExplorerModal({ isOpen, onClose }: UniverseExplorerModalProps) {
  if (!isOpen) return null;

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBucket, setSelectedBucket] = useState<RiskBucket | "all">("all");

  const filtered = INSTRUMENT_UNIVERSE.filter((i) => {
    const matchesSearch =
      i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.sector.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.assetClass.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesBucket = selectedBucket === "all" || i.bucket === selectedBucket;

    return matchesSearch && matchesBucket;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight text-foreground">
                Financial Instrument Universe ({INSTRUMENT_UNIVERSE.length} Assets)
              </h3>
              <p className="text-xs text-muted-foreground">
                Screenable mock market data API universe with multi-factor risk, liquidity & valuation ratings
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

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by symbol, sector, asset class..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8.5 w-64 rounded-xl border border-input bg-background pl-8 pr-3 text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/60 text-xs">
            {(["all", "low", "moderate", "high"] as const).map((b) => (
              <button
                key={b}
                onClick={() => setSelectedBucket(b)}
                className={`rounded-lg px-3 py-1 font-medium capitalize transition-all ${
                  selectedBucket === b
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/60"
                }`}
              >
                {b === "all" ? "All Sleeves" : `${b} Risk`}
              </button>
            ))}
          </div>
        </div>

        {/* Instrument Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((item) => {
            const bucketCfg = getRiskBucketConfig(item.bucket);
            const liq = formatScore(item.liquidityScore);
            const val = formatScore(item.valuationScore);

            return (
              <div
                key={item.id}
                className="rounded-xl border border-border/70 bg-background p-4 space-y-2.5 hover:border-blue-500/40 hover:shadow-xs transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-bold text-foreground text-xs">{item.symbol}</span>
                    <h4 className="text-xs font-semibold text-foreground/90 line-clamp-1">
                      {item.name}
                    </h4>
                  </div>
                  <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold border ${bucketCfg.badgeClass}`}>
                    {bucketCfg.label}
                  </span>
                </div>

                <p className="text-[11px] text-muted-foreground line-clamp-2">
                  {item.notes}
                </p>

                <div className="grid grid-cols-2 gap-2 text-[11px] bg-muted/30 p-2 rounded-lg">
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Exp Return / Vol</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatPct(item.expectedReturn)}
                    </span>
                    <span className="text-muted-foreground"> / {formatPct(item.volatility)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Beta / 3Y CAGR</span>
                    <span className="font-semibold text-foreground">
                      {item.beta.toFixed(2)}
                    </span>
                    <span className="text-muted-foreground"> / {formatPct(item.cagr3y)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/50">
                  <span>Class: <b className="text-foreground">{item.assetClass}</b></span>
                  <span>Sector: <b className="text-foreground">{item.sector}</b></span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
