<script setup>
import Icono from '@/components/Icono.vue'
import { ref, reactive, computed, watch, nextTick } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import api, { mensajeError } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { useInsigniasStore } from '@/stores/insignias'

// La ruta usa props: true; tomamos el id de route.params y no reenviamos atributos
defineOptions({ inheritAttrs: false })

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const toast = useToast()
const insignias = useInsigniasStore()

const MAX_TITULO = 255
const MIN_CONTENIDO = 20
const MAX_EXTRAS = 4

const id = computed(() => route.params.id || null)
const esEdicion = computed(() => !!id.value)

const form = reactive({
  titulo: '',
  urlImagen: '',
  extras: [], // hasta 4 URLs -> urlImagen2..5
  contenido: '',
  contenido2: '',
  contenido3: '',
})
const parrafos = ref(1) // cuántos bloques de contenido se muestran (1..3)
const autor = ref('')
const fechaOriginal = ref(null)

const cargando = ref(false)
const guardando = ref(false)
const error = ref('')
const errores = ref({})
const imagenesRotas = ref({})
const verPrevia = ref(false) // solo móvil

// Volver a donde vino (p. ej. /blog/mios o /panel/blogs); solo rutas internas
const volverA = computed(() => {
  const v = route.query.volver
  return typeof v === 'string' && v.startsWith('/') && !v.startsWith('//') ? v : '/blog'
})

const esUrl = (v) => /^https?:\/\/\S+$/i.test((v || '').trim())

function reiniciar() {
  Object.assign(form, { titulo: '', urlImagen: '', extras: [], contenido: '', contenido2: '', contenido3: '' })
  parrafos.value = 1
  autor.value = auth.user?.name || ''
  fechaOriginal.value = null
  error.value = ''
  errores.value = {}
  imagenesRotas.value = {}
}

async function cargarBlog() {
  reiniciar()
  if (!esEdicion.value) return
  cargando.value = true
  try {
    const { data: b } = await api.get(`/blogs/${id.value}`)
    const puedeEditar = (auth.user && String(auth.user.id) === String(b.idUsuario)) || auth.isNoticias
    if (!puedeEditar) {
      toast.error('No tienes permiso para editar este blog.')
      router.replace('/blog')
      return
    }
    Object.assign(form, {
      titulo: b.titulo || '',
      urlImagen: b.urlImagen || '',
      extras: [b.urlImagen2, b.urlImagen3, b.urlImagen4, b.urlImagen5].filter(Boolean),
      contenido: b.contenido || '',
      contenido2: b.contenido2 || '',
      contenido3: b.contenido3 || '',
    })
    parrafos.value = b.contenido3 ? 3 : b.contenido2 ? 2 : 1
    autor.value = b.autor || ''
    fechaOriginal.value = b.fechaPublicacion
  } catch (err) {
    toast.error(mensajeError(err))
    router.replace('/blog')
  } finally {
    cargando.value = false
  }
}
watch(id, cargarBlog, { immediate: true })

watch(
  () => [form.urlImagen, ...form.extras],
  () => (imagenesRotas.value = {})
)

/* ---------- Imágenes extra ---------- */
async function agregarImagen() {
  if (form.extras.length >= MAX_EXTRAS) return
  form.extras.push('')
  await nextTick()
  document.getElementById(`extra-${form.extras.length - 1}`)?.focus()
}
function quitarImagen(i) {
  form.extras.splice(i, 1)
}

/* ---------- Párrafos ---------- */
async function agregarParrafo() {
  if (parrafos.value >= 3) return
  parrafos.value++
  await nextTick()
  document.getElementById(`contenido${parrafos.value}`)?.focus()
}
function quitarParrafo(n) {
  // n = 2 o 3. Si se quita el 2 y existe el 3, el 3 sube.
  if (n === 2) form.contenido2 = form.contenido3
  form.contenido3 = ''
  parrafos.value = Math.max(1, parrafos.value - 1)
}

/* ---------- Validación ---------- */
const contenidoCorto = computed(() => form.contenido.trim().length > 0 && form.contenido.trim().length < MIN_CONTENIDO)
const extrasInvalidas = computed(() => form.extras.some((u) => u.trim() && !esUrl(u)))
const formularioValido = computed(
  () =>
    form.titulo.trim() !== '' &&
    form.titulo.length <= MAX_TITULO &&
    esUrl(form.urlImagen) &&
    form.contenido.trim().length >= MIN_CONTENIDO &&
    !extrasInvalidas.value
)
const faltantes = computed(() => {
  const f = []
  if (!form.titulo.trim() || form.titulo.length > MAX_TITULO) f.push('título')
  if (!esUrl(form.urlImagen)) f.push('imagen')
  if (form.contenido.trim().length < MIN_CONTENIDO) f.push('contenido')
  if (extrasInvalidas.value) f.push('URL extra')
  return f
})
const textoFalta = computed(() => (faltantes.value.length ? 'Falta: ' + faltantes.value.join(', ') : ''))

function errorCampo(campo) {
  const e = errores.value[campo]
  return Array.isArray(e) ? e[0] : e || ''
}

/* ---------- Vista previa ---------- */
const extracto = computed(() => {
  const t = form.contenido.trim()
  if (!t) return 'Aquí aparecerá el inicio de tu publicación...'
  return t.length > 100 ? t.slice(0, 100) + '...' : t
})
const fechaPrevia = computed(() => {
  const d = fechaOriginal.value ? new Date(fechaOriginal.value) : new Date()
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
})
const extrasValidas = computed(() => form.extras.filter(esUrl).length)

/* ---------- Guardar ---------- */
async function guardar() {
  if (!formularioValido.value || guardando.value) return
  guardando.value = true
  error.value = ''
  errores.value = {}
  const extras = form.extras.map((u) => u.trim()).filter(Boolean)
  const payload = {
    titulo: form.titulo.trim(),
    contenido: form.contenido.trim(),
    contenido2: parrafos.value >= 2 ? form.contenido2.trim() || null : null,
    contenido3: parrafos.value >= 3 ? form.contenido3.trim() || null : null,
    urlImagen: form.urlImagen.trim(),
    urlImagen2: extras[0] || null,
    urlImagen3: extras[1] || null,
    urlImagen4: extras[2] || null,
    urlImagen5: extras[3] || null,
  }
  try {
    if (esEdicion.value) {
      await api.put(`/blogs/${id.value}`, payload)
      toast.success('Tu blog se actualizó correctamente.')
    } else {
      await api.post('/blogs', payload)
      toast.success('¡Tu blog fue publicado! Gracias por compartir con la comunidad.')
      insignias.cargar() // revisa si con esta publicación ganó una insignia
    }
    router.push(volverA.value)
  } catch (err) {
    errores.value = err?.response?.data?.errors || {}
    error.value = Object.keys(errores.value).length
      ? err.response.data.message || 'Revisa los datos del formulario.'
      : mensajeError(err)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } finally {
    guardando.value = false
  }
}
</script>

<template>
  <div class="contenedor pagina">
    <!-- Encabezado + acciones (sticky en desktop) -->
    <header class="barra">
      <div class="barra-izq">
        <nav class="migas" aria-label="Ruta de navegación">
          <RouterLink to="/blog">Blog</RouterLink>
          <Icono nombre="chevronDerecha" :tamano="14" />
          <span aria-current="page">{{ esEdicion ? 'Editar' : 'Publicar' }}</span>
        </nav>
        <h1>{{ esEdicion ? 'Editar blog' : 'Publicar blog' }}</h1>
      </div>
      <div v-if="!cargando" class="barra-acciones solo-desktop">
        <span v-if="textoFalta" class="falta">{{ textoFalta }}</span>
        <RouterLink :to="volverA" class="btn btn-sec">Cancelar</RouterLink>
        <button type="submit" form="form-blog" class="btn btn-pri" :disabled="!formularioValido || guardando">
          <Icono :nombre="esEdicion ? 'check' : 'escribir'" :tamano="16" />
          <template v-if="guardando">Guardando...</template>
          <template v-else>{{ esEdicion ? 'Guardar cambios' : 'Publicar blog' }}</template>
        </button>
      </div>
    </header>

    <p v-if="cargando" class="cargando">Cargando blog...</p>

    <div v-else class="distribucion">
      <form id="form-blog" class="columna-form" novalidate @submit.prevent="guardar">
        <div v-if="error" class="alerta-error" role="alert"><strong>Aviso:</strong> {{ error }}</div>

        <!-- 1. Información -->
        <section class="seccion">
          <h2 class="seccion-titulo"><span class="num">1</span> Información</h2>
          <div class="campo">
            <div class="etiqueta-fila">
              <label for="titulo">Título</label>
              <small class="contador" :class="{ limite: form.titulo.length >= MAX_TITULO }">
                {{ form.titulo.length }}/{{ MAX_TITULO }}
              </small>
            </div>
            <input
              id="titulo"
              v-model="form.titulo"
              type="text"
              required
              :maxlength="MAX_TITULO"
              placeholder="Ej: Cómo cuidar tu nopal en lluvias"
              :class="{ 'borde-error': errorCampo('titulo') }"
            />
            <small v-if="errorCampo('titulo')" class="msg-error">{{ errorCampo('titulo') }}</small>
          </div>
        </section>

        <!-- 2. Imágenes -->
        <section class="seccion">
          <h2 class="seccion-titulo"><span class="num">2</span> Imágenes</h2>

          <div class="campo">
            <label for="urlImagen">Imagen principal</label>
            <div class="campo-imagen" :class="{ 'borde-error': errorCampo('urlImagen') || (form.urlImagen && !esUrl(form.urlImagen)) }">
              <div class="lienzo">
                <img
                  v-if="esUrl(form.urlImagen) && !imagenesRotas.principal"
                  :src="form.urlImagen.trim()"
                  alt="Imagen principal"
                  @error="imagenesRotas.principal = true"
                />
                <div v-else class="lienzo-vacio">
                  <Icono :nombre="imagenesRotas.principal ? 'sinImagen' : 'imagen'" :tamano="28" />
                  <span>{{ imagenesRotas.principal ? 'No se pudo cargar' : 'Pega una URL abajo' }}</span>
                </div>
              </div>
              <div class="url-fila">
                <Icono nombre="enlace" :tamano="16" />
                <input
                  id="urlImagen"
                  v-model="form.urlImagen"
                  type="url"
                  required
                  maxlength="500"
                  placeholder="https://ejemplo.com/planta.jpg"
                />
              </div>
            </div>
            <small v-if="errorCampo('urlImagen')" class="msg-error">{{ errorCampo('urlImagen') }}</small>
            <small v-else-if="form.urlImagen && !esUrl(form.urlImagen)" class="msg-error">
              Debe empezar con http:// o https://
            </small>
          </div>

          <div class="campo">
            <div class="etiqueta-fila">
              <span class="etiqueta">Adicionales <span class="opcional">opcional</span></span>
              <small class="contador">{{ form.extras.length }}/{{ MAX_EXTRAS }}</small>
            </div>
            <div class="miniaturas">
              <div v-for="(url, i) in form.extras" :key="i" class="mini">
                <div class="mini-img" :class="{ 'borde-error': errorCampo(`urlImagen${i + 2}`) || (url && !esUrl(url)) }">
                  <img
                    v-if="esUrl(url) && !imagenesRotas['e' + i]"
                    :src="url.trim()"
                    :alt="`Imagen adicional ${i + 1}`"
                    @error="imagenesRotas['e' + i] = true"
                  />
                  <Icono v-else :nombre="imagenesRotas['e' + i] ? 'sinImagen' : 'imagen'" :tamano="22" />
                  <button type="button" class="mini-quitar" :aria-label="`Quitar imagen ${i + 1}`" @click="quitarImagen(i)">
                    <Icono nombre="cerrar" :tamano="14" />
                  </button>
                </div>
                <input
                  :id="`extra-${i}`"
                  v-model="form.extras[i]"
                  type="url"
                  maxlength="500"
                  :aria-label="`URL imagen adicional ${i + 1}`"
                  placeholder="https://..."
                  :class="{ 'borde-error': errorCampo(`urlImagen${i + 2}`) || (url && !esUrl(url)) }"
                />
                <small v-if="errorCampo(`urlImagen${i + 2}`)" class="msg-error">{{ errorCampo(`urlImagen${i + 2}`) }}</small>
                <small v-else-if="url && !esUrl(url)" class="msg-error">URL no válida</small>
              </div>
              <button v-if="form.extras.length < MAX_EXTRAS" type="button" class="mini-agregar" aria-label="Agregar imagen" @click="agregarImagen">
                <Icono nombre="agregar" :tamano="20" />
                <span>Agregar</span>
              </button>
            </div>
          </div>
        </section>

        <!-- 3. Contenido -->
        <section class="seccion">
          <h2 class="seccion-titulo"><span class="num">3</span> Contenido</h2>

          <div class="parrafo">
            <div class="etiqueta-fila">
              <label for="contenido1"><span class="p-num">1</span> Párrafo</label>
              <small class="contador">{{ form.contenido.length }}</small>
            </div>
            <textarea
              id="contenido1"
              v-model="form.contenido"
              required
              :minlength="MIN_CONTENIDO"
              placeholder="Escribe el primer párrafo..."
              :class="{ 'borde-error': errorCampo('contenido') || contenidoCorto }"
            ></textarea>
            <small v-if="errorCampo('contenido')" class="msg-error">{{ errorCampo('contenido') }}</small>
            <small v-else-if="contenidoCorto" class="msg-error">Mínimo {{ MIN_CONTENIDO }} caracteres</small>
          </div>

          <div v-if="parrafos >= 2" class="parrafo">
            <div class="etiqueta-fila">
              <label for="contenido2"><span class="p-num">2</span> Párrafo <span class="opcional">opcional</span></label>
              <small class="contador">{{ form.contenido2.length }}</small>
              <button type="button" class="btn-icono" aria-label="Quitar párrafo 2" @click="quitarParrafo(2)">
                <Icono nombre="eliminar" :tamano="15" />
              </button>
            </div>
            <textarea id="contenido2" v-model="form.contenido2" placeholder="Continúa tu historia..."></textarea>
            <small v-if="errorCampo('contenido2')" class="msg-error">{{ errorCampo('contenido2') }}</small>
          </div>

          <div v-if="parrafos >= 3" class="parrafo">
            <div class="etiqueta-fila">
              <label for="contenido3"><span class="p-num">3</span> Párrafo <span class="opcional">opcional</span></label>
              <small class="contador">{{ form.contenido3.length }}</small>
              <button type="button" class="btn-icono" aria-label="Quitar párrafo 3" @click="quitarParrafo(3)">
                <Icono nombre="eliminar" :tamano="15" />
              </button>
            </div>
            <textarea id="contenido3" v-model="form.contenido3" placeholder="Cierra con un consejo..."></textarea>
            <small v-if="errorCampo('contenido3')" class="msg-error">{{ errorCampo('contenido3') }}</small>
          </div>

          <button v-if="parrafos < 3" type="button" class="btn-texto" @click="agregarParrafo">
            <Icono nombre="agregar" :tamano="16" /> Agregar párrafo
          </button>
        </section>
      </form>

      <!-- Vista previa -->
      <aside class="previa" :class="{ abierta: verPrevia }">
        <button type="button" class="previa-toggle" :aria-expanded="verPrevia" @click="verPrevia = !verPrevia">
          <Icono nombre="ver" :tamano="16" /> {{ verPrevia ? 'Ocultar vista previa' : 'Ver vista previa' }}
        </button>
        <div class="previa-cuerpo">
          <h2 class="previa-titulo">Vista previa</h2>
          <article class="tarjeta-blog">
            <img
              v-if="esUrl(form.urlImagen) && !imagenesRotas.principal"
              :src="form.urlImagen.trim()"
              alt="Vista previa de la imagen principal"
              class="img-blog"
              @error="imagenesRotas.principal = true"
            />
            <div v-else class="img-blog img-vacia"><Icono nombre="documento" :tamano="32" /></div>
            <div class="contenido-blog">
              <div class="info-meta">
                <Icono nombre="calendario" :tamano="14" /> {{ fechaPrevia }} · por {{ autor || auth.user?.name || 'Ti' }}
              </div>
              <h3>{{ form.titulo.trim() || 'Título de tu blog' }}</h3>
              <p class="extracto">
                {{ extracto }}
                <span class="color-verde fw-bold">Leer más</span>
              </p>
            </div>
          </article>
          <p v-if="extrasValidas" class="nota">
            <Icono nombre="imagen" :tamano="14" /> +{{ extrasValidas }} en la lectura completa
          </p>
        </div>
      </aside>

      <!-- Acciones en móvil -->
      <div class="acciones-movil">
        <span v-if="textoFalta" class="falta">{{ textoFalta }}</span>
        <div class="acciones-movil-btns">
          <RouterLink :to="volverA" class="btn btn-sec">Cancelar</RouterLink>
          <button type="submit" form="form-blog" class="btn btn-pri" :disabled="!formularioValido || guardando">
            <template v-if="guardando">Guardando...</template>
            <template v-else>{{ esEdicion ? 'Guardar cambios' : 'Publicar blog' }}</template>
          </button>
        </div>
      </div>
    </div>
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

/* ---------- Barra superior ---------- */
.barra {
  position: sticky;
  top: var(--alto-header);
  z-index: 50;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
  padding: 20px 0 14px;
  margin-bottom: 20px;
  background: var(--fondo);
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
.barra-acciones {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}
.falta {
  font-size: 0.82rem;
  color: var(--gris-t);
}

/* ---------- Botones ---------- */
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
  transition: background 0.15s, border-color 0.15s;
}
.btn-pri {
  background: var(--acento);
  color: white;
}
.btn-pri:hover:not(:disabled) {
  background: #224b32;
}
.btn-pri:disabled {
  background: #e5e9e6;
  color: #8a968e;
  border-color: #d5dcd7;
  cursor: not-allowed;
}
.btn-sec {
  background: white;
  color: var(--negro);
  border-color: #d5dcd7;
}
.btn-sec:hover {
  background: #f3f5f4;
}
.btn:focus-visible,
.btn-texto:focus-visible,
.btn-icono:focus-visible,
.mini-agregar:focus-visible,
.mini-quitar:focus-visible,
.previa-toggle:focus-visible {
  outline: 2px solid var(--acento);
  outline-offset: 2px;
}

.cargando {
  color: var(--gris-t);
  padding: 30px 0;
}

/* ---------- Distribución ---------- */
.distribucion {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 24px;
  align-items: start;
}
.columna-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}
.alerta-error {
  margin: 0;
}

/* ---------- Secciones ---------- */
.seccion {
  background: white;
  border: 1px solid var(--borde);
  border-radius: 12px;
  padding: 20px 22px;
}
.seccion-titulo {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 16px;
  font-size: 1rem;
  font-weight: 700;
  color: var(--negro);
}
.num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #eef2ef;
  color: var(--negro);
  font-size: 0.8rem;
}

/* ---------- Campos ---------- */
.campo,
.parrafo {
  margin-bottom: 16px;
}
.campo:last-child,
.parrafo:last-child {
  margin-bottom: 0;
}
.etiqueta-fila {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.etiqueta-fila label,
.etiqueta-fila .etiqueta {
  margin: 0;
  flex: 1;
}
label,
.etiqueta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--negro);
  margin-bottom: 6px;
}
.opcional {
  font-weight: 400;
  color: var(--gris-t);
  font-size: 0.78rem;
}
.contador {
  color: #9aa59e;
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.contador.limite {
  color: #c62828;
}
input,
textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 10px 12px;
  border: 1px solid #d5dcd7;
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: inherit;
  color: var(--negro);
  background: white;
  transition: border-color 0.15s, box-shadow 0.15s;
}
textarea {
  min-height: 130px;
  resize: vertical;
  line-height: 1.6;
}
input:focus,
textarea:focus {
  outline: none;
  border-color: var(--acento);
  box-shadow: 0 0 0 3px rgba(43, 94, 63, 0.12);
}
input::placeholder,
textarea::placeholder {
  color: #a3ada6;
}
.msg-error {
  display: block;
  color: #c62828;
  font-size: 0.78rem;
  margin-top: 4px;
}
.borde-error {
  border-color: #c62828 !important;
}

/* Imagen principal con vista previa integrada */
.campo-imagen {
  border: 1px solid #d5dcd7;
  border-radius: 8px;
  overflow: hidden;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.campo-imagen:focus-within {
  border-color: var(--acento);
  box-shadow: 0 0 0 3px rgba(43, 94, 63, 0.12);
}
.lienzo {
  height: 220px;
  background: #f6f8f7;
}
.lienzo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.lienzo-vacio {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #9aa59e;
  font-size: 0.85rem;
}
.url-fila {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  border-top: 1px solid var(--borde);
  color: var(--gris-t);
}
.url-fila input {
  border: none;
  padding: 11px 0;
  border-radius: 0;
}
.url-fila input:focus {
  box-shadow: none;
}

/* Miniaturas adicionales */
.miniaturas {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
}
.mini {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}
.mini-img {
  position: relative;
  aspect-ratio: 4 / 3;
  border: 1px solid var(--borde);
  border-radius: 8px;
  overflow: hidden;
  background: #f6f8f7;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9aa59e;
}
.mini-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.mini-quitar {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 1px solid var(--borde);
  background: rgba(255, 255, 255, 0.95);
  color: var(--negro);
  cursor: pointer;
}
.mini-quitar:hover {
  color: #c62828;
  border-color: #f0c4c4;
}
.mini input {
  padding: 7px 9px;
  font-size: 0.82rem;
}
.mini-agregar {
  aspect-ratio: 4 / 3;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  border: 1px dashed #c7d0ca;
  border-radius: 8px;
  background: white;
  color: var(--gris-t);
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}
.mini-agregar:hover {
  border-color: var(--acento);
  color: var(--acento);
  background: #f7faf8;
}

/* Párrafos */
.p-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  border-radius: 5px;
  background: #eef2ef;
  font-size: 0.75rem;
}
.btn-icono {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--gris-t);
  cursor: pointer;
}
.btn-icono:hover {
  background: #fdecec;
  color: #c62828;
}
.btn-texto {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  margin-left: -8px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--acento);
  font-family: inherit;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
}
.btn-texto:hover {
  background: #eef4f0;
}

/* ---------- Vista previa ---------- */
.previa {
  position: sticky;
  top: calc(var(--alto-header) + 100px);
  min-width: 0;
}
.previa-toggle {
  display: none;
}
.previa-titulo {
  margin: 0 0 10px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--negro);
}
.previa .tarjeta-blog:hover {
  transform: none;
}
.previa .img-blog {
  height: 200px;
}
.previa .contenido-blog h3,
.previa .extracto {
  word-break: break-word;
}
.img-vacia {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f6f8f7;
  color: #b5beb8;
}
.nota {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: var(--gris-t);
  margin: 10px 0 0;
}

.acciones-movil {
  display: none;
}

/* ---------- Responsive ---------- */
@media (max-width: 900px) {
  .distribucion {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  .barra {
    position: static;
    padding-top: 16px;
    margin-bottom: 16px;
  }
  .solo-desktop {
    display: none;
  }
  .previa {
    position: static;
  }
  .previa-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    width: 100%;
    padding: 10px;
    border: 1px solid var(--borde);
    border-radius: 8px;
    background: white;
    color: var(--negro);
    font-family: inherit;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
  }
  .previa-cuerpo {
    display: none;
    margin-top: 12px;
  }
  .previa.abierta .previa-cuerpo {
    display: block;
  }
  .acciones-movil {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .acciones-movil-btns {
    display: flex;
    gap: 10px;
  }
  .acciones-movil .btn {
    flex: 1;
    padding: 11px 12px;
  }
}
@media (max-width: 480px) {
  .barra h1 {
    font-size: 1.35rem;
  }
  .seccion {
    padding: 16px 14px;
  }
  .lienzo {
    height: 170px;
  }
  .miniaturas {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }
}
</style>
