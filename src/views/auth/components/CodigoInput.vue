<script setup>
import { ref, onMounted, watch } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  longitud: { type: Number, default: 6 },
  disabled: { type: Boolean, default: false },
  autofocus: { type: Boolean, default: true },
})
const emit = defineEmits(['update:modelValue', 'completo'])

const digitos = ref(Array.from({ length: props.longitud }, (_, i) => props.modelValue[i] || ''))
const cajas = ref([])

watch(
  () => props.modelValue,
  (val) => {
    if (val === digitos.value.join('')) return
    digitos.value = Array.from({ length: props.longitud }, (_, i) => (val || '')[i] || '')
  }
)

function emitir() {
  const codigo = digitos.value.join('')
  emit('update:modelValue', codigo)
  if (codigo.length === props.longitud && !digitos.value.includes('')) emit('completo', codigo)
}

function enfocar(i) {
  const caja = cajas.value[Math.max(0, Math.min(i, props.longitud - 1))]
  if (caja) {
    caja.focus()
    caja.select()
  }
}

function alEscribir(i, e) {
  const soloNumeros = e.target.value.replace(/\D/g, '')
  if (soloNumeros.length > 1) {
    // Autocompletado del sistema o escritura rápida: repartir los dígitos
    repartir(soloNumeros, i)
    return
  }
  digitos.value[i] = soloNumeros
  e.target.value = soloNumeros
  emitir()
  if (soloNumeros && i < props.longitud - 1) enfocar(i + 1)
}

function alTecla(i, e) {
  if (e.key === 'Backspace') {
    if (digitos.value[i]) {
      digitos.value[i] = ''
      emitir()
    } else if (i > 0) {
      digitos.value[i - 1] = ''
      emitir()
      enfocar(i - 1)
    }
    e.preventDefault()
  } else if (e.key === 'ArrowLeft' && i > 0) {
    enfocar(i - 1)
    e.preventDefault()
  } else if (e.key === 'ArrowRight' && i < props.longitud - 1) {
    enfocar(i + 1)
    e.preventDefault()
  }
}

function repartir(texto, desde = 0) {
  const nums = texto.replace(/\D/g, '').slice(0, props.longitud - desde)
  for (let k = 0; k < nums.length; k++) digitos.value[desde + k] = nums[k]
  emitir()
  enfocar(Math.min(desde + nums.length, props.longitud - 1))
}

function alPegar(i, e) {
  e.preventDefault()
  const texto = (e.clipboardData || window.clipboardData)?.getData('text') || ''
  const nums = texto.replace(/\D/g, '')
  if (!nums) return
  // Si pegan el código completo, se llena desde la primera caja
  repartir(nums, nums.length >= props.longitud ? 0 : i)
}

function limpiar() {
  digitos.value = Array(props.longitud).fill('')
  emitir()
  enfocar(0)
}

defineExpose({ limpiar, enfocar })

onMounted(() => {
  if (props.autofocus) enfocar(0)
})
</script>

<template>
  <div class="codigo-cajas" role="group" aria-label="Código de 6 dígitos">
    <input
      v-for="(d, i) in digitos"
      :key="i"
      :ref="(el) => (cajas[i] = el)"
      :value="d"
      type="text"
      inputmode="numeric"
      :autocomplete="i === 0 ? 'one-time-code' : 'off'"
      maxlength="6"
      class="codigo-caja"
      :class="{ llena: d }"
      :disabled="disabled"
      :aria-label="`Dígito ${i + 1}`"
      @input="alEscribir(i, $event)"
      @keydown="alTecla(i, $event)"
      @paste="alPegar(i, $event)"
      @focus="$event.target.select()"
    />
  </div>
</template>

<style scoped>
.codigo-cajas {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin: 10px 0 5px;
}
.codigo-caja {
  width: 46px;
  height: 56px;
  text-align: center;
  font-size: 1.5rem;
  font-weight: bold;
  color: #2b5e3f;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  background: #fdfdfd;
  font-family: inherit;
  transition: border-color 0.2s, box-shadow 0.2s;
  padding: 0;
}
.codigo-caja:focus {
  border-color: #2e7d32;
  outline: none;
  box-shadow: 0 0 10px rgba(46, 125, 50, 0.15);
  background: #fff;
}
.codigo-caja.llena {
  border-color: #a5d6a7;
  background: #f4f9f4;
}
.codigo-caja:disabled {
  opacity: 0.6;
}
@media (max-width: 400px) {
  .codigo-cajas { gap: 5px; }
  .codigo-caja { width: 38px; height: 48px; font-size: 1.25rem; }
}
</style>
