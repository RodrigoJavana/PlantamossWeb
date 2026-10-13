<script setup>
import Icono from '@/components/Icono.vue'
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api, { mensajeError } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import BaseModal from '@/components/BaseModal.vue'
import BannerInicio from '@/components/home/BannerInicio.vue'
import AccesosRapidos from '@/components/home/AccesosRapidos.vue'
import ClimaCiudadesModal from '@/components/home/ClimaCiudadesModal.vue'
import { useToast } from '@/composables/useToast'
import PlantaImagen from '@/components/PlantaImagen.vue'
import { iconoClima, urlSegura, formatearFecha } from '@/utils/plantas'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

/* ---------- Alerta de permisos ---------- */
const sinPermiso = computed(() => route.query.error === 'sin_permiso')
function cerrarAlerta() {
  const q = { ...route.query }
  delete q.error
  router.replace({ query: q })
}

/* ---------- Saludo ---------- */
const hora = new Date().getHours()
const saludo = computed(() => {
  if (hora >= 5 && hora < 12) return { texto: 'Buenos días', icono: 'sol' }
  if (hora >= 12 && hora < 19) return { texto: 'Buenas tardes', icono: 'templado' }
  return { texto: 'Buenas noches', icono: 'luna' }
})
const primerNombre = computed(() => String(auth.user?.name || '').trim().split(/\s+/)[0] || 'Usuario')

/* ---------- Accesos rápidos ---------- */
const accesos = computed(() => [
  { nombre: 'Catálogo', icono: 'libro', to: '/catalogo' },
  { nombre: 'Mapa interactivo', icono: 'mapa', to: '/mapa' },
  { nombre: 'Blog', icono: 'escribir', to: '/blog' },
  ['admin', 'editor', 'noticias'].includes(auth.rol)
    ? { nombre: 'Panel de control', icono: 'panel', to: '/panel' }
    : { nombre: 'Mi perfil', icono: 'usuario', to: '/perfil' }
])

/* ---------- Plantas destacadas ---------- */
const destacadas = [
  {
    nombre: 'Aloe Vera',
    texto: 'La planta milagrosa para la piel y el aire.',
    imagen: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQXVVHlnD3o8j1M3vKkDhhT-zsuciYJ2gN56A&s',
    titulo: 'Aloe Vera',
    cuidados: [
      { icono: 'gota', clave: 'Riego', valor: 'Cada 15-20 días.' },
      { icono: 'sol', clave: 'Luz', valor: 'Mucha luz indirecta.' },
      { icono: 'destello', clave: 'Beneficio', valor: 'Cura quemaduras y purifica el aire.' }
    ]
  },
  {
    nombre: 'Cactus',
    texto: 'Resistentes y perfectos para principiantes.',
    imagen: 'https://www.culturarecreacionydeporte.gov.co/sites/default/files/styles/870_x_540/public/2022-08/cact.jpg?itok=bQ2yfyg7',
    titulo: 'Cactus',
    cuidados: [
      { icono: 'gota', clave: 'Riego', valor: 'Muy escaso (una vez al mes en invierno).' },
      { icono: 'sol', clave: 'Luz', valor: 'Sol directo.' },
      { icono: 'advertencia', clave: 'Cuidado', valor: 'Evita el encharcamiento o morirá.' }
    ]
  },
  {
    nombre: 'Monstera (Costilla de Adán)',
    texto: 'La reina de la decoración interior.',
    imagen: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTqz-FKDOuHn8hpE7ST1Yx9FgOwNGW1hkMhTw&s',
    titulo: 'Monstera',
    cuidados: [
      { icono: 'gota', clave: 'Riego', valor: 'Moderado, deja secar la tierra.' },
      { icono: 'sol', clave: 'Luz', valor: 'Brillante indirecta.' },
      { icono: 'idea', clave: 'Dato', valor: 'Limpia sus hojas grandes del polvo.' }
    ]
  }
]
const plantaModal = ref(null)

/* ---------- Noticias ---------- */
const noticias = ref([])
const cargandoNoticias = ref(true)
const errorNoticias = ref('')

async function cargarNoticias() {
  cargandoNoticias.value = true
  errorNoticias.value = ''
  try {
    const { data } = await api.get('/noticias/recientes')
    noticias.value = Array.isArray(data) ? data : []
  } catch (err) {
    errorNoticias.value = mensajeError(err, 'No se pudieron cargar las noticias.')
  } finally {
    cargandoNoticias.value = false
  }
}
function extracto(texto, max = 150) {
  const t = String(texto || '')
  return t.length > max ? t.slice(0, max).trimEnd() + '...' : t
}

/* ---------- Clima ---------- */
// Ciudades fijadas por el usuario (GET /perfil/ciudades-clima); por defecto las 6 del sitio original
const ciudades = ref([])
const clima = ref([])
const cargandoClima = ref(true)
const toast = useToast()

async function cargarClima() {
  cargandoClima.value = true
  try {
    const { data } = await api.get('/perfil/ciudades-clima')
    ciudades.value = Array.isArray(data) ? data : []
  } catch {
    ciudades.value = []
  }
  clima.value = await Promise.all(
    ciudades.value.map((c) =>
      api
        .get('/externo/clima', { params: { q: c.consulta } })
        .then(({ data }) => ({ id: c.id, ciudad: c.ciudad, data: data && data.ok ? data : null }))
        .catch(() => ({ id: c.id, ciudad: c.ciudad, data: null }))
    )
  )
  cargandoClima.value = false
}

// Configurar ciudades fijadas
const configurandoClima = ref(false)
const guardandoCiudades = ref(false)
const catalogoCiudades = ref([])

async function abrirConfigClima() {
  configurandoClima.value = true
  if (!catalogoCiudades.value.length) {
    try {
      const { data } = await api.get('/externo/ciudades')
      catalogoCiudades.value = Array.isArray(data) ? data : []
    } catch (err) {
      toast.error(mensajeError(err, 'No se pudo cargar la lista de ciudades.'))
    }
  }
}

async function guardarCiudades(ids) {
  guardandoCiudades.value = true
  try {
    await api.put('/perfil/ciudades-clima', { ciudades: ids })
    configurandoClima.value = false
    toast.success('Ciudades actualizadas.')
    cargarClima()
  } catch (err) {
    toast.error(mensajeError(err, 'No se pudieron guardar las ciudades.'))
  } finally {
    guardandoCiudades.value = false
  }
}
const climaSinDatos = computed(() => !cargandoClima.value && clima.value.every((c) => !c.data))

/* ---------- Videos ---------- */
const videos = ref([])
const cargandoVideos = ref(true)
const errorVideos = ref('')
const reproduciendo = ref(new Set())

async function cargarVideos() {
  cargandoVideos.value = true
  errorVideos.value = ''
  try {
    const { data } = await api.get('/externo/videos')
    videos.value = Array.isArray(data) ? data.filter((v) => v && /^[\w-]{6,20}$/.test(v.videoId || '')) : []
  } catch (err) {
    errorVideos.value = mensajeError(err, 'No se pudieron cargar los videos.')
  } finally {
    cargandoVideos.value = false
  }
}
function reproducir(id) {
  const s = new Set(reproduciendo.value)
  s.add(id)
  reproduciendo.value = s
}

onMounted(() => {
  cargarNoticias()
  cargarClima()
  cargarVideos()
})
</script>

<template>
  <div class="vista-inicio">
    <BannerInicio />

    <nav class="pestanas" aria-label="Secciones de inicio">
      <div class="inicio-contenedor pestanas-interior">
        <span class="pestana activa" aria-current="page">Vista general</span>
      </div>
    </nav>

    <div class="inicio-contenedor inicio-cuerpo">
      <div v-if="sinPermiso" class="alerta-permiso" role="alert">
        <span class="alerta-texto"><Icono nombre="advertencia" :tamano="18" /> <span><strong>Acceso Denegado:</strong> No tienes permisos para esa sección.</span></span>
        <button type="button" class="alerta-cerrar" aria-label="Cerrar alerta" @click="cerrarAlerta"><Icono nombre="cerrar" :tamano="18" /></button>
      </div>

      <header class="saludo">
        <h1 class="saludo-titulo">
          {{ saludo.texto }}, <span class="nowrap">{{ primerNombre }}<Icono :nombre="saludo.icono" :tamano="30" class="saludo-icono" /></span>
        </h1>
        <p class="saludo-linea">¿Qué vamos a explorar hoy?</p>
      </header>


      <!-- Clima -->
      <section class="tarjeta-inicio">
        <div class="clima-cabecera">
          <h2 class="titulo-tarjeta"><Icono nombre="temperatura" :tamano="18" /> Clima en México</h2>
          <button type="button" class="boton-config" aria-label="Configurar ciudades" title="Configurar ciudades" @click="abrirConfigClima">
            <Icono nombre="editar" :tamano="16" />
          </button>
        </div>
        <div class="clima-grid">
          <template v-if="cargandoClima">
            <div v-for="c in (ciudades.length ? ciudades : 6)" :key="c.id || c" class="clima-card">
              <div class="clima-ciudad">{{ c.ciudad || ' ' }}</div>
              <div class="skeleton clima-sk-temp"></div>
              <div class="skeleton skeleton-linea corta"></div>
            </div>
          </template>
          <template v-else>
            <div v-for="c in clima" :key="c.id" class="clima-card">
              <div class="clima-ciudad">{{ c.ciudad }}</div>
              <template v-if="c.data">
                <div class="clima-principal">
                  <Icono :nombre="iconoClima(c.data.icono)" :tamano="28" class="clima-icono" />
                  <span class="clima-temp">{{ Math.round(c.data.temp) }}°C</span>
                </div>
                <div class="clima-desc">{{ c.data.descripcion }}</div>
                <div class="clima-extra">
                  <span><Icono nombre="humedad" :tamano="13" /> {{ c.data.humedad }}%</span>
                  <span><Icono nombre="viento" :tamano="13" /> {{ Math.round(c.data.viento) }} m/s</span>
                </div>
              </template>
              <template v-else>
                <div class="clima-principal">
                  <Icono nombre="temperatura" :tamano="28" class="clima-icono" />
                  <span class="clima-temp">—°C</span>
                </div>
                <div class="clima-desc">Sin datos</div>
              </template>
            </div>
          </template>
        </div>
        <div v-if="climaSinDatos" class="estado">
          <p>Clima no disponible.</p>
          <button type="button" class="boton-borde" @click="cargarClima">Reintentar</button>
        </div>
      </section>

      <AccesosRapidos :accesos="accesos" />

      <!-- Plantas destacadas -->
      <section class="tarjeta-inicio">
        <h2 class="titulo-tarjeta"><Icono nombre="hoja" :tamano="18" /> Plantas destacadas</h2>
        <div class="grid-tarjetas">
          <article v-for="p in destacadas" :key="p.nombre" class="item">
            <PlantaImagen :src="p.imagen" :alt="p.nombre" />
            <div class="item-cuerpo">
              <h3 class="item-titulo">{{ p.nombre }}</h3>
              <p class="item-texto">{{ p.texto }}</p>
              <button type="button" class="boton-accion" @click="plantaModal = p">Ver cuidados</button>
            </div>
          </article>
        </div>
      </section>

      <!-- Noticias -->
      <section class="tarjeta-inicio">
        <h2 class="titulo-tarjeta"><Icono nombre="noticia" :tamano="18" /> Noticias recientes</h2>

        <div v-if="cargandoNoticias" class="grid-tarjetas">
          <div v-for="n in 3" :key="n" class="item">
            <div class="skeleton skeleton-img"></div>
            <div class="item-cuerpo">
              <div class="skeleton skeleton-linea ancha"></div>
              <div class="skeleton skeleton-linea"></div>
              <div class="skeleton skeleton-linea corta"></div>
            </div>
          </div>
        </div>

        <div v-else-if="errorNoticias" class="estado">
          <p>{{ errorNoticias }}</p>
          <button type="button" class="boton-borde" @click="cargarNoticias">Reintentar</button>
        </div>

        <div v-else-if="noticias.length" class="grid-tarjetas">
          <article v-for="n in noticias" :key="n.idNoticia" class="item">
            <PlantaImagen :src="n.urlImagen" :alt="n.titulo" icono="brote" texto="Planta" />
            <div class="item-cuerpo">
              <span v-if="n.destacada" class="badge"><Icono nombre="estrella" :tamano="12" /> Destacada</span>
              <h3 class="item-titulo">{{ n.titulo }}</h3>
              <small v-if="n.fechaPublicacion" class="item-fecha">{{ formatearFecha(n.fechaPublicacion) }}</small>
              <p class="item-texto">{{ extracto(n.contenido) }}</p>
              <a
                v-if="urlSegura(n.urlExterna)"
                :href="urlSegura(n.urlExterna)"
                target="_blank"
                rel="noopener noreferrer"
                class="boton-accion"
              >Leer noticia <Icono nombre="enlace" :tamano="14" /></a>
            </div>
          </article>
        </div>

        <div v-else class="estado"><p>Aún no hay noticias.</p></div>
      </section>

      <!-- Videos -->
      <section class="tarjeta-inicio">
        <h2 class="titulo-tarjeta"><Icono nombre="video" :tamano="18" /> Videos</h2>

        <div v-if="cargandoVideos" class="grid-tarjetas">
          <div v-for="n in 3" :key="n" class="item">
            <div class="skeleton yt-sk-video"></div>
            <div class="item-cuerpo">
              <div class="skeleton skeleton-linea ancha"></div>
              <div class="skeleton skeleton-linea corta"></div>
            </div>
          </div>
        </div>
        <div v-else-if="errorVideos || !videos.length" class="estado">
          <p>{{ errorVideos || 'No hay videos por ahora.' }}</p>
          <button type="button" class="boton-borde" @click="cargarVideos">Reintentar</button>
        </div>
        <div v-else class="grid-tarjetas">
          <article v-for="v in videos" :key="v.videoId" class="item">
            <div class="yt-wrap">
              <iframe
                v-if="reproduciendo.has(v.videoId)"
                :src="`https://www.youtube-nocookie.com/embed/${v.videoId}?autoplay=1&rel=0&modestbranding=1`"
                :title="v.titulo"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen
              ></iframe>
              <button v-else type="button" class="yt-boton" :aria-label="`Reproducir video: ${v.titulo}`" @click="reproducir(v.videoId)">
                <img class="yt-thumb" :src="urlSegura(v.miniatura) || `https://i.ytimg.com/vi/${v.videoId}/mqdefault.jpg`" :alt="v.titulo" loading="lazy" />
                <span class="yt-play" aria-hidden="true"><Icono nombre="play" :tamano="22" /></span>
              </button>
            </div>
            <div class="item-cuerpo">
              <h3 class="item-titulo yt-titulo">{{ v.titulo }}</h3>
              <div class="yt-meta">
                <span>{{ v.canal }}</span>
                <span v-if="v.fechaPublicacion">{{ formatearFecha(v.fechaPublicacion, { year: 'numeric', month: 'short', day: 'numeric' }) }}</span>
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>

    <ClimaCiudadesModal
      :show="configurandoClima"
      :catalogo="catalogoCiudades"
      :seleccion="ciudades.map((c) => c.id)"
      :guardando="guardandoCiudades"
      @close="configurandoClima = false"
      @guardar="guardarCiudades"
    />

    <!-- Modal de cuidados -->
    <BaseModal :show="!!plantaModal" :title="plantaModal?.titulo || ''" size="sm" @close="plantaModal = null">
      <ul v-if="plantaModal" class="lista-cuidados">
        <li v-for="c in plantaModal.cuidados" :key="c.clave">
          <span class="cuidado-icono" aria-hidden="true"><Icono :nombre="c.icono" :tamano="18" /></span>
          <div><strong>{{ c.clave }}:</strong> {{ c.valor }}</div>
        </li>
      </ul>
      <template #footer>
        <button type="button" class="boton-natural boton-modal" @click="plantaModal = null">Entendido</button>
      </template>
    </BaseModal>
  </div>
</template>

<style scoped>
.vista-inicio { background: #f7f9f8; padding-bottom: 48px; }
.inicio-contenedor { max-width: 1150px; margin: 0 auto; padding: 0 24px; box-sizing: border-box; }

/* ---------- Pestañas ---------- */
.pestanas { background: #fff; border-bottom: 1px solid #e5e9e6; }
.pestanas-interior { display: flex; gap: 24px; }
.pestana {
  display: inline-block;
  padding: 12px 2px;
  font-weight: 600;
  font-size: 0.95rem;
  color: #66736a;
  border-bottom: 3px solid transparent;
  margin-bottom: -1px;
}
.pestana.activa { color: #1d2b22; border-bottom-color: #2b5e3f; }

.inicio-cuerpo { display: flex; flex-direction: column; gap: 22px; padding-top: 26px; }

/* ---------- Alerta ---------- */
.alerta-permiso {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  background: #fdecea;
  border: 1px solid #f5c6c0;
  color: #8a1f17;
  border-radius: 10px;
  padding: 12px 14px;
}
.alerta-texto { display: flex; align-items: flex-start; gap: 8px; }
.alerta-cerrar { background: none; border: none; color: inherit; cursor: pointer; padding: 4px; display: flex; }

/* ---------- Saludo ---------- */
.saludo-titulo {
  margin: 0;
  font-size: 2rem;
  font-weight: 800;
  color: #1d2b22;
  line-height: 1.2;
}
.saludo-icono { color: #1d2b22; margin-left: 10px; vertical-align: -0.12em; }
.nowrap { white-space: nowrap; }
.saludo-linea { margin: 6px 0 0; font-weight: 600; font-size: 1.05rem; color: #1d2b22; }

/* ---------- Tarjetas ---------- */
.tarjeta-inicio {
  background: #fff;
  border: 1px solid #e5e9e6;
  border-radius: 14px;
  padding: 20px;
}
.titulo-tarjeta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 16px;
  font-size: 1.05rem;
  font-weight: 700;
  color: #1d2b22;
}
.grid-tarjetas {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(260px, 100%), 1fr));
  gap: 16px;
}
.item {
  display: flex;
  flex-direction: column;
  border: 1px solid #e5e9e6;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.item:hover { transform: translateY(-3px); box-shadow: 0 8px 20px rgba(29, 43, 34, 0.08); }
.item :deep(.planta-imagen) { height: 170px; }
.item-cuerpo { padding: 14px 16px 16px; display: flex; flex-direction: column; flex: 1; }
.item-titulo { margin: 0 0 6px; font-size: 1rem; font-weight: 700; color: #1d2b22; line-height: 1.35; }
.item-texto { margin: 0 0 14px; font-size: 0.9rem; color: #66736a; line-height: 1.5; flex: 1; }
.item-fecha { display: block; color: #66736a; font-size: 0.8rem; margin-bottom: 8px; }
.badge {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #f1f4f2;
  color: #1d2b22;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 999px;
  margin-bottom: 8px;
}
.boton-accion {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #2b5e3f;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 8px 14px;
  font-size: 0.88rem;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  font-family: inherit;
}
.boton-accion:hover { background: #234d34; }
.boton-borde {
  background: #fff;
  color: #1d2b22;
  border: 1px solid #e5e9e6;
  border-radius: 8px;
  padding: 7px 14px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
}
.boton-borde:hover { border-color: #c9d1cc; }
.estado { color: #66736a; text-align: center; padding: 16px 0 4px; display: flex; flex-direction: column; align-items: center; gap: 10px; }
.estado p { margin: 0; }

.skeleton-img { height: 170px; border-radius: 0; }

/* ---------- Clima ---------- */
.clima-cabecera { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.clima-cabecera .titulo-tarjeta { margin-bottom: 0; }
.boton-config {
  width: 34px; height: 34px; border-radius: 10px; border: 1px solid #e5e9e6; background: #fff; color: #1d2b22;
  display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0;
}
.boton-config:hover { background: #f2f4f3; }
.clima-cabecera + .clima-grid { margin-top: 16px; }
.clima-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 14px; }
.clima-card { border: 1px solid #e5e9e6; border-radius: 12px; padding: 14px 16px; background: #fff; }
.clima-ciudad { font-size: 0.85rem; font-weight: 700; color: #1d2b22; margin-bottom: 8px; }
.clima-principal { display: flex; align-items: center; gap: 8px; }
.clima-icono { color: #66736a; }
.clima-temp { font-size: 1.6rem; font-weight: 800; color: #1d2b22; line-height: 1; }
.clima-desc { font-size: 0.82rem; color: #66736a; text-transform: capitalize; margin: 6px 0 8px; }
.clima-extra { display: flex; gap: 12px; flex-wrap: wrap; font-size: 0.78rem; color: #66736a; }
.clima-extra span { display: inline-flex; align-items: center; gap: 4px; }
.clima-sk-temp { width: 80px; height: 26px; margin-bottom: 8px; }

/* ---------- Videos ---------- */
.yt-wrap { position: relative; width: 100%; padding-top: 56.25%; background: #0f0f0f; overflow: hidden; }
.yt-wrap iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: none; }
.yt-boton { position: absolute; inset: 0; border: none; padding: 0; background: none; cursor: pointer; width: 100%; height: 100%; }
.yt-thumb { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.yt-play {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease;
}
.yt-boton:hover .yt-play { transform: translate(-50%, -50%) scale(1.08); }
.yt-sk-video { padding-top: 56.25%; border-radius: 0; }
.yt-titulo {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.yt-meta { display: flex; gap: 12px; flex-wrap: wrap; font-size: 0.78rem; color: #66736a; }

/* ---------- Modal cuidados ---------- */
.lista-cuidados { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
.lista-cuidados li {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  border: 1px solid #e5e9e6;
  padding: 12px 14px;
  border-radius: 10px;
  line-height: 1.45;
  color: #1d2b22;
}
.cuidado-icono {
  flex: 0 0 34px;
  height: 34px;
  border-radius: 10px;
  background: #f1f4f2;
  color: #1d2b22;
  display: flex;
  align-items: center;
  justify-content: center;
}
.boton-modal { width: 100%; margin-top: 0; }

@media (max-width: 640px) {
  .inicio-contenedor { padding: 0 16px; }
  .inicio-cuerpo { gap: 16px; padding-top: 18px; }
  .saludo-titulo { font-size: 1.5rem; }
  .saludo-titulo :deep(svg) { width: 24px; height: 24px; }
  .saludo-linea { font-size: 0.98rem; }
  .tarjeta-inicio { padding: 16px; }
  .clima-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .clima-card { padding: 12px; }
}
</style>

