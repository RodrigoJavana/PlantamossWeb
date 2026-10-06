<script setup>
import Icono from '@/components/Icono.vue'
import { computed, watch } from 'vue'

const props = defineProps({
  password: { type: String, default: '' },
  valido: { type: Boolean, default: false }
})
const emit = defineEmits(['update:valido'])

const requisitos = computed(() => {
  const p = props.password || ''
  return [
    { clave: 'length', texto: 'Al menos 8 caracteres', ok: p.length >= 8 },
    { clave: 'upper', texto: 'Al menos una mayúscula', ok: /[A-ZÁÉÍÓÚÑ]/.test(p) },
    { clave: 'lower', texto: 'Al menos una minúscula', ok: /[a-záéíóúñ]/.test(p) },
    { clave: 'num', texto: 'Al menos un número', ok: /\d/.test(p) },
    { clave: 'spec', texto: 'Al menos un carácter especial (@$!%*?&)', ok: /[^A-Za-z0-9ÁÉÍÓÚÑáéíóúñ\s]/.test(p) }
  ]
})
const esValido = computed(() => requisitos.value.every((r) => r.ok))

watch(esValido, (v) => emit('update:valido', v), { immediate: true })

defineExpose({ valido: esValido })
</script>

<template>
  <ul class="pm-requisitos" aria-live="polite">
    <li
      v-for="r in requisitos"
      :key="r.clave"
      :class="r.ok ? 'req-ok' : (password ? 'req-mal' : 'req-neutro')"
    >
      <span class="req-icono" aria-hidden="true"><Icono :nombre="r.ok ? 'check' : 'cerrar'" :tamano="14" /></span>
      {{ r.texto }}
      <span class="sr-only">{{ r.ok ? '(cumplido)' : '(pendiente)' }}</span>
    </li>
  </ul>
</template>

<style scoped>
.pm-requisitos {
  list-style: none;
  font-size: 0.82rem;
  margin: 8px 0 0;
  padding: 0;
  text-align: left;
}
.pm-requisitos li { display: flex; align-items: center; gap: 6px; margin-bottom: 3px; transition: color 0.2s; }
.req-icono { font-size: 0.75rem; width: 14px; display: inline-block; text-align: center; }
.req-ok { color: #2e7d32; }
.req-mal { color: #c62828; }
.req-neutro { color: #888; }
</style>
