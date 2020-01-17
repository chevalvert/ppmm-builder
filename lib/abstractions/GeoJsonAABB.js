const bounds = require('geojson-bounds')
const { map } = require('missing-math')

const roundPrecision = precision => v => +v.toFixed(precision)

module.exports = class GeoJSONBoundingBox {
  constructor (geojson) {
    // NOTE: <geojson-bounds>.extend returns [West, South, East, North]
    // SEE: https://github.com/jczaplew/geojson-bounds#extentgeojson
    const [xmin, ymax, xmax, ymin] = bounds.extent(geojson)
    this.xmin = xmin
    this.xmax = xmax
    this.ymin = ymin
    this.ymax = ymax

    this.width = Math.abs(xmax - xmin)
    this.height = Math.abs(ymax - ymin)
    this.ratio = this.width / this.height
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
