<script setup>
defineProps({
  items: { type: Array, default: () => [] }
})
</script>

<template>
  <nav class="camino" aria-label="Ruta de navegación">
    <template v-for="(item, i) in items" :key="i">
      <RouterLink v-if="item.to && i < items.length - 1" :to="item.to">{{ item.label }}</RouterLink>
      <span v-else :aria-current="i === items.length - 1 ? 'page' : undefined">{{ item.label }}</span>
      <span v-if="i < items.length - 1" class="camino-sep" aria-hidden="true"> / </span>
    </template>
  </nav>
</template>

<style scoped>
.camino-sep { color: #c2cac5; margin: 0 4px; }
.camino a:hover { color: #1d2b22; text-decoration: underline; }
</style>
