<script setup>
/**
 * Barra lateral del panel (estilo intranet).
 *
 * Props:
 *  - colapsado (Boolean): escritorio en modo íconos (~72px) con tooltips.
 *  - movil (Boolean): viewport < 1024px → se comporta como drawer.
 *  - abierto (Boolean): drawer visible (solo aplica con `movil`).
 * Emite:
 *  - cerrar: pedir cerrar el drawer (botón ×, ESC, clic en un enlace).
 *  - expandir: pedir salir del modo íconos (clic en un grupo o en el buscador colapsado).
 */
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import PanelIcon from './PanelIcon.vue'
import { NAVEGACION, enlaceActivo, normalizar } from './navegacion'
import './panel.css'

const props = defineProps({
  colapsado: { type: Boolean, default: false },
  movil: { type: Boolean, default: false },
  abierto: { type: Boolean, default: false }
})
const emit = defineEmits(['cerrar', 'expandir'])

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const modoIconos = computed(() => props.colapsado && !props.movil)

/* ---------- Items permitidos por rol ---------- */
const permitido = (x) => typeof x.permiso !== 'function' || !!x.permiso(auth)

const secciones = computed(() =>
  NAVEGACION.filter(permitido)
    .map((s) => ({
      ...s,
      items: s.items
        .filter(permitido)
        .map((it) => (it.grupo ? { ...it, children: it.children.filter(permitido) } : it))
        .filter((it) => !it.grupo || it.children.length)
    }))
    .filter((s) => s.items.length)
)

/* ---------- Buscador ---------- */
const busqueda = ref('')
const inputBuscar = ref(null)
const q = computed(() => normalizar(busqueda.value))

const seccionesVisibles = computed(() => {
  if (!q.value) return secciones.value
  return secciones.value
    .map((s) => {
      const tituloCoincide = normalizar(s.titulo).includes(q.value)
      const items = s.items
        .map((it) => {
          if (!it.grupo) return tituloCoincide || normalizar(it.label).includes(q.value) ? it : null
          if (tituloCoincide || normalizar(it.label).includes(q.value)) return it
          const children = it.children.filter((c) => normalizar(c.label).includes(q.value))
          return children.length ? { ...it, children } : null
        })
        .filter(Boolean)
      return { ...s, items }
    })
    .filter((s) => s.items.length)
})

const primerResultado = computed(() => {
  for (const s of seccionesVisibles.value) {
    for (const it of s.items) {
      if (!it.grupo) return it
      if (it.children.length) return it.children[0]
    }
  }
  return null
})

function irAlPrimero() {
  if (!primerResultado.value) return
  router.push(primerResultado.value.to)
  busqueda.value = ''
}

function teclaBuscar(e) {
  if (e.key === 'Escape' && busqueda.value) {
    e.stopPropagation()
    busqueda.value = ''
  }
}

async function abrirBuscador() {
  emit('expandir')
  await nextTick()
  // Espera a que termine la transición de ancho antes de enfocar.
  setTimeout(() => inputBuscar.value?.focus(), 180)
}

/* ---------- Grupos desplegables ---------- */
const abiertos = reactive({})

function grupoActivo(g) {
  return g.children.some((c) => enlaceActivo(c, route.path))
}
function grupoAbierto(g) {
  if (q.value) return true // con búsqueda se abren los grupos con coincidencias
  return !!abiertos[g.id]
}
function alternarGrupo(g) {
  if (modoIconos.value) {
    abiertos[g.id] = true
    emit('expandir')
    return
  }
  abiertos[g.id] = !abiertos[g.id]
}

// Abre automáticamente el grupo que contiene la ruta activa.
watch(
  () => route.path,
  () => {
    for (const s of secciones.value) {
      for (const it of s.items) {
        if (it.grupo && grupoActivo(it)) abiertos[it.id] = true
      }
    }
  },
  { immediate: true }
)

const esActivo = (item) => enlaceActivo(item, route.path)

function alNavegar() {
  ocultarTip()
  if (props.movil) emit('cerrar')
}

/* ---------- Tooltips (modo íconos) ---------- */
const tip = reactive({ visible: false, texto: '', top: 0, left: 0 })

function mostrarTip(e, texto) {
  if (!modoIconos.value) return
  const r = e.currentTarget.getBoundingClientRect()
  tip.texto = texto
  tip.top = r.top + r.height / 2
  tip.left = r.right + 10
  tip.visible = true
}
function ocultarTip() {
  tip.visible = false
}
watch(modoIconos, ocultarTip)

const etiquetaAside = computed(() => 'Menú del panel administrativo')
</script>

<template>
  <aside
    id="pm-sidebar"
    class="pm-sb"
    :class="{ 'pm-sb--iconos': modoIconos, 'pm-sb--movil': movil, 'pm-sb--abierto': movil && abierto }"
    :aria-label="etiquetaAside"
    :aria-hidden="movil && !abierto ? 'true' : undefined"
    @keydown.esc="movil && emit('cerrar')"
  >
    <!-- Marca -->
    <div class="pm-sb-marca">
      <RouterLink to="/panel" class="pm-sb-logo" @click="alNavegar">
        <img src="/img/logo.png" alt="" width="34" height="34" />
        <span class="pm-sb-titulo">
          <strong>Plantamoss</strong>
          <small>Panel de control</small>
        </span>
        <span class="pm-sr">Ir al dashboard</span>
      </RouterLink>
      <button v-if="movil" type="button" class="pm-sb-cerrar" aria-label="Cerrar menú" @click="emit('cerrar')">
        <PanelIcon name="close" :size="18" />
      </button>
    </div>

    <!-- Buscador -->
    <div class="pm-sb-buscar">
      <button
        v-if="modoIconos"
        type="button"
        class="pm-sb-buscar-btn"
        aria-label="Buscar opción"
        @click="abrirBuscador"
        @mouseenter="mostrarTip($event, 'Buscar opción')"
        @mouseleave="ocultarTip"
        @focus="mostrarTip($event, 'Buscar opción')"
        @blur="ocultarTip"
      >
        <PanelIcon name="search" :size="18" />
      </button>
      <div v-else class="pm-sb-buscar-campo">
        <PanelIcon name="search" :size="15" class="pm-sb-buscar-lupa" />
        <input
          ref="inputBuscar"
          v-model="busqueda"
          type="text"
          placeholder="Buscar opción..."
          aria-label="Buscar opción del menú"
          autocomplete="off"
          @keydown.enter.prevent="irAlPrimero"
          @keydown="teclaBuscar"
        />
        <button v-if="busqueda" type="button" class="pm-sb-limpiar" aria-label="Limpiar búsqueda" @click="busqueda = ''">
          <PanelIcon name="close" :size="13" />
        </button>
      </div>
    </div>

    <!-- Navegación -->
    <nav class="pm-sb-nav" aria-label="Navegación del panel" @scroll.passive="ocultarTip">
      <p v-if="q && !seccionesVisibles.length" class="pm-sb-vacio">
        Sin resultados para “{{ busqueda }}”.
      </p>

      <section v-for="s in seccionesVisibles" :key="s.id" class="pm-sb-seccion" :aria-labelledby="`pm-sec-${s.id}`">
        <h2 :id="`pm-sec-${s.id}`" class="pm-sb-seccion-titulo">
          <span>{{ s.titulo }}</span>
        </h2>

        <ul class="pm-sb-lista" role="list">
          <li v-for="it in s.items" :key="it.id">
            <!-- Enlace simple -->
            <RouterLink
              v-if="!it.grupo"
              :to="it.to"
              class="pm-sb-item"
              :class="{ 'pm-sb-item--activo': esActivo(it) }"
              :aria-current="esActivo(it) ? 'page' : undefined"
              @click="alNavegar"
              @mouseenter="mostrarTip($event, it.label)"
              @mouseleave="ocultarTip"
              @focus="mostrarTip($event, it.label)"
              @blur="ocultarTip"
            >
              <PanelIcon :name="it.icon" :size="19" />
              <span class="pm-sb-texto">{{ it.label }}</span>
            </RouterLink>

            <!-- Grupo desplegable -->
            <template v-else>
              <button
                type="button"
                class="pm-sb-item pm-sb-grupo"
                :class="{ 'pm-sb-grupo--contiene': grupoActivo(it) }"
                :aria-expanded="modoIconos ? 'false' : String(grupoAbierto(it))"
                :aria-controls="`pm-grupo-${it.id}`"
                @click="alternarGrupo(it)"
                @mouseenter="mostrarTip($event, it.label)"
                @mouseleave="ocultarTip"
                @focus="mostrarTip($event, it.label)"
                @blur="ocultarTip"
              >
                <PanelIcon :name="it.icon" :size="19" />
                <span class="pm-sb-texto">{{ it.label }}</span>
                <PanelIcon
                  name="chevronDown"
                  :size="14"
                  class="pm-sb-chevron"
                  :class="{ 'pm-sb-chevron--abierto': grupoAbierto(it) }"
                />
              </button>
              <div
                :id="`pm-grupo-${it.id}`"
                class="pm-sb-sub"
                :class="{ 'pm-sb-sub--abierto': grupoAbierto(it) && !modoIconos }"
              >
                <ul class="pm-sb-sub-lista" role="list">
                  <li v-for="c in it.children" :key="c.id">
                    <RouterLink
                      :to="c.to"
                      class="pm-sb-subitem"
                      :class="{ 'pm-sb-subitem--activo': esActivo(c) }"
                      :aria-current="esActivo(c) ? 'page' : undefined"
                      :tabindex="grupoAbierto(it) && !modoIconos ? undefined : -1"
                      @click="alNavegar"
                    >
                      {{ c.label }}
                    </RouterLink>
                  </li>
                </ul>
              </div>
            </template>
          </li>
        </ul>
      </section>
    </nav>

    <!-- Pie -->
    <div class="pm-sb-pie">
      <RouterLink
        to="/"
        class="pm-sb-volver"
        @click="alNavegar"
        @mouseenter="mostrarTip($event, 'Volver al sitio')"
        @mouseleave="ocultarTip"
        @focus="mostrarTip($event, 'Volver al sitio')"
        @blur="ocultarTip"
      >
        <PanelIcon name="arrowLeft" :size="17" />
        <span class="pm-sb-texto">Volver al sitio</span>
      </RouterLink>
    </div>

    <Teleport to="body">
      <div
        v-if="tip.visible && modoIconos"
        class="pm-sb-tip"
        role="tooltip"
        :style="{ top: `${tip.top}px`, left: `${tip.left}px` }"
      >
        {{ tip.texto }}
      </div>
    </Teleport>
  </aside>
</template>

<style scoped>
.pm-sb {
  --sb-w: 264px;
  width: var(--sb-w);
  height: 100vh;
  height: 100dvh;
  position: sticky;
  top: 0;
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-right: 1px solid #e6ebe8;
  transition: width 0.24s ease;
  overflow: hidden;
  z-index: 40;
}
.pm-sb--iconos { --sb-w: 72px; }

/* Drawer móvil */
.pm-sb--movil {
  --sb-w: min(280px, 86vw);
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  z-index: 60;
  transform: translateX(-100%);
  visibility: hidden;
  box-shadow: none;
  transition: transform 0.26s ease, visibility 0s linear 0.26s, box-shadow 0.26s ease;
}
.pm-sb--movil.pm-sb--abierto {
  transform: translateX(0);
  visibility: visible;
  box-shadow: 0 20px 50px rgba(15, 40, 25, 0.25);
  transition: transform 0.26s ease, visibility 0s, box-shadow 0.26s ease;
}

.pm-sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

/* Marca */
.pm-sb-marca {
  height: 64px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 14px 0 18px;
  border-bottom: 1px solid #eef1ef;
}
.pm-sb-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  text-decoration: none;
  color: inherit;
  border-radius: 10px;
}
.pm-sb-logo img {
  width: 34px;
  height: 34px;
  object-fit: contain;
  flex-shrink: 0;
}
.pm-sb-titulo {
  display: flex;
  flex-direction: column;
  line-height: 1.15;
  white-space: nowrap;
  overflow: hidden;
}
.pm-sb-titulo strong {
  font-size: 0.92rem;
  font-weight: 800;
  color: #1d2b22;
}
.pm-sb-titulo small {
  font-size: 0.72rem;
  color: #66736a;
  font-weight: 500;
}
.pm-sb-cerrar {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: none;
  background: transparent;
  color: #6b7a72;
  border-radius: 9px;
  cursor: pointer;
}
.pm-sb-cerrar:hover { background: #f1f4f2; color: #1f2d26; }

.pm-sb--iconos .pm-sb-marca { padding: 0; justify-content: center; }
.pm-sb--iconos .pm-sb-titulo { display: none; }

/* Buscador */
.pm-sb-buscar {
  padding: 14px 14px 6px;
  flex-shrink: 0;
}
.pm-sb-buscar-campo {
  position: relative;
}
.pm-sb-buscar-lupa {
  position: absolute;
  left: 11px;
  top: 50%;
  transform: translateY(-50%);
  color: #9aa7a0;
  pointer-events: none;
}
.pm-sb-buscar-campo input {
  width: 100%;
  box-sizing: border-box;
  padding: 8px 30px 8px 32px;
  border: 1px solid #e1e7e3;
  border-radius: 11px;
  background: #fff;
  font-size: 0.82rem;
  color: #2b3a32;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
  transition: border-color 0.15s, box-shadow 0.15s;
}
.pm-sb-buscar-campo input::placeholder { color: #a3aea8; }
.pm-sb-buscar-campo input:focus {
  outline: none;
  border-color: #2b5e3f;
  box-shadow: 0 0 0 3px rgba(43, 94, 63, 0.12);
}
.pm-sb-limpiar {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #8b978f;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.pm-sb-limpiar:hover { background: #f1f4f2; color: #33413a; }
.pm-sb-buscar-btn {
  width: 44px;
  height: 40px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e1e7e3;
  border-radius: 11px;
  background: #fff;
  color: #6b7a72;
  cursor: pointer;
}
.pm-sb-buscar-btn:hover { color: #2b5e3f; border-color: #a5d6a7; }
.pm-sb--iconos .pm-sb-buscar { padding: 14px 0 6px; }

/* Navegación */
.pm-sb-nav {
  flex: 1 1 auto;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 4px 12px 16px;
  scrollbar-width: thin;
  scrollbar-color: #d7dfda transparent;
}
.pm-sb--iconos .pm-sb-nav { padding: 4px 10px 16px; }
.pm-sb-vacio {
  margin: 14px 6px;
  font-size: 0.8rem;
  color: #8b978f;
}
.pm-sb-seccion { margin-top: 12px; }
.pm-sb-seccion-titulo {
  margin: 0 0 6px;
  padding: 6px 10px 0;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #9aa5a0;
  white-space: nowrap;
  overflow: hidden;
}
.pm-sb--iconos .pm-sb-seccion-titulo {
  height: 1px;
  padding: 0;
  margin: 10px 8px 10px;
  background: #e8ece9;
}
.pm-sb--iconos .pm-sb-seccion-titulo span {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}
.pm-sb-lista,
.pm-sb-sub-lista {
  list-style: none;
  margin: 0;
  padding: 0;
}

.pm-sb-item {
  position: relative;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 9px 12px;
  margin: 2px 0;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: #33413a;
  font-size: 0.87rem;
  font-weight: 500;
  text-align: left;
  text-decoration: none;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s, color 0.15s;
}
.pm-sb-item .pm-icon { color: #7d8b84; transition: color 0.15s; }
.pm-sb-item:hover { background: #f2f4f3; color: #1d2b22; }
.pm-sb-item:hover .pm-icon { color: #1d2b22; }
.pm-sb-item:focus-visible,
.pm-sb-subitem:focus-visible,
.pm-sb-volver:focus-visible,
.pm-sb-logo:focus-visible,
.pm-sb-cerrar:focus-visible,
.pm-sb-buscar-btn:focus-visible,
.pm-sb-limpiar:focus-visible {
  outline: 3px solid #a5d6a7;
  outline-offset: 1px;
}
.pm-sb-item--activo {
  background: #eef6f0;
  color: #2b5e3f;
  font-weight: 700;
}
.pm-sb-item--activo .pm-icon { color: #2b5e3f; }
.pm-sb-item--activo::before {
  content: '';
  position: absolute;
  left: -12px;
  top: 7px;
  bottom: 7px;
  width: 4px;
  border-radius: 0 4px 4px 0;
  background: #2b5e3f;
}
.pm-sb--iconos .pm-sb-item--activo::before { left: -10px; }
.pm-sb-grupo--contiene { color: #1d2b22; font-weight: 600; }
.pm-sb-grupo--contiene .pm-icon { color: #2b5e3f; }
.pm-sb-texto {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}
.pm-sb-chevron {
  margin-left: auto;
  transition: transform 0.22s ease;
}
.pm-sb-chevron--abierto { transform: rotate(180deg); }

.pm-sb--iconos .pm-sb-item {
  justify-content: center;
  padding: 10px 0;
}
.pm-sb--iconos .pm-sb-texto,
.pm-sb--iconos .pm-sb-chevron {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}

/* Submenú con animación de altura (grid 0fr → 1fr) */
.pm-sb-sub {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.26s ease, visibility 0s linear 0.26s;
  visibility: hidden;
}
.pm-sb-sub--abierto {
  grid-template-rows: 1fr;
  visibility: visible;
  transition: grid-template-rows 0.26s ease, visibility 0s;
}
.pm-sb-sub > .pm-sb-sub-lista {
  overflow: hidden;
  min-height: 0;
  position: relative;
  padding-left: 30px;
}
.pm-sb-sub-lista::before {
  content: '';
  position: absolute;
  left: 21px;
  top: 4px;
  bottom: 14px;
  width: 1px;
  background: #dfe5e1;
}
.pm-sb-subitem {
  position: relative;
  display: block;
  padding: 7px 12px;
  margin: 2px 0;
  border-radius: 9px;
  font-size: 0.84rem;
  font-weight: 500;
  color: #66746c;
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: background 0.15s, color 0.15s;
}
.pm-sb-subitem::before {
  content: '';
  position: absolute;
  left: -9px;
  top: 50%;
  width: 8px;
  height: 1px;
  background: #dfe5e1;
}
.pm-sb-subitem:hover { background: #f2f4f3; color: #1d2b22; }
.pm-sb-subitem--activo {
  background: #eef6f0;
  color: #2b5e3f;
  font-weight: 700;
}
.pm-sb-subitem--activo::before { background: #2b5e3f; }

/* Pie */
.pm-sb-pie {
  flex-shrink: 0;
  padding: 12px 14px;
  border-top: 1px solid #eef1ef;
}
.pm-sb-volver {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 10px;
  font-size: 0.86rem;
  font-weight: 600;
  color: #66746c;
  text-decoration: none;
  white-space: nowrap;
}
.pm-sb-volver:hover { background: #f2f4f3; color: #1d2b22; }
.pm-sb--iconos .pm-sb-pie { padding: 12px 10px; }
.pm-sb--iconos .pm-sb-volver { justify-content: center; }

/* Los estilos del tooltip (.pm-sb-tip) viven en panel.css porque se teletransporta al body. */

@media (prefers-reduced-motion: reduce) {
  .pm-sb, .pm-sb-sub, .pm-sb-chevron { transition: none !important; }
}
</style>
