#!/usr/bin/env node

const pkg = require('../package.json')
const build = require('../lib')

process.title = pkg.name
console.time(pkg.name)

const argv = require('minimist')(process.argv.slice(2), {
  alias: { i: 'input', o: 'output' },
  default: {
    input: undefined,
    output: process.cwd()
  }
})

build()
console.timeEnd(pkg.name)
