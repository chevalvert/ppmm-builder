const { inspect } = require('util')
const deepFreeze = require('deep-freeze')
const rewind = require('@mapbox/geojson-rewind')
const AABB = require('./abstractions/AABB')
const Rasters = require('./abstractions/Rasters')
const Render = require('./abstractions/Render')
const Styles = require('./abstractions/Styles')
const streamGeoJson = require('./utils/stream-geojson')

const NO_STYLE = []

module.exports = async (input, {
  stylesArray = Styles.DEFAULT.raw,
  stylesRoot = process.cwd(),

  rastersArray = [],
  rastersRoot = process.cwd(),

  verbose = false,
  progress = false,

  zoomLevels = [0],
  tileSize = 256, // px
  region = undefined, // [X1, Y1, X2, Y2], specifies the region of the tileset to render

  boundingBox = undefined, // follows geographic standard of [xmin, ymax, xmax, ymin]
  backgroundColor = 'transparent',
  padding = 0, // in the same unit as input system coordinates
  precision = 0,

  resolution = 72, // ppi
  compression = 6, // 0~9
  quality = 'best', // 'fast'|'good'|'best'|'nearest'|'bilinear'
  antialias = 'default', // 'default'|'none'|'gray'|'subpixel'

  skipEmpty = false,
  output = process.cwd(),
  filename = (x, y, zoom) => `${zoom}/${x}-${y}`
} = {}) => {
  const renders = zoomLevels.map(zoom => new Render({
    zoom,
    tileSize,
    region,
    backgroundColor,
    padding,
    precision,
    resolution,
    quality,
    antialias
  }))

  let aabb = boundingBox && AABB.fromGeoBB(boundingBox)
  const styles = new Styles(stylesArray, { root: stylesRoot, resolution })
  const rasters = new Rasters(rastersArray, { root: rastersRoot })
  await rasters.preloadAll({ verbose })

  await streamGeoJson(input, {
    validate: feature => feature.geometry && feature.geometry.coordinates,
    filter: feature => !feature.properties || !feature.properties.hidden,
    transform,
    ondata: (feature, index) => {
      if (progress) {
        console.log(`Rendering feature ${index}`, verbose ? '' : `(parent: ${feature.parent})`)
        verbose && console.log(inspect(feature, { colors: true, depth: 1 }))
      }

      renders.forEach(render => {
        render.setAABB(aabb)
        render.renderRasters(rasters, { nextFeature: feature, progress, verbose })
        render.renderFeature(feature, { index, styles, progress, verbose })
      })
    }
  })

  const files = []
  renders.forEach(async render => {
    const renderedFiles = await render.write(output, {
      verbose,
      compression,
      skipEmpty,
      filename
    })

    files.push(renderedFiles)
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

    // Make sure geojson polygons respects the right-hand-rule, as it will be
    // needed to perform intersections and fill tests
    feature = rewind(feature)

    // Store the previous feature as it may be useful for further selection, ie
    // to detect context change using feature.parent !== feature.previous.parent
    feature.previous = previousFeature || {}
    // IMPORTANT: keeping reference of previous object in a previous object can
    // result in a serious memory leak, as the whole list is stored as
    // reference. We have to make sure references are not kept more than one
    // ancestor level.
    previousFeature = Object.assign({}, feature, { previous: 'Removed to free memory' })

    // Best practice: to avoid confusion, the feature should not be modified
    // outside this transform function
    return deepFreeze(feature)
  }
}
