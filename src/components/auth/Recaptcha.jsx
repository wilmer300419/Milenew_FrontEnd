import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ShieldCheck } from 'lucide-react'

const RECAPTCHA_SCRIPT_SRC = 'https://www.google.com/recaptcha/api.js?render=explicit'
const RECAPTCHA_SCRIPT_ID = 'google-recaptcha-script'

let scriptLoadingPromise = null

// Carga el script de Google reCAPTCHA una sola vez para toda la app.
function loadRecaptchaScript() {
  if (window.grecaptcha?.render) return Promise.resolve()
  if (scriptLoadingPromise) return scriptLoadingPromise

  scriptLoadingPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(RECAPTCHA_SCRIPT_ID)
    const script = existing ?? document.createElement('script')
    script.addEventListener('load', () => resolve())
    script.addEventListener('error', () => {
      scriptLoadingPromise = null
      reject(new Error('recaptcha-script-error'))
    })
    if (!existing) {
      script.id = RECAPTCHA_SCRIPT_ID
      script.src = RECAPTCHA_SCRIPT_SRC
      script.async = true
      script.defer = true
      document.head.appendChild(script)
    }
  })
  return scriptLoadingPromise
}

const LABELS = {
  idle: 'No soy un robot',
  checking: 'Verificando…',
  done: 'Verificado',
  error: 'No se pudo verificar. Toca para reintentar.',
  unavailable: 'Verificación no disponible',
}

/**
 * "No soy un robot" con el estilo de Milenew.
 *
 * Usa Google reCAPTCHA v2 en modo INVISIBLE: el recuadro de Google no se muestra;
 * al tocar el control se ejecuta la verificación en segundo plano y, solo si Google
 * sospecha, abre su reto de imágenes. El BackEnd valida el token igual que antes.
 *
 * - onVerify(token) · onExpire() · ref.reset()  (misma interfaz que la versión anterior)
 * - En producción la site key debe registrarse como tipo "Invisible reCAPTCHA".
 */
const Recaptcha = forwardRef(function Recaptcha({ onVerify, onExpire, theme = 'dark' }, ref) {
  const holderRef = useRef(null)
  const widgetIdRef = useRef(null)
  const [state, setState] = useState('loading')
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY

  useEffect(() => {
    let mounted = true
    if (!siteKey) {
      // eslint-disable-next-line no-console
      console.error('VITE_RECAPTCHA_SITE_KEY no está configurada. Revisa tu archivo .env.')
      setState('unavailable')
      return undefined
    }

    loadRecaptchaScript()
      .then(
        () =>
          new Promise((resolve) => {
            window.grecaptcha.ready(resolve)
          }),
      )
      .then(() => {
        if (!mounted || !holderRef.current || widgetIdRef.current !== null) return
        widgetIdRef.current = window.grecaptcha.render(holderRef.current, {
          sitekey: siteKey,
          size: 'invisible',
          badge: 'inline',
          theme,
          callback: (token) => {
            setState('done')
            onVerify?.(token)
          },
          'expired-callback': () => {
            setState('idle')
            onExpire?.()
          },
          'error-callback': () => {
            setState('error')
            onExpire?.()
          },
        })
        setState('idle')
      })
      .catch(() => {
        if (!mounted) return
        setState('unavailable')
        onExpire?.()
      })

    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useImperativeHandle(ref, () => ({
    reset() {
      if (widgetIdRef.current !== null && window.grecaptcha) window.grecaptcha.reset(widgetIdRef.current)
      setState((s) => (s === 'unavailable' || s === 'loading' ? s : 'idle'))
    },
  }))

  const verify = () => {
    if (widgetIdRef.current === null || state === 'done') return
    setState('checking')
    // Si el usuario cierra el reto de Google sin resolverlo, puede volver a tocar el control
    window.grecaptcha.reset(widgetIdRef.current)
    window.grecaptcha.execute(widgetIdRef.current)
  }

  const disabled = state === 'loading' || state === 'unavailable' || state === 'done'

  return (
    <div className="human">
      <button
        type="button"
        role="checkbox"
        aria-checked={state === 'done'}
        aria-busy={state === 'checking'}
        className={`human-check ${state}`}
        onClick={verify}
        disabled={disabled}
      >
        <span className="human-box" aria-hidden="true">
          <AnimatePresence mode="wait" initial={false}>
            {state === 'checking' || state === 'loading' ? (
              <motion.span key="spin" className="spinner" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            ) : state === 'done' ? (
              <motion.span
                key="ok"
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                style={{ display: 'grid' }}
              >
                <Check size={15} strokeWidth={3} />
              </motion.span>
            ) : null}
          </AnimatePresence>
        </span>
        <span className="human-label">{state === 'loading' ? 'Preparando verificación…' : LABELS[state]}</span>
        <span className="human-brand" aria-hidden="true">
          <ShieldCheck size={15} />
          reCAPTCHA
        </span>
      </button>
      <p className="human-legal">
        Protegido por reCAPTCHA de Google ·{' '}
        <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">
          Privacidad
        </a>{' '}
        ·{' '}
        <a href="https://policies.google.com/terms" target="_blank" rel="noreferrer">
          Términos
        </a>
      </p>
      {/* contenedor del widget invisible de Google (no se muestra) */}
      <div ref={holderRef} className="human-holder" aria-hidden="true" />
    </div>
  )
})

export default Recaptcha
