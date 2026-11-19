// Aplica el tema guardado antes de pintar (evita parpadeo claro/oscuro).
// Va en un archivo aparte para cumplir la política de seguridad (CSP sin scripts en línea).
try {
  var t = localStorage.getItem('milenew_theme')
  if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t
} catch (e) {
  /* almacenamiento bloqueado: se usa el tema por defecto */
}
