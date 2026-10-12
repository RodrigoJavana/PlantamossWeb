<script setup>
import { ref } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import api, { mensajeError } from '@/services/api'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const email = ref(typeof route.query.email === 'string' ? route.query.email : '')
const error = ref('')
const enviando = ref(false)

async function enviarCodigo() {
  error.value = ''
  enviando.value = true
  const correo = email.value.trim().toLowerCase()
  try {
    const { data } = await api.post('/auth/recuperar', { email: correo })
    toast.success(data?.message || 'Te enviamos un código de 6 dígitos a tu correo.')
    router.push({ path: '/verificar-codigo', query: { email: correo } })
  } catch (err) {
    error.value = mensajeError(err)
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <div class="formulario">
    <h2>Recupera tu contraseña</h2>

    <div v-if="error" class="alerta-error" role="alert"><strong>Error:</strong> {{ error }}</div>

    <form @submit.prevent="enviarCodigo">
      <div class="grupo-entrada">
        <label for="email">Correo electrónico</label>
        <input
          id="email"
          v-model="email"
          type="email"
          placeholder="ejemplo@correo.com"
          required
          autofocus
          autocomplete="username"
        />
      </div>

      <button type="submit" class="boton-natural" :disabled="enviando">
        {{ enviando ? 'Enviando...' : 'Enviar Código' }}
      </button>
    </form>

    <p class="font-9rem pie">
      <RouterLink to="/login" class="color-verde fw-bold text-decoration-none">Volver al inicio de sesión</RouterLink>
    </p>
  </div>
</template>

<style scoped>
.pie {
  margin-top: 25px;
}
.boton-natural:disabled {
  opacity: 0.6;
  cursor: wait;
}
</style>
