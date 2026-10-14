<script setup>
import Icono from '@/components/Icono.vue'
import { computed } from 'vue'
import BaseModal from './BaseModal.vue'
import PlantaImagen from './PlantaImagen.vue'
import { etiquetaClima, etiquetaLuz } from '@/utils/plantas'

const props = defineProps({
  show: { type: Boolean, default: false },
  planta: { type: Object, default: null }
})
const emit = defineEmits(['close'])

const clima = computed(() => etiquetaClima(props.planta?.tipoClima))
const luz = computed(() => etiquetaLuz(props.planta?.luzSol))
</script>

<template>
  <BaseModal :show="show && !!planta" :title="planta?.nombrePlanta || ''" size="lg" @close="emit('close')">
    <div v-if="planta" class="detalle-planta">
      <PlantaImagen class="detalle-imagen" :src="planta.urlImagen" :alt="planta.nombrePlanta" />
      <div class="detalle-info">
        <p v-if="planta.nombreCientifico" class="detalle-cientifico"><em>{{ planta.nombreCientifico }}</em></p>
        <div class="chips detalle-chips">
          <span v-if="planta.nombreEstado" class="chip chip-estado"><Icono nombre="ubicacion" :tamano="14" /> {{ planta.nombreEstado }}</span>
          <span v-if="clima" class="chip chip-clima"><Icono :nombre="clima.icono" :tamano="14" /> {{ clima.etiqueta }}</span>
          <span v-if="luz" class="chip chip-luz"><Icono :nombre="luz.icono" :tamano="14" /> {{ luz.etiqueta }}</span>
          <span v-if="planta.riego" class="chip chip-riego"><Icono nombre="gota" :tamano="14" /> {{ planta.riego }}</span>
        </div>

        <section v-if="planta.descripcion" class="detalle-seccion">
          <h4>Descripción</h4>
          <p class="texto-plano">{{ planta.descripcion }}</p>
        </section>

        <section class="detalle-seccion detalle-cuidados">
          <h4><Icono nombre="brote" :tamano="18" /> Cuidados</h4>
          <p v-if="planta.cuidadosTexto" class="texto-plano">{{ planta.cuidadosTexto }}</p>
          <p v-else class="color-gris">Sin información.</p>
        </section>
      </div>
    </div>
    <template #footer>
      <button type="button" class="boton-natural boton-entendido" @click="emit('close')">Entendido</button>
    </template>
  </BaseModal>
</template>

<style scoped>
.detalle-planta {
  display: grid;
  grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
  gap: 24px;
  align-items: start;
}
.detalle-imagen {
  height: 320px;
  border-radius: 14px;
  border: 1px solid #e5e9e6;
}
.detalle-cientifico { margin: 0 0 12px; color: #66736a; font-size: 0.95rem; }
.detalle-chips { margin-bottom: 18px; }
.detalle-seccion h4 { display: flex; align-items: center; gap: 6px; margin: 0 0 6px; color: #1d2b22; font-size: 0.92rem; font-weight: 800; }
.detalle-seccion + .detalle-seccion { margin-top: 16px; }
.detalle-cuidados {
  background: #f7f8f7;
  border: 1px solid #e5e9e6;
  padding: 12px 14px;
  border-radius: 12px;
}
.detalle-cuidados h4 .icono { color: #2b5e3f; }
.texto-plano { white-space: pre-line; line-height: 1.6; color: #33413a; font-size: 0.93rem; margin: 0; }
.boton-entendido { width: auto; margin-top: 0; padding: 10px 24px; }

@media (max-width: 700px) {
  .detalle-planta { grid-template-columns: 1fr; gap: 16px; }
  .detalle-imagen { height: 220px; }
  .boton-entendido { width: 100%; }
}
</style>
