const tmp = require('tmp')
const path = require('path')
const fs = require('fs-extra')
const bounds = require('geojson-bounds')

const pkg = require('../package.json')
const build = require('../lib')

const PATHS = {
  geojson: path.join(__dirname, 'sample.geojson'),
  style: path.join(__dirname, 'style.json')
}

// NOTE: automatically computing the geojson bbox of the sample file to simplify
// on-the-fly edits of the sample. This of course defeats the principle of using
// streams to avoid memory-intensive computation, but this is a test with a
// small sample.
const geojson = fs.readJsonSync(PATHS.geojson, 'utf8')
const boundingBox = bounds.extent(geojson)

const options = {
  boundingBox,
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

    const { files, warnings } = await build(
      fs.createReadStream(PATHS.geojson),
      await fs.readJson(PATHS.style, 'utf8'),
      options
    )

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
