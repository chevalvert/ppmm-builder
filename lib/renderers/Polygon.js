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

  if (style.hasFillPattern) {
    ctx.save()
    style.applyFillPattern(ctx)
    polygons.forEach(polygon => {
      polygon.forEach(([x, y], index) => ctx[index ? 'lineTo' : 'moveTo'](x, y))
      ctx.closePath()
    })
    ctx.fill()
    ctx.restore()
  }

  style.renderPolylabel(ctx, this)
}
