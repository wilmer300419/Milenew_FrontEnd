function Card({ children, tight = false, className = '', ...rest }) {
  const classes = ['card', tight ? 'tight' : '', className].filter(Boolean).join(' ')
  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  )
}

export default Card
