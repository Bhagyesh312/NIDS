// Single source of truth for all 5 category colors
// Import this everywhere — never hardcode category colors elsewhere

export const CATEGORY_COLORS = {
  Normal: '#22c55e',   // green
  DoS:    '#ef4444',   // red
  Probe:  '#38bdf8',   // sky blue
  R2L:    '#f59e0b',   // amber
  U2R:    '#a78bfa',   // purple
}

// Faint background tint per category (for badges, row highlights, terminal bg)
export const CATEGORY_BG = {
  Normal: '#0f1f13',
  DoS:    '#1f0f0f',
  Probe:  '#0a1a22',
  R2L:    '#1f1a0a',
  U2R:    '#15101f',
}

// Ordered array — same order used everywhere (pie chart, legend, stat cards)
export const CATEGORIES = ['Normal', 'DoS', 'Probe', 'R2L', 'U2R']

// Convenience: get color by index
export const categoryColor = (i) => CATEGORY_COLORS[CATEGORIES[i]]
export const categoryColors = CATEGORIES.map(c => CATEGORY_COLORS[c])
