// TODO
// ??? export a points.json ?
module.exports = function render ({ ctx, style }) {
  ctx.fillStyle = 'black'
  ctx.fillRect(this.geometry.coordinates[0] - 5, this.geometry.coordinates[1] - 5, 10, 10)
}
