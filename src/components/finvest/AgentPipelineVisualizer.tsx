import React, { useState } from "react";
import {
  Cpu,
  Shield,
  Search,
  Scale,
  Calculator,
  CheckCircle2,
  AlertTriangle,
  Radio,
  ChevronDown,
  ChevronUp,
  Clock,
  Zap,
} from "lucide-react";
import type { AgentStep, CriticFinding } from "../../lib/finvest/types";

interface AgentPipelineVisualizerProps {
  trace: AgentStep[];
  findings: CriticFinding[];
  iterations: number;
}

const AGENT_ICONS: Record<string, React.ReactNode> = {
  "Risk Profiler Agent": <Shield className="h-4 w-4 text-blue-500" />,
  "Market Research Agent": <Search className="h-4 w-4 text-indigo-500" />,
  "Low-Risk Agent": <Scale className="h-4 w-4 text-emerald-500" />,
  "Moderate-Risk Agent": <Scale className="h-4 w-4 text-amber-500" />,
  "High-Risk Agent": <Scale className="h-4 w-4 text-rose-500" />,
  "Risk Analysis Agent": <Calculator className="h-4 w-4 text-purple-500" />,
  "Portfolio Critic Agent": <CheckCircle2 className="h-4 w-4 text-teal-500" />,
  "Portfolio Manager Agent": <Cpu className="h-4 w-4 text-blue-600" />,
  "Portfolio Monitoring Agent": <Radio className="h-4 w-4 text-amber-600" />,
};

export function AgentPipelineVisualizer({
  trace,
  findings,
  iterations,
}: AgentPipelineVisualizerProps) {
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const totalDuration = trace.reduce((acc, s) => acc + s.durationMs, 0);

  const toggleStep = (idx: number) => {
    setExpandedStep(expandedStep === idx ? null : idx);
  };

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-5 lg:p-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Cpu className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
              Multi-Agent Orchestration Trace
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                7 Agents Synchronized
              </span>
            </h3>
            <p className="text-xs text-muted-foreground">
              Autonomous execution pipeline, deterministic math handoff & critic feedback loop
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-blue-500" />
            <span className="font-semibold text-foreground">{totalDuration}ms</span> total execution
          </div>
          {iterations > 0 && (
            <div className="flex items-center gap-1 rounded-md bg-purple-500/10 px-2 py-0.5 text-[11px] font-semibold text-purple-600 dark:text-purple-400">
              <Zap className="h-3 w-3" />
              <span>{iterations} Rebalance Iterations</span>
            </div>
          )}
        </div>
      </div>

      {/* Horizontal Agent Timeline Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {trace.map((step, idx) => {
          const isExpanded = expandedStep === idx;
          const icon = AGENT_ICONS[step.agent] || <Cpu className="h-4 w-4 text-blue-500" />;
          const isSkipped = step.status === "skipped";

          return (
            <div
              key={`${step.agent}-${idx}`}
              onClick={() => toggleStep(idx)}
              className={`group cursor-pointer rounded-xl border p-3.5 transition-all ${
                isExpanded
                  ? "border-blue-500 bg-blue-500/5 shadow-xs"
                  : "border-border/70 bg-background hover:border-border hover:bg-accent/40"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-muted/60">
                    {icon}
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-foreground leading-tight">
                      {step.agent.replace(" Agent", "")}
                    </h4>
                    <span className="text-[10px] text-muted-foreground">
                      Step #{idx + 1} • {step.durationMs}ms
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <span
                    className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md ${
                      isSkipped
                        ? "bg-muted text-muted-foreground"
                        : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {step.status}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground" />
                  )}
                </div>
              </div>

              {/* Summary */}
              <p className="mt-2 text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                {step.summary}
              </p>

              {/* Expandable Telemetry Details */}
              {isExpanded && (
                <div className="mt-3 pt-2.5 border-t border-border/60 space-y-1.5 animate-in fade-in duration-200">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Agent Telemetry & Log
                  </p>
                  <p className="text-[11px] text-foreground font-mono bg-muted/40 p-2 rounded-lg leading-relaxed whitespace-pre-wrap">
                    {step.detail}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
