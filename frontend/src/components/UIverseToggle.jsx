/**
 * Mock Mode Toggle — adapted from UIverse.io pill switch
 * Left label:  "Demo" — backend offline, using mock data
 * Right label: "API"  — backend connected, using live data
 *
 * checked = true  → API mode  (right active)
 * checked = false → Demo mode (left active)
 */
import './UIverseToggle.css'

export default function UIverseToggle({ checked, onChange }) {
  const id = 'nids-mode-toggle'
  return (
    <label
      htmlFor={id}
      className="switch"
      aria-label="Toggle between Demo and API mode"
    >
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={e => onChange(e.target.checked)}
      />
      <span>Demo</span>
      <span>API</span>
    </label>
  )
}
