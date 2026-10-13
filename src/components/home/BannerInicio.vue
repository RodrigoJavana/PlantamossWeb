<script setup>
/*
 * Banner panorámico decorativo de Inicio.
 * Imagen: "Agave azul tequilana weber (33207723063).jpg" — sergio niebla (Flickr),
 * vía Wikimedia Commons, licencia CC BY-SA 2.0.
 * https://commons.wikimedia.org/wiki/File:Agave_azul_tequilana_weber_(33207723063).jpg
 * Recortada y optimizada en public/img/banner-inicio.jpg.
 */
</script>

<template>
  <div class="banner-inicio" aria-hidden="true">
    <img src="/img/banner-inicio.jpg" alt="" class="banner-img" draggable="false" />
  </div>
</template>

<style scoped>
.banner-inicio {
  position: relative;
  width: 100%;
  height: 260px;
  overflow: hidden;
  background: #cfd9c9;
}
.banner-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 55%;
  display: block;
}
@media (max-width: 768px) {
  .banner-inicio { height: 160px; }
}
</style>
