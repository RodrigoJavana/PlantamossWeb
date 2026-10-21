<script setup>
import { computed } from 'vue'
import Icono from '@/components/Icono.vue'
import { tonosMedalla } from './categorias'

// Medalla con efecto 3D: aro metálico, disco con relieve, brillo superior y destello que pasa.
// Bloqueada: misma forma en grises, sin brillo ni destello.
const props = defineProps({
  icono: { type: String, required: true },
  categoria: { type: String, default: 'Plantas' }, // categoría o tono (rojo, navidad, morado)
  ganada: { type: Boolean, default: true },
  tamano: { type: Number, default: 64 },
  destello: { type: Boolean, default: false } // destello continuo (aviso de insignia ganada)
})

const estilo = computed(() => {
  const t = tonosMedalla(props.categoria, props.ganada)
  return {
    '--m-claro': t.claro,
    '--m-base': t.base,
    '--m-oscuro': t.oscuro,
    '--m-borde': t.borde,
    '--m-tam': `${props.tamano}px`
  }
})
</script>

<template>
  <span class="medalla" :class="{ ganada, destello: destello && ganada }" :style="estilo" aria-hidden="true">
    <span class="medalla-disco">
      <Icono :nombre="icono" :tamano="Math.round(tamano * 0.44)" :grosor="2.2" class="medalla-icono" />
    </span>
  </span>
</template>

<style scoped>
.medalla {
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
  width: var(--m-tam);
  height: var(--m-tam);
  padding: calc(var(--m-tam) * 0.07);
  border-radius: 50%;
  /* Aro metálico */
  background: linear-gradient(145deg, var(--m-borde) 0%, var(--m-base) 45%, var(--m-oscuro) 100%);
  box-shadow:
    0 calc(var(--m-tam) * 0.08) calc(var(--m-tam) * 0.18) rgba(0, 0, 0, 0.18),
    inset 0 1px 1px rgba(255, 255, 255, 0.7);
  transition: transform 0.25s ease;
}

.medalla-disco {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: 50%;
  color: #fff;
  /* Relieve: luz arriba a la izquierda, sombra abajo */
  background: radial-gradient(circle at 32% 26%, var(--m-claro) 0%, var(--m-base) 52%, var(--m-oscuro) 100%);
  box-shadow:
    inset 0 calc(var(--m-tam) * -0.07) calc(var(--m-tam) * 0.12) rgba(0, 0, 0, 0.28),
    inset 0 calc(var(--m-tam) * 0.05) calc(var(--m-tam) * 0.08) rgba(255, 255, 255, 0.45);
}

/* Brillo superior (reflejo de cristal) */
.medalla-disco::before {
  content: '';
  position: absolute;
  top: 6%;
  left: 16%;
  width: 68%;
  height: 42%;
  border-radius: 50%;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.75), rgba(255, 255, 255, 0));
  pointer-events: none;
}

/* Destello que cruza la medalla */
.medalla-disco::after {
  content: '';
  position: absolute;
  top: -20%;
  left: -80%;
  width: 45%;
  height: 140%;
  transform: rotate(25deg);
  background: linear-gradient(90deg, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.65), rgba(255, 255, 255, 0));
  opacity: 0;
  pointer-events: none;
}

.medalla-icono {
  position: relative;
  z-index: 1;
  filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.35));
}

.medalla.ganada:hover { transform: translateY(-2px) scale(1.04); }
.medalla.ganada:hover .medalla-disco::after,
.medalla.destello .medalla-disco::after {
  animation: medalla-destello 1.4s ease-in-out;
}
.medalla.destello .medalla-disco::after { animation-iteration-count: infinite; animation-delay: 0.6s; }

/* Bloqueada: gris mate, sin reflejo */
.medalla:not(.ganada) { box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08); }
.medalla:not(.ganada) .medalla-disco { color: #f7f8f7; }
.medalla:not(.ganada) .medalla-disco::before { opacity: 0.35; }
.medalla:not(.ganada) .medalla-icono { filter: none; opacity: 0.85; }

@keyframes medalla-destello {
  0% { left: -80%; opacity: 0; }
  20% { opacity: 1; }
  60% { left: 130%; opacity: 0; }
  100% { left: 130%; opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .medalla { transition: none; }
  .medalla.ganada:hover { transform: none; }
  .medalla-disco::after { animation: none !important; }
}
</style>
