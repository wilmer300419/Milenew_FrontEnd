import Segmented from '../ui/Segmented.jsx'
import { shortRouteName, useRoutes } from '../../hooks/useTransit.js'

/** Selector de troncal (Caracas, Autonorte…). */
function RouteSwitcher({ value, onChange, size = 'sm' }) {
  const { routes } = useRoutes()
  if (routes.length < 2) return null
  return (
    <Segmented
      size={size}
      value={value}
      onChange={onChange}
      options={routes.map((r) => ({
        value: r.code,
        label: shortRouteName(r),
        icon: <span className="route-dot" style={{ background: r.color }} aria-hidden="true" />,
      }))}
    />
  )
}

export default RouteSwitcher
