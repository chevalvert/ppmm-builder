module.exports = function render ({ ctx, style }) {
  style.renderStrokeOutline(ctx, this, render)

  ctx.beginPath()
  this.geometry.coordinates.forEach((coord, index) => {
    ctx[index ? 'lineTo' : 'moveTo'](coord[0], coord[1])
  })
  ctx.stroke()
  style.renderStrokePattern(ctx, this.geometry.coordinates)
}
