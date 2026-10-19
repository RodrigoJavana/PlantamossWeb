<script setup>
/**
 * Buscador del panel con ícono (estilo intranet). Uso: <PanelSearch v-model="texto" placeholder="Buscar..." />
 */
import PanelIcon from './PanelIcon.vue'

defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: 'Buscar...' },
  ariaLabel: { type: String, default: 'Buscar' }
})
const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <div class="pm-search">
    <PanelIcon name="search" :size="16" class="pm-search-icono" />
    <input
      :value="modelValue"
      type="search"
      class="pm-search-input"
      :placeholder="placeholder"
      :aria-label="ariaLabel"
      @input="emit('update:modelValue', $event.target.value)"
    />
    <button v-if="modelValue" type="button" class="pm-search-limpiar" aria-label="Borrar búsqueda" @click="emit('update:modelValue', '')">
      <PanelIcon name="close" :size="14" />
    </button>
  </div>
</template>

<style scoped>
.pm-search { position: relative; flex: 3 1 260px; min-width: 0; }
.pm-search-icono { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: #9aa59e; pointer-events: none; }
.pm-search-input {
  width: 100%;
  box-sizing: border-box;
  padding: 9px 34px 9px 34px;
  border: 1px solid #e5e9e6;
  border-radius: 10px;
  background: #fff;
  color: #1d2b22;
  font: inherit;
  font-size: 0.88rem;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.pm-search-input::placeholder { color: #9aa59e; }
.pm-search-input::-webkit-search-cancel-button { display: none; }
.pm-search-input:hover { border-color: #cfd6d1; }
.pm-search-input:focus { outline: none; border-color: #2b5e3f; box-shadow: 0 0 0 3px rgba(43, 94, 63, 0.12); }
.pm-search-limpiar {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #9aa59e;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.pm-search-limpiar:hover { background: #f2f4f3; color: #1d2b22; }
</style>
