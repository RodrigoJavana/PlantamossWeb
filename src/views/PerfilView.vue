<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import api, { mensajeError } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import BaseModal from '@/components/BaseModal.vue'
import PasswordRequisitos from '@/components/PasswordRequisitos.vue'
import PasswordInput from './auth/components/PasswordInput.vue'
import PerfilIcono from './perfil/PerfilIcono.vue'
import InsigniasGrid from '@/components/insignias/InsigniasGrid.vue'
import { useInsigniasStore } from '@/stores/insignias'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const toast = useToast()
const insignias = useInsigniasStore()

const user = computed(() => auth.user || {})
const rol = computed(() => user.value.role || 'user')
const inicial = computed(() => (user.value.name || '?').trim().charAt(0).toUpperCase())
const verificado = computed(() => auth.emailVerificado)
const tienePanel = computed(() => ['admin', 'noticias', 'editor'].includes(rol.value))

const NOMBRES_ROL = { admin: 'Administrador', noticias: 'Noticias', editor: 'Editor', user: 'Usuario' }
const nombreRol = computed(() => NOMBRES_ROL[rol.value] || rol.value)

const PERMISOS = {
  admin: [
    'Gestión total de usuarios (Crear, Editar, Eliminar).',
    'Acceso completo al Panel de Administración.',
    'Publicación y edición de Noticias/Blogs.',
    'Modificación del catálogo de flora y mapa.',
    'Visualización de registros del sistema.',
  ],
  noticias: ['Publicación y eliminación de Noticias/Blogs.', 'Visualización del mapa y catálogo general.'],
  editor: [
    'Edición de contenidos en el catálogo de plantas.',
    'Acceso al Panel de Editor para subir imágenes.',
    'Visualización del mapa y catálogo general.',
  ],
  user: [
    'Visualización del catálogo completo de plantas.',
    'Acceso al mapa interactivo de la región.',
    'Lectura de Noticias y consejos de cuidado.',
    'Gestión de datos personales en el perfil.',
  ],
}
const permisos = computed(() => PERMISOS[rol.value] || PERMISOS.user)

const accesos = computed(() => {
  const lista = [
    { to: '/catalogo', texto: 'Catálogo', desc: 'Explora la flora', icono: 'hoja' },
    { to: '/mapa', texto: 'Mapa', desc: 'Mapa interactivo', icono: 'mapa' },
    { to: '/blog', texto: 'Blog', desc: 'Noticias y consejos', icono: 'libro' },
    { to: '/blog/mios', texto: 'Mis blogs', desc: 'Tus publicaciones', icono: 'lapiz' },
  ]
  if (tienePanel.value) lista.push({ to: '/panel', texto: 'Panel de control', desc: 'Gestión del sitio', icono: 'panel' })
  return lista
})

function formatoFecha(iso) {
  if (!iso) return 'Desconocido'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'Desconocido'
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function primerError(errores, campo) {
  const e = errores[campo]
  return Array.isArray(e) ? e[0] : e || ''
}

/* ---------- Pestañas ---------- */
const PESTANAS = [
  { id: 'resumen', texto: 'Resumen', icono: 'resumen' },
  { id: 'datos', texto: 'Datos personales', icono: 'usuario' },
  { id: 'insignias', texto: 'Insignias', icono: 'insignia' },
  { id: 'seguridad', texto: 'Seguridad', icono: 'escudo' },
  { id: 'cuenta', texto: 'Cuenta', icono: 'engrane' },
]
const IDS = PESTANAS.map((p) => p.id)

const pestana = computed(() => {
  const q = route.query.tab
  return typeof q === 'string' && IDS.includes(q) ? q : 'resumen'
})

// Las insignias se cargan al abrir la pestaña (también si la URL ya trae ?tab=insignias).
watch(
  pestana,
  (p) => {
    if (p === 'insignias') insignias.cargar()
  },
  { immediate: true }
)

function irA(id, enfocar = false) {
  if (id !== pestana.value) {
    router.replace({ query: { ...route.query, tab: id } })
  }
  if (enfocar) nextTick(() => botonesTab.value[IDS.indexOf(id)]?.focus())
}

function teclaTab(e) {
  const i = IDS.indexOf(pestana.value)
  let n = null
  if (e.key === 'ArrowRight') n = (i + 1) % IDS.length
  else if (e.key === 'ArrowLeft') n = (i - 1 + IDS.length) % IDS.length
  else if (e.key === 'Home') n = 0
  else if (e.key === 'End') n = IDS.length - 1
  if (n === null) return
  e.preventDefault()
  irA(IDS[n], true)
}

const botonesTab = ref([])
const barraTabs = ref(null)
const indicador = ref({ left: 0, width: 0 })

function moverIndicador() {
  const b = botonesTab.value[IDS.indexOf(pestana.value)]
  if (!b) return
  indicador.value = { left: b.offsetLeft, width: b.offsetWidth }
  // Asegura que la pestaña activa sea visible en móvil (scroll horizontal).
  const barra = barraTabs.value
  if (barra && barra.scrollWidth > barra.clientWidth) {
    const izq = b.offsetLeft - 16
    const der = b.offsetLeft + b.offsetWidth + 16 - barra.clientWidth
    if (barra.scrollLeft > izq) barra.scrollTo({ left: izq, behavior: 'smooth' })
    else if (barra.scrollLeft < der) barra.scrollTo({ left: der, behavior: 'smooth' })
  }
}
watch(pestana, () => nextTick(moverIndicador))
let ro = null
onMounted(() => {
  nextTick(moverIndicador)
  if (typeof ResizeObserver !== 'undefined' && barraTabs.value) {
    ro = new ResizeObserver(() => moverIndicador())
    ro.observe(barraTabs.value)
  } else {
    window.addEventListener('resize', moverIndicador)
  }
})
onBeforeUnmount(() => {
  if (ro) ro.disconnect()
  window.removeEventListener('resize', moverIndicador)
})

/* ---------- Cerrar sesión ---------- */
const cerrando = ref(false)
async function cerrarSesion() {
  cerrando.value = true
  try {
    await auth.logout()
  } finally {
    cerrando.value = false
    router.replace('/login')
  }
}

/* ---------- Editar nombre ---------- */
const nombre = ref(user.value.name || '')
watch(
  () => auth.user?.name,
  (n) => {
    if (n !== undefined) nombre.value = n
  }
)
const guardandoNombre = ref(false)
const erroresNombre = ref({})
const nombreSinCambios = computed(() => nombre.value.trim() === (user.value.name || '') || !nombre.value.trim())

async function guardarNombre() {
  if (nombreSinCambios.value) return
  guardandoNombre.value = true
  erroresNombre.value = {}
  try {
    const { data } = await api.put('/perfil', { name: nombre.value.trim() })
    auth.setUser(data)
    toast.success('Tu nombre se actualizó correctamente.')
  } catch (err) {
    erroresNombre.value = err?.response?.data?.errors || {}
    toast.error(mensajeError(err))
  } finally {
    guardandoNombre.value = false
  }
}

/* ---------- Cambiar contraseña ---------- */
const pass = ref({ passwordActual: '', password: '', passwordConfirmation: '' })
const passValida = ref(false)
const guardandoPass = ref(false)
const erroresPass = ref({})
const passCoinciden = computed(() => pass.value.password !== '' && pass.value.password === pass.value.passwordConfirmation)
const passNoCoinciden = computed(() => pass.value.passwordConfirmation !== '' && !passCoinciden.value)
const puedeCambiarPass = computed(
  () => pass.value.passwordActual !== '' && passValida.value && passCoinciden.value && !guardandoPass.value
)

async function cambiarPassword() {
  if (!puedeCambiarPass.value) return
  guardandoPass.value = true
  erroresPass.value = {}
  try {
    const { data } = await api.put('/perfil/password', { ...pass.value })
    toast.success(data?.message || 'Tu contraseña se actualizó correctamente.')
    pass.value = { passwordActual: '', password: '', passwordConfirmation: '' }
  } catch (err) {
    erroresPass.value = err?.response?.data?.errors || {}
    toast.error(mensajeError(err))
  } finally {
    guardandoPass.value = false
  }
}

/* ---------- Eliminar cuenta ---------- */
const modalEliminar = ref(false)
const passEliminar = ref('')
const errorEliminar = ref('')
const eliminando = ref(false)

function abrirEliminar() {
  passEliminar.value = ''
  errorEliminar.value = ''
  modalEliminar.value = true
}
function cerrarEliminar() {
  if (!eliminando.value) modalEliminar.value = false
}

async function eliminarCuenta() {
  if (!passEliminar.value || eliminando.value) return
  eliminando.value = true
  errorEliminar.value = ''
  try {
    await api.delete('/perfil', { data: { password: passEliminar.value } })
    modalEliminar.value = false
    await auth.logout()
    toast.info('Tu cuenta fue eliminada. ¡Gracias por haber sido parte de Planta-Moss!')
    router.replace('/login')
  } catch (err) {
    errorEliminar.value = mensajeError(err)
  } finally {
    eliminando.value = false
  }
}
</script>

<template>
  <div class="perfil">
    <!-- PORTADA -->
    <div class="portada" aria-hidden="true">
      <!-- Misma imagen que el banner de Inicio (ver components/home/BannerInicio.vue para créditos) -->
      <img src="/img/banner-inicio.jpg" alt="" class="portada-img" draggable="false" />
    </div>

    <!-- CABECERA DEL PERFIL -->
    <header class="cabecera">
      <div class="cabecera-interna">
        <div class="identidad">
          <div class="avatar" aria-hidden="true">{{ inicial }}</div>
          <div class="identidad-texto">
            <h1 class="nombre">{{ user.name }}</h1>
            <p class="subtitulo">
              <span class="subtitulo-rol">{{ nombreRol }}</span>
              <span class="meta-sep" aria-hidden="true">&bull;</span>
              <span class="subtitulo-estado" :class="{ pendiente: !verificado }">
                <PerfilIcono :nombre="verificado ? 'check' : 'alerta'" :tamano="14" />
                {{ verificado ? 'Correo verificado' : 'Correo sin verificar' }}
              </span>
            </p>
            <p class="meta">
              <span class="meta-item"><PerfilIcono nombre="correo" :tamano="14" /> {{ user.email }}</span>
              <span class="meta-sep" aria-hidden="true">&bull;</span>
              <span class="meta-item"><PerfilIcono nombre="calendario" :tamano="14" /> Miembro desde: {{ formatoFecha(user.createdAt) }}</span>
            </p>
          </div>
        </div>

        <div class="acciones-rapidas">
          <RouterLink v-if="tienePanel" to="/panel" class="boton-perfil">
            <PerfilIcono nombre="panel" :tamano="16" /> Panel de control
          </RouterLink>
          <button type="button" class="boton-perfil contorno-rojo" :disabled="cerrando" @click="cerrarSesion">
            <PerfilIcono nombre="salir" :tamano="16" /> {{ cerrando ? 'Cerrando...' : 'Cerrar Sesión' }}
          </button>
        </div>
      </div>

      <!-- PESTAÑAS -->
      <div class="cabecera-interna tabs-envoltura">
        <div ref="barraTabs" class="tabs" role="tablist" aria-label="Secciones del perfil" @keydown="teclaTab">
          <button
            v-for="(p, i) in PESTANAS"
            :id="`tab-${p.id}`"
            :key="p.id"
            :ref="(el) => (botonesTab[i] = el)"
            type="button"
            role="tab"
            class="tab"
            :class="{ activa: pestana === p.id }"
            :aria-selected="pestana === p.id"
            :aria-controls="`panel-${p.id}`"
            :tabindex="pestana === p.id ? 0 : -1"
            @click="irA(p.id)"
          >
            <PerfilIcono :nombre="p.icono" :tamano="17" />
            <span>{{ p.texto }}</span>
          </button>
          <span
            class="tab-indicador"
            aria-hidden="true"
            :style="{ transform: `translateX(${indicador.left}px)`, width: `${indicador.width}px` }"
          ></span>
        </div>
      </div>
    </header>

    <div class="contenido">
      <!-- ============ RESUMEN ============ -->
      <section
        v-show="pestana === 'resumen'"
        id="panel-resumen"
        role="tabpanel"
        aria-labelledby="tab-resumen"
        tabindex="0"
        class="panel-tab"
      >
        <div class="tarjeta info-cuenta">
          <h2 class="tarjeta-titulo">Información de la cuenta</h2>
          <dl class="info-lista">
            <div class="info-fila">
              <dt><PerfilIcono nombre="correo" :tamano="16" /> Correo</dt>
              <dd class="rompe">
                {{ user.email || '—' }}
                <span class="info-nota" :class="{ pendiente: !verificado }">
                  {{ verificado ? '(verificado)' : '(sin verificar)' }}
                </span>
              </dd>
            </div>
            <div class="info-fila">
              <dt><PerfilIcono nombre="insignia" :tamano="16" /> Rol</dt>
              <dd>{{ nombreRol }}</dd>
            </div>
            <div class="info-fila">
              <dt><PerfilIcono nombre="calendario" :tamano="16" /> Miembro desde</dt>
              <dd>{{ formatoFecha(user.createdAt) }}</dd>
            </div>
          </dl>
        </div>


        <div class="grid-resumen">
          <div class="tarjeta">
            <h2 class="tarjeta-titulo">Lo que puedes hacer:</h2>
            <ul class="permisos">
              <li v-for="permiso in permisos" :key="permiso">
                <PerfilIcono class="check" nombre="palomita" :tamano="16" />{{ permiso }}
              </li>
            </ul>
          </div>

          <div class="tarjeta">
            <h2 class="tarjeta-titulo">Accesos rápidos</h2>
            <nav class="accesos" aria-label="Accesos rápidos">
              <RouterLink v-for="a in accesos" :key="a.to" :to="a.to" class="acceso">
                <span class="acceso-icono"><PerfilIcono :nombre="a.icono" /></span>
                <span class="acceso-texto">
                  <strong>{{ a.texto }}</strong>
                  <small>{{ a.desc }}</small>
                </span>
                <PerfilIcono class="acceso-flecha" nombre="flecha" :tamano="16" />
              </RouterLink>
            </nav>
          </div>
        </div>
      </section>

      <!-- ============ DATOS PERSONALES ============ -->
      <section
        v-show="pestana === 'datos'"
        id="panel-datos"
        role="tabpanel"
        aria-labelledby="tab-datos"
        tabindex="0"
        class="panel-tab"
      >
        <div class="tarjeta tarjeta-form">
          <div class="tarjeta-cabecera">
            <h2 class="tarjeta-titulo">Datos personales</h2>
          </div>
          <form @submit.prevent="guardarNombre">
            <div class="grupo-entrada">
              <label for="perfil-nombre">Nombre Completo</label>
              <input
                id="perfil-nombre"
                v-model="nombre"
                type="text"
                required
                maxlength="255"
                autocomplete="name"
                :class="{ 'borde-error': primerError(erroresNombre, 'name') }"
              />
              <small v-if="primerError(erroresNombre, 'name')" class="msg-error">{{ primerError(erroresNombre, 'name') }}</small>
            </div>
            <div class="grupo-entrada">
              <label for="perfil-email">Correo Electrónico (No modificable)</label>
              <input id="perfil-email" :value="user.email" type="email" readonly class="campo-bloqueado" />
            </div>
            <div class="pie-form">
              <button type="submit" class="boton-perfil" :disabled="nombreSinCambios || guardandoNombre">
                {{ guardandoNombre ? 'Guardando...' : 'Guardar nombre' }}
              </button>
            </div>
          </form>
        </div>
      </section>

      <!-- ============ INSIGNIAS ============ -->
      <section
        v-show="pestana === 'insignias'"
        id="panel-insignias"
        role="tabpanel"
        aria-labelledby="tab-insignias"
        tabindex="0"
        class="panel-tab"
      >
        <div class="tarjeta">
          <InsigniasGrid />
        </div>
      </section>

      <!-- ============ SEGURIDAD ============ -->
      <section
        v-show="pestana === 'seguridad'"
        id="panel-seguridad"
        role="tabpanel"
        aria-labelledby="tab-seguridad"
        tabindex="0"
        class="panel-tab"
      >
        <div class="grid-seguridad">
          <div class="tarjeta tarjeta-form">
            <div class="tarjeta-cabecera">
              <h2 class="tarjeta-titulo">Cambiar contraseña</h2>
            </div>
            <form @submit.prevent="cambiarPassword">
              <div class="grupo-entrada">
                <label for="pass-actual">Contraseña actual</label>
                <PasswordInput
                  id="pass-actual"
                  v-model="pass.passwordActual"
                  required
                  autocomplete="current-password"
                  :invalido="!!primerError(erroresPass, 'passwordActual')"
                />
                <small v-if="primerError(erroresPass, 'passwordActual')" class="msg-error">
                  {{ primerError(erroresPass, 'passwordActual') }}
                </small>
              </div>
              <div class="grupo-entrada">
                <label for="pass-nueva">Nueva contraseña</label>
                <PasswordInput
                  id="pass-nueva"
                  v-model="pass.password"
                  placeholder="Mínimo 8 caracteres"
                  minlength="8"
                  required
                  autocomplete="new-password"
                  :invalido="!!primerError(erroresPass, 'password')"
                />
                <PasswordRequisitos v-model:valido="passValida" :password="pass.password" />
                <small v-if="primerError(erroresPass, 'password')" class="msg-error">{{ primerError(erroresPass, 'password') }}</small>
              </div>
              <div class="grupo-entrada">
                <label for="pass-confirmar">Confirmar nueva contraseña</label>
                <PasswordInput
                  id="pass-confirmar"
                  v-model="pass.passwordConfirmation"
                  placeholder="Repite tu contraseña"
                  required
                  autocomplete="new-password"
                  :invalido="passNoCoinciden"
                  :valido="pass.passwordConfirmation !== '' && passCoinciden"
                />
                <small v-if="passNoCoinciden" class="msg-error">Las contraseñas no coinciden.</small>
              </div>
              <div class="pie-form">
                <button type="submit" class="boton-perfil" :disabled="!puedeCambiarPass">
                  {{ guardandoPass ? 'Guardando...' : 'Actualizar contraseña' }}
                </button>
              </div>
            </form>
          </div>

          <aside class="tarjeta consejo">
            <span class="consejo-icono"><PerfilIcono nombre="candado" :tamano="22" /></span>
            <h2 class="tarjeta-titulo">Consejo de seguridad</h2>
            <ul class="consejo-lista">
              <li>Usa una contraseña única que no utilices en otros sitios.</li>
              <li>Combina mayúsculas, minúsculas, números y símbolos.</li>
              <li>Nunca compartas tu contraseña; el equipo de Planta-Moss jamás te la pedirá.</li>
              <li>Cierra sesión al usar equipos compartidos.</li>
            </ul>
          </aside>
        </div>
      </section>

      <!-- ============ CUENTA ============ -->
      <section
        v-show="pestana === 'cuenta'"
        id="panel-cuenta"
        role="tabpanel"
        aria-labelledby="tab-cuenta"
        tabindex="0"
        class="panel-tab"
      >
        <div class="pila">
          <div class="tarjeta fila-accion">
            <span class="fila-icono"><PerfilIcono nombre="salir" :tamano="20" /></span>
            <div class="fila-texto">
              <h2 class="tarjeta-titulo">Cerrar sesión</h2>
            </div>
            <button type="button" class="boton-perfil gris" :disabled="cerrando" @click="cerrarSesion">
              {{ cerrando ? 'Cerrando...' : 'Cerrar Sesión' }}
            </button>
          </div>

          <div class="tarjeta peligro">
            <div class="fila-accion sin-borde">
              <span class="fila-icono rojo"><PerfilIcono nombre="basura" :tamano="20" /></span>
              <div class="fila-texto">
                <h2 class="tarjeta-titulo">Zona de peligro</h2>
                <p class="tarjeta-sub">Acción permanente.</p>
              </div>
              <button type="button" class="boton-perfil rojo" @click="abrirEliminar">Eliminar mi cuenta</button>
            </div>
          </div>
        </div>
      </section>
    </div>

    <BaseModal :show="modalEliminar" title="Eliminar cuenta" size="sm" @close="cerrarEliminar">
      <form id="form-eliminar" @submit.prevent="eliminarCuenta">
        <p class="aviso-modal">
          Para confirmar, escribe tu contraseña. Tu cuenta <strong>{{ user.email }}</strong> se eliminará de forma
          permanente.
        </p>
        <div v-if="errorEliminar" class="alerta-error" role="alert">{{ errorEliminar }}</div>
        <div class="grupo-entrada">
          <label for="pass-eliminar">Contraseña</label>
          <PasswordInput id="pass-eliminar" v-model="passEliminar" required autocomplete="current-password" />
        </div>
      </form>
      <template #footer>
        <button type="button" class="boton-perfil gris" :disabled="eliminando" @click="cerrarEliminar">Cancelar</button>
        <button type="submit" form="form-eliminar" class="boton-perfil rojo" :disabled="!passEliminar || eliminando">
          {{ eliminando ? 'Eliminando...' : 'Eliminar definitivamente' }}
        </button>
      </template>
    </BaseModal>
  </div>
</template>

<style scoped>
.perfil {
  --borde: #e3ebe5;
  --gris-label: #8a958d;
  padding-bottom: 48px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

/* ---------- Portada ---------- */
.portada {
  position: relative;
  height: 260px;
  overflow: hidden;
  background: #cfd9c9;
}
.portada-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 55%;
  display: block;
}

/* ---------- Cabecera ---------- */
.cabecera {
  background: #fff;
  border-bottom: 1px solid var(--borde);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
}
.cabecera-interna {
  width: 90%;
  max-width: 1200px;
  margin: 0 auto;
}
.cabecera-interna:first-child {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  padding: 0 0 18px;
}
.identidad {
  display: flex;
  align-items: flex-end;
  gap: 20px;
  min-width: 0;
}
.avatar {
  position: relative; /* queda por encima del banner al sobreponerse con margin-top negativo */
  z-index: 1;
  flex-shrink: 0;
  width: 112px;
  height: 112px;
  margin-top: -56px;
  border-radius: 18px;
  background: #fff;
  color: #1d2b22;
  border: 1px solid #e5e9e6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 44px;
  font-weight: 600;
  user-select: none;
}
.identidad-texto { min-width: 0; padding-top: 14px; }
.nombre {
  margin: 0;
  font-size: 1.6rem;
  font-weight: 800;
  color: #1d2b22;
  line-height: 1.2;
  word-break: break-word;
}
.insignias {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}
.subtitulo {
  margin: 6px 0 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 10px;
  font-size: 0.92rem;
}
.subtitulo-rol { color: #1d2b22; font-weight: 600; }
.subtitulo-estado { display: inline-flex; align-items: center; gap: 5px; color: #2e7d32; }
.subtitulo-estado.pendiente { color: #b26a00; }

.meta {
  margin: 10px 0 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 10px;
  font-size: 0.86rem;
  color: #66736a;
}
.meta-item { display: inline-flex; align-items: center; gap: 6px; min-width: 0; word-break: break-all; }
.meta-item svg { flex-shrink: 0; color: #8a968e; }
.meta-sep { color: #c3cdc6; }

.acciones-rapidas {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  flex-shrink: 0;
}

/* ---------- Botones ---------- */
.boton-perfil {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #2b5e3f;
  color: #fff;
  border: 1px solid #2b5e3f;
  padding: 10px 20px;
  border-radius: 10px;
  text-decoration: none;
  font-weight: 700;
  font-size: 0.9rem;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s, color 0.2s, transform 0.1s;
  white-space: nowrap;
}
.boton-perfil:hover:not(:disabled) { background: #3a7a4f; border-color: #3a7a4f; }
.boton-perfil:active:not(:disabled) { transform: scale(0.98); }
.boton-perfil.rojo { background: #c62828; border-color: #c62828; }
.boton-perfil.rojo:hover:not(:disabled) { background: #b71c1c; border-color: #b71c1c; }
.boton-perfil.contorno-rojo { background: #fff; color: #c62828; border-color: #f2c4c4; }
.boton-perfil.contorno-rojo:hover:not(:disabled) { background: #ffebee; border-color: #c62828; }
.boton-perfil.gris { background: #fff; color: #44514a; border-color: #d5ded8; }
.boton-perfil.gris:hover:not(:disabled) { background: #f1f5f2; border-color: #b9c6bd; }
.boton-perfil:disabled { opacity: 0.55; cursor: not-allowed; }

/* ---------- Pestañas ---------- */
.tabs-envoltura { border-top: 1px solid #eef3ef; }
.tabs {
  position: relative;
  display: flex;
  gap: 4px;
  overflow-x: auto;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}
.tabs::-webkit-scrollbar { display: none; }
.tab {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 15px 16px;
  background: none;
  border: none;
  color: #6b776f;
  font-family: inherit;
  font-size: 0.92rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  border-radius: 8px 8px 0 0;
  transition: color 0.2s, background 0.2s;
}
.tab:hover { color: #1d2b22; background: #f5f7f6; }
.tab.activa { color: #1d2b22; font-weight: 700; }
.tab:focus-visible { outline: 3px solid #a5d6a7; outline-offset: -3px; }
.tab-indicador {
  position: absolute;
  left: 0;
  bottom: 0;
  height: 3px;
  border-radius: 3px 3px 0 0;
  background: #2e7d32;
  transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1), width 0.28s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: none;
}

/* ---------- Contenido ---------- */
.contenido {
  width: 90%;
  max-width: 1200px;
  margin: 28px auto 0;
}
.panel-tab { animation: aparecer 0.25s ease; }
.panel-tab:focus-visible { outline: 3px solid #a5d6a7; outline-offset: 4px; border-radius: 12px; }
@keyframes aparecer {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: none; }
}

.tarjeta {
  background: #fff;
  border: 1px solid var(--borde);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  min-width: 0;
}
.tarjeta-titulo {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: #1d2b22;
}
.tarjeta-sub { margin: 4px 0 0; color: #66736a; font-size: 0.9rem; line-height: 1.5; }
.tarjeta-cabecera {
  padding-bottom: 16px;
  margin-bottom: 20px;
  border-bottom: 1px solid #eef3ef;
}

/* Resumen */
.info-cuenta { margin-bottom: 20px; }
.info-lista { margin: 12px 0 0; }
.info-fila {
  display: grid;
  grid-template-columns: 170px 1fr;
  gap: 12px;
  align-items: center;
  padding: 12px 0;
  border-top: 1px solid #eef3ef;
}
.info-fila dt {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #66736a;
  font-size: 0.9rem;
}
.info-fila dt :deep(svg) { color: #8a968e; }
.info-fila dd { margin: 0; font-weight: 600; color: #1d2b22; }
.info-fila dd.rompe { word-break: break-all; }
.info-nota { margin-left: 6px; font-size: 0.85rem; font-weight: 400; color: #2e7d32; word-break: normal; }
.info-nota.pendiente { color: #b26a00; }
@media (max-width: 560px) {
  .info-fila { grid-template-columns: 1fr; gap: 4px; }
}

.grid-resumen {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-top: 20px;
  align-items: stretch;
}
.permisos { list-style: none; padding: 0; margin: 16px 0 0; }
.permisos li {
  position: relative;
  padding: 10px 0 10px 28px;
  color: #44514a;
  line-height: 1.45;
  border-top: 1px solid #f0f4f1;
}
.permisos li:first-child { border-top: none; }
.check {
  position: absolute;
  left: 0;
  top: 12px;
  color: #2e7d32;
}

.accesos { display: flex; flex-direction: column; gap: 8px; margin-top: 16px; }
.acceso {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 12px;
  border: 1px solid var(--borde);
  border-radius: 12px;
  text-decoration: none;
  color: inherit;
  transition: background 0.2s, border-color 0.2s, transform 0.15s;
}
.acceso:hover { background: #fafbfa; border-color: #cfd8d2; transform: translateX(2px); }
.acceso-icono {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: #f2f4f3;
  color: #1d2b22;
  display: flex;
  align-items: center;
  justify-content: center;
}
.acceso-texto { display: flex; flex-direction: column; min-width: 0; flex: 1; }
.acceso-texto strong { color: #1d2b22; font-size: 0.92rem; }
.acceso-texto small { color: #7a867e; font-size: 0.8rem; }
.acceso-flecha { color: #9aa79e; flex-shrink: 0; }
.acceso:hover .acceso-flecha { color: #2e7d32; }

/* Formularios */
.tarjeta-form { max-width: 640px; }
.pie-form {
  display: flex;
  justify-content: flex-end;
  padding-top: 16px;
  border-top: 1px solid #eef3ef;
}
.grupo-entrada input { padding: 12px 14px; border-radius: 10px; }

.grid-seguridad {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
  gap: 20px;
  align-items: start;
}
.grid-seguridad .tarjeta-form { max-width: none; }
.consejo { background: linear-gradient(180deg, #f4f9f4, #fff); }
.consejo-icono {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: #2b5e3f;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}
.consejo-lista { margin: 12px 0 0; padding-left: 18px; color: #4f5c54; font-size: 0.9rem; line-height: 1.55; }
.consejo-lista li { margin-bottom: 6px; }
.consejo-lista li::marker { color: #2e7d32; }

/* Cuenta */
.pila { display: flex; flex-direction: column; gap: 16px; max-width: 820px; }
.fila-accion { display: flex; align-items: center; gap: 16px; }
.fila-icono {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: #e8f5e9;
  color: #2b5e3f;
  display: flex;
  align-items: center;
  justify-content: center;
}
.fila-icono.rojo { background: #ffebee; color: #c62828; }
.fila-texto { flex: 1; min-width: 0; }
.peligro { border-color: #ffcdd2; background: #fffafa; }
.peligro .tarjeta-titulo { color: #c62828; }

.msg-error {
  display: block;
  margin-top: 5px;
  color: #c62828;
  font-size: 0.8rem;
}
.borde-error { border-color: #c62828 !important; }
.aviso-modal { margin-top: 0; color: #555; word-break: break-word; }

/* ---------- Responsivo ---------- */
@media (max-width: 900px) {
  .grid-resumen,
  .grid-seguridad { grid-template-columns: 1fr; }
}

@media (max-width: 768px) {
  .portada { height: 160px; }
  .cabecera-interna,
  .contenido { width: 100%; padding-left: 16px; padding-right: 16px; }
  .cabecera-interna:first-child {
    flex-direction: column;
    align-items: stretch;
    padding-bottom: 16px;
  }
  .tabs-envoltura { padding-left: 4px; padding-right: 4px; }
  .identidad { flex-direction: column; align-items: center; text-align: center; gap: 10px; }
  .avatar { width: 92px; height: 92px; margin-top: -46px; font-size: 36px; border-radius: 16px; }
  .identidad-texto { padding-top: 0; }
  .nombre { font-size: 1.35rem; }
  .insignias,
  .meta { justify-content: center; }
  .meta-sep { display: none; }
  .meta { flex-direction: column; gap: 4px; }
  .acciones-rapidas { justify-content: center; }
  .acciones-rapidas .boton-perfil { flex: 1 1 140px; }
  .contenido { margin-top: 20px; }
  .tab { padding: 13px 12px; font-size: 0.88rem; }
  .fila-accion { flex-wrap: wrap; }
  .fila-accion .boton-perfil { width: 100%; }
}

@media (max-width: 480px) {
  .tarjeta { padding: 18px 16px; }
  .pie-form .boton-perfil { width: 100%; }
  .boton-perfil { white-space: normal; text-align: center; }
}

@media (prefers-reduced-motion: reduce) {
  .tab-indicador,
  .panel-tab { transition: none; animation: none; }
}
</style>
