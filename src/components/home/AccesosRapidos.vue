<script setup>
import Icono from '@/components/Icono.vue'

defineProps({
  accesos: { type: Array, required: true } // [{ nombre, icono, to }]
})
</script>

<template>
  <section class="tarjeta-inicio accesos">
    <h2 class="titulo-tarjeta"><Icono nombre="marcador" :tamano="18" /> Accesos rápidos</h2>
    <div class="accesos-grid">
      <RouterLink v-for="a in accesos" :key="a.to" :to="a.to" class="acceso">
        <span class="acceso-icono"><Icono :nombre="a.icono" :tamano="22" /></span>
        <span class="acceso-nombre">{{ a.nombre }}</span>
      </RouterLink>
    </div>
  </section>
</template>

<style scoped>
.tarjeta-inicio {
  background: #fff;
  border: 1px solid #e5e9e6;
  border-radius: 14px;
  padding: 20px;
}
.titulo-tarjeta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 16px;
  font-size: 1.05rem;
  font-weight: 700;
  color: #1d2b22;
}
.accesos-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}
.acceso {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 18px 10px;
  border: 1px solid #e5e9e6;
  border-radius: 12px;
  background: #fff;
  color: #1d2b22;
  text-decoration: none;
  text-align: center;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}
.acceso:hover,
.acceso:focus-visible {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(29, 43, 34, 0.08);
  border-color: #d3dad5;
}
.acceso-icono {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: #f1f4f2;
  color: #1d2b22;
  display: flex;
  align-items: center;
  justify-content: center;
}
.acceso-nombre { font-weight: 600; font-size: 0.92rem; }

@media (max-width: 640px) {
  .accesos-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .tarjeta-inicio { padding: 16px; }
}
</style>
