// Extrae los 32 <path class="estado-path" data-nombre="..." d="..."> del blade original
// y genera src/assets/data/mexico-estados.json ([{ nombre, d }]).
//
// Uso: node scripts/extraer-mapa.mjs [ruta/al/mapa_interactivo.blade.php]
//
// Corrige además dos nombres que en el original nunca coincidían con la BD:
//   "México"           → "Estado de México"
//   "Distrito Federal" → "Ciudad de México"
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const origen =
  process.argv[2] ||
  'C:/Users/Rodrigo Javana/Desktop/Archivos/Planta-Moss-Proyecto/resources/views/mapa_interactivo.blade.php'
const destino = resolve(raiz, 'src/assets/data/mexico-estados.json')

const RENOMBRAR = {
  'México': 'Estado de México',
  'Distrito Federal': 'Ciudad de México'
}

const html = readFileSync(origen, 'utf8')
const etiquetas = html.match(/<path\b[^>]*class="[^"]*estado-path[^"]*"[^>]*>/g) || []

const estados = etiquetas.map((tag) => {
  const nombre = (tag.match(/data-nombre="([^"]*)"/) || [])[1]
  const d = (tag.match(/\sd="([^"]*)"/) || [])[1]
  if (!nombre || !d) throw new Error('Path sin nombre o sin d: ' + tag.slice(0, 120))
  return { nombre: RENOMBRAR[nombre] || nombre, d: d.replace(/\s+/g, ' ').trim() }
})

if (estados.length !== 32) {
  console.warn(`Advertencia: se esperaban 32 estados y se encontraron ${estados.length}`)
}

mkdirSync(dirname(destino), { recursive: true })
writeFileSync(destino, JSON.stringify(estados, null, 0) + '\n', 'utf8')
console.log(`OK: ${estados.length} estados → ${destino}`)
