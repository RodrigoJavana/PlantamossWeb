// Utilidades compartidas para datos de plantas / estados.

export const CLIMAS = [
  { valor: 'tropical', etiqueta: 'Tropical', icono: 'tropical' },
  { valor: 'arido', etiqueta: 'Árido', icono: 'arido' },
  { valor: 'templado', etiqueta: 'Templado', icono: 'templado' },
  { valor: 'frio', etiqueta: 'Frío', icono: 'frio' }
]

export const LUCES = [
  { valor: 'sol_directo', etiqueta: 'Sol Directo', icono: 'sol' },
  { valor: 'sombra_parcial', etiqueta: 'Sombra Parcial', icono: 'sombraParcial' },
  { valor: 'sombra', etiqueta: 'Sombra', icono: 'sombra' }
]

export function etiquetaClima(v) {
  return CLIMAS.find((c) => c.valor === v) || null
}
export function etiquetaLuz(v) {
  return LUCES.find((l) => l.valor === v) || null
}

/** Minúsculas y sin acentos, para comparar nombres de estados. */
export function normalizar(texto) {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

/** Códigos de ícono de OpenWeather → nombre de <Icono> (lucide). */
export const ICONO_CLIMA = {
  '01d': 'sol', '01n': 'luna',
  '02d': 'sombraParcial', '02n': 'nubeLuna',
  '03d': 'nube', '03n': 'nube',
  '04d': 'nubes', '04n': 'nubes',
  '09d': 'llovizna', '09n': 'llovizna',
  '10d': 'lluvia', '10n': 'lluvia',
  '11d': 'tormenta', '11n': 'tormenta',
  '13d': 'nieve', '13n': 'nieve',
  '50d': 'niebla', '50n': 'niebla'
}
export function iconoClima(icono) {
  return ICONO_CLIMA[icono] || 'temperatura'
}

/** Solo permite URLs http(s) o rutas relativas al sitio (evita javascript: etc.). */
export function urlSegura(url) {
  if (!url || typeof url !== 'string') return ''
  const u = url.trim()
  if (u.startsWith('/') && !u.startsWith('//')) return u
  try {
    const p = new URL(u)
    return p.protocol === 'http:' || p.protocol === 'https:' ? p.href : ''
  } catch {
    return ''
  }
}

export function formatearFecha(iso, opciones = { year: 'numeric', month: 'long', day: 'numeric' }) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('es-MX', opciones)
}
