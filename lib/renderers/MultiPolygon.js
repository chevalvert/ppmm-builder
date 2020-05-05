const RenderPolygon = require('./Polygon')

module.exports = function render ({ ctx, style }) {
  style.renderStrokeOutline(ctx, this, render)
  style.STROKE_OUTLINE_RENDERING = false

  this.geometry.coordinates.forEach(coordinates => {
    RenderPolygon.bind({
      parent: this.parent,
      properties: this.properties,
      geometry: { coordinates }
    })({ ctx, style })
  })

  style.STROKE_OUTLINE_RENDERING = true
}
