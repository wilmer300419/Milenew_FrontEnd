import { useId, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Eye, EyeOff } from 'lucide-react'

/** Campo con etiqueta flotante, ícono, error animado y "ver contraseña". */
function Field({ label, icon: Icon, error, type = 'text', className = '', ...rest }) {
  const id = useId()
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'
  const classes = ['field', Icon && 'has-icon', error && 'invalid', className].filter(Boolean).join(' ')

  return (
    <div className={classes}>
      {Icon && <Icon className="field-icon" size={18} strokeWidth={1.8} />}
      <input id={id} type={isPassword && show ? 'text' : type} placeholder=" " aria-invalid={Boolean(error)} {...rest} />
      <label htmlFor={id}>{label}</label>
      {isPassword && (
        <button
          type="button"
          className="field-action"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      )}
      <AnimatePresence initial={false}>
        {error && (
          <motion.span
            className="field-error"
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -4, height: 0 }}
          >
            {error}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Field
