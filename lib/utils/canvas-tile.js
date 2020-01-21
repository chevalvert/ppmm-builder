const crop = require('./canvas-crop')

module.exports = async (canvas, {
  tileLength = 1,
  tileSize = 256,
  verbose = false,
  quality = 'best',
  filePattern = (i, j) => `${i}-${j}.png`
} = {}) => {
  const files = []
  for (let j = 0; j < tileLength; j++) {
    for (let i = 0; i < tileLength; i++) {
      const filepath = filePattern(i, j)
      const rect = [i * tileSize, j * tileSize, tileSize, tileSize]

      verbose && console.time(filepath)
      files.push(await crop(canvas, filepath, rect, { quality }))
      verbose && console.timeEnd(filepath)
    }
  }

  return files
}
