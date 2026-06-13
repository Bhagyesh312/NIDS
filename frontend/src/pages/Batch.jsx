import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Download, Loader, FileText } from 'lucide-react'
import Badge from '../components/Badge'
import { batchPredict } from '../lib/api'

export default function Batch() {
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

  const attacks = results?.filter(r => r.prediction !== 'Normal').length || 0

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
      className="space-y-6">

      <div>
        <h1 style={{ fontSize: 22, fontWeight: 600 }}>Batch Predict</h1>
        <p style={{ color: '#888', fontSize: 13, marginTop: 4 }}>Upload a CSV file to classify multiple network flows at once</p>
      </div>

      {/* Upload area */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]) }}
        onClick={() => inputRef.current.click()}
        style={{
          background: dragging ? 'rgba(0,102,255,0.05)' : '#111827',
          border: `1px dashed ${dragging ? '#0066FF' : 'rgba(255,255,255,0.12)'}`,
          borderRadius: 12, padding: 40, cursor: 'pointer', textAlign: 'center',
          transition: 'all 0.2s',
        }}
      >
        <input ref={inputRef} type="file" accept=".csv" style={{ display: 'none' }}
          onChange={e => handleFile(e.target.files[0])} />
        <Upload size={28} color={dragging ? '#0066FF' : '#888'} style={{ margin: '0 auto 12px' }} />
        {file ? (
          <p style={{ color: '#F1F1EE', fontSize: 14, fontWeight: 500 }}>{file.name}</p>
        ) : (
          <>
            <p style={{ color: '#F1F1EE', fontSize: 14 }}>Drop your CSV here or click to browse</p>
            <p style={{ color: '#888', fontSize: 12, marginTop: 6 }}>File must have the same columns as KDD dataset</p>
          </>
        )}
      </div>

      {error && <p style={{ color: '#E24B4A', fontSize: 13 }}>{error}</p>}

      {file && (
        <button onClick={handleSubmit} disabled={loading}
          style={{
            background: '#0066FF', color: '#fff', border: 'none', borderRadius: 8,
            padding: '10px 28px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8, opacity: loading ? 0.7 : 1,
          }}>
          {loading ? <Loader size={16} className="animate-spin" /> : <FileText size={16} />}
          {loading ? 'Processing...' : 'Run Predictions'}
        </button>
      )}

      {/* Results */}
      <AnimatePresence>
        {results && (
          <motion.div key="results" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="space-y-4">

            <div className="flex items-center justify-between">
              <p style={{ color: '#888', fontSize: 13 }}>
                <span style={{ color: '#E24B4A', fontWeight: 600 }}>{attacks}</span> attacks detected out of{' '}
                <span style={{ color: '#F1F1EE', fontWeight: 600 }}>{results.length}</span> flows
              </p>
              <button onClick={downloadCSV}
                style={{
                  background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
                  color: '#F1F1EE', borderRadius: 8, padding: '7px 16px', fontSize: 13,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                }}>
                <Download size={14} /> Download CSV
              </button>
            </div>

            <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {['#', 'Prediction', 'Confidence'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#888', fontSize: 12, fontWeight: 500 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.slice(0, 50).map((r, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '10px 16px', color: '#888', fontSize: 13 }}>{i + 1}</td>
                      <td style={{ padding: '10px 16px' }}><Badge label={r.prediction} /></td>
                      <td style={{ padding: '10px 16px', color: '#F1F1EE', fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>
                        {(r.confidence * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {results.length > 50 && (
                <p style={{ padding: '12px 16px', color: '#888', fontSize: 12 }}>
                  Showing first 50 of {results.length} rows. Download CSV for full results.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
