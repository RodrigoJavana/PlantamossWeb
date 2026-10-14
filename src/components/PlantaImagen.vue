<script setup>
import Icono from '@/components/Icono.vue'
import { ref, computed, watch } from 'vue'
import { urlSegura } from '@/utils/plantas'

const props = defineProps({
  src: { type: String, default: '' },
  alt: { type: String, default: '' },
  icono: { type: String, default: 'brote' },
  texto: { type: String, default: '' }
})

const rota = ref(false)
const cargada = ref(false)
const url = computed(() => urlSegura(props.src))

watch(() => props.src, () => {
  rota.value = false
  cargada.value = false
})
</script>

<template>
  <div class="planta-imagen" :class="{ 'planta-imagen-vacia': !url || rota }">
    <img
      v-if="url && !rota"
      :src="url"
      :alt="alt"
      loading="lazy"
      :class="{ cargada }"
      @load="cargada = true"
      @error="rota = true"
    />
    <div v-else class="planta-imagen-placeholder" role="img" :aria-label="alt || 'Imagen no disponible'">
      <span class="planta-imagen-icono" aria-hidden="true"><Icono :nombre="icono" class="icono-em" /></span>
      <span v-if="texto" class="planta-imagen-texto">{{ texto }}</span>
    </div>
  </div>
</template>

<style>
.planta-imagen {
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
  background: #eef5ef;
  flex-shrink: 0;
}
.planta-imagen img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  opacity: 0;
  transition: opacity 0.35s ease;
}
.planta-imagen img.cargada { opacity: 1; }
.planta-imagen-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: linear-gradient(135deg, #e8f5e9, #c8e6c9);
  color: #1b5e20;
}
.planta-imagen-icono { font-size: 3rem; line-height: 1; }
.planta-imagen-texto { font-weight: bold; font-size: 1.1rem; }
</style>
