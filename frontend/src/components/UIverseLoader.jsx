/**
 * Scanning Loader — adapted from UIverse.io by Uncannypotato69
 * Original: white text with inverted sliding box
 * Theme: adapted to NIDS dark theme — blue tint, monospace font
 */

import './UIverseLoader.css'

export default function UIverseLoader({ text = 'Analyzing...' }) {
  return (
    <div className="nids-loader-wrapper">
      <p className="nids-loader-text">{text}</p>
      <div className="nids-loader-invertbox" />
    </div>
  )
}
