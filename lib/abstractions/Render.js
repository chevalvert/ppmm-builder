const path = require('path')
const { createCanvas } = require('canvas')
const project = require('geojson-project')
const TileRegion = require('./TileRegion')
const tile = require('../utils/canvas-tile')

const RENDERERS = {
  'LineString': require('../renderers/LineString'),
  'MultiLineString': require('../renderers/MultiLineString'),
  'MultiPoint': require('../renderers/MultiPoint'),
  'MultiPolygon': require('../renderers//MultiPolygon'),
  'Point': require('../renderers/Point'),
  'Polygon': require('../renderers/Polygon')
}

module.exports = class Render {
  constructor ({
    zoom = 0,
    tileSize = 256,
    region = [0, 0, (2 ** zoom) - 1, (2 ** zoom) - 1],

    backgroundColor = 'transparent',
    padding = 0,
    precision = 0,

    resolution = 72,
    quality = 'best',
    antialias = 'default'
  } = {}) {
    const tileLength = 2 ** zoom
    const size = tileSize * tileLength * (resolution / 72)

    this.tileSize = tileSize
    this.resolution = resolution
    this.zoom = zoom
    this.rectangle = [0, 0, size, size]

    this.padding = padding
    this.precision = precision

    this.SKIPPED = []
    this.consumedRasters = []

    // This is used for selective region rendering
    this.tileRegion = new TileRegion(region, { tileSize, tileLength, resolution })

    this.canvas = createCanvas(this.tileRegion.width, this.tileRegion.height)
    this.ctx = this.canvas.getContext('2d')
    this.ctx.quality = quality
    this.ctx.antialias = antialias
    this.ctx.translate(-this.tileRegion.offset[0], -this.tileRegion.offset[1])

    if (backgroundColor) {
      this.ctx.fillStyle = backgroundColor
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    }
  }

  renderRasters (rasters, { aabb, nextFeature, verbose } = {}) {
    if (!rasters || !rasters.length) return

    const scale = aabb.computeScale(this.rectangle, { padding: this.padding })
    const transformation = aabb.transform(this.rectangle, { padding: this.padding, precision: this.precision })

    rasters.forEach((geotiff, index) => {
      if (this.consumedRasters.includes(geotiff.src)) return
      if (!geotiff.match(nextFeature, { zoom: this.zoom })) return

      verbose && console.log(`Rendering GeoTiff ${geotiff.src}`)
      geotiff.render(this.ctx, { scale, transformation })
      this.consumedRasters.push(geotiff.src)
    })
  }

  renderFeature (feature, { aabb, index, styles } = {}) {
    // Find matching styles for later rendering. We keep styles reference using
    // their index in the stylesheet to prevent overloading feature with useless
    // object references
    const style = styles.match(feature, { zoom: this.zoom })
    if (!style || style.hidden) {
      this.SKIPPED.push(index)
      return
    }

    // Normalize all coordinates to this render.canvas coordinates
    feature = project(feature, aabb.transform(this.rectangle, { precision: this.precision, padding: this.padding }))

    this.ctx.save()
    style.apply(this.ctx)
    RENDERERS[feature.geometry.type].bind(feature)({ ctx: this.ctx, style })
    this.ctx.restore()
  }

  async write (output, {
    verbose = false,
    compression = 6,
    skipEmpty = false,
    filename = (x, y, zoom) => `${zoom}/${x}-${y}`
  } = {}) {
    return tile(this.canvas, {
      tiles: [this.tileRegion.rectWidth, this.tileRegion.rectHeight],
      tileSize: this.tileSize,
      verbose,
      antialias: this.antialias,
      quality: this.quality,
      resolution: this.resolution,
      compression,
      skipEmpty,
      filePattern: (i, j) => path.join(output, filename(i + this.tileRegion.rect[0], j + this.tileRegion.rect[1], this.zoom) + '.png')
    })
  }
}
