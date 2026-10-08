<script setup>
import Icono from '@/components/Icono.vue'
import { useRouter } from 'vue-router'

const router = useRouter()
function volver() {
  if (window.history.length > 1) router.back()
  else router.push('/')
}
</script>

<template>
  <div class="contenedor no-encontrado">
    <div class="no-encontrado-tarjeta">
      <div class="no-encontrado-icono" aria-hidden="true"><Icono nombre="sinResultados" class="icono-em" /></div>
      <p class="no-encontrado-codigo">404</p>
      <h1>Página no encontrada</h1>
      <div class="no-encontrado-botones">
        <RouterLink to="/" class="boton-natural boton-inicio"><Icono nombre="inicio" :tamano="16" /> Ir al inicio</RouterLink>
        <button type="button" class="boton-secundario" @click="volver">Regresar</button>
      </div>
      <p class="no-encontrado-links">
        <RouterLink to="/catalogo">Catálogo</RouterLink>
        <RouterLink to="/mapa">Mapa</RouterLink>
        <RouterLink to="/sitemap">Mapa del sitio</RouterLink>
      </p>
    </div>
  </div>
</template>

<style scoped>
.no-encontrado { display: flex; justify-content: center; padding: 60px 16px 0; }
.no-encontrado-tarjeta {
  background: #fff;
  border: 1px solid #e5e9e6;
  border-radius: 20px;
  padding: 36px 28px 28px;
  max-width: 460px;
  width: 100%;
  text-align: center;
}
.no-encontrado-icono {
  width: 60px;
  height: 60px;
  margin: 0 auto;
  border-radius: 16px;
  background: #f2f4f3;
  border: 1px solid #e5e9e6;
  color: #66736a;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
}
.no-encontrado-codigo { font-size: 0.8rem; font-weight: 800; color: #66736a; margin: 14px 0 0; letter-spacing: 0.12em; }
.no-encontrado-tarjeta h1 { color: #1d2b22; margin: 4px 0 22px; font-size: 1.4rem; font-weight: 800; }
.no-encontrado-botones { display: flex; gap: 10px; justify-content: center; }
.no-encontrado-botones > * { flex: 1 1 0; display: inline-flex; align-items: center; justify-content: center; gap: 6px; }
.boton-inicio { width: auto; margin-top: 0; padding: 10px 18px; }
.no-encontrado-links { display: flex; justify-content: center; gap: 16px; flex-wrap: wrap; margin: 20px 0 0; font-size: 0.86rem; }
.no-encontrado-links a { color: #66736a; font-weight: 600; text-decoration: none; }
.no-encontrado-links a:hover { color: #1d2b22; text-decoration: underline; }
</style>
