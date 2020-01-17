const path = require('path')
const fs = require('fs-extra')
const { Image } = require('canvas')
const { random } = require('missing-math')
const inside = require('point-in-polygon')
const AABB = require('../utils/AABB')
const pointAtLength = require('../utils/point-at-length')

const CACHE = {}

module.exports = class Pattern {
  constructor (raw, { root = process.cwd() } = {}) {
    this.raw = raw

    this.repeat = raw['repeat'] || [10, 10]
    this.jitter = raw['jitter'] || [0, 0]

    this.symbols = raw.symbols.map(symbolPath => {
      if (!CACHE[symbolPath]) {
        CACHE[symbolPath] = fs.readFileSync(path.resolve(root, symbolPath))
      }

      const image = new Image()
      image.src = CACHE[symbolPath]
      return image
    })
  }

  fill (ctx, polygon) {
    const aabb = AABB(polygon)

    for (let x = aabb.xmin; x < aabb.xmax; x += this.repeat[0]) {
      for (let y = aabb.ymin; y < aabb.ymax; y += this.repeat[1]) {
        const jitterX = random(-this.jitter[0], this.jitter[0])
        const jitterY = random(-this.jitter[1], this.jitter[1])
        if (inside([x + jitterX, y + jitterY], polygon)) {
          const symbol = this.symbols[0]
          const xoff = -symbol.width / 2
          const yoff = -symbol.height / 2
          ctx.drawImage(symbol, x + jitterX + xoff, y + jitterY + yoff)
        }
      }
    }
  }

  stroke (ctx, polyline) {
    let point = pointAtLength(0, polyline)
    let distance = 0
    while (point) {
      const symbol = this.symbols[0]

      const jitterX = random(-this.jitter[0], this.jitter[0])
      const jitterY = random(-this.jitter[1], this.jitter[1])
      const xoff = -symbol.width / 2
      const yoff = -symbol.height / 2

      ctx.save()
      ctx.translate(point[0], point[1])
      ctx.rotate(point[2])
      ctx.drawImage(symbol, xoff + jitterX, yoff + jitterY)
      ctx.restore()

      distance += this.repeat[0]
      point = pointAtLength(distance, polyline)
    }
  }
}
