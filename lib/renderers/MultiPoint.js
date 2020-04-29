const RenderPoint = require('./Point')

module.exports = function render ({ ctx, style }) {
  style.renderStrokeOutline(ctx, this, render)
  style.STROKE_OUTLINE_RENDERING = false

  this.geometry.coordinates.forEach(coordinates => {
    RenderPoint.bind({ geometry: { coordinates } })({ ctx, style })
  })

  style.STROKE_OUTLINE_RENDERING = true
}
