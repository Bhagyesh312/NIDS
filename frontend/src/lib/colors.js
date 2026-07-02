// Single source of truth for all category colors
// Import this everywhere — never hardcode category colors elsewhere

// ── NSL-KDD colors (5 classes) ────────────────────────────────────────────────
export const CATEGORY_COLORS = {
  Normal: '#22c55e',   // green
  DoS:    '#ef4444',   // red
  Probe:  '#38bdf8',   // sky blue
  R2L:    '#f59e0b',   // amber
  U2R:    '#a78bfa',   // purple
}

// ── CICIDS2017 colors (10 classes) ───────────────────────────────────────────
export const CICIDS_COLORS = {
  Benign:                       '#22c55e',   // green  (same as Normal)
  DoS:                          '#ef4444',   // red
  DDoS:                         '#f97316',   // orange
  PortScan:                     '#38bdf8',   // sky blue
  BruteForce:                   '#f59e0b',   // amber
  Bot:                          '#a78bfa',   // purple
  Infiltration:                 '#ec4899',   // pink
  'Web Attack \uFFFD Brute Force':  '#fb923c',   // light orange
  'Web Attack \uFFFD Sql Injection':'#e879f9',   // fuchsia
  'Web Attack \uFFFD XSS':          '#818cf8',   // indigo
}

// ── Unified: returns the right color regardless of which model produced the label ──
export function getLabelColor(label) {
  return (
    CATEGORY_COLORS[label] ||
    CICIDS_COLORS[label]   ||
    '#888888'
  )
}

// ── Faint background tint per category (for badges, row highlights) ──────────
export const CATEGORY_BG = {
  Normal: '#0f1f13',
  DoS:    '#1f0f0f',
  Probe:  '#0a1a22',
  R2L:    '#1f1a0a',
  U2R:    '#15101f',
}

export const CICIDS_BG = {
  Benign:      '#0f1f13',
  DoS:         '#1f0f0f',
  DDoS:        '#1f1308',
  PortScan:    '#0a1a22',
  BruteForce:  '#1f1a0a',
  Bot:         '#15101f',
  Infiltration:'#1f0a14',
}

export function getLabelBg(label) {
  return CATEGORY_BG[label] || CICIDS_BG[label] || '#111111'
}

// ── Ordered arrays ────────────────────────────────────────────────────────────
// KDD categories
export const CATEGORIES = ['Normal', 'DoS', 'Probe', 'R2L', 'U2R']

// CICIDS categories
export const CICIDS_CATEGORIES = [
  'Benign', 'DoS', 'DDoS', 'PortScan', 'BruteForce',
  'Bot', 'Infiltration',
  'Web Attack \uFFFD Brute Force',
  'Web Attack \uFFFD Sql Injection',
  'Web Attack \uFFFD XSS',
]

// All attack-only categories (excluding normal variants)
export const CICIDS_ATTACK_CATEGORIES = CICIDS_CATEGORIES.filter(c => c !== 'Benign')

// ── Convenience: get color by index (KDD) ────────────────────────────────────
export const categoryColor  = (i) => CATEGORY_COLORS[CATEGORIES[i]]
export const categoryColors = CATEGORIES.map(c => CATEGORY_COLORS[c])
