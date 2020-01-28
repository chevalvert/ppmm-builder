const Style = require('./Style')

module.exports = class Stylesheet {
  static get DEFAULT () {
    return new Stylesheet([{ stroke: { color: 'black' } }])
  }

  constructor (raw, {
    root = process.cwd(),
    resolution = 72
  } = {}) {
    if (!Array.isArray(raw)) {
      throw new TypeError(`Expect Stylesheet constructor to consume an array, got '${typeof raw}' instead`)
    }

    this.raw = raw
    this.styles = raw.map(o => new Style(o, { root, resolution }))

    this.stylesReversed = this.styles.reverse()
  }

  match (feature, { zoom } = {}) {
    // Only the last matched style should be applied to the feature
    return this.stylesReversed
      .findIndex(style => style.match(feature, { zoom }))
  }

  get (index) {
    return this.styles[index]
  }
}
