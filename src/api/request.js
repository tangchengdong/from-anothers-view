import axios from 'axios'
import { useUserStore } from '../store/useUserStore'

const request = axios.create({
  baseURL: 'http://localhost:8000/api',
  timeout: 30000,
})

request.interceptors.request.use(
  (config) => {
    const token = useUserStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

request.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      useUserStore.getState().logout()
    }
    return Promise.reject(error)
  }
)

export default request
