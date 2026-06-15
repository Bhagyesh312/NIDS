import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Crosshair } from 'lucide-react'
import Badge from '../components/Badge'
import UIverseButton from '../components/UIverseButton'
import UIverseLoader from '../components/UIverseLoader'
import { predict } from '../lib/api'
import { CATEGORY_COLORS } from '../lib/colors'

const defaultForm = {
  duration: 0, protocol_type: 'tcp', service: 'http', flag: 'SF',
  src_bytes: 491, dst_bytes: 0, land: 0, wrong_fragment: 0, urgent: 0,
  hot: 0, num_failed_logins: 0, logged_in: 0, count: 1, srv_count: 1,
  serror_rate: 0, rerror_rate: 0, same_srv_rate: 1, diff_srv_rate: 0,
}

const fields = [
  { key: 'duration',      label: 'Duration',      type: 'number' },
  { key: 'protocol_type', label: 'Protocol',      type: 'select', options: ['tcp','udp','icmp'] },
  { key: 'service',       label: 'Service',       type: 'select', options: ['http','ftp','smtp','ssh','other'] },
  { key: 'flag',          label: 'Flag',          type: 'select', options: ['SF','S0','REJ','RSTO','SH'] },
  { key: 'src_bytes',     label: 'Src Bytes',     type: 'number' },
  { key: 'dst_bytes',     label: 'Dst Bytes',     type: 'number' },
  { key: 'logged_in',     label: 'Logged In',     type: 'select', options: ['0','1'] },
  { key: 'count',         label: 'Count',         type: 'number' },
  { key: 'srv_count',     label: 'Srv Count',     type: 'number' },
  { key: 'serror_rate',   label: 'SError Rate',   type: 'number' },
  { key: 'rerror_rate',   label: 'RError Rate',   type: 'number' },
  { key: 'same_srv_rate', label: 'Same Srv Rate', type: 'number' },
  { key: 'diff_srv_rate', label: 'Diff Srv Rate', type: 'number' },
]

const inputStyle = {
  background: '#0d0d0d',
  border: '1px solid #1f1f1f',
  borderRadius: 7,
  color: '#e2e2e2',
  fontSize: 13,
  padding: '8px 12px',
  width: '100%',
  outline: 'none',
  fontFamily: 'Inter, sans-serif',
}

export default function Predict() {
  useEffect(() => { document.title = 'NIDS · Predict' }, [])

  const [form, setForm]       = useState(defaultForm)
  const [result, setResult]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const handleChange = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await predict(form)
      setResult(res.data)
    } catch {
      setError('Backend not connected. Start the FastAPI server.')
    } finally {
      setLoading(false)
    }
  }

  const resultColor = result ? CATEGORY_COLORS[result.prediction] || '#e2e2e2' : '#e2e2e2'

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}>

      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: '#f0f0f0' }}>Predict</h1>
        <p style={{ color: '#555', fontSize: 13, marginTop: 3 }}>Enter network flow features to classify attack type</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Form card */}
        <div style={{ background: '#161616', border: '1px solid #1f1f1f', borderRadius: 10, padding: 22 }}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              {fields.map(({ key, label, type, options }) => (
                <div key={key}>
                  <label style={{ color: '#555', fontSize: 11, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</label>
                  {type === 'select' ? (
                    <select style={inputStyle} value={form[key]} onChange={e => handleChange(key, e.target.value)}>
                      {options.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input style={inputStyle} type="number" step="any" value={form[key]}
                      onChange={e => handleChange(key, parseFloat(e.target.value) || 0)} />
                  )}
                </div>
              ))}
            </div>

            {/* UIverse button from uiverse.io by hakemdamer222 */}
            <UIverseButton type="submit" disabled={loading}>
              <Crosshair size={15} />
              {loading ? 'Analyzing...' : 'Analyze Traffic'}
            </UIverseButton>
          </form>
        </div>

        {/* Result card */}
        <div style={{ background: '#161616', border: '1px solid #1f1f1f', borderRadius: 10, padding: 22 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#ccc', marginBottom: 20 }}>Result</div>

          <AnimatePresence mode="wait">

            {/* UIverse loader from uiverse.io by Uncannypotato69 */}
            {loading && (
              <motion.div key="loading"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', gap: 24 }}
              >
                <UIverseLoader text="Analyzing..." />
                <p style={{ fontSize: 11, color: '#444' }}>Running XGBoost classifier...</p>
              </motion.div>
            )}

            {error && !loading && (
              <motion.div key="err" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div style={{
                  background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
                  borderRadius: 8, padding: '14px 16px',
                }}>
                  <p style={{ color: '#ef4444', fontSize: 13, margin: 0 }}>{error}</p>
                  <p style={{ color: '#555', fontSize: 11, marginTop: 6 }}>Run: <code style={{ color: '#888', fontFamily: 'monospace' }}>cd backend && uvicorn main:app --reload</code></p>
                </div>
              </motion.div>
            )}

            {result && !loading && (
              <motion.div key="result"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
              >
                {/* Prediction */}
                <div style={{
                  background: `${resultColor}0d`,
                  border: `1px solid ${resultColor}30`,
                  borderRadius: 10, padding: '16px 18px',
                }}>
                  <div style={{ fontSize: 11, color: '#555', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Classification</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Badge label={result.prediction} />
                    <span style={{ fontSize: 22, fontWeight: 700, color: resultColor, fontVariantNumeric: 'tabular-nums' }}>
                      {(result.confidence * 100).toFixed(1)}%
                    </span>
                    <span style={{ fontSize: 12, color: '#555' }}>confidence</span>
                  </div>

                  {/* Confidence bar */}
                  <div style={{ marginTop: 12, height: 4, background: '#1f1f1f', borderRadius: 4 }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(result.confidence * 100).toFixed(1)}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                      style={{ height: '100%', background: resultColor, borderRadius: 4 }}
                    />
                  </div>
                </div>

                {/* Top features */}
                {result.top_features && (
                  <div>
                    <p style={{ color: '#555', fontSize: 11, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Top contributing features</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {result.top_features.map(([feat, val]) => (
                        <div key={feat} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ color: '#555', fontSize: 11, width: 150, flexShrink: 0, fontFamily: 'monospace' }}>{feat}</span>
                          <div style={{ flex: 1, height: 3, background: '#1f1f1f', borderRadius: 3 }}>
                            <div style={{
                              width: `${Math.min(Math.abs(val) * 100, 100)}%`, height: '100%',
                              background: val > 0 ? '#3b82f6' : '#ef4444', borderRadius: 3,
                            }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {!result && !loading && !error && (
              <motion.div key="empty"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 0', gap: 12 }}
              >
                <Crosshair size={28} color="#2a2a2a" />
                <p style={{ color: '#444', fontSize: 13, textAlign: 'center' }}>
                  Fill in the network flow features<br />and click Analyze Traffic
                </p>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}
