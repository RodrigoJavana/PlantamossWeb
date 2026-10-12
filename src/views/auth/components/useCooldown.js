import { ref, computed, onBeforeUnmount } from 'vue'

/**
 * Cuenta regresiva simple para botones de "reenviar".
 * const { restante, activo, iniciar } = useCooldown(60)
 */
export function useCooldown(segundos = 60) {
  const restante = ref(0)
  let timer = null

  function detener() {
    if (timer) clearInterval(timer)
    timer = null
  }

  function iniciar(s = segundos) {
    detener()
    restante.value = s
    timer = setInterval(() => {
      restante.value -= 1
      if (restante.value <= 0) {
        restante.value = 0
        detener()
      }
    }, 1000)
  }

  onBeforeUnmount(detener)

  return { restante, activo: computed(() => restante.value > 0), iniciar }
}
