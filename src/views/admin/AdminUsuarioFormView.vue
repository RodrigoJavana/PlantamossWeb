<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import api, { mensajeError } from '@/services/api'
import { useToast } from '@/composables/useToast'
import PasswordInput from '@/views/auth/components/PasswordInput.vue'
import PanelPageHeader from '@/components/panel/PanelPageHeader.vue'
import PanelSelect from '@/components/panel/PanelSelect.vue'

const OPC_ROLES = [
  { value: 'user', label: 'Usuario' },
  { value: 'editor', label: 'Editor (Plantas)' },
  { value: 'noticias', label: 'Editor (Noticias)' },
  { value: 'admin', label: 'Administrador' },
]
const OPC_ESTADOS = [
  { value: 'activo', label: 'Activo' },
  { value: 'suspendido', label: 'Suspendido' },
]

// La ruta usa props: true; tomamos el id de route.params y no reenviamos atributos
defineOptions({ inheritAttrs: false })

const route = useRoute()
const router = useRouter()
const toast = useToast()

const id = computed(() => route.params.id || null)
const esEdicion = computed(() => !!id.value)

const form = reactive({ name: '', email: '', role: 'user', estado: 'activo', password: '' })
const cargando = ref(false)
const guardando = ref(false)
const error = ref('')
const errores = ref({})

function reiniciar() {
  Object.assign(form, { name: '', email: '', role: 'user', estado: 'activo', password: '' })
  error.value = ''
  errores.value = {}
}

async function cargarUsuario() {
  reiniciar()
  if (!esEdicion.value) return
  cargando.value = true
  try {
    const { data } = await api.get(`/admin/usuarios/${id.value}`)
    Object.assign(form, {
      name: data.name || '',
      email: data.email || '',
      role: data.role || 'user',
      estado: data.estado || 'activo',
      password: '',
    })
  } catch (err) {
    toast.error(mensajeError(err))
    router.replace('/panel/usuarios')
  } finally {
    cargando.value = false
  }
}

watch(id, cargarUsuario, { immediate: true })

function errorCampo(campo) {
  const e = errores.value[campo]
  return Array.isArray(e) ? e[0] : e || ''
}

async function guardar() {
  if (guardando.value) return
  error.value = ''
  errores.value = {}
  guardando.value = true
  try {
    if (esEdicion.value) {
      const payload = { name: form.name.trim(), role: form.role, estado: form.estado }
      if (form.password) payload.password = form.password
      await api.put(`/admin/usuarios/${id.value}`, payload)
      toast.success('Usuario actualizado.')
    } else {
      await api.post('/admin/usuarios', {
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role,
        estado: form.estado,
        password: form.password,
      })
      toast.success('Usuario registrado.')
    }
    router.push('/panel/usuarios')
  } catch (err) {
    errores.value = err?.response?.data?.errors || {}
    error.value = Object.keys(errores.value).length
      ? err.response.data.message || 'Revisa los datos del formulario.'
      : mensajeError(err)
  } finally {
    guardando.value = false
  }
}
</script>

<template>
  <div>
    <PanelPageHeader :title="esEdicion ? 'Editar usuario' : 'Nuevo usuario'" />
    <div class="panel">
      <p v-if="cargando" class="color-gris text-center">Cargando usuario...</p>

      <template v-else>
        <div v-if="error" class="alerta-error" role="alert"><strong>Aviso:</strong> {{ error }}</div>

        <form @submit.prevent="guardar">
          <div v-if="esEdicion" class="grupo-entrada">
            <label for="email-bloqueado">Correo (no modificable)</label>
            <input id="email-bloqueado" type="email" :value="form.email" readonly class="campo-bloqueado" />
          </div>

          <div class="grupo-entrada">
            <label for="name">Nombre completo</label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              required
              maxlength="255"
              :class="{ 'borde-error': errorCampo('name') }"
            />
            <small v-if="errorCampo('name')" class="msg-error">{{ errorCampo('name') }}</small>
          </div>

          <div v-if="!esEdicion" class="grupo-entrada">
            <label for="email">Correo</label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              required
              maxlength="255"
              autocomplete="off"
              :class="{ 'borde-error': errorCampo('email') }"
            />
            <small v-if="errorCampo('email')" class="msg-error">{{ errorCampo('email') }}</small>
          </div>

          <div class="rejilla">
            <div class="grupo-entrada">
              <label for="role">Rol</label>
              <PanelSelect id="role" v-model="form.role" class="en-form" :options="OPC_ROLES" :invalid="!!errorCampo('role')" />
              <small v-if="errorCampo('role')" class="msg-error">{{ errorCampo('role') }}</small>
            </div>

            <div class="grupo-entrada">
              <label for="estado">Estado</label>
              <PanelSelect id="estado" v-model="form.estado" class="en-form" :options="OPC_ESTADOS" :invalid="!!errorCampo('estado')" />
              <small v-if="errorCampo('estado')" class="msg-error">{{ errorCampo('estado') }}</small>
            </div>
          </div>

          <div class="grupo-entrada">
            <label for="password">{{ esEdicion ? 'Nueva contraseña' : 'Contraseña' }}</label>
            <PasswordInput
              id="password"
              v-model="form.password"
              minlength="8"
              :required="!esEdicion"
              :placeholder="esEdicion ? 'Vacío = sin cambios' : 'Mínimo 8 caracteres'"
              autocomplete="new-password"
              :invalido="!!errorCampo('password')"
            />
            <small v-if="errorCampo('password')" class="msg-error">{{ errorCampo('password') }}</small>
          </div>

          <div class="botones">
            <RouterLink to="/panel/usuarios" class="boton-cancelar">Cancelar</RouterLink>
            <button type="submit" class="boton-guardar" :disabled="guardando">
              <template v-if="guardando">Guardando...</template>
              <template v-else>{{ esEdicion ? 'Guardar cambios' : 'Registrar' }}</template>
            </button>
          </div>
        </form>
      </template>
    </div>
  </div>
</template>

<style scoped>
.panel {
  background: #fff;
  max-width: 640px;
  border: 1px solid #e5e9e6;
  border-radius: 16px;
  padding: 24px;
  box-sizing: border-box;
}
.rejilla {
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: 16px;
}
.msg-error {
  display: block;
  margin-top: 5px;
  color: #c62828;
  font-size: 0.8rem;
}
.borde-error {
  border-color: #c62828 !important;
}
.botones {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  flex-wrap: wrap;
  margin-top: 22px;
  padding-top: 16px;
  border-top: 1px solid #eef1ef;
}
.boton-guardar,
.boton-cancelar {
  padding: 10px 20px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 0.88rem;
  font-family: inherit;
  text-decoration: none;
  text-align: center;
  border: 1px solid transparent;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
}
.boton-guardar {
  background: #2b5e3f;
  border-color: #2b5e3f;
  color: white;
}
.boton-guardar:hover:not(:disabled) {
  background: #234d34;
}
.boton-guardar:disabled {
  opacity: 0.6;
  cursor: wait;
}
.boton-cancelar {
  background: #fff;
  border-color: #e5e9e6;
  color: #1d2b22;
}
.boton-cancelar:hover {
  background: #f2f4f3;
}
@media (max-width: 520px) {
  .panel {
    padding: 18px 14px;
  }
  .rejilla {
    grid-template-columns: 1fr;
  }
  .boton-guardar,
  .boton-cancelar {
    flex: 1 1 0;
  }
}
</style>
