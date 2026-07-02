import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Crosshair, Zap, ChevronDown, ChevronUp, Clock, Database } from 'lucide-react'
import Badge from '../components/Badge'
import UIverseButton from '../components/UIverseButton'
import UIverseLoader from '../components/UIverseLoader'
import { predict } from '../lib/api'
import { CATEGORY_COLORS, getLabelColor } from '../lib/colors'
import { useModel } from '../lib/modelContext'

// ── KDD: Full 40-feature default form ────────────────────────
const defaultFormKDD = {
  duration: 0, protocol_type: 'tcp', service: 'http', flag: 'SF',
  src_bytes: 491, dst_bytes: 0, land: 0, wrong_fragment: 0, urgent: 0,
  hot: 0, num_failed_logins: 0, logged_in: 0, num_compromised: 0,
  root_shell: 0, su_attempted: 0, num_root: 0, num_file_creations: 0,
  num_shells: 0, num_access_files: 0, is_host_login: 0, is_guest_login: 0,
  count: 1, srv_count: 1,
  serror_rate: 0, srv_serror_rate: 0,
  rerror_rate: 0, srv_rerror_rate: 0,
  same_srv_rate: 1, diff_srv_rate: 0, srv_diff_host_rate: 0,
  dst_host_count: 0, dst_host_srv_count: 0,
  dst_host_same_srv_rate: 0, dst_host_diff_srv_rate: 0,
  dst_host_same_src_port_rate: 0, dst_host_srv_diff_host_rate: 0,
  dst_host_serror_rate: 0, dst_host_srv_serror_rate: 0,
  dst_host_rerror_rate: 0, dst_host_srv_rerror_rate: 0,
}

// ── CICIDS: 69-feature default form ──────────────────────────
const defaultFormCICIDS = {
  'Flow Duration': 0, 'Total Fwd Packets': 0, 'Total Backward Packets': 0,
  'Total Length of Fwd Packets': 0, 'Total Length of Bwd Packets': 0,
  'Fwd Packet Length Max': 0, 'Fwd Packet Length Min': 0,
  'Fwd Packet Length Mean': 0, 'Fwd Packet Length Std': 0,
  'Bwd Packet Length Max': 0, 'Bwd Packet Length Min': 0,
  'Bwd Packet Length Mean': 0, 'Bwd Packet Length Std': 0,
  'Flow Bytes/s': 0, 'Flow Packets/s': 0,
  'Flow IAT Mean': 0, 'Flow IAT Std': 0, 'Flow IAT Max': 0, 'Flow IAT Min': 0,
  'Fwd IAT Total': 0, 'Fwd IAT Mean': 0, 'Fwd IAT Std': 0,
  'Fwd IAT Max': 0, 'Fwd IAT Min': 0,
  'Bwd IAT Total': 0, 'Bwd IAT Mean': 0, 'Bwd IAT Std': 0,
  'Bwd IAT Max': 0, 'Bwd IAT Min': 0,
  'Fwd PSH Flags': 0, 'Bwd PSH Flags': 0,
  'Fwd URG Flags': 0, 'Bwd URG Flags': 0,
  'Fwd Header Length': 0, 'Bwd Header Length': 0,
  'Fwd Packets/s': 0, 'Bwd Packets/s': 0,
  'Min Packet Length': 0, 'Max Packet Length': 0,
  'Packet Length Mean': 0, 'Packet Length Std': 0, 'Packet Length Variance': 0,
  'FIN Flag Count': 0, 'SYN Flag Count': 0, 'RST Flag Count': 0,
  'PSH Flag Count': 0, 'ACK Flag Count': 0, 'URG Flag Count': 0,
  'CWE Flag Count': 0, 'ECE Flag Count': 0,
  'Down/Up Ratio': 0, 'Average Packet Size': 0,
  'Avg Fwd Segment Size': 0, 'Avg Bwd Segment Size': 0,
  'Fwd Header Length.1': 0,
  'Fwd Avg Bytes/Bulk': 0, 'Fwd Avg Packets/Bulk': 0, 'Fwd Avg Bulk Rate': 0,
  'Bwd Avg Bytes/Bulk': 0, 'Bwd Avg Packets/Bulk': 0, 'Bwd Avg Bulk Rate': 0,
  'Subflow Fwd Packets': 0, 'Subflow Fwd Bytes': 0,
  'Subflow Bwd Packets': 0, 'Subflow Bwd Bytes': 0,
  'Init_Win_bytes_forward': 0, 'Init_Win_bytes_backward': 0,
  'act_data_pkt_fwd': 0, 'min_seg_size_forward': 0,
  'Active Mean': 0, 'Active Std': 0, 'Active Max': 0, 'Active Min': 0,
  'Idle Mean': 0, 'Idle Std': 0, 'Idle Max': 0, 'Idle Min': 0,
}

// ── KDD Sample quick-fills ────────────────────────────────────
const KDD_SAMPLES = {
  DoS: {
    label: 'DoS sample', color: CATEGORY_COLORS.DoS,
    values: { ...defaultFormKDD, flag: 'S0', src_bytes: 0, dst_bytes: 0,
      count: 511, srv_count: 511, serror_rate: 1.0, srv_serror_rate: 1.0,
      same_srv_rate: 1.0, dst_host_serror_rate: 1.0, dst_host_srv_serror_rate: 1.0 },
  },
  Probe: {
    label: 'Probe sample', color: CATEGORY_COLORS.Probe,
    values: { ...defaultFormKDD, service: 'private', flag: 'REJ',
      src_bytes: 0, dst_bytes: 0, count: 192, srv_count: 5,
      rerror_rate: 1.0, srv_rerror_rate: 1.0, same_srv_rate: 0.03, diff_srv_rate: 0.06 },
  },
  Normal: {
    label: 'Normal sample', color: CATEGORY_COLORS.Normal,
    values: { ...defaultFormKDD, src_bytes: 232, dst_bytes: 8153, logged_in: 1,
      count: 5, srv_count: 5, same_srv_rate: 1.0 },
  },
}

// ── CICIDS Sample quick-fills ─────────────────────────────────
const CICIDS_SAMPLES = {
  DoS: {
    label: 'DoS sample', color: CATEGORY_COLORS.DoS,
    values: { ...defaultFormCICIDS, 'Flow Duration': 119980000, 'Total Fwd Packets': 2,
      'Flow Bytes/s': 1000, 'Flow Packets/s': 16.7, 'SYN Flag Count': 1 },
  },
  DDoS: {
    label: 'DDoS sample', color: '#f97316',
    values: { ...defaultFormCICIDS, 'Total Fwd Packets': 1000, 'Total Backward Packets': 0,
      'Flow Bytes/s': 5000000, 'Flow Packets/s': 10000, 'SYN Flag Count': 1000 },
  },
  Benign: {
    label: 'Benign sample', color: CATEGORY_COLORS.Normal,
    values: { ...defaultFormCICIDS, 'Flow Duration': 50000, 'Total Fwd Packets': 10,
      'Total Backward Packets': 8, 'Total Length of Fwd Packets': 2000,
      'Total Length of Bwd Packets': 1800, 'ACK Flag Count': 10 },
  },
}

// ── KDD Field definitions ─────────────────────────────────────
const KDD_BASIC_FIELDS = [
  { key: 'duration',      label: 'Duration',      type: 'number' },
  { key: 'protocol_type', label: 'Protocol',      type: 'select', options: ['tcp','udp','icmp'] },
  { key: 'service',       label: 'Service',       type: 'select', options: ['http','ftp','smtp','ssh','private','other'] },
  { key: 'flag',          label: 'Flag',          type: 'select', options: ['SF','S0','REJ','RSTO','SH','RSTR','S1','S2','S3','OTH','RSTOS0'] },
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

const KDD_ADVANCED_FIELDS = [
  { key: 'land',                label: 'Land',               type: 'number', group: 'Content' },
  { key: 'wrong_fragment',      label: 'Wrong Fragment',     type: 'number', group: 'Content' },
  { key: 'urgent',              label: 'Urgent',             type: 'number', group: 'Content' },
  { key: 'hot',                 label: 'Hot',                type: 'number', group: 'Content' },
  { key: 'num_failed_logins',   label: 'Num Failed Logins',  type: 'number', group: 'Content' },
  { key: 'num_compromised',     label: 'Num Compromised',    type: 'number', group: 'Content' },
  { key: 'root_shell',          label: 'Root Shell',         type: 'number', group: 'Content' },
  { key: 'su_attempted',        label: 'SU Attempted',       type: 'number', group: 'Content' },
  { key: 'num_root',            label: 'Num Root',           type: 'number', group: 'Content' },
  { key: 'num_file_creations',  label: 'Num File Creations', type: 'number', group: 'Content' },
  { key: 'num_shells',          label: 'Num Shells',         type: 'number', group: 'Content' },
  { key: 'num_access_files',    label: 'Num Access Files',   type: 'number', group: 'Content' },
  { key: 'is_host_login',       label: 'Is Host Login',      type: 'number', group: 'Content' },
  { key: 'is_guest_login',      label: 'Is Guest Login',     type: 'number', group: 'Content' },
  { key: 'srv_serror_rate',     label: 'Srv SError Rate',    type: 'number', group: 'Traffic' },
  { key: 'srv_rerror_rate',     label: 'Srv RError Rate',    type: 'number', group: 'Traffic' },
  { key: 'srv_diff_host_rate',  label: 'Srv Diff Host Rate', type: 'number', group: 'Traffic' },
  { key: 'dst_host_count',               label: 'Dst Host Count',         type: 'number', group: 'Dst Host' },
  { key: 'dst_host_srv_count',           label: 'Dst Host Srv Count',     type: 'number', group: 'Dst Host' },
  { key: 'dst_host_same_srv_rate',       label: 'Dst Same Srv Rate',      type: 'number', group: 'Dst Host' },
  { key: 'dst_host_diff_srv_rate',       label: 'Dst Diff Srv Rate',      type: 'number', group: 'Dst Host' },
  { key: 'dst_host_same_src_port_rate',  label: 'Dst Same Src Port Rate', type: 'number', group: 'Dst Host' },
  { key: 'dst_host_srv_diff_host_rate',  label: 'Dst Srv Diff Host Rate', type: 'number', group: 'Dst Host' },
  { key: 'dst_host_serror_rate',         label: 'Dst SError Rate',        type: 'number', group: 'Dst Host' },
  { key: 'dst_host_srv_serror_rate',     label: 'Dst Srv SError Rate',    type: 'number', group: 'Dst Host' },
  { key: 'dst_host_rerror_rate',         label: 'Dst RError Rate',        type: 'number', group: 'Dst Host' },
  { key: 'dst_host_srv_rerror_rate',     label: 'Dst Srv RError Rate',    type: 'number', group: 'Dst Host' },
]

// ── CICIDS Field groups (first 20 shown by default, rest collapsible) ────────
const CICIDS_BASIC_KEYS = [
  'Flow Duration', 'Total Fwd Packets', 'Total Backward Packets',
  'Total Length of Fwd Packets', 'Total Length of Bwd Packets',
  'Flow Bytes/s', 'Flow Packets/s', 'SYN Flag Count', 'ACK Flag Count',
  'Fwd Packet Length Mean', 'Bwd Packet Length Mean', 'Packet Length Mean',
  'Init_Win_bytes_forward', 'Init_Win_bytes_backward',
  'Fwd IAT Mean', 'Bwd IAT Mean', 'Active Mean', 'Idle Mean',
  'Fwd Packets/s', 'Bwd Packets/s',
]
const CICIDS_ADVANCED_KEYS = Object.keys(defaultFormCICIDS).filter(
  k => !CICIDS_BASIC_KEYS.includes(k)
)

const inputStyle = {
  background: '#0d0d0d', border: '1px solid #1f1f1f',
  borderRadius: 7, color: '#e2e2e2', fontSize: 12,
  padding: '7px 10px', width: '100%', outline: 'none',
  fontFamily: 'Inter, sans-serif', boxSizing: 'border-box',
}
const labelStyle = {
  color: '#555', fontSize: 10, display: 'block',
  marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em',
}

function FieldInput({ fieldKey, value, onChange, options }) {
  return (
    <div>
      <label style={labelStyle}>{fieldKey}</label>
      {options ? (
        <select style={inputStyle} value={value} onChange={e => onChange(fieldKey, e.target.value)}>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input style={inputStyle} type="number" step="any" value={value}
          onChange={e => onChange(fieldKey, parseFloat(e.target.value) || 0)} />
      )}
    </div>
  )
}

// Legacy KDD field shape wrapper
function KddFieldInput({ field, value, onChange }) {
  return (
    <FieldInput
      fieldKey={field.label}
      value={value}
      onChange={(_, v) => onChange(field.key, v)}
      options={field.options}
    />
  )
}

const MAX_HISTORY = 8

export default function Predict() {
  useEffect(() => { document.title = 'NIDS · Predict' }, [])

  const { activeModel } = useModel()
  const isCicids = activeModel === 'cicids'

  const defaultForm = isCicids ? defaultFormCICIDS : defaultFormKDD
  const SAMPLES     = isCicids ? CICIDS_SAMPLES    : KDD_SAMPLES

  const [form, setForm]             = useState(defaultForm)
  const [result, setResult]         = useState(null)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState(null)
  const [showAdvanced, setShowAdv]  = useState(false)
  const [history, setHistory]       = useState([])

  // Reset form when model switches
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm(isCicids ? defaultFormCICIDS : defaultFormKDD)
    setResult(null)
    setError(null)
    setShowAdv(false)
  }, [activeModel]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError(null); setResult(null)
    try {
      const res = await predict(form, activeModel)
      const r = res.data
      setResult(r)
      setHistory(prev => [{
        id:         r.prediction_id,
        prediction: r.prediction,
        confidence: r.confidence,
        ts:         new Date().toLocaleTimeString(),
        model:      activeModel,
        form:       { ...form },
      }, ...prev].slice(0, MAX_HISTORY))
    } catch {
      setError('Backend not connected. Start the FastAPI server.')
    } finally {
      setLoading(false)
    }
  }

  const resultColor = result ? getLabelColor(result.prediction) : '#e2e2e2'

  // KDD: group advanced fields by group
  const kddAdvancedGroups = KDD_ADVANCED_FIELDS.reduce((acc, f) => {
    if (!acc[f.group]) acc[f.group] = []
    acc[f.group].push(f)
    return acc
  }, {})

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}>

      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: '#f0f0f0' }}>Predict</h1>
          <span style={{
            fontSize: 10, fontWeight: 700, borderRadius: 4, padding: '2px 8px',
            background: isCicids ? 'rgba(167,139,250,0.15)' : 'rgba(59,130,246,0.15)',
            color:      isCicids ? '#a78bfa' : '#3b82f6',
            border:     `1px solid ${isCicids ? '#a78bfa30' : '#3b82f630'}`,
          }}>
            <Database size={9} style={{ display: 'inline', marginRight: 4 }} />
            {isCicids ? 'CICIDS2017' : 'NSL-KDD'}
          </span>
        </div>
        <p style={{ color: '#555', fontSize: 13, marginTop: 3 }}>
          Enter network flow features to classify attack type
          {isCicids && (
            <span style={{ color: '#a78bfa', marginLeft: 6 }}>
              · CICIDS2017 model active — 69 features (change in Settings)
            </span>
          )}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* ── Form card ── */}
        <div style={{ background: '#161616', border: '1px solid #1f1f1f', borderRadius: 10, padding: 22 }}>

          {/* Quick fill */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: '#555', marginBottom: 8 }}>Quick fill with sample data:</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {Object.entries(SAMPLES).map(([key, s]) => (
                <motion.button key={key}
                  whileHover={{ borderColor: s.color, color: s.color }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { setForm(s.values); setResult(null); setError(null) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    background: 'transparent', border: '1px solid #2a2a2a',
                    borderRadius: 6, padding: '5px 12px',
                    color: '#555', fontSize: 11, cursor: 'pointer',
                    transition: 'all 0.15s', fontFamily: 'Inter, sans-serif',
                  }}
                >
                  <Zap size={10} />{s.label}
                </motion.button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {isCicids ? (
              /* ── CICIDS form ── */
              <>
                <div style={{ fontSize: 10, color: '#444', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                  Basic Features
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                  {CICIDS_BASIC_KEYS.map(k => (
                    <FieldInput key={k} fieldKey={k} value={form[k] ?? 0} onChange={handleChange} />
                  ))}
                </div>

                <motion.button type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowAdv(v => !v)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: 'transparent', border: '1px solid #2a2a2a',
                    borderRadius: 7, padding: '7px 14px', cursor: 'pointer',
                    color: '#555', fontSize: 12, width: '100%',
                    justifyContent: 'center', marginBottom: 14,
                    fontFamily: 'Inter, sans-serif', transition: 'all 0.15s',
                  }}
                >
                  {showAdvanced ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  {showAdvanced ? 'Hide' : 'Show'} advanced ({CICIDS_ADVANCED_KEYS.length} more features)
                </motion.button>

                <AnimatePresence>
                  {showAdvanced && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{ overflow: 'hidden', marginBottom: 14 }}
                    >
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        {CICIDS_ADVANCED_KEYS.map(k => (
                          <FieldInput key={k} fieldKey={k} value={form[k] ?? 0} onChange={handleChange} />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            ) : (
              /* ── KDD form ── */
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                  {KDD_BASIC_FIELDS.map(f => (
                    <KddFieldInput key={f.key} field={f} value={form[f.key]} onChange={handleChange} />
                  ))}
                </div>

                <motion.button type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowAdv(v => !v)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: 'transparent', border: '1px solid #2a2a2a',
                    borderRadius: 7, padding: '7px 14px', cursor: 'pointer',
                    color: '#555', fontSize: 12, width: '100%',
                    justifyContent: 'center', marginBottom: 14,
                    fontFamily: 'Inter, sans-serif', transition: 'all 0.15s',
                  }}
                >
                  {showAdvanced ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  {showAdvanced ? 'Hide' : 'Show'} advanced features ({KDD_ADVANCED_FIELDS.length} more)
                </motion.button>

                <AnimatePresence>
                  {showAdvanced && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{ overflow: 'hidden', marginBottom: 14 }}
                    >
                      {Object.entries(kddAdvancedGroups).map(([groupName, fields]) => (
                        <div key={groupName} style={{ marginBottom: 14 }}>
                          <div style={{ fontSize: 10, color: '#444', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, paddingBottom: 4, borderBottom: '1px solid #1f1f1f' }}>
                            {groupName}
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            {fields.map(f => (
                              <KddFieldInput key={f.key} field={f} value={form[f.key]} onChange={handleChange} />
                            ))}
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}

            <UIverseButton type="submit" disabled={loading}>
              <Crosshair size={15} />
              {loading ? 'Analyzing...' : 'Analyze Traffic'}
            </UIverseButton>
          </form>
        </div>

        {/* ── Right column: result + history ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Result card */}
          <div style={{ background: '#161616', border: '1px solid #1f1f1f', borderRadius: 10, padding: 22 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#ccc', marginBottom: 20 }}>Result</div>

            <AnimatePresence mode="wait">
              {loading && (
                <motion.div key="loading"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', gap: 24 }}
                >
                  <UIverseLoader text="Analyzing..." />
                  <p style={{ fontSize: 11, color: '#444' }}>
                    Running {isCicids ? 'CICIDS2017' : 'NSL-KDD'} XGBoost classifier...
                  </p>
                </motion.div>
              )}

              {error && !loading && (
                <motion.div key="err" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '14px 16px' }}>
                    <p style={{ color: '#ef4444', fontSize: 13, margin: 0 }}>{error}</p>
                    <p style={{ color: '#555', fontSize: 11, marginTop: 6 }}>
                      Run: <code style={{ color: '#888', fontFamily: 'monospace' }}>cd backend && uvicorn main:app --reload</code>
                    </p>
                  </div>
                </motion.div>
              )}

              {result && !loading && (
                <motion.div key="result"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
                >
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
                    <div style={{ marginTop: 12, height: 4, background: '#1f1f1f', borderRadius: 4 }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(result.confidence * 100).toFixed(1)}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                        style={{ height: '100%', background: resultColor, borderRadius: 4 }}
                      />
                    </div>
                  </div>

                  {result.top_features && (
                    <div>
                      <p style={{ color: '#555', fontSize: 11, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Top contributing features</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {result.top_features.map(([feat, val]) => (
                          <div key={feat} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ color: '#555', fontSize: 11, width: 160, flexShrink: 0, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{feat}</span>
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

          {/* Session history */}
          {history.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              style={{ background: '#161616', border: '1px solid #1f1f1f', borderRadius: 10, padding: 18 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
                <Clock size={12} color="#555" />
                <span style={{ fontSize: 12, fontWeight: 500, color: '#ccc' }}>Session History</span>
                <span style={{ fontSize: 11, color: '#333', marginLeft: 'auto' }}>{history.length} predictions</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {history.map((h, i) => (
                  <motion.div
                    key={h.id}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => { setForm(h.form); setResult(null); setError(null) }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 10px', borderRadius: 7, cursor: 'pointer',
                      border: '1px solid #1f1f1f', transition: 'background 0.12s',
                    }}
                    whileHover={{ background: '#1a1a1a' }}
                  >
                    <Badge label={h.prediction} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: getLabelColor(h.prediction), fontVariantNumeric: 'tabular-nums' }}>
                      {(h.confidence * 100).toFixed(1)}%
                    </span>
                    <span style={{ fontSize: 10, color: '#333', marginLeft: 'auto', fontFamily: 'monospace' }}>{h.ts}</span>
                    {h.model && (
                      <span style={{ fontSize: 9, color: '#444', background: '#1a1a1a', borderRadius: 3, padding: '1px 5px' }}>
                        {h.model.toUpperCase()}
                      </span>
                    )}
                    <span style={{ fontSize: 10, color: '#444' }}>↩ re-use</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
