import axios from 'axios'

// Read saved API endpoint from localStorage, fallback to localhost
function getBaseURL() {
  return localStorage.getItem('nids-api-endpoint') || 'http://localhost:8000'
}

// Create axios instance — baseURL is dynamic per request
const api = axios.create({
  headers: { 'Content-Type': 'application/json' },
  timeout: 5000,
})

// Interceptor — always uses the latest saved endpoint
api.interceptors.request.use(config => {
  config.baseURL = getBaseURL()
  return config
})

export const predict       = (data)      => api.post('/predict', data)
export const batchPredict  = (formData)  => api.post('/predict/batch', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
})
export const getStats      = ()          => api.get('/stats')
export const getTraffic    = (range)     => api.get('/stats/traffic', { params: { range } })
export const getModelInfo  = ()          => api.get('/model-info')
export const getAlerts     = (params)    => api.get('/alerts', { params })
export const getAlertCount = ()          => api.get('/alerts/count')
export const getReports    = ()          => api.get('/reports/summary')
export const getGlobeStats = ()          => api.get('/globe-stats')
export const checkHealth   = ()          => api.get('/health')

export default api
