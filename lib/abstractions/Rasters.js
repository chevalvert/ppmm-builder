const GeoTiff = require('./GeoTiff')

module.exports = class Rasters {
  constructor (raw = [], { root = process.cwd() } = {}) {
    if (!Array.isArray(raw)) {
      throw new TypeError(`Expect Rasters constructor to consume an array, got '${typeof raw}' instead`)
    }

    this.raw = raw

    this.array = raw.map(r => new GeoTiff(r, { root }))
    this.renderable = [...this.array]
  }

  async preloadAll ({ verbose = false } = {}) {
    if (!this.array.length) return

    verbose && console.log(`\nPreloading ${this.array.length} raster${this.array.length > 1 ? 's' : ''}…`)
    return Promise.all(this.array.map(async (geotiff, index) => {
      verbose && console.time(geotiff.src)
      await geotiff.preload()
      verbose && console.timeEnd(geotiff.src)
    }))
  }

  removeFromRenderQueue (geotiff) {
    const index = this.renderable.indexOf(geotiff)
    if (index >= 0) this.renderable.splice(index, 1)
  }
}
