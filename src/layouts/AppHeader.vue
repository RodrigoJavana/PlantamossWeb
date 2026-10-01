<script setup>
import Icono from '@/components/Icono.vue'
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const toast = useToast()

const menuMovilAbierto = ref(false)
const menuUsuarioAbierto = ref(false)
const zonaUsuario = ref(null)

const enlaces = [
  { to: '/', label: 'Inicio', exacto: true },
  { to: '/catalogo', label: 'Catálogo' },
  { to: '/mapa', label: 'Mapa' },
  { to: '/blog', label: 'Blog' }
]

const nombre = computed(() => auth.user?.name || 'Usuario')
const inicial = computed(() => (nombre.value.trim()[0] || 'U').toUpperCase())
const primerNombre = computed(() => nombre.value.trim().split(/\s+/)[0])
const nombreRol = computed(() => ({
  admin: 'Administrador',
  editor: 'Editor del catálogo',
  noticias: 'Editor de noticias',
  user: 'Usuario'
}[auth.user?.role] || 'Usuario'))

const opcionesUsuario = computed(() => {
  const ops = [{ to: '/perfil', label: 'Mi perfil', icono: 'usuario' }]
  if (auth.isAdmin || auth.isNoticias || auth.isEditor) {
    ops.push({ to: '/panel', label: 'Panel de control', icono: 'panel' })
  }
  return ops
})

function esActivo(enlace) {
  if (enlace.exacto) return route.path === enlace.to
  return route.path === enlace.to || route.path.startsWith(enlace.to + '/')
}

function cerrarMenus() {
  menuMovilAbierto.value = false
  menuUsuarioAbierto.value = false
}

function cerrarSesion() {
  cerrarMenus()
  auth.logout()
  toast.info('Cerraste sesión. ¡Vuelve pronto!')
  router.push('/login')
}

function onDocClick(e) {
  if (menuUsuarioAbierto.value && zonaUsuario.value && !zonaUsuario.value.contains(e.target)) {
    menuUsuarioAbierto.value = false
  }
}
function onKey(e) {
  if (e.key === 'Escape') cerrarMenus()
}
function onResize() {
  if (window.innerWidth > 900) menuMovilAbierto.value = false
}

watch(() => route.fullPath, cerrarMenus)
watch(menuMovilAbierto, (v) => {
  document.documentElement.classList.toggle('menu-movil-abierto', v)
})

onMounted(() => {
  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', onKey)
  window.addEventListener('resize', onResize)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onKey)
  window.removeEventListener('resize', onResize)
  document.documentElement.classList.remove('menu-movil-abierto')
})
</script>

<template>
  <header class="pm-header">
    <div class="contenedor">
      <nav class="pm-nav" aria-label="Navegación principal">
        <RouterLink to="/" class="logotipo-hoja" aria-label="Plantamoss, ir al inicio">
          <img src="/img/logo-claro.png" alt="" class="icono-logo" width="48" height="48" />
          <h2>plantamoss</h2>
        </RouterLink>

        <!-- Escritorio -->
        <ul class="menu-ramas">
          <li v-for="e in enlaces" :key="e.to">
            <RouterLink :to="e.to" class="menu-enlace" :class="{ activo: esActivo(e) }" :aria-current="esActivo(e) ? 'page' : undefined">
              {{ e.label }}
            </RouterLink>
          </li>
        </ul>

        <div class="pm-nav-derecha">
          <div v-if="auth.isAuth" ref="zonaUsuario" class="menu-usuario">
            <button
              type="button"
              class="usuario-boton"
              :aria-expanded="menuUsuarioAbierto"
              aria-haspopup="menu"
              @click.stop="menuUsuarioAbierto = !menuUsuarioAbierto"
            >
              <span class="avatar" aria-hidden="true">{{ inicial }}</span>
              <span class="usuario-nombre">{{ primerNombre }}</span>
              <svg class="flecha" :class="{ girada: menuUsuarioAbierto }" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9" /></svg>
            </button>
            <Transition name="desplegable">
              <div v-if="menuUsuarioAbierto" class="usuario-desplegable" role="menu">
                <div class="desplegable-cabecera">
                  <span class="avatar avatar-grande" aria-hidden="true">{{ inicial }}</span>
                  <div class="desplegable-datos">
                    <strong>{{ nombre }}</strong>
                    <small>{{ auth.user?.email }}</small>
                    <span class="desplegable-rol">{{ nombreRol }}</span>
                  </div>
                </div>
                <RouterLink
                  v-for="op in opcionesUsuario"
                  :key="op.to"
                  :to="op.to"
                  class="desplegable-opcion"
                  role="menuitem"
                >
                  <Icono :nombre="op.icono" :tamano="16" /> {{ op.label }}
                </RouterLink>
                <button type="button" class="desplegable-opcion desplegable-salir" role="menuitem" @click="cerrarSesion">
                  <Icono nombre="salir" :tamano="16" /> Cerrar sesión
                </button>
              </div>
            </Transition>
          </div>
          <RouterLink v-else to="/login" class="boton-acceso boton-acceso-escritorio">Iniciar Sesión</RouterLink>

          <button
            type="button"
            class="hamburguesa"
            :class="{ abierta: menuMovilAbierto }"
            :aria-expanded="menuMovilAbierto"
            aria-controls="menu-movil"
            :aria-label="menuMovilAbierto ? 'Cerrar menú' : 'Abrir menú'"
            @click.stop="menuMovilAbierto = !menuMovilAbierto"
          >
            <span></span><span></span><span></span>
          </button>
        </div>
      </nav>
    </div>

    <!-- Móvil -->
    <Transition name="fondo-menu">
      <div v-if="menuMovilAbierto" class="menu-movil-fondo" @click="menuMovilAbierto = false"></div>
    </Transition>
    <div id="menu-movil" class="menu-movil" :class="{ abierto: menuMovilAbierto }" :aria-hidden="!menuMovilAbierto">
      <ul>
        <li v-for="(e, i) in enlaces" :key="e.to" :style="{ transitionDelay: menuMovilAbierto ? `${60 + i * 40}ms` : '0ms' }">
          <RouterLink :to="e.to" class="movil-enlace" :class="{ activo: esActivo(e) }" :tabindex="menuMovilAbierto ? 0 : -1">
            {{ e.label }}
          </RouterLink>
        </li>
      </ul>
      <div v-if="auth.isAuth" class="movil-usuario">
        <div class="movil-usuario-cabecera">
          <span class="avatar" aria-hidden="true">{{ inicial }}</span>
          <div>
            <strong>{{ nombre }}</strong>
            <small>{{ nombreRol }}</small>
          </div>
        </div>
        <RouterLink
          v-for="op in opcionesUsuario"
          :key="op.to"
          :to="op.to"
          class="movil-enlace movil-sub"
          :class="{ activo: route.path === op.to }"
          :tabindex="menuMovilAbierto ? 0 : -1"
        >
          <Icono :nombre="op.icono" :tamano="16" /> {{ op.label }}
        </RouterLink>
        <button type="button" class="movil-salir" :tabindex="menuMovilAbierto ? 0 : -1" @click="cerrarSesion">Cerrar sesión</button>
      </div>
      <div v-else class="movil-usuario">
        <RouterLink to="/login" class="boton-acceso movil-acceso" :tabindex="menuMovilAbierto ? 0 : -1">Iniciar Sesión</RouterLink>
      </div>
    </div>
  </header>
</template>

<style scoped>
.pm-header {
  background: linear-gradient(135deg, #2b5e3f, #3a7a4f);
  color: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
}
.pm-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  min-height: var(--alto-header);
  padding: 10px 0;
}
.logotipo-hoja {
  display: flex;
  align-items: center;
  gap: 8px;
  color: white;
  text-decoration: none;
  flex-shrink: 0;
}
.logotipo-hoja h2 {
  margin: 0;
  font-size: 2.3rem;
  font-weight: 900;
  text-transform: lowercase;
  letter-spacing: -1.5px;
  line-height: 1;
}
.icono-logo {
  width: 48px;
  height: 48px;
  transition: transform 0.3s ease;
}
.logotipo-hoja:hover .icono-logo { transform: scale(1.08) rotate(-4deg); }

.menu-ramas {
  list-style: none;
  display: flex;
  gap: 6px;
  margin: 0;
  padding: 0;
}
.menu-enlace {
  position: relative;
  display: block;
  color: white;
  text-decoration: none;
  font-weight: 500;
  padding: 8px 14px;
  border-radius: 20px;
  transition: background 0.25s, color 0.25s;
}
.menu-enlace:hover { color: #a5d6a7; }
.menu-enlace.activo {
  background: rgba(255, 255, 255, 0.16);
  color: #fff;
  font-weight: 700;
}
.menu-enlace.activo::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: 2px;
  width: 18px;
  height: 3px;
  border-radius: 3px;
  background: #a5d6a7;
  transform: translateX(-50%);
}

.pm-nav-derecha { display: flex; align-items: center; gap: 10px; }

/* Usuario */
.menu-usuario { position: relative; }
.usuario-boton {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fff;
  border: none;
  color: #1d2b22;
  padding: 4px 12px 4px 4px;
  border-radius: 999px;
  cursor: pointer;
  font-size: 0.92rem;
  font-weight: 700;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
  transition: background 0.2s;
}
.usuario-boton:hover,
.usuario-boton[aria-expanded='true'] { background: #f2f4f3; }
.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #2b5e3f;
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  font-size: 1rem;
  flex-shrink: 0;
}
.avatar-grande { width: 44px; height: 44px; font-size: 1.3rem; }
.usuario-nombre { max-width: 130px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.flecha { transition: transform 0.2s; color: #1d2b22; flex-shrink: 0; }
.flecha.girada { transform: rotate(180deg); }

.usuario-desplegable {
  position: absolute;
  right: 0;
  top: calc(100% + 10px);
  width: 270px;
  background: white;
  color: #1d2b22;
  border: 1px solid #e5e9e6;
  border-radius: 14px;
  box-shadow: 0 15px 40px rgba(16, 40, 26, 0.18);
  padding: 8px;
  z-index: 1100;
}
.usuario-desplegable::before {
  content: '';
  position: absolute;
  top: -6px;
  right: 24px;
  width: 12px;
  height: 12px;
  background: white;
  transform: rotate(45deg);
}
.desplegable-cabecera {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #eef3ef;
  margin-bottom: 6px;
}
.desplegable-datos { display: flex; flex-direction: column; min-width: 0; }
.desplegable-datos strong { color: #1d2b22; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.desplegable-datos small { color: #66736a; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.desplegable-rol {
  margin-top: 4px;
  align-self: flex-start;
  font-size: 0.72rem;
  background: #f2f4f3;
  color: #1d2b22;
  border: 1px solid #e5e9e6;
  padding: 2px 8px;
  border-radius: 999px;
  font-weight: 600;
}
.desplegable-opcion {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  border-radius: 10px;
  color: #1d2b22;
  text-decoration: none;
  font-size: 0.9rem;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
}
.desplegable-opcion:hover, .desplegable-opcion.router-link-active { background: #f2f4f3; color: #1d2b22; }
.desplegable-salir { color: #c62828; border-top: 1px solid #eef3ef; border-radius: 0 0 10px 10px; margin-top: 4px; }
.desplegable-salir:hover { background: #fdf0f0; color: #c62828; }

.desplegable-enter-active, .desplegable-leave-active { transition: opacity 0.18s ease, transform 0.18s ease; }
.desplegable-enter-from, .desplegable-leave-to { opacity: 0; transform: translateY(-6px) scale(0.98); }

/* Hamburguesa */
.hamburguesa {
  display: none;
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 12px;
  background: #fff;
  cursor: pointer;
  position: relative;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
}
.hamburguesa:hover { background: #f2f4f3; }
.hamburguesa span {
  position: absolute;
  left: 11px;
  width: 22px;
  height: 2.5px;
  background: #1d2b22;
  border-radius: 2px;
  transition: transform 0.3s ease, opacity 0.2s ease, top 0.3s ease;
}
.hamburguesa span:nth-child(1) { top: 14px; }
.hamburguesa span:nth-child(2) { top: 21px; }
.hamburguesa span:nth-child(3) { top: 28px; }
.hamburguesa.abierta span:nth-child(1) { top: 21px; transform: rotate(45deg); }
.hamburguesa.abierta span:nth-child(2) { opacity: 0; transform: translateX(-8px); }
.hamburguesa.abierta span:nth-child(3) { top: 21px; transform: rotate(-45deg); }

/* Panel móvil */
.menu-movil { display: none; }
.menu-movil-fondo { display: none; }

@media (max-width: 900px) {
  .menu-ramas, .boton-acceso-escritorio, .menu-usuario { display: none; }
  .hamburguesa { display: block; }
  .logotipo-hoja h2 { font-size: 1.9rem; }
  .icono-logo { width: 40px; height: 40px; }

  .menu-movil {
    display: block;
    position: absolute;
    left: 0;
    right: 0;
    top: 100%;
    background: linear-gradient(180deg, #2f6644, #2b5e3f);
    box-shadow: 0 12px 25px rgba(0, 0, 0, 0.25);
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.35s ease;
    z-index: 999;
  }
  .menu-movil.abierto { max-height: calc(100vh - var(--alto-header)); overflow-y: auto; }
  .menu-movil ul { list-style: none; margin: 0; padding: 10px 16px 0; }
  .menu-movil li {
    opacity: 0;
    transform: translateY(-8px);
    transition: opacity 0.25s ease, transform 0.25s ease;
  }
  .menu-movil.abierto li { opacity: 1; transform: none; }
  .movil-enlace {
    display: flex;
    align-items: center;
    gap: 10px;
    color: white;
    text-decoration: none;
    padding: 13px 14px;
    border-radius: 12px;
    font-size: 1.05rem;
    font-weight: 500;
  }
  .movil-enlace:hover { background: rgba(255, 255, 255, 0.08); }
  .movil-enlace.activo { background: rgba(255, 255, 255, 0.16); font-weight: 700; box-shadow: inset 4px 0 0 #a5d6a7; }
  .movil-sub { font-size: 0.98rem; }
  .movil-usuario { padding: 10px 16px 18px; border-top: 1px solid rgba(255, 255, 255, 0.15); margin-top: 10px; }
  .movil-usuario-cabecera { display: flex; align-items: center; gap: 10px; padding: 8px 14px 10px; }
  .movil-usuario-cabecera .avatar { background: #fff; color: #2b5e3f; }
  .movil-usuario-cabecera div { display: flex; flex-direction: column; }
  .movil-usuario-cabecera small { color: #c8e6c9; }
  .movil-salir {
    width: 100%;
    margin-top: 8px;
    padding: 12px;
    border-radius: 12px;
    border: none;
    background: #fff;
    color: #c62828;
    font-size: 0.95rem;
    font-weight: 700;
    cursor: pointer;
  }
  .movil-salir:hover { background: #fdf0f0; }
  .movil-acceso { display: block; text-align: center; padding: 12px; margin-top: 6px; }

  .menu-movil-fondo {
    display: block;
    position: fixed;
    inset: 0;
    top: var(--alto-header);
    background: rgba(0, 0, 0, 0.35);
    z-index: 998;
  }
  .fondo-menu-enter-active, .fondo-menu-leave-active { transition: opacity 0.3s; }
  .fondo-menu-enter-from, .fondo-menu-leave-to { opacity: 0; }
}

@media (max-width: 380px) {
  .logotipo-hoja h2 { font-size: 1.6rem; }
  .icono-logo { width: 34px; height: 34px; }
}
</style>
