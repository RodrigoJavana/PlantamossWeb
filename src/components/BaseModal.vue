<script>
// Pila global de modales abiertos: ESC solo cierra el de arriba.
const pilaModales = []
let siguienteModal = 1
</script>

<script setup>
import { watch, onBeforeUnmount, ref, nextTick, useSlots } from 'vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  title: { type: String, default: '' },
  size: { type: String, default: 'md', validator: (v) => ['sm', 'md', 'lg'].includes(v) },
  hideClose: { type: Boolean, default: false }
})
const emit = defineEmits(['close'])
const slots = useSlots()
const tarjeta = ref(null)
const idModal = siguienteModal++

// Contador global en <body> para soportar modales anidados sin desbloquear el scroll antes de tiempo.
let bloqueado = false
function bloquearScroll() {
  if (bloqueado) return
  bloqueado = true
  const n = Number(document.body.dataset.modales || 0) + 1
  document.body.dataset.modales = String(n)
  document.body.style.overflow = 'hidden'
}
function desbloquearScroll() {
  if (!bloqueado) return
  bloqueado = false
  const n = Math.max(0, Number(document.body.dataset.modales || 1) - 1)
  document.body.dataset.modales = String(n)
  if (n === 0) document.body.style.overflow = ''
}

function onKey(e) {
  if (e.key === 'Escape' && pilaModales[pilaModales.length - 1] === idModal) {
    e.stopPropagation()
    emit('close')
  }
}

watch(
  () => props.show,
  async (v) => {
    if (v) {
      if (!pilaModales.includes(idModal)) pilaModales.push(idModal)
      bloquearScroll()
      document.addEventListener('keydown', onKey)
      await nextTick()
      tarjeta.value?.focus({ preventScroll: true })
    } else {
      quitarDePila()
      desbloquearScroll()
      document.removeEventListener('keydown', onKey)
    }
  },
  { immediate: true }
)

function quitarDePila() {
  const i = pilaModales.indexOf(idModal)
  if (i !== -1) pilaModales.splice(i, 1)
}

onBeforeUnmount(() => {
  quitarDePila()
  desbloquearScroll()
  document.removeEventListener('keydown', onKey)
})

// Solo cerramos si el clic empezó y terminó en el fondo (evita cerrar al seleccionar texto y soltar fuera).
let mousedownEnFondo = false
function onMouseDown(e) { mousedownEnFondo = e.target === e.currentTarget }
function onClickFondo(e) {
  if (mousedownEnFondo && e.target === e.currentTarget) emit('close')
  mousedownEnFondo = false
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="pm-modal-fondo" @mousedown="onMouseDown" @click="onClickFondo">
        <div
          ref="tarjeta"
          class="pm-modal"
          :class="`pm-modal-${size}`"
          role="dialog"
          aria-modal="true"
          :aria-label="title || 'Ventana'"
          tabindex="-1"
        >
          <header v-if="title || slots.header" class="pm-modal-cabecera">
            <slot name="header">
              <h3 class="pm-modal-titulo">{{ title }}</h3>
            </slot>
            <button type="button" class="pm-modal-cerrar" aria-label="Cerrar" @click="emit('close')">×</button>
          </header>
          <button
            v-else-if="!hideClose"
            type="button"
            class="pm-modal-cerrar pm-modal-cerrar-flotante"
            aria-label="Cerrar"
            @click="emit('close')"
          >×</button>
          <div class="pm-modal-cuerpo">
            <slot />
          </div>
          <footer v-if="slots.footer" class="pm-modal-pie">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style>
.pm-modal-fondo {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: rgba(15, 30, 20, 0.55);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  overflow-y: auto;
  padding: 40px 16px;
}
.pm-modal {
  position: relative;
  background: #fff;
  border-radius: 20px;
  border: 1px solid #e5e9e6;
  box-shadow: 0 24px 60px rgba(16, 40, 26, 0.22);
  width: 100%;
  margin: auto;
  outline: none;
  display: flex;
  flex-direction: column;
  color: #333;
  text-align: left;
}
.pm-modal-sm { max-width: 420px; }
.pm-modal-md { max-width: 600px; }
.pm-modal-lg { max-width: 820px; }
.pm-modal-cabecera {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid #eef1ef;
}
.pm-modal-titulo {
  margin: 0;
  color: #1d2b22;
  font-size: 1.08rem;
  font-weight: 800;
  line-height: 1.3;
}
.pm-modal-cerrar {
  flex: 0 0 auto;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  border: none;
  background: transparent;
  color: #66736a;
  font-size: 1.4rem;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s, color 0.2s, transform 0.2s;
}
.pm-modal-cerrar:hover { background: #f2f4f3; color: #1d2b22; }
.pm-modal-cerrar:focus-visible { outline: 3px solid #a5d6a7; }
.pm-modal-cerrar-flotante {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 5;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}
.pm-modal-cuerpo { padding: 18px 20px; }
.pm-modal-pie {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 10px;
  padding: 12px 20px 16px;
  border-top: 1px solid #eef1ef;
}
.modal-enter-active, .modal-leave-active { transition: opacity 0.25s ease; }
.modal-enter-active .pm-modal, .modal-leave-active .pm-modal { transition: transform 0.25s ease, opacity 0.25s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .pm-modal, .modal-leave-to .pm-modal { transform: scale(0.94) translateY(10px); opacity: 0; }

@media (max-width: 600px) {
  .pm-modal-fondo { padding: 16px 10px; }
  .pm-modal-cabecera { padding: 14px 16px; }
  .pm-modal-cuerpo { padding: 16px; }
  .pm-modal-pie { padding: 12px 16px 16px; }
  .pm-modal-titulo { font-size: 1rem; }
  .pm-modal-pie > * { flex: 1 1 0; justify-content: center; }
}
</style>
