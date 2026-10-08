<script setup>
import Icono from '@/components/Icono.vue'
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

const secciones = computed(() => {
  const s = [
    {
      titulo: 'Navegación',
      icono: 'brujula',
      enlaces: [
        { to: '/', label: 'Inicio' },
        { to: '/mapa', label: 'Mapa interactivo' },
        { to: '/sitemap', label: 'Mapa del sitio' }
      ]
    },
    {
      titulo: 'Catálogo',
      icono: 'hoja',
      enlaces: [
        { to: '/catalogo', label: 'Todas las plantas' },
        { to: { path: '/catalogo', query: { clima: 'arido' } }, label: 'Clima árido' },
        { to: { path: '/catalogo', query: { clima: 'tropical' } }, label: 'Clima tropical' }
      ]
    },
    {
      titulo: 'Comunidad',
      icono: 'documento',
      enlaces: [
        { to: '/blog', label: 'Blog' },
        ...(auth.emailVerificado
          ? [
              { to: '/blog/publicar', label: 'Publicar un blog' },
              { to: '/blog/mios', label: 'Mis blogs' }
            ]
          : [])
      ]
    },
    {
      titulo: 'Cuenta',
      icono: 'usuario',
      // /login, /register y /recuperar-contrasena son solo para visitantes (el sitemap exige sesión):
      // con sesión iniciada redirigían al inicio, por eso no se listan.
      enlaces: auth.emailVerificado
        ? [{ to: '/perfil', label: 'Mi perfil' }]
        : [{ to: '/verificar-correo', label: 'Verificar correo' }]
    },
    {
      titulo: 'Legal',
      icono: 'legal',
      enlaces: [
        { to: '/terminos', label: 'Términos y condiciones' },
        { to: '/privacidad', label: 'Aviso de privacidad' }
      ]
    }
  ]
  if (auth.isAdmin || auth.isEditor || auth.isNoticias) {
    const enlaces = [{ to: '/panel', label: 'Dashboard' }]
    if (auth.isEditor) enlaces.push({ to: '/panel/plantas', label: 'Plantas' })
    if (auth.isNoticias) {
      enlaces.push({ to: '/panel/noticias', label: 'Noticias' })
      enlaces.push({ to: '/panel/blogs', label: 'Blogs' })
    }
    if (auth.isAdmin) {
      enlaces.push({ to: '/panel/usuarios', label: 'Usuarios' })
      enlaces.push({ to: '/panel/usuarios/crear', label: 'Nuevo usuario' })
    }
    s.push({ titulo: 'Panel de control', icono: 'panel', enlaces })
  }
  return s
})
</script>

<template>
  <div class="mapa-sitio-contenedor">
    <h1 class="mapa-titulo">Mapa del Sitio</h1>

    <div class="mapa-grid">
      <section v-for="s in secciones" :key="s.titulo" class="mapa-tarjeta">
        <h2 class="mapa-tarjeta-titulo"><Icono :nombre="s.icono" :tamano="20" /> {{ s.titulo }}</h2>
        <ul class="mapa-lista">
          <li v-for="e in s.enlaces" :key="e.label">
            <RouterLink :to="e.to" class="mapa-enlace">{{ e.label }}</RouterLink>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>

<style scoped>
.mapa-sitio-contenedor { max-width: 1100px; margin: 40px auto 0; padding: 0 16px; }
.mapa-titulo { color: #1d2b22; font-size: clamp(1.6rem, 4vw, 2rem); margin: 0 0 24px; font-weight: 800; }
.mapa-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(260px, 100%), 1fr)); gap: 16px; }
.mapa-tarjeta {
  background: #fff;
  border-radius: 16px;
  padding: 18px 18px 14px;
  border: 1px solid #e5e9e6;
}
.mapa-tarjeta-titulo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.95rem;
  color: #1d2b22;
  margin: 0 0 10px;
  font-weight: 800;
}
.mapa-tarjeta-titulo .icono { color: #66736a; }
.mapa-lista { list-style: none; padding: 0; margin: 0; }
.mapa-enlace {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #33413a;
  text-decoration: none;
  padding: 9px 10px;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 500;
  transition: background 0.15s, color 0.15s;
}
.mapa-enlace::after { content: '›'; color: #c2cac5; font-size: 1.2rem; line-height: 1; }
.mapa-enlace:hover { background: #f2f4f3; color: #1d2b22; }
.mapa-enlace:hover::after { color: #2b5e3f; }
</style>
