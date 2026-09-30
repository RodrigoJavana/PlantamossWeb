import { reactive } from 'vue'

const estado = reactive({ toasts: [] })
let siguienteId = 1

function quitar(id) {
  const i = estado.toasts.findIndex((t) => t.id === id)
  if (i !== -1) estado.toasts.splice(i, 1)
}

function agregar(tipo, mensaje, duracion = 4000) {
  const id = siguienteId++
  estado.toasts.push({ id, tipo, mensaje: String(mensaje ?? '') })
  if (estado.toasts.length > 5) estado.toasts.shift()
  if (duracion > 0) setTimeout(() => quitar(id), duracion)
  return id
}

export function useToast() {
  return {
    toasts: estado.toasts,
    success: (msg, ms) => agregar('success', msg, ms),
    error: (msg, ms) => agregar('error', msg, ms),
    info: (msg, ms) => agregar('info', msg, ms),
    remove: quitar
  }
}

export default useToast
