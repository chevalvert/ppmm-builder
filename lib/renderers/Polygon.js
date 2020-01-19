module.exports = function render ({ ctx, style }) {
  style.renderStrokeOutline(ctx, this, render)

  ctx.beginPath()
  this.geometry.coordinates.forEach(polygon => {
    polygon.forEach((point, index) => {
      ctx[index ? 'lineTo' : 'moveTo'](point[0], point[1])
    })
    ctx.closePath()
  })

  ctx.fill()
  ctx.stroke()
  // NOTE: as GeoJson respects the right-hand-rule, renderFillPattern inside
  // test will act like the evenodd fill rule on CW/CCW consecutive polygons…
  style.renderFillPattern(ctx, this.geometry.coordinates.reduce((polygons, polygon) => {
    // …but polygon must be closed to avoid false positive
    polygon = [...polygon, polygon[0]]
    return polygons.concat(polygon)
  }, []))

  this.geometry.coordinates.forEach(polygon => {
    polygon = [...polygon, polygon[0]]
    style.renderStrokePattern(ctx, polygon)
  })
}
