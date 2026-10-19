<script setup>
/**
 * Menú de acciones de una fila (botón ⋮).
 * Props:
 *  - items: [{ label, icon?, danger?, disabled?, action }]
 *      label (String) texto · icon (String) nombre de icons.js (no usar emojis) · danger (Boolean) rojo
 *      disabled (Boolean) deshabilitado · action (Function) se llama al elegir la opción.
 *  - label (String, default 'Opciones'): etiqueta accesible del botón.
 * Emite:
 *  - select(item): además de llamar a `item.action`.
 *
 * El menú se teletransporta al <body> (posición fija) para que no lo recorte la lista;
 * se cierra con clic fuera, ESC, scroll o al cambiar el tamaño. Navegable con flechas.
 * El clic en el botón NO se propaga a la fila (las filas pueden ser clicables).
 */
import { nextTick, onBeforeUnmount, reactive, ref, watch } from 'vue'
import PanelIcon from './PanelIcon.vue'
import './panel.css'

const props = defineProps({
  items: { type: Array, default: () => [] },
  label: { type: String, default: 'Opciones' }
})
const emit = defineEmits(['select'])

const uid = `pm-rowmenu-${Math.random().toString(36).slice(2, 9)}`

const abierto = ref(false)
const boton = ref(null)
const pop = ref(null)
const pos = reactive({ top: 0, left: 0, arriba: false })

function opciones() {
  return pop.value ? Array.from(pop.value.querySelectorAll('[role="menuitem"]:not([aria-disabled="true"])')) : []
}

function calcularPosicion() {
  const r = boton.value?.getBoundingClientRect()
  if (!r) return
  const ancho = pop.value?.offsetWidth || 200
  const alto = pop.value?.offsetHeight || 44 * Math.max(1, props.items.length) + 12
  const vw = window.innerWidth
  const vh = window.innerHeight
  let left = r.right - ancho
  left = Math.max(8, Math.min(left, vw - ancho - 8))
  const cabeAbajo = r.bottom + 6 + alto <= vh - 8
  pos.arriba = !cabeAbajo && r.top - 6 - alto >= 8
  pos.top = pos.arriba ? r.top - 6 - alto : r.bottom + 6
  pos.left = left
}

async function abrir(enfocar = 'primero') {
  if (!props.items.length) return
  abierto.value = true
  await nextTick()
  calcularPosicion()
  const ops = opciones()
  if (enfocar === 'ultimo') ops[ops.length - 1]?.focus()
  else ops[0]?.focus()
}
function cerrar(devolverFoco = false) {
  if (!abierto.value) return
  abierto.value = false
  if (devolverFoco) boton.value?.focus()
}
function alternar() {
  abierto.value ? cerrar() : abrir()
}

function elegir(item) {
  if (item.disabled) return
  cerrar(true)
  emit('select', item)
  if (typeof item.action === 'function') item.action()
}

function teclaBoton(e) {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    abrir('primero')
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    abrir('ultimo')
  }
}
function teclaMenu(e) {
  const ops = opciones()
  const i = ops.indexOf(document.activeElement)
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    ops[(i + 1) % ops.length]?.focus()
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    ops[(i - 1 + ops.length) % ops.length]?.focus()
  } else if (e.key === 'Home') {
    e.preventDefault()
    ops[0]?.focus()
  } else if (e.key === 'End') {
    e.preventDefault()
    ops[ops.length - 1]?.focus()
  } else if (e.key === 'Escape') {
    e.preventDefault()
    e.stopPropagation()
    cerrar(true)
  } else if (e.key === 'Tab') {
    cerrar(true)
  }
}

function clicFuera(e) {
  if (boton.value?.contains(e.target) || pop.value?.contains(e.target)) return
  cerrar()
}
function alDesplazar(e) {
  if (pop.value && e.target instanceof Node && pop.value.contains(e.target)) return
  cerrar()
}
function alRedimensionar() {
  cerrar()
}

function escuchar(si) {
  const fn = si ? 'addEventListener' : 'removeEventListener'
  document[fn]('pointerdown', clicFuera, true)
  window[fn]('scroll', alDesplazar, true)
  window[fn]('resize', alRedimensionar)
}
watch(abierto, escuchar)
onBeforeUnmount(() => escuchar(false))
</script>

<template>
  <span class="pm-rowmenu" @click.stop>
    <button
      ref="boton"
      type="button"
      class="pm-rowmenu-btn"
      :class="{ 'pm-rowmenu-btn--abierto': abierto }"
      :aria-label="label"
      :title="label"
      aria-haspopup="menu"
      :aria-expanded="String(abierto)"
      :aria-controls="abierto ? uid : undefined"
      :disabled="!items.length"
      @click.stop="alternar"
      @keydown="teclaBoton"
    >
      <PanelIcon name="dots" :size="18" />
    </button>

    <Teleport to="body">
      <ul
        v-if="abierto"
        :id="uid"
        ref="pop"
        class="pm-rowmenu-pop"
        :class="{ 'pm-rowmenu-pop--arriba': pos.arriba }"
        role="menu"
        :aria-label="label"
        :style="{ top: `${pos.top}px`, left: `${pos.left}px` }"
        @keydown="teclaMenu"
        @click.stop
      >
        <li v-for="(it, i) in items" :key="i" role="none">
          <button
            type="button"
            role="menuitem"
            class="pm-rowmenu-opcion"
            :class="{ 'pm-rowmenu-opcion--peligro': it.danger }"
            :aria-disabled="it.disabled ? 'true' : undefined"
            :tabindex="it.disabled ? -1 : 0"
            @click="elegir(it)"
          >
            <PanelIcon v-if="it.icon" :name="it.icon" :size="16" />
            <span>{{ it.label }}</span>
          </button>
        </li>
      </ul>
    </Teleport>
  </span>
</template>

<style scoped>
.pm-rowmenu {
  display: inline-flex;
  position: relative;
}
.pm-rowmenu-btn {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 9px;
  background: transparent;
  color: #8b978f;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.pm-rowmenu-btn:hover,
.pm-rowmenu-btn--abierto {
  background: #eef2ef;
  color: #1f2d26;
}
.pm-rowmenu-btn:focus-visible {
  outline: 3px solid #a5d6a7;
  outline-offset: 1px;
}
.pm-rowmenu-btn:disabled {
  opacity: 0.4;
  cursor: default;
}
</style>
