import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
})

export const predict      = (data)    => api.post('/predict', data)
export const batchPredict = (formData) => api.post('/batch-predict', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
})
export const getStats     = ()        => api.get('/stats')
export const getModelInfo = ()        => api.get('/model-info')

export default api
