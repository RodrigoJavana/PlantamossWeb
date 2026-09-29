# Plantamoss 2026 — Contrato compartido (BD · API .NET · Front Vue)

Este documento es la **fuente de verdad** entre la base de datos, la API y el front.
Si algo no está aquí, sigue la convención más simple y consistente con lo que sí está.

Proyecto original (Laravel, solo referencia, NO modificar):
`C:\Users\Rodrigo Javana\Desktop\Archivos\Planta-Moss-Proyecto`

| Pieza | Carpeta | Puerto local |
|---|---|---|
| PostgreSQL 16 (imagen propia) | `C:\Users\Rodrigo Javana\Desktop\Google Antigravity\ApiPlantamoss\database` | **5434** (host) → 5432 (contenedor) |
| API .NET 9 | `C:\Users\Rodrigo Javana\Desktop\Google Antigravity\ApiPlantamoss\PlantamossApi` | **5080** |
| Front Vue 3 + Vite | `C:\Users\Rodrigo Javana\Desktop\Google Antigravity\Plantamoss2026` | **5173** |

Credenciales BD (desarrollo): db `plantamoss`, user `plantamoss`, password `plantamoss_dev`.
Cadena: `Host=localhost;Port=5434;Database=plantamoss;Username=plantamoss;Password=plantamoss_dev`
(dentro de docker-compose el host es `db` y el puerto 5432).

Roles: `user` (normal), `editor` (catálogo de plantas), `noticias` (editor de noticias), `admin` (todo).
Estados de cuenta: `activo`, `suspendido`.
`tipo_clima` ∈ `tropical | arido | templado | frio` · `luz_sol` ∈ `sol_directo | sombra_parcial | sombra`.

---

## 1. Esquema PostgreSQL (snake_case, igual que el original)

```
users
  id                 bigserial PK
  name               varchar(255) not null
  email              varchar(255) not null unique   (guardar en minúsculas)
  email_verified_at  timestamptz null
  password           varchar(255) not null          (hash bcrypt, compatible con BCrypt.Net-Next)
  role               varchar(20)  not null default 'user'    CHECK in roles
  estado             varchar(20)  not null default 'activo'  CHECK in estados
  created_at         timestamptz not null default now()
  updated_at         timestamptz not null default now()

estados
  id_estado          serial PK
  nombre_estado      varchar(100) not null unique   (con acentos: "Nuevo León", "Ciudad de México", "Estado de México", ...)
  clima_predominante varchar(100) null

catalogo_flora
  id_planta          serial PK
  nombre_planta      varchar(255) not null
  nombre_cientifico  varchar(255) null
  letra_inicial      char(1) not null               (mayúscula de nombre_planta)
  id_estado          int null FK estados ON DELETE SET NULL
  url_imagen         varchar(500) null
  tipo_clima         varchar(50) not null default 'templado'   CHECK
  luz_sol            varchar(50) not null default 'sol_directo' CHECK
  riego              varchar(100) null              (texto corto: "Escaso, cada 3 semanas")
  descripcion        text null
  cuidados_texto     text null                      (texto plano, puede tener saltos de línea \n)
  created_at, updated_at timestamptz default now()

noticias
  id_noticia         serial PK
  titulo             varchar(255) not null
  contenido          text not null
  url_imagen         varchar(500) null
  url_externa        varchar(500) null
  destacada          boolean not null default false
  activa             boolean not null default true
  id_editor          bigint null FK users ON DELETE SET NULL
  fecha_publicacion  timestamptz not null default now()

miniblogs
  id_blog            serial PK
  id_usuario         bigint null FK users ON DELETE SET NULL
  titulo             varchar(255) not null
  contenido          text not null
  contenido2         text null
  contenido3         text null
  url_imagen         varchar(500) null
  url_imagen_2 .. url_imagen_5   varchar(500) null
  fecha_publicacion  timestamptz not null default now()

password_reset_codes          (códigos de 6 dígitos para recuperar contraseña Y verificar correo)
  id                 bigserial PK
  email              varchar(255) not null (index)
  code               varchar(6) not null
  tipo               varchar(20) not null default 'reset'   CHECK in ('reset','verificacion')
  intentos           int not null default 0
  expires_at         timestamptz not null
  created_at         timestamptz not null default now()
```

Índices: `catalogo_flora(id_estado)`, `catalogo_flora(lower(nombre_planta))`, `noticias(activa, destacada, fecha_publicacion desc)`.

Usuarios semilla (contraseña hasheada con `crypt(..., gen_salt('bf', 10))` de pgcrypto, correo ya verificado).
Las contraseñas de prueba se documentan SOLO en `ApiPlantamoss/README.md` y en el seed:
`admin@plantamoss.com` (admin), `editor@plantamoss.com` (editor), `noticias@plantamoss.com` (noticias), `usuario@plantamoss.com` (user).

---

## 2. API REST (.NET 9) — base `http://localhost:5080/api`

* JSON en **camelCase**. Fechas ISO-8601 UTC.
* Auth: **JWT Bearer** (`Authorization: Bearer <token>`), expiración 8 h. Claims: `sub`=id, `email`, `name`, `role`.
* Errores SIEMPRE con forma: `{ "message": "texto en español", "errors": { "campo": ["msg"] } }` (`errors` opcional).
  - 400 regla de negocio · 401 sin sesión/credenciales malas · 403 sin permiso / cuenta suspendida
  - 404 no existe · 422 validación (con `errors`, claves en camelCase) · 429 demasiados intentos
* CORS: permitir `http://localhost:5173` (configurable en appsettings `Cors:Origins`).
* Swagger en `/swagger` (con botón Authorize para el JWT).

### DTOs
```
UserDto      { id, name, email, role, estado, emailVerificado: bool, createdAt }
AuthResponse { token, user: UserDto }
EstadoDto    { idEstado, nombreEstado, climaPredominante, cantidadPlantas }
PlantaDto    { idPlanta, nombrePlanta, nombreCientifico, letraInicial, idEstado, nombreEstado,
               urlImagen, tipoClima, luzSol, riego, descripcion, cuidadosTexto, createdAt, updatedAt }
NoticiaDto   { idNoticia, titulo, contenido, urlImagen, urlExterna, destacada, activa,
               idEditor, nombreEditor, fechaPublicacion }
BlogDto      { idBlog, titulo, contenido, contenido2, contenido3, urlImagen, urlImagen2, urlImagen3,
               urlImagen4, urlImagen5, fechaPublicacion, autor }   (autor = name del usuario o "Anónimo")
```

### Auth (`/api/auth`)
| Método | Ruta | Body | Respuesta |
|---|---|---|---|
| POST | `/auth/register` | `{ name, email, password, passwordConfirmation, terminos: bool, privacidad: bool }` | 201 `AuthResponse`. Envía código de verificación al correo. Reglas password: ≥8, mayúscula, minúscula, número, especial. 422 si email ya existe (`errors.email`). |
| POST | `/auth/login` | `{ email, password }` | 200 `AuthResponse` · 401 "Credenciales incorrectas." · 403 si `estado=suspendido` · 429 tras 5 intentos fallidos/min |
| GET | `/auth/me` | — (auth) | `UserDto` |
| POST | `/auth/verificar-correo` | `{ codigo }` (auth) | 200 `{ message, user: UserDto }` · 422 código malo/expirado |
| POST | `/auth/verificar-correo/reenviar` | — (auth) | 200 `{ message }` |
| POST | `/auth/recuperar` | `{ email }` | 200 `{ message }` · 404 "No encontramos ninguna cuenta con ese correo." Código 6 dígitos, expira 15 min |
| POST | `/auth/recuperar/verificar` | `{ email, codigo }` | 200 `{ resetToken }` (JWT corto 15 min, propósito reset) · 422 si incorrecto/expirado (máx 5 intentos) |
| POST | `/auth/recuperar/restablecer` | `{ email, resetToken, password, passwordConfirmation }` | 200 `{ message }` |

Correo: SMTP configurable (`Smtp:Host, Port, User, Password, From, EnableSsl`). Si `Smtp:Host` está vacío,
el código se escribe en el log de la consola (modo desarrollo) en vez de enviarse.

### Perfil (auth)
| PUT | `/perfil` | `{ name }` | `UserDto` |
| PUT | `/perfil/password` | `{ passwordActual, password, passwordConfirmation }` | `{ message }` |
| DELETE | `/perfil` | `{ password }` | 204 |

### Contenido (GET públicos)
| GET | `/noticias/recientes` | | `NoticiaDto[]` activas, orden destacada desc, fecha desc, máx 4 |
| GET | `/estados` | | `EstadoDto[]` ordenados por nombre (incluye `cantidadPlantas`) |
| GET | `/estados/{id}/plantas` | | `{ estado: EstadoDto, plantas: PlantaDto[] }` |
| GET | `/plantas?q=&estado=&clima=&luz=` | | `PlantaDto[]` orden nombreEstado, letraInicial, nombrePlanta. `q` busca en nombre común y científico, sin distinguir mayúsculas/acentos (ILIKE + unaccent) |
| GET | `/plantas/{id}` | | `PlantaDto` |
| GET | `/blogs` | | `BlogDto[]` fecha desc |

### Catálogo — roles `editor`, `admin`
| POST | `/plantas` | `{ nombrePlanta*, nombreCientifico, idEstado, urlImagen, tipoClima, luzSol, riego, descripcion, cuidadosTexto }` | 201 `PlantaDto` |
| PUT | `/plantas/{id}` | igual | `PlantaDto` |
| DELETE | `/plantas/{id}` | | 204 |

### Editor de noticias — roles `noticias`, `admin`
| GET | `/editor/noticias` | | `NoticiaDto[]` todas, fecha desc |
| POST | `/editor/noticias` | `{ titulo*, contenido*, urlImagen?, urlExterna?, destacada: bool }` | 201 `NoticiaDto` (id_editor = usuario actual) |
| PUT | `/editor/noticias/{id}` | igual | `NoticiaDto` |
| PATCH | `/editor/noticias/{id}/toggle` | | `NoticiaDto` (invierte `activa`) |
| DELETE | `/editor/noticias/{id}` | | 204 |

### Administración — rol `admin`
| GET | `/admin/usuarios?q=` | | `UserDto[]` created_at desc (q filtra nombre/email) |
| GET | `/admin/usuarios/{id}` | | `UserDto` |
| POST | `/admin/usuarios` | `{ name, email, role, estado, password }` (password ≥8) | 201 `UserDto` (correo marcado verificado) |
| PUT | `/admin/usuarios/{id}` | `{ name, role, estado, password? }` (vacío = no cambiar) | `UserDto` |
| DELETE | `/admin/usuarios/{id}` | | 204 · 400 si intenta borrarse a sí mismo |
| GET | `/admin/estadisticas` | | `{ totalUsuarios, usuariosActivos, usuariosSuspendidos, totalPlantas, totalNoticias, totalBlogs, usuariosPorRol: { user, editor, noticias, admin } }` |

### Servicios externos (proxy con caché, las API keys viven SOLO en el servidor)
| GET | `/externo/clima?q=Mexico City,MX` | | `{ ok: bool, temp, sensacion, humedad, viento, descripcion, icono }` (OpenWeather, caché 10 min; `ok=false` si falla) |
| GET | `/externo/videos` | | `[{ videoId, titulo, canal, miniatura, fechaPublicacion }]` (YouTube "plantas mexicanas flora México naturaleza", 6 resultados, caché 6 h; `[]` si falla) |

Config: `OpenWeather:ApiKey`, `YouTube:ApiKey`.

---

## 3. Front Vue 3 (Vite + Vue Router + Pinia + Axios, CSS propio — sin Tailwind)

Variables de entorno: `VITE_API_URL=http://localhost:5080/api`.

### Archivos compartidos (los crea el agente "Vue núcleo"; los demás SOLO los usan)
* `src/services/api.js` → `export default api` (instancia axios con baseURL, agrega el Bearer desde el store/localStorage `pm_token`; en 401 limpia sesión y manda a `/login`). También `export function mensajeError(err)` → string legible del `{message, errors}` de la API.
* `src/stores/auth.js` → `useAuthStore()` (Pinia):
  state `token`, `user`; getters `isAuth`, `isAdmin`, `isNoticias` (noticias|admin), `isEditor` (editor|admin), `emailVerificado`;
  actions `login(email, password)`, `register(payload)`, `logout()`, `fetchMe()`, `setSession(token, user)`, `setUser(user)`.
  Persiste en localStorage (`pm_token`, `pm_user`).
* `src/composables/useToast.js` → `const toast = useToast(); toast.success(msg); toast.error(msg); toast.info(msg)` (renderizado por `<ToastContainer/>` en App.vue).
* `src/components/BaseModal.vue` → props `show: Boolean`, `title: String`, `size: 'sm'|'md'|'lg'` (default md); emite `close`; slots `default` y `footer`. Backdrop con blur, animación, cierra con ESC y clic fuera, bloquea scroll del body, `Teleport to="body"`.
* `src/components/ConfirmModal.vue` → props `show`, `title`, `message`, `confirmText` (default "Confirmar"), `cancelText` (default "Cancelar"), `variant: 'danger'|'primary'` (default danger), `loading: Boolean`; emite `confirm`, `cancel`. Reemplaza todos los `confirm()` del navegador.
* `src/components/Breadcrumb.vue` → prop `items: [{ label, to? }]` (estilo `.camino` del original).
* `src/components/PasswordRequisitos.vue` → prop `password: String`; muestra la lista de requisitos en verde/rojo; emite `update:valido` (bool) o expón `valido` vía `v-model:valido`.
* CSS global portado del original (`public/assets/css/*.css` de Laravel) en `src/assets/css/`: clases `contenedor, formulario, grupo-entrada, boton-natural, boton-acceso, boton-editar, boton-podar, tabla-bosque, cabecera-ramas, contenedor-tabla, alerta-error, alerta-correcto, camino, campo-bloqueado, tarjeta-perfil, etiqueta-rol, etiqueta-dato, lista-permisos, lista-publicaciones, color-verde, color-gris, text-center, fw-bold, font-9rem, py-40, mt-30, mb-20`, etc. Paleta: verde `#2b5e3f`, `#3a7a4f`, `#2e7d32`, claro `#a5d6a7`, `#e8f5e9`, fondo `#f4f9f4`, rojo `#c62828`. Fuente 'Segoe UI'.
  Además variables CSS en `:root` (`--verde-oscuro`, `--verde`, `--verde-claro`, `--fondo`, `--rojo`, `--radio`, `--sombra`).

### Rutas (`src/router/index.js`, lo crea el agente "Vue núcleo")
meta: `requiresAuth`, `requiresVerified`, `roles: []`, `guestOnly`. Sin permiso → `/` con `?error=sin_permiso` (Inicio muestra la alerta "Acceso Denegado").

| Ruta | Vista | meta |
|---|---|---|
| `/` | `views/HomeView.vue` | auth |
| `/catalogo` | `views/CatalogoView.vue` | auth |
| `/mapa` | `views/MapaView.vue` | auth |
| `/blog` | `views/BlogView.vue` | auth |
| `/sitemap` | `views/SitemapView.vue` | auth |
| `/terminos` | `views/TerminosView.vue` | público |
| `/privacidad` | `views/PrivacidadView.vue` | público |
| `/login` | `views/auth/LoginView.vue` | guestOnly |
| `/register` | `views/auth/RegisterView.vue` | guestOnly |
| `/recuperar-contrasena` | `views/auth/RecuperarView.vue` | guestOnly |
| `/verificar-codigo` | `views/auth/VerificarCodigoView.vue` | guestOnly (`?email=`) |
| `/nueva-contrasena` | `views/auth/NuevaPasswordView.vue` | guestOnly (email+resetToken en `sessionStorage` `pm_reset`) |
| `/forgot-password` | redirect → `/recuperar-contrasena` | |
| `/verificar-correo` | `views/auth/VerificarCorreoView.vue` | auth |
| `/perfil` | `views/PerfilView.vue` | auth + verified (si no verificado → `/verificar-correo`) |
| `/admin` | `views/admin/AdminUsuariosView.vue` | roles admin |
| `/admin/usuario/crear` | `views/admin/AdminUsuarioFormView.vue` | roles admin |
| `/admin/usuario/:id/editar` | `views/admin/AdminUsuarioFormView.vue` | roles admin |
| `/editor/noticias` | `views/editor/EditorNoticiasView.vue` | roles noticias, admin |
| `/editor/plantas` | `views/editor/EditorPlantasView.vue` | roles editor, admin (NUEVO: UI para el rol editor) |
| `/:pathMatch(.*)*` | `views/NotFoundView.vue` | |

### Reparto de archivos del front
* **Agente Vue núcleo**: todo `src/` y config del proyecto EXCEPTO `src/views/auth/*`, `src/views/admin/*`, `src/views/editor/*`, `src/views/blog/*`, `src/views/PerfilView.vue`, `src/layouts/PanelLayout.vue`, `src/components/panel/*`, `src/views/panel/*`.
* **Agente Vue cuentas/paneles**: SOLO `src/views/auth/*`, `src/views/admin/*`, `src/views/editor/*`, `src/views/blog/*`, `src/views/PerfilView.vue`.
* **Agente Panel**: SOLO `src/layouts/PanelLayout.vue`, `src/components/panel/*`, `src/views/panel/*`.

---

## 4. CAMBIOS v2 (pedidos por el usuario) — tienen prioridad sobre lo anterior

### 4.1 Panel de control estilo "intranet"
Todas las pantallas de gestión viven dentro de un layout propio `src/layouts/PanelLayout.vue` (SIN el header/footer público).
El router las anida como hijas de una ruta padre `{ path: '/panel', component: PanelLayout, meta: { requiresAuth: true, requiresVerified: true, layout: 'panel', roles: ['admin','editor','noticias'] }, children: [...] }`.
`App.vue` NO muestra header/footer público cuando `route.matched.some(r => r.meta.layout === 'panel')`.

Rutas del panel (las antiguas `/admin...` y `/editor/...` redirigen a las nuevas):
| Ruta | Vista | roles |
|---|---|---|
| `/panel` | `views/panel/PanelDashboardView.vue` | admin, editor, noticias |
| `/panel/usuarios` | `views/admin/AdminUsuariosView.vue` | admin |
| `/panel/usuarios/crear` | `views/admin/AdminUsuarioFormView.vue` | admin |
| `/panel/usuarios/:id/editar` | `views/admin/AdminUsuarioFormView.vue` | admin |
| `/panel/plantas` | `views/editor/EditorPlantasView.vue` | editor, admin |
| `/panel/noticias` | `views/editor/EditorNoticiasView.vue` | noticias, admin |
| `/panel/blogs` | `views/editor/EditorBlogsView.vue` | noticias, admin (moderación de TODOS los blogs) |
Redirects: `/admin`→`/panel/usuarios`, `/admin/usuario/crear`→`/panel/usuarios/crear`, `/admin/usuario/:id/editar`→`/panel/usuarios/:id/editar`, `/editor/noticias`→`/panel/noticias`, `/editor/plantas`→`/panel/plantas`.
Cada ruta hija lleva `meta.title` y `meta.breadcrumb: ['Administración', 'Usuarios y Accesos', 'Lista']` (lo usa la barra superior).

Diseño del panel (referencia: intranet del usuario):
* Sidebar fija izquierda (~300px, blanca, borde derecho suave): logo + "PANEL ADMINISTRATIVO" en negritas; buscador "Buscar opción..." que filtra los items; secciones con títulos en MAYÚSCULAS grises pequeños; items con ícono + texto; grupos desplegables con chevron; item activo resaltado (fondo verde muy claro, texto verde `#2b5e3f`, barra izquierda); al pie fijo "← Volver al sitio" (`/`). Colapsable con la hamburguesa (desktop: modo íconos ~72px; móvil: drawer con backdrop). Solo muestra items permitidos por el rol.
  - PRINCIPAL: Dashboard (`/panel`)
  - CONTENIDO: Catálogo de Plantas (`/panel/plantas`, editor|admin), Noticias (`/panel/noticias`, noticias|admin), Blogs (`/panel/blogs`, noticias|admin)
  - ORGANIZACIÓN (admin): grupo "Usuarios y Accesos" → Lista de usuarios, Registrar usuario
  - SITIO PÚBLICO: grupo "Ver sitio" → Inicio, Catálogo, Mapa interactivo, Blog
* Barra superior blanca: hamburguesa, logo pequeño, breadcrumb a la derecha (`Administración / Usuarios y Accesos / Lista`, el último en "pill" con fondo gris claro), tarjeta de usuario (nombre en MAYÚSCULAS negritas + email pequeño + avatar circular verde con inicial) con dropdown: Mi perfil (`/perfil`), Volver al sitio, Cerrar sesión.
* Área de contenido fondo `#f6f8f7`, tarjetas blancas radio 14px.
* Componentes reutilizables del panel (los crea el agente Panel; las vistas de admin/editor/blogs DEBEN usarlos):
  - `src/components/panel/PanelPageHeader.vue` → props `title`, `subtitle`; slot `actions` (botones a la derecha).
  - `src/components/panel/PanelToolbar.vue` → slot default (buscador + filtros en fila, tarjeta blanca).
  - `src/components/panel/PanelList.vue` → lista tipo filas (NO tabla clásica): props `items`, `loading`, `total`, `page`, `pageSize` (default 20), `emptyText`; emite `update:page`; slot `row` con `{ item }` para el contenido de cada fila; muestra "Mostrando 1 a 20 de 83 registros" y paginador `‹ 1 / 5 ›`; skeleton al cargar; filas con hover y separador.
  - `src/components/panel/StatusBadge.vue` → props `label`, `tone: 'green'|'yellow'|'gray'|'red'|'blue'|'purple'` (badge rectangular redondeado, MAYÚSCULAS, negritas, como "APROBADA / EN PROCESO / BORRADOR").
  - `src/components/panel/RowMenu.vue` → menú de tres puntos `⋮` con props `items: [{ label, icon?, danger?, disabled?, action }]`.
  - `src/components/panel/StatCard.vue` → props `label`, `value`, `icon`, `tone`, `to?`.

### 4.2 Publicar blogs (comunidad)
API (agregar):
| Método | Ruta | Auth | Body / Respuesta |
|---|---|---|---|
| GET | `/blogs/{id}` | público | `BlogDto` |
| GET | `/blogs/mios` | auth | `BlogDto[]` del usuario actual |
| POST | `/blogs` | auth + correo verificado (si no: 403 "Verifica tu correo para publicar.") | `{ titulo*, contenido*, contenido2?, contenido3?, urlImagen*, urlImagen2..5? }` → 201 `BlogDto` (id_usuario = actual, fecha = now) |
| PUT | `/blogs/{id}` | dueño o noticias/admin | igual → `BlogDto` |
| DELETE | `/blogs/{id}` | dueño o noticias/admin | 204 |
`BlogDto` agrega `idUsuario` (number|null) y `puedeEditar` NO (el front lo calcula: `user.id === idUsuario || isNoticias`).
Validación: titulo ≤255, contenido ≥20 chars, URLs válidas http/https.
`/admin/estadisticas` ahora lo pueden consultar roles admin, editor y noticias.

Front:
* `src/views/blog/BlogFormView.vue` (agente cuentas): rutas `/blog/publicar` y `/blog/:id/editar` (meta requiresAuth + requiresVerified; layout público). Formulario con título, imagen principal (URL con vista previa), hasta 4 imágenes extra (agregar/quitar), 3 bloques de contenido (2 y 3 opcionales, "Agregar otro párrafo"), contador de caracteres y vista previa de la tarjeta. Guardar → `/blog` con toast.
* `src/views/blog/MisBlogsView.vue` (agente cuentas): ruta `/blog/mios` — lista de mis blogs con Editar / Eliminar (ConfirmModal).
* `BlogView.vue` (agente núcleo): botón "Publicar blog" (ícono PenLine) (→ `/blog/publicar`) y "Mis blogs" (→ `/blog/mios`) si hay sesión; en el modal de lectura, si `user.id === blog.idUsuario || isNoticias`, botones Editar (→ `/blog/:id/editar`) y Eliminar (ConfirmModal + DELETE, recarga lista).
* `src/views/editor/EditorBlogsView.vue` (agente cuentas): moderación en el panel con PanelList (miniatura, título, autor, fecha, acciones Ver/Editar/Eliminar).

### 4.3 Pendientes documentados (NO implementar ahora)
* PWA (manifest + service worker): dejar solo una nota en el README del front.
* App móvil en Flutter consumirá esta misma API más adelante.

### 4.4 Íconos
* PROHIBIDO usar emojis en todo el proyecto (UI, textos, datos, docs).
* Íconos: `lucide-vue-next` mediante `src/components/Icono.vue` (`<Icono nombre="hoja" :tamano="18" />`). En el panel: `PanelIcon` + `src/components/panel/icons.js`.

### 4.5 Encabezados de página
* Cada página/sección muestra SOLO el título, en negro (`#1d2b22`). Sin subtítulos ni frases explicativas debajo.
* Textos cortos en toda la UI; el verde (`#2b5e3f`) se reserva para la acción principal y estados activos.

---

## 5. Seguridad (Unidad II, Actividad 3) — tiene prioridad sobre lo anterior

### 5.1 Sesiones con refresh token
* `POST /auth/login` y `POST /auth/register` responden `{ token, refreshToken, expiresIn, user }`.
  - `token`: JWT de acceso, vida `Jwt:ExpiracionMinutos` (60 por defecto; configurable).
  - `refreshToken`: cadena aleatoria de 64 bytes (base64url), vida 7 días; en la BD se guarda SOLO su hash SHA-256.
  - `expiresIn`: segundos de vida del access token.
* `POST /auth/refresh` `{ refreshToken }` → 200 `{ token, refreshToken, expiresIn, user }` (ROTACIÓN: el refresh usado queda revocado). Si se reusa un refresh ya revocado → se revocan TODOS los refresh del usuario (detección de robo) y 401.
* `POST /auth/logout` `{ refreshToken }` (auth opcional) → 204; revoca ese refresh.
* `POST /auth/logout-todo` (auth) → 204; revoca todos los refresh del usuario.
* Cambiar contraseña / restablecerla / suspender o eliminar usuario → revoca todos sus refresh tokens.
* Tabla nueva `refresh_tokens (id bigserial, user_id bigint FK users ON DELETE CASCADE, token_hash char(64) unique, expira_en timestamptz, creado_en timestamptz default now(), revocado_en timestamptz null, reemplazado_por char(64) null, ip varchar(45), user_agent varchar(300))`.

### 5.2 Bitácora de auditoría
* Tabla `bitacora_auditoria (id bigserial, fecha timestamptz default now(), user_id bigint null FK users ON DELETE SET NULL, email varchar(255) null, accion varchar(60), detalle varchar(500) null, ip varchar(45) null, exito boolean default true)`.
* Acciones: `login_ok`, `login_fallido`, `login_bloqueado`, `logout`, `refresh_reuso`, `registro`, `password_cambiada`, `password_restablecida`, `usuario_creado`, `usuario_editado`, `usuario_eliminado`, `planta_*`, `noticia_*`, `blog_eliminado`.
* `GET /admin/bitacora?accion=&email=&desde=&hasta=&pagina=1&tamano=50` (admin) → `{ total, pagina, tamano, items: [{ id, fecha, userId, email, accion, detalle, ip, exito }] }`.

### 5.3 Transporte
* La API acepta HTTPS (`https://localhost:7080` en desarrollo, certificado de desarrollo de .NET) y mantiene HTTP 5080 solo para desarrollo/red local. En producción (Azure) HTTPS obligatorio + HSTS.

---

## 6. Racha diaria (solo app móvil: cada día que el usuario abre la app, crece una planta)

Requiere sesión (JWT). Las dos rutas son relativas a la base de la API (`VITE_API_URL`).

| Método | Ruta | Respuesta |
|---|---|---|
| POST | `/racha/registrar` | Registra la visita de hoy. Idempotente: si ya hay visita hoy, no cambia nada y devuelve el estado. |
| GET | `/racha` | Estado sin modificar. |

Respuesta (ambas):
```
{ rachaActual, rachaMaxima, totalDias, ultimoDia ("yyyy-MM-dd" | null), registradaHoy: bool,
  etapa (0..5), nombreEtapa, diasSiguienteEtapa (int | null) }
```

Etapas (días mínimos de racha):

| Etapa | Nombre | Días |
|---|---|---|
| 0 | Semilla | 0 |
| 1 | Brote | 1-2 |
| 2 | Plántula | 3-6 |
| 3 | Planta joven | 7-13 |
| 4 | Planta adulta | 14-29 |
| 5 | En flor | 30+ |

Solo la app móvil (Flutter) usa la racha, para motivar que se abra la app: registra el día al abrirse o al volver a primer plano. La web no la muestra ni la registra.

---

## 7. Insignias (web y app)

Logros que se ganan usando Plantamoss. Lenguaje simple y con temas de México. Sin emojis: cada insignia trae una clave `icono` y cada cliente la dibuja con su set (web: `Icono.vue`/lucide; app: Material Icons).

### Catálogo (fijo en la API, `Services/InsigniasService.cs`)

| codigo | titulo | descripcion | icono | categoria | meta | cómo se mide |
|---|---|---|---|---|---|---|
| primer_brote | Primer brote | Conoce tu primera planta del catálogo. | brote | Plantas | 1 | plantas distintas vistas |
| amigo_del_nopal | Amigo del nopal | Conoce 10 plantas mexicanas. | hoja | Plantas | 10 | plantas distintas vistas |
| coleccionista | Muy buen conocedor | Conoce 30 plantas mexicanas. | flor | Plantas | 30 | plantas distintas vistas |
| viajero | Viajero de la República | Explora 5 estados en el mapa. | mapa | Mapa | 5 | estados distintos vistos |
| de_norte_a_sur | De Baja California a Yucatán | Explora los 32 estados de México. | brujula | Mapa | 32 | estados distintos vistos |
| buen_lector | Buen lector | Lee 5 blogs de la comunidad. | libro | Blog | 5 | blogs distintos leídos |
| cronista_verde | Escritor verde | Publica tu primer blog. | escribir | Blog | 1 | blogs publicados por el usuario (tabla miniblogs) |
| pulgar_verde | Pulgar verde | Entra a la app 7 días seguidos. | gota | Racha | 7 | rachas.racha_maxima |
| corazon_de_agave | Corazón de agave | Entra a la app 30 días seguidos. | corazon | Racha | 30 | rachas.racha_maxima |
| flor_de_cempasuchil | Flor de cempasúchil | Entra a Plantamoss en Día de Muertos (1 o 2 de noviembre). | sol | Fechas | 1 | visita en esa fecha (hora de México) |
| nochebuena | Flor de Nochebuena | Entra a Plantamoss en Navidad (24 o 25 de diciembre). | nochebuena | Fechas | 1 | visita en esa fecha |
| jacaranda | Jacaranda de primavera | Entra a Plantamoss al iniciar la primavera (20 o 21 de marzo). | jacaranda | Fechas | 1 | visita en esa fecha |

### Tablas
* `eventos_usuario (id bigserial PK, user_id FK users ON DELETE CASCADE, evento varchar(30), referencia varchar(64), creado_en timestamptz default now(), UNIQUE(user_id, evento, referencia))`
* `insignias_usuario (user_id FK users ON DELETE CASCADE, codigo varchar(40), desbloqueada_en timestamptz default now(), PRIMARY KEY(user_id, codigo))`

### Endpoints (requieren sesión)

| Método | Ruta | Cuerpo | Respuesta |
|---|---|---|---|
| GET | `/insignias` | - | `{ insignias: InsigniaDto[], nuevas: InsigniaDto[] }` |
| POST | `/insignias/evento` | `{ evento, referencia }` | `{ nuevas: InsigniaDto[] }` |

* `evento` permitido: `VER_PLANTA` (referencia = id de la planta), `VER_ESTADO` (id del estado), `LEER_BLOG` (id del blog). Cualquier otro valor: 400. La API comprueba que la planta/estado/blog exista (si no, 400) para que no se puedan inflar los contadores. Repetir el mismo evento con la misma referencia no cuenta doble.
* Ambos endpoints revisan todas las insignias y desbloquean las que ya cumplen la meta; `nuevas` trae solo las desbloqueadas en esa llamada (para mostrar el aviso "Ganaste una insignia").
* Insignias de **Fechas**: se desbloquean cuando el usuario llama a `GET /insignias` (la web y la app lo hacen al abrir con sesión) en esa fecha, según el día local de México. Fuera de esa fecha su avance es 0 / 1.
* Después de publicar un blog (web) o de registrar la racha (app) el cliente llama a `GET /insignias` para revisar si ganó alguna.

`InsigniaDto`:
```
{ codigo, titulo, descripcion, icono, categoria, tono, meta: int, avance: int (tope = meta),
  progreso: int 0..100, desbloqueada: bool, desbloqueadaEn: ISO-8601 | null }
```

`tono`: color de la medalla. Igual a la categoría (`Plantas`, `Mapa`, `Blog`, `Racha`) salvo las de Fechas: `rojo` (cempasúchil), `navidad` (nochebuena, rojo con aro dorado), `morado` (jacaranda).

Paleta de la medalla (claro / base / oscuro / borde):

| tono | claro | base | oscuro | borde |
|---|---|---|---|---|
| Plantas | #A5E0A0 | #3F9B46 | #1D5E25 | #D9F2C9 |
| Mapa | #F3B98F | #B5603A | #6E3216 | #F7DCC4 |
| Blog | #9CC8FF | #2B7BD6 | #0F468C | #D3E6FF |
| Racha | #FFE07A | #F29A0E | #A65400 | #FFF1B8 |
| rojo | #FF9A8A | #D7261E | #7E0F0B | #FFD3CC |
| navidad | #FF7A85 | #B5121B | #5E050B | #FFE08A |
| morado | #D2B4FF | #8A4FD8 | #4A1F8C | #EADCFF |
| gris (bloqueada) | #EEF1EF | #BCC5BF | #8A958D | #F4F6F5 |

Color de la categoría Fechas (chips y barra): #B5121B. Iconos nuevos: `corazon` (web lucide Heart / app Icons.favorite_rounded), `nochebuena` (lucide Flower / Icons.filter_vintage_rounded), `jacaranda` (lucide TreeDeciduous / Icons.park_rounded).
