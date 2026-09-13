import { getProducts } from '../services/productService'
import { useFetch } from '../hooks/useFetch.js'
import { formatPrice } from '../utils/formatters.js'
import Card from '../components/common/Card.jsx'

function Products() {
  const { data, loading, error } = useFetch(getProducts, [])
  const products = data?.data ?? []

  return (
    <div className="page">
      <div className="sec">
        <h3>Catálogo</h3>
      </div>
      <h1 className="htitle" style={{ fontSize: 'clamp(26px,4vw,38px)', marginBottom: 6 }}>
        Productos
      </h1>

      {loading && <p className="empty">Cargando productos…</p>}
      {error && <p className="error">{error.message}</p>}
      {!loading && !error && products.length === 0 && (
        <p className="empty">No hay productos disponibles todavía.</p>
      )}

      {!loading && !error && products.length > 0 && (
        <div className="g3">
          {products.map((product) => (
            <Card key={product.id}>
              <div style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 8 }}>{product.name}</div>
              <div style={{ fontSize: 19, fontWeight: 600, color: 'var(--red)' }}>
                {formatPrice(product.price)}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default Products
