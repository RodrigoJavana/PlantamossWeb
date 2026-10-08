<script setup>
import Breadcrumb from '@/components/Breadcrumb.vue'
import '@/assets/css/legal.css'
</script>

<template>
  <div class="contenedor vista-legal">
    <Breadcrumb :items="[{ label: 'Inicio', to: '/' }, { label: 'Aviso de Privacidad' }]" />
    <article class="documento-legal">
      <h1>Aviso de Privacidad</h1>
      <p class="legal-fecha">Última actualización: Viernes 05 de Junio de 2026</p>

      <p>
        El presente Aviso de Privacidad se entrega en cumplimiento de las disposiciones aplicables en materia de Protección de Datos Personales en Posesión de los Particulares y se aplica a la información recopilada a través de nuestro sitio web <strong>Planta-moss</strong>.
      </p>

      <h2>1. Responsable del Tratamiento de sus Datos Personales</h2>
      <p>
        El equipo desarrollador de Planta-moss, con domicilio para oír y recibir notificaciones en Universidad Tecnológica De Santa Catarina, Monterrey, NL, es el responsable del uso, almacenamiento y protección de los datos personales que usted nos proporcione.
      </p>

      <h2>2. Datos Personales que Recopilamos</h2>
      <p>
        Para que el usuario pueda interactuar con las funciones de nuestra página (como guardar sus plantas favoritas, personalización o participar en la comunidad), solicitamos los siguientes datos:
      </p>
      <ul>
        <li>Nombre de usuario / Alias.</li>
        <li>Correo electrónico.</li>
        <li>Contraseña (la cual es procesada mediante algoritmos de encriptación ocultos para su seguridad).</li>
      </ul>
      <p class="legal-nota legal-nota-info">
        <strong>Nota importante:</strong> Nuestro Sitio no recopila ni solicita datos personales sensibles (como origen racial, estado de salud, creencias religiosas, etc.).
      </p>

      <h2>3. Finalidades del Uso de los Datos</h2>
      <p>
        Los datos personales que recabamos de usted serán utilizados exclusivamente para las siguientes finalidades esenciales:
      </p>
      <ul>
        <li>Creación, gestión y validación de su cuenta de usuario.</li>
        <li>Permitir la recuperación y cambio de contraseña de forma segura.</li>
        <li>Personalizar la experiencia del usuario dentro del Sitio (por ejemplo, guardar guías de cuidado de plantas).</li>
      </ul>

      <h2>4. Medidas de Seguridad y Almacenamiento</h2>
      <p>
        Nos tomamos muy en serio la seguridad de su información. Por ello, implementamos las siguientes medidas técnicas y administrativas:
      </p>
      <ul>
        <li><strong>Seguridad en Credenciales:</strong> Las contraseñas de los usuarios no se almacenan en texto plano; se protegen utilizando funciones de encriptación criptográfica (Hash), lo que impide que terceros (incluso los administradores del sitio) puedan visualizar la contraseña original.</li>
        <li><strong>Control de Acceso:</strong> El acceso a la base de datos está restringido únicamente al equipo técnico autorizado.</li>
      </ul>

      <h2>5. Transferencia de Datos</h2>
      <p>
        Le informamos que Planta-moss no venderá, cederá ni transferirá sus datos personales a terceros, empresas o plataformas externas sin su consentimiento previo, salvo por requerimientos legales de las autoridades competentes.
      </p>

      <h2>6. Derechos ARCO (Acceso, Rectificación, Cancelación y Oposición)</h2>
      <p>
        Como usuario, usted tiene derecho a conocer qué datos tenemos de usted, para qué los utilizamos y las condiciones del uso que les damos (Acceso). Asimismo, es su derecho solicitar la corrección de su información (Rectificación), que la eliminemos de nuestros registros (Cancelación) u oponerse al uso de sus datos para fines específicos (Oposición).
      </p>
      <p>
        Para ejercer cualquiera de estos derechos, o para dar de baja su cuenta, puede enviar una solicitud al correo electrónico:
        <a href="mailto:Planta-moss_Corp@Gmail.com">Planta-moss_Corp@Gmail.com</a>.
      </p>

      <h2>7. Cambios al Aviso de Privacidad</h2>
      <p>
        Este aviso de privacidad puede sufrir modificaciones o actualizaciones derivadas de nuevos requerimientos legales, de nuestras propias necesidades por las funciones del sitio, o por mejoras en la seguridad. Cualquier cambio será publicado directamente en esta sección del Sitio.
      </p>
    </article>
  </div>
</template>
