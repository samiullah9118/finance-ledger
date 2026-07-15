// Deterministic category → color mapping for consistent visual identity across all pages

export const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  // Food & Dining
  groceries:     { bg: "rgba(249,115,22,0.12)",  text: "#fb923c", border: "rgba(249,115,22,0.25)",  dot: "#f97316" },
  dining:        { bg: "rgba(239,68,68,0.12)",   text: "#f87171", border: "rgba(239,68,68,0.25)",   dot: "#ef4444" },
  food:          { bg: "rgba(249,115,22,0.12)",  text: "#fb923c", border: "rgba(249,115,22,0.25)",  dot: "#f97316" },
  restaurants:   { bg: "rgba(239,68,68,0.12)",   text: "#f87171", border: "rgba(239,68,68,0.25)",   dot: "#ef4444" },

  // Transport
  transport:     { bg: "rgba(59,130,246,0.12)",  text: "#60a5fa", border: "rgba(59,130,246,0.25)",  dot: "#3b82f6" },
  travel:        { bg: "rgba(14,165,233,0.12)",  text: "#38bdf8", border: "rgba(14,165,233,0.25)",  dot: "#0ea5e9" },
  gas:           { bg: "rgba(59,130,246,0.12)",  text: "#60a5fa", border: "rgba(59,130,246,0.25)",  dot: "#3b82f6" },

  // Entertainment
  entertainment: { bg: "rgba(139,92,246,0.12)",  text: "#a78bfa", border: "rgba(139,92,246,0.25)",  dot: "#8b5cf6" },
  subscriptions: { bg: "rgba(99,102,241,0.12)",  text: "#818cf8", border: "rgba(99,102,241,0.25)",  dot: "#6366f1" },
  streaming:     { bg: "rgba(99,102,241,0.12)",  text: "#818cf8", border: "rgba(99,102,241,0.25)",  dot: "#6366f1" },

  // Health
  health:        { bg: "rgba(244,63,94,0.12)",   text: "#fb7185", border: "rgba(244,63,94,0.25)",   dot: "#f43f5e" },
  medical:       { bg: "rgba(244,63,94,0.12)",   text: "#fb7185", border: "rgba(244,63,94,0.25)",   dot: "#f43f5e" },
  healthcare:    { bg: "rgba(244,63,94,0.12)",   text: "#fb7185", border: "rgba(244,63,94,0.25)",   dot: "#f43f5e" },

  // Shopping
  shopping:      { bg: "rgba(236,72,153,0.12)",  text: "#f472b6", border: "rgba(236,72,153,0.25)",  dot: "#ec4899" },
  clothing:      { bg: "rgba(236,72,153,0.12)",  text: "#f472b6", border: "rgba(236,72,153,0.25)",  dot: "#ec4899" },

  // Utilities
  utilities:     { bg: "rgba(234,179,8,0.12)",   text: "#facc15", border: "rgba(234,179,8,0.25)",   dot: "#eab308" },
  bills:         { bg: "rgba(234,179,8,0.12)",   text: "#facc15", border: "rgba(234,179,8,0.25)",   dot: "#eab308" },
  rent:          { bg: "rgba(20,184,166,0.12)",  text: "#2dd4bf", border: "rgba(20,184,166,0.25)",  dot: "#14b8a6" },
  housing:       { bg: "rgba(20,184,166,0.12)",  text: "#2dd4bf", border: "rgba(20,184,166,0.25)",  dot: "#14b8a6" },

  // Income
  salary:        { bg: "rgba(52,211,153,0.12)",  text: "#34d399", border: "rgba(52,211,153,0.25)",  dot: "#10b981" },
  income:        { bg: "rgba(52,211,153,0.12)",  text: "#34d399", border: "rgba(52,211,153,0.25)",  dot: "#10b981" },
  freelance:     { bg: "rgba(52,211,153,0.12)",  text: "#34d399", border: "rgba(52,211,153,0.25)",  dot: "#10b981" },
  investment:    { bg: "rgba(16,185,129,0.12)",  text: "#34d399", border: "rgba(16,185,129,0.25)",  dot: "#10b981" },

  // Education
  education:     { bg: "rgba(99,102,241,0.12)",  text: "#818cf8", border: "rgba(99,102,241,0.25)",  dot: "#6366f1" },

  // Savings
  savings:       { bg: "rgba(20,184,166,0.12)",  text: "#2dd4bf", border: "rgba(20,184,166,0.25)",  dot: "#14b8a6" },
};

// Palette for pie charts (in order)
export const PIE_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e",
  "#f97316", "#eab308", "#10b981", "#14b8a6",
  "#3b82f6", "#0ea5e9",
];

/** Get color config for a category, falling back to a hash-based indigo variant */
export function getCategoryColor(category: string): { bg: string; text: string; border: string; dot: string } {
  const key = category.toLowerCase().trim();
  if (CATEGORY_COLORS[key]) return CATEGORY_COLORS[key];

  // Deterministic fallback from a set of indigo/violet shades
  const fallbacks = [
    { bg: "rgba(99,102,241,0.12)",  text: "#818cf8", border: "rgba(99,102,241,0.25)",  dot: "#6366f1" },
    { bg: "rgba(139,92,246,0.12)",  text: "#a78bfa", border: "rgba(139,92,246,0.25)",  dot: "#8b5cf6" },
    { bg: "rgba(20,184,166,0.12)",  text: "#2dd4bf", border: "rgba(20,184,166,0.25)",  dot: "#14b8a6" },
    { bg: "rgba(59,130,246,0.12)",  text: "#60a5fa", border: "rgba(59,130,246,0.25)",  dot: "#3b82f6" },
    { bg: "rgba(236,72,153,0.12)",  text: "#f472b6", border: "rgba(236,72,153,0.25)",  dot: "#ec4899" },
  ];
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) & 0xffffffff;
  return fallbacks[Math.abs(hash) % fallbacks.length];
}
