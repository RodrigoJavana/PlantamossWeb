<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import BaseModal from '@/components/BaseModal.vue'
import MedallaInsignia from './MedallaInsignia.vue'
import { useInsigniasStore } from '@/stores/insignias'
import { colorCategoria } from './categorias'

// Aviso de insignia ganada. Muestra la cola de una en una (la primera de la cola es la que se ve).
const store = useInsigniasStore()
const router = useRouter()

const pendiente = computed(() => store.cola[0] || null)
const estilo = computed(() => {
  const c = colorCategoria(pendiente.value?.tono || pendiente.value?.categoria)
  return { '--cat': c.color, '--cat-fondo': c.fondo }
})

function cerrar() {
  store.siguiente()
}

function verInsignias() {
  store.siguiente()
  router.push({ path: '/perfil', query: { tab: 'insignias' } })
}
</script>

<template>
  <BaseModal :show="!!pendiente" title="¡Ganaste una insignia!" size="sm" @close="cerrar">
    <div v-if="pendiente" :key="pendiente.codigo" class="ganada" :style="estilo">
      <MedallaInsignia
        class="ganada-medalla"
        :icono="pendiente.icono"
        :categoria="pendiente.tono || pendiente.categoria"
        :tamano="116"
        destello
      />
      <h3 class="ganada-titulo">{{ pendiente.titulo }}</h3>
      <p class="ganada-descripcion">{{ pendiente.descripcion }}</p>
    </div>

    <template v-if="pendiente" #footer>
      <button type="button" class="boton-natural boton-ver" @click="verInsignias">Ver mis insignias</button>
      <button type="button" class="boton-secundario" @click="cerrar">Cerrar</button>
    </template>
  </BaseModal>
</template>

<style scoped>
.ganada {
  text-align: center;
  padding: 8px 4px 4px;
  animation: ganada-aparecer 0.35s cubic-bezier(0.2, 0.8, 0.2, 1) both;
}

.ganada-medalla {
  margin-bottom: 18px;
  animation: ganada-icono 0.55s cubic-bezier(0.2, 0.8, 0.2, 1.25) 0.1s both;
}

.ganada-titulo {
  margin: 0 0 8px;
  color: #1d2b22;
  font-size: 1.2rem;
  font-weight: 800;
}

.ganada-descripcion {
  margin: 0;
  color: #4f5c54;
  font-size: 0.95rem;
  line-height: 1.5;
}

.boton-ver {
  width: auto;
  margin-top: 0;
  padding: 10px 20px;
  font-family: inherit;
}

@keyframes ganada-aparecer {
  from { opacity: 0; transform: scale(0.92); }
  to { opacity: 1; transform: none; }
}

@keyframes ganada-icono {
  from { opacity: 0; transform: scale(0.4) rotate(-20deg); }
  to { opacity: 1; transform: none; }
}

@media (prefers-reduced-motion: reduce) {
  .ganada,
  .ganada-medalla { animation: none; }
}
</style>
