const fs = require('fs-extra')
const tmp = require('tmp')
const { createCanvas } = require('canvas')

const project = require('geojson-project')

const GeoJsonAABB = require('./abstractions/GeoJsonAABB')
const Style = require('./abstractions/Style')

const STYLES = {}
const RENDERERS = {
  'LineString': require('./renderers/LineString'),
  'MultiLineString': require('./renderers/MultiLineString'),
  'MultiPoint': require('./renderers/MultiPoint'),
  'MultiPolygon': require('./renderers//MultiPolygon'),
  'Point': require('./renderers/Point'),
  'Polygon': require('./renderers/Polygon')
}

const NO_GEOM = []
const NO_COORDS = []
const NO_RENDERER = []
const NO_STYLE = []

module.exports = (geojson, stylesheet = {}, {
  size = 256, // px
  backgroundColor = 'transparent',
  padding = 0,
  precision = 0,
  root = process.cwd(), // resolve symbol paths against this root
  output = tmp.tmpNameSync({ postfix: '.png' })
} = {}) => {
  if (!geojson) throw new Error('No GeoJson string given')

  // Filter out features with a `hidden: true` property
  geojson.features = geojson.features.filter(feature => !feature.properties || !feature.properties.hidden)

  // Normalize all coordinates to canvas coordinates
  geojson = project(geojson, new GeoJsonAABB(geojson).transform(0, 0, size, size, {
    preserveAspectRatio: true,
    precision,
    padding
  }))

  Object.entries(stylesheet).forEach(([name, style]) => {
    STYLES[name] = new Style(style, { root })
  })

  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')

  const out = fs.createWriteStream(output)
  const stream = canvas.pngStream()
  stream.on('data', chunk => out.write(chunk))
  stream.on('end', () => console.log(output))

  if (backgroundColor) {
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  geojson.features.forEach(render)

  NO_GEOM.length && console.error(`NO_GEOM(${NO_GEOM.length}):\nSome features have been skipped because they did not have geometry.\n`)
  NO_COORDS.length && console.error(`NO_COORDS(${NO_COORDS.length}):\nSome features have been skipped because they did not have geometry coordinates.\n`)
  NO_RENDERER.length && console.error(`NO_RENDERER(${NO_RENDERER.length}):\nSome features have been skipped because they did not have a renderer.\n`)
  NO_STYLE.length && console.error(`NO_STYLE(${NO_STYLE.length}):\nSome features have been skipped because they did not have a style associated to them.\n`)

  return {
    error: { NO_GEOM, NO_COORDS, NO_RENDERER, NO_STYLE }
  }

  function render (feature) {
    if (feature.properties && feature.properties.hidden) return
    if (!feature.geometry) return NO_COORDS.push(feature)
    if (!feature.geometry.coordinates) return NO_GEOM.push(feature)
    if (!RENDERERS.hasOwnProperty(feature.geometry.type)) return NO_RENDERER.push(feature)

    const style = STYLES[feature.properties && feature.properties.style]
    if (!style) return NO_STYLE.push(feature)
    if (style.hidden) return

    ctx.save()
    style.apply(ctx)
    RENDERERS[feature.geometry.type].bind(feature)({ ctx, style })
    ctx.restore()
  }
}
