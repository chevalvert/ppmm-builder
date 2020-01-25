const fs = require('fs-extra')
const { createCanvas, PNG_ALL_FILTERS } = require('canvas')

module.exports = (src, file, [x, y, width, height], {
  quality = 'best',
  antialias = 'default',
  compression = 6,
  resolution = 72
} = {}) => new Promise((resolve, reject) => {
  fs.ensureFileSync(file)
  const output = fs.createWriteStream(file)

  const canvas = createCanvas(width, height)
  const stream = canvas.pngStream({
    compressionLevel: compression,
    filters: PNG_ALL_FILTERS,
    resolution
  })
  stream.pipe(output)
  stream.on('error', reject)
  stream.on('end', () => resolve(file))

  const ctx = canvas.getContext('2d')
  ctx.quality = quality
  ctx.antialias = antialias
  ctx.drawImage(src, x, y, src.width, src.height, 0, 0, width, height)
})
