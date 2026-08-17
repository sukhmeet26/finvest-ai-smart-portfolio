import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Layers,
  Database,
  Download,
  Moon,
  Sun,
  Activity,
  GitCompare,
  TrendingUp,
  ShieldAlert,
} from "lucide-react";
import { PORTFOLIO_PRESETS, type PortfolioPreset } from "../../lib/presets";
import { formatINR } from "../../lib/formatters";

interface NavbarProps {
  onSelectPreset: (preset: PortfolioPreset) => void;
  onOpenAlternative: () => void;
  onOpenUniverse: () => void;
  onOpenExport: () => void;
  isSimulating?: boolean;
}

export function Navbar({
  onSelectPreset,
  onOpenAlternative,
  onOpenUniverse,
  onOpenExport,
  isSimulating = false,
}: NavbarProps) {
  const [isDark, setIsDark] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState<string>("balanced-growth");

  useEffect(() => {
    // Check initial dark mode from document or system
    const isDarkMode = document.documentElement.classList.contains("dark");
    setIsDark(isDarkMode);
  }, []);

  const toggleDarkMode = () => {
    if (document.documentElement.classList.contains("dark")) {
      document.documentElement.classList.remove("dark");
      setIsDark(false);
    } else {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-500 shadow-lg shadow-indigo-500/25">
            <Sparkles className="h-5 w-5 text-white animate-pulse" />
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-background"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text">
                FinVest<span className="text-blue-500">.AI</span>
              </span>
              <span className="hidden sm:inline-flex items-center rounded-md bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400 border border-blue-500/20">
                Agentic v2.4
              </span>
            </div>
            <p className="hidden md:block text-[11px] text-muted-foreground font-medium">
              Autonomous Financial Portfolio Intelligence
            </p>
          </div>
        </div>

        {/* Preset Profiles & Market Status */}
        <div className="hidden lg:flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-full border border-border/80 bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium text-foreground">NSE/BSE Sim Active</span>
            <span className="text-muted-foreground/60">•</span>
            <span>Deterministic Math Engine</span>
          </div>

          {/* Quick Presets Dropdown */}
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/60">
            <span className="text-[11px] font-semibold text-muted-foreground px-2">Presets:</span>
            {PORTFOLIO_PRESETS.slice(0, 3).map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setSelectedPresetId(p.id);
                  onSelectPreset(p);
                }}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                  selectedPresetId === p.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/60"
                }`}
              >
                {p.name.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Action Controls & Theme Toggle */}
        <div className="flex items-center gap-2">
          {/* Alternative Portfolio Comparison Button */}
          <button
            onClick={onOpenAlternative}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-background px-3 py-1.5 text-xs font-medium text-foreground shadow-xs hover:bg-accent hover:text-accent-foreground transition-colors"
            title="Compare with Minimum-Variance Alternative"
          >
            <GitCompare className="h-3.5 w-3.5 text-indigo-500" />
            <span>Compare What-If</span>
          </button>

          {/* Instrument Universe Explorer */}
          <button
            onClick={onOpenUniverse}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-background px-3 py-1.5 text-xs font-medium text-foreground shadow-xs hover:bg-accent hover:text-accent-foreground transition-colors"
            title="Browse full universe of 30+ financial instruments"
          >
            <Database className="h-3.5 w-3.5 text-blue-500" />
            <span className="hidden sm:inline">Universe</span>
          </button>

          {/* Export Report */}
          <button
            onClick={onOpenExport}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-background px-3 py-1.5 text-xs font-medium text-foreground shadow-xs hover:bg-accent hover:text-accent-foreground transition-colors"
            title="Download or print portfolio strategy report"
          >
            <Download className="h-3.5 w-3.5 text-emerald-500" />
            <span className="hidden sm:inline">Export</span>
          </button>

          {/* Dark / Light Toggle */}
          <button
            onClick={toggleDarkMode}
            className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-border/80 bg-background text-foreground hover:bg-accent transition-colors"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label="Toggle Theme"
          >
            {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-700" />}
          </button>
        </div>
      </div>
    </header>
  );
}
