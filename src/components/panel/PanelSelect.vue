<script setup>
/**
 * Select personalizado del panel (estilo intranet): botón + lista desplegable.
 * Props:
 *  - modelValue: valor seleccionado ('' = opción vacía).
 *  - options: [{ value, label }].
 *  - placeholder: texto de la opción vacía (si se pasa, se muestra como primera opción).
 *  - ariaLabel: etiqueta accesible.
 *  - id: id del botón (para <label for>).
 *  - invalid: marca el borde en rojo.
 * Clase opcional `en-form` para usarlo dentro de .grupo-entrada (mismo alto que los inputs).
 * Emite update:modelValue.
 */
import { ref, computed, nextTick, onBeforeUnmount } from 'vue'
import PanelIcon from './PanelIcon.vue'

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  options: { type: Array, default: () => [] },
  placeholder: { type: String, default: '' },
  ariaLabel: { type: String, default: '' },
  id: { type: String, default: '' },
  invalid: { type: Boolean, default: false }
})
const emit = defineEmits(['update:modelValue'])

const abierto = ref(false)
const activo = ref(-1)
const raiz = ref(null)
const lista = ref(null)
const uid = `pm-sel-${Math.random().toString(36).slice(2, 8)}`

const opciones = computed(() => {
  const base = props.options.map((o) => ({ value: o.value, label: o.label }))
  return props.placeholder ? [{ value: '', label: props.placeholder, vacia: true }, ...base] : base
})
const igual = (a, b) => String(a ?? '') === String(b ?? '')
const seleccionada = computed(() => opciones.value.find((o) => igual(o.value, props.modelValue)))
const texto = computed(() => seleccionada.value?.label || props.placeholder || 'Seleccionar')

function fuera(e) {
  if (raiz.value && !raiz.value.contains(e.target)) cerrar()
}
async function abrir() {
  abierto.value = true
  activo.value = Math.max(0, opciones.value.findIndex((o) => igual(o.value, props.modelValue)))
  document.addEventListener('mousedown', fuera)
  await nextTick()
  lista.value?.children[activo.value]?.scrollIntoView({ block: 'nearest' })
}
function cerrar() {
  abierto.value = false
  document.removeEventListener('mousedown', fuera)
}
function alternar() {
  abierto.value ? cerrar() : abrir()
}
function elegir(o) {
  emit('update:modelValue', o.value)
  cerrar()
}
function onKey(e) {
  const n = opciones.value.length
  if (!abierto.value) {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
      e.preventDefault()
      abrir()
    }
    return
  }
  if (e.key === 'ArrowDown') { e.preventDefault(); activo.value = (activo.value + 1) % n }
  else if (e.key === 'ArrowUp') { e.preventDefault(); activo.value = (activo.value - 1 + n) % n }
  else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (opciones.value[activo.value]) elegir(opciones.value[activo.value]) }
  else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); cerrar() }
  else if (e.key === 'Tab') cerrar()
  nextTick(() => lista.value?.children[activo.value]?.scrollIntoView({ block: 'nearest' }))
}
onBeforeUnmount(cerrar)
</script>

<template>
  <div ref="raiz" class="pm-sel" :class="{ 'pm-sel--abierto': abierto }">
    <button
      :id="id || undefined"
      type="button"
      class="pm-sel-btn"
      :class="{ 'pm-sel-btn--vacio': !seleccionada || seleccionada.vacia, 'pm-sel-btn--error': invalid }"
      aria-haspopup="listbox"
      :aria-expanded="abierto ? 'true' : 'false'"
      :aria-controls="uid"
      :aria-label="ariaLabel || undefined"
      @click="alternar"
      @keydown="onKey"
    >
      <span class="pm-sel-texto">{{ texto }}</span>
      <PanelIcon name="chevronDown" :size="15" class="pm-sel-flecha" />
    </button>
    <ul v-show="abierto" :id="uid" ref="lista" class="pm-sel-lista" role="listbox" :aria-label="ariaLabel || undefined">
      <li
        v-for="(o, i) in opciones"
        :key="`${o.value}-${i}`"
        role="option"
        class="pm-sel-op"
        :class="{ 'pm-sel-op--activa': i === activo, 'pm-sel-op--vacia': o.vacia }"
        :aria-selected="igual(o.value, modelValue) ? 'true' : 'false'"
        @mousedown.prevent
        @mouseenter="activo = i"
        @click="elegir(o)"
      >
        <span>{{ o.label }}</span>
        <svg v-if="igual(o.value, modelValue)" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.pm-sel { position: relative; min-width: 0; flex: 1 1 170px; }
.pm-sel--abierto { z-index: 30; }
.pm-sel-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 9px 12px;
  border: 1px solid #e5e9e6;
  border-radius: 10px;
  background: #fff;
  color: #1d2b22;
  font: inherit;
  font-size: 0.88rem;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
  box-sizing: border-box;
}
.pm-sel-btn:hover { border-color: #cfd6d1; }
.pm-sel-btn:focus-visible,
.pm-sel--abierto .pm-sel-btn { outline: none; border-color: #2b5e3f; box-shadow: 0 0 0 3px rgba(43, 94, 63, 0.12); }
.pm-sel-btn--vacio { color: #66736a; }
.pm-sel-btn--error { border-color: #c62828; }
.pm-sel.en-form { width: 100%; }
.pm-sel.en-form .pm-sel-btn { padding: 11px 13px; font-size: 0.93rem; }
.pm-sel-texto { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pm-sel-flecha { color: #9aa59e; transition: transform 0.15s; }
.pm-sel--abierto .pm-sel-flecha { transform: rotate(180deg); }
.pm-sel-lista {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(100% + 4px);
  margin: 0;
  padding: 4px;
  list-style: none;
  max-height: 240px;
  overflow-y: auto;
  background: #fff;
  border: 1px solid #e5e9e6;
  border-radius: 12px;
  box-shadow: 0 12px 28px rgba(16, 40, 26, 0.14);
  box-sizing: border-box;
}
.pm-sel-op {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 7px 10px;
  border-radius: 8px;
  font-size: 0.85rem;
  color: #33413a;
  cursor: pointer;
}
.pm-sel-op--vacia { color: #66736a; font-style: italic; }
.pm-sel-op--activa { background: #f2f4f3; color: #1d2b22; }
.pm-sel-op[aria-selected='true'] { font-weight: 700; color: #1d2b22; }
.pm-sel-op svg { color: #2b5e3f; flex-shrink: 0; }
</style>
