import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Crosshair, Loader } from 'lucide-react'
import Badge from '../components/Badge'
import { predict } from '../lib/api'

const defaultForm = {
  duration: 0, protocol_type: 'tcp', service: 'http', flag: 'SF',
  src_bytes: 491, dst_bytes: 0, land: 0, wrong_fragment: 0, urgent: 0,
  hot: 0, num_failed_logins: 0, logged_in: 0, count: 1, srv_count: 1,
  serror_rate: 0, rerror_rate: 0, same_srv_rate: 1, diff_srv_rate: 0,
}

const fields = [
  { key: 'duration',        label: 'Duration',         type: 'number' },
  { key: 'protocol_type',   label: 'Protocol',         type: 'select', options: ['tcp','udp','icmp'] },
  { key: 'service',         label: 'Service',          type: 'select', options: ['http','ftp','smtp','ssh','other'] },
  { key: 'flag',            label: 'Flag',             type: 'select', options: ['SF','S0','REJ','RSTO','SH'] },
  { key: 'src_bytes',       label: 'Src Bytes',        type: 'number' },
  { key: 'dst_bytes',       label: 'Dst Bytes',        type: 'number' },
  { key: 'logged_in',       label: 'Logged In',        type: 'select', options: ['0','1'] },
  { key: 'count',           label: 'Count',            type: 'number' },
  { key: 'srv_count',       label: 'Srv Count',        type: 'number' },
  { key: 'serror_rate',     label: 'SError Rate',      type: 'number' },
  { key: 'rerror_rate',     label: 'RError Rate',      type: 'number' },
  { key: 'same_srv_rate',   label: 'Same Srv Rate',    type: 'number' },
  { key: 'diff_srv_rate',   label: 'Diff Srv Rate',    type: 'number' },
]

const inputStyle = {
  background: '#0A0A0A',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  color: '#F1F1EE',
  fontSize: 13,
  padding: '8px 12px',
  width: '100%',
  outline: 'none',
}

export default function Predict() {
  useEffect(() => { document.title = 'NIDS · Predict' }, [])
  const [form, setForm]       = useState(defaultForm)
  const [result, setResult]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const handleChange = (key, val) =>
    setForm(f => ({ ...f, [key]: val }))

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

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
      className="space-y-6">

      <div>
        <h1 style={{ fontSize: 22, fontWeight: 600 }}>Predict</h1>
        <p style={{ color: '#888', fontSize: 13, marginTop: 4 }}>Enter network flow features to classify attack type</p>
      </div>

      <div className="grid grid-cols-2 gap-6">

        {/* Form */}
        <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 24 }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {fields.map(({ key, label, type, options }) => (
                <div key={key}>
                  <label style={{ color: '#888', fontSize: 12, display: 'block', marginBottom: 6 }}>{label}</label>
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

            <button type="submit" disabled={loading}
              style={{
                background: '#0066FF', color: '#fff', border: 'none', borderRadius: 8,
                padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                opacity: loading ? 0.7 : 1,
              }}>
              {loading ? <Loader size={16} className="animate-spin" /> : <Crosshair size={16} />}
              {loading ? 'Predicting...' : 'Predict'}
            </button>
          </form>
        </div>

        {/* Result */}
        <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Result</h2>

          <AnimatePresence mode="wait">
            {error && (
              <motion.p key="err" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ color: '#E24B4A', fontSize: 13 }}>{error}</motion.p>
            )}

            {result && (
              <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="space-y-4">
                <div className="flex items-center gap-3">
                  <Badge label={result.prediction} />
                  <span style={{ color: '#888', fontSize: 13 }}>
                    Confidence: <span style={{ color: '#F1F1EE', fontWeight: 600 }}>{(result.confidence * 100).toFixed(1)}%</span>
                  </span>
                </div>

                {result.top_features && (
                  <div>
                    <p style={{ color: '#888', fontSize: 12, marginBottom: 10 }}>Top contributing features:</p>
                    <div className="space-y-2">
                      {result.top_features.map(([feat, val]) => (
                        <div key={feat} className="flex items-center gap-3">
                          <span style={{ color: '#888', fontSize: 12, width: 160 }}>{feat}</span>
                          <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 4 }}>
                            <div style={{ width: `${Math.min(Math.abs(val) * 100, 100)}%`, height: '100%',
                              background: val > 0 ? '#0066FF' : '#E24B4A', borderRadius: 4 }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {!result && !error && (
              <motion.p key="empty" style={{ color: '#888', fontSize: 13 }}>
                Fill in the form and click Predict to see results.
              </motion.p>
            )}
          </AnimatePresence>
        </div>

      </div>
    </motion.div>
  )
}
