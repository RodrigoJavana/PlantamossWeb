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

const noticias = ref([])
const cargando = ref(true)
const errorCarga = ref('')

const texto = ref('')
const filtroEstado = ref('')
const OPC_ESTADO = [
  { value: 'activa', label: 'Activas' },
  { value: 'inactiva', label: 'Inactivas' },
  { value: 'destacada', label: 'Destacadas' },
]

function normalizar(s) {
  return (s || '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

const noticiasFiltradas = computed(() => {
  const q = normalizar(texto.value.trim())
  return noticias.value.filter((n) => {
    if (filtroEstado.value === 'activa' && !n.activa) return false
    if (filtroEstado.value === 'inactiva' && n.activa) return false
    if (filtroEstado.value === 'destacada' && !n.destacada) return false
    if (!q) return true
    return normalizar(n.titulo).includes(q) || normalizar(n.contenido).includes(q)
  })
})

const pagina = ref(1)
const noticiasPagina = computed(() =>
  noticiasFiltradas.value.slice((pagina.value - 1) * POR_PAGINA, pagina.value * POR_PAGINA)
)
watch([texto, filtroEstado], () => (pagina.value = 1))

const miniaturasRotas = ref(new Set())
function marcarRota(id) {
  miniaturasRotas.value = new Set(miniaturasRotas.value).add(id)
}

function menu(n) {
  return [
    { label: 'Editar', icon: 'edit', action: () => abrirEditar(n) },
    {
      label: n.activa ? 'Desactivar' : 'Activar',
      icon: n.activa ? 'eyeOff' : 'eye',
      disabled: alternando.value === n.idNoticia,
      action: () => alternar(n),
    },
    ...(n.urlExterna ? [{ label: 'Abrir enlace externo', icon: 'link', action: () => window.open(n.urlExterna, '_blank', 'noopener') }] : []),
    { label: 'Eliminar', icon: 'trash', danger: true, action: () => (aEliminar.value = n) },
  ]
}

async function cargar() {
  cargando.value = true
  errorCarga.value = ''
  try {
    const { data } = await api.get('/editor/noticias')
    noticias.value = Array.isArray(data) ? data : []
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

function truncar(t, n = 40) {
  if (!t) return ''
  return t.length > n ? t.slice(0, n) + '...' : t
}
function formatoFecha(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

/* ---------- Modal crear / editar ---------- */
const VACIA = { titulo: '', contenido: '', urlImagen: '', urlExterna: '', destacada: false }
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
function abrirEditar(n) {
  Object.assign(form, {
    titulo: n.titulo || '',
    contenido: n.contenido || '',
    urlImagen: n.urlImagen || '',
    urlExterna: n.urlExterna || '',
    destacada: !!n.destacada,
  })
  editandoId.value = n.idNoticia
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

async function guardar() {
  if (guardando.value) return
  guardando.value = true
  errores.value = {}
  errorForm.value = ''
  const payload = {
    titulo: form.titulo.trim(),
    contenido: form.contenido.trim(),
    urlImagen: form.urlImagen.trim() || null,
    urlExterna: form.urlExterna.trim() || null,
    destacada: form.destacada,
  }
  try {
    if (editandoId.value) {
      const { data } = await api.put(`/editor/noticias/${editandoId.value}`, payload)
      const i = noticias.value.findIndex((n) => n.idNoticia === editandoId.value)
      if (i !== -1) noticias.value[i] = data
      toast.success('Noticia actualizada correctamente.')
    } else {
      const { data } = await api.post('/editor/noticias', payload)
      noticias.value.unshift(data)
      toast.success('Noticia publicada correctamente.')
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

/* ---------- Activar / desactivar ---------- */
const alternando = ref(null)
async function alternar(n) {
  alternando.value = n.idNoticia
  try {
    const { data } = await api.patch(`/editor/noticias/${n.idNoticia}/toggle`)
    const i = noticias.value.findIndex((x) => x.idNoticia === n.idNoticia)
    if (i !== -1) noticias.value[i] = data
    toast.success(data.activa ? 'La noticia ahora está activa.' : 'La noticia fue desactivada.')
  } catch (err) {
    toast.error(mensajeError(err))
  } finally {
    alternando.value = null
  }
}

/* ---------- Eliminar ---------- */
const aEliminar = ref(null)
const eliminando = ref(false)
async function confirmarEliminar() {
  if (!aEliminar.value) return
  eliminando.value = true
  try {
    await api.delete(`/editor/noticias/${aEliminar.value.idNoticia}`)
    noticias.value = noticias.value.filter((n) => n.idNoticia !== aEliminar.value.idNoticia)
    const paginas = Math.max(1, Math.ceil(noticiasFiltradas.value.length / POR_PAGINA))
    if (pagina.value > paginas) pagina.value = paginas
    toast.success('Noticia eliminada correctamente.')
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
    <PanelPageHeader title="Noticias">
      <template #actions>
        <button type="button" class="boton-panel" @click="abrirNueva"><PanelIcon name="plus" :size="16" /> Nueva noticia</button>
      </template>
    </PanelPageHeader>

    <PanelToolbar>
      <PanelSearch v-model="texto" placeholder="Buscar noticia..." aria-label="Buscar noticias" />
      <PanelSelect v-model="filtroEstado" :options="OPC_ESTADO" placeholder="Todas" aria-label="Filtrar por estado" />
      <button v-if="texto || filtroEstado" type="button" class="boton-panel gris" @click="texto = ''; filtroEstado = ''">Limpiar</button>
    </PanelToolbar>

    <div v-if="errorCarga" class="alerta-error" role="alert">
      <strong>Error:</strong> {{ errorCarga }}
      <button type="button" class="enlace" @click="cargar">Reintentar</button>
    </div>

    <PanelList
      v-else
      :items="noticiasPagina"
      :loading="cargando"
      :total="noticiasFiltradas.length"
      :page="pagina"
      :page-size="POR_PAGINA"
      item-label="noticias"
      :empty-text="noticias.length ? 'Ninguna noticia coincide con la búsqueda.' : 'No hay noticias publicadas aún.'"
      @update:page="pagina = $event"
    >
      <template #row="{ item: n }">
        <div class="fila clicable" @click="abrirEditar(n)">
          <img
            v-if="n.urlImagen && !miniaturasRotas.has(n.idNoticia)"
            :src="n.urlImagen"
            alt=""
            class="fila-miniatura"
            loading="lazy"
            @error="marcarRota(n.idNoticia)"
          />
          <span v-else class="fila-miniatura vacia" aria-hidden="true"><Icono nombre="noticia" :tamano="22" /></span>
          <div class="fila-principal">
            <div class="fila-titulo" :title="n.titulo">
              <span class="fila-codigo">NOT-{{ String(n.idNoticia).padStart(3, '0') }}</span><span class="fila-nombre">{{ truncar(n.titulo) }}</span>
            </div>
            <div class="fila-meta">
              <span>{{ n.nombreEditor || 'Sin editor' }}</span>
              <span v-if="n.destacada" class="chip destacada"><Icono nombre="estrella" :tamano="12" /> Destacada</span>
            </div>
          </div>
          <span class="fila-fecha" title="Fecha de publicación">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            {{ formatoFecha(n.fechaPublicacion) }}
          </span>
          <div class="fila-estado">
            <StatusBadge :label="n.activa ? 'Activa' : 'Inactiva'" :tone="n.activa ? 'green' : 'red'" />
          </div>
          <div class="fila-menu" @click.stop>
            <RowMenu :items="menu(n)" />
          </div>
          <span class="fila-chevron" aria-hidden="true">›</span>
        </div>
      </template>
    </PanelList>

    <BaseModal :show="modalAbierto" :title="editandoId ? 'Editar noticia' : 'Nueva noticia'" size="lg" @close="cerrarModal">
      <form id="form-noticia" class="form-modal" @submit.prevent="guardar">
        <div v-if="errorForm" class="alerta-error" role="alert"><strong>Aviso:</strong> {{ errorForm }}</div>

        <div class="grupo-entrada">
          <label for="titulo">Título</label>
          <input
            id="titulo"
            v-model="form.titulo"
            type="text"
            required
            maxlength="255"
            placeholder="Ej: Nuevas especies descubiertas en Oaxaca"
            :class="{ 'borde-error': errorCampo('titulo') }"
          />
          <small v-if="errorCampo('titulo')" class="msg-error">{{ errorCampo('titulo') }}</small>
        </div>

        <div class="grupo-entrada">
          <label for="noticia-contenido">Contenido</label>
          <textarea
            id="noticia-contenido"
            v-model="form.contenido"
            required
            placeholder="Cuerpo de la noticia"
            :class="{ 'borde-error': errorCampo('contenido') }"
          ></textarea>
          <small v-if="errorCampo('contenido')" class="msg-error">{{ errorCampo('contenido') }}</small>
        </div>

        <div class="grupo-entrada">
          <label for="url_imagen">URL de imagen (opcional)</label>
          <input
            id="url_imagen"
            v-model="form.urlImagen"
            type="url"
            maxlength="500"
            placeholder="https://ejemplo.com/imagen.jpg"
            :class="{ 'borde-error': errorCampo('urlImagen') }"
          />
          <small v-if="errorCampo('urlImagen')" class="msg-error">{{ errorCampo('urlImagen') }}</small>
          <div v-if="urlImagenValida" class="vista-previa">
            <img v-if="!imagenFallo" :src="form.urlImagen.trim()" alt="Vista previa de la imagen" @error="imagenFallo = true" />
            <span v-else class="color-gris">No se pudo cargar la imagen. Revisa la URL.</span>
          </div>
        </div>

        <div class="grupo-entrada">
          <label for="url_externa">Enlace externo (opcional)</label>
          <input
            id="url_externa"
            v-model="form.urlExterna"
            type="url"
            maxlength="500"
            placeholder="https://fuente-original.com/noticia"
            :class="{ 'borde-error': errorCampo('urlExterna') }"
          />
          <small v-if="errorCampo('urlExterna')" class="msg-error">{{ errorCampo('urlExterna') }}</small>
        </div>

        <label class="casilla" for="destacada">
          <input id="destacada" v-model="form.destacada" type="checkbox" />
          Marcar como destacada
        </label>
      </form>

      <template #footer>
        <button type="button" class="boton-panel gris" :disabled="guardando" @click="cerrarModal">Cancelar</button>
        <button type="submit" form="form-noticia" class="boton-panel" :disabled="guardando">
          <template v-if="guardando">Guardando...</template>
          <template v-else>{{ editandoId ? 'Guardar cambios' : 'Publicar' }}</template>
        </button>
      </template>
    </BaseModal>

    <ConfirmModal
      :show="!!aEliminar"
      title="Eliminar noticia"
      :message="aEliminar ? `Se eliminará «${truncar(aEliminar.titulo, 60)}». No se puede deshacer.` : ''"
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
.chip.destacada {
  background: #fff8e1;
  color: #8d6e00;
}
.form-modal .grupo-entrada textarea {
  min-height: 130px;
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
.casilla {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  font-size: 0.88rem;
  color: #1d2b22;
  cursor: pointer;
}
.casilla input {
  width: 18px;
  height: 18px;
  accent-color: #2b5e3f;
}
</style>
