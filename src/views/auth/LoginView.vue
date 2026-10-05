<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { mensajeError } from '@/services/api'
import PasswordInput from './components/PasswordInput.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const email = ref('')
const password = ref('')
const error = ref('')
const enviando = ref(false)

const status = computed(() => (typeof route.query.status === 'string' ? route.query.status : ''))

// Solo se permiten rutas internas para evitar redirecciones abiertas
function destinoSeguro() {
  const r = route.query.redirect
  if (typeof r === 'string' && r.startsWith('/') && !r.startsWith('//')) return r
  return '/'
}

async function ingresar() {
  error.value = ''
  enviando.value = true
  try {
    await auth.login(email.value.trim(), password.value)
    router.replace(destinoSeguro())
  } catch (err) {
    error.value = mensajeError(err)
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <div class="formulario">
    <h2>Bienvenido de nuevo</h2>

    <div v-if="error" class="alerta-error" role="alert"><strong>Error:</strong> {{ error }}</div>
    <div v-if="status && !error" class="alerta-correcto" role="status">{{ status }}</div>

    <form @submit.prevent="ingresar">
      <div class="grupo-entrada">
        <label for="email">Correo electrónico</label>
        <input
          id="email"
          v-model="email"
          type="email"
          placeholder="Correo electrónico*"
          required
          autofocus
          autocomplete="username"
        />
      </div>

      <div class="grupo-entrada">
        <label for="password">Contraseña</label>
        <PasswordInput
          id="password"
          v-model="password"
          placeholder="Contraseña*"
          required
          autocomplete="current-password"
        />
      </div>

      <div class="enlace-olvido">
        <RouterLink to="/recuperar-contrasena" class="font-9rem color-verde text-decoration-none">
          ¿Olvidaste tu contraseña?
        </RouterLink>
      </div>

      <button type="submit" class="boton-natural" :disabled="enviando">
        {{ enviando ? 'Ingresando...' : 'Ingresar' }}
      </button>
    </form>

    <p class="font-9rem pie">
      ¿Sin cuenta?
      <RouterLink to="/register" class="color-verde-claro fw-bold text-decoration-none">Registrarse</RouterLink>
    </p>
  </div>
</template>

<style scoped>
.enlace-olvido {
  text-align: right;
}
.pie {
  margin-top: 25px;
}
.boton-natural:disabled {
  opacity: 0.6;
  cursor: wait;
}
</style>
