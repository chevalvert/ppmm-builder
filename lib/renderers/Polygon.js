module.exports = function render ({ ctx, style }) {
  style.renderStrokeOutline(ctx, this, render)

  ctx.beginPath()
  this.geometry.coordinates.forEach(point => {
    point.forEach((coord, index) => {
      ctx[index ? 'lineTo' : 'moveTo'](coord[0], coord[1])
    })
  })
  ctx.closePath()

  ctx.fill()
  ctx.stroke()
  style.renderFillPattern(ctx, this.geometry.coordinates[0])
}
