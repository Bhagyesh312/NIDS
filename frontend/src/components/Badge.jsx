import { getLabelColor, getLabelBg } from '../lib/colors'

/**
 * Badge — renders a colored pill for any prediction label.
 * Works for both KDD (Normal / DoS / Probe / R2L / U2R)
 * and CICIDS2017 (Benign / Bot / BruteForce / DDoS / DoS /
 *   Infiltration / PortScan / Web Attack variants).
 */
export default function Badge({ label }) {
  const color = getLabelColor(label)
  const bg    = getLabelBg(label)

  // Shorten long CICIDS web-attack labels for display
  const display = label
    ?.replace('Web Attack \uFFFD ', 'Web/')
    ?.replace('Web Attack ï¿½ ',    'Web/')
    ?? label

  return (
    <span
      title={label}
      style={{
        display:      'inline-block',
        padding:      '2px 8px',
        borderRadius: 4,
        fontSize:     11,
        fontWeight:   600,
        color,
        background:   bg,
        border:       `1px solid ${color}22`,
        whiteSpace:   'nowrap',
        maxWidth:     140,
        overflow:     'hidden',
        textOverflow: 'ellipsis',
      }}
    >
      {display}
    </span>
  )
}
