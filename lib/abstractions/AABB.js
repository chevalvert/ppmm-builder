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

  transform (x, y, width, height, {
    preserveAspectRatio = true,
    padding = 0,
    precision = 5
  } = {}) {
    if (!preserveAspectRatio) {
      return coords => [
        map(coords[0], this.xmin, this.xmax, x + padding, width - padding * 2),
        map(coords[1], this.ymin, this.ymax, y + padding, height - padding * 2)
      ].map(roundPrecision(precision))
    }

    width = width - padding * 2
    height = height - padding * 2

    const destRatio = width / height
    const destWidth = destRatio > this.ratio ? height * this.ratio : width
    const destHeight = destRatio > this.ratio ? height : width / this.ratio

    const offX = padding + (width - destWidth) / 2
    const offY = padding + (height - destHeight) / 2

    return coords => {
      return [
        offX + map(coords[0], this.xmin, this.xmax, x, destWidth),
        offY + map(coords[1], this.ymin, this.ymax, y, destHeight)
      ].map(roundPrecision(precision))
    }
  }
}