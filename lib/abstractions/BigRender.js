const Render = require('./Render')

/**
 * IMPORTANT:
 * Due to limitations of node-canvas and Cairo, huge maps (ZOOM ≥ 6) cannot
 * be rendered in one go, and should be splitted in multiple regions.
 * This BigRender class acts as a proxy for the Render class.
 *
 * NOTE: This is a class used as a composition for abstractions/Render: see
 * abstractions/Render for details about rendering implementation.
 */

const MIN_ZOOM = 6

module.exports = class BigRender {
  static get MIN_ZOOM () {
    return MIN_ZOOM
  }

  constructor (options) {
    this.renderers = []
    this.zoom = options.zoom

    const tilesBySide = 2 ** this.zoom
    const steps = Math.max(1, 2 ** (this.zoom - MIN_ZOOM))
    const regionSize = tilesBySide / steps
    for (let i = 0; i < steps; i++) {
      for (let j = 0; j < steps; j++) {
        const region = [
          regionSize * i,
          regionSize * j,
          regionSize * (i + 1),
          regionSize * (j + 1)
        ]

        const render = new Render(Object.assign({}, options, {
          region,
          // TODO: find a more explicit way of handling DPI clamping
          resolution: 72
        }))
        this.renderers.push(render)
      }
    }
  }

  get SKIPPED () {
    return this.renderers.reduce((sum, r) => sum + r.SKIPPED, 0)
  }

  renderRasters (...args) {
    this.renderers.forEach(r => r.renderRasters(...args))
  }

  renderFeature (...args) {
    this.renderers.forEach(r => r.renderFeature(...args))
  }

  async write (...args) {
    const files = []
    for (let render of this.renderers) {
      const renderedFiles = await render.write(...args)
      files.push(renderedFiles)
    }
    return files
  }
}
