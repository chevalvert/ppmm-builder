const simplify = require('simplify-path')

module.exports = function render ({ ctx, style }) {
  style.renderStrokeOutline(ctx, this, render)

  ctx.beginPath()

  const polygons = style.tolerance > 1
    ? this.geometry.coordinates.map(polygon => simplify(polygon, style.tolerance))
    : this.geometry.coordinates

  polygons.forEach(polygon => {
    polygon.forEach(([x, y], index) => ctx[index ? 'lineTo' : 'moveTo'](x, y))
    ctx.closePath()
  })

  ctx.fill()
  ctx.stroke()

  // NOTE: calling renderFillPattern and renderStrokePattern inside a short
  // circuit evaluation to avoid polygons.reduce compute if not needed
  const mergedPolygons = polygons.reduce((polygons, polygon) => {
    // …but polygon must be closed to avoid false positive
    polygon = [...polygon, polygon[0]]
    return polygons.concat(polygon)
  }, [])

  style.hasFillPattern &&
  // NOTE: as GeoJson respects the right-hand-rule, renderFillPattern inside
  // test will act like the evenodd fill rule on CW/CCW consecutive polygons…
  style.renderFillPattern(ctx, mergedPolygons)

  style.hasStrokePattern &&
  polygons.forEach(polygon => {
    polygon = [...polygon, polygon[0]]
    style.renderStrokePattern(ctx, polygon)
  })

  style.renderPolylabel(ctx, this)
}
