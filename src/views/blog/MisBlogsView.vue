<script setup>
import Icono from '@/components/Icono.vue'
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import api, { mensajeError } from '@/services/api'
import { useToast } from '@/composables/useToast'
import ConfirmModal from '@/components/ConfirmModal.vue'

const toast = useToast()

const blogs = ref([])
const cargando = ref(true)
const error = ref('')
const rotas = ref(new Set())

async function cargar() {
  cargando.value = true
  error.value = ''
  try {
    const { data } = await api.get('/blogs/mios')
    blogs.value = Array.isArray(data) ? data : []
  } catch (err) {
    error.value = mensajeError(err)
  } finally {
    cargando.value = false
  }
}
onMounted(cargar)

function formatoFecha(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
function extracto(t, n = 120) {
  if (!t) return ''
  return t.length > n ? t.slice(0, n) + '...' : t
}
function contarImagenes(b) {
  return [b.urlImagen, b.urlImagen2, b.urlImagen3, b.urlImagen4, b.urlImagen5].filter(Boolean).length
}
function marcarRota(id) {
  rotas.value = new Set(rotas.value).add(id)
}

const aEliminar = ref(null)
const eliminando = ref(false)
async function confirmarEliminar() {
  if (!aEliminar.value) return
  eliminando.value = true
  try {
    await api.delete(`/blogs/${aEliminar.value.idBlog}`)
    blogs.value = blogs.value.filter((b) => b.idBlog !== aEliminar.value.idBlog)
    toast.success('Tu blog fue eliminado.')
    aEliminar.value = null
  } catch (err) {
    toast.error(mensajeError(err))
  } finally {
    eliminando.value = false
  }
}
</script>

<template>
  <div class="contenedor pagina">
    <header class="barra">
      <div>
        <nav class="migas" aria-label="Ruta de navegación">
          <RouterLink to="/blog">Blog</RouterLink>
          <Icono nombre="chevronDerecha" :tamano="14" />
          <span aria-current="page">Mis blogs</span>
        </nav>
        <h1>Mis blogs</h1>
      </div>
      <RouterLink to="/blog/publicar" class="btn btn-pri"><Icono nombre="agregar" :tamano="16" /> Publicar blog</RouterLink>
    </header>

    <div v-if="error" class="alerta-error" role="alert">
      <strong>Error:</strong> {{ error }}
      <button type="button" class="enlace" @click="cargar">Reintentar</button>
    </div>

    <p v-else-if="cargando" class="estado">Cargando tus blogs...</p>

    <div v-else-if="!blogs.length" class="vacio">
      <Icono nombre="documento" :tamano="32" />
      <p>Aún no has publicado blogs.</p>
      <RouterLink to="/blog/publicar" class="btn btn-pri"><Icono nombre="escribir" :tamano="16" /> Escribir el primero</RouterLink>
    </div>

    <template v-else>
      <p class="conteo">{{ blogs.length }} {{ blogs.length === 1 ? 'publicación' : 'publicaciones' }}</p>
      <ul class="lista">
        <li v-for="b in blogs" :key="b.idBlog" class="fila">
          <img
            v-if="b.urlImagen && !rotas.has(b.idBlog)"
            :src="b.urlImagen"
            :alt="b.titulo"
            class="miniatura"
            loading="lazy"
            @error="marcarRota(b.idBlog)"
          />
          <span v-else class="miniatura vacia" aria-hidden="true"><Icono nombre="documento" :tamano="22" /></span>
          <div class="info">
            <h3>{{ b.titulo }}</h3>
            <p class="meta">
              <span><Icono nombre="calendario" :tamano="14" /> {{ formatoFecha(b.fechaPublicacion) }}</span>
              <span><Icono nombre="imagen" :tamano="14" /> {{ contarImagenes(b) }}</span>
            </p>
            <p class="resumen">{{ extracto(b.contenido) }}</p>
          </div>
          <div class="acciones">
            <RouterLink
              :to="{ path: `/blog/${b.idBlog}/editar`, query: { volver: '/blog/mios' } }"
              class="btn btn-sec btn-sm"
              :aria-label="`Editar ${b.titulo}`"
            >
              <Icono nombre="editar" :tamano="15" /> Editar
            </RouterLink>
            <button type="button" class="btn btn-peligro btn-sm" :aria-label="`Eliminar ${b.titulo}`" @click="aEliminar = b">
              <Icono nombre="eliminar" :tamano="15" /> Eliminar
            </button>
          </div>
        </li>
      </ul>
    </template>

    <ConfirmModal
      :show="!!aEliminar"
      title="Eliminar blog"
      :message="aEliminar ? `¿Seguro que quieres eliminar «${aEliminar.titulo}»? Esta acción no se puede deshacer.` : ''"
      confirm-text="Eliminar"
      variant="danger"
      :loading="eliminando"
      @confirm="confirmarEliminar"
      @cancel="aEliminar = null"
    />
  </div>
</template>

<style scoped>
.pagina {
  padding-bottom: 48px;
  --borde: #e5e9e6;
  --negro: #1d2b22;
  --gris-t: #6b7a70;
  --acento: #2b5e3f;
}
.barra {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
  padding: 20px 0 14px;
  margin-bottom: 20px;
  border-bottom: 1px solid var(--borde);
}
.migas {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.82rem;
  color: var(--gris-t);
  margin-bottom: 4px;
}
.migas a {
  color: var(--gris-t);
  text-decoration: none;
}
.migas a:hover {
  color: var(--acento);
  text-decoration: underline;
}
.migas span {
  color: var(--negro);
}
.barra h1 {
  margin: 0;
  font-size: 1.6rem;
  color: var(--negro);
  line-height: 1.2;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 9px 18px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.92rem;
  font-family: inherit;
  text-decoration: none;
  border: 1px solid transparent;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}
.btn:focus-visible {
  outline: 2px solid var(--acento);
  outline-offset: 2px;
}
.btn-sm {
  padding: 7px 12px;
  font-size: 0.85rem;
}
.btn-pri {
  background: var(--acento);
  color: white;
}
.btn-pri:hover {
  background: #224b32;
}
.btn-sec {
  background: white;
  color: var(--negro);
  border-color: #d5dcd7;
}
.btn-sec:hover {
  background: #f3f5f4;
}
.btn-peligro {
  background: white;
  color: #c62828;
  border-color: #f0c4c4;
}
.btn-peligro:hover {
  background: #fdecec;
}

.estado {
  color: var(--gris-t);
  padding: 30px 0;
}
.vacio {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 50px 20px;
  background: white;
  border: 1px solid var(--borde);
  border-radius: 12px;
  color: #9aa59e;
  text-align: center;
}
.vacio p {
  margin: 0 0 6px;
  color: var(--negro);
}
.conteo {
  margin: 0 0 10px;
  font-size: 0.82rem;
  color: var(--gris-t);
}

.lista {
  list-style: none;
  padding: 0;
  margin: 0;
  background: white;
  border: 1px solid var(--borde);
  border-radius: 12px;
  overflow: hidden;
}
.fila {
  display: flex;
  gap: 16px;
  align-items: center;
  padding: 14px 16px;
}
.fila + .fila {
  border-top: 1px solid var(--borde);
}
.fila:hover {
  background: #fafbfa;
}
.miniatura {
  width: 96px;
  height: 72px;
  object-fit: cover;
  border-radius: 8px;
  flex-shrink: 0;
  background: #f6f8f7;
}
.miniatura.vacia {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #b5beb8;
}
.info {
  flex: 1;
  min-width: 0;
}
.info h3 {
  margin: 0 0 4px;
  font-size: 1rem;
  color: var(--negro);
  word-break: break-word;
}
.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 14px;
  margin: 0 0 4px;
  font-size: 0.8rem;
  color: var(--gris-t);
}
.meta span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.resumen {
  margin: 0;
  color: var(--gris-t);
  font-size: 0.86rem;
  line-height: 1.5;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  -webkit-box-orient: vertical;
  word-break: break-word;
}
.acciones {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}
.enlace {
  background: none;
  border: none;
  color: inherit;
  text-decoration: underline;
  cursor: pointer;
  font: inherit;
}
@media (max-width: 640px) {
  .barra h1 {
    font-size: 1.35rem;
  }
  .barra .btn {
    padding: 8px 12px;
  }
  .fila {
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 12px;
    padding: 14px;
  }
  .miniatura {
    width: 72px;
    height: 56px;
  }
  .info {
    flex: 1 1 calc(100% - 84px);
  }
  .resumen {
    -webkit-line-clamp: 2;
    line-clamp: 2;
  }
  .acciones {
    width: 100%;
  }
  .acciones .btn {
    flex: 1;
  }
}
</style>
