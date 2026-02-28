import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  AlertTriangle,
  Info,
} from "lucide-react";

const severityConfig = {
  error: {
    icon: AlertCircle,
    badge: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    accent: "border-l-red-500 dark:border-l-red-400",
  },
  warning: {
    icon: AlertTriangle,
    badge: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
    accent: "border-l-yellow-500 dark:border-l-yellow-400",
  },
  info: {
    icon: Info,
    badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    accent: "border-l-blue-500 dark:border-l-blue-400",
  },
};

export default function ViolationCard({ violation }) {
  const config = severityConfig[violation.severity] || severityConfig.info;
  const Icon = config.icon;

  return (
    <div
      className={`rounded-lg border border-border/50 bg-background/50 p-3 space-y-1.5 border-l-2 ${config.accent} hover:bg-accent/30 transition-colors`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Icon className="size-3 text-muted-foreground" />
          <Badge
            variant="outline"
            className={`text-[10px] h-4 font-normal ${config.badge}`}
          >
            {violation.severity}
          </Badge>
        </div>
        {violation.location?.line && (
          <span className="text-[10px] text-muted-foreground font-mono">
            Ln {violation.location.line}
          </span>
        )}
      </div>
      <p className="text-xs text-foreground leading-relaxed">
        {violation.message}
      </p>
      <span className="text-[10px] text-muted-foreground/70 capitalize block">
        {violation.type.replace(/_/g, " ")}
      </span>
    </div>
  );
}
