<script setup>
/**
 * Barra superior del panel.
 *
 * Props:
 *  - menuExpandido (Boolean): estado actual del sidebar (para aria-expanded de la hamburguesa).
 * Emite:
 *  - toggle-menu: clic en la hamburguesa (el layout decide si colapsa o abre el drawer).
 *
 * El breadcrumb sale de `route.meta.breadcrumb` (array de textos o de { label, to }); el último va en "pill".
 */
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import PanelIcon from './PanelIcon.vue'

defineProps({
  menuExpandido: { type: Boolean, default: false }
})
const emit = defineEmits(['toggle-menu'])

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

/* ---------- Breadcrumb ---------- */
const migas = computed(() => {
  const bc = route.meta?.breadcrumb
  let lista = Array.isArray(bc) && bc.length ? bc : ['Panel', route.meta?.title || 'Dashboard']
  return lista
    .map((m) => (typeof m === 'string' ? { label: m } : m))
    .filter((m) => m && m.label)
})

/* ---------- Usuario ---------- */
const ROLES = { admin: 'Administrador', editor: 'Editor del catálogo', noticias: 'Editor de noticias', user: 'Usuario' }
const nombre = computed(() => auth.user?.name || 'Usuario')
const email = computed(() => auth.user?.email || '')
const inicial = computed(() => nombre.value.trim().charAt(0).toUpperCase() || 'U')
const rolTexto = computed(() => ROLES[auth.user?.role] || '')

const abierto = ref(false)
const raiz = ref(null)
const boton = ref(null)
const menu = ref(null)

function opciones() {
  return menu.value ? Array.from(menu.value.querySelectorAll('[role="menuitem"]')) : []
}

async function abrir(enfocarPrimero = false) {
  abierto.value = true
  await nextTick()
  if (enfocarPrimero) opciones()[0]?.focus()
}
function cerrar(devolverFoco = false) {
  if (!abierto.value) return
  abierto.value = false
  if (devolverFoco) boton.value?.focus()
}
function alternar() {
  abierto.value ? cerrar() : abrir()
}

function teclaBoton(e) {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    abrir(true)
  }
}
function teclaMenu(e) {
  const items = opciones()
  const i = items.indexOf(document.activeElement)
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    items[(i + 1) % items.length]?.focus()
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    items[(i - 1 + items.length) % items.length]?.focus()
  } else if (e.key === 'Home') {
    e.preventDefault()
    items[0]?.focus()
  } else if (e.key === 'End') {
    e.preventDefault()
    items[items.length - 1]?.focus()
  } else if (e.key === 'Tab') {
    cerrar()
  }
}

function clicFuera(e) {
  if (raiz.value && !raiz.value.contains(e.target)) cerrar()
}
function teclaGlobal(e) {
  if (e.key === 'Escape' && abierto.value) {
    e.preventDefault()
    cerrar(true)
  }
}

watch(abierto, (v) => {
  if (v) {
    document.addEventListener('pointerdown', clicFuera, true)
    document.addEventListener('keydown', teclaGlobal)
  } else {
    document.removeEventListener('pointerdown', clicFuera, true)
    document.removeEventListener('keydown', teclaGlobal)
  }
})
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', clicFuera, true)
  document.removeEventListener('keydown', teclaGlobal)
})
watch(() => route.fullPath, () => cerrar())

function cerrarSesion() {
  cerrar()
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <header class="pm-tb">
    <div class="pm-tb-izq">
      <button
        type="button"
        class="pm-tb-hamburguesa"
        aria-controls="pm-sidebar"
        :aria-expanded="String(menuExpandido)"
        :aria-label="menuExpandido ? 'Ocultar menú de navegación' : 'Mostrar menú de navegación'"
        :title="menuExpandido ? 'Ocultar menú' : 'Mostrar menú'"
        @click="emit('toggle-menu')"
      >
        <PanelIcon name="menu" :size="20" />
      </button>
      <RouterLink to="/panel" class="pm-tb-logo" title="Plantamoss — Dashboard">
        <img src="/img/logo.png" alt="" width="28" height="28" />
        <span class="pm-tb-marca">Planta<b>moss</b></span>
      </RouterLink>
    </div>

    <div class="pm-tb-der">
      <nav class="pm-tb-migas" aria-label="Ruta de navegación">
        <ol>
          <li v-for="(m, i) in migas" :key="i" :class="{ 'pm-tb-miga--ultima': i === migas.length - 1 }">
            <template v-if="i < migas.length - 1">
              <RouterLink v-if="m.to" :to="m.to" class="pm-tb-miga-enlace">{{ m.label }}</RouterLink>
              <span v-else>{{ m.label }}</span>
              <span class="pm-tb-sep" aria-hidden="true">/</span>
            </template>
            <span v-else class="pm-tb-pill" aria-current="page">{{ m.label }}</span>
          </li>
        </ol>
      </nav>

      <div ref="raiz" class="pm-tb-usuario">
        <button
          ref="boton"
          type="button"
          class="pm-tb-tarjeta"
          aria-haspopup="menu"
          :aria-expanded="String(abierto)"
          aria-controls="pm-tb-menu"
          @click="alternar"
          @keydown="teclaBoton"
        >
          <span class="pm-tb-datos">
            <span class="pm-tb-nombre">{{ nombre }}</span>
            <span v-if="email" class="pm-tb-email">{{ email }}</span>
          </span>
          <span class="pm-tb-avatar" aria-hidden="true">{{ inicial }}</span>
          <span class="pm-sr">Menú de usuario</span>
          <PanelIcon name="chevronDown" :size="14" class="pm-tb-flecha" :class="{ 'pm-tb-flecha--abierta': abierto }" />
        </button>

        <Transition name="pm-tb-pop">
          <div
            v-if="abierto"
            id="pm-tb-menu"
            ref="menu"
            class="pm-tb-menu"
            role="menu"
            aria-label="Opciones de usuario"
            @keydown="teclaMenu"
          >
            <div class="pm-tb-menu-cabecera" role="presentation">
              <span class="pm-tb-avatar pm-tb-avatar--grande" aria-hidden="true">{{ inicial }}</span>
              <span class="pm-tb-menu-datos">
                <strong>{{ nombre }}</strong>
                <small>{{ email }}</small>
                <em v-if="rolTexto">{{ rolTexto }}</em>
              </span>
            </div>
            <RouterLink to="/perfil" class="pm-tb-opcion" role="menuitem" @click="cerrar()">
              <PanelIcon name="user" :size="16" /> Mi perfil
            </RouterLink>
            <RouterLink to="/" class="pm-tb-opcion" role="menuitem" @click="cerrar()">
              <PanelIcon name="globe" :size="16" /> Volver al sitio
            </RouterLink>
            <div class="pm-tb-div" role="separator"></div>
            <button type="button" class="pm-tb-opcion pm-tb-opcion--salir" role="menuitem" @click="cerrarSesion">
              <PanelIcon name="logout" :size="16" /> Cerrar sesión
            </button>
          </div>
        </Transition>
      </div>
    </div>
  </header>
</template>

<style scoped>
.pm-tb {
  position: sticky;
  top: 0;
  z-index: 30;
  height: 64px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 22px 0 14px;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid #e6ebe8;
  box-shadow: 0 1px 2px rgba(16, 40, 26, 0.03);
}
.pm-sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

.pm-tb-izq {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.pm-tb-hamburguesa {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: #4b5a52;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.pm-tb-hamburguesa:hover { background: #f1f4f2; color: #1f2d26; }
.pm-tb-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  border-radius: 8px;
}
.pm-tb-logo img { width: 28px; height: 28px; object-fit: contain; }
.pm-tb-marca {
  font-size: 1.02rem;
  font-weight: 600;
  color: #2b5e3f;
  letter-spacing: 0.01em;
}
.pm-tb-marca b { color: #2e7d32; font-weight: 800; }

.pm-tb-der {
  display: flex;
  align-items: center;
  gap: 18px;
  min-width: 0;
}

/* Breadcrumb */
.pm-tb-migas { min-width: 0; }
.pm-tb-migas ol {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 0.78rem;
  font-weight: 600;
  color: #7d8b84;
  white-space: nowrap;
}
.pm-tb-migas li { display: flex; align-items: center; gap: 6px; min-width: 0; }
.pm-tb-sep { color: #c5cec9; font-weight: 400; }
.pm-tb-miga-enlace { color: inherit; text-decoration: none; }
.pm-tb-miga-enlace:hover { color: #2b5e3f; text-decoration: underline; }
.pm-tb-pill {
  display: inline-block;
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 5px 12px;
  border-radius: 10px;
  background: #f1f4f2;
  border: 1px solid #e3e9e5;
  color: #1f2d26;
  font-weight: 700;
}

/* Tarjeta de usuario */
.pm-tb-usuario { position: relative; }
.pm-tb-tarjeta {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 5px 8px 5px 12px;
  border: 1px solid #e3e9e5;
  border-radius: 12px;
  background: #f6f8f7;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s, border-color 0.15s;
}
.pm-tb-tarjeta:hover,
.pm-tb-tarjeta[aria-expanded='true'] { background: #eef3ef; border-color: #d5e0d8; }
.pm-tb-datos {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  line-height: 1.2;
  min-width: 0;
}
.pm-tb-nombre {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.76rem;
  font-weight: 800;
  text-transform: uppercase;
  color: #1f2d26;
  letter-spacing: 0.02em;
}
.pm-tb-email {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.68rem;
  color: #7d8b84;
}
.pm-tb-avatar {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-radius: 50%;
  background: #2e7d32;
  color: #fff;
  font-weight: 800;
  font-size: 0.85rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 0 2px #fff, 0 0 0 3px #a5d6a7;
}
.pm-tb-avatar--grande { width: 40px; height: 40px; font-size: 1rem; }
.pm-tb-flecha { color: #8b978f; transition: transform 0.2s; }
.pm-tb-flecha--abierta { transform: rotate(180deg); }

.pm-tb-hamburguesa:focus-visible,
.pm-tb-logo:focus-visible,
.pm-tb-tarjeta:focus-visible,
.pm-tb-miga-enlace:focus-visible,
.pm-tb-opcion:focus-visible {
  outline: 3px solid #a5d6a7;
  outline-offset: 2px;
}

/* Dropdown */
.pm-tb-menu {
  position: absolute;
  right: 0;
  top: calc(100% + 8px);
  width: 260px;
  max-width: calc(100vw - 24px);
  padding: 6px;
  background: #fff;
  border: 1px solid #e3e9e5;
  border-radius: 14px;
  box-shadow: 0 16px 40px rgba(16, 40, 26, 0.16);
  z-index: 50;
  box-sizing: border-box;
}
.pm-tb-menu-cabecera {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 10px 12px;
  margin-bottom: 4px;
  border-bottom: 1px solid #eef1ef;
}
.pm-tb-menu-datos {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.3;
}
.pm-tb-menu-datos strong {
  font-size: 0.86rem;
  color: #1f2d26;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pm-tb-menu-datos small {
  font-size: 0.74rem;
  color: #7d8b84;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pm-tb-menu-datos em {
  font-style: normal;
  font-size: 0.7rem;
  font-weight: 700;
  color: #2b5e3f;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-top: 2px;
}
.pm-tb-opcion {
  width: 100%;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border: none;
  border-radius: 9px;
  background: transparent;
  color: #33413a;
  font-family: inherit;
  font-size: 0.86rem;
  font-weight: 500;
  text-decoration: none;
  text-align: left;
  cursor: pointer;
}
.pm-tb-opcion .pm-icon { color: #7d8b84; }
.pm-tb-opcion:hover { background: #f1f6f2; color: #1f2d26; }
.pm-tb-opcion--salir { color: #c62828; }
.pm-tb-opcion--salir .pm-icon { color: #c62828; }
.pm-tb-opcion--salir:hover { background: #ffebee; color: #b71c1c; }
.pm-tb-div { height: 1px; background: #eef1ef; margin: 4px 6px; }

.pm-tb-pop-enter-active,
.pm-tb-pop-leave-active { transition: opacity 0.14s ease, transform 0.14s ease; }
.pm-tb-pop-enter-from,
.pm-tb-pop-leave-to { opacity: 0; transform: translateY(-4px); }

/* Responsive */
@media (max-width: 1023.98px) {
  .pm-tb-pill { max-width: 180px; }
}
@media (max-width: 767.98px) {
  .pm-tb { padding: 0 12px 0 8px; }
  .pm-tb-migas li:not(.pm-tb-miga--ultima) { display: none; }
  .pm-tb-datos { display: none; }
  .pm-tb-tarjeta { padding: 4px 6px 4px 4px; gap: 6px; }
  .pm-tb-der { gap: 10px; }
}
@media (max-width: 479.98px) {
  .pm-tb-migas { display: none; }
  .pm-tb-marca { font-size: 0.95rem; }
}
</style>
