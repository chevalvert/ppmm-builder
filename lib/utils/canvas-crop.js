const fs = require('fs-extra')
const { createCanvas } = require('canvas')

module.exports = (src, file, [x, y, width, height], {
  quality = 'best'
} = {}) => new Promise((resolve, reject) => {
  fs.ensureFileSync(file)
  const output = fs.createWriteStream(file)

  const canvas = createCanvas(width, height)
  const stream = canvas.pngStream()
  stream.pipe(output)
  stream.on('error', reject)
  stream.on('end', () => resolve(file))

  const ctx = canvas.getContext('2d')
  ctx.quality = quality
  ctx.drawImage(src, x, y, width, height, 0, 0, width, height)
})
