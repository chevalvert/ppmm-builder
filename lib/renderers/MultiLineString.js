const clone = require('clone')
const RenderLineString = require('./LineString')

module.exports = function render ({ ctx, style }) {
  style.renderStrokeOutline(ctx, this, render)
  style.STROKE_OUTLINE_RENDERING = false

  this.geometry.coordinates.forEach(coordinates => {
    const lineString = clone(this)
    lineString.geometry.coordinates = coordinates
    RenderLineString.bind(lineString)({ ctx, style })
  })

  style.STROKE_OUTLINE_RENDERING = true
}
