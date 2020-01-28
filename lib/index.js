const path = require('path')

const { inspect } = require('util')
const { createCanvas } = require('canvas')
const deepFreeze = require('deep-freeze')
const project = require('geojson-project')
const rewind = require('@mapbox/geojson-rewind')

const AABB = require('./abstractions/AABB')
const Styles = require('./abstractions/Styles')
const Rasters = require('./abstractions/Rasters')

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

module.exports = async (input, {
  stylesArray = Styles.DEFAULT.raw,
  stylesRoot = process.cwd(),

  rastersArray = [],
  rastersRoot = process.cwd(),

  verbose = false,
  progress = false,

  zoom = 0,
  tileSize = 256, // px

  boundingBox = undefined, // follows geographic standard of [xmin, ymax, xmax, ymin]
  backgroundColor = 'transparent',
  padding = 0, // in the same unit as input system coordinates
  precision = 0,

  resolution = 72, // ppi
  compression = 6, // 0~9
  quality = 'best', // 'fast'|'good'|'best'|'nearest'|'bilinear'
  antialias = 'default', // 'default'|'none'|'gray'|'subpixel'

  output = process.cwd(),
  filename = (x, y, zoom) => `${x}-${y}-${zoom}`
} = {}) => {
  const size = tileSize * (2 ** zoom) * (resolution / 72)
  const rect = [0, 0, size, size]

  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')
  ctx.quality = quality
  ctx.antialias = antialias
  if (backgroundColor) {
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  let aabb = boundingBox && AABB.fromGeoBB(boundingBox)
  const styles = new Styles(stylesArray, { root: stylesRoot, resolution })
  const rasters = new Rasters(rastersArray, { root: rastersRoot })
  await rasters.preloadAll({ verbose })

  await streamGeoJson(input, {
    validate: feature => feature.geometry && feature.geometry.coordinates,
    filter: feature => !feature.properties || !feature.properties.hidden,
    transform,
    ondata: render
  })

  // Chunk the main canvas into smaller tiles and write them to files
  const files = await tile(canvas, {
    tileLength: 2 ** zoom,
    tileSize,
    verbose,
    antialias,
    quality,
    resolution,
    compression,
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

  var previousFeature
  function transform ({ feature, bbox, lastFoundName }) {
    // If no initial bounding box given, we instanciate one asap with the bbox
    // constructed during early stream (see stream-geojson bbox object)
    if (!aabb) {
      verbose && console.log('\nNo boundingBox given, using geojson stream bbox property')
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

    // Store the previous feature as it may be useful for further selection, ie
    // to detech context change using feature.parent !== feature.previous.parent
    feature.previous = previousFeature || {}
    previousFeature = feature

    // Best practice: to avoid confusion, the feature should not be modified
    // outside this transform function
    return deepFreeze(feature)
  }

  function render (feature, index) {
    renderRasters(feature)
    renderFeature(feature, index)
  }

  function renderRasters (feature) {
    if (!rasters.renderable || !rasters.renderable.length) return

    const rendered = []
    const scale = aabb.computeScale(rect, { padding })
    const transformation = aabb.transform(rect, { padding, precision })

    rasters.renderable.forEach((geotiff, index) => {
      if (!geotiff.match(feature, { zoom })) return

      progress && console.log('Rendering GeoTiff', '\n', inspect(geotiff.raw, { colors: true, depth: 1 }))

      geotiff.render(ctx, { scale, transformation })
      rendered.push(geotiff)
    })

    rendered.forEach(geotiff => rasters.removeFromRenderQueue(geotiff))
  }

  function renderFeature (feature, index) {
    const style = styles.get(feature.styleIndex)
    if (style.hidden) return null

    progress && console.log('Rendering feature', index, '\n', inspect(feature, { colors: true, depth: 1 }))

    ctx.save()
    style.apply(ctx)
    RENDERERS[feature.geometry.type].bind(feature)({ ctx, style })
    ctx.restore()
  }
}
