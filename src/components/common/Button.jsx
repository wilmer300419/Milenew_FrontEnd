function Button({ children, onClick, type = 'button', variant = 'primary', className = '', ...rest }) {
  const classes = ['btn', `btn-${variant}`, className].filter(Boolean).join(' ')
  return (
    <button type={type} className={classes} onClick={onClick} {...rest}>
      {children}
    </button>
  )
}

export default Button
