const crop = require('./canvas-crop')

module.exports = async (canvas, {
  tiles = [1, 1],
  tileSize = 256,
  verbose = false,
  quality = 'best',
  resolution = 72,
  antialias = 'default',
  compression = 6,
  skipEmpty = false,
  filePattern = (i, j) => `${i}-${j}.png`
} = {}) => {
  tileSize *= resolution / 72

  verbose && console.log('\nRendering tiles…')
  const files = []

  for (let j = 0; j < tiles[1]; j++) {
    for (let i = 0; i < tiles[0]; i++) {
      const filepath = filePattern(i, j)
      const rect = [i * tileSize, j * tileSize, tileSize, tileSize]

      verbose && console.time(filepath)
      const tile = await crop(canvas, filepath, rect, {
        quality,
        antialias,
        compression,
        resolution,
        skipEmpty
      })

      if (!tile) continue
      files.push(tile)

      verbose && console.timeEnd(filepath)
    }
  }

  return files
}
