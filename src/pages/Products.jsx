import { getProducts } from '../services/productService'
import { useFetch } from '../hooks/useFetch.js'

function Products() {
  const { data, loading, error } = useFetch(getProducts, [])

  if (loading) return <p>Cargando productos...</p>
  if (error) return <p className="error">{error.message}</p>

  return (
    <div className="page">
      <h1>Productos</h1>
      <ul>
        {data?.data?.map((product) => (
          <li key={product.id}>
            {product.name} — ${product.price}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default Products
