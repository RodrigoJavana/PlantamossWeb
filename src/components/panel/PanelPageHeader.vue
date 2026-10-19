<script setup>
/**
 * Encabezado de página del panel.
 * Props:
 *  - title (String): título principal (h1).
 *  - subtitle: obsoleto (ya no se muestra; regla de diseño: solo título).
 * Slots:
 *  - actions: botones a la derecha (en móvil bajan debajo del título).
 */
defineProps({
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' }
})
</script>

<template>
  <div class="pm-ph">
    <div class="pm-ph-textos">
      <h1 class="pm-ph-titulo">{{ title }}</h1>
    </div>
    <div v-if="$slots.actions" class="pm-ph-acciones">
      <slot name="actions" />
    </div>
  </div>
</template>

<style scoped>
.pm-ph {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px 20px;
  margin-bottom: 18px;
}
.pm-ph-textos { min-width: 0; flex: 1 1 280px; }
.pm-ph-titulo {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 800;
  line-height: 1.2;
  color: #1d2b22;
  letter-spacing: -0.01em;
  overflow-wrap: anywhere;
}
.pm-ph-acciones {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}
@media (max-width: 599.98px) {
  .pm-ph { align-items: stretch; }
  .pm-ph-titulo { font-size: 1.22rem; }
  .pm-ph-acciones { width: 100%; }
  .pm-ph-acciones > :deep(*) { flex: 1 1 auto; justify-content: center; text-align: center; }
}
</style>
