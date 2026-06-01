import axios from 'axios'

// Build-time env var. Set VITE_API_URL to your deployed backend URL in production.
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({ baseURL })

// Normalise FastAPI error responses into a readable message.
export function errMessage(error) {
  const d = error?.response?.data?.detail
  if (Array.isArray(d)) return d.map((e) => e.msg).join(', ')
  if (typeof d === 'string') return d
  return error?.message || 'Something went wrong.'
}

export default api
