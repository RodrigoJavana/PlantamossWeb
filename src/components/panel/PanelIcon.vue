<script setup>
/**
 * Ícono SVG del panel.
 * - name: clave de ICONOS (icons.js). Si no existe no se renderiza nada (no usar emojis).
 * - size: tamaño en px (default 18).
 */
import { computed } from 'vue'
import { ICONOS, existeIcono } from './icons'

const props = defineProps({
  name: { type: String, default: '' },
  size: { type: [Number, String], default: 18 }
})

const esSvg = computed(() => existeIcono(props.name))
</script>

<template>
  <svg
    v-if="esSvg"
    class="pm-icon"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
    v-html="ICONOS[name]"
  />
</template>

<style scoped>
.pm-icon {
  flex-shrink: 0;
  display: inline-block;
  vertical-align: middle;
}
</style>
