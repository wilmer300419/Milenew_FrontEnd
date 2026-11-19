import { useEffect, useRef } from 'react'
import { useTheme } from '../../context/ThemeContext.jsx'
import skylineUrl from '../../assets/bogota-skyline.webp'

/*
 * Fondo: una lámina de vidrio negro esmerilado con Bogotá detrás.
 *
 * - La ciudad NO se ve por defecto: solo aparece donde el vidrio se ilumina,
 *   alrededor del cursor (o del dedo en celular).
 * - Un clic/toque en el fondo produce un destello que la revela un instante.
 * - El grano del vidrio se dibuja una sola vez; el bucle de animación se detiene
 *   cuando no hay luz que mover (cero consumo en reposo).
 */

const INTERACTIVE = 'a,button,input,select,textarea,label,[data-glass],[role="dialog"],[data-no-sand]'
const LENS_R = 230
const PARALLAX = 14

const THEMES = {
  dark: { ink: [236, 232, 224], grain: [255, 255, 255], grainAlpha: 0.05, density: 0.22 },
  light: { ink: [18, 18, 19], grain: [0, 0, 0], grainAlpha: 0.05, density: 0.2 },
}

/** Trazos de la imagen (fondo negro) → trazos del color del tema con alfa por brillo. */
function tintSkyline(img, ink) {
  const c = document.createElement('canvas')
  c.width = img.naturalWidth
  c.height = img.naturalHeight
  const x = c.getContext('2d')
  x.drawImage(img, 0, 0)
  const d = x.getImageData(0, 0, c.width, c.height)
  const p = d.data
  for (let i = 0; i < p.length; i += 4) {
    const lum = (p[i] * 0.3 + p[i + 1] * 0.59 + p[i + 2] * 0.11) / 255
    p[i] = ink[0]
    p[i + 1] = ink[1]
    p[i + 2] = ink[2]
    p[i + 3] = Math.round(Math.min(1, Math.max(0, (lum - 0.06) * 1.3)) * 255)
  }
  x.putImageData(d, 0, 0)
  return c
}

/** Grano fino del vidrio esmerilado (estático). */
function drawGrain(canvas, W, H, dpr, t) {
  const w = Math.round(W * dpr)
  const h = Math.round(H * dpr)
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  const img = ctx.createImageData(w, h)
  const p = img.data
  const [r, g, b] = t.grain
  for (let i = 0; i < p.length; i += 4) {
    if (Math.random() > t.density) continue
    p[i] = r
    p[i + 1] = g
    p[i + 2] = b
    p[i + 3] = Math.round(Math.random() * t.grainAlpha * 255)
  }
  ctx.putImageData(img, 0, 0)
}

function GlassBackground() {
  const { theme } = useTheme()
  const cityRef = useRef(null)
  const grainRef = useRef(null)

  useEffect(() => {
    const t = THEMES[theme] ?? THEMES.dark
    const canvas = cityRef.current
    const ctx = canvas.getContext('2d')
    const coarse = window.matchMedia('(pointer: coarse)').matches
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let W = 0
    let H = 0
    let dpr = 1
    let city = null
    let box = { x: 0, y: 0, w: 0, h: 0 }
    let frame = null
    let disposed = false

    const pointer = { x: 0, y: 0, on: false }
    const lens = { x: 0, y: 0, a: 0 }
    const par = { x: 0, y: 0 }
    const flashes = []

    function layout() {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      W = window.innerWidth
      H = window.innerHeight
      canvas.width = Math.round(W * dpr)
      canvas.height = Math.round(H * dpr)
      drawGrain(grainRef.current, W, H, dpr, t)
      if (city) {
        const aspect = city.width / city.height
        const w = Math.max(W + PARALLAX * 4, H * 0.5 * aspect)
        const h = w / aspect
        box = { w, h, x: (W - w) / 2, y: Math.min(H * 0.58 - h * 0.5, H - h * 0.82) }
      }
    }

    // Dibuja la ciudad solo dentro de un círculo de luz suave
    function reveal(cx, cy, radius, alpha) {
      if (!city || alpha <= 0.005) return
      ctx.save()
      const g = ctx.createRadialGradient(cx, cy, radius * 0.15, cx, cy, radius)
      g.addColorStop(0, `rgba(0,0,0,${alpha})`)
      g.addColorStop(0.6, `rgba(0,0,0,${alpha * 0.55})`)
      g.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.clip()
      ctx.drawImage(city, box.x - par.x * PARALLAX, box.y - par.y * PARALLAX * 0.6, box.w, box.h)
      ctx.globalCompositeOperation = 'destination-in'
      ctx.fillStyle = g
      ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2)
      ctx.restore()
      // halo de la luz sobre el vidrio
      const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius)
      halo.addColorStop(0, `rgba(${t.ink.join(',')},${0.06 * alpha})`)
      halo.addColorStop(1, `rgba(${t.ink.join(',')},0)`)
      ctx.fillStyle = halo
      ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2)
    }

    function step(now) {
      frame = null
      if (disposed) return
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const tx = pointer.on ? (pointer.x / W) * 2 - 1 : par.x
      const ty = pointer.on ? (pointer.y / H) * 2 - 1 : par.y
      par.x += (tx - par.x) * 0.06
      par.y += (ty - par.y) * 0.06
      lens.a += ((pointer.on ? 1 : 0) - lens.a) * (pointer.on ? 0.09 : 0.06)
      lens.x += (pointer.x - lens.x) * 0.16
      lens.y += (pointer.y - lens.y) * 0.16

      reveal(lens.x, lens.y, LENS_R * (0.7 + 0.3 * lens.a), lens.a)

      for (let i = flashes.length - 1; i >= 0; i--) {
        const f = flashes[i]
        const age = Math.max(0, (now - f.t) / 1300)
        if (age >= 1) {
          flashes.splice(i, 1)
          continue
        }
        const e = 1 - (1 - age) ** 3
        reveal(f.x, f.y, 60 + e * 320, (1 - age) ** 1.5)
        ctx.strokeStyle = `rgba(${t.ink.join(',')},${0.22 * (1 - age)})`
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.arc(f.x, f.y, 20 + e * 340, 0, Math.PI * 2)
        ctx.stroke()
      }

      // solo seguimos animando mientras haya luz visible
      if (pointer.on || lens.a > 0.01 || flashes.length) frame = requestAnimationFrame(step)
    }

    const wake = () => {
      if (frame === null && !reduceMotion) frame = requestAnimationFrame(step)
    }

    function onMove(e) {
      if (coarse && e.pointerType === 'touch' && e.buttons === 0) return
      pointer.x = e.clientX
      pointer.y = e.clientY
      pointer.on = true
      wake()
    }
    function onLeave() {
      pointer.on = false
      wake()
    }
    function onDown(e) {
      if (e.target.closest?.(INTERACTIVE)) return
      flashes.push({ x: e.clientX, y: e.clientY, t: performance.now() })
      if (coarse) {
        pointer.x = e.clientX
        pointer.y = e.clientY
        lens.x = e.clientX
        lens.y = e.clientY
      }
      wake()
    }
    function onUp(e) {
      if (e.pointerType === 'touch') onLeave()
    }

    let resizeTimer = null
    function onResize() {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => {
        layout()
        wake()
      }, 160)
    }

    const skyline = new Image()
    skyline.decoding = 'async'
    skyline.onload = () => {
      if (disposed) return
      city = tintSkyline(skyline, t.ink)
      layout()
    }
    skyline.src = skylineUrl

    layout()
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown, { passive: true })
    window.addEventListener('pointerup', onUp, { passive: true })
    document.addEventListener('pointerleave', onLeave)
    window.addEventListener('blur', onLeave)
    window.addEventListener('resize', onResize)

    return () => {
      disposed = true
      if (frame) cancelAnimationFrame(frame)
      clearTimeout(resizeTimer)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      document.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('blur', onLeave)
      window.removeEventListener('resize', onResize)
    }
  }, [theme])

  return (
    <div className="backdrop" aria-hidden="true">
      <canvas ref={cityRef} />
      <canvas ref={grainRef} />
      <div className="backdrop-sheen" />
    </div>
  )
}

export default GlassBackground
