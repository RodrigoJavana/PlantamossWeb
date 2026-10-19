<script setup>
/**
 * Lista tipo "filas" del panel (NO tabla clásica), con skeleton, vacío y paginador.
 *
 * Props:
 *  - items (Array): registros a mostrar.
 *  - loading (Boolean): muestra el skeleton.
 *  - total (Number, opcional): total de registros.
 *  - page (Number, default 1): página actual (1-based). Úsalo con v-model:page o @update:page.
 *  - pageSize (Number, default 20): registros por página.
 *  - emptyText (String): mensaje cuando no hay registros.
 *  - itemLabel (String, default 'registros'): sustantivo del pie ("Mostrando 1 a 20 de 83 registros").
 *  - itemKey (String|Function, opcional): campo o función (item, index) => clave. Por defecto usa
 *    id / idPlanta / idNoticia / idBlog / idEstado y, si no hay, el índice.
 *
 * Paginación — dos modos:
 *  1) PAGINACIÓN INTERNA (recomendada): el padre pasa TODOS los items y NO pasa `total`.
 *     La lista corta la página actual (`page`, `pageSize`) y calcula el rango con items.length.
 *  2) PAGINACIÓN EXTERNA: el padre pasa SOLO los items de la página actual + `total`.
 *     La lista los muestra tal cual y usa `total` para el rango y el número de páginas.
 *  Por seguridad, si se pasa `total` pero llegan más items que `pageSize`, se asume modo 1 y se corta igual.
 *
 * Emite:
 *  - update:page(n): al usar el paginador (y si la página quedó fuera de rango tras filtrar/eliminar).
 *
 * Slots:
 *  - row { item, index }: contenido de cada fila (la fila ya trae hover, separador y padding).
 *  - empty: reemplaza el estado vacío por defecto.
 */
import { computed, ref, watch } from 'vue'
import PanelIcon from './PanelIcon.vue'

const props = defineProps({
  items: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  total: { type: Number, default: null },
  page: { type: Number, default: 1 },
  pageSize: { type: Number, default: 20 },
  emptyText: { type: String, default: 'No hay registros para mostrar.' },
  itemLabel: { type: String, default: 'registros' },
  itemKey: { type: [String, Function], default: null }
})
const emit = defineEmits(['update:page'])

const raiz = ref(null)

const tamPagina = computed(() => Math.max(1, Math.floor(props.pageSize) || 20))
const lista = computed(() => (Array.isArray(props.items) ? props.items : []))

/** true → la lista corta los items (modo interno). */
const cortaInterno = computed(
  () => props.total === null || props.total === undefined || lista.value.length > tamPagina.value
)
const totalReal = computed(() => (cortaInterno.value ? lista.value.length : Math.max(0, props.total)))
const totalPaginas = computed(() => Math.max(1, Math.ceil(totalReal.value / tamPagina.value)))
const paginaActual = computed(() => Math.min(Math.max(1, Math.floor(props.page) || 1), totalPaginas.value))

const visibles = computed(() => {
  if (!cortaInterno.value) return lista.value
  const ini = (paginaActual.value - 1) * tamPagina.value
  return lista.value.slice(ini, ini + tamPagina.value)
})
const desde = computed(() => (totalReal.value ? (paginaActual.value - 1) * tamPagina.value + 1 : 0))
const hasta = computed(() =>
  cortaInterno.value
    ? Math.min(paginaActual.value * tamPagina.value, totalReal.value)
    : Math.min(desde.value - 1 + visibles.value.length, totalReal.value)
)

// Si la página quedó fuera de rango (filtros, eliminaciones), avisa al padre.
watch(
  [() => props.page, totalPaginas, () => props.loading],
  () => {
    if (!props.loading && props.page !== paginaActual.value) emit('update:page', paginaActual.value)
  },
  { immediate: true }
)

function irA(n) {
  const destino = Math.min(Math.max(1, n), totalPaginas.value)
  if (destino === paginaActual.value) return
  emit('update:page', destino)
  // Lleva el inicio de la lista a la vista si quedó arriba de la pantalla.
  const el = raiz.value
  if (el && el.getBoundingClientRect().top < 70) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

function clave(item, i) {
  if (typeof props.itemKey === 'function') return props.itemKey(item, i)
  if (typeof props.itemKey === 'string' && item && item[props.itemKey] != null) return item[props.itemKey]
  if (item && typeof item === 'object') {
    for (const k of ['id', 'idPlanta', 'idNoticia', 'idBlog', 'idEstado']) {
      if (item[k] != null) return `${k}-${item[k]}`
    }
  }
  return `i-${(paginaActual.value - 1) * tamPagina.value + i}`
}

const filasSkeleton = computed(() => Math.min(tamPagina.value, 6))
</script>

<template>
  <div ref="raiz" class="pm-list" :aria-busy="loading ? 'true' : 'false'">
    <!-- Skeleton -->
    <ul v-if="loading" class="pm-list-filas" role="list" aria-label="Cargando registros">
      <li v-for="n in filasSkeleton" :key="`sk-${n}`" class="pm-list-fila pm-list-fila--skeleton" aria-hidden="true">
        <span class="pm-sk pm-sk-circulo"></span>
        <span class="pm-sk-textos">
          <span class="pm-sk pm-sk-linea" :style="{ width: `${42 + ((n * 17) % 30)}%` }"></span>
          <span class="pm-sk pm-sk-linea pm-sk-linea--corta" :style="{ width: `${24 + ((n * 11) % 20)}%` }"></span>
        </span>
        <span class="pm-sk pm-sk-fecha"></span>
        <span class="pm-sk pm-sk-badge"></span>
      </li>
      <li class="pm-sr" role="status">Cargando…</li>
    </ul>

    <!-- Vacío -->
    <div v-else-if="!visibles.length" class="pm-list-vacio">
      <slot name="empty">
        <span class="pm-list-vacio-icono" aria-hidden="true"><PanelIcon name="inbox" :size="30" /></span>
        <p>{{ emptyText }}</p>
      </slot>
    </div>

    <!-- Filas -->
    <template v-else>
      <ul class="pm-list-filas" role="list">
        <li v-for="(item, i) in visibles" :key="clave(item, i)" class="pm-list-fila">
          <slot name="row" :item="item" :index="(paginaActual - 1) * tamPagina + i" />
        </li>
      </ul>

      <div class="pm-list-pie">
        <p class="pm-list-rango" aria-live="polite">
          Mostrando <b>{{ desde }}</b> a <b>{{ hasta }}</b> de <b>{{ totalReal }}</b> {{ itemLabel }}
        </p>
        <nav v-if="totalPaginas > 1" class="pm-list-paginador" aria-label="Paginación">
          <button
            type="button"
            class="pm-list-pag-btn"
            :disabled="paginaActual <= 1"
            aria-label="Página anterior"
            @click="irA(paginaActual - 1)"
          >
            <PanelIcon name="chevronLeft" :size="16" />
          </button>
          <span class="pm-list-pag-num" aria-current="page">{{ paginaActual }} / {{ totalPaginas }}</span>
          <button
            type="button"
            class="pm-list-pag-btn"
            :disabled="paginaActual >= totalPaginas"
            aria-label="Página siguiente"
            @click="irA(paginaActual + 1)"
          >
            <PanelIcon name="chevronRight" :size="16" />
          </button>
        </nav>
      </div>
    </template>
  </div>
</template>

<style scoped>
.pm-list {
  background: #fff;
  border: 1px solid #e6ebe8;
  border-radius: 14px;
  box-shadow: 0 1px 2px rgba(16, 40, 26, 0.04), 0 4px 14px rgba(16, 40, 26, 0.04);
  overflow: hidden;
  scroll-margin-top: 80px;
}
.pm-sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
.pm-list-filas {
  list-style: none;
  margin: 0;
  padding: 0;
}
.pm-list-fila {
  position: relative;
  display: flex;
  align-items: center;
  min-width: 0;
  padding: 14px 20px;
  border-top: 1px solid #eef1ef;
  border-left: 3px solid transparent;
  transition: background 0.15s ease, border-color 0.15s ease;
}
.pm-list-fila:first-child { border-top: none; }
.pm-list-fila:not(.pm-list-fila--skeleton):hover,
.pm-list-fila:not(.pm-list-fila--skeleton):focus-within {
  background: #f7faf8;
  border-left-color: #3a7a4f;
}

/* Skeleton */
.pm-list-fila--skeleton { gap: 16px; }
.pm-sk {
  display: block;
  border-radius: 6px;
  background: linear-gradient(90deg, #eef2ef 0%, #f7f9f8 40%, #eef2ef 80%);
  background-size: 300% 100%;
  animation: pm-shimmer 1.3s ease-in-out infinite;
}
.pm-sk-circulo { width: 42px; height: 42px; border-radius: 50%; flex-shrink: 0; }
.pm-sk-textos { flex: 1 1 auto; display: flex; flex-direction: column; gap: 8px; min-width: 0; }
.pm-sk-linea { height: 12px; }
.pm-sk-linea--corta { height: 10px; }
.pm-sk-fecha { width: 84px; height: 12px; flex-shrink: 0; }
.pm-sk-badge { width: 76px; height: 22px; flex-shrink: 0; }
@keyframes pm-shimmer {
  0% { background-position: 100% 0; }
  100% { background-position: 0 0; }
}

/* Vacío */
.pm-list-vacio {
  padding: 52px 20px;
  text-align: center;
  color: #6b7a72;
}
.pm-list-vacio-icono {
  width: 60px;
  height: 60px;
  margin: 0 auto 12px;
  border-radius: 50%;
  background: #e8f5e9;
  color: #3a7a4f;
  display: flex;
  align-items: center;
  justify-content: center;
}
.pm-list-vacio p { margin: 0; font-size: 0.92rem; }

/* Pie: rango + paginador */
.pm-list-pie {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px 16px;
  padding: 12px 20px;
  border-top: 1px solid #eef1ef;
  background: #fbfcfb;
}
.pm-list-rango {
  margin: 0;
  font-size: 0.8rem;
  color: #6b7a72;
}
.pm-list-rango b { color: #1f2d26; font-weight: 700; }
.pm-list-paginador {
  display: flex;
  align-items: center;
  gap: 4px;
}
.pm-list-pag-btn {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e3e9e5;
  border-radius: 9px;
  background: #fff;
  color: #4b5a52;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}
.pm-list-pag-btn:hover:not(:disabled) { background: #e8f5e9; border-color: #a5d6a7; color: #2b5e3f; }
.pm-list-pag-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.pm-list-pag-btn:focus-visible { outline: 3px solid #a5d6a7; outline-offset: 1px; }
.pm-list-pag-num {
  min-width: 56px;
  padding: 0 6px;
  text-align: center;
  font-size: 0.82rem;
  font-weight: 700;
  color: #33413a;
  font-variant-numeric: tabular-nums;
}

@media (max-width: 599.98px) {
  .pm-list-fila { padding: 12px 14px; }
  .pm-list-pie { padding: 12px 14px; justify-content: center; }
  .pm-list-rango { width: 100%; text-align: center; }
  .pm-sk-fecha { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  .pm-sk { animation: none; }
}
</style>
