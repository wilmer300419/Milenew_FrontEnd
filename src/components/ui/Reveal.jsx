import { forwardRef } from 'react'
import { motion } from 'framer-motion'

/** Contenedor que escalona la aparición de sus hijos <Reveal.Item>. */
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
}

const item = {
  hidden: { opacity: 0, y: 18, filter: 'blur(6px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { type: 'spring', stiffness: 260, damping: 28 } },
}

function Reveal({ as = 'div', className, children, ...rest }) {
  const Comp = motion[as] ?? motion.div
  return (
    <Comp className={className} variants={container} initial="hidden" animate="show" {...rest}>
      {children}
    </Comp>
  )
}

const Item = forwardRef(function Item({ as = 'div', className, children, ...rest }, ref) {
  const Comp = motion[as] ?? motion.div
  return (
    <Comp ref={ref} className={className} variants={item} {...rest}>
      {children}
    </Comp>
  )
})

Reveal.Item = Item
export { item as revealItem }
export default Reveal
