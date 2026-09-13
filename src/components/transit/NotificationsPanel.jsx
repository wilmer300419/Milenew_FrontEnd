function NotificationsPanel({ notifsQuery }) {
  const { data, loading, error } = notifsQuery
  const notifications = data?.data ?? []

  if (loading) return <p className="empty">Cargando notificaciones…</p>
  if (error) return <p className="empty">No se pudieron cargar las notificaciones.</p>
  if (!notifications.length) return <p className="empty">No tienes notificaciones.</p>

  return (
    <div>
      {notifications.map((n) => (
        <div
          key={n.id}
          className="row"
          style={{
            display: 'flex',
            gap: 12,
            padding: '12px 0',
            borderBottom: '1px solid var(--line)',
            ...(n.unread ? { background: 'var(--red-soft)', borderRadius: 9, paddingLeft: 9, paddingRight: 9 } : {}),
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 500 }}>{n.title}</div>
            <div style={{ fontSize: 11.5, color: 'var(--dim)', marginTop: 2 }}>{n.description}</div>
          </div>
          <div style={{ fontSize: 11, color: 'var(--faint)', whiteSpace: 'nowrap' }}>{n.relativeTime}</div>
        </div>
      ))}
    </div>
  )
}

export default NotificationsPanel
