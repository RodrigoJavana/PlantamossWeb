import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import HomeView from '@/views/HomeView.vue'

const routes = [
  { path: '/', name: 'home', component: HomeView, meta: { requiresAuth: true, title: 'Inicio' } },
  { path: '/catalogo', name: 'catalogo', component: () => import('../views/CatalogoView.vue'), meta: { requiresAuth: true, title: 'Catálogo de Flora' } },
  { path: '/mapa', name: 'mapa', component: () => import('../views/MapaView.vue'), meta: { requiresAuth: true, title: 'Mapa Interactivo' } },
  { path: '/blog/publicar', name: 'blog-publicar', component: () => import('../views/blog/BlogFormView.vue'), meta: { requiresAuth: true, requiresVerified: true, title: 'Publicar Blog' } },
  { path: '/blog/mios', name: 'blog-mios', component: () => import('../views/blog/MisBlogsView.vue'), meta: { requiresAuth: true, requiresVerified: true, title: 'Mis Blogs' } },
  { path: '/blog/:id/editar', name: 'blog-editar', component: () => import('../views/blog/BlogFormView.vue'), props: true, meta: { requiresAuth: true, requiresVerified: true, title: 'Editar Blog' } },
  { path: '/blog', name: 'blog', component: () => import('../views/BlogView.vue'), meta: { requiresAuth: true, title: 'Blog' } },
  { path: '/sitemap', name: 'sitemap', component: () => import('../views/SitemapView.vue'), meta: { requiresAuth: true, title: 'Mapa del Sitio' } },
  { path: '/terminos', name: 'terminos', component: () => import('../views/TerminosView.vue'), meta: { title: 'Términos y Condiciones' } },
  { path: '/privacidad', name: 'privacidad', component: () => import('../views/PrivacidadView.vue'), meta: { title: 'Aviso de Privacidad' } },

  // Autenticación (vistas del agente "cuentas/paneles")
  { path: '/login', name: 'login', component: () => import('../views/auth/LoginView.vue'), meta: { guestOnly: true, title: 'Iniciar Sesión', auth: true } },
  { path: '/register', name: 'register', component: () => import('../views/auth/RegisterView.vue'), meta: { guestOnly: true, title: 'Registro', auth: true } },
  { path: '/recuperar-contrasena', name: 'recuperar', component: () => import('../views/auth/RecuperarView.vue'), meta: { guestOnly: true, title: 'Recuperar Contraseña', auth: true } },
  { path: '/verificar-codigo', name: 'verificar-codigo', component: () => import('../views/auth/VerificarCodigoView.vue'), meta: { guestOnly: true, title: 'Verificar Código', auth: true } },
  { path: '/nueva-contrasena', name: 'nueva-contrasena', component: () => import('../views/auth/NuevaPasswordView.vue'), meta: { guestOnly: true, title: 'Nueva Contraseña', auth: true } },
  { path: '/forgot-password', redirect: '/recuperar-contrasena' },
  { path: '/verificar-correo', name: 'verificar-correo', component: () => import('../views/auth/VerificarCorreoView.vue'), meta: { requiresAuth: true, title: 'Verificar Correo', auth: true } },

  // Cuenta
  { path: '/perfil', name: 'perfil', component: () => import('../views/PerfilView.vue'), meta: { requiresAuth: true, requiresVerified: true, title: 'Mi Perfil' } },

  // Panel de control (layout propio, sin header/footer público)
  {
    path: '/panel',
    component: () => import('../layouts/PanelLayout.vue'),
    meta: { requiresAuth: true, requiresVerified: true, layout: 'panel', roles: ['admin', 'editor', 'noticias'] },
    children: [
      { path: '', name: 'panel', component: () => import('../views/panel/PanelDashboardView.vue'), meta: { title: 'Panel de control', breadcrumb: ['Administración', 'Dashboard'] } },
      { path: 'usuarios', name: 'panel-usuarios', component: () => import('../views/admin/AdminUsuariosView.vue'), meta: { roles: ['admin'], title: 'Usuarios', breadcrumb: ['Administración', 'Usuarios', 'Lista'] } },
      { path: 'usuarios/crear', name: 'panel-usuarios-crear', component: () => import('../views/admin/AdminUsuarioFormView.vue'), meta: { roles: ['admin'], title: 'Registrar Usuario', breadcrumb: ['Administración', 'Usuarios', 'Registrar'] } },
      { path: 'usuarios/:id/editar', name: 'panel-usuarios-editar', component: () => import('../views/admin/AdminUsuarioFormView.vue'), props: true, meta: { roles: ['admin'], title: 'Editar Usuario', breadcrumb: ['Administración', 'Usuarios', 'Editar'] } },
      { path: 'plantas', name: 'panel-plantas', component: () => import('../views/editor/EditorPlantasView.vue'), meta: { roles: ['editor', 'admin'], title: 'Catálogo de Plantas', breadcrumb: ['Contenido', 'Plantas'] } },
      { path: 'noticias', name: 'panel-noticias', component: () => import('../views/editor/EditorNoticiasView.vue'), meta: { roles: ['noticias', 'admin'], title: 'Noticias', breadcrumb: ['Contenido', 'Noticias'] } },
      { path: 'blogs', name: 'panel-blogs', component: () => import('../views/editor/EditorBlogsView.vue'), meta: { roles: ['noticias', 'admin'], title: 'Blogs', breadcrumb: ['Contenido', 'Blogs'] } }
    ]
  },

  // Rutas antiguas → panel
  { path: '/admin', redirect: '/panel/usuarios' },
  { path: '/admin/usuario/crear', redirect: '/panel/usuarios/crear' },
  { path: '/admin/usuario/:id/editar', redirect: (to) => `/panel/usuarios/${to.params.id}/editar` },
  { path: '/editor/noticias', redirect: '/panel/noticias' },
  { path: '/editor/plantas', redirect: '/panel/plantas' },

  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('../views/NotFoundView.vue'), meta: { title: 'Página no encontrada' } }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    // Si solo cambia la query (p. ej. filtros del catálogo) no saltamos al inicio.
    if (to.path === from.path && from.name) return false
    return { top: 0 }
  }
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  const matched = to.matched
  const algun = (clave) => matched.some((r) => r.meta?.[clave])

  if (algun('requiresAuth') && !auth.isAuth) {
    return { path: '/login', query: to.fullPath !== '/' ? { redirect: to.fullPath } : {} }
  }

  if (algun('guestOnly') && auth.isAuth) {
    return { path: '/' }
  }

  if (algun('requiresVerified') && !auth.emailVerificado) {
    return { path: '/verificar-correo' }
  }

  // Se evalúan los roles de TODOS los registros (padre /panel y la hija).
  const rol = auth.user?.role
  const sinPermiso = matched.some(
    (r) => Array.isArray(r.meta?.roles) && r.meta.roles.length && !r.meta.roles.includes(rol)
  )
  if (sinPermiso) {
    return { path: '/', query: { error: 'sin_permiso' } }
  }

  return true
})

router.afterEach((to) => {
  document.title = to.meta?.title ? `Plantamoss - ${to.meta.title}` : 'Plantamoss'
})

export default router
