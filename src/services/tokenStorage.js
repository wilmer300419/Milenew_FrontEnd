// Dónde vive el token JWT:
// - localStorage si el usuario marcó "Recordar mis datos" (sobrevive al cerrar el navegador)
// - sessionStorage si no (se borra al cerrar la pestaña/navegador)
const TOKEN_KEY = 'milenew_token'

export const getToken = () => localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY)

export const saveToken = (token, rememberMe) => {
  clearToken()
  ;(rememberMe ? localStorage : sessionStorage).setItem(TOKEN_KEY, token)
}

export const clearToken = () => {
  localStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
}
