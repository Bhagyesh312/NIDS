/**
 * Stat Card — adapted from UIverse.io by zeeshan_2112
 * Original: conference ticket with 3D hover, grid animation, barcode stub
 * Theme: adapted for NIDS — each card shows attack category stats
 */

import './UIverseStatCard.css'

export default function UIverseStatCard({ label, value, suffix = '', subLabel, color, icon: Icon }) {
  return (
    <div className="ticket-wrapper">
      <div className="ticket">

        {/* Main section */}
        <div className="t-main">
          <div className="t-content">

            {/* Header */}
            <div className="t-header">
              <div className="t-logo" style={{ '--t-accent': color }}>
                {Icon && <Icon size={16} />}
                NIDS
              </div>
              <div className="t-type" style={{ color, borderColor: color }}>
                Live
              </div>
            </div>

            {/* Big number */}
            <div className="t-title" style={{ '--t-accent': color }}>
              {value}{suffix}
            </div>
            <div className="t-subtitle">{label}</div>

            {/* Details */}
            <div className="t-details">
              <div className="t-detail-item">
                <span className="t-label">Status</span>
                <span className="t-value" style={{ color }}>Active</span>
              </div>
              <div className="t-detail-item">
                <span className="t-label">Dataset</span>
                <span className="t-value">NSL-KDD</span>
              </div>
            </div>
          </div>

          {/* Perforation line */}
          <div className="t-perforation">
            <div className="t-perf-line" />
          </div>
        </div>

        {/* Stub section */}
        <div className="t-stub">
          <div className="t-barcode-container">
            <div className="t-barcode" />
            <div className="t-barcode-id">NIDS-ML-{Math.random().toString(36).slice(2,8).toUpperCase()}</div>
          </div>
          <div className="t-admit">
            <div className="t-admit-text">{subLabel || 'Score'}</div>
            <div className="t-admit-num" style={{ color, textShadow: `0 0 15px ${color}80` }}>
              {suffix ? value : '✓'}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
