const path = require('path')

const { inspect } = require('util')
const { createCanvas } = require('canvas')

const project = require('geojson-project')
const rewind = require('@mapbox/geojson-rewind')

const AABB = require('./abstractions/AABB')
const Stylesheet = require('./abstractions/Stylesheet')
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

  zoom = 0,
  tileSize = 256, // px

  boundingBox = undefined, // follows geographic standard of [xmin, ymax, xmax, ymin]
  backgroundColor = 'transparent',
  padding = 0,
  precision = 0,

  resolution = 72, // ppi
  quality = 'best', // 'fast'|'good'|'best'|'nearest'|'bilinear'

  root = process.cwd(), // resolve symbol paths against this root
  output = process.cwd(),
  filename = (x, y, zoom) => `${x}-${y}-${zoom}`
} = {}) => {
  const size = tileSize * (2 ** zoom) * (resolution / 72)
  const rect = [0, 0, size, size]

  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')
  ctx.quality = quality

  let aabb = boundingBox && AABB.fromGeoBB(boundingBox)
  const styles = new Stylesheet(stylesheet, { root, resolution })

  if (backgroundColor) {
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  await streamGeoJson(input, {
    validate: feature => feature.geometry && feature.geometry.coordinates,
    filter: feature => !feature.properties || !feature.properties.hidden,
    transform,
    callback: render
  })

  // Chunk the main canvas into smaller tiles and write them to files
  const files = await tile(canvas, {
    tileLength: 2 ** zoom,
    tileSize,
    verbose,
    quality,
    resolution,
    filePattern: (i, j) => path.join(output, filename(i, j, zoom) + '.png')
  })

  if (verbose) {
    console.log('')
    NO_STYLE.length && console.error(`NO_STYLE(${NO_STYLE.length}):\nSome features have been skipped because they did not match any style selector.\n`)
  }

  return {
    files,
    warnings: { NO_STYLE }
  }

  function transform ({ feature, bbox, lastFoundName }) {
    // If no initial bounding box given, we instanciate one asap with the bbox
    // constructed during early stream (see stream-geojson bbox object)
    if (!aabb) {
      verbose && console.log('No boundingBox given, using geojson stream bbox property')
      if (bbox.isEmpty) throw new Error('No bbox found in geojson stream')
      if (!bbox.isValid) throw new Error(`Constructed bbox is not valid: ${bbox.value}`)
      aabb = AABB.fromGeoBB(bbox.ensure2D())
    }

    // Some geojson stream have a name property, which can be eventually used
    // to target specific chunks of features, ie for styling. We store this
    // information in a `parent` top-level property in each feature
    if (lastFoundName) feature.parent = lastFoundName

    // Find matching styles for later rendering. We keep styles reference using
    // their index in the stylesheet to prevent overloading feature with useless
    // object references
    feature.styleIndex = styles.match(feature, { zoom })
    if (feature.styleIndex < 0) return NO_STYLE.push(feature) && null

    // Make sure geojson polygons respects the right-hand-rule, as it will be
    // needed to perform intersections and fill tests
    feature = rewind(feature)

    // Normalize all coordinates to canvas coordinates
    feature = project(feature, aabb.transform(rect, { precision, padding }))

    return feature
  }

  function render (feature, index) {
    const style = styles.get(feature.styleIndex)
    if (style.hidden) return null

    progress && console.log('Rendering feature', index, '\n', inspect(feature, { colors: true, depth: 1 }))

    ctx.save()
    style.apply(ctx)
    RENDERERS[feature.geometry.type].bind(feature)({ ctx, style })
    ctx.restore()
  }
}
