<script setup>
import BaseModal from './BaseModal.vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  title: { type: String, default: '¿Estás seguro?' },
  message: { type: String, default: '' },
  confirmText: { type: String, default: 'Confirmar' },
  cancelText: { type: String, default: 'Cancelar' },
  variant: { type: String, default: 'danger', validator: (v) => ['danger', 'primary'].includes(v) },
  loading: { type: Boolean, default: false }
})
const emit = defineEmits(['confirm', 'cancel'])

function cancelar() {
  if (!props.loading) emit('cancel')
}
</script>

<template>
  <BaseModal :show="show" size="sm" hide-close @close="cancelar">
    <div class="confirmar">
      <div class="confirmar-icono" :class="`confirmar-icono-${variant}`" aria-hidden="true">
        <svg v-if="variant === 'danger'" viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6M14 11v6" />
          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
        </svg>
        <svg v-else viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <h3 class="confirmar-titulo">{{ title }}</h3>
      <p v-if="message" class="confirmar-mensaje">{{ message }}</p>
      <slot />
      <div class="confirmar-botones">
        <button type="button" class="confirmar-btn confirmar-btn-cancelar" :disabled="loading" @click="cancelar">
          {{ cancelText }}
        </button>
        <button
          type="button"
          class="confirmar-btn"
          :class="variant === 'danger' ? 'confirmar-btn-peligro' : 'confirmar-btn-primario'"
          :disabled="loading"
          @click="emit('confirm')"
        >
          <span v-if="loading" class="confirmar-spinner" aria-hidden="true"></span>
          {{ loading ? 'Procesando...' : confirmText }}
        </button>
      </div>
    </div>
  </BaseModal>
</template>

<style scoped>
.confirmar { text-align: center; padding: 10px 2px 2px; }
.confirmar-icono {
  width: 60px;
  height: 60px;
  margin: 0 auto 14px;
  border-radius: 16px;
  border: 1px solid transparent;
  display: flex;
  align-items: center;
  justify-content: center;
}
.confirmar-icono-danger { background: #fdf0f0; border-color: #f5d0cd; color: #c62828; }
.confirmar-icono-primary { background: #eef6f0; border-color: #d6e8dc; color: #2b5e3f; }
.confirmar-titulo { margin: 0 0 6px; color: #1d2b22; font-size: 1.1rem; font-weight: 800; }
.confirmar-mensaje { margin: 0 0 4px; color: #66736a; font-size: 0.88rem; line-height: 1.5; }
.confirmar-botones { display: flex; gap: 10px; margin-top: 20px; }
.confirmar-btn {
  flex: 1;
  padding: 11px 16px;
  border-radius: 12px;
  border: none;
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: inherit;
}
.confirmar-btn:active:not(:disabled) { transform: scale(0.98); }
.confirmar-btn:disabled { opacity: 0.65; cursor: not-allowed; }
.confirmar-btn-cancelar { background: #f2f4f3; color: #1d2b22; }
.confirmar-btn-cancelar:hover:not(:disabled) { background: #e5e9e6; }
.confirmar-btn-peligro { background: #c62828; color: #fff; }
.confirmar-btn-peligro:hover:not(:disabled) { background: #b71c1c; }
.confirmar-btn-primario { background: #2b5e3f; color: #fff; }
.confirmar-btn-primario:hover:not(:disabled) { background: #234d34; }
.confirmar-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.5);
  border-top-color: #fff;
  border-radius: 50%;
  animation: girar 0.7s linear infinite;
}
@keyframes girar { to { transform: rotate(360deg); } }
</style>
