<script setup>
import { ref } from 'vue'

defineOptions({ inheritAttrs: false })

defineProps({
  modelValue: { type: String, default: '' },
  invalido: { type: Boolean, default: false },
  valido: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])

const visible = ref(false)
</script>

<template>
  <div class="campo-password">
    <input
      v-bind="$attrs"
      :type="visible ? 'text' : 'password'"
      :value="modelValue"
      :class="{ 'borde-error': invalido, 'borde-ok': valido }"
      @input="emit('update:modelValue', $event.target.value)"
    />
    <button
      type="button"
      class="boton-ojo"
      :aria-label="visible ? 'Ocultar contraseña' : 'Mostrar contraseña'"
      :title="visible ? 'Ocultar contraseña' : 'Mostrar contraseña'"
      @click="visible = !visible"
    >
      <svg v-if="!visible" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
      <svg v-else viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
        <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.campo-password {
  position: relative;
}
.campo-password input {
  padding-right: 48px !important;
}
.boton-ojo {
  position: absolute;
  top: 50%;
  right: 10px;
  transform: translateY(-50%);
  background: none;
  border: none;
  padding: 6px;
  color: #7f8c8d;
  cursor: pointer;
  display: flex;
  border-radius: 6px;
}
.boton-ojo:hover,
.boton-ojo:focus-visible {
  color: #2b5e3f;
  background: #e8f5e9;
}
.borde-error {
  border-color: #c62828 !important;
}
.borde-ok {
  border-color: #2e7d32 !important;
}
</style>
