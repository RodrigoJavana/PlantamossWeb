<script setup>
import { ref, computed } from 'vue'
import Icono from '@/components/Icono.vue'
import InsigniaTarjeta from './InsigniaTarjeta.vue'
import { CATEGORIAS } from './categorias'
import { useInsigniasStore } from '@/stores/insignias'

const store = useInsigniasStore()

const FILTROS = CATEGORIAS.map((c) => c.valor)
const filtro = ref('Todas')

const total = computed(() => store.insignias.length)
const ganadas = computed(() => store.insignias.filter((i) => i.desbloqueada).length)
const visibles = computed(() =>
  filtro.value === 'Todas' ? store.insignias : store.insignias.filter((i) => i.categoria === filtro.value)
)
</script>

<template>
  <section class="insignias-grid" aria-labelledby="titulo-insignias">
    <div class="cabecera-insignias">
      <h2 id="titulo-insignias" class="titulo-insignias">Mis insignias</h2>
      <p v-if="total" class="resumen-insignias">
        <Icono nombre="estrella" :tamano="16" /> {{ ganadas }} de {{ total }} ganadas
      </p>
    </div>

    <div class="filtros-insignias" role="group" aria-label="Filtrar insignias por categoría">
      <button
        v-for="f in FILTROS"
        :key="f"
        type="button"
        class="chip-filtro"
        :class="{ activo: filtro === f }"
        :aria-pressed="filtro === f"
        @click="filtro = f"
      >
        {{ f }}
      </button>
    </div>

    <div v-if="store.cargando && !total" class="cuadricula-insignias" aria-hidden="true">
      <div v-for="n in 6" :key="n" class="esqueleto skeleton"></div>
    </div>

    <p v-else-if="!visibles.length" class="vacio-insignias">No hay insignias en esta categoría.</p>

    <div v-else class="cuadricula-insignias">
      <InsigniaTarjeta v-for="i in visibles" :key="i.codigo" :insignia="i" />
    </div>
  </section>
</template>

<style scoped>
.insignias-grid {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.cabecera-insignias {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px 16px;
}

.titulo-insignias {
  margin: 0;
  color: #1d2b22;
  font-size: 1.05rem;
  font-weight: 700;
}

.resumen-insignias {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  color: #2e7d32;
  font-size: 0.88rem;
  font-weight: 700;
}

.filtros-insignias {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 16px 0 20px;
}

.chip-filtro {
  padding: 7px 14px;
  border: 1px solid #d5ded8;
  border-radius: 999px;
  background: #fff;
  color: #44514a;
  font-family: inherit;
  font-size: 0.86rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s, color 0.2s;
}
.chip-filtro:hover { background: #f1f5f2; border-color: #b9c6bd; }
.chip-filtro.activo {
  background: #2b5e3f;
  border-color: #2b5e3f;
  color: #fff;
}
.chip-filtro:focus-visible { outline: 3px solid #a5d6a7; outline-offset: 2px; }

.cuadricula-insignias {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  grid-auto-rows: 1fr;
  gap: 16px;
}

.esqueleto {
  height: 200px;
  border-radius: 16px;
}

.vacio-insignias {
  margin: 0;
  padding: 24px 0;
  color: #66736a;
  text-align: center;
}

@media (max-width: 480px) {
  .cuadricula-insignias { grid-template-columns: 1fr; }
}
</style>
