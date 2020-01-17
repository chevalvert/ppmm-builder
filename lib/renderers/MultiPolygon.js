const clone = require('clone')
const RenderPolygon = require('./Polygon')

module.exports = function render ({ ctx, style }) {
  style.renderStrokeOutline(ctx, this, render)
  style.STROKE_OUTLINE_RENDERING = false

  this.geometry.coordinates.forEach(coordinates => {
    const polygon = clone(this)
    polygon.geometry.coordinates = coordinates
    RenderPolygon.bind(polygon)({ ctx, style })
  })

  style.STROKE_OUTLINE_RENDERING = true
}
