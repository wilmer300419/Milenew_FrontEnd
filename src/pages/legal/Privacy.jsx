import { Link } from 'react-router-dom'
import LegalLayout, { Contact } from './LegalLayout.jsx'

function Privacy() {
  return (
    <LegalLayout eyebrow="Ley 1581 de 2012" title="Política de tratamiento de datos personales" updated="19 de noviembre de 2026">
      <h2>1. Responsable</h2>
      <p>
        El equipo del proyecto académico Milenew es responsable del tratamiento de los datos que recoge esta aplicación.
        Puedes contactarnos en <Contact />.
      </p>

      <h2>2. Qué datos recogemos</h2>
      <ul>
        <li>Nombre y correo electrónico, para crear tu cuenta e identificarte.</li>
        <li>Contraseña, guardada únicamente como un resumen cifrado (hash); nadie puede leerla.</li>
        <li>Viajes, recargas y saldo de tu tarjeta TuLlave virtual (los pagos son simulados).</li>
        <li>Estaciones favoritas, preferencias y los reportes de incidencias que envíes.</li>
      </ul>
      <p>No recogemos tu ubicación ni datos sensibles.</p>

      <h2>3. Para qué los usamos</h2>
      <ul>
        <li>Darte acceso a tu cuenta y mantener tu sesión de forma segura.</li>
        <li>Mostrarte llegadas, viajes, saldo e historial.</li>
        <li>Enviarte códigos de verificación y avisos del servicio que tú elijas recibir.</li>
        <li>Atender las incidencias que reportes desde la central de operaciones.</li>
      </ul>
      <p>No vendemos ni compartimos tus datos con terceros con fines comerciales.</p>

      <h2>4. Tus derechos</h2>
      <p>Como titular de los datos puedes, en cualquier momento:</p>
      <ul>
        <li>
          <b>Conocer, actualizar y rectificar</b> tus datos desde <Link to="/app/perfil" className="link">Mi perfil</Link>.
        </li>
        <li>
          <b>Suprimir</b> tu cuenta y todos tus datos con el botón «Eliminar mi cuenta» en tu perfil.
        </li>
        <li>
          <b>Revocar</b> esta autorización (eliminando tu cuenta) y presentar quejas ante la Superintendencia de Industria
          y Comercio.
        </li>
      </ul>

      <h2>5. Seguridad</h2>
      <p>
        Usamos conexiones cifradas, contraseñas con hash, sesiones en cookies protegidas, verificación anti-bots y límites
        de intentos. La aplicación nunca accede a la base de datos desde tu navegador: todo pasa por el servidor.
      </p>

      <h2>6. Cookies</h2>
      <p>
        Solo usamos una cookie técnica para mantener tu sesión, y Google reCAPTCHA para proteger el inicio de sesión
        (sujeto a la{' '}
        <a className="link" href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">
          política de privacidad de Google
        </a>
        ).
      </p>
    </LegalLayout>
  )
}

export default Privacy
