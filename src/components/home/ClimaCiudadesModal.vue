<script setup>
/**
 * Modal para elegir las ciudades fijadas en el clima de Inicio (máx. 6, en orden).
 * - show: visible
 * - catalogo: [{ id, ciudad, estado, consulta }] (GET /externo/ciudades)
 * - seleccion: ids actualmente fijados
 * - guardando: deshabilita botones
 * Emite: close, guardar(ids)
 */
import { ref, computed, watch } from 'vue'
import BaseModal from '@/components/BaseModal.vue'
import Icono from '@/components/Icono.vue'
import { normalizar } from '@/utils/plantas'

const MAXIMO = 6

const props = defineProps({
  show: { type: Boolean, default: false },
  catalogo: { type: Array, default: () => [] },
  seleccion: { type: Array, default: () => [] },
  guardando: { type: Boolean, default: false }
})
const emit = defineEmits(['close', 'guardar'])

const elegidas = ref([])
const busqueda = ref('')

// Cada vez que se abre, parte de lo que el usuario tiene guardado
watch(
  () => props.show,
  (visible) => {
    if (visible) {
      elegidas.value = [...props.seleccion]
      busqueda.value = ''
    }
  }
)

const porId = computed(() => Object.fromEntries(props.catalogo.map((c) => [c.id, c])))
const lleno = computed(() => elegidas.value.length >= MAXIMO)

const filtradas = computed(() => {
  const q = normalizar(busqueda.value)
  if (!q) return props.catalogo
  return props.catalogo.filter((c) => normalizar(`${c.ciudad} ${c.estado}`).includes(q))
})

function alternar(id) {
  const i = elegidas.value.indexOf(id)
  if (i >= 0) elegidas.value.splice(i, 1)
  else if (!lleno.value) elegidas.value.push(id)
}

function mover(i, delta) {
  const j = i + delta
  if (j < 0 || j >= elegidas.value.length) return
  const lista = [...elegidas.value]
  ;[lista[i], lista[j]] = [lista[j], lista[i]]
  elegidas.value = lista
}
</script>

<template>
  <BaseModal :show="show" title="Ciudades del clima" size="md" @close="emit('close')">
    <div class="cc">
      <div class="cc-seccion">
        <div class="cc-cabecera">
          <span class="cc-etiqueta">Fijadas</span>
          <span class="cc-contador">{{ elegidas.length }}/{{ MAXIMO }}</span>
        </div>
        <ol v-if="elegidas.length" class="cc-fijadas">
          <li v-for="(id, i) in elegidas" :key="id">
            <span class="cc-orden">{{ i + 1 }}</span>
            <span class="cc-nombre">
              {{ porId[id]?.ciudad || id }}
              <small>{{ porId[id]?.estado }}</small>
            </span>
            <button type="button" class="cc-btn" :disabled="i === 0" aria-label="Subir" @click="mover(i, -1)">
              <Icono nombre="subir" :tamano="16" />
            </button>
            <button type="button" class="cc-btn" :disabled="i === elegidas.length - 1" aria-label="Bajar" @click="mover(i, 1)">
              <Icono nombre="bajar" :tamano="16" />
            </button>
            <button type="button" class="cc-btn cc-quitar" aria-label="Quitar" @click="alternar(id)">
              <Icono nombre="cerrar" :tamano="16" />
            </button>
          </li>
        </ol>
        <p v-else class="cc-vacio">Selecciona al menos una ciudad.</p>
      </div>

      <div class="cc-seccion">
        <label class="cc-buscador">
          <Icono nombre="buscar" :tamano="16" />
          <input v-model="busqueda" type="search" placeholder="Buscar ciudad o estado" aria-label="Buscar ciudad o estado" />
        </label>
        <ul class="cc-lista">
          <li v-for="c in filtradas" :key="c.id">
            <label class="cc-opcion" :class="{ deshabilitada: lleno && !elegidas.includes(c.id) }">
              <input
                type="checkbox"
                :checked="elegidas.includes(c.id)"
                :disabled="lleno && !elegidas.includes(c.id)"
                @change="alternar(c.id)"
              />
              <span class="cc-nombre">
                {{ c.ciudad }}
                <small>{{ c.estado }}</small>
              </span>
            </label>
          </li>
          <li v-if="!filtradas.length" class="cc-vacio">Sin resultados.</li>
        </ul>
      </div>
    </div>

    <template #footer>
      <button type="button" class="cc-boton secundario" :disabled="guardando" @click="emit('close')">Cancelar</button>
      <button
        type="button"
        class="cc-boton primario"
        :disabled="guardando || !elegidas.length"
        @click="emit('guardar', [...elegidas])"
      >
        {{ guardando ? 'Guardando...' : 'Guardar' }}
      </button>
    </template>
  </BaseModal>
</template>

<style scoped>
.cc { display: flex; flex-direction: column; gap: 18px; }
.cc-cabecera { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.cc-etiqueta { font-weight: 700; color: #1d2b22; }
.cc-contador { font-size: 0.85rem; color: #66736a; }

.cc-fijadas { list-style: none; margin: 0; padding: 0; border: 1px solid #e5e9e6; border-radius: 10px; }
.cc-fijadas li { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-top: 1px solid #eef1ef; }
.cc-fijadas li:first-child { border-top: none; }
.cc-orden {
  width: 22px; height: 22px; border-radius: 50%; background: #f2f4f3; color: #1d2b22;
  font-size: 0.78rem; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.cc-nombre { flex: 1; min-width: 0; color: #1d2b22; font-weight: 600; font-size: 0.92rem; }
.cc-nombre small { display: block; font-weight: 400; color: #66736a; font-size: 0.78rem; }
.cc-btn {
  width: 30px; height: 30px; border-radius: 8px; border: 1px solid #e5e9e6; background: #fff; color: #1d2b22;
  display: flex; align-items: center; justify-content: center; cursor: pointer;
}
.cc-btn:hover:not(:disabled) { background: #f2f4f3; }
.cc-btn:disabled { opacity: 0.35; cursor: default; }
.cc-quitar:hover:not(:disabled) { color: #c62828; border-color: #f3c7c7; background: #fff5f5; }

.cc-buscador {
  display: flex; align-items: center; gap: 8px; border: 1px solid #e5e9e6; border-radius: 10px;
  padding: 0 12px; color: #66736a; margin-bottom: 8px;
}
.cc-buscador:focus-within { border-color: #2b5e3f; }
.cc-buscador input { flex: 1; border: none; outline: none; padding: 10px 0; font: inherit; color: #1d2b22; background: transparent; }

.cc-lista {
  list-style: none; margin: 0; padding: 0; max-height: 260px; overflow-y: auto;
  border: 1px solid #e5e9e6; border-radius: 10px;
}
.cc-opcion { display: flex; align-items: center; gap: 10px; padding: 8px 12px; cursor: pointer; border-top: 1px solid #eef1ef; }
.cc-lista li:first-child .cc-opcion { border-top: none; }
.cc-opcion:hover { background: #f7f9f8; }
.cc-opcion input { width: 16px; height: 16px; accent-color: #2b5e3f; }
.cc-opcion.deshabilitada { opacity: 0.45; cursor: not-allowed; }
.cc-vacio { margin: 0; padding: 10px 12px; color: #66736a; font-size: 0.9rem; }

.cc-boton { padding: 10px 20px; border-radius: 10px; font-weight: 700; font-size: 0.92rem; cursor: pointer; border: 1px solid transparent; }
.cc-boton.secundario { background: #f2f4f3; color: #1d2b22; }
.cc-boton.secundario:hover:not(:disabled) { background: #e7ebe9; }
.cc-boton.primario { background: #2b5e3f; color: #fff; }
.cc-boton.primario:hover:not(:disabled) { background: #3a7a4f; }
.cc-boton:disabled { background: #e5e9e6; color: #8a968e; cursor: not-allowed; }
</style>
