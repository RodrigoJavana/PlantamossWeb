<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import api, { mensajeError } from '@/services/api'
import { useToast } from '@/composables/useToast'
import CodigoInput from './components/CodigoInput.vue'
import { useCooldown } from './components/useCooldown'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const email = computed(() => (typeof route.query.email === 'string' ? route.query.email : ''))
const codigo = ref('')
const error = ref('')
const verificando = ref(false)
const reenviando = ref(false)
const codigoInput = ref(null)
const { restante, activo: enEspera, iniciar } = useCooldown(60)

const codigoCompleto = computed(() => /^\d{6}$/.test(codigo.value))

onMounted(() => {
  if (!email.value) {
    router.replace('/recuperar-contrasena')
    return
  }
  // El código se acaba de enviar en la pantalla anterior
  iniciar()
})

async function verificar() {
  if (!codigoCompleto.value || verificando.value) return
  error.value = ''
  verificando.value = true
  try {
    const { data } = await api.post('/auth/recuperar/verificar', {
      email: email.value,
      codigo: codigo.value,
    })
    sessionStorage.setItem('pm_reset', JSON.stringify({ email: email.value, resetToken: data.resetToken }))
    router.replace('/nueva-contrasena')
  } catch (err) {
    error.value = mensajeError(err)
    verificando.value = false
    await nextTick()
    codigoInput.value?.limpiar()
  } finally {
    verificando.value = false
  }
}

async function reenviar() {
  if (enEspera.value || reenviando.value) return
  error.value = ''
  reenviando.value = true
  try {
    const { data } = await api.post('/auth/recuperar', { email: email.value })
    toast.success(data?.message || 'Te enviamos un nuevo código.')
    codigoInput.value?.limpiar()
    iniciar()
  } catch (err) {
    error.value = mensajeError(err)
  } finally {
    reenviando.value = false
  }
}
</script>

<template>
  <div class="formulario">
    <h2>Ingresa tu código</h2>
    <p class="dato-correo">Enviado a <strong>{{ email }}</strong></p>

    <div v-if="error" class="alerta-error" role="alert"><strong>Error:</strong> {{ error }}</div>

    <form @submit.prevent="verificar">
      <div class="grupo-entrada">
        <label>Código de seguridad</label>
        <CodigoInput ref="codigoInput" v-model="codigo" :disabled="verificando" @completo="verificar" />
      </div>

      <button type="submit" class="boton-natural" :disabled="!codigoCompleto || verificando">
        {{ verificando ? 'Verificando...' : 'Verificar código' }}
      </button>
    </form>

    <p class="font-9rem pie">
      ¿No lo recibiste?
      <span v-if="enEspera" class="color-gris">Solicitar de nuevo en {{ restante }} s</span>
      <button v-else type="button" class="enlace-boton" :disabled="reenviando" @click="reenviar">
        {{ reenviando ? 'Enviando...' : 'Solicitar de nuevo' }}
      </button>
    </p>
    <p class="font-9rem">
      <RouterLink to="/recuperar-contrasena" class="color-verde text-decoration-none">Usar otro correo</RouterLink>
    </p>
  </div>
</template>

<style scoped>
.pie {
  margin-top: 25px;
}
.enlace-boton {
  background: none;
  border: none;
  padding: 0;
  font: inherit;
  font-weight: bold;
  color: #2b5e3f;
  cursor: pointer;
}
.enlace-boton:hover {
  text-decoration: underline;
}
.enlace-boton:disabled {
  opacity: 0.6;
  cursor: wait;
}
.boton-natural:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
