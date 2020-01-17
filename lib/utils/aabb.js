module.exports = points => {
  let xmin = Number.POSITIVE_INFINITY
  let ymin = Number.POSITIVE_INFINITY
  let xmax = Number.NEGATIVE_INFINITY
  let ymax = Number.NEGATIVE_INFINITY

  points.forEach(([x, y]) => {
    if (x < xmin) xmin = x
    if (y < ymin) ymin = y
    if (x > xmax) xmax = x
    if (y > ymax) ymax = y
  })

  const width = xmax - xmin
  const height = ymax - ymin

  return {
    xmin,
    ymin,
    xmax,
    ymax,
    width,
    height,
    center: [xmin + width / 2, ymin + height / 2]
  }
}
