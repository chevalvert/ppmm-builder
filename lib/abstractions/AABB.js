const { map } = require('missing-math')
const bounds = require('geojson-bounds')

const roundPrecision = precision => v => +v.toFixed(precision)

module.exports = class AABB {
  static fromPoints (points) {
    let xmin = Number.POSITIVE_INFINITY
    let ymin = Number.POSITIVE_INFINITY
    let xmax = Number.NEGATIVE_INFINITY
    let ymax = Number.NEGATIVE_INFINITY

    points.forEach(([x, y]) => {
      if (x < xmin) xmin = x
      if (y < ymin) ymin = y
      if (x > xmax) xmax = x
      if (y > ymax) ymax = y
    })

    return new AABB({ xmin, xmax, ymin, ymax })
  }

  // SEE: https://wiki.openstreetmap.org/wiki/Bounding_Box
  static fromGeoBB ([west, south, east, north]) {
    if (!AABB.validate(west, south, east, north)) {
      throw new Error('Bounding box malformation: expected input is `[west, south, east, north]`')
    }

    return new AABB({ xmin: west, xmax: east, ymin: north, ymax: south })
  }

  static fromGeoJson (geojson) {
    // SEE: https://github.com/jczaplew/geojson-bounds#extentgeojson
    return AABB.fromGeoBB(bounds.extent(geojson))
  }

  static validate (...values) {
    return !values.some(v => isNaN(v))
  }

  constructor ({ xmin, xmax, ymin, ymax }) {
    if (!AABB.validate(xmin, xmax, ymin, ymax)) {
      throw new Error('Bounding box malformation: expected input is `{ xmin, xmax, ymin, ymax }`')
    }

    this.xmin = xmin
    this.xmax = xmax
    this.ymin = ymin
    this.ymax = ymax

    this.width = Math.abs(xmax - xmin)
    this.height = Math.abs(ymax - ymin)
    this.ratio = this.width / this.height

    this.center = [this.xmin + this.width / 2, this.ymin + this.height / 2]
  }

  pad (value) {
    if (!value) return this

    const xmin = this.xmin - value
    const xmax = this.xmax + value
    const ymin = this.ymin - value
    const ymax = this.ymax + value
    return new AABB({ xmin, xmax, ymin, ymax })
  }

  transform ([x, y, width, height], {
    preserveAspectRatio = true,
    padding = 0,
    precision = 5
  } = {}) {
    if (!preserveAspectRatio) {
      return coords => [
        map(coords[0], this.xmin + padding, this.xmax - padding, x, width),
        map(coords[1], this.ymin + padding, this.ymax - padding, y, height)
      ].map(roundPrecision(precision))
    }

    const padded = this.pad(padding)

    const destRatio = width / height
    const destWidth = destRatio > padded.ratio ? height * padded.ratio : width
    const destHeight = destRatio > padded.ratio ? height : width / padded.ratio

    const offX = (width - destWidth) / 2
    const offY = (height - destHeight) / 2

    return coords => {
      return [
        offX + map(coords[0], padded.xmin, padded.xmax, x, destWidth),
        offY + map(coords[1], padded.ymin, padded.ymax, y, destHeight)
      ].map(roundPrecision(precision))
    }
  }
}
