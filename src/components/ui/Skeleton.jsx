function Skeleton({ h = 16, w = '100%', r, style }) {
  return <div className="skeleton" style={{ height: h, width: w, borderRadius: r, ...style }} />
}

export default Skeleton
