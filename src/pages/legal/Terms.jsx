import LegalLayout, { Contact } from './LegalLayout.jsx'

function Terms() {
  return (
    <LegalLayout eyebrow="Condiciones" title="Términos de uso" updated="19 de noviembre de 2026">
      <h2>1. Sobre el servicio</h2>
      <p>
        Milenew es un proyecto académico que emula el sistema TransMilenio. La ubicación de los buses es simulada y los
        pagos con la tarjeta TuLlave virtual no mueven dinero real.
      </p>
      <h2>2. Tu cuenta</h2>
      <p>
        Eres responsable de mantener tu contraseña en secreto. Si crees que alguien entró a tu cuenta, cambia tu
        contraseña o usa «Cerrar sesión en todos los dispositivos» desde tu perfil.
      </p>
      <h2>3. Uso aceptable</h2>
      <p>
        No intentes acceder a cuentas ajenas, saturar el servicio ni enviar reportes de incidencias falsos. Podemos
        desactivar cuentas que incumplan estas condiciones.
      </p>
      <h2>4. Datos personales</h2>
      <p>El tratamiento de tus datos se rige por nuestra política de tratamiento de datos personales.</p>
      <h2>5. Contacto</h2>
      <p>
        Escríbenos a <Contact />.
      </p>
    </LegalLayout>
  )
}

export default Terms
