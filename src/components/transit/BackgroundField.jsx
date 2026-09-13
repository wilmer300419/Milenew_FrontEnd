import { useEffect, useRef } from 'react'

const RGB = ['193,18,31', '217,164,65', '245,245,242']
const STEPS = 14
const DENSITY = 1 / 1100
const MAXP = 2200
const RADIUS = 175

function buildCache() {
  const cache = []
  for (let c = 0; c < RGB.length; c++) {
    cache[c] = []
    for (let s = 0; s < STEPS; s++) cache[c][s] = `rgba(${RGB[c]},${((s + 1) / STEPS).toFixed(3)})`
  }
  return cache
}

// Fondo decorativo, no crítico para la UI: se pausa si el usuario prefiere menos
// movimiento o si la pestaña no está visible (MIL-44 · optimización).
function BackgroundField() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) return undefined

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d', { alpha: true })
    const cache = buildCache()
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
    let width = 0
    let height = 0
    let particles = []
    let frame = null
    let running = true;

    function resize() {
      width = canvas.clientWidth
      height = canvas.clientHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    function make(p, y) {
      const d = 0.3 + Math.random() * 0.95
      const roll = Math.random()
      p.x = Math.random() * width
      p.y = y === undefined ? Math.random() * height : y
      p.d = d
      p.r = 0.45 + d * 0.75
      p.drift = (0.04 + Math.random() * 0.16) * d
      p.sway = Math.random() * Math.PI * 2
      p.swaySp = 0.002 + Math.random() * 0.004
      p.c = roll < 0.34 ? 0 : roll < 0.64 ? 1 : 2
      p.tw = Math.random() * Math.PI * 2
      p.twSp = 0.008 + Math.random() * 0.022
      return p
    }

    function seed() {
      const n = Math.min(MAXP, Math.round(width * height * DENSITY))
      particles = Array.from({ length: n }, () => make({}))
    }

    function step() {
      if (!running) return
      ctx.clearRect(0, 0, width, height)
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        p.y -= p.drift
        p.sway += p.swaySp
        p.tw += p.twSp
        if (p.y < -10) make(p, height + 10)

        const px = p.x + Math.sin(p.sway) * 5
        const a = (0.2 + p.d * 0.42) * (0.7 + Math.sin(p.tw) * 0.3)
        let lvl = (a * STEPS) | 0
        if (lvl < 0) lvl = 0
        else if (lvl >= STEPS) lvl = STEPS - 1

        const s = p.r * 2
        ctx.fillStyle = cache[p.c][lvl]
        ctx.fillRect(px, p.y, s, s)
      }
      frame = requestAnimationFrame(step)
    }

    function handleVisibility() {
      running = !document.hidden
      if (running && frame === null) step()
    }

    function handleResize() {
      resize()
      seed()
    }

    resize()
    seed()
    step()

    window.addEventListener('resize', handleResize)
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      running = false
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('resize', handleResize)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

  return (
    <div className="bgfx" aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  )
}

export default BackgroundField
