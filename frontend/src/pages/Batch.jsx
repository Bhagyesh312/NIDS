import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Download, Loader, FileText } from 'lucide-react'
import Badge from '../components/Badge'
import { CATEGORY_COLORS, CATEGORIES } from '../lib/colors'
import { batchPredict } from '../lib/api'

export default function Batch() {
  useEffect(() => { document.title = 'NIDS · Batch Predict' }, [])
  const [file, setFile]         = useState(null)
  const [results, setResults]   = useState(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef()

  const handleFile = (f) => {
    if (f?.name.endsWith('.csv')) { setFile(f); setError(null) }
    else setError('Please upload a CSV file.')
  }

  const handleSubmit = async () => {
    if (!file) return
    setLoading(true); setError(null); setResults(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await batchPredict(fd)
      setResults(res.data.results)
    } catch {
      setError('Backend not connected. Start the FastAPI server.')
    } finally {
      setLoading(false)
    }
  }

  const downloadCSV = () => {
    const header = 'index,prediction,confidence\n'
    const rows = results.map((r, i) => `${i+1},${r.prediction},${(r.confidence*100).toFixed(1)}%`).join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = 'nids_predictions.csv'; a.click()
  }

  // Count per category
  const categoryCounts = results
    ? CATEGORIES.reduce((acc, cat) => {
        acc[cat] = results.filter(r => r.prediction === cat).length
        return acc
      }, {})
    : null

  const attacks = results?.filter(r => r.prediction !== 'Normal').length || 0

  const card = { background: '#161616', border: '1px solid #1f1f1f', borderRadius: 8, padding: '18px 20px' }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}>

      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: '#f0f0f0' }}>Batch Predict</h1>
        <p style={{ color: '#555', fontSize: 13, marginTop: 3 }}>Upload a CSV file to classify multiple network flows at once</p>
      </div>

      {/* Upload area */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]) }}
        onClick={() => inputRef.current.click()}
        style={{
          background: dragging ? 'rgba(59,130,246,0.05)' : '#161616',
          border: `1px dashed ${dragging ? '#3b82f6' : '#2a2a2a'}`,
          borderRadius: 10, padding: 40, cursor: 'pointer', textAlign: 'center',
          transition: 'all 0.2s', marginBottom: 12,
        }}
      >
        <input ref={inputRef} type="file" accept=".csv" style={{ display: 'none' }}
          onChange={e => handleFile(e.target.files[0])} />
        <Upload size={26} color={dragging ? '#3b82f6' : '#444'} style={{ margin: '0 auto 10px' }} />
        {file ? (
          <p style={{ color: '#ccc', fontSize: 14, fontWeight: 500 }}>{file.name}</p>
        ) : (
          <>
            <p style={{ color: '#888', fontSize: 13 }}>Drop your CSV here or click to browse</p>
            <p style={{ color: '#444', fontSize: 11, marginTop: 5 }}>Must have the same columns as KDD dataset</p>
          </>
        )}
      </div>

      {error && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>{error}</p>}

      {file && (
        <motion.button
          whileHover={{ background: '#2563eb' }}
          whileTap={{ scale: 0.97 }}
          onClick={handleSubmit} disabled={loading}
          style={{
            background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8,
            padding: '10px 28px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8,
            opacity: loading ? 0.7 : 1, marginBottom: 16,
            fontFamily: 'Inter, sans-serif', transition: 'background 0.15s',
          }}>
          {loading ? <Loader size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <FileText size={15} />}
          {loading ? 'Processing...' : 'Run Predictions'}
        </motion.button>
      )}

      {/* Results */}
      <AnimatePresence>
        {results && (
          <motion.div key="results" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Category summary pills */}
            <motion.div style={{ ...card, padding: '14px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#ccc' }}>
                  Results — <span style={{ color: CATEGORY_COLORS.DoS }}>{attacks} attacks</span> out of <span style={{ color: '#ccc' }}>{results.length}</span> flows
                </span>
                <motion.button
                  whileHover={{ borderColor: '#3b82f6', color: '#3b82f6' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={downloadCSV}
                  style={{
                    background: 'transparent', border: '1px solid #2a2a2a',
                    color: '#666', borderRadius: 6, padding: '5px 12px',
                    fontSize: 12, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 5,
                    transition: 'all 0.15s', fontFamily: 'Inter, sans-serif',
                  }}>
                  <Download size={12} /> Download CSV
                </motion.button>
              </div>

              {/* Category breakdown pills */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {CATEGORIES.map((cat, i) => {
                  const count = categoryCounts[cat] || 0
                  if (count === 0) return null
                  const pct = ((count / results.length) * 100).toFixed(1)
                  return (
                    <motion.div
                      key={cat}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.06 }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        background: `${CATEGORY_COLORS[cat]}10`,
                        border: `1px solid ${CATEGORY_COLORS[cat]}30`,
                        borderRadius: 8, padding: '8px 14px',
                      }}
                    >
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: CATEGORY_COLORS[cat], flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: '#888' }}>{cat}</span>
                      <span style={{ fontSize: 16, fontWeight: 700, color: CATEGORY_COLORS[cat], fontVariantNumeric: 'tabular-nums' }}>{count}</span>
                      <span style={{ fontSize: 10, color: '#444' }}>{pct}%</span>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>

            {/* Results table */}
            <div style={{ background: '#161616', border: '1px solid #1f1f1f', borderRadius: 8, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1f1f1f' }}>
                    {['#', 'Prediction', 'Confidence'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: '#333', fontSize: 11, fontWeight: 500 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.slice(0, 50).map((r, i) => (
                    <motion.tr
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      style={{ borderTop: '1px solid #1a1a1a' }}
                    >
                      <td style={{ padding: '9px 16px', color: '#333', fontSize: 12 }}>{i + 1}</td>
                      <td style={{ padding: '9px 16px' }}><Badge label={r.prediction} /></td>
                      <td style={{ padding: '9px 16px', color: '#ccc', fontSize: 12, fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                        {(r.confidence * 100).toFixed(1)}%
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
              {results.length > 50 && (
                <p style={{ padding: '10px 16px', color: '#444', fontSize: 11 }}>
                  Showing first 50 of {results.length} rows — download CSV for full results.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
