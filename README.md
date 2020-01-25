# ppmm-builder [<img src="https://github.com/chevalvert.png?size=100" align="right">](http://chevalvert.fr/)
> cli tool to generate tilemap from geojson

<br>

## Installation

```console
$ npm install --global chevalvert/ppmm-builder
```

## Usage

```
ppmm-builder

Usage:
  cat file.geojson | ppmm-builder --stylesheet=<style.json>
  cat *.geojson | ppmm-builder --stylesheet=<style.json>
  ppmm-builder --input file.geojson --stylesheet=<style.json>
  ppmm-builder --input file.geojson --stylesheet=<style.json> --output=<dir>
  ppmm-builder --input file.geojson --stylesheet=<style.json> --output=<dir> --zoom 3
  ppmm-builder --help
  ppmm-builder --version

Required:
  --stylesheet=<style.json>

Options:
  -h, --help       Show this screen
  -v, --version    Print the current version

  -i, --input      DEfine the geojson file used as input stream (default: stdin)
  -o, --output     Define the output directory (default: CWD)

  --porcelain      Make sure the output is parsable
  --verbose        Log additional informations (not compatible with --porcelain)
  --progress       Log rendering progress (not compatible with --porcelain)

  --zoom           Set the zoom level of the tilemap (default: 0)
  --tile-size      Set the default size of a tile in pixels (default: 256)

  --bbox           Provide a custom bounding box for the geojson
  --background-color
                   Set the background color of each tile (default: transparent)
  --padding        Set the padding of the global map in pixels (default: 0)
  --precision      Set the float precision of canvas rendering (default: 0)
                   Follows the geographic standard 'WEST,SOUTH,EAST,NORTH'

  --resolution     Set a custom resolution in PPI (default: 72)
  --compression    Set the PNG ZLIB compression from 0 to 9 (default: 6)
  --antialias      Set the anti-aliasing mode
                   Possible values are:
                   - 'default' (default)
                   - 'none'
                   - 'gray'
                   - 'subpixel'
  --quality        Set the quality of the canvas rendering
                   Possible values are:
                   - 'fast'
                   - 'good'
                   - 'best' (default)
                   - 'nearest'
                   - 'bilinear'

```

### Programmatic

```console
$ npm install --save chevalvert/ppmm-builder
```

```js
const build = require('ppmm-builder')

const geojson = {} // geojson stream. Note that right-hand-rule will be ensured during build
const style = {}   // see docs/style
const options = {} // see docs/options

// Using promises
build(geojson, style, options).then(result => {
  console.log(result.files)
  console.warn(result.warnings)
}).catch(console.error)

// Using async/await
;(async () => {
  try {
    const { files, warnings } = await build(geojson, style, options)
    console.log(files)
    console.warn(warnings)
  } catch (error) {
    console.error(error)
  }
})()
```

## Documentation

### Style
See [`docs/style`](docs/style.md).

### Options

```js
const options = {
  verbose = false,
  progress = false,

  zoom = 0,
  tileSize = 256, // px

  boundingBox = undefined, // follows geographic standard of [xmin, ymax, xmax, ymin]
  backgroundColor = 'transparent',
  padding = 0,
  precision = 0,

  resolution = 72, // ppi
  compression = 6, // 0~9
  quality = 'best', // 'fast'|'good'|'best'|'nearest'|'bilinear'
  antialias = 'default', // 'default'|'none'|'gray'|'subpixel'

  root = process.cwd(), // resolve symbol paths against this root
  output = process.cwd()
}
```



## Development

```console
$ git clone git@github.com:chevalvert/ppmm-builder.git
$ cd ppmm-builder
$ npm install
$ npm test
```

## License
[MIT.](https://tldrlegal.com/license/mit-license)
