<script setup>
/**
 * Tarjeta de estadística del dashboard.
 * Props:
 *  - label (String): descripción ("Usuarios registrados").
 *  - value (Number|String): valor principal (los números se formatean con separador de miles es-MX).
 *  - icon (String): nombre de ícono de icons.js (p. ej. 'users', 'leaf'). No usar emojis.
 *  - tone ('green'|'blue'|'yellow'|'red'|'purple'|'gray', default 'green'): color del ícono.
 *  - to (String|Object, opcional): si se pasa, la tarjeta es un enlace (router-link).
 *  - hint (String, opcional): texto pequeño bajo la etiqueta.
 */
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import PanelIcon from './PanelIcon.vue'

const props = defineProps({
  label: { type: String, default: '' },
  value: { type: [Number, String], default: '' },
  icon: { type: String, default: '' },
  tone: { type: String, default: 'green' },
  to: { type: [String, Object], default: null },
  hint: { type: String, default: '' }
})

const valorTexto = computed(() =>
  typeof props.value === 'number' ? props.value.toLocaleString('es-MX') : String(props.value ?? '')
)
const tono = computed(() =>
  ['green', 'blue', 'yellow', 'red', 'purple', 'gray'].includes(props.tone) ? props.tone : 'green'
)
</script>

<template>
  <component
    :is="to ? RouterLink : 'div'"
    :to="to || undefined"
    class="pm-stat"
    :class="[`pm-stat--${tono}`, { 'pm-stat--enlace': !!to }]"
  >
    <span v-if="icon" class="pm-stat-icono" aria-hidden="true">
      <PanelIcon :name="icon" :size="22" />
    </span>
    <span class="pm-stat-cuerpo">
      <span class="pm-stat-valor">{{ valorTexto }}</span>
      <span class="pm-stat-label">{{ label }}</span>
      <span v-if="hint" class="pm-stat-hint">{{ hint }}</span>
    </span>
    <span v-if="to" class="pm-stat-flecha" aria-hidden="true">›</span>
  </component>
</template>

<style scoped>
.pm-stat {
  --tono: #2e7d32;
  --tono-suave: #e8f5e9;
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  background: #fff;
  border: 1px solid #e5e9e6;
  border-radius: 16px;
  color: #1d2b22;
  text-decoration: none;
  min-width: 0;
  transition: transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease;
}
.pm-stat--green { --tono: #2e7d32; --tono-suave: #e8f5e9; }
.pm-stat--blue { --tono: #1565c0; --tono-suave: #e3f2fd; }
.pm-stat--yellow { --tono: #b26a00; --tono-suave: #fff3d6; }
.pm-stat--red { --tono: #c62828; --tono-suave: #ffebee; }
.pm-stat--purple { --tono: #6a1b9a; --tono-suave: #f3e5f5; }
.pm-stat--gray { --tono: #56635c; --tono-suave: #f1f3f2; }

.pm-stat--enlace:hover {
  border-color: #cfd6d1;
  box-shadow: 0 6px 18px rgba(16, 40, 26, 0.06);
}
.pm-stat--enlace:focus-visible {
  outline: 3px solid #a5d6a7;
  outline-offset: 2px;
}
.pm-stat-icono {
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--tono-suave);
  color: var(--tono);
}
.pm-stat-cuerpo {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1 1 auto;
}
.pm-stat-valor {
  font-size: 1.55rem;
  font-weight: 800;
  line-height: 1.1;
  color: #1d2b22;
  font-variant-numeric: tabular-nums;
}
.pm-stat-label {
  margin-top: 3px;
  font-size: 0.82rem;
  font-weight: 600;
  color: #66736a;
}
.pm-stat-hint {
  margin-top: 2px;
  font-size: 0.74rem;
  color: #9aa5a0;
}
.pm-stat-flecha {
  font-size: 1.5rem;
  line-height: 1;
  color: #b9c4be;
  transition: color 0.15s, transform 0.15s;
}
.pm-stat--enlace:hover .pm-stat-flecha {
  color: var(--tono);
  transform: translateX(2px);
}
</style>
