/** ORACLE design tokens — React-free, CSS vars + typed TS mirror. */

export type ThemeId = "siege-classic" | "oled-black" | "cyber-blue" | "crimson" | "emerald";

export interface OracleTheme {
  id: ThemeId;
  label: string;
  colors: {
    "bg-primary": string;
    "bg-surface": string;
    "bg-card": string;
    "bg-glass": string;
    "bg-overlay": string;
    "text-primary": string;
    "text-secondary": string;
    "text-muted": string;
    "accent-primary": string;
    "accent-strong": string;
    "accent-dim": string;
    "status-success": string;
    "status-warning": string;
    "status-danger": string;
    "status-info": string;
    "map-attacker": string;
    "map-defender": string;
    "map-player": string;
    "map-connection": string;
    "map-highlight": string;
    "border-subtle": string;
    "border-strong": string;
  };
  typography: {
    fontFamily: string;
    headingFamily: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    "2xl": string;
  };
  radius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
  };
  shadow: {
    sm: string;
    md: string;
    lg: string;
    glow: string;
  };
  blur: {
    sm: string;
    md: string;
    lg: string;
  };
  motion: {
    fast: string;
    normal: string;
    slow: string;
    easing: string;
  };
}

const BASE_TOKENS = {
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    headingFamily: "'Rajdhani', 'Inter', sans-serif",
  },
  spacing: { xs: "4px", sm: "8px", md: "16px", lg: "24px", xl: "32px", "2xl": "48px" },
  radius: { sm: "4px", md: "8px", lg: "12px", xl: "16px", full: "9999px" },
  shadow: {
    sm: "0 2px 8px rgba(0,0,0,0.3)",
    md: "0 4px 16px rgba(0,0,0,0.4)",
    lg: "0 8px 32px rgba(0,0,0,0.5)",
    glow: "0 0 20px rgba(240,177,50,0.15)",
  },
  blur: { sm: "blur(4px)", md: "blur(8px)", lg: "blur(16px)" },
  motion: { fast: "120ms", normal: "200ms", slow: "300ms", easing: "cubic-bezier(0.2, 0, 0, 1)" },
} as const;

export const themes: Record<ThemeId, OracleTheme> = {
  "siege-classic": {
    id: "siege-classic",
    label: "Siege Classic",
    colors: {
      "bg-primary": "#0a0a0f",
      "bg-surface": "#12131a",
      "bg-card": "#1a1c25",
      "bg-glass": "rgba(18,19,26,0.85)",
      "bg-overlay": "rgba(10,10,15,0.95)",
      "text-primary": "#e8eaed",
      "text-secondary": "#9ca0ab",
      "text-muted": "#5a5f6d",
      "accent-primary": "#f0b132",
      "accent-strong": "#ffc940",
      "accent-dim": "rgba(240,177,50,0.15)",
      "status-success": "#3ba55d",
      "status-warning": "#faa81a",
      "status-danger": "#ed4245",
      "status-info": "#5865f2",
      "map-attacker": "#e04040",
      "map-defender": "#4080e0",
      "map-player": "#f0b132",
      "map-connection": "#3a3f4d",
      "map-highlight": "rgba(240,177,50,0.3)",
      "border-subtle": "rgba(255,255,255,0.06)",
      "border-strong": "rgba(255,255,255,0.12)",
    },
    ...BASE_TOKENS,
  },
  "oled-black": {
    id: "oled-black",
    label: "OLED Black",
    colors: {
      "bg-primary": "#000000",
      "bg-surface": "#0a0a0a",
      "bg-card": "#111111",
      "bg-glass": "rgba(0,0,0,0.9)",
      "bg-overlay": "rgba(0,0,0,0.97)",
      "text-primary": "#ffffff",
      "text-secondary": "#a0a0a0",
      "text-muted": "#555555",
      "accent-primary": "#f0b132",
      "accent-strong": "#ffc940",
      "accent-dim": "rgba(240,177,50,0.12)",
      "status-success": "#00c853",
      "status-warning": "#ffab00",
      "status-danger": "#ff1744",
      "status-info": "#2979ff",
      "map-attacker": "#ff1744",
      "map-defender": "#2979ff",
      "map-player": "#f0b132",
      "map-connection": "#333333",
      "map-highlight": "rgba(240,177,50,0.25)",
      "border-subtle": "rgba(255,255,255,0.08)",
      "border-strong": "rgba(255,255,255,0.15)",
    },
    ...BASE_TOKENS,
  },
  "cyber-blue": {
    id: "cyber-blue",
    label: "Cyber Blue",
    colors: {
      "bg-primary": "#050a14",
      "bg-surface": "#0a1220",
      "bg-card": "#0f1a2e",
      "bg-glass": "rgba(10,18,32,0.88)",
      "bg-overlay": "rgba(5,10,20,0.95)",
      "text-primary": "#e0e8f0",
      "text-secondary": "#7a8da6",
      "text-muted": "#3d5068",
      "accent-primary": "#00d4ff",
      "accent-strong": "#40e8ff",
      "accent-dim": "rgba(0,212,255,0.12)",
      "status-success": "#00e676",
      "status-warning": "#ffc400",
      "status-danger": "#ff5252",
      "status-info": "#448aff",
      "map-attacker": "#ff5252",
      "map-defender": "#448aff",
      "map-player": "#00d4ff",
      "map-connection": "#1a2d45",
      "map-highlight": "rgba(0,212,255,0.2)",
      "border-subtle": "rgba(0,212,255,0.08)",
      "border-strong": "rgba(0,212,255,0.18)",
    },
    ...BASE_TOKENS,
  },
  crimson: {
    id: "crimson",
    label: "Crimson",
    colors: {
      "bg-primary": "#0f0508",
      "bg-surface": "#180a10",
      "bg-card": "#221018",
      "bg-glass": "rgba(24,10,16,0.88)",
      "bg-overlay": "rgba(15,5,8,0.95)",
      "text-primary": "#f0e0e4",
      "text-secondary": "#a07080",
      "text-muted": "#5a3040",
      "accent-primary": "#ff3060",
      "accent-strong": "#ff5080",
      "accent-dim": "rgba(255,48,96,0.12)",
      "status-success": "#66bb6a",
      "status-warning": "#ffa726",
      "status-danger": "#ef5350",
      "status-info": "#42a5f5",
      "map-attacker": "#ef5350",
      "map-defender": "#42a5f5",
      "map-player": "#ff3060",
      "map-connection": "#3a1a28",
      "map-highlight": "rgba(255,48,96,0.2)",
      "border-subtle": "rgba(255,48,96,0.08)",
      "border-strong": "rgba(255,48,96,0.18)",
    },
    ...BASE_TOKENS,
  },
  emerald: {
    id: "emerald",
    label: "Emerald",
    colors: {
      "bg-primary": "#040f0a",
      "bg-surface": "#081a12",
      "bg-card": "#0c2518",
      "bg-glass": "rgba(8,26,18,0.88)",
      "bg-overlay": "rgba(4,15,10,0.95)",
      "text-primary": "#d0f0e0",
      "text-secondary": "#70a088",
      "text-muted": "#305040",
      "accent-primary": "#00e090",
      "accent-strong": "#40ffb0",
      "accent-dim": "rgba(0,224,144,0.12)",
      "status-success": "#00e676",
      "status-warning": "#ffca28",
      "status-danger": "#ff5252",
      "status-info": "#40c4ff",
      "map-attacker": "#ff5252",
      "map-defender": "#40c4ff",
      "map-player": "#00e090",
      "map-connection": "#1a3528",
      "map-highlight": "rgba(0,224,144,0.2)",
      "border-subtle": "rgba(0,224,144,0.08)",
      "border-strong": "rgba(0,224,144,0.18)",
    },
    ...BASE_TOKENS,
  },
};

/**
 * Convert an OracleTheme to CSS custom properties string.
 */
export function themeToCssVars(theme: OracleTheme): string {
  const lines: string[] = [];
  for (const [key, value] of Object.entries(theme.colors)) {
    lines.push(`  --oracle-${key}: ${value};`);
  }
  for (const [key, value] of Object.entries(theme.spacing)) {
    lines.push(`  --oracle-space-${key}: ${value};`);
  }
  for (const [key, value] of Object.entries(theme.radius)) {
    lines.push(`  --oracle-radius-${key}: ${value};`);
  }
  for (const [key, value] of Object.entries(theme.shadow)) {
    lines.push(`  --oracle-shadow-${key}: ${value};`);
  }
  for (const [key, value] of Object.entries(theme.blur)) {
    lines.push(`  --oracle-blur-${key}: ${value};`);
  }
  for (const [key, value] of Object.entries(theme.motion)) {
    lines.push(`  --oracle-motion-${key}: ${value};`);
  }
  lines.push(`  --oracle-font: ${theme.typography.fontFamily};`);
  lines.push(`  --oracle-font-heading: ${theme.typography.headingFamily};`);
  return `:root {\n${lines.join("\n")}\n}`;
}
