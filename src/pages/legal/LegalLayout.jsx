import { Link } from 'react-router-dom'
import Brand from '../../components/layout/Brand.jsx'
import ThemeToggle from '../../components/layout/ThemeToggle.jsx'
import Glass from '../../components/ui/Glass.jsx'

const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL || ''

export function Contact() {
  return CONTACT_EMAIL ? (
    <a className="link" href={`mailto:${CONTACT_EMAIL}`}>
      {CONTACT_EMAIL}
    </a>
  ) : (
    <span>el correo de contacto del proyecto</span>
  )
}

/** Página de texto legal con la estética de la app. */
function LegalLayout({ eyebrow, title, updated, children }) {
  return (
    <div className="legal">
      <header className="landing-nav">
        <Brand />
        <ThemeToggle />
      </header>
      <Glass strong className="legal-doc" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <span className="eyebrow">{eyebrow}</span>
        <h1 className="title-lg" style={{ margin: '12px 0 6px' }}>
          {title}
        </h1>
        <p className="muted" style={{ marginTop: 0 }}>
          Última actualización: {updated}
        </p>
        <div className="legal-body">{children}</div>
        <p className="legal-note">
          Milenew es un proyecto académico. Este texto es una base de referencia y debe revisarlo un abogado antes de
          usar la aplicación con datos reales.
        </p>
        <p>
          <Link to="/" className="link">
            Volver al inicio
          </Link>
        </p>
      </Glass>
    </div>
  )
}

export default LegalLayout
