import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { getModelInfo } from '../lib/api'
import SkeletonBox, { SkeletonCard } from '../components/Skeleton'
import { CATEGORY_COLORS } from '../lib/colors'

const mockModel = {
  algorithm: 'XGBoost',
  dataset: 'NSL-KDD',
  samples: 125973,
  features: 41,
  train_size: '80 / 20 split',
  test_accuracy: null,
  test_f1_weighted: null,
  val_accuracy: null,
  confusion_matrix: {
    labels: ['DoS', 'Normal', 'Probe', 'R2L', 'U2R'],
    matrix: [
      [9180,    3,   0,   0,  0],
      [   2, 13420,   5,   1,  0],
      [   0,   10, 2320,  12,  0],
      [   0,   18,   5, 178,  0],
      [   0,    2,   0,   0,  8],
    ]
  },
  feature_importance: [
    { name: 'serror_rate',          value: 0.18 },
    { name: 'dst_host_serror_rate', value: 0.15 },
    { name: 'src_bytes',            value: 0.12 },
    { name: 'srv_serror_rate',      value: 0.10 },
    { name: 'count',                value: 0.09 },
    { name: 'same_srv_rate',        value: 0.08 },
    { name: 'dst_bytes',            value: 0.07 },
    { name: 'logged_in',            value: 0.06 },
    { name: 'dst_host_count',       value: 0.05 },
    { name: 'flag',                 value: 0.04 },
  ]
}

const HEAT_COLORS = (val, max) => {
  const intensity = val / max
  if (intensity > 0.6) return 'rgba(0,102,255,0.7)'
  if (intensity > 0.2) return 'rgba(0,102,255,0.35)'
  if (val === 0)       return 'rgba(255,255,255,0.03)'
  return 'rgba(0,102,255,0.12)'
}

export default function ModelInfo() {
  const [info, setInfo]       = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => { document.title = 'NIDS · Model Info' }, [])

  useEffect(() => {
    getModelInfo()
      .then(r => { setInfo(r.data); setLoading(false) })
      .catch(() => { setInfo(mockModel); setLoading(false) })
  }, [])

  const matMax = info ? Math.max(...info.confusion_matrix.matrix.flat()) : 1

  if (loading) {
    return (
      <div>
        <div style={{ marginBottom: 24 }}>
          <SkeletonBox width={180} height={22} radius={5} style={{ marginBottom: 8 }} />
          <SkeletonBox width={280} height={13} radius={4} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 16 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ background: '#161616', border: '1px solid #1f1f1f', borderRadius: 8, padding: 16 }}>
              <SkeletonBox width={60} height={11} style={{ marginBottom: 8 }} />
              <SkeletonBox width={80} height={18} radius={4} />
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <SkeletonCard height={260} />
          <SkeletonCard height={260} />
        </div>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
      className="space-y-6">

      <div>
        <h1 style={{ fontSize: 22, fontWeight: 600 }}>Model Information</h1>
        <p style={{ color: '#888', fontSize: 13, marginTop: 4 }}>Training details, confusion matrix, and feature importance</p>
      </div>

      {/* Model details */}
      <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 24 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Model Details</h2>
        <div className="grid grid-cols-5 gap-4">
          {[
            { label: 'Algorithm',   value: info.algorithm },
            { label: 'Dataset',     value: info.dataset },
            { label: 'Samples',     value: info.samples.toLocaleString() },
            { label: 'Features',    value: info.features },
            { label: 'Train Split', value: info.train_size },
          ].map(({ label, value }) => (
            <div key={label}>
              <p style={{ color: '#888', fontSize: 12, marginBottom: 6 }}>{label}</p>
              <p style={{ color: '#F1F1EE', fontSize: 16, fontWeight: 600 }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Accuracy / F1 row — only shown when real data is available */}
        {(info.test_accuracy != null || info.val_accuracy != null) && (
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 32 }}>
            {info.val_accuracy != null && (
              <div>
                <p style={{ color: '#888', fontSize: 12, marginBottom: 6 }}>Val Accuracy</p>
                <p style={{ color: '#22c55e', fontSize: 20, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                  {(info.val_accuracy * 100).toFixed(2)}%
                </p>
              </div>
            )}
            {info.test_accuracy != null && (
              <div>
                <p style={{ color: '#888', fontSize: 12, marginBottom: 6 }}>Test Accuracy</p>
                <p style={{ color: '#3b82f6', fontSize: 20, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                  {(info.test_accuracy * 100).toFixed(2)}%
                </p>
              </div>
            )}
            {info.test_f1_weighted != null && (
              <div>
                <p style={{ color: '#888', fontSize: 12, marginBottom: 6 }}>Test F1 (weighted)</p>
                <p style={{ color: '#a78bfa', fontSize: 20, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                  {(info.test_f1_weighted * 100).toFixed(2)}%
                </p>
              </div>
            )}
            {info.mlflow_run_id && (
              <div>
                <p style={{ color: '#888', fontSize: 12, marginBottom: 6 }}>MLflow Run ID</p>
                <p style={{ color: '#555', fontSize: 12, fontFamily: 'monospace', marginTop: 4 }}>
                  {info.mlflow_run_id.slice(0, 12)}…
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">

        {/* Confusion matrix */}
        <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Confusion Matrix</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  <th style={{ padding: '6px 10px', color: '#888', fontWeight: 400 }}>Actual ↓ / Pred →</th>
                  {info.confusion_matrix.labels.map(l => (
                    <th key={l} style={{ padding: '6px 10px', color: '#888', fontWeight: 500 }}>{l}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {info.confusion_matrix.matrix.map((row, i) => (
                  <tr key={i}>
                    <td style={{ padding: '6px 10px', color: '#888', fontWeight: 500 }}>
                      {info.confusion_matrix.labels[i]}
                    </td>
                    {row.map((val, j) => (
                      <td key={j} style={{
                        padding: '8px 12px', textAlign: 'center', borderRadius: 4,
                        background: HEAT_COLORS(val, matMax),
                        color: val > 0 ? '#F1F1EE' : '#444',
                        fontVariantNumeric: 'tabular-nums',
                      }}>
                        {val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Feature importance */}
        <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Top 10 Feature Importance</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={info.feature_importance} layout="vertical" barSize={10}
              margin={{ left: 0, right: 16 }}>
              <XAxis type="number" tick={{ fill: '#888', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={170}
                tick={{ fill: '#888', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#1a2235', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }}
                labelStyle={{ color: '#F1F1EE', fontSize: 12 }}
                itemStyle={{ color: '#888', fontSize: 12 }}
              />
              <Bar dataKey="value" radius={[0,4,4,0]} name="Importance">
                {info.feature_importance.map((_, i) => (
                  <Cell key={i} fill={`rgba(0,102,255,${1 - i * 0.07})`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>
    </motion.div>
  )
}
