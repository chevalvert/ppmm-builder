#!/usr/bin/env node

const fs = require('fs-extra')
const path = require('path')
const pkg = require('../package.json')
const build = require('../lib')

const argv = require('minimist')(process.argv.slice(2), {
  boolean: ['help', 'porcelain', 'verbose', 'version', 'progress'],
  alias: { i: 'input', o: 'output', h: 'help', v: 'version' },
  string: [
    'background-color',
    'bbox',
    'input',
    'output',
    'padding',
    'precision',
    'quality',
    'stylesheet',
    'tile-size',
    'zoom'
  ]
})

if (argv.help) {
  console.log(pkg.name)
  console.log(pkg.description, '\n')
  console.log(fs.readFileSync(path.join(__dirname, 'USAGE'), 'utf8'))
  process.exit(0)
}

if (argv.version) {
  console.log(pkg.version)
  process.exit(0)
}

const input = process.stdin.isTTY
  ? fs.createReadStream(path.resolve(process.cwd(), argv.input))
  : process.stdin

if (!input) {
  console.error(`No input given.\nTry 'ppmm-builder --input file.geojson'`)
  process.exit(1)
}

const stylesheet = argv.stylesheet && path.resolve(process.cwd(), argv.stylesheet)
if (!stylesheet) {
  console.error(`No stylesheet given.\nTry 'ppmm-builder --stylesheet style.json'`)
  process.exit(1)
}

const porcelain = argv.porcelain || !process.stdout.isTTY
const options = {
  verbose: argv.verbose && !porcelain,
  progress: argv.progress && !porcelain,
  tileSize: argv['tile-size'] && +argv['tile-size'],
  boundingBox: (argv.bbox && argv.bbox.length)
    ? argv.bbox.split(',').map(v => +v.trim())
    : undefined,
  backgroundColor: argv['background-color'],
  padding: argv.padding && +argv.padding,
  precision: argv.precision && +argv.precision,
  zoom: argv.zoom && +argv.zoom,
  quality: argv.quality,
  root: path.dirname(stylesheet),
  output: argv.output || process.cwd()
}

;(async () => {
  try {
    !porcelain && console.time(pkg.name)

    const { files } = await build(
      input,
      await fs.readJson(stylesheet, 'utf8'),
      options
    )

    porcelain ? console.log(files.join('\n')) : console.timeEnd(pkg.name)
  } catch (error) {
    console.error(options.verbose ? error : error.message)
    process.exit(1)
  }
})()
