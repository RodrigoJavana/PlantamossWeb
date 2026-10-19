<script setup>
import Icono from '@/components/Icono.vue'
import { ref, computed, watch, onMounted } from 'vue'
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

const route = useRoute()
const router = useRouter()
const toast = useToast()

const POR_PAGINA = 20

const blogs = ref([])
const cargando = ref(true)
const errorCarga = ref('')
const texto = ref('')
const filtroAutor = ref('')
const pagina = ref(1)
const rotas = ref(new Set())

function normalizar(s) {
  return (s || '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

const autores = computed(() => [...new Set(blogs.value.map((b) => b.autor || 'Anónimo'))].sort((a, b) => a.localeCompare(b, 'es')))

const opcAutores = computed(() => autores.value.map((a) => ({ value: a, label: a })))

const blogsFiltrados = computed(() => {
  const q = normalizar(texto.value.trim())
  return blogs.value.filter((b) => {
    if (filtroAutor.value && (b.autor || 'Anónimo') !== filtroAutor.value) return false
    if (!q) return true
    return [b.titulo, b.contenido, b.contenido2, b.contenido3].some((t) => normalizar(t).includes(q))
  })
})
const blogsPagina = computed(() => blogsFiltrados.value.slice((pagina.value - 1) * POR_PAGINA, pagina.value * POR_PAGINA))
watch([texto, filtroAutor], () => (pagina.value = 1))

async function cargar() {
  cargando.value = true
  errorCarga.value = ''
  try {
    const { data } = await api.get('/blogs')
    blogs.value = Array.isArray(data) ? data : []
  } catch (err) {
    errorCarga.value = mensajeError(err)
  } finally {
    cargando.value = false
  }
}
onMounted(() => {
  // Acceso rápido desde el Dashboard: /panel/blogs?nuevo=1 va al formulario de publicar
  if (route.query.nuevo !== undefined) {
    router.replace({ path: '/blog/publicar', query: { volver: '/panel/blogs' } })
    return
  }
  cargar()
})

function formatoFecha(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
function truncar(t, n = 60) {
  if (!t) return ''
  return t.length > n ? t.slice(0, n) + '...' : t
}
function imagenes(b) {
  return [b.urlImagen, b.urlImagen2, b.urlImagen3, b.urlImagen4, b.urlImagen5].filter(Boolean)
}
function marcarRota(id) {
  rotas.value = new Set(rotas.value).add(id)
}

/* ---------- Ver ---------- */
const viendo = ref(null)

/* ---------- Editar ---------- */
function editar(b) {
  router.push({ path: `/blog/${b.idBlog}/editar`, query: { volver: '/panel/blogs' } })
}

function menu(b) {
  return [
    { label: 'Ver', icon: 'eye', action: () => (viendo.value = b) },
    { label: 'Editar', icon: 'edit', action: () => editar(b) },
    { label: 'Eliminar', icon: 'trash', danger: true, action: () => (aEliminar.value = b) },
  ]
}

/* ---------- Eliminar ---------- */
const aEliminar = ref(null)
const eliminando = ref(false)
async function confirmarEliminar() {
  if (!aEliminar.value) return
  eliminando.value = true
  try {
    await api.delete(`/blogs/${aEliminar.value.idBlog}`)
    blogs.value = blogs.value.filter((b) => b.idBlog !== aEliminar.value.idBlog)
    const paginas = Math.max(1, Math.ceil(blogsFiltrados.value.length / POR_PAGINA))
    if (pagina.value > paginas) pagina.value = paginas
    if (viendo.value?.idBlog === aEliminar.value.idBlog) viendo.value = null
    toast.success('El blog fue eliminado correctamente.')
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
    <PanelPageHeader title="Blogs">
      <template #actions>
        <button type="button" class="boton-panel" @click="router.push({ path: '/blog/publicar', query: { volver: '/panel/blogs' } })">
          <PanelIcon name="plus" :size="16" /> Publicar blog
        </button>
      </template>
    </PanelPageHeader>

    <PanelToolbar>
      <PanelSearch v-model="texto" placeholder="Buscar blog..." aria-label="Buscar blogs" />
      <PanelSelect v-model="filtroAutor" :options="opcAutores" placeholder="Todos los autores" aria-label="Filtrar por autor" />
      <button v-if="texto || filtroAutor" type="button" class="boton-panel gris" @click="texto = ''; filtroAutor = ''">Limpiar</button>
    </PanelToolbar>

    <div v-if="errorCarga" class="alerta-error" role="alert">
      <strong>Error:</strong> {{ errorCarga }}
      <button type="button" class="enlace" @click="cargar">Reintentar</button>
    </div>

    <PanelList
      v-else
      :items="blogsPagina"
      :loading="cargando"
      :total="blogsFiltrados.length"
      :page="pagina"
      :page-size="POR_PAGINA"
      item-label="blogs"
      :empty-text="blogs.length ? 'Ningún blog coincide con la búsqueda.' : 'Todavía no hay blogs publicados.'"
      @update:page="pagina = $event"
    >
      <template #row="{ item: b }">
        <div class="fila clicable" @click="viendo = b">
          <img
            v-if="b.urlImagen && !rotas.has(b.idBlog)"
            :src="b.urlImagen"
            alt=""
            class="fila-miniatura"
            loading="lazy"
            @error="marcarRota(b.idBlog)"
          />
          <span v-else class="fila-miniatura vacia" aria-hidden="true"><Icono nombre="documento" :tamano="22" /></span>
          <div class="fila-principal">
            <div class="fila-titulo" :title="b.titulo">
              <span class="fila-codigo">BLG-{{ String(b.idBlog).padStart(3, '0') }}</span><span class="fila-nombre">{{ truncar(b.titulo) }}</span>
            </div>
            <div class="fila-meta">
              <span><Icono nombre="escribir" :tamano="14" /> {{ b.autor || 'Anónimo' }}</span>
              <span><Icono nombre="imagen" :tamano="14" /> {{ imagenes(b).length }}</span>
            </div>
          </div>
          <span class="fila-fecha" title="Fecha de publicación">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            {{ formatoFecha(b.fechaPublicacion) }}
          </span>
          <div class="fila-estado">
            <StatusBadge label="Publicado" tone="green" />
          </div>
          <div class="fila-menu" @click.stop>
            <RowMenu :items="menu(b)" />
          </div>
          <span class="fila-chevron" aria-hidden="true">›</span>
        </div>
      </template>
    </PanelList>

    <BaseModal :show="!!viendo" :title="viendo?.titulo || ''" size="lg" @close="viendo = null">
      <template v-if="viendo">
        <p class="meta-modal">
          {{ formatoFecha(viendo.fechaPublicacion) }} · por {{ viendo.autor || 'Anónimo' }}
        </p>
        <div class="galeria">
          <img v-for="(src, i) in imagenes(viendo)" :key="i" :src="src" :alt="`Imagen ${i + 1}`" loading="lazy" />
        </div>
        <p class="texto">{{ viendo.contenido }}</p>
        <p v-if="viendo.contenido2" class="texto">{{ viendo.contenido2 }}</p>
        <p v-if="viendo.contenido3" class="texto">{{ viendo.contenido3 }}</p>
      </template>
      <template #footer>
        <button type="button" class="boton-panel rojo" @click="aEliminar = viendo; viendo = null">Eliminar</button>
        <button type="button" class="boton-panel" @click="editar(viendo)">Editar</button>
      </template>
    </BaseModal>

    <ConfirmModal
      :show="!!aEliminar"
      title="Eliminar blog"
      :message="aEliminar ? `Se eliminará «${truncar(aEliminar.titulo, 60)}» de ${aEliminar.autor || 'Anónimo'}. No se puede deshacer.` : ''"
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
.boton-panel.rojo {
  background: #fff;
  color: #c62828;
  border-color: #f5d0cd;
}
.boton-panel.rojo:hover:not(:disabled) {
  background: #fdf0f0;
  border-color: #c62828;
}
.meta-modal {
  margin-top: 0;
  color: #66736a;
  font-size: 0.85rem;
}
.galeria {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 10px;
  margin-bottom: 20px;
}
.galeria img {
  width: 100%;
  height: 140px;
  object-fit: cover;
  border-radius: 10px;
}
.galeria img:first-child {
  grid-column: 1 / -1;
  height: 260px;
}
.texto {
  line-height: 1.8;
  color: #444;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
