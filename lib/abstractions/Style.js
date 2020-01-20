const Pattern = require('./Pattern')

module.exports = class Style {
  constructor (raw, { root = process.cwd() } = {}) {
    this.raw = raw
    this.hidden = raw.hidden

    this.tolerance = raw.tolerance || 1

    this.fill = raw.fill
    if (this.fill && this.fill.pattern) {
      this.fill.pattern = new Pattern(this.fill.pattern, { root })
    }

    this.stroke = raw.stroke
    if (this.stroke && this.stroke.pattern) {
      this.stroke.pattern = new Pattern(this.stroke.pattern, { root })
    }
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

  get hasFillPattern () { return this.fill && this.fill.pattern }
  renderFillPattern (ctx, polygon) {
    if (!this.hasFillPattern) return
    this.fill.pattern.fill(ctx, polygon)
  }

  get hasStrokePattern () { return this.stroke && this.stroke.pattern }
  renderStrokePattern (ctx, polygon) {
    if (!this.hasStrokePattern) return
    this.stroke.pattern.stroke(ctx, polygon)
  }
}
