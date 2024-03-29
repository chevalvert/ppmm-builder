const simplify = require('simplify-path')

module.exports = function render ({ ctx, style }) {
  style.renderStrokeOutline(ctx, this, render)

  ctx.beginPath()

  const path = style.tolerance > 1
    ? simplify(this.geometry.coordinates, style.tolerance)
    : this.geometry.coordinates

  path.forEach(([x, y], index) => ctx[index ? 'lineTo' : 'moveTo'](x, y))

  const arrows = style.createArrows(path)
  arrows.forEach(arrow => arrow.forEach(([x, y], index) => ctx[index ? 'lineTo' : 'moveTo'](x, y)))

  ctx.stroke()

  style.renderStringlabel(ctx, this)
}
