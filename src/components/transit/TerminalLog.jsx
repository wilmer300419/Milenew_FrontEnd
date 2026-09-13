const p2 = (n) => String(n).padStart(2, '0')
const stamp = (d) => `${p2(d.getHours())}:${p2(d.getMinutes())}:${p2(d.getSeconds())}`

function TerminalLog({ title, entries }) {
  return (
    <div className="term">
      <div className="bar">
        <i />
        <i />
        <i />
        <span>{title}</span>
      </div>
      <div className="body">
        {entries.length === 0 && <div className="tl">Sin actividad reciente.</div>}
        {entries.map((entry) => (
          <div className="tl" key={entry.id}>
            <span className="tm">[{stamp(entry.time)}]</span>
            <span className={`tg ${entry.tag}`}>{entry.tag.toUpperCase()}</span>
            <span className="tx">{entry.message}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TerminalLog
