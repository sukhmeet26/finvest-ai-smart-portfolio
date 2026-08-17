/**
 * Formatting utilities for FinVest AI
 * Supports Indian numbering system (Lakhs, Crores, INR formatting)
 */

export function formatINR(amount: number, compact = false): string {
  if (isNaN(amount)) return "₹0";
  
  if (compact) {
    if (Math.abs(amount) >= 10000000) {
      const cr = amount / 10000000;
      return `₹${cr.toFixed(2).replace(/\.00$/, "")} Cr`;
    }
    if (Math.abs(amount) >= 100000) {
      const lk = amount / 100000;
      return `₹${lk.toFixed(2).replace(/\.00$/, "")} L`;
    }
    if (Math.abs(amount) >= 1000) {
      const k = amount / 1000;
      return `₹${k.toFixed(1).replace(/\.0$/, "")}k`;
    }
  }

  // Standard Indian Currency Format (en-IN)
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

export function formatPct(decimalVal: number, fractionDigits = 1): string {
  if (isNaN(decimalVal)) return "0.0%";
  return `${(decimalVal * 100).toFixed(fractionDigits)}%`;
}

export function formatRawPct(pctVal: number, fractionDigits = 1): string {
  if (isNaN(pctVal)) return "0.0%";
  return `${pctVal.toFixed(fractionDigits)}%`;
}

export function formatScore(score: number): { text: string; color: string; label: string } {
  if (score >= 0.8) return { text: (score * 10).toFixed(1), color: "text-emerald-500", label: "High / Strong" };
  if (score >= 0.6) return { text: (score * 10).toFixed(1), color: "text-blue-500", label: "Good / Liquid" };
  if (score >= 0.4) return { text: (score * 10).toFixed(1), color: "text-amber-500", label: "Moderate" };
  return { text: (score * 10).toFixed(1), color: "text-rose-500", label: "Low" };
}

export function getRiskBucketConfig(bucket: "low" | "moderate" | "high") {
  switch (bucket) {
    case "low":
      return {
        label: "Low Risk",
        badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
        color: "#10b981",
        textColor: "text-emerald-500",
        gradient: "from-emerald-500 to-teal-600",
      };
    case "moderate":
      return {
        label: "Moderate Risk",
        badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
        color: "#f59e0b",
        textColor: "text-amber-500",
        gradient: "from-amber-500 to-orange-600",
      };
    case "high":
      return {
        label: "High Risk",
        badgeClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
        color: "#f43f5e",
        textColor: "text-rose-500",
        gradient: "from-rose-500 to-pink-600",
      };
  }
}
