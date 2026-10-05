import { defineStore } from 'pinia'
import api, { TOKEN_KEY, USER_KEY, REFRESH_KEY, setSesionRenovadaHandler } from '@/services/api'

function leerUsuario() {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}
function leerToken() {
  try { return localStorage.getItem(TOKEN_KEY) || null } catch { return null }
}
function leerRefresh() {
  try { return localStorage.getItem(REFRESH_KEY) || null } catch { return null }
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: leerToken(),
    refreshToken: leerRefresh(),
    user: leerUsuario()
  }),
  getters: {
    isAuth: (s) => !!s.token,
    rol: (s) => s.user?.role || null,
    isAdmin: (s) => s.user?.role === 'admin',
    isNoticias: (s) => ['noticias', 'admin'].includes(s.user?.role),
    isEditor: (s) => ['editor', 'admin'].includes(s.user?.role),
    emailVerificado: (s) => !!s.user?.emailVerificado
  },
  actions: {
    setSession(token, user, refreshToken = null) {
      this.token = token || null
      this.user = user || null
      this.refreshToken = refreshToken || null
      try {
        if (token) localStorage.setItem(TOKEN_KEY, token)
        else localStorage.removeItem(TOKEN_KEY)
        if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken)
        else localStorage.removeItem(REFRESH_KEY)
        if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
        else localStorage.removeItem(USER_KEY)
      } catch { /* almacenamiento no disponible */ }
    },
    setUser(user) {
      this.user = user || null
      try {
        if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
        else localStorage.removeItem(USER_KEY)
      } catch { /* noop */ }
    },
    clearSession() {
      this.setSession(null, null)
    },
    async login(email, password) {
      const { data } = await api.post('/auth/login', { email, password })
      this.setSession(data.token, data.user, data.refreshToken)
      return data
    },
    async register(payload) {
      const { data } = await api.post('/auth/register', payload)
      this.setSession(data.token, data.user, data.refreshToken)
      return data
    },
    async fetchMe() {
      const { data } = await api.get('/auth/me')
      this.setUser(data)
      return data
    },
    async logout() {
      // Se revoca el refresh token en el servidor (CONTRATO 5.1) y se limpia la sesión local.
      const refreshToken = this.refreshToken
      this.clearSession()
      if (refreshToken) {
        try { await api.post('/auth/logout', { refreshToken }) } catch { /* sin red: la sesión local ya se cerró */ }
      }
    }
  }
})

// Cuando el interceptor renueva la sesión con /auth/refresh, se actualiza el store.
setSesionRenovadaHandler((data) => {
  const auth = useAuthStore()
  auth.setSession(data.token, data.user || auth.user, data.refreshToken)
})
