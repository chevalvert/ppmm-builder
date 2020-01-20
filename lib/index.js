const path = require('path')
const { createCanvas } = require('canvas')
const project = require('geojson-project')
const rewind = require('@mapbox/geojson-rewind')
const AABB = require('./abstractions/AABB')
const Style = require('./abstractions/Style')
const crop = require('./utils/canvas-crop')

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

module.exports = async (geojson, stylesheet = {}, {
  verbose = false,
  tileSize = 256, // px
  boundingBox = undefined, // follows geographic standard of [xmin, ymax, xmax, ymin]
  backgroundColor = 'transparent',
  padding = 0,
  precision = 0,
  zoom = 0,
  quality = 'best', // 'fast'|'good'|'best'|'nearest'|'bilinear'
  root = process.cwd(), // resolve symbol paths against this root
  output = process.cwd(),
  filename = (x, y, zoom) => `${x}-${y}-${zoom}`
} = {}) => {
  if (!geojson) throw new Error('No GeoJson string given')

  // Filter out features with a `hidden: true` property
  geojson.features = geojson.features.filter(feature => !feature.properties || !feature.properties.hidden)

  // Make sure geojson polygons respects the right-hand-rule, as it will be
  // needed to perform intersections and fill tests
  geojson = rewind(geojson)

  const size = tileSize * (2 ** zoom)
  const aabb = boundingBox
    ? AABB.fromGeoBB(boundingBox)
    : AABB.fromGeoJson(geojson)

  // Normalize all coordinates to canvas coordinates
  geojson = project(geojson, aabb.transform(0, 0, size, size, {
    preserveAspectRatio: true,
    precision,
    padding
  }))

  const STYLE_PROPERTY_NAME = stylesheet['__property'] || 'style'
  Object.entries(stylesheet).forEach(([name, style]) => {
    STYLES[name] = new Style(style, { root })
  })

  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')
  ctx.quality = quality

  if (backgroundColor) {
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  geojson.features.forEach(render)

  // Chunk the main canvas into smaller tiles and write them to files
  const files = []
  for (let j = 0; j < 2 ** zoom; j++) {
    for (let i = 0; i < 2 ** zoom; i++) {
      const file = filename(i, j, zoom) + '.png'
      const rect = [i * tileSize, j * tileSize, tileSize, tileSize]

      verbose && console.time(file)
      files.push(await crop(canvas, path.join(output, file), rect, { quality }))
      verbose && console.timeEnd(file)
    }
  }

  if (verbose) {
    console.log('')
    NO_GEOM.length && console.error(`NO_GEOM(${NO_GEOM.length}):\nSome features have been skipped because they did not have geometry.\n`)
    NO_COORDS.length && console.error(`NO_COORDS(${NO_COORDS.length}):\nSome features have been skipped because they did not have geometry coordinates.\n`)
    NO_RENDERER.length && console.error(`NO_RENDERER(${NO_RENDERER.length}):\nSome features have been skipped because they did not have a renderer.\n`)
    NO_STYLE.length && console.error(`NO_STYLE(${NO_STYLE.length}):\nSome features have been skipped because they did not have a style associated to them.\n`)
  }

  return {
    files,
    warnings: { NO_GEOM, NO_COORDS, NO_RENDERER, NO_STYLE }
  }

  function render (feature) {
    if (feature.properties && feature.properties.hidden) return
    if (!feature.geometry) return NO_COORDS.push(feature)
    if (!feature.geometry.coordinates) return NO_GEOM.push(feature)
    if (!RENDERERS.hasOwnProperty(feature.geometry.type)) return NO_RENDERER.push(feature)

    const style = (STYLES[feature.properties && feature.properties[STYLE_PROPERTY_NAME]]) || STYLES['__default']
    if (!style) return NO_STYLE.push(feature)
    if (style.hidden) return

    ctx.save()
    style.apply(ctx)
    RENDERERS[feature.geometry.type].bind(feature)({ ctx, style })
    ctx.restore()
  }
}
