<script setup>
import Icono from '@/components/Icono.vue'
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api, { mensajeError } from '@/services/api'
import { useToast } from '@/composables/useToast'
import BaseModal from '@/components/BaseModal.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'
import PanelPageHeader from '@/components/panel/PanelPageHeader.vue'
import PanelToolbar from '@/components/panel/PanelToolbar.vue'
import PanelList from '@/components/panel/PanelList.vue'
import StatusBadge from '@/components/panel/StatusBadge.vue'
import RowMenu from '@/components/panel/RowMenu.vue'
import PanelSearch from '@/components/panel/PanelSearch.vue'
import PanelSelect from '@/components/panel/PanelSelect.vue'
import PanelIcon from '@/components/panel/PanelIcon.vue'

const toast = useToast()
const route = useRoute()
const router = useRouter()

const POR_PAGINA = 20

const CLIMAS = [
  { valor: 'tropical', label: 'Tropical' },
  { valor: 'arido', label: 'Árido' },
  { valor: 'templado', label: 'Templado' },
  { valor: 'frio', label: 'Frío' },
]
const LUCES = [
  { valor: 'sol_directo', label: 'Sol Directo' },
  { valor: 'sombra_parcial', label: 'Sombra Parcial' },
  { valor: 'sombra', label: 'Sombra' },
]
const OPC_CLIMAS = CLIMAS.map((c) => ({ value: c.valor, label: c.label }))
const OPC_LUCES = LUCES.map((l) => ({ value: l.valor, label: l.label }))
const TONO_CLIMA = { tropical: 'green', arido: 'yellow', templado: 'blue', frio: 'purple' }
const etiquetaClima = (v) => CLIMAS.find((c) => c.valor === v)?.label || v || '—'
const etiquetaLuz = (v) => LUCES.find((l) => l.valor === v)?.label || v || '—'

const plantas = ref([])
const estados = ref([])
const cargando = ref(true)
const errorCarga = ref('')

const texto = ref('')
const filtroEstado = ref('')
const filtroClima = ref('')
const pagina = ref(1)

function normalizar(s) {
  return (s || '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

const opcEstados = computed(() => estados.value.map((e) => ({ value: String(e.idEstado), label: e.nombreEstado })))
const opcEstadosForm = computed(() => estados.value.map((e) => ({ value: e.idEstado, label: e.nombreEstado })))
const hayFiltros = computed(() => !!(texto.value || filtroEstado.value || filtroClima.value))
function limpiarFiltros() {
  texto.value = ''
  filtroEstado.value = ''
  filtroClima.value = ''
}

const plantasFiltradas = computed(() => {
  const q = normalizar(texto.value.trim())
  return plantas.value.filter((p) => {
    if (filtroEstado.value && String(p.idEstado) !== String(filtroEstado.value)) return false
    if (filtroClima.value && p.tipoClima !== filtroClima.value) return false
    if (!q) return true
    return normalizar(p.nombrePlanta).includes(q) || normalizar(p.nombreCientifico).includes(q)
  })
})

const plantasPagina = computed(() =>
  plantasFiltradas.value.slice((pagina.value - 1) * POR_PAGINA, pagina.value * POR_PAGINA)
)
watch([texto, filtroEstado, filtroClima], () => (pagina.value = 1))

function formatoFecha(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function menu(p) {
  return [
    { label: 'Editar', icon: 'edit', action: () => abrirEditar(p) },
    { label: 'Eliminar', icon: 'trash', danger: true, action: () => (aEliminar.value = p) },
  ]
}

async function cargar() {
  cargando.value = true
  errorCarga.value = ''
  try {
    const [resPlantas, resEstados] = await Promise.all([api.get('/plantas'), api.get('/estados')])
    plantas.value = Array.isArray(resPlantas.data) ? resPlantas.data : []
    estados.value = Array.isArray(resEstados.data) ? resEstados.data : []
  } catch (err) {
    errorCarga.value = mensajeError(err)
  } finally {
    cargando.value = false
  }
}
onMounted(() => {
  cargar()
  // Acceso rápido desde el Dashboard: /panel/...?nuevo=1 abre el modal de crear
  if (route.query.nuevo !== undefined) {
    abrirNueva()
    // Se limpia la URL sin router.replace: PanelLayout usa :key="fullPath" y un cambio de query
    // volvería a montar la vista (cerrando el modal recién abierto).
    const { nuevo, ...resto } = route.query
    const limpia = router.resolve({ path: route.path, query: resto, hash: route.hash }).href
    window.history.replaceState(window.history.state, '', limpia)
  }
})

/* ---------- Miniaturas con error ---------- */
const miniaturasRotas = ref(new Set())
function marcarRota(id) {
  miniaturasRotas.value = new Set(miniaturasRotas.value).add(id)
}

/* ---------- Modal crear / editar ---------- */
const VACIA = {
  nombrePlanta: '',
  nombreCientifico: '',
  idEstado: '',
  urlImagen: '',
  tipoClima: 'templado',
  luzSol: 'sol_directo',
  riego: '',
  descripcion: '',
  cuidadosTexto: '',
}
const modalAbierto = ref(false)
const editandoId = ref(null)
const form = reactive({ ...VACIA })
const errores = ref({})
const errorForm = ref('')
const guardando = ref(false)
const imagenFallo = ref(false)

const urlImagenValida = computed(() => /^https?:\/\/\S+$/i.test(form.urlImagen.trim()))
watch(
  () => form.urlImagen,
  () => (imagenFallo.value = false)
)

function abrirNueva() {
  Object.assign(form, VACIA)
  editandoId.value = null
  errores.value = {}
  errorForm.value = ''
  modalAbierto.value = true
}
function abrirEditar(p) {
  Object.assign(form, {
    nombrePlanta: p.nombrePlanta || '',
    nombreCientifico: p.nombreCientifico || '',
    idEstado: p.idEstado ?? '',
    urlImagen: p.urlImagen || '',
    tipoClima: p.tipoClima || 'templado',
    luzSol: p.luzSol || 'sol_directo',
    riego: p.riego || '',
    descripcion: p.descripcion || '',
    cuidadosTexto: p.cuidadosTexto || '',
  })
  editandoId.value = p.idPlanta
  errores.value = {}
  errorForm.value = ''
  modalAbierto.value = true
}
function cerrarModal() {
  if (!guardando.value) modalAbierto.value = false
}

function errorCampo(campo) {
  const e = errores.value[campo]
  return Array.isArray(e) ? e[0] : e || ''
}

const textoONull = (v) => (v || '').trim() || null

// Mantiene el mismo orden que la API: estado, letra inicial, nombre
function ordenar(lista) {
  return [...lista].sort(
    (a, b) =>
      (a.nombreEstado || '').localeCompare(b.nombreEstado || '', 'es') ||
      (a.nombrePlanta || '').localeCompare(b.nombrePlanta || '', 'es')
  )
}

async function guardar() {
  if (guardando.value) return
  guardando.value = true
  errores.value = {}
  errorForm.value = ''
  const payload = {
    nombrePlanta: form.nombrePlanta.trim(),
    nombreCientifico: textoONull(form.nombreCientifico),
    idEstado: form.idEstado === '' ? null : Number(form.idEstado),
    urlImagen: textoONull(form.urlImagen),
    tipoClima: form.tipoClima,
    luzSol: form.luzSol,
    riego: textoONull(form.riego),
    descripcion: textoONull(form.descripcion),
    cuidadosTexto: textoONull(form.cuidadosTexto),
  }
  try {
    if (editandoId.value) {
      const { data } = await api.put(`/plantas/${editandoId.value}`, payload)
      plantas.value = ordenar(plantas.value.map((p) => (p.idPlanta === editandoId.value ? data : p)))
      toast.success(`La planta «${data.nombrePlanta}» se actualizó correctamente.`)
    } else {
      const { data } = await api.post('/plantas', payload)
      plantas.value = ordenar([...plantas.value, data])
      toast.success(`La planta «${data.nombrePlanta}» se agregó al catálogo.`)
    }
    modalAbierto.value = false
  } catch (err) {
    errores.value = err?.response?.data?.errors || {}
    errorForm.value = Object.keys(errores.value).length
      ? err.response.data.message || 'Revisa los datos del formulario.'
      : mensajeError(err)
  } finally {
    guardando.value = false
  }
}

/* ---------- Eliminar ---------- */
const aEliminar = ref(null)
const eliminando = ref(false)
async function confirmarEliminar() {
  if (!aEliminar.value) return
  eliminando.value = true
  try {
    await api.delete(`/plantas/${aEliminar.value.idPlanta}`)
    plantas.value = plantas.value.filter((p) => p.idPlanta !== aEliminar.value.idPlanta)
    const paginas = Math.max(1, Math.ceil(plantasFiltradas.value.length / POR_PAGINA))
    if (pagina.value > paginas) pagina.value = paginas
    toast.success('La planta fue eliminada del catálogo.')
    aEliminar.value = null
  } catch (err) {
    toast.error(mensajeError(err))
  } finally {
    eliminando.value = false
  }
}
</script>

<template>
  <div>
    <PanelPageHeader title="Plantas">
      <template #actions>
        <button type="button" class="boton-panel" @click="abrirNueva"><PanelIcon name="plus" :size="16" /> Nueva planta</button>
      </template>
    </PanelPageHeader>

    <PanelToolbar>
      <PanelSearch v-model="texto" placeholder="Buscar planta..." aria-label="Buscar plantas" />
      <PanelSelect v-model="filtroEstado" :options="opcEstados" placeholder="Todos los estados" aria-label="Filtrar por estado" />
      <PanelSelect v-model="filtroClima" :options="OPC_CLIMAS" placeholder="Todos los climas" aria-label="Filtrar por clima" />
      <button v-if="hayFiltros" type="button" class="boton-panel gris" @click="limpiarFiltros">Limpiar</button>
    </PanelToolbar>

    <div v-if="errorCarga" class="alerta-error" role="alert">
      <strong>Error:</strong> {{ errorCarga }}
      <button type="button" class="enlace" @click="cargar">Reintentar</button>
    </div>

    <PanelList
      v-else
      :items="plantasPagina"
      :loading="cargando"
      :total="plantasFiltradas.length"
      :page="pagina"
      :page-size="POR_PAGINA"
      item-label="plantas"
      :empty-text="plantas.length ? 'Ninguna planta coincide con la búsqueda.' : 'Aún no hay plantas en el catálogo.'"
      @update:page="pagina = $event"
    >
      <template #row="{ item: p }">
        <div class="fila clicable" @click="abrirEditar(p)">
          <img
            v-if="p.urlImagen && !miniaturasRotas.has(p.idPlanta)"
            :src="p.urlImagen"
            :alt="p.nombrePlanta"
            class="fila-miniatura img-preview-mini"
            loading="lazy"
            @error="marcarRota(p.idPlanta)"
          />
          <span v-else class="fila-miniatura vacia" aria-hidden="true"><Icono nombre="brote" :tamano="22" /></span>
          <div class="fila-principal">
            <div class="fila-titulo">
              <strong>{{ p.nombrePlanta }}</strong><em class="cientifico">{{ p.nombreCientifico }}</em>
            </div>
            <div class="fila-meta">
              <span><Icono nombre="ubicacion" :tamano="14" /> {{ p.nombreEstado || 'Sin estado' }}</span>
              <span><Icono nombre="sol" :tamano="14" /> {{ etiquetaLuz(p.luzSol) }}</span>
              <span v-if="p.riego"><Icono nombre="gota" :tamano="14" /> {{ p.riego }}</span>
            </div>
          </div>
          <span class="fila-fecha" title="Última actualización">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            {{ formatoFecha(p.updatedAt || p.createdAt) }}
          </span>
          <div class="fila-estado">
            <StatusBadge :label="etiquetaClima(p.tipoClima)" :tone="TONO_CLIMA[p.tipoClima] || 'gray'" />
          </div>
          <div class="fila-menu" @click.stop>
            <RowMenu :items="menu(p)" />
          </div>
          <span class="fila-chevron" aria-hidden="true">›</span>
        </div>
      </template>
    </PanelList>

    <BaseModal :show="modalAbierto" :title="editandoId ? 'Editar planta' : 'Nueva planta'" size="lg" @close="cerrarModal">
      <form id="form-planta" class="form-modal" @submit.prevent="guardar">
        <div v-if="errorForm" class="alerta-error" role="alert"><strong>Aviso:</strong> {{ errorForm }}</div>

        <div class="rejilla">
          <div class="grupo-entrada">
            <label for="nombrePlanta">Nombre común *</label>
            <input
              id="nombrePlanta"
              v-model="form.nombrePlanta"
              type="text"
              required
              maxlength="255"
              placeholder="Ej: Biznaga"
              :class="{ 'borde-error': errorCampo('nombrePlanta') }"
            />
            <small v-if="errorCampo('nombrePlanta')" class="msg-error">{{ errorCampo('nombrePlanta') }}</small>
          </div>

          <div class="grupo-entrada">
            <label for="nombreCientifico">Nombre científico</label>
            <input
              id="nombreCientifico"
              v-model="form.nombreCientifico"
              type="text"
              maxlength="255"
              placeholder="Ej: Echinocactus platyacanthus"
              :class="{ 'borde-error': errorCampo('nombreCientifico') }"
            />
            <small v-if="errorCampo('nombreCientifico')" class="msg-error">{{ errorCampo('nombreCientifico') }}</small>
          </div>

          <div class="grupo-entrada">
            <label for="idEstado">Estado</label>
            <PanelSelect id="idEstado" v-model="form.idEstado" class="en-form" :options="opcEstadosForm" placeholder="Sin estado" :invalid="!!errorCampo('idEstado')" />
            <small v-if="errorCampo('idEstado')" class="msg-error">{{ errorCampo('idEstado') }}</small>
          </div>

          <div class="grupo-entrada">
            <label for="riego">Riego</label>
            <input
              id="riego"
              v-model="form.riego"
              type="text"
              maxlength="100"
              placeholder="Ej: Escaso, cada 3 semanas"
              :class="{ 'borde-error': errorCampo('riego') }"
            />
            <small v-if="errorCampo('riego')" class="msg-error">{{ errorCampo('riego') }}</small>
          </div>

          <div class="grupo-entrada">
            <label for="tipoClima">Tipo de clima</label>
            <PanelSelect id="tipoClima" v-model="form.tipoClima" class="en-form" :options="OPC_CLIMAS" :invalid="!!errorCampo('tipoClima')" />
            <small v-if="errorCampo('tipoClima')" class="msg-error">{{ errorCampo('tipoClima') }}</small>
          </div>

          <div class="grupo-entrada">
            <label for="luzSol">Luz solar</label>
            <PanelSelect id="luzSol" v-model="form.luzSol" class="en-form" :options="OPC_LUCES" :invalid="!!errorCampo('luzSol')" />
            <small v-if="errorCampo('luzSol')" class="msg-error">{{ errorCampo('luzSol') }}</small>
          </div>
        </div>

        <div class="grupo-entrada">
          <label for="urlImagen">URL de Imagen</label>
          <input
            id="urlImagen"
            v-model="form.urlImagen"
            type="url"
            maxlength="500"
            placeholder="https://ejemplo.com/planta.jpg"
            :class="{ 'borde-error': errorCampo('urlImagen') }"
          />
          <small v-if="errorCampo('urlImagen')" class="msg-error">{{ errorCampo('urlImagen') }}</small>
          <div v-if="urlImagenValida" class="vista-previa">
            <img v-if="!imagenFallo" :src="form.urlImagen.trim()" alt="Vista previa de la planta" @error="imagenFallo = true" />
            <span v-else class="color-gris">No se pudo cargar la imagen. Revisa la URL.</span>
          </div>
        </div>

        <div class="grupo-entrada">
          <label for="descripcion">Descripción</label>
          <textarea
            id="descripcion"
            v-model="form.descripcion"
            placeholder="Origen y características"
            :class="{ 'borde-error': errorCampo('descripcion') }"
          ></textarea>
          <small v-if="errorCampo('descripcion')" class="msg-error">{{ errorCampo('descripcion') }}</small>
        </div>

        <div class="grupo-entrada">
          <label for="cuidadosTexto">Cuidados</label>
          <textarea
            id="cuidadosTexto"
            v-model="form.cuidadosTexto"
            :placeholder="'Riego: ...\nLuz: ...'"
            :class="{ 'borde-error': errorCampo('cuidadosTexto') }"
          ></textarea>
          <small v-if="errorCampo('cuidadosTexto')" class="msg-error">{{ errorCampo('cuidadosTexto') }}</small>
          <small v-else class="ayuda">Uno por línea.</small>
        </div>
      </form>

      <template #footer>
        <button type="button" class="boton-panel gris" :disabled="guardando" @click="cerrarModal">Cancelar</button>
        <button type="submit" form="form-planta" class="boton-panel" :disabled="guardando">
          <template v-if="guardando">Guardando...</template>
          <template v-else>{{ editandoId ? 'Guardar cambios' : 'Agregar planta' }}</template>
        </button>
      </template>
    </BaseModal>

    <ConfirmModal
      :show="!!aEliminar"
      title="Eliminar planta"
      :message="aEliminar ? `Se eliminará «${aEliminar.nombrePlanta}». No se puede deshacer.` : ''"
      confirm-text="Eliminar"
      variant="danger"
      :loading="eliminando"
      @confirm="confirmarEliminar"
      @cancel="aEliminar = null"
    />
  </div>
</template>

<style scoped src="./filas-panel.css"></style>
<style scoped>
.cientifico {
  color: #66736a;
  font-weight: normal;
  font-size: 0.85rem;
}
.rejilla {
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: 16px;
}
.form-modal .grupo-entrada textarea {
  min-height: 90px;
}
.vista-previa {
  margin-top: 10px;
  text-align: center;
}
.vista-previa img {
  max-width: 100%;
  max-height: 220px;
  border-radius: 10px;
  object-fit: cover;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
.ayuda {
  display: block;
  margin-top: 5px;
  color: #7f8c8d;
  font-size: 0.8rem;
}
@media (max-width: 600px) {
  .rejilla {
    grid-template-columns: 1fr;
  }
}
</style>
