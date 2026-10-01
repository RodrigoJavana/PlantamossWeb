<template>
  <footer class="pm-footer">
    <div class="contenedor pm-footer-interior">
      <div class="pm-footer-marca">
        <img src="/img/logo-claro.png" alt="" width="28" height="28" />
        <span>plantamoss</span>
      </div>
      <nav class="pm-footer-enlaces" aria-label="Enlaces legales">
        <RouterLink to="/terminos">Términos</RouterLink>
        <RouterLink to="/privacidad">Privacidad</RouterLink>
        <RouterLink to="/sitemap">Mapa del sitio</RouterLink>
      </nav>
    </div>
  </footer>
</template>

<style scoped>
.pm-footer {
  margin-top: 50px;
  background: #24503a;
  color: #dcefe0;
  font-size: 0.9rem;
}
.pm-footer-interior {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px 24px;
  padding: 22px 0;
}
.pm-footer-marca {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 900;
  font-size: 1.3rem;
  letter-spacing: -1px;
  color: #fff;
}
.pm-footer-enlaces { display: flex; flex-wrap: wrap; gap: 6px 20px; }
.pm-footer-enlaces a { color: #dcefe0; text-decoration: none; }
.pm-footer-enlaces a:hover { color: #a5d6a7; text-decoration: underline; }

@media (max-width: 600px) {
  .pm-footer-interior { flex-direction: column; text-align: center; }
  .pm-footer-enlaces { justify-content: center; }
}
</style>
