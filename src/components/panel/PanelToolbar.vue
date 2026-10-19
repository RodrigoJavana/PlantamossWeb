<script setup>
/**
 * Barra de herramientas del panel (tarjeta blanca).
 * Slots:
 *  - default: buscador + filtros + botones en una fila (hace wrap; en móvil cada control ocupa el ancho completo).
 */
</script>

<template>
  <div class="pm-toolbar" role="search">
    <slot />
  </div>
</template>

<style scoped>
.pm-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  padding: 0;
  margin-bottom: 14px;
}
.pm-toolbar > :slotted(input[type='search']),
.pm-toolbar > :slotted(input[type='text']) {
  flex: 1 1 240px;
  min-width: 0;
}
@media (max-width: 599.98px) {
  .pm-toolbar > :slotted(*) {
    flex: 1 1 100%;
    min-width: 0;
    width: 100%;
    box-sizing: border-box;
  }
}
</style>
