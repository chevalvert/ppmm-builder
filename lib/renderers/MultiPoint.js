const clone = require('clone')
const RenderPoint = require('./Point')

module.exports = function render ({ ctx, style }) {
  style.renderStrokeOutline(ctx, this, render)
  style.STROKE_OUTLINE_RENDERING = false

  this.geometry.coordinates.forEach(coordinates => {
    const point = clone(this)
    point.geometry.coordinates = coordinates
    RenderPoint.bind(point)({ ctx, style })
  })

  style.STROKE_OUTLINE_RENDERING = true
}
