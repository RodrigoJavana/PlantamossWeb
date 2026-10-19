<script setup>
/**
 * Badge de estado tipo píldora con punto de color (estilo sobrio).
 * Props:
 *  - label (String): texto del badge (se muestra en mayúsculas). El slot default lo reemplaza si se usa.
 *  - tone ('green'|'yellow'|'gray'|'red'|'blue'|'purple', default 'gray'): color.
 */
import { computed } from 'vue'

const TONOS = ['green', 'yellow', 'gray', 'red', 'blue', 'purple']

const props = defineProps({
  label: { type: String, default: '' },
  tone: { type: String, default: 'gray' }
})

const tono = computed(() => (TONOS.includes(props.tone) ? props.tone : 'gray'))
</script>

<template>
  <span class="pm-badge" :class="`pm-badge--${tono}`"><slot>{{ label }}</slot></span>
</template>

<style scoped>
.pm-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: 999px;
  border: 1px solid transparent;
  font-size: 0.72rem;
  font-weight: 600;
  line-height: 1.3;
  white-space: nowrap;
  vertical-align: middle;
}
.pm-badge::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.85;
}
.pm-badge--green { background: #eef6f0; color: #2b5e3f; border-color: #d6e8dc; }
.pm-badge--yellow { background: #fdf7e8; color: #8a5a00; border-color: #f3e3b5; }
.pm-badge--gray { background: #f5f6f5; color: #56635c; border-color: #e5e9e6; }
.pm-badge--red { background: #fdf0f0; color: #b42318; border-color: #f5d0cd; }
.pm-badge--blue { background: #eff5fb; color: #1d4f8a; border-color: #d3e2f2; }
.pm-badge--purple { background: #f6f1fa; color: #5f3a86; border-color: #e3d6ef; }
</style>
