import { defineStore } from 'pinia'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'

// Llamadas evento + referencia ya enviadas en esta sesión. Así no se cuentan dos veces
// (el servidor también lo evita, esto solo ahorra peticiones).
const enviados = new Set()

// Agrega a la cola las insignias nuevas que aún no estén en ella.
function encolar(cola, nuevas) {
  for (const n of Array.isArray(nuevas) ? nuevas : []) {
    if (!cola.some((c) => c.codigo === n.codigo)) cola.push(n)
  }
}

export const useInsigniasStore = defineStore('insignias', {
  state: () => ({
    insignias: [],
    cargando: false,
    cola: [] // insignias ganadas que todavía no se le han mostrado al usuario
  }),
  actions: {
    // GET /insignias: trae el catálogo con el avance del usuario y encola las que acaba de ganar.
    async cargar() {
      if (!useAuthStore().isAuth) return
      this.cargando = true
      try {
        const { data } = await api.get('/insignias')
        this.insignias = Array.isArray(data?.insignias) ? data.insignias : []
        encolar(this.cola, data?.nuevas)
      } catch {
        // Silencioso: si falla, la siguiente carga lo vuelve a intentar.
      } finally {
        this.cargando = false
      }
    },

    // POST /insignias/evento: VER_PLANTA, VER_ESTADO o LEER_BLOG. Los errores no se muestran.
    async evento(evento, referencia) {
      if (!useAuthStore().isAuth || referencia == null) return
      const clave = `${evento}:${referencia}`
      if (enviados.has(clave)) return
      enviados.add(clave)
      try {
        const { data } = await api.post('/insignias/evento', { evento, referencia: String(referencia) })
        encolar(this.cola, data?.nuevas)
      } catch {
        enviados.delete(clave) // si falló, se puede reintentar más tarde
      }
    },

    // Saca la siguiente insignia de la cola (o null si no hay).
    siguiente() {
      return this.cola.shift() || null
    },

    // Al cerrar sesión: borra todo lo del usuario anterior.
    limpiar() {
      this.insignias = []
      this.cola = []
      this.cargando = false
      enviados.clear()
    }
  }
})
