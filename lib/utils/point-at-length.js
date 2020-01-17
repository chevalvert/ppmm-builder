const { lerp } = require('missing-math')
const distance = require('./distance')

module.exports = (dist, points) => {
  for (let index = 0; index < points.length; index++) {
    const current = points[index]
    const next = points[index + 1]
    if (!next) return

    const segmentLength = distance(current, next)
    if (dist <= segmentLength) {
      return [
        lerp(current[0], next[0], dist / segmentLength),
        lerp(current[1], next[1], dist / segmentLength),
        Math.atan2(current[1] - next[1], current[0] - next[0])
      ]
    }

    dist -= segmentLength
  }
}
