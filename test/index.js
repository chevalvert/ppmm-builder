const tmp = require('tmp')
const path = require('path')
const fs = require('fs-extra')
const bounds = require('geojson-bounds')

const pkg = require('../package.json')
const build = require('../lib')

const PATHS = {
  geojson: path.join(__dirname, 'sample.geojson'),
  styles: path.join(__dirname, 'styles.json')
}

// NOTE: automatically computing the geojson bbox of the sample file to simplify
// on-the-fly edits of the sample. This of course defeats the principle of using
// streams to avoid memory-intensive computation, but this is a test with a
// small sample.
const geojson = fs.readJsonSync(PATHS.geojson, 'utf8')
const styles = fs.readJsonSync(PATHS.styles, 'utf8')
const boundingBox = bounds.extent(geojson)

const options = {
  stylesArray: styles,
  boundingBox,
  verbose: true,
  progress: true,
  output: tmp.dirSync({ prefix: pkg.name + '__', keep: true }).name,
  tileSize: 512,
  zoom: 0,
  backgroundColor: 'white'
}

;(async () => {
  try {
    console.time(pkg.name)
    const { files, warnings } = await build(fs.createReadStream(PATHS.geojson), options)
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
