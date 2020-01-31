// returns true if all color channels in each pixel are 0 (or "blank")
module.exports = canvas => !canvas
  .getContext('2d')
  .getImageData(0, 0, canvas.width, canvas.height)
  .data
  .find(Boolean)
