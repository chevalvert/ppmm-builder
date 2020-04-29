#!/usr/bin/env node

const fs = require('fs-extra')
const path = require('path')
const pkg = require('../package.json')
const build = require('../lib')

const argv = require('minimist')(process.argv.slice(2), {
  boolean: ['help', 'porcelain', 'verbose', 'version', 'progress', 'skip-empty', 'rewind'],
  alias: { i: 'input', o: 'output', h: 'help', v: 'version' },
  string: [
    'antialias',
    'background-color',
    'bbox',
    'compression',
    'input',
    'output',
    'padding',
    'precision',
    'quality',
    'rasters',
    'region',
    'resolution',
    'styles',
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

const porcelain = argv.porcelain || !process.stdout.isTTY
const options = {
  stylesArray: argv.styles && fs.readJsonSync(argv.styles, 'utf8'),
  stylesRoot: argv.styles && path.dirname(argv.styles),

  rastersArray: argv.rasters && fs.readJsonSync(argv.rasters, 'utf8'),
  rastersRoot: argv.rasters && path.dirname(argv.rasters),

  verbose: argv.verbose && !porcelain,
  progress: argv.progress && !porcelain,

  enforceRightHandRule: argv.rewind,

  zoomLevels: argv.zoom && argv.zoom.split(/,|\s/).map(v => +v.trim()),
  tileSize: argv['tile-size'] && +argv['tile-size'],
  region: argv['region'] && argv['region'].split(',').map(v => +v.trim()),

  boundingBox: (argv.bbox && argv.bbox.length)
    ? argv.bbox.split(',').map(v => +v.trim())
    : undefined,
  backgroundColor: argv['background-color'],
  padding: argv.padding && +argv.padding,
  precision: argv.precision && +argv.precision,

  resolution: argv.resolution && +argv.resolution,
  compression: argv.compression && +argv.compression,
  quality: argv.quality,
  antialias: argv.antialias,

  skipEmpty: argv['skip-empty'],
  output: argv.output || process.cwd()
}

;(async () => {
  try {
    !porcelain && console.time(pkg.name)
    const { files, warnings } = await build(input, options)
    options.verbose && console.error(warnings)
    porcelain ? console.log(files.join('\n')) : console.timeEnd(pkg.name)
  } catch (error) {
    console.error(options.verbose ? error : error.message)
    process.exit(1)
  }
})()
