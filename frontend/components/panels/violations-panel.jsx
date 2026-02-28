"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileCheck,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Info,
  Loader2,
} from "lucide-react";
import ViolationCard from "@/components/violation-card";
import useViolationsStore from "@/store/use-violations-store";
import useEditorStore from "@/store/use-editor-store";
import { checkIEEE } from "@/lib/api";

const severityOrder = ["error", "warning", "info"];

const severityMeta = {
  error: {
    label: "Errors",
    icon: AlertCircle,
    countBg: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    headerBg: "bg-red-500/5 dark:bg-red-500/10",
  },
  warning: {
    label: "Warnings",
    icon: AlertTriangle,
    countBg:
      "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
    headerBg: "bg-yellow-500/5 dark:bg-yellow-500/10",
  },
  info: {
    label: "Info",
    icon: Info,
    countBg:
      "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    headerBg: "bg-blue-500/5 dark:bg-blue-500/10",
  },
};

export default function ViolationsPanel() {
  const violations = useViolationsStore((s) => s.violations);
  const isLoading = useViolationsStore((s) => s.isLoading);
  const error = useViolationsStore((s) => s.error);
  const setViolations = useViolationsStore((s) => s.setViolations);
  const setLoading = useViolationsStore((s) => s.setLoading);
  const setError = useViolationsStore((s) => s.setError);
  const documentText = useEditorStore((s) => s.documentText);

  const [collapsed, setCollapsed] = useState({});

  const toggleGroup = (severity) => {
    setCollapsed((prev) => ({ ...prev, [severity]: !prev[severity] }));
  };

  const handleCheckIEEE = async () => {
    if (!documentText.trim() || isLoading) return;
    setLoading(true);
    try {
      const data = await checkIEEE(documentText);
      setViolations(data.violations);
    } catch (err) {
      setError(err.message);
    }
  };

  const grouped = {};
  for (const sev of severityOrder) {
    const items = violations.filter((v) => v.severity === sev);
    if (items.length > 0) grouped[sev] = items;
  }

  const totalCount = violations.length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileCheck className="size-4 text-primary" />
          <h2 className="text-sm font-medium text-foreground">
            IEEE Compliance
          </h2>
        </div>
        {totalCount > 0 && (
          <div className="flex items-center gap-1.5">
            {severityOrder.map((sev) => {
              const count = (grouped[sev] || []).length;
              if (count === 0) return null;
              const meta = severityMeta[sev];
              return (
                <Badge
                  key={sev}
                  variant="outline"
                  className={`text-[10px] h-4 font-normal ${meta.countBg}`}
                >
                  {count}{" "}
                  {count === 1 ? sev : sev === "info" ? "info" : sev + "s"}
                </Badge>
              );
            })}
          </div>
        )}
      </div>

      {/* Scrollable violations list */}
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">
        {!isLoading && !error && totalCount === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
            <CheckCircle2 className="size-8 text-emerald-500/40 mb-3" />
            <p className="text-xs font-medium text-foreground mb-1">
              No issues found
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Run a compliance check to analyze your document against IEEE standards.
            </p>
            <button
              onClick={handleCheckIEEE}
              disabled={!documentText.trim() || isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <FileCheck className="size-3.5" />
              Check IEEE Compliance
            </button>
          </div>
        )}

        {(isLoading || error || totalCount > 0) && (
          <div className="p-3 space-y-2">
            {isLoading && (
              <>
                <Skeleton className="h-20 rounded-lg" />
                <Skeleton className="h-20 rounded-lg" />
                <Skeleton className="h-20 rounded-lg" />
              </>
            )}

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 dark:bg-red-500/5 border border-red-500/20 dark:border-red-500/10">
                <AlertTriangle className="size-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {severityOrder.map((sev) => {
              const items = grouped[sev];
              if (!items) return null;
              const meta = severityMeta[sev];
              const Icon = meta.icon;
              const isCollapsed = collapsed[sev];

              return (
                <div key={sev} className="space-y-1.5">
                  <button
                    onClick={() => toggleGroup(sev)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium hover:bg-accent/50 transition-colors ${meta.headerBg}`}
                  >
                    {isCollapsed ? (
                      <ChevronRight className="size-3 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="size-3 text-muted-foreground" />
                    )}
                    <Icon className="size-3" />
                    <span>{meta.label}</span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] h-4 ml-auto ${meta.countBg}`}
                    >
                      {items.length}
                    </Badge>
                  </button>

                  {!isCollapsed && (
                    <div className="space-y-1.5 pl-1">
                      {items.map((violation) => (
                        <ViolationCard key={violation.id} violation={violation} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
