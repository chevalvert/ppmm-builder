const isClockwise = require('is-clockwise')
const pointAtLength = require('../utils/point-at-length')

module.exports = (ctx, text, path, {
  repeat = 0,
  offset = [0, 0],
  outline = undefined
} = {}) => {
  let distance = 0
  let index = 0

  text = '' + text

  const charWidths = {}

  path = [...path].reverse()

  // We have to make sure that the path is draw in the correct orientation to
  // make sure that the text will be readable
  const isCW = isClockwise(path)
  const angleOffset = isCW ? Math.PI : 0
  if (!isCW) text = [...text].reverse().join('')

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  if (outline) {
    ctx.strokeStyle = outline.color || 'transparent'
    ctx.lineWidth = outline.weight || 1
  }

  while (true) {
    const char = text[index++]
    if (!char) {
      index = 0
      distance += repeat
      continue
    }

    if (!charWidths[char]) charWidths[char] = ctx.measureText(char).width
    distance += charWidths[char]

    const point = pointAtLength(distance, path)
    if (!point) break

    ctx.save()
    ctx.translate(point[0] + offset[0], point[1] + offset[1])
    ctx.rotate(point[2] + angleOffset)
    if (outline) ctx.strokeText(char, 0, 0)
    ctx.fillText(char, 0, 0)
    ctx.restore()
  }
}
