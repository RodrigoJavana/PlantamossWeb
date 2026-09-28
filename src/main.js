import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { setUnauthorizedHandler } from './services/api'
import { useAuthStore } from './stores/auth'
import { useToast } from './composables/useToast'

import './assets/css/base.css'
import './assets/css/catalogo.css'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)

const auth = useAuthStore()
const toast = useToast()

// 401 en una petición autenticada → la sesión ya no es válida.
let avisado = false
setUnauthorizedHandler(() => {
  if (!auth.isAuth) return
  auth.clearSession()
  if (!avisado) {
    avisado = true
    toast.info('Tu sesión expiró. Inicia sesión de nuevo.')
    setTimeout(() => { avisado = false }, 3000)
  }
  const actual = router.currentRoute.value
  if (actual.name !== 'login') {
    router.push({ path: '/login', query: actual.meta?.requiresAuth ? { redirect: actual.fullPath } : {} })
  }
})

async function iniciar() {
  if (auth.isAuth) {
    // Refresca el usuario (rol / verificación) sin bloquear el arranque más de 4 s.
    const limite = new Promise((resolve) => setTimeout(resolve, 4000))
    const me = auth.fetchMe().catch((err) => {
      if (err?.response?.status === 401) auth.clearSession()
    })
    await Promise.race([me, limite])
  }
  app.use(router)
  // Espera la primera navegación para no mostrar un instante el layout público en rutas del panel.
  await router.isReady().catch(() => {})
  app.mount('#app')
}

iniciar()
