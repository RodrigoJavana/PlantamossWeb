<script setup>
import Breadcrumb from '@/components/Breadcrumb.vue'
import '@/assets/css/legal.css'
</script>

<template>
  <div class="contenedor vista-legal">
    <Breadcrumb :items="[{ label: 'Inicio', to: '/' }, { label: 'Términos y Condiciones' }]" />
    <article class="documento-legal">
      <h1>Términos y Condiciones de Uso</h1>
      <p class="legal-fecha">Última actualización: Viernes 05 de Junio del 2026</p>

      <p>
        Bienvenido a <strong>Planta-moss</strong>. Al acceder, navegar o registrarse en nuestro Sitio, usted acepta cumplir y estar sujeto a los siguientes Términos y Condiciones de Uso. Si no está de acuerdo con alguna parte de estos términos, le sugerimos no utilizar la plataforma.
      </p>

      <h2>1. Objeto de la Página</h2>
      <p>
        El Sitio es una plataforma de carácter informativo y educativo cuyo objetivo es proporcionar consejos, guías y datos básicos sobre el cuidado de plantas.
      </p>

      <h2>2. Registro de Cuenta y Seguridad</h2>
      <p>
        Para acceder a ciertas funciones (como guardar favoritos o personalizar su perfil), el usuario deberá registrarse creando una cuenta.
      </p>
      <ul>
        <li><strong>Responsabilidad:</strong> El usuario es el único responsable de mantener la confidencialidad de su contraseña y de las actividades que ocurran bajo su cuenta.</li>
        <li><strong>Seguridad:</strong> El Sitio cuenta con medidas de seguridad básicas, incluyendo el almacenamiento de contraseñas mediante encriptación hash. Sin embargo, el usuario se compromete a notificar de inmediato cualquier uso no autorizado de su cuenta.</li>
      </ul>

      <h2>3. Propiedad Intelectual</h2>
      <p>
        Todo el contenido visual, textos, logotipos, diseños y guías publicados en el Sitio son propiedad de Planta-moss o se utilizan con las licencias correspondientes. Está prohibida la copia, reproducción o distribución del material con fines comerciales sin autorización previa por escrito.
      </p>

      <h2>4. Reglas de Conducta del Usuario</h2>
      <p>Al utilizar el Sitio, el usuario se compromete a no:</p>
      <ul>
        <li>Utilizar la plataforma para fines ilegales o no autorizados.</li>
        <li>Intentar vulnerar los sistemas de seguridad del Sitio o dañar las bases de datos.</li>
        <li>Publicar contenido ofensivo, spam o comentarios que atenten contra otros usuarios.</li>
      </ul>

      <h2>5. Deslinde de Responsabilidad (Exclusión de Garantías)</h2>
      <p>
        La información provista en este Sitio es puramente informativa y se ofrece "tal cual".
      </p>
      <p class="legal-nota legal-nota-aviso">
        <strong>Nota de Responsabilidad:</strong> El equipo de Planta-moss no se hace responsable por el marchitamiento, muerte o daño de las plantas de los usuarios, ni por alergias causadas por el manejo de las mismas. El cuidado de las plantas es responsabilidad exclusiva del usuario, ya que factores externos como el clima, tipo de tierra y riego varían en cada caso.
      </p>

      <h2>6. Modificaciones de los Términos</h2>
      <p>
        Nos reservamos el derecho de modificar estos Términos y Condiciones en cualquier momento para adaptarlos a nuevas funciones del Sitio o cambios legales. El uso continuo de la página después de dichos cambios significará la aceptación de los nuevos términos.
      </p>

      <h2>7. Contacto</h2>
      <p>
        Para cualquier duda o aclaración sobre estas reglas de uso, puede contactarnos en:
        <a href="mailto:Planta-moss_Corp@Gmail.com">Planta-moss_Corp@Gmail.com</a>.
      </p>
    </article>
  </div>
</template>
