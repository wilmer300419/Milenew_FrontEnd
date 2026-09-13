function Modal({ open, onClose, title, subtitle, children, footer }) {
  if (!open) return null

  return (
    <>
      <div className="veil on" onClick={onClose} />
      <div className="modal on" role="dialog" aria-modal="true">
        {title && <h4>{title}</h4>}
        {subtitle && <div className="s">{subtitle}</div>}
        {children}
        {footer}
      </div>
    </>
  )
}

export default Modal
