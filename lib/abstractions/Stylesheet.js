const Style = require('./Style')

module.exports = class Stylesheet {
  constructor (raw, { root = process.cwd() } = {}) {
    if (!Array.isArray(raw)) {
      throw new TypeError(`Expect Stylesheet constructor to consume an array, got '${typeof raw}' instead`)
    }

    this.raw = raw
    this.styles = raw.map(o => new Style(o, { root }))
  }

  match (feature) {
    // Only the last matched style should be applied to the feature
    return this.styles
      .reverse()
      .findIndex(style => style.match(feature))
  }

  get (index) {
    return this.styles[index]
  }
}
