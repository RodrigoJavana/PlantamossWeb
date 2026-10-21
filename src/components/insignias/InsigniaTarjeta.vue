<script setup>
import { computed } from 'vue'
import Icono from '@/components/Icono.vue'
import MedallaInsignia from './MedallaInsignia.vue'
import { colorCategoria, fechaGanada } from './categorias'

const props = defineProps({
  insignia: { type: Object, required: true }
})

const color = computed(() => colorCategoria(props.insignia.tono || props.insignia.categoria))
const estilo = computed(() => ({ '--cat': color.value.color, '--cat-fondo': color.value.fondo }))
const progreso = computed(() => Math.min(100, Math.max(0, Number(props.insignia.progreso) || 0)))
const fecha = computed(() => fechaGanada(props.insignia.desbloqueadaEn))
</script>

<template>
  <article
    class="insignia"
    :class="{ bloqueada: !insignia.desbloqueada }"
    :style="estilo"
    :aria-label="`${insignia.titulo}, ${insignia.desbloqueada ? 'ganada' : 'bloqueada'}`"
  >
    <div class="insignia-cabecera">
      <MedallaInsignia
        :icono="insignia.icono"
        :categoria="insignia.tono || insignia.categoria"
        :ganada="insignia.desbloqueada"
        :tamano="68"
      />
      <span v-if="!insignia.desbloqueada" class="insignia-candado" title="Bloqueada">
        <Icono nombre="candado" :tamano="14" />
      </span>
    </div>

    <h3 class="insignia-titulo">{{ insignia.titulo }}</h3>
    <p class="insignia-descripcion">{{ insignia.descripcion }}</p>

    <div class="insignia-pie">
      <div class="insignia-avance">
        <div
          class="barra"
          role="progressbar"
          :aria-valuenow="progreso"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-label="`Avance de ${insignia.titulo}`"
        >
          <span class="barra-relleno" :style="{ width: progreso + '%' }"></span>
        </div>
        <small class="avance-texto">{{ insignia.avance }} / {{ insignia.meta }}</small>
      </div>
      <p v-if="insignia.desbloqueada && fecha" class="insignia-fecha">
        <Icono nombre="calendario" :tamano="14" /> Ganada el {{ fecha }}
      </p>
    </div>
  </article>
</template>

<style scoped>
.insignia {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: 0;
  padding: 20px;
  background: #fff;
  border: 1px solid #e5e9e6;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
}

.insignia-cabecera {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 14px;
}

.insignia-candado {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #f1f4f2;
  color: #6b776f;
  display: flex;
  align-items: center;
  justify-content: center;
}

.insignia-titulo {
  margin: 0;
  color: #1d2b22;
  font-size: 1.02rem;
  font-weight: 700;
  line-height: 1.3;
  overflow-wrap: anywhere;
}

.insignia-descripcion {
  margin: 6px 0 0;
  color: #66736a;
  font-size: 0.88rem;
  line-height: 1.5;
}

.insignia-pie {
  margin-top: auto;
  padding-top: 16px;
}

.insignia-avance {
  display: flex;
  align-items: center;
  gap: 10px;
}

.barra {
  flex: 1;
  height: 8px;
  border-radius: 999px;
  background: #eef1ef;
  overflow: hidden;
}

.barra-relleno {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: var(--cat);
  transition: width 0.4s ease;
}

.insignia.bloqueada .barra-relleno {
  background: #aab5ad;
}

.avance-texto {
  flex-shrink: 0;
  color: #4f5c54;
  font-size: 0.8rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.insignia-fecha {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 10px 0 0;
  color: var(--cat);
  font-size: 0.82rem;
  font-weight: 700;
}

@media (prefers-reduced-motion: reduce) {
  .barra-relleno { transition: none; }
}
</style>
