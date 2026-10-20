# Plantamoss 2026 — Front (Vue 3 + Vite)

Catálogo de flora mexicana: inicio con noticias, clima y videos; catálogo filtrable; mapa interactivo
de México; blog de la comunidad; cuentas de usuario y un panel de control para administradores y editores.

Este front consume la **API .NET 9** (`ApiPlantamoss/PlantamossApi`, puerto 5080). El contrato completo
entre BD, API y front está en [`CONTRATO.md`](./CONTRATO.md).

## Requisitos

- Node.js 20+ (probado con Node 22) y npm 10+
- La API corriendo en `http://localhost:5080` (y su PostgreSQL en el puerto 5434)

## Cómo correrlo

```bash
npm install
cp .env.example .env      # en Windows: copy .env.example .env
npm run dev               # http://localhost:5173
```

Otros comandos:

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo en el puerto **5173** |
| `npm run build` | Compila a `dist/` |
| `npm run preview` | Sirve la compilación de `dist/` |
| `npm run extraer-mapa` | Regenera `src/assets/data/mexico-estados.json` a partir del blade original |

### Variables de entorno

| Variable | Ejemplo | Descripción |
|---|---|---|
| `VITE_API_URL` | `http://localhost:5080/api` | URL base de la API |

Las cuentas de prueba (admin, editor, noticias, usuario) están documentadas en `ApiPlantamoss/README.md`.

## Estructura

```
src/
  main.js                 Arranque: Pinia, router, refresco de sesión (GET /auth/me)
  App.vue                 Header + footer públicos, banner "verifica tu correo", toasts
  router/index.js         Rutas y guards (requiresAuth, guestOnly, requiresVerified, roles)
  services/api.js         Axios con Bearer (pm_token) + mensajeError(err)
  stores/auth.js          Store de sesión (Pinia) persistido en localStorage
  composables/useToast.js Notificaciones (success / error / info)
  layouts/
    AppHeader.vue         Menú con estado activo, hamburguesa móvil y menú de usuario
    AppFooter.vue
    PanelLayout.vue       Layout del panel de control (agente "Panel")
  components/
    BaseModal.vue         Modal base (Teleport, blur, ESC, clic fuera, bloqueo de scroll)
    ConfirmModal.vue      Confirmación (reemplaza confirm())
    Breadcrumb.vue        Migas de pan (.camino)
    PasswordRequisitos.vue
    ToastContainer.vue
    HeroCarousel.vue      Carrusel con flechas, puntos, autoplay y swipe
    PlantaImagen.vue      Imagen con placeholder (ícono lucide) si falla
    PlantaDetalleModal.vue Detalle de planta (catálogo y mapa)
    panel/                Componentes del panel (agente "Panel")
  views/
    HomeView, CatalogoView, MapaView, BlogView, SitemapView,
    TerminosView, PrivacidadView, NotFoundView
    auth/ admin/ editor/ blog/ PerfilView.vue  (agente "cuentas/paneles")
    panel/                (agente "Panel")
  assets/
    css/base.css          Estilos globales portados del original + variables CSS
    css/catalogo.css      Tarjetas de flora, chips, skeletons
    css/legal.css         Páginas legales
    data/mexico-estados.json  32 estados del SVG ([{ nombre, d }])
  utils/plantas.js        Etiquetas de clima/luz, normalizar(), emoji de clima, urlSegura()
public/img/               Logos e imágenes de plantas (agave-azul.jpeg, biznaga.jpeg)
scripts/extraer-mapa.mjs  Extractor de paths del mapa
```

## Rutas

| Ruta | Vista | Acceso |
|---|---|---|
| `/` | Inicio | sesión |
| `/catalogo` | Catálogo (filtros en la URL: `?q=&estado=&clima=&luz=`) | sesión |
| `/mapa` | Mapa interactivo | sesión |
| `/blog` | Blog | sesión |
| `/blog/publicar`, `/blog/:id/editar`, `/blog/mios` | Publicar / editar / mis blogs | sesión + correo verificado |
| `/sitemap` | Mapa del sitio | sesión |
| `/terminos`, `/privacidad` | Legales | público |
| `/login`, `/register`, `/recuperar-contrasena`, `/verificar-codigo`, `/nueva-contrasena` | Autenticación | solo invitados |
| `/verificar-correo` | Verificación de correo | sesión |
| `/perfil` | Mi perfil | sesión + verificado |
| `/panel` | Dashboard del panel | admin, editor, noticias |
| `/panel/usuarios`, `/panel/usuarios/crear`, `/panel/usuarios/:id/editar` | Usuarios | admin |
| `/panel/plantas` | Catálogo (editor) | editor, admin |
| `/panel/noticias` | Noticias | noticias, admin |
| `/panel/blogs` | Moderación de blogs | noticias, admin |

Las rutas antiguas `/admin...` y `/editor/...` redirigen al panel. Sin permiso → `/?error=sin_permiso`
(Inicio muestra "Acceso Denegado").

## Notas de seguridad

- Nunca se usa `v-html` con datos de la API: los textos con saltos de línea se muestran con `white-space: pre-line`.
- Las URLs externas (imágenes, noticias) pasan por `urlSegura()` (solo `http/https` o rutas relativas).
- Las API keys de OpenWeather y YouTube viven solo en la API (`/externo/clima`, `/externo/videos`).

## Cambios respecto al original (Laravel)

- El mapa ahora empareja "Estado de México" y "Ciudad de México" (antes `México` / `Distrito Federal` nunca coincidían).
- El mapa del sitio enlaza a `/register` (antes `/registrar`, roto).
- Menú móvil con hamburguesa, menú de usuario desplegable, footer y toasts.

## Pendientes

- **PWA**: agregar `manifest.webmanifest` (nombre, íconos a partir de `public/img/logo.png`, colores `#2b5e3f`)
  y un *service worker* (p. ej. con `vite-plugin-pwa`) para caché del shell y uso sin conexión del catálogo.
- **App móvil en Flutter**: consumirá esta misma API REST (`/api`, JWT Bearer, DTOs en camelCase del `CONTRATO.md`).
