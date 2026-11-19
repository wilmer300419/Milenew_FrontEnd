import { Link } from 'react-router-dom'

/** Marca Milenew: bloque rojo con la "M" de dos troncales y punto amarillo. */
function Brand({ to = '/', compact = false }) {
  return (
    <Link to={to} className="brand" aria-label="Milenew, inicio">
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 32 32">
          <path d="M8 23V10l8 8 8-8v13" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="24" cy="8" r="3" fill="#f5b70a" />
        </svg>
      </span>
      {!compact && (
        <span className="brand-text">
          <b>Milenew</b>
          <small>TransMilenio · Bogotá</small>
        </span>
      )}
    </Link>
  )
}

export default Brand
