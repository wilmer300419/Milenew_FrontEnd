function Input({ label, id, ...rest }) {
  const input = <input id={id} className="input" {...rest} />

  if (!label) return input

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {input}
    </div>
  )
}

export default Input
