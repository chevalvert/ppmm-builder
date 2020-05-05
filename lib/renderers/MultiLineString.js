const RenderLineString = require('./LineString')

module.exports = function render ({ ctx, style }) {
  style.renderStrokeOutline(ctx, this, render)
  style.STROKE_OUTLINE_RENDERING = false

  this.geometry.coordinates.forEach(coordinates => {
    RenderLineString.bind({
      parent: this.parent,
      properties: this.properties,
      geometry: { coordinates }
    })({ ctx, style })
  })

  style.STROKE_OUTLINE_RENDERING = true
}
