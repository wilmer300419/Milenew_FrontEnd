import Modal from '../common/Modal.jsx'
import Button from '../common/Button.jsx'

function StationModal({ station, isFavorite, onToggleFavorite, onClose }) {
  return (
    <Modal open={Boolean(station)} onClose={onClose} title={station?.name} subtitle="Próximos servicios · en vivo">
      <p className="empty">La llegada en vivo se mostrará cuando el backend exponga el servicio.</p>
      {station && (
        <div className="stinfo">
          <div className="li">
            <div className="k">Tipo</div>
            <div className="v">{station.isExpressStop ? 'Para el expreso B75' : 'Corriente'}</div>
          </div>
          <div className="li">
            <div className="k">Accesos</div>
            <div className="v">
              <div className="pillrow">
                {(station.accesses ?? ['Norte', 'Sur']).map((a) => (
                  <span key={a}>{a}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      <Button variant="out" style={{ width: '100%', marginTop: 14 }} onClick={onToggleFavorite}>
        {isFavorite ? 'Quitar de favoritas' : 'Marcar favorita'}
      </Button>
    </Modal>
  )
}

export default StationModal
