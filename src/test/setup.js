import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
import api from '../services/api.js'

// Las pruebas nunca salen a la red: lo que no esté simulado falla de inmediato
api.defaults.adapter = () => Promise.reject(new Error('Sin red en pruebas'))

afterEach(() => {
  cleanup()
  localStorage.clear()
  sessionStorage.clear()
})

// APIs del navegador que jsdom no trae
window.matchMedia ??= (query) => ({
  matches: false,
  media: query,
  addEventListener() {},
  removeEventListener() {},
  addListener() {},
  removeListener() {},
})
window.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
}
Element.prototype.scrollIntoView ??= function scrollIntoView() {}
Element.prototype.scrollTo ??= function scrollTo() {}
