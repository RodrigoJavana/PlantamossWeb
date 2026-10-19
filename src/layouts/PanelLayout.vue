<script setup>
/**
 * Layout del panel de control (CONTRATO §4.1): sidebar + barra superior + <router-view /> con transición.
 *
 * - Escritorio (≥1024px): sidebar fija; la hamburguesa alterna el modo íconos (~72px).
 *   El estado se recuerda en localStorage `pm_sidebar` ('1' = colapsado, '0' = expandido).
 * - Móvil/tablet (<1024px): la sidebar es un drawer con backdrop; se cierra al navegar, con ESC o al tocar fuera.
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import PanelSidebar from '@/components/panel/PanelSidebar.vue'
import PanelTopbar from '@/components/panel/PanelTopbar.vue'
import '@/components/panel/panel.css'

const CLAVE = 'pm_sidebar'
const QUERY_MOVIL = '(max-width: 1023.98px)'

const route = useRoute()

function leerColapsado() {
  try {
    return localStorage.getItem(CLAVE) === '1'
  } catch {
    return false
  }
}

const colapsado = ref(leerColapsado())
const drawerAbierto = ref(false)
const mq = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(QUERY_MOVIL) : null
const movil = ref(mq ? mq.matches : false)

watch(colapsado, (v) => {
  try {
    localStorage.setItem(CLAVE, v ? '1' : '0')
  } catch {
    /* almacenamiento no disponible */
  }
})

const menuExpandido = computed(() => (movil.value ? drawerAbierto.value : !colapsado.value))

function alternarMenu() {
  if (movil.value) drawerAbierto.value = !drawerAbierto.value
  else colapsado.value = !colapsado.value
}
function cerrarDrawer() {
  drawerAbierto.value = false
}
function expandir() {
  if (!movil.value) colapsado.value = false
}

function alCambiarMedia(e) {
  movil.value = e.matches
  if (!e.matches) drawerAbierto.value = false
}

function teclaGlobal(e) {
  if (e.key === 'Escape' && movil.value && drawerAbierto.value) cerrarDrawer()
}

// Se cierra el drawer al navegar.
watch(() => route.fullPath, cerrarDrawer)

// Bloquea el scroll del body con el drawer abierto.
watch(
  () => movil.value && drawerAbierto.value,
  (bloquear) => document.body.classList.toggle('pm-drawer-abierto', bloquear)
)

onMounted(() => {
  if (mq) {
    if (mq.addEventListener) mq.addEventListener('change', alCambiarMedia)
    else mq.addListener(alCambiarMedia)
  }
  document.addEventListener('keydown', teclaGlobal)
})
onBeforeUnmount(() => {
  if (mq) {
    if (mq.removeEventListener) mq.removeEventListener('change', alCambiarMedia)
    else mq.removeListener(alCambiarMedia)
  }
  document.removeEventListener('keydown', teclaGlobal)
  document.body.classList.remove('pm-drawer-abierto')
})
</script>

<template>
  <div class="pm-panel" :class="{ 'pm-panel--iconos': colapsado && !movil, 'pm-panel--movil': movil }">
    <PanelSidebar
      :colapsado="colapsado"
      :movil="movil"
      :abierto="drawerAbierto"
      @cerrar="cerrarDrawer"
      @expandir="expandir"
    />

    <Transition name="pm-backdrop">
      <div v-if="movil && drawerAbierto" class="pm-backdrop" aria-hidden="true" @click="cerrarDrawer"></div>
    </Transition>

    <div class="pm-columna">
      <PanelTopbar :menu-expandido="menuExpandido" @toggle-menu="alternarMenu" />

      <div class="pm-contenido">
        <RouterView v-slot="{ Component, route: r }">
          <Transition name="pm-vista" mode="out-in">
            <component :is="Component" :key="r.fullPath" />
          </Transition>
        </RouterView>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pm-panel {
  display: flex;
  align-items: flex-start;
  min-height: 100vh;
  min-height: 100dvh;
  width: 100%;
  background: #f6f8f7;
  color: #1f2d26;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}
.pm-columna {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}
.pm-contenido {
  flex: 1 1 auto;
  width: 100%;
  max-width: 1400px;
  box-sizing: border-box;
  margin: 0 auto;
  padding: 26px 28px 40px;
}

.pm-backdrop {
  position: fixed;
  inset: 0;
  z-index: 55;
  background: rgba(16, 32, 22, 0.42);
  backdrop-filter: blur(2px);
}
.pm-backdrop-enter-active,
.pm-backdrop-leave-active { transition: opacity 0.24s ease; }
.pm-backdrop-enter-from,
.pm-backdrop-leave-to { opacity: 0; }

@media (max-width: 1023.98px) {
  .pm-contenido { padding: 20px 18px 32px; }
}
@media (max-width: 479.98px) {
  .pm-contenido { padding: 16px 12px 28px; }
}
</style>
