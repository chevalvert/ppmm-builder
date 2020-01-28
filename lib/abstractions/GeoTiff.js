const AABB = require('./AABB')
const safeEval = require('safe-eval')
const path = require('path')
const GeoTIFF = require('geotiff')
const { createCanvas, createImageData } = require('canvas')

const TypedSchema = require('./TypedSchema')

const SCHEMA = new TypedSchema({
  src: 'string',
  before: 'string'
}, 'GeoTiff')

const padGrayscaleBuffer = buffer => {
  const rgbBuffer = new Uint8ClampedArray(buffer.length * 4)
  buffer.forEach((v, index) => rgbBuffer.set([v, v, v, 255], index * 4))
  return rgbBuffer
}

module.exports = class GeoTiff {
  static get SCHEMA () { return SCHEMA }
  constructor (raw, { root = process.cwd() } = {}) {
    GeoTiff.SCHEMA.validate(raw)
    if (!raw.src) throw new Error('GeoTiff.src must be defined')

    this.raw = raw
    this.src = path.resolve(root, raw.src)
    this.before = raw.before
  }

  async preload () {
    this.tiff = await GeoTIFF.fromFile(this.src)
    this.image = await this.tiff.getImage()
    this.aabb = AABB.fromGeoBB(this.image.getBoundingBox())

    const isGrayscale = (this.image.getBytesPerPixel() === 1)
    const buffer = await this.image.readRasters({
      samples: isGrayscale ? [0] : [0, 1, 2, 3],
      interleave: true
    })

    this.width = buffer.width
    this.height = buffer.height
    this.imageData = createImageData(
      isGrayscale ? padGrayscaleBuffer(buffer) : new Uint8ClampedArray(buffer),
      this.width,
      this.height
    )
  }

  match (feature, { zoom } = {}) {
    // If no `before` selector, match immediately)
    return this.before ? safeEval(this.before, { ...feature, zoom }) : true
  }

  render (ctx, { scale, transformation }) {
    // The scale of the image is not necessary the same as the scale of the
    // transformed coordinates of the geojson bbox
    scale = this.image.getResolution().map((v, i) => Math.abs(v / scale[i]))
    const [ox, oy] = transformation(this.image.getOrigin())

    ctx.save()
    ctx.translate(ox, oy)
    ctx.scale(scale[0], scale[1])
    this.drawImage(ctx)
    ctx.restore()
  }

  drawImage (ctx) {
    const canvas = createCanvas(this.width, this.height)
    const tmpCtx = canvas.getContext('2d')
    tmpCtx.putImageData(this.imageData, 0, 0)
    ctx.drawImage(canvas, 0, 0)
  }
}
