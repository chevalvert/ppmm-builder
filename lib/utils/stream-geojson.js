const { chain } = require('stream-chain')
const { parser } = require('stream-json')
const { pick } = require('stream-json/filters/Pick')
const { streamArray } = require('stream-json/streamers/StreamArray')

module.exports = (geoJSONStream, {
  validate = feature => true,
  filter = feature => true,
  transform = feature => feature,
  ondata = function () {}
} = {}) => new Promise((resolve, reject) => {
  // NOTE: the bbox.value is initially empty as we do not know yet if a bbox is
  // present in the stream.
  // During the stream, and especially at early stage, bbox will try and steal
  // data from the main pipeline to build itself upon completion. It will use
  // any numeric value it will find on the first 6 indexes, which should be the
  // bbox (see `pick({ filter })` in the pipeline).
  // Once built, it will act as a passthrough pipe for the data.
  const bbox = {
    value: [],
    complete: false,
    get isEmpty () { return !this.value.length },
    get isValid () { return this.complete && [4, 6].includes(this.value.length) },
    steal: function (data) {
      if (this.complete) return data
      if (data.key > 6 || typeof data.value !== 'number') {
        this.complete = true
        return data
      }

      this.value.push(data.value)
      return null
    },
    ensure2D: function () {
      switch (this.value.length) {
        case 4: return this.value
        case 6: return [0, 1, 3, 4].map(i => this.value[i])
        default: throw new Error(`Unexpected bbox.value length: ${this.value}`)
      }
    }
  }

  let lastFoundName
  const pipeline = chain([
    geoJSONStream,
    parser({ jsonStreaming: true }),
    pick({
      filter: (stack, chunk) => {
        // Using the filter stage to extract informations about a possible name
        // property, as this information may become handy when streaming multiple
        // geojson files at the same time
        if (stack[0] === 'name' && chunk.name === 'stringValue') {
          lastFoundName = chunk.value
        }

        // This is the actual filter
        return stack[0] === 'bbox' || stack[0] === 'features'
      }
    }),
    streamArray(),
    // bbox doing its thing, nothing to see here, move along…
    data => bbox.steal(data),
    data => (validate(data.value) && filter(data.value))
      ? transform({ feature: data.value, bbox, lastFoundName })
      : null
  ])

  let index = 0
  pipeline.on('data', feature => ondata(feature, index++))

  pipeline.on('end', resolve)
  pipeline.on('error', reject)
})
