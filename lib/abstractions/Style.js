const path = require('path')
const fs = require('fs-extra')
const { Image } = require('canvas')
const TypedSchema = require('./TypedSchema')
const polylabel = require('polylabel')
const safeEval = require('safe-eval')
const textPath = require('../utils/canvas-text-path')

const CACHE = {}
const SCHEMA = new TypedSchema({
  selector: 'string',
  hidden: 'boolean',
  tolerance: 'number',
  fill: {
    color: 'string',
    pattern: 'string'
  },
  stroke: {
    color: 'string',
    weight: 'number',
    join: 'string',
    cap: 'string',
    dash: ['number', 'number'],
    outline: {
      color: 'string',
      weight: 'number',
      join: 'string',
      cap: 'string'
    },
    arrows: {
      size: 'number',
      start: 'boolean',
      end: 'boolean'
    }
  },
  label: {
    value: 'string',
    size: 'number',
    font: 'string',
    align: 'string',
    color: 'string',
    repeat: 'number',
    offset: ['number', 'number'],
    outline: {
      color: 'string',
      weight: 'number'
    }
  }
}, 'Style')

module.exports = class Style {
  static get SCHEMA () { return SCHEMA }
  constructor (raw, {
    root = process.cwd(),
    resolution = 72
  } = {}) {
    Style.SCHEMA.validate(raw)

    this.raw = raw

    // We iterate through the whole schema and scale all numbers so that the
    // expected render is accurate no matter which resolution is used
    const computed = Style.SCHEMA.map(raw, ({ value, path }) => {
      return typeof value === 'number'
        ? value * (resolution / 72)
        : value
    })

    this.hidden = computed.hidden
    this.selector = computed.selector
    this.tolerance = computed.tolerance || 1

    this.fill = computed.fill
    this.stroke = computed.stroke

    if (raw.fill && raw.fill.pattern) {
      CACHE[raw.fill.pattern] = CACHE[raw.fill.pattern] || fs.readFileSync(path.resolve(root, raw.fill.pattern))
      this.fillSymbol = new Image()
      this.fillSymbol.src = CACHE[raw.fill.pattern]
    }

    this.label = computed.label
  }

  match (feature, { zoom } = {}) {
    // If no selector, match all features
    return this.selector ? safeEval(this.selector, { ...feature, zoom }) : true
  }

  apply (ctx) {
    ctx.fillStyle = this.fill ? this.fill.color : 'transparent'
    this._applyStroke(ctx, this.stroke)
  }

  _applyStroke (ctx, stroke) {
    if (!stroke) {
      ctx.strokeStyle = 'transparent'
      return
    }

    ctx.setLineDash(stroke.dash || [])
    ctx.strokeStyle = stroke.color || 'transparent'
    ctx.lineCap = stroke.cap || 'butt'
    ctx.lineJoin = stroke.join || 'miter'
    ctx.lineWidth = stroke.weight || 1
  }

  get hasStrokeOutline () {
    return this.STROKE_OUTLINE_RENDERING !== false &&
      this.stroke &&
      this.stroke.outline &&
      Object.keys(this.stroke.outline).length
  }

  renderStrokeOutline (ctx, feature, render) {
    if (!this.hasStrokeOutline) return

    ctx.save()
    this.stroke.outline.cap = this.stroke.outline.cap || this.stroke.cap
    this.stroke.outline.join = this.stroke.outline.join || this.stroke.join
    this._applyStroke(ctx, this.stroke.outline)

    // NOTE: making sure stroke outline rendering is disabled during the inner
    // call to avoid infinite recursion
    this.STROKE_OUTLINE_RENDERING = false
    render.bind(feature)({ ctx, style: this })
    this.STROKE_OUTLINE_RENDERING = true

    ctx.restore()
  }

  get hasFillPattern () { return this.fill && this.fill.pattern && this.fillSymbol }
  applyFillPattern (ctx) {
    if (!this.hasFillPattern) return
    this.fillPattern = this.fillPattern || ctx.createPattern(this.fillSymbol, 'repeat')
    ctx.fillStyle = this.fillPattern
  }

  _getFeatureLabel (feature) {
    if (!this.label) return
    return safeEval(this.label.value || 'undefined', feature)
  }

  _applyLabel (ctx) {
    if (!this.label) return
    ctx.fillStyle = this.label.color || 'black'
    ctx.textAlign = this.label.align || 'center'
    ctx.font = `${this.label.size || 10}px ${this.label.font || 'arial'}`

    if (!this.label.outline) return
    ctx.strokeStyle = this.label.outline.color || 'transparent'
    ctx.lineWidth = this.label.outline.weight || 1
  }

  _renderLabel (ctx, feature, position) {
    if (!this.label) return
    const label = this._getFeatureLabel(feature)
    if (!label) return

    const offset = this.label.offset || [0, 0]

    ctx.save()
    this._applyLabel(ctx)
    if (this.label.outline) ctx.strokeText(label, position[0] + offset[0], position[1] + offset[1])
    ctx.fillText(label, position[0] + offset[0], position[1] + offset[1])
    ctx.restore()
  }

  createArrows (path) {
    const arrows = []
    if (!this.stroke.arrows) return arrows

    const size = (this.stroke.arrows.size || 2.5) * (this.stroke.weight || 1)
    const arrow = (a, b) => {
      if (!a || !b) return
      const theta = Math.atan2(b[1] - a[1], b[0] - a[0])
      arrows.push([
        [
          a[0] + Math.cos(theta + Math.PI * 0.25) * size,
          a[1] + Math.sin(theta + Math.PI * 0.25) * size
        ],
        a,
        [
          a[0] + Math.cos(theta + Math.PI * 1.75) * size,
          a[1] + Math.sin(theta + Math.PI * 1.75) * size
        ]
      ])
    }

    if (this.stroke.arrows.start) arrows.push(arrow(path[0], path[1]))
    if (this.stroke.arrows.end) arrows.push(arrow(path[path.length - 1], path[path.length - 2]))

    return arrows.filter(Boolean)
  }

  renderPointlabel (ctx, feature) {
    this._renderLabel(
      ctx,
      feature,
      feature.geometry.coordinates
    )
  }

  renderPolylabel (ctx, feature) {
    this._renderLabel(
      ctx,
      feature,
      polylabel(feature.geometry.coordinates, 1.0)
    )
  }

  renderStringlabel (ctx, feature) {
    if (!this.label) return
    ctx.save()
    this._applyLabel(ctx)
    textPath(ctx, this._getFeatureLabel(feature), feature.geometry.coordinates, this.label)
    ctx.restore()
  }
}
