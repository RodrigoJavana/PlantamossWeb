<script setup>
import Icono from '@/components/Icono.vue'
import PlantaImagen from '@/components/PlantaImagen.vue'
import { ref, computed, watch, nextTick } from 'vue'
import { normalizar, iconoClima, etiquetaClima, etiquetaLuz } from '@/utils/plantas'

const props = defineProps({
  abierto: { type: Boolean, default: false },
  estado: { type: Object, default: null }, // { idEstado, nombreEstado, climaPredominante }
  plantas: { type: Array, default: () => [] },
  cargando: { type: Boolean, default: false },
  error: { type: String, default: '' },
  clima: { type: Object, default: null },
  climaCargando: { type: Boolean, default: false },
  capital: { type: String, default: '' },
  hayAnterior: { type: Boolean, default: false },
  haySiguiente: { type: Boolean, default: false },
  modoEscritorio: { type: Boolean, default: false }
})
const emit = defineEmits(['cerrar', 'anterior', 'siguiente', 'abrir-planta', 'reintentar'])

const panel = ref(null)
const botonCerrar = ref(null)
const busqueda = ref('')

const nombre = computed(() => props.estado?.nombreEstado || '')

const iconoPredominante = computed(() => {
  const t = normalizar(props.estado?.climaPredominante)
  if (!t) return 'tierra'
  if (/seco|arido/.test(t)) return 'arido'
  if (/frio/.test(t)) return 'frio'
  if (/calido|tropical/.test(t)) return 'tropical'
  if (/templado/.test(t)) return 'templado'
  return 'tierra'
})

const plantasFiltradas = computed(() => {
  const q = normalizar(busqueda.value)
  if (!q) return props.plantas
  return props.plantas.filter((p) => normalizar(`${p.nombrePlanta} ${p.nombreCientifico || ''}`).includes(q))
})

watch(() => props.estado?.idEstado, () => { busqueda.value = '' })

watch(() => props.abierto, async (v) => {
  if (v) {
    await nextTick()
    botonCerrar.value?.focus()
  }
})

function atraparFoco(e) {
  if (e.key !== 'Tab' || !panel.value) return
  const nodos = [...panel.value.querySelectorAll('button:not([disabled]), a[href], input, [tabindex]:not([tabindex="-1"])')]
    .filter((n) => n.offsetParent !== null)
  if (!nodos.length) return
  const primero = nodos[0]
  const ultimo = nodos[nodos.length - 1]
  if (e.shiftKey && document.activeElement === primero) {
    e.preventDefault()
    ultimo.focus()
  } else if (!e.shiftKey && document.activeElement === ultimo) {
    e.preventDefault()
    primero.focus()
  }
}

function metaPlanta(p) {
  return [etiquetaClima(p.tipoClima), etiquetaLuz(p.luzSol)].filter(Boolean)
}
</script>

<template>
  <Teleport to="body">
    <Transition name="drawer-fondo">
      <div
        v-if="abierto"
        class="drawer-fondo"
        :class="{ transparente: modoEscritorio }"
        aria-hidden="true"
        @click="emit('cerrar')"
      ></div>
    </Transition>

    <Transition name="drawer">
      <aside
        v-if="abierto"
        ref="panel"
        class="estado-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-estado-titulo"
        @keydown="atraparFoco"
      >
        <header class="drawer-cabecera">
          <div class="drawer-cabecera-texto">
            <span class="drawer-etiqueta">Estado</span>
            <h2 id="drawer-estado-titulo" class="drawer-titulo">{{ nombre || '—' }}</h2>
            <p class="drawer-clima-pred">
              <Icono :nombre="iconoPredominante" :tamano="15" />
              {{ estado?.climaPredominante || 'Clima no registrado' }}
            </p>
          </div>
          <div class="drawer-acciones">
            <button type="button" class="boton-circulo" aria-label="Estado anterior" :disabled="!hayAnterior" @click="emit('anterior')">
              <Icono nombre="chevronIzquierda" :tamano="18" />
            </button>
            <button type="button" class="boton-circulo" aria-label="Estado siguiente" :disabled="!haySiguiente" @click="emit('siguiente')">
              <Icono nombre="chevronDerecha" :tamano="18" />
            </button>
            <button ref="botonCerrar" type="button" class="boton-circulo" aria-label="Cerrar" @click="emit('cerrar')">
              <Icono nombre="cerrar" :tamano="18" />
            </button>
          </div>
        </header>

        <div class="drawer-cuerpo" aria-live="polite">
          <!-- Clima en tiempo real -->
          <section class="clima-tarjeta" :class="{ vacio: !climaCargando && !clima }" aria-label="Clima actual">
            <template v-if="climaCargando">
              <div class="skeleton clima-sk-icono"></div>
              <div class="clima-sk-lineas">
                <div class="skeleton sk-linea" style="width: 40%; height: 22px"></div>
                <div class="skeleton sk-linea" style="width: 70%"></div>
              </div>
            </template>
            <template v-else-if="clima">
              <div class="clima-principal">
                <span class="clima-icono"><Icono :nombre="iconoClima(clima.icono)" :tamano="44" :grosor="1.6" /></span>
                <div class="clima-texto">
                  <div class="clima-temp">{{ Math.round(clima.temp) }}°C</div>
                  <div class="clima-desc">{{ clima.descripcion }}</div>
                  <div v-if="capital" class="clima-capital">Capital: {{ capital }}</div>
                </div>
              </div>
              <div class="clima-metricas">
                <div class="metrica">
                  <Icono nombre="humedad" :tamano="16" />
                  <span class="metrica-valor">{{ clima.humedad }}%</span>
                  <span class="metrica-nombre">Humedad</span>
                </div>
                <div class="metrica">
                  <Icono nombre="viento" :tamano="16" />
                  <span class="metrica-valor">{{ Math.round(clima.viento) }} m/s</span>
                  <span class="metrica-nombre">Viento</span>
                </div>
                <div class="metrica">
                  <Icono nombre="temperatura" :tamano="16" />
                  <span class="metrica-valor">{{ Math.round(clima.sensacion) }}°C</span>
                  <span class="metrica-nombre">Sensación</span>
                </div>
              </div>
            </template>
            <p v-else class="clima-no-disp">
              <Icono nombre="nube" :tamano="16" /> Clima no disponible
            </p>
          </section>

          <!-- Plantas -->
          <section class="plantas-seccion" aria-labelledby="drawer-plantas-titulo">
            <div v-if="cargando" class="plantas-skeleton">
              <div class="skeleton sk-linea" style="width: 35%; height: 16px; margin-bottom: 14px"></div>
              <div v-for="n in 4" :key="n" class="sk-fila">
                <div class="skeleton sk-mini"></div>
                <div class="sk-fila-texto">
                  <div class="skeleton sk-linea" style="width: 60%"></div>
                  <div class="skeleton sk-linea" style="width: 40%"></div>
                </div>
              </div>
            </div>

            <div v-else-if="error" class="drawer-vacio">
              <Icono nombre="advertencia" :tamano="28" />
              <p>{{ error }}</p>
              <button type="button" class="boton-texto" @click="emit('reintentar')">Reintentar</button>
            </div>

            <template v-else>
              <h3 id="drawer-plantas-titulo" class="plantas-titulo">
                Plantas <span class="plantas-cuenta">({{ plantas.length }})</span>
              </h3>

              <label v-if="plantas.length > 4" class="drawer-buscador">
                <Icono nombre="buscar" :tamano="16" />
                <input v-model="busqueda" type="search" placeholder="Buscar planta" aria-label="Buscar planta" />
              </label>

              <ul v-if="plantasFiltradas.length" class="plantas-lista">
                <li v-for="pl in plantasFiltradas" :key="pl.idPlanta">
                  <button type="button" class="planta-fila" @click="emit('abrir-planta', pl)">
                    <PlantaImagen class="planta-fila-img" :src="pl.urlImagen" :alt="pl.nombrePlanta" />
                    <span class="planta-fila-info">
                      <span class="planta-fila-nombre">{{ pl.nombrePlanta }}</span>
                      <em v-if="pl.nombreCientifico" class="planta-fila-cientifico">{{ pl.nombreCientifico }}</em>
                      <span v-if="metaPlanta(pl).length" class="planta-fila-meta">
                        <span v-for="m in metaPlanta(pl)" :key="m.valor"><Icono :nombre="m.icono" :tamano="13" /> {{ m.etiqueta }}</span>
                      </span>
                    </span>
                    <Icono class="planta-fila-chevron" nombre="chevronDerecha" :tamano="18" />
                  </button>
                </li>
              </ul>

              <div v-else-if="plantas.length" class="drawer-vacio">
                <Icono nombre="sinResultados" :tamano="28" />
                <p>Sin resultados.</p>
              </div>
              <div v-else class="drawer-vacio">
                <Icono nombre="brote" :tamano="28" />
                <p>Sin plantas registradas.</p>
              </div>
            </template>
          </section>
        </div>

        <footer v-if="estado?.idEstado" class="drawer-pie">
          <RouterLink class="boton-catalogo" :to="{ path: '/catalogo', query: { estado: String(estado.idEstado) } }">
            Ver en catálogo <Icono nombre="chevronDerecha" :tamano="16" />
          </RouterLink>
        </footer>
      </aside>
    </Transition>
  </Teleport>
</template>

<style scoped>
.drawer-fondo {
  position: fixed;
  inset: 0;
  background: rgba(17, 24, 20, 0.28);
  z-index: 1500;
}
.drawer-fondo.transparente { background: transparent; pointer-events: none; }

.estado-drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 420px;
  max-width: 100%;
  background: #ffffff;
  z-index: 1501;
  display: flex;
  flex-direction: column;
  box-shadow: -12px 0 32px rgba(0, 0, 0, 0.12);
  border-left: 1px solid #e5e7eb;
  color: #1d2b22;
}

/* Cabecera */
.drawer-cabecera {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 20px 20px 16px;
  border-bottom: 1px solid #e5e7eb;
  background: #fff;
}
.drawer-cabecera-texto { min-width: 0; }
.drawer-etiqueta {
  display: block;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #8a948e;
  margin-bottom: 4px;
}
.drawer-titulo {
  margin: 0 0 6px;
  font-size: 1.5rem;
  line-height: 1.2;
  font-weight: 700;
  color: #1d2b22;
  overflow-wrap: anywhere;
}
.drawer-clima-pred {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.86rem;
  color: #6b7570;
}
.drawer-acciones { display: flex; gap: 6px; flex-shrink: 0; }
.boton-circulo {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: none;
  background: #f1f3f2;
  color: #4b5550;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.boton-circulo:hover:not(:disabled) { background: #e3e7e5; color: #1d2b22; }
.boton-circulo:disabled { opacity: 0.4; cursor: default; }
.boton-circulo:focus-visible,
.planta-fila:focus-visible,
.boton-catalogo:focus-visible { outline: 2px solid #2e7d32; outline-offset: 2px; }

/* Cuerpo */
.drawer-cuerpo { flex: 1; overflow-y: auto; padding: 18px 20px 20px; overscroll-behavior: contain; }

/* Clima */
.clima-tarjeta {
  background: #f8faf9;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 22px;
  min-height: 72px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.clima-tarjeta:has(.clima-sk-icono) { flex-direction: row; align-items: center; }
.clima-tarjeta.vacio { min-height: 0; padding: 12px 16px; }
.clima-principal { display: flex; align-items: center; gap: 14px; }
.clima-icono { color: #4b5550; display: inline-flex; }
.clima-texto { min-width: 0; }
.clima-temp { font-size: 2rem; font-weight: 700; line-height: 1; color: #1d2b22; }
.clima-desc { font-size: 0.88rem; color: #4b5550; margin-top: 4px; }
.clima-desc::first-letter { text-transform: uppercase; }
.clima-capital { font-size: 0.78rem; color: #8a948e; margin-top: 2px; }
.clima-metricas {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  border-top: 1px solid #e5e7eb;
  padding-top: 12px;
}
.metrica {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  color: #6b7570;
  text-align: center;
}
.metrica + .metrica { border-left: 1px solid #e5e7eb; }
.metrica-valor { font-size: 0.95rem; font-weight: 600; color: #1d2b22; }
.metrica-nombre { font-size: 0.72rem; color: #8a948e; }
.clima-no-disp { margin: 0; display: flex; align-items: center; gap: 8px; font-size: 0.86rem; color: #8a948e; }
.clima-sk-icono { width: 44px; height: 44px; border-radius: 50%; flex-shrink: 0; }
.clima-sk-lineas { flex: 1; }

/* Plantas */
.plantas-titulo { margin: 0 0 12px; font-size: 1rem; font-weight: 700; color: #1d2b22; }
.plantas-cuenta { color: #8a948e; font-weight: 500; }
.drawer-buscador {
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid #dfe3e1;
  border-radius: 10px;
  padding: 0 12px;
  margin-bottom: 10px;
  color: #8a948e;
  background: #fff;
}
.drawer-buscador:focus-within { border-color: #2e7d32; box-shadow: 0 0 0 3px rgba(46, 125, 50, 0.12); }
.drawer-buscador input {
  flex: 1;
  border: none;
  outline: none;
  padding: 10px 0;
  font: inherit;
  font-size: 0.9rem;
  color: #1d2b22;
  background: transparent;
  min-width: 0;
}
.plantas-lista { list-style: none; margin: 0; padding: 0; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
.plantas-lista li + li { border-top: 1px solid #eef0ef; }
.planta-fila {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 12px;
  background: #fff;
  border: none;
  text-align: left;
  font: inherit;
  color: inherit;
  cursor: pointer;
  transition: background 0.15s;
}
.planta-fila:hover { background: #f6f8f7; }
.planta-fila:hover .planta-fila-chevron { color: #4b5550; transform: translateX(2px); }
.planta-fila-img { width: 48px; height: 48px; border-radius: 10px; flex-shrink: 0; overflow: hidden; }
.planta-fila-img :deep(.planta-imagen-icono) { font-size: 1.2rem; }
.planta-fila-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
.planta-fila-nombre { font-weight: 600; font-size: 0.93rem; color: #1d2b22; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.planta-fila-cientifico { font-size: 0.8rem; color: #8a948e; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.planta-fila-meta { display: flex; flex-wrap: wrap; gap: 2px 10px; font-size: 0.74rem; color: #8a948e; margin-top: 2px; }
.planta-fila-meta span { display: inline-flex; align-items: center; gap: 4px; }
.planta-fila-chevron { color: #b5bcb8; transition: transform 0.15s, color 0.15s; }

.drawer-vacio { text-align: center; padding: 28px 10px; color: #8a948e; display: flex; flex-direction: column; align-items: center; gap: 8px; }
.drawer-vacio p { margin: 0; font-size: 0.9rem; }
.boton-texto { background: none; border: none; color: #2e7d32; font-weight: 600; cursor: pointer; font: inherit; }

/* Skeleton */
.sk-linea { height: 11px; border-radius: 6px; margin-bottom: 8px; }
.sk-fila { display: flex; align-items: center; gap: 12px; padding: 8px 0; }
.sk-mini { width: 48px; height: 48px; border-radius: 10px; flex-shrink: 0; }
.sk-fila-texto { flex: 1; }

/* Pie */
.drawer-pie { padding: 14px 20px; border-top: 1px solid #e5e7eb; background: #fff; }
.boton-catalogo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 11px 16px;
  border-radius: 10px;
  background: #2e7d32;
  color: #fff;
  font-weight: 600;
  font-size: 0.92rem;
  text-decoration: none;
  transition: background 0.15s;
}
.boton-catalogo:hover { background: #256a29; color: #fff; }

/* Transiciones */
.drawer-enter-active, .drawer-leave-active { transition: transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1); }
.drawer-enter-from, .drawer-leave-to { transform: translateX(100%); }
.drawer-fondo-enter-active, .drawer-fondo-leave-active { transition: opacity 0.25s; }
.drawer-fondo-enter-from, .drawer-fondo-leave-to { opacity: 0; }
@media (prefers-reduced-motion: reduce) {
  .drawer-enter-active, .drawer-leave-active, .drawer-fondo-enter-active, .drawer-fondo-leave-active { transition: none; }
}

@media (max-width: 640px) {
  .estado-drawer { width: 100%; border-left: none; }
  .drawer-cabecera { padding: 16px 16px 14px; }
  .drawer-titulo { font-size: 1.3rem; }
  .drawer-cuerpo { padding: 16px; }
  .drawer-pie { padding: 12px 16px calc(12px + env(safe-area-inset-bottom)); }
  .boton-circulo { width: 36px; height: 36px; }
}
</style>
