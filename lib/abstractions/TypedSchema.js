const dotProp = require('dot-prop')

function walkRecursive (obj = {}, callback = function () {}, path = []) {
  if (obj === undefined) return
  if (typeof obj !== 'object' || obj === null) {
    return callback({ value: obj, path }) // eslint-disable-line standard/no-callback-literal
  }

  Object.entries(obj).forEach(([key, value]) => {
    walkRecursive(value, callback, [...path, key])
  })
}

module.exports = class TypedSchema {
  constructor (schema, name = 'Untitled') {
    this.name = name
    this.schema = schema
  }

  get prefix () {
    return `${this.name} schema:`
  }

  pathInSchema (path) {
    return dotProp.get(this.schema, path.join('.'))
  }

  validate (obj) {
    walkRecursive(obj, ({ value, path }) => {
      if (!this.pathInSchema(path)) {
        throw new Error(`${this.prefix} ${path.join('.')} is not in schema.`)
      }

      const type = typeof value
      const expectedType = dotProp.get(this.schema, path.join('.'))
      if (type !== expectedType) {
        throw new TypeError(`${this.prefix} ${path.join('.')} should be a ${expectedType}, got ${type} instead.`)
      }
    })
  }

  map (obj, transform) {
    walkRecursive(obj, ({ value, path }) => {
      dotProp.set(obj, path.join('.'), transform({ path, value }))
    })

    return obj
  }
}
