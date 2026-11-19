import { forwardRef } from 'react'
import { motion } from 'framer-motion'

const Button = forwardRef(function Button(
  { children, variant = 'primary', size, block, icon, loading = false, className = '', type = 'button', disabled, ...rest },
  ref,
) {
  const classes = ['btn', variant === 'glass' ? 'glass-btn' : variant, size, block && 'block', icon && 'icon', className]
    .filter(Boolean)
    .join(' ')

  return (
    <motion.button
      ref={ref}
      type={type}
      className={classes}
      disabled={disabled || loading}
      whileHover={disabled || loading ? undefined : { y: -1 }}
      whileTap={disabled || loading ? undefined : { scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      {...rest}
    >
      {loading ? <span className="spinner" aria-hidden="true" /> : null}
      {children}
    </motion.button>
  )
})

export default Button
