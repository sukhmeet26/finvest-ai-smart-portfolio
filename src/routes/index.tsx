import { createFileRoute } from "@tanstack/react-router";
import React, { useState, useTransition, useEffect } from "react";
import {
  Sparkles,
  Layers,
  Activity,
  PieChart as PieIcon,
  Table as TableIcon,
  Flame,
  CheckCircle2,
  Radio,
  Bot,
  ShieldCheck,
  Zap,
  Info,
  GitCompare,
  TrendingUp,
} from "lucide-react";
import { Navbar } from "../components/finvest/Navbar";
import { StrategyBuilder } from "../components/finvest/StrategyBuilder";
import { KeyMetricsGrid } from "../components/finvest/KeyMetricsGrid";
import { AgentPipelineVisualizer } from "../components/finvest/AgentPipelineVisualizer";
import { AllocationCharts } from "../components/finvest/AllocationCharts";
import { WealthProjectionChart } from "../components/finvest/WealthProjectionChart";
import { HoldingsTable } from "../components/finvest/HoldingsTable";
import { StressTestMatrix } from "../components/finvest/StressTestMatrix";
import { CriticAuditTrail } from "../components/finvest/CriticAuditTrail";
import { MonitoringAlertsCenter } from "../components/finvest/MonitoringAlertsCenter";
import { AlternativeComparisonModal } from "../components/finvest/AlternativeComparisonModal";
import { UniverseExplorerModal } from "../components/finvest/UniverseExplorerModal";
import { ExportReportModal } from "../components/finvest/ExportReportModal";
import { ConversationalAdvisor } from "../components/finvest/ConversationalAdvisor";
import { PORTFOLIO_PRESETS, type PortfolioPreset } from "../lib/presets";
import { buildPortfolio } from "../lib/finvest/orchestrator";
import type { PortfolioInput, PortfolioResult } from "../lib/finvest/types";
import { formatINR } from "../lib/formatters";

export const Route = createFileRoute("/")({
  component: FinVestDashboard,
});

export function FinVestDashboard() {
  // Default strategy input
  const [input, setInput] = useState<PortfolioInput>(PORTFOLIO_PRESETS[1]!.input);
  
  // Computed Portfolio Result
  const [portfolio, setPortfolio] = useState<PortfolioResult>(() => {
    const initial = buildPortfolio(PORTFOLIO_PRESETS[1]!.input);
    return {
      input: PORTFOLIO_PRESETS[1]!.input,
      ...initial,
      explanation: "",
    };
  });

  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<"overview" | "holdings" | "stress" | "critic" | "copilot">("overview");

  // Modals state
  const [isAltModalOpen, setIsAltModalOpen] = useState(false);
  const [isUniverseModalOpen, setIsUniverseModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Recalculate portfolio whenever input changes
  const runSimulation = (newInput: PortfolioInput = input) => {
    startTransition(() => {
      const result = buildPortfolio(newInput);
      setPortfolio({
        input: newInput,
        ...result,
        explanation: "",
      });
    });
  };

  const handleInputChange = (newInput: PortfolioInput) => {
    setInput(newInput);
    runSimulation(newInput);
  };

  const handleSelectPreset = (preset: PortfolioPreset) => {
    setInput(preset.input);
    runSimulation(preset.input);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-blue-500/20">
      {/* Top Navigation */}
      <Navbar
        onSelectPreset={handleSelectPreset}
        onOpenAlternative={() => setIsAltModalOpen(true)}
        onOpenUniverse={() => setIsUniverseModalOpen(true)}
        onOpenExport={() => setIsExportModalOpen(true)}
        isSimulating={isPending}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Strategy Builder Card */}
        <StrategyBuilder
          input={input}
          onChange={handleInputChange}
          onSimulate={() => runSimulation(input)}
          isSimulating={isPending}
        />

        {/* Multi-Agent Orchestration Visualizer */}
        <AgentPipelineVisualizer
          trace={portfolio.agentTrace}
          findings={portfolio.findings}
          iterations={portfolio.iterations}
        />

        {/* Primary Key Metrics Cards */}
        <KeyMetricsGrid metrics={portfolio.metrics} input={input} />

        {/* Dashboard Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-3">
          <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-2xl border border-border/60 text-xs">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 font-semibold transition-all ${
                activeTab === "overview"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/60"
              }`}
            >
              <PieIcon className="h-3.5 w-3.5" />
              <span>Allocation & Projections</span>
            </button>

            <button
              onClick={() => setActiveTab("holdings")}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 font-semibold transition-all ${
                activeTab === "holdings"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/60"
              }`}
            >
              <TableIcon className="h-3.5 w-3.5" />
              <span>Holdings Matrix ({portfolio.holdings.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("stress")}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 font-semibold transition-all ${
                activeTab === "stress"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/60"
              }`}
            >
              <Flame className="h-3.5 w-3.5" />
              <span>Stress-Testing</span>
            </button>

            <button
              onClick={() => setActiveTab("critic")}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 font-semibold transition-all ${
                activeTab === "critic"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/60"
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Critic Feedback Loop</span>
              {portfolio.findings.length > 0 && (
                <span className="h-4 min-w-4 rounded-full bg-purple-500 text-white text-[9px] font-bold flex items-center justify-center px-1">
                  {portfolio.findings.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("copilot")}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 font-semibold transition-all ${
                activeTab === "copilot"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/60"
              }`}
            >
              <Bot className="h-3.5 w-3.5" />
              <span>AI Copilot</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>Constraints: {portfolio.constraintsSatisfied ? "Satisfied" : "Review Flagged"}</span>
          </div>
        </div>

        {/* Tab 1: Overview & Allocations */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Allocation Charts */}
            <div className="lg:col-span-7 space-y-6">
              <AllocationCharts
                holdings={portfolio.holdings}
                bucketActual={portfolio.bucketActual}
                input={input}
              />
              <MonitoringAlertsCenter alerts={portfolio.alerts} />
            </div>

            {/* Wealth Projection Chart & Copilot Quick Preview */}
            <div className="lg:col-span-5 space-y-6">
              <WealthProjectionChart input={input} metrics={portfolio.metrics} />
              <ConversationalAdvisor portfolio={portfolio} />
            </div>
          </div>
        )}

        {/* Tab 2: Holdings Table */}
        {activeTab === "holdings" && (
          <div className="space-y-6">
            <HoldingsTable
              holdings={portfolio.holdings}
              totalCapital={input.totalCapital}
            />
          </div>
        )}

        {/* Tab 3: Stress Testing */}
        {activeTab === "stress" && (
          <div className="space-y-6">
            <StressTestMatrix
              stress={portfolio.stress}
              holdings={portfolio.holdings}
              totalCapital={input.totalCapital}
            />
          </div>
        )}

        {/* Tab 4: Critic Audit Trail */}
        {activeTab === "critic" && (
          <div className="space-y-6">
            <CriticAuditTrail
              findings={portfolio.findings}
              iterations={portfolio.iterations}
              constraintsSatisfied={portfolio.constraintsSatisfied}
            />
          </div>
        )}

        {/* Tab 5: Full Copilot View */}
        {activeTab === "copilot" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8">
              <ConversationalAdvisor portfolio={portfolio} />
            </div>
            <div className="lg:col-span-4 space-y-4">
              <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-blue-500" />
                  Deterministic Grounding
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  FinVest AI Copilot references exact risk calculations, covariance matrices, and historical drawdown bounds. Calculations are executed in mathematical risk kernels, not approximate LLM estimates.
                </p>
                <div className="space-y-2 pt-2 border-t border-border/60 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Portfolio Capital:</span>
                    <span className="font-semibold text-foreground">{formatINR(input.totalCapital)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Allocation Split:</span>
                    <span className="font-semibold text-foreground">{input.lowPct}% / {input.moderatePct}% / {input.highPct}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Modelled Sharpe:</span>
                    <span className="font-semibold text-blue-500">{portfolio.metrics.sharpe.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Active Holdings:</span>
                    <span className="font-semibold text-foreground">{portfolio.holdings.length} Assets</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Compliance & Regulatory Disclaimer Footer */}
      <footer className="border-t border-border/60 bg-muted/20 mt-12 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="font-bold text-foreground">FinVest AI</span>
              <span>•</span>
              <span>Smart Portfolio Intelligence Platform</span>
            </div>
            <span>Built with TanStack Start, React 19 & Tailwind CSS</span>
          </div>

          <div className="rounded-xl border border-border/60 bg-background/60 p-4 text-[11px] text-muted-foreground leading-relaxed">
            <p className="font-semibold text-foreground mb-1">Regulatory & Simulation Disclaimer:</p>
            FinVest AI is a research, quantitative simulation, and decision-support tool. It does not provide personalized investment advice, financial planning, or specific buy/sell recommendations under SEBI or any regulatory framework. All return estimates, volatilities, drawdowns, and stress-test impacts are historical mathematical simulations for research purposes only. Actual market performance may vary significantly.
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AlternativeComparisonModal
        isOpen={isAltModalOpen}
        onClose={() => setIsAltModalOpen(false)}
        currentPortfolio={portfolio}
      />

      <UniverseExplorerModal
        isOpen={isUniverseModalOpen}
        onClose={() => setIsUniverseModalOpen(false)}
      />

      <ExportReportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        portfolio={portfolio}
      />
    </div>
  );
}
