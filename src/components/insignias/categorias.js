// Categorías de insignias: nombre (como lo manda la API), color sólido y fondo suave.
export const CATEGORIAS = [
  { valor: 'Todas', color: '#2b5e3f', fondo: '#e8f5e9' },
  { valor: 'Plantas', color: '#2e7d32', fondo: '#e8f5e9' },
  { valor: 'Mapa', color: '#9a4f2c', fondo: '#f6e9e1' },
  { valor: 'Blog', color: '#1565c0', fondo: '#e3eefb' },
  { valor: 'Racha', color: '#c76d00', fondo: '#fff3d6' },
  { valor: 'Fechas', color: '#b5121b', fondo: '#fde7e8' }
]

// Tonos propios de las insignias de Fechas (color de barra y textos)
const TONOS_TEXTO = {
  rojo: { color: '#d7261e', fondo: '#fde8e6' },
  navidad: { color: '#b5121b', fondo: '#fde7e8' },
  morado: { color: '#7a3fc8', fondo: '#f1e9fc' }
}

const GRIS = { color: '#7a867e', fondo: '#eef1ef' }

// Acepta un tono (rojo, navidad, morado) o una categoría.
export function colorCategoria(valor) {
  return TONOS_TEXTO[valor] || CATEGORIAS.find((c) => c.valor === valor) || GRIS
}

// Tonos de la medalla 3D por categoría: claro (brillo), base, oscuro (sombra) y borde metálico.
const TONOS = {
  Plantas: { claro: '#a5e0a0', base: '#3f9b46', oscuro: '#1d5e25', borde: '#d9f2c9' },
  Mapa: { claro: '#f3b98f', base: '#b5603a', oscuro: '#6e3216', borde: '#f7dcc4' },
  Blog: { claro: '#9cc8ff', base: '#2b7bd6', oscuro: '#0f468c', borde: '#d3e6ff' },
  Racha: { claro: '#ffe07a', base: '#f29a0e', oscuro: '#a65400', borde: '#fff1b8' },
  rojo: { claro: '#ff9a8a', base: '#d7261e', oscuro: '#7e0f0b', borde: '#ffd3cc' },
  navidad: { claro: '#ff7a85', base: '#b5121b', oscuro: '#5e050b', borde: '#ffe08a' },
  morado: { claro: '#d2b4ff', base: '#8a4fd8', oscuro: '#4a1f8c', borde: '#eadcff' }
}
const TONOS_GRIS = { claro: '#eef1ef', base: '#bcc5bf', oscuro: '#8a958d', borde: '#f4f6f5' }

export function tonosMedalla(valor, ganada = true) {
  return ganada ? TONOS[valor] || TONOS.Plantas : TONOS_GRIS
}

// "21 oct 2026" (es-MX). Cadena vacía si no hay fecha válida.
export function fechaGanada(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
}
