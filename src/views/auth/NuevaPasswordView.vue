<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api, { mensajeError } from '@/services/api'
import { useToast } from '@/composables/useToast'
import PasswordRequisitos from '@/components/PasswordRequisitos.vue'
import PasswordInput from './components/PasswordInput.vue'

const router = useRouter()
const toast = useToast()

const reset = ref(null)
const password = ref('')
const passwordConfirmation = ref('')
const passwordValida = ref(false)
const error = ref('')
const errores = ref({})
const enviando = ref(false)

const coinciden = computed(() => password.value !== '' && password.value === passwordConfirmation.value)
const mostrarNoCoinciden = computed(() => passwordConfirmation.value !== '' && !coinciden.value)
const puedeEnviar = computed(() => passwordValida.value && coinciden.value && !enviando.value)

function leerReset() {
  try {
    const datos = JSON.parse(sessionStorage.getItem('pm_reset') || 'null')
    return datos?.email && datos?.resetToken ? datos : null
  } catch {
    return null
  }
}

function sesionExpirada() {
  sessionStorage.removeItem('pm_reset')
  toast.error('La sesión expiró. Solicita un nuevo código para restablecer tu contraseña.')
  router.replace('/recuperar-contrasena')
}

onMounted(() => {
  reset.value = leerReset()
  if (!reset.value) sesionExpirada()
})

function errorCampo(campo) {
  const e = errores.value[campo]
  return Array.isArray(e) ? e[0] : e || ''
}

async function actualizar() {
  if (!puedeEnviar.value || !reset.value) return
  error.value = ''
  errores.value = {}
  enviando.value = true
  try {
    const { data } = await api.post('/auth/recuperar/restablecer', {
      email: reset.value.email,
      resetToken: reset.value.resetToken,
      password: password.value,
      passwordConfirmation: passwordConfirmation.value,
    })
    sessionStorage.removeItem('pm_reset')
    router.replace({
      path: '/login',
      query: { status: data?.message || 'Contraseña actualizada correctamente. Inicia sesión.' },
    })
  } catch (err) {
    const codigo = err?.response?.status
    if (codigo === 401 || (codigo === 400 && !err?.response?.data?.errors)) {
      // Token de restablecimiento vencido o inválido
      error.value = mensajeError(err)
      sessionStorage.removeItem('pm_reset')
    } else {
      errores.value = err?.response?.data?.errors || {}
      error.value = mensajeError(err)
    }
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <div class="formulario">
    <h2>Crea tu nueva contraseña</h2>

    <div v-if="error" class="alerta-error" role="alert"><strong>Error:</strong> {{ error }}</div>

    <form v-if="reset" @submit.prevent="actualizar">
      <div class="grupo-entrada">
        <label for="password">Nueva contraseña</label>
        <PasswordInput
          id="password"
          v-model="password"
          placeholder="Mínimo 8 caracteres"
          minlength="8"
          required
          autofocus
          autocomplete="new-password"
          :invalido="!!errorCampo('password')"
        />
        <PasswordRequisitos v-model:valido="passwordValida" :password="password" />
        <small v-if="errorCampo('password')" class="msg-error">{{ errorCampo('password') }}</small>
      </div>

      <div class="grupo-entrada">
        <label for="password_confirmation">Confirmar contraseña</label>
        <PasswordInput
          id="password_confirmation"
          v-model="passwordConfirmation"
          placeholder="Repite tu contraseña"
          required
          autocomplete="new-password"
          :invalido="mostrarNoCoinciden"
          :valido="passwordConfirmation !== '' && coinciden"
        />
        <small v-if="mostrarNoCoinciden" class="msg-error">Las contraseñas no coinciden.</small>
      </div>

      <button type="submit" class="boton-natural" :disabled="!puedeEnviar">
        {{ enviando ? 'Guardando...' : 'Actualizar Contraseña' }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.msg-error {
  display: block;
  margin-top: 5px;
  color: #c62828;
  font-size: 0.8rem;
}
.boton-natural:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
