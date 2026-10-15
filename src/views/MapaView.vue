<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import api, { mensajeError } from '@/services/api'
import Breadcrumb from '@/components/Breadcrumb.vue'
import PlantaDetalleModal from '@/components/PlantaDetalleModal.vue'
import EstadoDrawer from '@/components/mapa/EstadoDrawer.vue'
import estadosSvg from '@/assets/data/mexico-estados.json'
import { normalizar } from '@/utils/plantas'
import { useInsigniasStore } from '@/stores/insignias'

const insignias = useInsigniasStore()

// Capitales para el clima en tiempo real (de mapa.js, con claves corregidas)
const CAPITALES = {
  'aguascalientes': 'Aguascalientes,MX',
  'baja california': 'Mexicali,MX',
  'baja california sur': 'La Paz,MX',
  'campeche': 'Campeche,MX',
  'chiapas': 'Tuxtla Gutierrez,MX',
  'chihuahua': 'Chihuahua,MX',
  'coahuila': 'Saltillo,MX',
  'colima': 'Colima,MX',
  'ciudad de mexico': 'Mexico City,MX',
  'durango': 'Durango,MX',
  'guanajuato': 'Guanajuato,MX',
  'guerrero': 'Chilpancingo,MX',
  'hidalgo': 'Pachuca,MX',
  'jalisco': 'Guadalajara,MX',
  'estado de mexico': 'Toluca,MX',
  'michoacan': 'Morelia,MX',
  'morelos': 'Cuernavaca,MX',
  'nayarit': 'Tepic,MX',
  'nuevo leon': 'Monterrey,MX',
  'oaxaca': 'Oaxaca,MX',
  'puebla': 'Puebla,MX',
  'queretaro': 'Queretaro,MX',
  'quintana roo': 'Chetumal,MX',
  'san luis potosi': 'San Luis Potosi,MX',
  'sinaloa': 'Culiacan,MX',
  'sonora': 'Hermosillo,MX',
  'tabasco': 'Villahermosa,MX',
  'tamaulipas': 'Ciudad Victoria,MX',
  'tlaxcala': 'Tlaxcala,MX',
  'veracruz': 'Xalapa,MX',
  'yucatan': 'Merida,MX',
  'zacatecas': 'Zacatecas,MX'
}

// Nombre visible de la capital (con acentos)
const CAPITAL_VISIBLE = {
  'Mexico City': 'Ciudad de México',
  'Tuxtla Gutierrez': 'Tuxtla Gutiérrez',
  'Queretaro': 'Querétaro',
  'San Luis Potosi': 'San Luis Potosí',
  'Culiacan': 'Culiacán',
  'Merida': 'Mérida'
}

const estadosBd = ref([])
const errorEstados = ref('')
const cargandoEstados = ref(true)

const mapaContenedor = ref(null)
const tooltip = ref({ visible: false, x: 0, y: 0, nombre: '', detalle: '' })

const activo = ref(null) // nombre normalizado del path activo
const panelVisible = ref(false)
const cargandoPanel = ref(false)
const errorPanel = ref('')
const datosPanel = ref(null) // { estado, plantas }
const climaPanel = ref(null) // respuesta /externo/clima o null
const climaCargando = ref(false)
const plantaSeleccionada = ref(null)

// Abre el detalle de una planta del panel y cuenta la visita para las insignias (igual que el catálogo).
function abrirPlanta(p) {
  plantaSeleccionada.value = p
  insignias.evento('VER_PLANTA', p.idPlanta)
}

const indiceBd = computed(() => {
  const m = new Map()
  for (const e of estadosBd.value) m.set(normalizar(e.nombreEstado), e)
  return m
})

const paths = computed(() =>
  estadosSvg.map((p) => {
    const clave = normalizar(p.nombre)
    const info = indiceBd.value.get(clave) || null
    return { ...p, clave, info, conDatos: !!info && info.cantidadPlantas > 0 }
  })
)

const totalConDatos = computed(() => paths.value.filter((p) => p.conDatos).length)

async function cargarEstados() {
  cargandoEstados.value = true
  errorEstados.value = ''
  try {
    const { data } = await api.get('/estados')
    estadosBd.value = Array.isArray(data) ? data : []
  } catch (err) {
    errorEstados.value = mensajeError(err, 'No se pudieron cargar los estados.')
  } finally {
    cargandoEstados.value = false
  }
}

/* ---------- Tooltip ---------- */
function mostrarTooltip(p, e) {
  tooltip.value.nombre = p.info?.nombreEstado || p.nombre
  tooltip.value.detalle = p.info
    ? `${p.info.climaPredominante || 'Clima no registrado'} · ${p.info.cantidadPlantas} planta(s)`
    : 'Sin datos registrados'
  tooltip.value.visible = true
  moverTooltip(e)
}
function moverTooltip(e) {
  const rect = mapaContenedor.value?.getBoundingClientRect()
  if (!rect || !e || e.clientX == null) return
  tooltip.value.x = e.clientX - rect.left
  tooltip.value.y = e.clientY - rect.top
}
function ocultarTooltip() {
  tooltip.value.visible = false
}

/* ---------- Selección ---------- */
let peticion = 0
async function seleccionar(p) {
  if (!p.info) return
  ocultarTooltip()
  activo.value = p.clave
  panelVisible.value = true
  insignias.evento('VER_ESTADO', p.info.idEstado)
  const id = ++peticion
  cargandoPanel.value = true
  errorPanel.value = ''
  datosPanel.value = null
  climaPanel.value = null
  climaCargando.value = true

  const consulta = CAPITALES[p.clave] || `${p.info.nombreEstado},MX`
  api.get('/externo/clima', { params: { q: consulta } })
    .then(({ data }) => { if (id === peticion) climaPanel.value = data && data.ok ? data : null })
    .catch(() => { if (id === peticion) climaPanel.value = null })
    .finally(() => { if (id === peticion) climaCargando.value = false })

  try {
    const { data } = await api.get(`/estados/${p.info.idEstado}/plantas`)
    if (id !== peticion) return
    datosPanel.value = {
      estado: data?.estado || p.info,
      plantas: Array.isArray(data?.plantas) ? data.plantas : []
    }
  } catch (err) {
    if (id !== peticion) return
    errorPanel.value = mensajeError(err, 'Error al cargar los datos.')
  } finally {
    if (id === peticion) cargandoPanel.value = false
  }
}

function cerrarPanel() {
  const clave = activo.value
  panelVisible.value = false
  activo.value = null
  peticion++
  // Devuelve el foco al estado del mapa
  nextTick(() => {
    if (!clave) return
    const el = mapaContenedor.value?.querySelector(`[data-clave="${CSS.escape(clave)}"]`)
    el?.focus({ preventScroll: true })
    ocultarTooltip()
  })
}

function onKeyPath(e, p) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    seleccionar(p)
  }
}
function onKeyGlobal(e) {
  if (e.key === 'Escape' && panelVisible.value && !plantaSeleccionada.value) cerrarPanel()
}

/* ---------- Drawer ---------- */
const pathActivo = computed(() => paths.value.find((x) => x.clave === activo.value) || null)
const estadoPanel = computed(() => datosPanel.value?.estado || pathActivo.value?.info || null)

const capitalPanel = computed(() => {
  const c = CAPITALES[activo.value]
  if (!c) return ''
  const n = c.replace(/,MX$/, '')
  return CAPITAL_VISIBLE[n] || n
})

// Navegación entre estados con plantas (orden alfabético)
const navegables = computed(() =>
  paths.value
    .filter((p) => p.conDatos)
    .sort((a, b) => a.info.nombreEstado.localeCompare(b.info.nombreEstado, 'es'))
)
function vecino(dir) {
  const actual = pathActivo.value
  if (!actual) return null
  const nombre = actual.info?.nombreEstado || actual.nombre
  const lista = navegables.value
  if (dir > 0) return lista.find((p) => p.info.nombreEstado.localeCompare(nombre, 'es') > 0) || null
  return [...lista].reverse().find((p) => p.info.nombreEstado.localeCompare(nombre, 'es') < 0) || null
}
const anterior = computed(() => vecino(-1))
const siguiente = computed(() => vecino(1))

function irA(p) {
  if (p) seleccionar(p)
}
function reintentar() {
  if (pathActivo.value) seleccionar(pathActivo.value)
}

// Clic en zona vacía del mapa (escritorio, fondo transparente) cierra el drawer
function onClicMapa() {
  if (panelVisible.value && escritorio.value) cerrarPanel()
}

// En pantallas anchas el mapa se desplaza y el fondo del drawer es transparente
const escritorio = ref(false)
let mql = null
function actualizarEscritorio() {
  escritorio.value = !!mql?.matches
}

onMounted(() => {
  cargarEstados()
  document.addEventListener('keydown', onKeyGlobal)
  mql = window.matchMedia('(min-width: 1200px)')
  actualizarEscritorio()
  mql.addEventListener?.('change', actualizarEscritorio)
})
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeyGlobal)
  mql?.removeEventListener?.('change', actualizarEscritorio)
})
</script>

<template>
  <div class="vista-mapa" :class="{ 'drawer-abierto': panelVisible && escritorio }">
    <div class="contenedor">
      <Breadcrumb :items="[{ label: 'Inicio', to: '/' }, { label: 'Mapa Interactivo' }]" />

      <h2 class="text-center titulo-mapa">Mapa Interactivo de México</h2>

      <div v-if="errorEstados" class="alerta-error text-center">
        {{ errorEstados }}
        <button type="button" class="enlace-boton" @click="cargarEstados">Reintentar</button>
      </div>

      <div class="mapa-layout">
        <div ref="mapaContenedor" class="mapa-svg-contenedor" :class="{ cargando: cargandoEstados }" @click="onClicMapa">
          <svg
            class="mapa-mexico"
            viewBox="0 0 1024 768"
            preserveAspectRatio="xMidYMid meet"
            xmlns="http://www.w3.org/2000/svg"
            role="group"
            aria-label="Mapa de los estados de México"
          >
            <path
              v-for="p in paths"
              :key="p.clave"
              :d="p.d"
              :data-clave="p.clave"
              class="estado-path"
              :class="{ 'tiene-datos': p.conDatos, 'sin-datos': !p.conDatos, 'sin-registro': !p.info, activo: activo === p.clave }"
              :tabindex="p.info ? 0 : -1"
              role="button"
              :aria-label="`${p.info?.nombreEstado || p.nombre}: ${p.info ? p.info.cantidadPlantas + ' planta(s)' : 'sin datos'}`"
              :aria-pressed="activo === p.clave"
              @mouseenter="mostrarTooltip(p, $event)"
              @mousemove="moverTooltip"
              @mouseleave="ocultarTooltip"
              @focus="mostrarTooltip(p, null)"
              @blur="ocultarTooltip"
              @click="p.info && $event.stopPropagation(); seleccionar(p)"
              @keydown="onKeyPath($event, p)"
            />
          </svg>

          <div
            v-show="tooltip.visible && tooltip.x"
            class="tooltip-estado"
            :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
            aria-hidden="true"
          >
            <strong>{{ tooltip.nombre }}</strong>
            <span>{{ tooltip.detalle }}</span>
          </div>

          <div class="leyenda" aria-label="Leyenda" @click.stop>
            <span><i class="muestra muestra-datos"></i> Con plantas ({{ totalConDatos }})</span>
            <span><i class="muestra muestra-sin"></i> Sin datos</span>
            <span><i class="muestra muestra-activo"></i> Seleccionado</span>
          </div>
        </div>
      </div>
    </div>

    <EstadoDrawer
      :abierto="panelVisible"
      :estado="estadoPanel"
      :plantas="datosPanel?.plantas || []"
      :cargando="cargandoPanel"
      :error="errorPanel"
      :clima="climaPanel"
      :clima-cargando="climaCargando"
      :capital="capitalPanel"
      :hay-anterior="!!anterior"
      :hay-siguiente="!!siguiente"
      :modo-escritorio="escritorio"
      @cerrar="cerrarPanel"
      @anterior="irA(anterior)"
      @siguiente="irA(siguiente)"
      @abrir-planta="abrirPlanta"
      @reintentar="reintentar"
    />

    <PlantaDetalleModal :show="!!plantaSeleccionada" :planta="plantaSeleccionada" @close="plantaSeleccionada = null" />
  </div>
</template>

<style scoped>
.vista-mapa {
  background-color: #e1f5fe;
  min-height: calc(100vh - var(--alto-header));
  margin-bottom: -50px; /* el fondo de agua llega hasta el footer */
  padding-bottom: 80px;
}
.vista-mapa :deep(.camino) { border-bottom-color: #b3e5fc; }
.titulo-mapa { margin: 0 0 16px; color: #1d2b22; }
.enlace-boton { background: none; border: none; color: inherit; font-weight: bold; text-decoration: underline; cursor: pointer; }

.mapa-layout {
  position: relative;
  width: 100%;
  transition: padding-right 0.28s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.mapa-svg-contenedor {
  position: relative;
  padding: 10px 0 20px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 400px;
}
.mapa-svg-contenedor.cargando .mapa-mexico { opacity: 0.6; }
.mapa-mexico {
  width: 100%;
  max-width: 900px;
  height: auto;
  filter: drop-shadow(0 5px 10px rgba(0, 0, 0, 0.1));
  transition: opacity 0.3s;
  overflow: visible;
}

.estado-path {
  fill: #c8e6c9;
  stroke: #ffffff;
  stroke-width: 1.5;
  cursor: pointer;
  transition: fill 0.2s ease, stroke 0.2s ease, stroke-width 0.2s ease;
  outline: none;
}
.estado-path.tiene-datos { fill: #a5d6a7; }
.estado-path.sin-datos { fill: #f5f5f5; stroke: #cccccc; }
.estado-path.sin-registro { cursor: default; }
.estado-path:hover,
.estado-path:focus-visible { fill: #66bb6a; stroke: #1b5e20; stroke-width: 2.5; }
.estado-path.sin-registro:hover { fill: #eeeeee; stroke: #bbb; stroke-width: 1.5; }
.estado-path.activo { fill: #2e7d32; stroke: #003300; stroke-width: 3; }

.tooltip-estado {
  position: absolute;
  background: rgba(0, 0, 0, 0.85);
  color: white;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 0.85rem;
  pointer-events: none;
  z-index: 20;
  display: flex;
  flex-direction: column;
  gap: 3px;
  max-width: 240px;
  white-space: nowrap;
  transform: translate(-50%, calc(-100% - 16px));
}
.tooltip-estado strong { font-size: 0.95rem; }
.tooltip-estado span { font-size: 0.8rem; opacity: 0.85; }

.leyenda {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px 18px;
  background: rgba(255, 255, 255, 0.85);
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.85rem;
  color: #444;
  margin-top: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}
.leyenda span { display: inline-flex; align-items: center; gap: 6px; }
.muestra { display: inline-block; width: 14px; height: 14px; border-radius: 4px; border: 1px solid rgba(0, 0, 0, 0.15); }
.muestra-datos { background: #a5d6a7; }
.muestra-sin { background: #f5f5f5; }
.muestra-activo { background: #2e7d32; }

/* Drawer abierto en escritorio: el mapa se desplaza para no quedar tapado */
@media (min-width: 1200px) {
  .vista-mapa.drawer-abierto .mapa-layout { padding-right: 420px; }
}

@media (max-width: 900px) {
  .mapa-svg-contenedor { min-height: 0; }
  .tooltip-estado { display: none !important; }
  .leyenda { font-size: 0.78rem; }
}
</style>
