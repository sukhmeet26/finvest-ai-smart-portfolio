import React, { useState } from "react";
import {
  Radio,
  Bell,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Check,
  X,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { MonitorAlert } from "../../lib/finvest/types";

interface MonitoringAlertsCenterProps {
  alerts: MonitorAlert[];
}

export function MonitoringAlertsCenter({ alerts: initialAlerts }: MonitoringAlertsCenterProps) {
  const [alerts, setAlerts] = useState<MonitorAlert[]>(initialAlerts);
  const [actionedAlerts, setActionedAlerts] = useState<Record<string, "approved" | "dismissed">>({});

  const handleAction = (id: string, action: "approved" | "dismissed") => {
    setActionedAlerts((prev) => ({ ...prev, [id]: action }));
  };

  const getAlertIcon = (type: MonitorAlert["type"]) => {
    switch (type) {
      case "drift":
        return <TrendingUp className="h-4 w-4 text-blue-500" />;
      case "volatility":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case "limit_breach":
        return <AlertTriangle className="h-4 w-4 text-rose-500" />;
      case "market_event":
        return <Calendar className="h-4 w-4 text-purple-500" />;
    }
  };

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-5 lg:p-6 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
            <Radio className="h-4 w-4 text-amber-500 animate-pulse" />
            Portfolio Monitoring & Active Drift Surveillance
          </h3>
          <p className="text-xs text-muted-foreground">
            Continuous background telemetry detecting asset drift, volatility breaches & calendar events
          </p>
        </div>

        <span className="text-[11px] font-semibold text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-xl">
          Human-in-the-Loop Rebalance Gate
        </span>
      </div>

      {alerts.length === 0 ? (
        <div className="rounded-xl border border-border/70 bg-background p-6 text-center text-xs text-muted-foreground">
          No active telemetry alerts at this moment. Portfolio is aligned with target weights.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {alerts.map((a) => {
            const status = actionedAlerts[a.id];

            return (
              <div
                key={a.id}
                className={`rounded-xl border p-4 space-y-3 transition-all ${
                  status === "approved"
                    ? "border-emerald-500/30 bg-emerald-500/5 opacity-70"
                    : status === "dismissed"
                    ? "border-border/50 bg-muted/30 opacity-50"
                    : a.severity === "critical"
                    ? "border-rose-500/30 bg-rose-500/5"
                    : a.severity === "warning"
                    ? "border-amber-500/30 bg-amber-500/5"
                    : "border-border/70 bg-background hover:border-blue-500/30"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-muted/60">
                      {getAlertIcon(a.type)}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground leading-tight">
                        {a.title}
                      </h4>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">
                        {a.type.replace("_", " ")}
                      </span>
                    </div>
                  </div>

                  {status ? (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                        status === "approved"
                          ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {status === "approved" ? "Order Staged" : "Dismissed"}
                    </span>
                  ) : a.requiresApproval ? (
                    <span className="text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-md">
                      Requires Approval
                    </span>
                  ) : null}
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  {a.detail}
                </p>

                <div className="rounded-lg bg-muted/40 p-2 text-[11px] text-foreground">
                  <span className="font-semibold text-muted-foreground block text-[10px] uppercase">
                    Agent Recommendation:
                  </span>
                  {a.recommendation}
                </div>

                {/* Actions */}
                {!status && a.requiresApproval && (
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => handleAction(a.id, "dismissed")}
                      className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
                    >
                      Dismiss
                    </button>
                    <button
                      onClick={() => handleAction(a.id, "approved")}
                      className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Approve Rebalance</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
