import { useState } from "react";
import { X, ChevronDown, ChevronUp } from "lucide-react";

interface CardContainerProps {
  title: string;
  icon: React.ReactNode;
  accentColor?: string;
  onDismiss?: () => void;
  children: React.ReactNode;
}

export function CardContainer({ title, icon, accentColor, onDismiss, children }: CardContainerProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="glass-card mx-3 mb-2 overflow-hidden" style={{ borderLeftColor: accentColor, borderLeftWidth: 3 }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2">
        <span className="shrink-0" style={{ color: accentColor }}>{icon}</span>
        <span className="text-sm font-semibold text-[var(--oracle-text-primary)] flex-1">{title}</span>
        <button onClick={() => setExpanded(!expanded)} className="p-0.5 rounded hover:bg-white/5 transition-colors">
          {expanded ? <ChevronUp size={12} className="text-[var(--oracle-text-muted)]" /> : <ChevronDown size={12} className="text-[var(--oracle-text-muted)]" />}
        </button>
        {onDismiss && (
          <button onClick={onDismiss} className="p-0.5 rounded hover:bg-white/5 transition-colors">
            <X size={12} className="text-[var(--oracle-text-muted)]" />
          </button>
        )}
      </div>

      {/* Body */}
      {expanded && (
        <div className="px-3 pb-3 text-sm text-[var(--oracle-text-secondary)] leading-relaxed">
          {children}
        </div>
      )}
    </div>
  );
}
