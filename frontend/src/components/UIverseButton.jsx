/**
 * Predict Button — adapted from UIverse.io by hakemdamer222
 * Original: purple gradient pill button with press-down 3D effect
 * Theme: adapted to NIDS dark theme using project accent colors
 */

import './UIverseButton.css'

export default function UIverseButton({ children, onClick, disabled, type = 'button' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`uiverse-btn${disabled ? ' uiverse-btn--disabled' : ''}`}
    >
      {children}
    </button>
  )
}
