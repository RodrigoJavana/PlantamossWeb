<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { mensajeError } from '@/services/api'
import { useToast } from '@/composables/useToast'
import PasswordRequisitos from '@/components/PasswordRequisitos.vue'
import PasswordInput from './components/PasswordInput.vue'

const router = useRouter()
const auth = useAuthStore()
const toast = useToast()

const form = reactive({
  name: '',
  email: '',
  password: '',
  passwordConfirmation: '',
  terminos: false,
  privacidad: false,
})
const passwordValida = ref(false)
const errores = ref({})
const error = ref('')
const enviando = ref(false)

const coinciden = computed(() => form.password !== '' && form.password === form.passwordConfirmation)
const mostrarNoCoinciden = computed(() => form.passwordConfirmation !== '' && !coinciden.value)
const emailValido = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))

const formularioValido = computed(
  () =>
    form.name.trim() !== '' &&
    emailValido.value &&
    passwordValida.value &&
    coinciden.value &&
    form.terminos &&
    form.privacidad
)

function errorCampo(campo) {
  const e = errores.value[campo]
  return Array.isArray(e) ? e[0] : e || ''
}

async function registrar() {
  if (!formularioValido.value || enviando.value) return
  error.value = ''
  errores.value = {}
  enviando.value = true
  try {
    await auth.register({
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      passwordConfirmation: form.passwordConfirmation,
      terminos: form.terminos,
      privacidad: form.privacidad,
    })
    toast.success('¡Cuenta creada! Te enviamos un código de verificación a tu correo.')
    router.replace('/verificar-correo')
  } catch (err) {
    errores.value = err?.response?.data?.errors || {}
    error.value = mensajeError(err)
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <div class="formulario">
    <h2>Únete a la comunidad</h2>

    <div v-if="error" class="alerta-error" role="alert"><strong>Aviso:</strong> {{ error }}</div>

    <form novalidate @submit.prevent="registrar">
      <div class="grupo-entrada">
        <label for="name">Nombre Completo</label>
        <input
          id="name"
          v-model="form.name"
          type="text"
          placeholder="Tu nombre"
          required
          maxlength="255"
          autofocus
          autocomplete="name"
          :class="{ 'borde-error': errorCampo('name') }"
        />
        <small v-if="errorCampo('name')" class="msg-error">{{ errorCampo('name') }}</small>
      </div>

      <div class="grupo-entrada">
        <label for="email">Correo Electrónico</label>
        <input
          id="email"
          v-model="form.email"
          type="email"
          placeholder="ejemplo@correo.com"
          required
          maxlength="255"
          autocomplete="username"
          :class="{ 'borde-error': errorCampo('email') }"
        />
        <small v-if="errorCampo('email')" class="msg-error">{{ errorCampo('email') }}</small>
      </div>

      <div class="grupo-entrada">
        <label for="password">Contraseña</label>
        <PasswordInput
          id="password"
          v-model="form.password"
          placeholder="Mínimo 8 caracteres"
          minlength="8"
          required
          autocomplete="new-password"
          :invalido="!!errorCampo('password')"
        />
        <PasswordRequisitos v-model:valido="passwordValida" :password="form.password" />
        <small v-if="errorCampo('password')" class="msg-error">{{ errorCampo('password') }}</small>
      </div>

      <div class="grupo-entrada">
        <label for="password_confirmation">Confirmar Contraseña</label>
        <PasswordInput
          id="password_confirmation"
          v-model="form.passwordConfirmation"
          placeholder="Repite tu contraseña"
          required
          autocomplete="new-password"
          :invalido="mostrarNoCoinciden"
          :valido="form.passwordConfirmation !== '' && coinciden"
        />
        <small v-if="mostrarNoCoinciden" class="msg-error">Las contraseñas no coinciden.</small>
        <small v-else-if="errorCampo('passwordConfirmation')" class="msg-error">
          {{ errorCampo('passwordConfirmation') }}
        </small>
      </div>

      <div class="casilla">
        <label for="terminos">
          <input id="terminos" v-model="form.terminos" type="checkbox" required />
          <span>
            Acepto los
            <RouterLink to="/terminos" target="_blank" rel="noopener">términos y condiciones</RouterLink>
          </span>
        </label>
        <small v-if="errorCampo('terminos')" class="msg-error">{{ errorCampo('terminos') }}</small>
      </div>

      <div class="casilla">
        <label for="privacidad">
          <input id="privacidad" v-model="form.privacidad" type="checkbox" required />
          <span>
            Acepto el
            <RouterLink to="/privacidad" target="_blank" rel="noopener">aviso de privacidad</RouterLink>
          </span>
        </label>
        <small v-if="errorCampo('privacidad')" class="msg-error">{{ errorCampo('privacidad') }}</small>
      </div>

      <button type="submit" class="boton-natural" :disabled="!formularioValido || enviando">
        {{ enviando ? 'Registrando...' : 'Registrarse' }}
      </button>
    </form>

    <p class="font-9rem pie">
      ¿Ya tienes cuenta?
      <RouterLink to="/login" class="color-verde fw-bold text-decoration-none">Inicia sesión aquí</RouterLink>
    </p>
  </div>
</template>

<style scoped>
.msg-error {
  display: block;
  margin-top: 5px;
  color: #c62828;
  font-size: 0.8rem;
  text-align: left;
}
.borde-error {
  border-color: #c62828 !important;
}
.casilla {
  margin-bottom: 15px;
  text-align: left;
}
.casilla label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 0.9rem;
}
.casilla input {
  width: 18px;
  height: 18px;
  accent-color: #2e7d32;
  flex-shrink: 0;
}
.casilla a {
  color: #4caf50;
  text-decoration: underline;
}
.casilla + .casilla {
  margin-bottom: 20px;
}
.boton-natural:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.pie {
  margin-top: 25px;
}
</style>
