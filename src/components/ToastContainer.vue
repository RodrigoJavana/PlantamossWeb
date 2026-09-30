<script setup>
import Icono from '@/components/Icono.vue'
import { useToast } from '@/composables/useToast'

const toast = useToast()
const iconos = { success: 'exito', error: 'error', info: 'info' }
</script>

<template>
  <Teleport to="body">
    <div class="toast-contenedor" aria-live="polite" aria-atomic="false">
      <TransitionGroup name="toast">
        <div
          v-for="t in toast.toasts"
          :key="t.id"
          class="toast"
          :class="`toast-${t.tipo}`"
          :role="t.tipo === 'error' ? 'alert' : 'status'"
        >
          <span class="toast-icono" aria-hidden="true"><Icono :nombre="iconos[t.tipo]" :tamano="18" /></span>
          <span class="toast-texto">{{ t.mensaje }}</span>
          <button type="button" class="toast-cerrar" aria-label="Cerrar aviso" @click="toast.remove(t.id)">×</button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-contenedor {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 3000;
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: min(360px, calc(100vw - 32px));
  pointer-events: none;
}
.toast {
  pointer-events: auto;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 12px;
  color: #fff;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.18);
  font-size: 0.95rem;
  line-height: 1.4;
}
.toast-success { background: #2e7d32; }
.toast-error { background: #c62828; }
.toast-info { background: #1565c0; }
.toast-icono {
  flex: 0 0 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.22);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: bold;
}
.toast-texto { flex: 1; padding-top: 2px; word-break: break-word; }
.toast-cerrar {
  background: none;
  border: none;
  color: #fff;
  font-size: 1.3rem;
  line-height: 1;
  cursor: pointer;
  opacity: 0.8;
  padding: 0 2px;
}
.toast-cerrar:hover { opacity: 1; }
.toast-enter-active, .toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateX(40px); }
.toast-move { transition: transform 0.3s ease; }
</style>
