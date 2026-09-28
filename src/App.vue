<script setup>
import Icono from '@/components/Icono.vue'
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '@/layouts/AppHeader.vue'
import AppFooter from '@/layouts/AppFooter.vue'
import ToastContainer from '@/components/ToastContainer.vue'
import InsigniaGanadaModal from '@/components/insignias/InsigniaGanadaModal.vue'
import { useAuthStore } from '@/stores/auth'
import { useInsigniasStore } from '@/stores/insignias'

const auth = useAuthStore()
const insignias = useInsigniasStore()
const route = useRoute()

// Con sesión: revisa una vez si hay insignias pendientes. Al cerrar sesión: limpia el estado.
watch(
  () => auth.isAuth,
  (hay) => {
    if (hay) insignias.cargar()
    else insignias.limpiar()
  },
  { immediate: true }
)

// Las pantallas del panel de control usan su propio layout (sin header/footer público).
const esPanel = computed(() => route.matched.some((r) => r.meta?.layout === 'panel'))

const mostrarBannerVerificacion = computed(
  () => !esPanel.value && auth.isAuth && auth.user && !auth.emailVerificado && route.name !== 'verificar-correo'
)

// En el panel la clave es fija para no re-montar el layout (sidebar) al cambiar de hija.
const claveVista = computed(() => (esPanel.value ? 'panel' : route.path))
</script>

<template>
  <a href="#contenido" class="saltar-contenido">Saltar al contenido</a>
  <AppHeader v-if="!esPanel" />
  <div v-if="mostrarBannerVerificacion" class="banner-verificar" role="status">
    <div class="contenedor banner-verificar-interior">
      <span><Icono nombre="correo" :tamano="16" /> Tu correo aún no está verificado.</span>
      <RouterLink to="/verificar-correo">Verifica tu correo</RouterLink>
    </div>
  </div>
  <main id="contenido" class="pm-main" :class="{ 'pm-main-panel': esPanel }">
    <RouterView v-slot="{ Component }">
      <Transition name="pagina" mode="out-in">
        <component :is="Component" :key="claveVista" />
      </Transition>
    </RouterView>
  </main>
  <AppFooter v-if="!esPanel" />
  <ToastContainer />
  <InsigniaGanadaModal v-if="auth.isAuth" />
</template>

<style>
.saltar-contenido {
  position: absolute;
  left: -9999px;
  top: 0;
  z-index: 5000;
  background: #fff;
  color: var(--verde);
  padding: 8px 14px;
  border-radius: 0 0 8px 0;
  font-weight: bold;
}
.saltar-contenido:focus { left: 0; }

.banner-verificar {
  background: #fff8e1;
  border-bottom: 1px solid #ffe082;
  color: #795548;
  font-size: 0.9rem;
}
.banner-verificar-interior {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 6px 12px;
  padding: 8px 0;
  text-align: center;
}
.banner-verificar a {
  color: var(--verde);
  font-weight: bold;
}

.pagina-enter-active, .pagina-leave-active { transition: opacity 0.18s ease; }
.pagina-enter-from, .pagina-leave-to { opacity: 0; }
</style>
