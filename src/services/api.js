import axios from 'axios'

export const TOKEN_KEY = 'pm_token'
export const USER_KEY = 'pm_user'
export const REFRESH_KEY = 'pm_refresh'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5080/api',
  headers: { Accept: 'application/json' },
  timeout: 20000
})

// Manejador para respuestas 401 (lo registra main.js para limpiar la sesión y redirigir a /login).
let onUnauthorized = null
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn
}

// Se llama cuando /auth/refresh entrega un par nuevo (lo registra el store de auth).
let onSesionRenovada = null
export function setSesionRenovadaHandler(fn) {
  onSesionRenovada = fn
}

// Renovación de la sesión con el refresh token (CONTRATO 5.1).
// Si varias peticiones reciben 401 a la vez, todas esperan la MISMA promesa (cola): solo se hace un refresh.
let refreshEnCurso = null
function renovarSesion() {
  if (refreshEnCurso) return refreshEnCurso
  let refreshToken = null
  try { refreshToken = localStorage.getItem(REFRESH_KEY) } catch { refreshToken = null }
  if (!refreshToken) return Promise.resolve(null)

  // axios "pelón" (sin interceptores) para no entrar en un ciclo de 401 → refresh → 401
  refreshEnCurso = axios
    .post(`${api.defaults.baseURL}/auth/refresh`, { refreshToken }, { headers: { Accept: 'application/json' }, timeout: 20000 })
    .then(({ data }) => {
      try {
        localStorage.setItem(TOKEN_KEY, data.token)
        localStorage.setItem(REFRESH_KEY, data.refreshToken)
      } catch { /* almacenamiento no disponible */ }
      if (typeof onSesionRenovada === 'function') onSesionRenovada(data)
      return data.token
    })
    .catch(() => null)
    .finally(() => { refreshEnCurso = null })
  return refreshEnCurso
}

function esRutaDeSesion(url = '') {
  return /\/auth\/(login|register|refresh|logout)/.test(url)
}

api.interceptors.request.use((config) => {
  let token = null
  try { token = localStorage.getItem(TOKEN_KEY) } catch { token = null }
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const status = error?.response?.status
    const config = error?.config
    const enviabaToken = !!config?.headers?.Authorization
    // 401 en una petición autenticada: se intenta UNA vez renovar con el refresh token y reintentar.
    if (status === 401 && enviabaToken && config && !config._reintento && !esRutaDeSesion(config.url)) {
      config._reintento = true
      const nuevoToken = await renovarSesion()
      if (nuevoToken) {
        config.headers.Authorization = `Bearer ${nuevoToken}`
        return api(config)
      }
    }
    // Solo se considera "sesión expirada" si la petición iba autenticada
    // (un 401 de /auth/login por credenciales malas no debe redirigir).
    if (status === 401 && enviabaToken && typeof onUnauthorized === 'function') {
      onUnauthorized(error)
    }
    return Promise.reject(error)
  }
)

/**
 * Convierte un error de axios / de la API ({ message, errors }) en un texto legible en español.
 */
export function mensajeError(err, porDefecto = 'Ocurrió un error inesperado. Intenta de nuevo.') {
  if (!err) return porDefecto
  if (typeof err === 'string') return err
  const res = err.response
  if (!res) {
    if (err.code === 'ECONNABORTED') return 'El servidor tardó demasiado en responder. Intenta de nuevo.'
    if (err.message === 'Network Error' || err.code === 'ERR_NETWORK') {
      return 'No se pudo conectar con el servidor. Verifica tu conexión o que la API esté en ejecución.'
    }
    return err.message || porDefecto
  }
  const data = res.data
  if (data && typeof data === 'object') {
    if (data.errors && typeof data.errors === 'object') {
      const msgs = Object.values(data.errors).flat().filter(Boolean)
      if (msgs.length) return msgs.join(' ')
    }
    if (data.message) return data.message
    if (data.title) return data.title
  }
  if (typeof data === 'string' && data.trim() && data.length < 300) return data
  switch (res.status) {
    case 400: return 'La solicitud no es válida.'
    case 401: return 'Tu sesión no es válida. Inicia sesión de nuevo.'
    case 403: return 'No tienes permiso para realizar esta acción.'
    case 404: return 'No se encontró el recurso solicitado.'
    case 422: return 'Revisa los datos del formulario.'
    case 429: return 'Demasiados intentos. Espera un momento e intenta de nuevo.'
    case 500: return 'Error interno del servidor.'
    default: return porDefecto
  }
}

export default api
