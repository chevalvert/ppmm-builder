const { chain } = require('stream-chain')
const { parser } = require('stream-json')
const { pick } = require('stream-json/filters/Pick')
const { streamArray } = require('stream-json/streamers/StreamArray')

module.exports = (geoJSONStream, {
  validate = feature => true,
  filter = feature => true,
  transform = feature => feature,
  callback = function () {}
} = {}) => new Promise((resolve, reject) => {
  // NOTE: the bbox.value is initially empty as we do not know yet if a bbox is
  // present in the stream.
  // During the stream, and especially at early stage, bbox will try and steal
  // data from the main pipeline to build itself upon completion. It will use
  // any numeric value it will find on the first 4 indexes, which should be the
  // bbox (see `pick({ filter })` in the pipeline).
  // Once built, it will act as a passthrough pipe for the data.
  const bbox = {
    value: [],
    complete: false,
    steal: function (data) {
      if (this.complete) return data
      if (data.key > 4) return data
      if (typeof data.value !== 'number') return data

      this.value.push(data.value)
      if (this.value.length === 4) this.complete = true
    }
  }

  const pipeline = chain([
    geoJSONStream,
    parser({ jsonStreaming: true }),
    // Cherry pick only chunk after bbox and features keys
    pick({ filter: stack => stack[0] === 'bbox' || stack[0] === 'features' }),
    streamArray(),
    // bbox doing its thing, nothing to see here, move along…
    data => bbox.steal(data),
    data => (validate(data.value) && filter(data.value))
      ? transform(data.value, bbox.value)
      : null
  ])

  let index = 0
  pipeline.on('data', feature => callback(feature, ++index))

  pipeline.on('end', resolve)
  pipeline.on('error', reject)
})
