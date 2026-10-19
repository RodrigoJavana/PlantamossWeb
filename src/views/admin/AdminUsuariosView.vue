<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import api, { mensajeError } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import ConfirmModal from '@/components/ConfirmModal.vue'
import PanelPageHeader from '@/components/panel/PanelPageHeader.vue'
import PanelToolbar from '@/components/panel/PanelToolbar.vue'
import PanelList from '@/components/panel/PanelList.vue'
import StatusBadge from '@/components/panel/StatusBadge.vue'
import RowMenu from '@/components/panel/RowMenu.vue'
import PanelSearch from '@/components/panel/PanelSearch.vue'
import PanelSelect from '@/components/panel/PanelSelect.vue'
import PanelIcon from '@/components/panel/PanelIcon.vue'

const router = useRouter()
const auth = useAuthStore()
const toast = useToast()

const POR_PAGINA = 20
const ROLES = {
  user: { label: 'Usuario', tone: 'gray' },
  editor: { label: 'Editor (Plantas)', tone: 'blue' },
  noticias: { label: 'Editor (Noticias)', tone: 'purple' },
  admin: { label: 'Administrador', tone: 'yellow' },
}

const OPC_ROLES = Object.entries(ROLES).map(([value, r]) => ({ value, label: r.label }))
const OPC_ESTADOS = [
  { value: 'activo', label: 'Activo' },
  { value: 'suspendido', label: 'Suspendido' },
]

const usuarios = ref([])
const cargando = ref(true)
const error = ref('')

const busqueda = ref('')
const filtroRol = ref('')
const filtroEstado = ref('')
const pagina = ref(1)

const usuariosFiltrados = computed(() =>
  usuarios.value.filter(
    (u) => (!filtroRol.value || u.role === filtroRol.value) && (!filtroEstado.value || u.estado === filtroEstado.value)
  )
)
const usuariosPagina = computed(() =>
  usuariosFiltrados.value.slice((pagina.value - 1) * POR_PAGINA, pagina.value * POR_PAGINA)
)
const resumen = computed(() => ({
  total: usuarios.value.length,
  activos: usuarios.value.filter((u) => u.estado === 'activo').length,
  suspendidos: usuarios.value.filter((u) => u.estado !== 'activo').length,
}))

watch([filtroRol, filtroEstado], () => (pagina.value = 1))

async function cargarUsuarios() {
  cargando.value = true
  error.value = ''
  try {
    const q = busqueda.value.trim()
    const { data } = await api.get('/admin/usuarios', { params: q ? { q } : {} })
    usuarios.value = Array.isArray(data) ? data : []
    pagina.value = 1
  } catch (err) {
    error.value = mensajeError(err)
  } finally {
    cargando.value = false
  }
}

let debounce = null
watch(busqueda, () => {
  clearTimeout(debounce)
  debounce = setTimeout(cargarUsuarios, 350)
})
onBeforeUnmount(() => clearTimeout(debounce))
onMounted(cargarUsuarios)

function formatoFecha(iso) {
  if (!iso) return 'N/A'
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? 'N/A'
    : d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
const codigo = (u) => `USR-${String(u.id).padStart(3, '0')}`
const inicial = (u) => (u.name || '?').trim().charAt(0).toUpperCase()
const esYo = (u) => !!auth.user && String(auth.user.id) === String(u.id)

function editar(u) {
  router.push(`/panel/usuarios/${u.id}/editar`)
}

function menu(u) {
  return [
    { label: 'Editar', icon: 'edit', action: () => editar(u) },
    {
      label: esYo(u) ? 'Eliminar (no puedes eliminar tu propia cuenta)' : 'Eliminar',
      icon: 'trash',
      danger: true,
      disabled: esYo(u),
      action: () => pedirEliminar(u),
    },
  ]
}

function limpiarFiltros() {
  busqueda.value = ''
  filtroRol.value = ''
  filtroEstado.value = ''
}

/* ---------- Eliminar ---------- */
const aEliminar = ref(null)
const eliminando = ref(false)

function pedirEliminar(u) {
  if (!esYo(u)) aEliminar.value = u
}

async function confirmarEliminar() {
  if (!aEliminar.value) return
  eliminando.value = true
  try {
    await api.delete(`/admin/usuarios/${aEliminar.value.id}`)
    usuarios.value = usuarios.value.filter((u) => u.id !== aEliminar.value.id)
    const paginas = Math.max(1, Math.ceil(usuariosFiltrados.value.length / POR_PAGINA))
    if (pagina.value > paginas) pagina.value = paginas
    toast.success('Usuario eliminado.')
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
    <PanelPageHeader title="Usuarios">
      <template #actions>
        <RouterLink to="/panel/usuarios/crear" class="boton-panel"><PanelIcon name="plus" :size="16" /> Nuevo usuario</RouterLink>
      </template>
    </PanelPageHeader>

    <div v-if="!cargando && !error" class="resumen">
      <span class="chip">{{ resumen.total }} {{ resumen.total === 1 ? 'usuario' : 'usuarios' }}</span>
      <span class="chip verde">{{ resumen.activos }} {{ resumen.activos === 1 ? 'activo' : 'activos' }}</span>
      <span class="chip rojo">{{ resumen.suspendidos }} {{ resumen.suspendidos === 1 ? 'suspendido' : 'suspendidos' }}</span>
    </div>

    <PanelToolbar>
      <PanelSearch v-model="busqueda" placeholder="Buscar nombre o correo..." aria-label="Buscar usuarios" />
      <PanelSelect v-model="filtroRol" :options="OPC_ROLES" placeholder="Todos los roles" aria-label="Filtrar por rol" />
      <PanelSelect v-model="filtroEstado" :options="OPC_ESTADOS" placeholder="Todos los estados" aria-label="Filtrar por estado" />
      <button
        v-if="busqueda || filtroRol || filtroEstado"
        type="button"
        class="boton-panel gris"
        @click="limpiarFiltros"
      >
        Limpiar
      </button>
    </PanelToolbar>

    <div v-if="error" class="alerta-error" role="alert">
      <strong>Error:</strong> {{ error }}
      <button type="button" class="enlace" @click="cargarUsuarios">Reintentar</button>
    </div>

    <PanelList
      v-else
      :items="usuariosPagina"
      :loading="cargando"
      :total="usuariosFiltrados.length"
      :page="pagina"
      :page-size="POR_PAGINA"
      item-label="usuarios"
      empty-text="No se encontraron usuarios con esos criterios."
      @update:page="pagina = $event"
    >
      <template #row="{ item: u }">
        <div class="fila clicable" @click="editar(u)">
          <span class="fila-avatar" aria-hidden="true">{{ inicial(u) }}</span>
          <div class="fila-principal">
            <div class="fila-titulo">
              <span class="fila-codigo">{{ codigo(u) }}</span><span class="fila-nombre">{{ u.name }}</span>
              <span v-if="esYo(u)" class="tu">(tú)</span>
            </div>
            <div class="fila-meta">
              <span>{{ u.email }}</span>
              <StatusBadge :label="ROLES[u.role]?.label || u.role" :tone="ROLES[u.role]?.tone || 'gray'" />
            </div>
          </div>
          <span class="fila-fecha" title="Fecha de registro">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            {{ formatoFecha(u.createdAt) }}
          </span>
          <div class="fila-estado">
            <StatusBadge
              :label="u.estado === 'activo' ? 'Activo' : 'Suspendido'"
              :tone="u.estado === 'activo' ? 'green' : 'red'"
            />
          </div>
          <div class="fila-menu" @click.stop>
            <RowMenu :items="menu(u)" />
          </div>
          <span class="fila-chevron" aria-hidden="true">›</span>
        </div>
      </template>
    </PanelList>

    <ConfirmModal
      :show="!!aEliminar"
      title="Eliminar usuario"
      :message="aEliminar ? `Se eliminará a ${aEliminar.name} (${aEliminar.email}). No se puede deshacer.` : ''"
      confirm-text="Eliminar"
      variant="danger"
      :loading="eliminando"
      @confirm="confirmarEliminar"
      @cancel="aEliminar = null"
    />
  </div>
</template>

<style scoped src="../editor/filas-panel.css"></style>
<style scoped>
.resumen {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}
.chip.verde {
  color: #2b5e3f;
}
.chip.rojo {
  color: #b42318;
}
.tu {
  font-size: 0.8rem;
  color: #66736a;
  margin-left: 4px;
}
</style>
