const fs = require('fs-extra')
const path = require('path')
const pkg = require('../package.json')
const build = require('../lib')

console.time(pkg.name)

const geojson = fs.readJsonSync(path.join(__dirname, 'sample.geojson'), 'utf8')
const stylesheet = fs.readJsonSync(path.join(__dirname, 'style.json'), 'utf8')

build(geojson, stylesheet, {
  root: path.join(__dirname),
  size: 512,
  padding: 20,
  output: path.join(__dirname, 'output.png'),
  backgroundColor: 'white'
})

console.timeEnd(pkg.name)
