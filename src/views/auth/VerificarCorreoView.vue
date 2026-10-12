<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import api, { mensajeError } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import CodigoInput from './components/CodigoInput.vue'
import { useCooldown } from './components/useCooldown'

const router = useRouter()
const auth = useAuthStore()
const toast = useToast()

const codigo = ref('')
const error = ref('')
const reenviado = ref('')
const verificando = ref(false)
const reenviando = ref(false)
const codigoInput = ref(null)
const { restante, activo: enEspera, iniciar } = useCooldown(60)

const codigoCompleto = computed(() => /^\d{6}$/.test(codigo.value))

onMounted(() => {
  if (auth.emailVerificado) {
    router.replace('/')
    return
  }
  // Al registrarse ya se envió un código; evitamos reenvíos inmediatos
  iniciar()
})

async function verificar() {
  if (!codigoCompleto.value || verificando.value) return
  error.value = ''
  verificando.value = true
  try {
    const { data } = await api.post('/auth/verificar-correo', { codigo: codigo.value })
    if (data?.user) auth.setUser(data.user)
    toast.success(data?.message || '¡Correo verificado! Bienvenido a Planta-Moss.')
    router.replace('/')
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
  reenviado.value = ''
  reenviando.value = true
  try {
    const { data } = await api.post('/auth/verificar-correo/reenviar')
    reenviado.value =
      data?.message ||
      'Se ha enviado un nuevo código de verificación a la dirección de correo electrónico que proporcionaste durante el registro.'
    codigoInput.value?.limpiar()
    iniciar()
  } catch (err) {
    error.value = mensajeError(err)
  } finally {
    reenviando.value = false
  }
}

const cerrando = ref(false)
async function cerrarSesion() {
  cerrando.value = true
  try {
    await auth.logout()
  } finally {
    cerrando.value = false
    router.replace('/login')
  }
}
</script>

<template>
  <div class="formulario">
    <h2>Verifica tu correo</h2>
    <p v-if="auth.user?.email" class="dato-correo">Código enviado a <strong>{{ auth.user.email }}</strong></p>

    <div v-if="reenviado" class="alerta-correcto" role="status">{{ reenviado }}</div>
    <div v-if="error" class="alerta-error" role="alert"><strong>Error:</strong> {{ error }}</div>

    <form @submit.prevent="verificar">
      <div class="grupo-entrada">
        <label>Código de verificación</label>
        <CodigoInput ref="codigoInput" v-model="codigo" :disabled="verificando" @completo="verificar" />
      </div>
      <button type="submit" class="boton-natural" :disabled="!codigoCompleto || verificando">
        {{ verificando ? 'Verificando...' : 'Verificar correo' }}
      </button>
    </form>

    <div class="acciones">
      <button type="button" class="boton-secundario" :disabled="enEspera || reenviando" @click="reenviar">
        <template v-if="reenviando">Enviando...</template>
        <template v-else-if="enEspera">Reenviar correo ({{ restante }} s)</template>
        <template v-else>Reenviar correo</template>
      </button>
      <button type="button" class="boton-salir" :disabled="cerrando" @click="cerrarSesion">
        {{ cerrando ? 'Cerrando...' : 'Cerrar sesión' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.acciones {
  margin-top: 20px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
}
.boton-secundario,
.boton-salir {
  flex: 1 1 140px;
  padding: 10px 16px;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.2s, color 0.2s;
}
.boton-secundario {
  background: #fff;
  color: #1d2b22;
  border: 1px solid #e5e9e6;
}
.boton-secundario:hover:not(:disabled) {
  background: #f2f4f3;
}
.boton-salir {
  background: white;
  color: #c62828;
  border: 1px solid #f5d0cd;
}
.boton-salir:hover:not(:disabled) {
  background: #fdf0f0;
}
.boton-secundario:disabled,
.boton-salir:disabled,
.boton-natural:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
</style>
