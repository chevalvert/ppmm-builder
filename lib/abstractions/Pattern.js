const path = require('path')
const fs = require('fs-extra')
const { Image } = require('canvas')
const { random } = require('missing-math')
const inside = require('point-in-polygon')
const TypedSchema = require('./TypedSchema')
const AABB = require('./AABB')
const pointAtLength = require('../utils/point-at-length')
const isClockwise = require('is-clockwise')
const randomOf = require('../utils/array-random')

const CACHE = {}
const SCHEMA = new TypedSchema({
  symbols: ['string', 'string', 'string', 'string'],
  repeat: ['number', 'number'],
  jitter: ['number', 'number']
}, 'Pattern')

module.exports = class Pattern {
  static get SCHEMA () { return SCHEMA }
  constructor (raw, { root = process.cwd() } = {}) {
    this.raw = raw

    this.repeat = raw['repeat'] || [10, 10]
    this.jitter = raw['jitter'] || [0, 0]
    this.symbols = (raw.symbols || []).map(symbolPath => {
      if (!CACHE[symbolPath]) {
        CACHE[symbolPath] = fs.readFileSync(path.resolve(root, symbolPath))
      }

      const image = new Image()
      image.src = CACHE[symbolPath]
      return image
    })
  }

  fill (ctx, polygon) {
    if (!this.symbols || !this.symbols.length) return
    if (!isClockwise(polygon)) return
    const aabb = AABB.fromPoints(polygon)
    const usedSymbols = []
    for (let y = aabb.ymin; y < aabb.ymax; y += this.repeat[1]) {
      for (let x = aabb.xmin; x < aabb.xmax; x += this.repeat[0]) {
        const [i, j] = [(x - aabb.xmin) / this.repeat[0], (y - aabb.ymin) / this.repeat[1]]
        const symbol = randomOf(this.symbols, {
          exclude: [
            usedSymbols[(i - 1) + j * Math.ceil(aabb.width / this.repeat[0])],
            usedSymbols[i + (j - 1) * Math.ceil(aabb.width / this.repeat[1])]
          ]
        })
        usedSymbols.push(symbol)

        const jitterX = random(-this.jitter[0], this.jitter[0])
        const jitterY = random(-this.jitter[1], this.jitter[1])
        if (inside([x + jitterX, y + jitterY], polygon)) {
          const xoff = -symbol.width / 2
          const yoff = -symbol.height / 2
          ctx.drawImage(symbol, x + jitterX + xoff, y + jitterY + yoff)
        }
      }
    }
  }

  stroke (ctx, polyline) {
    if (!this.symbols || !this.symbols.length) return
    let point = pointAtLength(0, polyline)
    let distance = 0
    let lastUsedSymbol
    while (point) {
      const symbol = randomOf(this.symbols, { exclude: lastUsedSymbol })
      lastUsedSymbol = symbol

      const jitterX = random(-this.jitter[0], this.jitter[0])
      const jitterY = random(-this.jitter[1], this.jitter[1])
      const xoff = -symbol.width / 2
      const yoff = -symbol.height / 2

      ctx.save()
      ctx.translate(point[0], point[1])
      ctx.rotate(point[2] % (Math.PI - 0.01))
      ctx.drawImage(symbol, xoff + jitterX, yoff + jitterY)
      ctx.restore()

      distance += this.repeat[0]
      point = pointAtLength(distance, polyline)
    }
  }
}
