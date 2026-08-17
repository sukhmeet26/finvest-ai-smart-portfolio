import React, { useState } from "react";
import {
  Download,
  X,
  Printer,
  Copy,
  Check,
  FileText,
  Code,
} from "lucide-react";
import type { PortfolioResult } from "../../lib/finvest/types";
import { formatINR, formatPct } from "../../lib/formatters";

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  portfolio: PortfolioResult;
}

export function ExportReportModal({
  isOpen,
  onClose,
  portfolio,
}: ExportReportModalProps) {
  if (!isOpen) return null;

  const [copied, setCopied] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJSON = () => {
    const jsonStr = JSON.stringify(portfolio, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `finvest-portfolio-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCSV = () => {
    const headers = ["Symbol", "Name", "Bucket", "Asset Class", "Sector", "Weight %", "Capital (INR)", "Expected Return %", "Volatility %", "Beta"];
    const rows = portfolio.holdings.map((h) => [
      h.instrument.symbol,
      `"${h.instrument.name}"`,
      h.instrument.bucket,
      `"${h.instrument.assetClass}"`,
      `"${h.instrument.sector}"`,
      (h.weight * 100).toFixed(2),
      Math.round(h.amount),
      (h.instrument.expectedReturn * 100).toFixed(2),
      (h.instrument.volatility * 100).toFixed(2),
      h.instrument.beta.toFixed(2),
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `finvest-holdings-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopySummary = () => {
    const text = `FinVest AI Portfolio Summary
Goal: ${portfolio.input.goal}
Total Capital: ${formatINR(portfolio.input.totalCapital)}
Allocation: ${portfolio.input.lowPct}% Low / ${portfolio.input.moderatePct}% Moderate / ${portfolio.input.highPct}% High
Expected CAGR: ${formatPct(portfolio.metrics.expectedReturn)}
Annual Volatility: ${formatPct(portfolio.metrics.volatility)}
Sharpe Ratio: ${portfolio.metrics.sharpe.toFixed(2)}
Max Drawdown: ${formatPct(portfolio.metrics.maxDrawdown)}

Holdings:
${portfolio.holdings.map((h) => `- ${h.instrument.symbol} (${h.instrument.name}): ${formatPct(h.weight)} (${formatINR(h.amount)})`).join("\n")}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight text-foreground">
                Export Strategy & Audit Report
              </h3>
              <p className="text-xs text-muted-foreground">
                Download quantitative telemetry, JSON specs, or printable decision support briefing
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

        {/* Export Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Print PDF */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-3 rounded-xl border border-border/70 bg-background p-4 text-left hover:border-blue-500/40 hover:bg-accent/30 transition-all"
          >
            <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
              <Printer className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-foreground">Print / PDF Briefing</h4>
              <p className="text-[11px] text-muted-foreground">Executive formatted summary</p>
            </div>
          </button>

          {/* Download CSV */}
          <button
            onClick={handleDownloadCSV}
            className="flex items-center gap-3 rounded-xl border border-border/70 bg-background p-4 text-left hover:border-emerald-500/40 hover:bg-accent/30 transition-all"
          >
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-foreground">Download CSV</h4>
              <p className="text-[11px] text-muted-foreground">Detailed holdings matrix</p>
            </div>
          </button>

          {/* Download JSON */}
          <button
            onClick={handleDownloadJSON}
            className="flex items-center gap-3 rounded-xl border border-border/70 bg-background p-4 text-left hover:border-purple-500/40 hover:bg-accent/30 transition-all"
          >
            <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
              <Code className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-foreground">Download JSON</h4>
              <p className="text-[11px] text-muted-foreground">Complete agent state & metrics</p>
            </div>
          </button>

          {/* Copy Summary */}
          <button
            onClick={handleCopySummary}
            className="flex items-center gap-3 rounded-xl border border-border/70 bg-background p-4 text-left hover:border-amber-500/40 hover:bg-accent/30 transition-all"
          >
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
              {copied ? <Check className="h-5 w-5 text-emerald-500" /> : <Copy className="h-5 w-5" />}
            </div>
            <div>
              <h4 className="text-xs font-bold text-foreground">
                {copied ? "Copied to Clipboard!" : "Copy Text Summary"}
              </h4>
              <p className="text-[11px] text-muted-foreground">Share via email or messaging</p>
            </div>
          </button>
        </div>

        {/* Disclaimer Note */}
        <p className="text-[10px] text-muted-foreground text-center pt-2">
          FinVest AI is a research and simulation decision-support tool. It does not constitute personalized financial advice.
        </p>
      </div>
    </div>
  );
}
