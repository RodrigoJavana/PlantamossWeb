<script setup>
import Icono from '@/components/Icono.vue'
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api, { mensajeError } from '@/services/api'
import Breadcrumb from '@/components/Breadcrumb.vue'
import PlantaImagen from '@/components/PlantaImagen.vue'
import PlantaDetalleModal from '@/components/PlantaDetalleModal.vue'
import PanelSelect from '@/components/panel/PanelSelect.vue'
import { CLIMAS, LUCES, etiquetaClima, etiquetaLuz } from '@/utils/plantas'
import { useInsigniasStore } from '@/stores/insignias'

const route = useRoute()
const router = useRouter()
const insignias = useInsigniasStore()

// Abre el detalle de una planta y cuenta la visita para las insignias.
function abrirPlanta(p) {
  seleccionada.value = p
  insignias.evento('VER_PLANTA', p.idPlanta)
}

const estados = ref([])
const plantas = ref([])
const cargando = ref(true)
const error = ref('')
const seleccionada = ref(null)

// Filtros (sincronizados con la query de la URL)
const texto = ref(String(route.query.q || ''))
const filtros = computed(() => ({
  q: String(route.query.q || ''),
  estado: String(route.query.estado || ''),
  clima: String(route.query.clima || ''),
  luz: String(route.query.luz || '')
}))
const opcEstados = computed(() => estados.value.map((e) => ({ value: String(e.idEstado), label: e.nombreEstado })))
const opcClimas = CLIMAS.map((c) => ({ value: c.valor, label: c.etiqueta }))
const opcLuces = LUCES.map((l) => ({ value: l.valor, label: l.etiqueta }))
const hayFiltros = computed(() => Object.values(filtros.value).some(Boolean))

function actualizarQuery(cambios) {
  const q = { ...route.query, ...cambios }
  Object.keys(q).forEach((k) => { if (q[k] === '' || q[k] == null) delete q[k] })
  router.replace({ query: q })
}

let debounce = null
watch(texto, (v) => {
  clearTimeout(debounce)
  debounce = setTimeout(() => actualizarQuery({ q: v.trim() }), 350)
})
// Si la URL cambia desde fuera (atrás/adelante), reflejarla en el input.
watch(() => route.query.q, (v) => {
  const val = String(v || '')
  if (val !== texto.value.trim()) texto.value = val
})

function limpiarFiltros() {
  clearTimeout(debounce)
  texto.value = ''
  router.replace({ query: {} })
}

let peticion = 0
async function buscar() {
  const id = ++peticion
  cargando.value = true
  error.value = ''
  try {
    const params = {}
    for (const [k, v] of Object.entries(filtros.value)) if (v) params[k] = v
    const { data } = await api.get('/plantas', { params })
    if (id !== peticion) return
    plantas.value = Array.isArray(data) ? data : []
  } catch (err) {
    if (id !== peticion) return
    error.value = mensajeError(err, 'Error al conectar con el vivero.')
    plantas.value = []
  } finally {
    if (id === peticion) cargando.value = false
  }
}

async function cargarEstados() {
  try {
    const { data } = await api.get('/estados')
    estados.value = Array.isArray(data) ? data : []
  } catch {
    estados.value = []
  }
}

// Agrupación por estado, como en el original ("Estado de X")
const grupos = computed(() => {
  const mapa = new Map()
  for (const p of plantas.value) {
    const clave = p.nombreEstado || 'Sin estado asignado'
    if (!mapa.has(clave)) mapa.set(clave, [])
    mapa.get(clave).push(p)
  }
  return [...mapa.entries()].map(([nombre, lista]) => ({
    nombre,
    // "Estado de X" como el original, sin duplicar en "Estado de México" ni forzarlo en "Ciudad de México"
    titulo: nombre === 'Sin estado asignado' || /^(estado|ciudad) de /i.test(nombre) ? nombre : `Estado de ${nombre}`,
    lista
  }))
})

watch(filtros, buscar, { deep: true })

onMounted(() => {
  cargarEstados()
  buscar()
})
onBeforeUnmount(() => clearTimeout(debounce))
</script>

<template>
  <div class="vista-catalogo">
    <div class="contenedor">
      <Breadcrumb :items="[{ label: 'Inicio', to: '/' }, { label: 'Catálogo' }]" />

      <div class="cabecera-pegajosa">
        <div class="cabecera-titulo">
          <h1 class="titulo-pagina">Catálogo de plantas</h1>
          <p class="contador" aria-live="polite">
            <template v-if="cargando">Buscando...</template>
            <template v-else-if="!error">{{ plantas.length }} {{ plantas.length === 1 ? 'planta' : 'plantas' }}</template>
          </p>
        </div>

        <div class="filtros-catalogo" role="search">
          <div class="campo-busqueda">
            <span class="lupa" aria-hidden="true"><Icono nombre="buscar" :tamano="16" /></span>
            <input
              v-model="texto"
              type="search"
              class="barra-busqueda"
              placeholder="Buscar planta..."
              aria-label="Buscar planta"
            />
          </div>
          <PanelSelect class="select-filtro" :model-value="filtros.estado" :options="opcEstados" placeholder="Todos los estados" aria-label="Filtrar por estado" @update:model-value="actualizarQuery({ estado: $event })" />
          <PanelSelect class="select-filtro" :model-value="filtros.clima" :options="opcClimas" placeholder="Todos los climas" aria-label="Filtrar por clima" @update:model-value="actualizarQuery({ clima: $event })" />
          <PanelSelect class="select-filtro" :model-value="filtros.luz" :options="opcLuces" placeholder="Toda la luz" aria-label="Filtrar por luz" @update:model-value="actualizarQuery({ luz: $event })" />
          <button v-if="hayFiltros || texto" type="button" class="boton-limpiar" @click="limpiarFiltros"><Icono nombre="cerrar" :tamano="14" /> Limpiar</button>
        </div>
      </div>

      <!-- Skeleton -->
      <div v-if="cargando" class="cuadricula-flora" aria-hidden="true">
        <div v-for="n in 8" :key="n" class="tarjeta-skeleton">
          <div class="skeleton skeleton-img"></div>
          <div class="skeleton-contenido">
            <div class="skeleton skeleton-linea ancha"></div>
            <div class="skeleton skeleton-linea corta"></div>
          </div>
        </div>
      </div>

      <div v-else-if="error" class="estado-vacio">
        <div class="estado-vacio-icono"><Icono nombre="alerta" class="icono-em" /></div>
        <h3>No pudimos cargar el catálogo</h3>
        <p>{{ error }}</p>
        <button type="button" class="boton-secundario mt-15" @click="buscar">Reintentar</button>
      </div>

      <div v-else-if="!plantas.length" class="estado-vacio">
        <div class="estado-vacio-icono"><Icono nombre="sinResultados" class="icono-em" /></div>
        <h3>Sin resultados</h3>
        <button v-if="hayFiltros" type="button" class="boton-secundario mt-15" @click="limpiarFiltros">Limpiar filtros</button>
      </div>

      <template v-else>
        <section v-for="g in grupos" :key="g.nombre" class="grupo-region">
          <h3 class="titulo-region">
            <span>{{ g.titulo }}</span>
            <small class="titulo-region-cuenta">{{ g.lista.length }}</small>
          </h3>
          <div class="cuadricula-flora">
            <button
              v-for="p in g.lista"
              :key="p.idPlanta"
              type="button"
              class="tarjeta-flora"
              :aria-label="`Ver detalles de ${p.nombrePlanta}`"
              @click="abrirPlanta(p)"
            >
              <PlantaImagen :src="p.urlImagen" :alt="p.nombrePlanta" />
              <div class="contenido-botanico">
                <div>
                  <h3>{{ p.letraInicial }} - {{ p.nombrePlanta }}</h3>
                  <p v-if="p.nombreCientifico" class="cientifico"><em>{{ p.nombreCientifico }}</em></p>
                </div>
                <div class="chips chips-tarjeta">
                  <span v-if="etiquetaClima(p.tipoClima)" class="chip chip-clima"><Icono :nombre="etiquetaClima(p.tipoClima).icono" :tamano="14" /> {{ etiquetaClima(p.tipoClima).etiqueta }}</span>
                  <span v-if="etiquetaLuz(p.luzSol)" class="chip chip-luz"><Icono :nombre="etiquetaLuz(p.luzSol).icono" :tamano="14" /> {{ etiquetaLuz(p.luzSol).etiqueta }}</span>
                </div>
              </div>
            </button>
          </div>
        </section>
      </template>
    </div>

    <PlantaDetalleModal :show="!!seleccionada" :planta="seleccionada" @close="seleccionada = null" />
  </div>
</template>

<style scoped>
.cabecera-pegajosa {
  position: sticky;
  top: var(--alto-header);
  z-index: 100;
  background-color: var(--fondo);
  padding: 10px 0 6px;
  margin-bottom: 20px;
  box-shadow: 0 10px 12px -12px rgba(0, 0, 0, 0.15);
}
.cabecera-titulo { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
.titulo-pagina { margin: 0 0 12px; color: #1d2b22; font-size: 1.6rem; font-weight: 800; }
.contador { margin: 0; color: #66736a; font-size: 0.88rem; font-weight: 600; }

.filtros-catalogo { display: flex; gap: 10px; margin-bottom: 10px; width: 100%; flex-wrap: wrap; align-items: center; }
.campo-busqueda { position: relative; flex: 1; min-width: 220px; }
.campo-busqueda .barra-busqueda { max-width: none; padding-left: 36px; }
.lupa { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #9aa59e; display: inline-flex; }
.select-filtro {
  flex: 0 1 190px;
}
.boton-limpiar {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid #e5e9e6;
  background: #fff;
  color: #1d2b22;
  border-radius: 10px;
  padding: 9px 14px;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.2s;
}
.boton-limpiar:hover { background: #f2f4f3; }

.titulo-region-cuenta {
  font-size: 0.78rem;
  background: #fff;
  border: 1px solid #e5e9e6;
  color: #66736a;
  border-radius: 999px;
  padding: 2px 10px;
}
.cientifico { margin: 0 0 12px; color: #66736a; font-size: 0.88rem; }
.chips-tarjeta { margin-top: 4px; }
.mt-15 { margin-top: 15px; }

@media (max-width: 900px) {
  .cabecera-pegajosa { position: static; box-shadow: none; }
}
@media (max-width: 768px) {
  .filtros-catalogo { flex-direction: column; align-items: stretch; }
  .select-filtro, .campo-busqueda { flex: 1 1 auto; width: 100%; max-width: none; }
  .boton-limpiar { width: 100%; }
  .titulo-region { font-size: 1.2rem; }
}
</style>
