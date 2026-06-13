import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { getModelInfo } from '../lib/api'

const mockModel = {
  algorithm: 'XGBoost',
  dataset: 'NSL-KDD',
  samples: 125973,
  features: 41,
  train_size: '80%',
  confusion_matrix: {
    labels: ['Normal', 'DoS', 'Probe', 'R2L', 'U2R'],
    matrix: [
      [13420,  2,  5,  1,  0],
      [    3, 9180,  0,  0,  0],
      [   10,  0, 2320, 12,  0],
      [   18,  0,   5, 178,  0],
      [    2,  0,   0,   0,  8],
    ]
  },
  feature_importance: [
    { name: 'serror_rate',          value: 18 },
    { name: 'dst_host_serror_rate', value: 15 },
    { name: 'src_bytes',            value: 12 },
    { name: 'srv_serror_rate',      value: 10 },
    { name: 'count',                value:  9 },
    { name: 'same_srv_rate',        value:  8 },
    { name: 'dst_bytes',            value:  7 },
    { name: 'logged_in',            value:  6 },
    { name: 'dst_host_count',       value:  5 },
    { name: 'flag',                 value:  4 },
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
  const [info, setInfo] = useState(mockModel)

  useEffect(() => {
    getModelInfo().then(r => setInfo(r.data)).catch(() => {})
  }, [])

  const matMax = Math.max(...info.confusion_matrix.matrix.flat())

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
            { label: 'Algorithm',  value: info.algorithm },
            { label: 'Dataset',    value: info.dataset },
            { label: 'Samples',    value: info.samples.toLocaleString() },
            { label: 'Features',   value: info.features },
            { label: 'Train Split', value: info.train_size },
          ].map(({ label, value }) => (
            <div key={label}>
              <p style={{ color: '#888', fontSize: 12, marginBottom: 6 }}>{label}</p>
              <p style={{ color: '#F1F1EE', fontSize: 16, fontWeight: 600 }}>{value}</p>
            </div>
          ))}
        </div>
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
