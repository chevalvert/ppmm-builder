module.exports = class TileRegion {
  constructor (rect, {
    tileLength = 1,
    tileSize = 256,
    resolution = 72
  } = {}) {
    if (rect.length !== 4) {
      throw new Error(`Region should be of the form [X1, Y1, X2, Y2], got ${rect}`)
    }

    // Tile coordinates
    this.rect = [...rect]
    this.rect[0] = Math.max(0, this.rect[0])
    this.rect[1] = Math.min(this.rect[1], tileLength)
    this.rect[2] = Math.max(0, this.rect[2] + 1)
    this.rect[3] = Math.min(this.rect[3] + 1, tileLength)

    this.rectWidth = Math.abs(this.rect[2] - this.rect[0])
    this.rectHeight = Math.abs(this.rect[3] - this.rect[1])

    // Pixel coordinates
    const [x1, y1, x2, y2] = this.rect.map(v => v * tileSize * (resolution / 72))
    this.offset = [x1, y1]
    this.width = Math.abs(x2 - x1)
    this.height = Math.abs(y2 - y1)
  }
}
