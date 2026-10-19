<script setup>
/**
 * Dashboard del panel (/panel).
 * - Saludo según la hora y el rol.
 * - StatCards desde GET /admin/estadisticas, solo lo relevante por rol:
 *     admin → todo · editor → plantas · noticias → noticias + blogs.
 * - Distribución de usuarios por rol (solo admin), en CSS puro.
 * - Accesos rápidos a las secciones permitidas.
 */
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import api, { mensajeError } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import PanelPageHeader from '@/components/panel/PanelPageHeader.vue'
import StatCard from '@/components/panel/StatCard.vue'
import PanelIcon from '@/components/panel/PanelIcon.vue'

const auth = useAuthStore()

const stats = ref(null)
const cargando = ref(true)
const error = ref('')

async function cargar() {
  cargando.value = true
  error.value = ''
  try {
    const { data } = await api.get('/admin/estadisticas')
    stats.value = data || {}
  } catch (err) {
    error.value = mensajeError(err, 'No pudimos cargar las estadísticas del panel.')
  } finally {
    cargando.value = false
  }
}
onMounted(cargar)

/* ---------- Saludo ---------- */
const primerNombre = computed(() => (auth.user?.name || '').trim().split(/\s+/)[0] || '')
const saludo = computed(() => {
  const h = new Date().getHours()
  const base = h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'
  return primerNombre.value ? `${base}, ${primerNombre.value}` : base
})

/* ---------- Tarjetas por rol ---------- */
const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : Number(v) || 0)

const tarjetas = computed(() => {
  const s = stats.value || {}
  const lista = []
  if (auth.isAdmin) {
    lista.push(
      { id: 'usuarios', label: 'Usuarios', value: num(s.totalUsuarios), icon: 'users', tone: 'blue', to: '/panel/usuarios' },
      { id: 'activos', label: 'Activos', value: num(s.usuariosActivos), icon: 'userCheck', tone: 'green', to: '/panel/usuarios' },
      { id: 'suspendidos', label: 'Suspendidos', value: num(s.usuariosSuspendidos), icon: 'userX', tone: 'red', to: '/panel/usuarios' }
    )
  }
  if (auth.isEditor) {
    lista.push({ id: 'plantas', label: 'Plantas', value: num(s.totalPlantas), icon: 'leaf', tone: 'green', to: '/panel/plantas' })
  }
  if (auth.isNoticias) {
    lista.push(
      { id: 'noticias', label: 'Noticias', value: num(s.totalNoticias), icon: 'news', tone: 'yellow', to: '/panel/noticias' },
      { id: 'blogs', label: 'Blogs', value: num(s.totalBlogs), icon: 'blog', tone: 'purple', to: '/panel/blogs' }
    )
  }
  return lista
})
const numSkeleton = computed(() => (auth.isAdmin ? 6 : auth.isNoticias ? 2 : 1))

/* ---------- Distribución por rol (admin) ---------- */
const ROLES = [
  { clave: 'user', label: 'Usuarios', color: '#a5d6a7' },
  { clave: 'editor', label: 'Editores (plantas)', color: '#3a7a4f' },
  { clave: 'noticias', label: 'Editores (noticias)', color: '#f2b84b' },
  { clave: 'admin', label: 'Administradores', color: '#1565c0' }
]
const distribucion = computed(() => {
  const pr = stats.value?.usuariosPorRol || {}
  const filas = ROLES.map((r) => ({ ...r, valor: num(pr[r.clave]) }))
  const total = filas.reduce((a, f) => a + f.valor, 0)
  return {
    total,
    filas: filas.map((f) => ({ ...f, pct: total ? (f.valor / total) * 100 : 0 }))
  }
})
const fmtPct = (p) => `${p >= 10 || p === 0 ? Math.round(p) : p.toFixed(1)}%`

/* ---------- Accesos rápidos ---------- */
const accesos = computed(() => {
  const a = []
  if (auth.isEditor) a.push({ id: 'planta', label: 'Nueva planta', icon: 'leaf', to: { path: '/panel/plantas', query: { nuevo: '1' } } })
  if (auth.isNoticias) a.push({ id: 'noticia', label: 'Nueva noticia', icon: 'news', to: { path: '/panel/noticias', query: { nuevo: '1' } } })
  if (auth.isAdmin) a.push({ id: 'usuario', label: 'Registrar usuario', icon: 'userPlus', to: '/panel/usuarios/crear' })
  if (auth.isNoticias) a.push({ id: 'blogs', label: 'Moderar blogs', icon: 'blog', to: '/panel/blogs' })
  return a
})
</script>

<template>
  <div class="pm-dash">
    <PanelPageHeader :title="saludo">
      <template #actions>
        <button type="button" class="pm-dash-btn" :disabled="cargando" @click="cargar">
          <PanelIcon name="refresh" :size="16" :class="{ 'pm-dash-girando': cargando }" />
          Actualizar
        </button>
      </template>
    </PanelPageHeader>

    <!-- Error -->
    <div v-if="error && !cargando" class="pm-dash-error" role="alert">
      <span class="pm-dash-error-icono" aria-hidden="true"><PanelIcon name="alert" :size="22" /></span>
      <div class="pm-dash-error-texto">
        <strong>{{ error }}</strong>
      </div>
      <button type="button" class="pm-dash-btn" @click="cargar">Reintentar</button>
    </div>

    <!-- Tarjetas -->
    <section v-if="cargando || !error" aria-labelledby="pm-dash-resumen">
      <h2 id="pm-dash-resumen" class="pm-dash-h2">Resumen</h2>
      <div v-if="cargando" class="pm-dash-grid" :style="{ '--cols': Math.min(numSkeleton, 6) }" aria-busy="true">
        <div v-for="n in numSkeleton" :key="n" class="pm-dash-sk-card" aria-hidden="true">
          <span class="pm-sk pm-sk-icono"></span>
          <span class="pm-sk-col">
            <span class="pm-sk pm-sk-valor"></span>
            <span class="pm-sk pm-sk-label"></span>
          </span>
        </div>
        <span class="pm-sr" role="status">Cargando estadísticas…</span>
      </div>
      <div v-else class="pm-dash-grid" :style="{ '--cols': Math.min(tarjetas.length, 6) }">
        <StatCard
          v-for="t in tarjetas"
          :key="t.id"
          :label="t.label"
          :value="t.value"
          :icon="t.icon"
          :tone="t.tone"
          :to="t.to"
        />
      </div>
    </section>

    <div class="pm-dash-cols" :class="{ 'pm-dash-cols--una': !auth.isAdmin }">
      <!-- Distribución por rol (admin) -->
      <section v-if="auth.isAdmin" class="pm-dash-card" aria-labelledby="pm-dash-roles">
        <header class="pm-dash-card-cab">
          <h2 id="pm-dash-roles">Usuarios por rol</h2>
          <span v-if="!cargando && !error" class="pm-dash-card-extra">{{ distribucion.total.toLocaleString('es-MX') }} en total</span>
        </header>

        <div v-if="cargando" class="pm-dash-roles-sk" aria-hidden="true">
          <span class="pm-sk pm-sk-barra"></span>
          <span v-for="n in 4" :key="n" class="pm-sk pm-sk-fila"></span>
        </div>
        <p v-else-if="error" class="pm-dash-nodata">Sin datos disponibles.</p>
        <template v-else>
          <div
            class="pm-dash-apilada"
            role="img"
            :aria-label="distribucion.filas.map((f) => `${f.label}: ${f.valor}`).join(', ')"
          >
            <span
              v-for="f in distribucion.filas.filter((x) => x.valor > 0)"
              :key="f.clave"
              class="pm-dash-segmento"
              :style="{ width: `${f.pct}%`, background: f.color }"
              :title="`${f.label}: ${f.valor}`"
            ></span>
            <span v-if="!distribucion.total" class="pm-dash-segmento pm-dash-segmento--vacio"></span>
          </div>

          <ul class="pm-dash-roles" role="list">
            <li v-for="f in distribucion.filas" :key="f.clave" class="pm-dash-rol">
              <span class="pm-dash-rol-punto" :style="{ background: f.color }" aria-hidden="true"></span>
              <span class="pm-dash-rol-nombre">{{ f.label }}</span>
              <span class="pm-dash-rol-pista" aria-hidden="true">
                <span class="pm-dash-rol-barra" :style="{ width: `${f.pct}%`, background: f.color }"></span>
              </span>
              <span class="pm-dash-rol-valor">{{ f.valor.toLocaleString('es-MX') }}</span>
              <span class="pm-dash-rol-pct">{{ fmtPct(f.pct) }}</span>
            </li>
          </ul>
        </template>
      </section>

      <!-- Accesos rápidos -->
      <section class="pm-dash-card" aria-labelledby="pm-dash-accesos">
        <header class="pm-dash-card-cab">
          <h2 id="pm-dash-accesos">Accesos rápidos</h2>
        </header>
        <ul class="pm-dash-accesos" role="list">
          <li v-for="a in accesos" :key="a.id">
            <RouterLink :to="a.to" class="pm-dash-acceso">
              <span class="pm-dash-acceso-icono" aria-hidden="true"><PanelIcon :name="a.icon" :size="20" /></span>
              <span class="pm-dash-acceso-textos">
                <strong>{{ a.label }}</strong>
              </span>
              <span class="pm-dash-acceso-chevron" aria-hidden="true">›</span>
            </RouterLink>
          </li>
          <li>
            <RouterLink to="/" class="pm-dash-acceso">
              <span class="pm-dash-acceso-icono pm-dash-acceso-icono--gris" aria-hidden="true"><PanelIcon name="globe" :size="20" /></span>
              <span class="pm-dash-acceso-textos">
                <strong>Ver sitio público</strong>
              </span>
              <span class="pm-dash-acceso-chevron" aria-hidden="true">›</span>
            </RouterLink>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>

<style scoped>
.pm-dash { min-width: 0; }
.pm-sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
.pm-dash-h2 {
  margin: 0 0 12px;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #9aa5a0;
}

.pm-dash-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 16px;
  border: 1px solid #e5e9e6;
  border-radius: 12px;
  background: #fff;
  color: #1d2b22;
  font-family: inherit;
  font-size: 0.86rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}
.pm-dash-btn:hover:not(:disabled) { background: #f2f4f3; border-color: #cfd6d1; }
.pm-dash-btn:disabled { opacity: 0.6; cursor: progress; }
.pm-dash-btn:focus-visible { outline: 3px solid #a5d6a7; outline-offset: 2px; }
.pm-dash-girando { animation: pm-girar 0.9s linear infinite; }
@keyframes pm-girar { to { transform: rotate(360deg); } }

/* Error */
.pm-dash-error {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  padding: 16px 18px;
  margin-bottom: 20px;
  background: #fff;
  border: 1px solid #ffcdd2;
  border-left: 4px solid #c62828;
  border-radius: 14px;
}
.pm-dash-error-icono {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #ffebee;
  color: #c62828;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.pm-dash-error-texto {
  flex: 1 1 220px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 0.86rem;
  color: #66736a;
}
.pm-dash-error-texto strong { color: #1d2b22; font-size: 0.9rem; }

/* Tarjetas */
.pm-dash-grid {
  display: grid;
  /* Todas las tarjetas en una fila y del mismo tamaño (--cols = número de tarjetas, máx. 6) */
  grid-template-columns: repeat(var(--cols, 6), minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 22px;
}
.pm-dash-grid > * { height: 100%; }

/* Skeleton */
.pm-sk {
  display: block;
  border-radius: 6px;
  background: linear-gradient(90deg, #eef2ef 0%, #f7f9f8 40%, #eef2ef 80%);
  background-size: 300% 100%;
  animation: pm-shimmer 1.3s ease-in-out infinite;
}
@keyframes pm-shimmer {
  0% { background-position: 100% 0; }
  100% { background-position: 0 0; }
}
.pm-dash-sk-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px;
  background: #fff;
  border: 1px solid #e6ebe8;
  border-radius: 14px;
}
.pm-sk-icono { width: 46px; height: 46px; border-radius: 12px; flex-shrink: 0; }
.pm-sk-col { flex: 1; display: flex; flex-direction: column; gap: 8px; }
.pm-sk-valor { width: 50%; height: 22px; }
.pm-sk-label { width: 75%; height: 11px; }
.pm-dash-roles-sk { display: flex; flex-direction: column; gap: 14px; }
.pm-sk-barra { height: 14px; border-radius: 999px; }
.pm-sk-fila { height: 14px; width: 100%; }

/* Columnas */
.pm-dash-cols {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
  gap: 16px;
  align-items: stretch; /* ambas columnas con la misma altura */
}
.pm-dash-cols--una { grid-template-columns: minmax(0, 1fr); max-width: 760px; }
.pm-dash-card {
  background: #fff;
  border: 1px solid #e5e9e6;
  border-radius: 16px;
  padding: 18px 20px 20px;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.pm-dash-card-cab {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 16px;
}
.pm-dash-card-cab h2 {
  margin: 0;
  font-size: 1rem;
  font-weight: 800;
  color: #1d2b22;
}
.pm-dash-card-extra { font-size: 0.8rem; color: #7d8b84; font-weight: 600; }
.pm-dash-nodata { margin: 0; color: #8b978f; font-size: 0.88rem; }

/* Barra apilada */
.pm-dash-apilada {
  display: flex;
  height: 14px;
  border-radius: 999px;
  overflow: hidden;
  background: #eef2ef;
  gap: 2px;
  margin-bottom: 18px;
}
.pm-dash-segmento {
  height: 100%;
  min-width: 4px;
  transition: width 0.6s ease;
}
.pm-dash-segmento--vacio { width: 100%; background: #eef2ef; }

.pm-dash-roles {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-around; /* reparte las filas en la altura disponible */
  flex: 1;
  gap: 12px;
}
.pm-dash-rol {
  display: grid;
  grid-template-columns: 10px minmax(110px, 170px) minmax(0, 1fr) 44px 46px;
  align-items: center;
  gap: 10px;
  font-size: 0.86rem;
}
.pm-dash-rol-punto { width: 10px; height: 10px; border-radius: 3px; }
.pm-dash-rol-nombre { color: #33413a; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pm-dash-rol-pista { height: 8px; border-radius: 999px; background: #f1f4f2; overflow: hidden; }
.pm-dash-rol-barra { display: block; height: 100%; border-radius: 999px; transition: width 0.6s ease; }
.pm-dash-rol-valor { text-align: right; font-weight: 800; color: #1f2d26; font-variant-numeric: tabular-nums; }
.pm-dash-rol-pct { text-align: right; color: #8b978f; font-size: 0.78rem; font-variant-numeric: tabular-nums; }

/* Accesos rápidos */
.pm-dash-accesos {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.pm-dash-acceso {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 9px 12px;
  border: 1px solid #eef1ef;
  border-radius: 12px;
  text-decoration: none;
  color: inherit;
  transition: background 0.15s, border-color 0.15s;
}
.pm-dash-acceso:hover { background: #f7f8f7; border-color: #e5e9e6; }
.pm-dash-acceso:focus-visible { outline: 3px solid #a5d6a7; outline-offset: 1px; }
.pm-dash-acceso-icono {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border-radius: 10px;
  background: #f2f4f3;
  color: #1d2b22;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.pm-dash-acceso-icono--gris { background: #f1f3f2; color: #56635c; }
.pm-dash-acceso-textos {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}
.pm-dash-acceso-textos strong { font-size: 0.88rem; font-weight: 600; color: #1d2b22; }
.pm-dash-acceso-chevron {
  font-size: 1.4rem;
  line-height: 1;
  color: #b9c4be;
  transition: transform 0.15s, color 0.15s;
}
.pm-dash-acceso:hover .pm-dash-acceso-chevron { color: #2b5e3f; transform: translateX(2px); }

@media (max-width: 1099.98px) {
  .pm-dash-grid { grid-template-columns: repeat(min(var(--cols, 6), 3), minmax(0, 1fr)); }
  .pm-dash-cols { grid-template-columns: minmax(0, 1fr); }
}
@media (max-width: 599.98px) {
  .pm-dash-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .pm-dash-grid :deep(.pm-stat) {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
    padding: 14px;
  }
  .pm-dash-grid :deep(.pm-stat-icono) { width: 38px; height: 38px; border-radius: 10px; }
  .pm-dash-grid :deep(.pm-stat-valor) { font-size: 1.4rem; }
  .pm-dash-grid :deep(.pm-stat-label) { font-size: 0.78rem; }
  .pm-dash-grid :deep(.pm-stat-flecha) { position: absolute; top: 12px; right: 12px; }
  .pm-dash-sk-card { flex-direction: column; align-items: flex-start; padding: 14px; }
  .pm-dash-sk-card .pm-sk-col { width: 100%; }
  .pm-dash-card { padding: 16px 14px; }
  .pm-dash-rol {
    grid-template-columns: 10px minmax(0, 1fr) auto auto;
    row-gap: 6px;
  }
  .pm-dash-rol-pista { grid-column: 2 / -1; grid-row: 2; }
}
@media (prefers-reduced-motion: reduce) {
  .pm-sk, .pm-dash-girando { animation: none; }
}
</style>
