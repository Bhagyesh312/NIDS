/**
 * Stat Card — adapted from UIverse.io by zeeshan_2112
 * Original: conference ticket with 3D hover, grid animation, barcode stub
 * Theme: adapted for NIDS — each card shows attack category stats
 */

import { useState } from 'react'
import './UIverseStatCard.css'

export default function UIverseStatCard({ label, value, suffix = '', subLabel, color, icon: Icon }) {
  // Stable barcode ID — generated once via lazy useState initialiser (pure, no side-effects)
  const [barcodeId] = useState(
    () => Math.random().toString(36).slice(2, 8).toUpperCase()
  )
  return (
    <div className="ticket-wrapper">
      <div className="ticket">

        {/* Main section */}
        <div className="t-main">
          <div className="t-content">

            {/* Header */}
            <div className="t-header">
              <div className="t-logo">
                {Icon && <Icon size={16} color={color} />}
                <span style={{ color: '#e2e2e2' }}>NIDS</span>
              </div>
              <div className="t-type" style={{ color, borderColor: color }}>
                Live
              </div>
            </div>

            {/* Big number */}
            <div className="t-title" style={{ color }}>
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
                <span className="t-value" style={{ color: '#aaa' }}>NSL-KDD</span>
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
            <div className="t-barcode-id">NIDS-ML-{barcodeId}</div>
          </div>
          <div className="t-admit">
            <div className="t-admit-text">{subLabel || 'Score'}</div>
            <div className="t-admit-num" style={{ color, textShadow: `0 0 12px ${color}60` }}>
              {suffix ? value : '✓'}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
