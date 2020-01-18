const fs = require('fs-extra')
const path = require('path')
const pkg = require('../package.json')
const build = require('../lib')

const options = {
  output: path.join(__dirname, 'output'),
  root: path.join(__dirname),
  tileSize: 256,
  zoom: 0,
  padding: 20,
  backgroundColor: 'white'
}

;(async () => {
  try {
    console.time(pkg.name)

    const geojson = await fs.readJson(path.join(__dirname, 'sample.geojson'), 'utf8')
    const stylesheet = await fs.readJson(path.join(__dirname, 'style.json'), 'utf8')

    await build(geojson, stylesheet, options)
    console.timeEnd(pkg.name)
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
})()
