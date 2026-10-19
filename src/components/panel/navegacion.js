/**
 * Menú lateral del panel (CONTRATO §4.1).
 *
 * Sección: { id, titulo, permiso?, items: [Item] }
 * Item enlace: { id, label, to, icon, permiso?, exacto?, match?(path) }
 * Item grupo:  { id, label, icon, grupo: true, permiso?, children: [Item enlace] }
 *
 * `permiso` es una función (auth) => boolean evaluada con el store de Pinia (getters isAdmin/isEditor/isNoticias).
 * `match(path)` (opcional) decide si el enlace está activo; si no existe se usa `exacto` o el prefijo de `to`.
 */
export const NAVEGACION = [
  {
    id: 'principal',
    titulo: 'Principal',
    items: [{ id: 'dashboard', label: 'Dashboard', to: '/panel', icon: 'dashboard', exacto: true }]
  },
  {
    id: 'contenido',
    titulo: 'Contenido',
    items: [
      { id: 'plantas', label: 'Plantas', to: '/panel/plantas', icon: 'leaf', permiso: (a) => a.isEditor },
      { id: 'noticias', label: 'Noticias', to: '/panel/noticias', icon: 'news', permiso: (a) => a.isNoticias },
      { id: 'blogs', label: 'Blogs', to: '/panel/blogs', icon: 'blog', permiso: (a) => a.isNoticias }
    ]
  },
  {
    id: 'organizacion',
    titulo: 'Organización',
    permiso: (a) => a.isAdmin,
    items: [
      {
        id: 'usuarios',
        label: 'Usuarios',
        icon: 'users',
        grupo: true,
        children: [
          {
            id: 'usuarios-lista',
            label: 'Lista de usuarios',
            to: '/panel/usuarios',
            icon: 'list',
            // También activo al editar un usuario desde la lista.
            match: (p) => p === '/panel/usuarios' || /^\/panel\/usuarios\/[^/]+\/editar\/?$/.test(p)
          },
          { id: 'usuarios-crear', label: 'Registrar usuario', to: '/panel/usuarios/crear', icon: 'userPlus', exacto: true }
        ]
      }
    ]
  },
  {
    id: 'sitio',
    titulo: 'Sitio público',
    items: [
      {
        id: 'ver-sitio',
        label: 'Ver sitio',
        icon: 'globe',
        grupo: true,
        children: [
          { id: 'sitio-inicio', label: 'Inicio', to: '/', icon: 'home', exacto: true },
          { id: 'sitio-catalogo', label: 'Catálogo', to: '/catalogo', icon: 'book' },
          { id: 'sitio-mapa', label: 'Mapa interactivo', to: '/mapa', icon: 'map' },
          { id: 'sitio-blog', label: 'Blog', to: '/blog', icon: 'blog' }
        ]
      }
    ]
  }
]

/** ¿El enlace `item` corresponde a la ruta `path`? */
export function enlaceActivo(item, path) {
  if (!item?.to) return false
  const p = path.length > 1 ? path.replace(/\/+$/, '') : path
  if (typeof item.match === 'function') return item.match(p)
  if (item.exacto) return p === item.to
  return p === item.to || p.startsWith(`${item.to}/`)
}

/** Normaliza texto para buscar sin mayúsculas ni acentos. */
export function normalizar(texto) {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}
