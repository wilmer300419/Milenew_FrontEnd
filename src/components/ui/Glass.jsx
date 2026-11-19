import { forwardRef, useCallback } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

const finePointer = typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches
const TILT = 5 // grados máximos

/**
 * Panel de vidrio líquido.
 * - El reflejo especular sigue al puntero (variables CSS, sin re-render).
 * - `tilt`: el panel se inclina en 3D hacia el cursor (resorte), dando profundidad.
 * - `as` permite otra etiqueta (form, section…).
 */
const Glass = forwardRef(function Glass(
  { as = 'div', className = '', strong = false, dark = false, pad = true, tilt = false, style, children, ...rest },
  ref,
) {
  const Comp = motion[as] ?? motion.div
  const rx = useMotionValue(0)
  const ry = useMotionValue(0)
  const rotateX = useSpring(rx, { stiffness: 180, damping: 18 })
  const rotateY = useSpring(ry, { stiffness: 180, damping: 18 })
  const canTilt = tilt && finePointer

  const onPointerMove = useCallback(
    (e) => {
      const el = e.currentTarget
      const rect = el.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      el.style.setProperty('--mx', `${x}px`)
      el.style.setProperty('--my', `${y}px`)
      el.style.setProperty('--glow', '1')
      if (canTilt) {
        ry.set(((x / rect.width) * 2 - 1) * TILT)
        rx.set(-((y / rect.height) * 2 - 1) * TILT)
      }
    },
    [canTilt, rx, ry],
  )

  const onPointerLeave = useCallback(
    (e) => {
      e.currentTarget.style.setProperty('--glow', '0')
      rx.set(0)
      ry.set(0)
    },
    [rx, ry],
  )

  const classes = ['glass', strong && 'strong', dark && 'dark', pad && 'card', canTilt && 'tilt', className]
    .filter(Boolean)
    .join(' ')

  return (
    <Comp
      ref={ref}
      data-glass=""
      className={classes}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      style={canTilt ? { rotateX, rotateY, transformPerspective: 1100, ...style } : style}
      {...rest}
    >
      {children}
    </Comp>
  )
})

export default Glass
