import React, { useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Info,
  RotateCcw,
  ShieldCheck,
  Check,
} from "lucide-react";
import type { CriticFinding } from "../../lib/finvest/types";

interface CriticAuditTrailProps {
  findings: CriticFinding[];
  iterations: number;
  constraintsSatisfied: boolean;
}

export function CriticAuditTrail({
  findings,
  iterations,
  constraintsSatisfied,
}: CriticAuditTrailProps) {
  const [selectedIteration, setSelectedIteration] = useState<number | "all">("all");

  const uniqueIterations = Array.from(new Set(findings.map((f) => f.iteration))).sort();

  const filteredFindings = selectedIteration === "all"
    ? findings
    : findings.filter((f) => f.iteration === selectedIteration);

  const getSeverityBadge = (sev: CriticFinding["severity"]) => {
    switch (sev) {
      case "critical":
        return {
          icon: <AlertOctagon className="h-3.5 w-3.5 text-rose-500" />,
          badge: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
          label: "Critical Constraint",
        };
      case "warning":
        return {
          icon: <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />,
          badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
          label: "Concentration Warning",
        };
      case "info":
        return {
          icon: <Info className="h-3.5 w-3.5 text-blue-500" />,
          badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
          label: "Optimization Note",
        };
    }
  };

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-5 lg:p-6 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-teal-500" />
            Portfolio Critic Agent & Feedback Loop
          </h3>
          <p className="text-xs text-muted-foreground">
            Self-correcting audit trail: identifying guardrail violations and executing iterative rebalance cycles
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${
              constraintsSatisfied
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
            }`}
          >
            {constraintsSatisfied ? (
              <>
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>All Guardrails Satisfied</span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>Mandate Constraint Tension</span>
              </>
            )}
          </span>
        </div>
      </div>

      {findings.length === 0 ? (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-center space-y-2">
          <div className="flex justify-center">
            <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
          <h4 className="text-sm font-bold text-foreground">
            Zero Guardrail Violations on First Pass
          </h4>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            The initial candidate allocation satisfied all single-instrument limits (≤25%), sector ceilings (≤38%), liquidity thresholds, and drawdown bounds without requiring rebalance loops.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Iteration Tabs */}
          {uniqueIterations.length > 1 && (
            <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-xl border border-border/60 text-xs w-fit">
              <button
                onClick={() => setSelectedIteration("all")}
                className={`rounded-lg px-2.5 py-1 font-medium transition-all ${
                  selectedIteration === "all"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All Iterations ({findings.length})
              </button>
              {uniqueIterations.map((it) => (
                <button
                  key={it}
                  onClick={() => setSelectedIteration(it)}
                  className={`rounded-lg px-2.5 py-1 font-medium transition-all ${
                    selectedIteration === it
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Iteration #{it}
                </button>
              ))}
            </div>
          )}

          {/* Findings List */}
          <div className="grid grid-cols-1 gap-2.5">
            {filteredFindings.map((f, idx) => {
              const sev = getSeverityBadge(f.severity);

              return (
                <div
                  key={`${f.code}-${idx}`}
                  className="rounded-xl border border-border/70 bg-background p-3.5 space-y-2 hover:border-blue-500/30 transition-all"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold border ${sev.badge}`}>
                        {sev.icon}
                        {sev.label}
                      </span>
                      <span className="font-mono text-[11px] font-bold text-foreground">
                        {f.code}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        (Iteration #{f.iteration})
                      </span>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                        f.resolved
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {f.resolved ? (
                        <>
                          <Check className="h-3 w-3" />
                          <span>Resolved in Rebalance</span>
                        </>
                      ) : (
                        <>
                          <RotateCcw className="h-3 w-3" />
                          <span>Unresolved Hard Mandate</span>
                        </>
                      )}
                    </span>
                  </div>

                  <p className="text-xs text-foreground font-medium leading-relaxed">
                    {f.message}
                  </p>

                  <div className="rounded-lg bg-muted/40 p-2 text-[11px] text-muted-foreground flex items-start gap-1.5">
                    <span className="font-semibold text-foreground shrink-0">Rebalance Action:</span>
                    <span>{f.action}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
