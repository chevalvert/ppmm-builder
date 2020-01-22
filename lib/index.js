const path = require('path')

const { inspect } = require('util')
const { createCanvas } = require('canvas')

const project = require('geojson-project')
const rewind = require('@mapbox/geojson-rewind')

const AABB = require('./abstractions/AABB')
const Style = require('./abstractions/Style')
const tile = require('./utils/canvas-tile')
const streamGeoJson = require('./utils/stream-geojson')

const RENDERERS = {
  'LineString': require('./renderers/LineString'),
  'MultiLineString': require('./renderers/MultiLineString'),
  'MultiPoint': require('./renderers/MultiPoint'),
  'MultiPolygon': require('./renderers//MultiPolygon'),
  'Point': require('./renderers/Point'),
  'Polygon': require('./renderers/Polygon')
}

const NO_STYLE = []

module.exports = async (input, stylesheet = {}, {
  verbose = false,
  progress = false,
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
  Object.entries(stylesheet).forEach(([name, raw]) => {
    if (name === '__property') return
    stylesheet[name] = new Style(raw, { root })
  })

  const size = tileSize * (2 ** zoom)
  const rect = [0, 0, size, size]
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')
  ctx.quality = quality

  if (backgroundColor) {
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  let aabb = boundingBox && AABB.fromGeoBB(boundingBox)

  await streamGeoJson(input, {
    validate: feature => feature.geometry && feature.geometry.coordinates,
    filter: feature => !feature.properties || !feature.properties.hidden,
    transform: ({ feature, bbox }) => {
      // If no initial bounding box given, we instanciate one asap with the bbox
      // constructed during early stream (see stream-geojson bbox object)
      if (!aabb) {
        verbose && console.log('No boundingBox given, using geojson stream bbox property')
        if (bbox.isEmpty) throw new Error('No bbox found in geojson stream')
        if (!bbox.isValid) throw new Error(`Constructed bbox is not valid: ${bbox.value}`)
        aabb = AABB.fromGeoBB(bbox.ensure2D())
      }

      // Make sure geojson polygons respects the right-hand-rule, as it will be
      // needed to perform intersections and fill tests
      feature = rewind(feature)

      // Normalize all coordinates to canvas coordinates
      feature = project(feature, aabb.transform(rect, { precision, padding }))

      return feature
    },
    callback: render
  })

  // Chunk the main canvas into smaller tiles and write them to files
  const files = await tile(canvas, {
    tileLength: 2 ** zoom,
    tileSize,
    verbose,
    quality,
    filePattern: (i, j) => path.join(output, filename(i, j, zoom) + '.png')
  })

  if (verbose) {
    console.log('')
    NO_STYLE.length && console.error(`NO_STYLE(${NO_STYLE.length}):\nSome features have been skipped because they did not have a style associated to them.\n`)
  }

  return {
    files,
    warnings: { NO_STYLE }
  }

  function render (feature, index) {
    progress && console.log('Rendering feature', index, '\n', inspect(feature, { colors: true, depth: 1 }))

    const style = getStyle(feature)
    if (!style) return NO_STYLE.push(feature)
    if (style.hidden) return

    ctx.save()
    style.apply(ctx)
    RENDERERS[feature.geometry.type].bind(feature)({ ctx, style })
    ctx.restore()
  }

  function getStyle (feature) {
    const styleSelectorProperty = stylesheet['__property'] || 'style'
    const key = feature.properties && feature.properties[styleSelectorProperty]
    return stylesheet[key] || stylesheet['__default']
  }
}
