import axios from 'axios'

// Read saved API endpoint from localStorage, fallback to localhost
function getBaseURL() {
  return localStorage.getItem('nids-api-endpoint') || 'http://localhost:8000'
}

const api = axios.create({
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,  // 10s default — overridden per-call for slow operations
})

api.interceptors.request.use(config => {
  config.baseURL = getBaseURL()
  return config
})

// ── Prediction endpoints ───────────────────────────────────────────────────
export const predict = (data, model = 'kdd') =>
  api.post(`/predict?model=${model}`, data)

export const batchPredict = (formData, model = 'kdd') =>
  api.post(`/predict/batch?model=${model}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000,  // 2 minutes — large CSVs can take a while
  })

export const getModels = () => api.get('/predict/models')

// ── Stats & model info ─────────────────────────────────────────────────────
export const getStats     = (model = 'kdd') => api.get('/stats',         { params: { model } })
export const getTraffic   = (range, model = 'kdd') => api.get('/stats/traffic', { params: { range, model } })
export const getModelInfo = (model = 'kdd') => api.get('/model-info',    { params: { model } })
export const getGlobeStats= (model = 'kdd') => api.get('/globe-stats',   { params: { model } })

// ── Alerts & reports ───────────────────────────────────────────────────────
export const getAlerts     = (params)        => api.get('/alerts',          { params })
export const getAlertCount = ()              => api.get('/alerts/count')
export const getReports    = (model = 'kdd') => api.get('/reports/summary', { params: { model } })

// ── Health ─────────────────────────────────────────────────────────────────
export const checkHealth = () => api.get('/health')

// ── Live simulation ────────────────────────────────────────────────────────
export const startSimulation = (model = 'kdd', interval = 5, batchSize = 5) =>
  api.post('/simulate/start', null, {
    params: { model, interval, batch_size: batchSize },
  })

export const stopSimulation = () => api.post('/simulate/stop')
export const getSimStatus   = () => api.get('/simulate/status')

export default api
