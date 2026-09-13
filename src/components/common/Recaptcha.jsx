import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'

const RECAPTCHA_SCRIPT_SRC = 'https://www.google.com/recaptcha/api.js'
const RECAPTCHA_SCRIPT_ID = 'google-recaptcha-script'

let scriptLoadingPromise = null

// Carga el script de Google reCAPTCHA una sola vez, sin importar cuántos
// componentes <Recaptcha /> se monten en la aplicación.
function loadRecaptchaScript() {
  if (typeof window !== 'undefined' && window.grecaptcha && window.grecaptcha.render) {
    return Promise.resolve()
  }

  if (scriptLoadingPromise) {
    return scriptLoadingPromise
  }

  scriptLoadingPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(RECAPTCHA_SCRIPT_ID)

    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('recaptcha-script-error')))
      return
    }

    const script = document.createElement('script')
    script.id = RECAPTCHA_SCRIPT_ID
    script.src = RECAPTCHA_SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('recaptcha-script-error'))
    document.head.appendChild(script)
  })

  return scriptLoadingPromise
}

// Widget de Google reCAPTCHA v2 ("No soy un robot").
// - onVerify(token): se llama cuando el usuario completa el checkbox.
// - onExpire(): se llama cuando el token expira o el widget falla.
// - ref.reset(): reinicia el widget (un token de reCAPTCHA es de un solo uso).
const Recaptcha = forwardRef(function Recaptcha({ onVerify, onExpire }, ref) {
  const containerRef = useRef(null)
  const widgetIdRef = useRef(null)

  useEffect(() => {
    let mounted = true
    const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY

    if (!siteKey) {
      // eslint-disable-next-line no-console
      console.error('VITE_RECAPTCHA_SITE_KEY no está configurada. Revisa tu archivo .env.')
      return undefined
    }

    loadRecaptchaScript()
      .then(() => {
        if (!mounted || !containerRef.current || widgetIdRef.current !== null) return

        widgetIdRef.current = window.grecaptcha.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token) => onVerify?.(token),
          'expired-callback': () => onExpire?.(),
          'error-callback': () => onExpire?.(),
        })
      })
      .catch(() => {
        if (mounted) onExpire?.()
      })

    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useImperativeHandle(ref, () => ({
    reset() {
      if (widgetIdRef.current !== null && window.grecaptcha) {
        window.grecaptcha.reset(widgetIdRef.current)
      }
    },
  }))

  return <div ref={containerRef} className="recaptcha-container" />
})

export default Recaptcha
