const tmp = require('tmp')
const path = require('path')
const fs = require('fs-extra')
const pkg = require('../package.json')
const build = require('../lib')

const options = {
  verbose: false,
  output: tmp.dirSync({ prefix: pkg.name + '__', keep: true }).name,
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

    const { files, warnings } = await build(geojson, stylesheet, options)
    console.timeEnd(pkg.name)

    Object.entries(warnings).forEach(([flag, values]) => {
      if (!values || !values.length) return
      console.warn(`\n[WARNING] ${flag}:`)
      console.warn(values)
    })

    console.log('\n' + files.join('\n'))
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
})()
