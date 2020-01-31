const fs = require('fs-extra')
const { createCanvas, PNG_ALL_FILTERS } = require('canvas')
const isEmpty = require('./canvas-is-empty')

module.exports = (src, file, [x, y, width, height], {
  quality = 'best',
  antialias = 'default',
  compression = 6,
  resolution = 72,
  skipEmpty = false
} = {}) => new Promise((resolve, reject) => {
  fs.ensureFileSync(file)
  const output = fs.createWriteStream(file)

  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')
  ctx.quality = quality
  ctx.antialias = antialias
  ctx.drawImage(src, x, y, width, height, 0, 0, width, height)

  if (skipEmpty && isEmpty(canvas)) {
    resolve(null)
    return
  }

  const stream = canvas.pngStream({
    compressionLevel: compression,
    filters: PNG_ALL_FILTERS,
    resolution
  })
  stream.pipe(output)
  stream.on('error', reject)
  stream.on('end', () => resolve(file))
})
