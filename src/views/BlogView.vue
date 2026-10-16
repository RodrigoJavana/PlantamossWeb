<script setup>
import Icono from '@/components/Icono.vue'
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api, { mensajeError } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import BaseModal from '@/components/BaseModal.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'
import PlantaImagen from '@/components/PlantaImagen.vue'
import { formatearFecha, urlSegura } from '@/utils/plantas'
import { useInsigniasStore } from '@/stores/insignias'

const auth = useAuthStore()
const toast = useToast()
const router = useRouter()
const insignias = useInsigniasStore()

const blogs = ref([])
const cargando = ref(true)
const error = ref('')
const abierto = ref(null)
const confirmarBorrado = ref(false)
const borrando = ref(false)

async function cargar() {
  cargando.value = true
  error.value = ''
  try {
    const { data } = await api.get('/blogs')
    blogs.value = Array.isArray(data) ? data : []
  } catch (err) {
    error.value = mensajeError(err, 'No se pudieron cargar los blogs.')
  } finally {
    cargando.value = false
  }
}

function extracto(t, n = 100) {
  const s = String(t || '')
  return s.length > n ? s.slice(0, n).trimEnd() + '...' : s
}

function imagenesDe(b) {
  if (!b) return []
  return [b.urlImagen, b.urlImagen2, b.urlImagen3, b.urlImagen4, b.urlImagen5].map(urlSegura).filter(Boolean)
}
function contenidosDe(b) {
  if (!b) return []
  return [b.contenido, b.contenido2, b.contenido3].filter((c) => c && String(c).trim())
}

const imagenes = computed(() => imagenesDe(abierto.value))
const contenidos = computed(() => contenidosDe(abierto.value))
const imagenesRotas = ref(new Set())
function imagenRota(src) {
  const s = new Set(imagenesRotas.value)
  s.add(src)
  imagenesRotas.value = s
}
const imagenesVisibles = computed(() => imagenes.value.filter((s) => !imagenesRotas.value.has(s)))

const puedeGestionar = computed(() => {
  const b = abierto.value
  if (!b || !auth.isAuth) return false
  return (b.idUsuario != null && String(auth.user?.id) === String(b.idUsuario)) || auth.isNoticias
})

function editar() {
  const id = abierto.value?.idBlog
  abierto.value = null
  router.push(`/blog/${id}/editar`)
}

async function eliminar() {
  if (!abierto.value) return
  borrando.value = true
  try {
    await api.delete(`/blogs/${abierto.value.idBlog}`)
    toast.success('Blog eliminado correctamente.')
    confirmarBorrado.value = false
    abierto.value = null
    await cargar()
  } catch (err) {
    toast.error(mensajeError(err, 'No se pudo eliminar el blog.'))
  } finally {
    borrando.value = false
  }
}

function abrir(b) {
  imagenesRotas.value = new Set()
  abierto.value = b
  insignias.evento('LEER_BLOG', b.idBlog)
}

onMounted(cargar)
</script>

<template>
  <div class="vista-blog">
    <div class="contenedor">
      <header class="blog-cabecera">
        <h1>Blog</h1>
        <div v-if="auth.isAuth" class="blog-acciones">
          <RouterLink to="/blog/publicar" class="boton-natural boton-publicar"><Icono nombre="escribir" :tamano="16" /> Publicar blog</RouterLink>
          <RouterLink to="/blog/mios" class="boton-secundario"><Icono nombre="biblioteca" :tamano="16" /> Mis blogs</RouterLink>
        </div>
      </header>

      <div v-if="cargando" class="cuadricula-blogs" aria-hidden="true">
        <div v-for="n in 6" :key="n" class="tarjeta-skeleton">
          <div class="skeleton skeleton-img"></div>
          <div class="skeleton-contenido">
            <div class="skeleton skeleton-linea corta"></div>
            <div class="skeleton skeleton-linea ancha"></div>
            <div class="skeleton skeleton-linea"></div>
          </div>
        </div>
      </div>

      <div v-else-if="error" class="estado-vacio mt-30">
        <div class="estado-vacio-icono"><Icono nombre="alerta" class="icono-em" /></div>
        <h3>No pudimos cargar los blogs</h3>
        <p>{{ error }}</p>
        <button type="button" class="boton-secundario mt-15" @click="cargar">Reintentar</button>
      </div>

      <div v-else-if="!blogs.length" class="text-center py-40">
        <p class="color-gris">Aún no hay publicaciones.</p>
        <RouterLink v-if="auth.isAuth" to="/blog/publicar" class="enlace-verde">Sé el primero en publicar</RouterLink>
      </div>

      <div v-else class="cuadricula-blogs">
        <article
          v-for="b in blogs"
          :key="b.idBlog"
          class="tarjeta-blog cursor-pointer"
          tabindex="0"
          role="button"
          :aria-label="`Leer: ${b.titulo}`"
          @click="abrir(b)"
          @keydown.enter.prevent="abrir(b)"
          @keydown.space.prevent="abrir(b)"
        >
          <PlantaImagen class="img-blog" :src="b.urlImagen" :alt="b.titulo" icono="documento" />
          <div class="contenido-blog">
            <div class="info-meta">
              <Icono nombre="calendario" :tamano="14" /> {{ formatearFecha(b.fechaPublicacion, { year: 'numeric', month: 'short', day: 'numeric' }) }} ·
              por {{ b.autor || 'Anónimo' }}
            </div>
            <h3>{{ b.titulo }}</h3>
            <p class="extracto">{{ extracto(b.contenido) }}</p>
            <span class="leer-mas">Leer más</span>
          </div>
        </article>
      </div>
    </div>

    <!-- Modal de lectura -->
    <BaseModal :show="!!abierto" :title="abierto?.titulo || ''" size="lg" @close="abierto = null">
      <article v-if="abierto" class="lectura">
        <p class="lectura-meta">
          <Icono nombre="calendario" :tamano="14" /> {{ formatearFecha(abierto.fechaPublicacion) }} · <Icono nombre="escribir" :tamano="14" /> por <strong>{{ abierto.autor || 'Anónimo' }}</strong>
        </p>

        <div v-if="imagenesVisibles.length" class="modal-img-container">
          <img
            v-for="(src, i) in imagenesVisibles"
            :key="src + i"
            :src="src"
            :alt="`${abierto.titulo} (imagen ${i + 1})`"
            class="modal-img"
            :class="i < 2 ? (imagenesVisibles.length === 1 ? 'full' : 'half') : 'third'"
            loading="lazy"
            @error="imagenRota(src)"
          />
        </div>

        <p v-for="(c, i) in contenidos" :key="i" class="modal-content-text">{{ c }}</p>
      </article>

      <template v-if="puedeGestionar" #footer>
        <button type="button" class="boton-pie boton-pie-peligro" @click="confirmarBorrado = true"><Icono nombre="eliminar" :tamano="15" /> Eliminar</button>
        <button type="button" class="boton-pie boton-pie-principal" @click="editar"><Icono nombre="editar" :tamano="15" /> Editar</button>
      </template>
    </BaseModal>

    <ConfirmModal
      :show="confirmarBorrado"
      title="¿Eliminar este blog?"
      :message="`Se eliminará «${abierto?.titulo || ''}» de forma permanente.`"
      confirm-text="Sí, eliminar"
      :loading="borrando"
      @confirm="eliminar"
      @cancel="confirmarBorrado = false"
    />
  </div>
</template>

<style scoped>
.blog-cabecera {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px 20px;
  padding-top: 36px;
}
.blog-cabecera h1 { margin: 0; color: #1d2b22; font-size: 1.6rem; font-weight: 800; }
.blog-acciones { display: flex; flex-wrap: wrap; gap: 10px; }
.blog-acciones > a { display: inline-flex; align-items: center; gap: 6px; font-size: 0.88rem; padding: 9px 16px; }
.boton-publicar { width: auto; margin-top: 0; }
.leer-mas { margin-top: auto; font-size: 0.85rem; font-weight: 700; color: #1d2b22; }
.tarjeta-blog:hover .leer-mas { text-decoration: underline; }
.img-blog { height: 200px; }
.tarjeta-blog:focus-visible { outline: 3px solid #a5d6a7; }
.enlace-verde { color: #2e7d32; font-weight: bold; }
.mt-15 { margin-top: 15px; }

.lectura-meta { color: #66736a; font-size: 0.88rem; margin: 0 0 16px; }
.modal-img-container { display: flex; gap: 12px; margin-bottom: 22px; flex-wrap: wrap; }
.modal-img { object-fit: cover; border-radius: 12px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1); background: #eef5ef; }
.modal-img.full { width: 100%; height: 340px; }
.modal-img.half { width: calc(50% - 6px); height: 280px; }
.modal-img.third { width: calc(33.333% - 8px); height: 180px; }
.modal-content-text {
  line-height: 1.75;
  color: #33413a;
  font-size: 1rem;
  text-align: justify;
  white-space: pre-line;
  margin: 0 0 16px;
}
.boton-pie {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 9px 16px;
  font-size: 0.88rem;
  font-weight: 700;
  font-family: inherit;
  border-radius: 12px;
  border: 1px solid transparent;
  cursor: pointer;
}
.boton-pie-principal { background: #2b5e3f; color: #fff; border-color: #2b5e3f; }
.boton-pie-principal:hover { background: #234d34; }
.boton-pie-peligro { background: #fff; color: #c62828; border-color: #f5d0cd; }
.boton-pie-peligro:hover { background: #fdf0f0; }

@media (max-width: 600px) {
  .modal-img.half, .modal-img.third, .modal-img.full { width: 100%; height: 210px; }
  .modal-content-text { text-align: left; font-size: 1rem; }
  .boton-pie { flex: 1; }
}
</style>
