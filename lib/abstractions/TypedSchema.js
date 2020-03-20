const dotProp = require('dot-prop')

function walkRecursive (obj = {}, callback = function () {}, path = []) {
  if (obj === undefined) return
  if (typeof obj !== 'object' || obj === null) {
    return callback({ value: obj, path }) // eslint-disable-line standard/no-callback-literal
  }

  // Handle nested TypedSchema
  if (obj instanceof TypedSchema) {
    return callback({ value: obj.schema, path }) // eslint-disable-line standard/no-callback-literal
  }

  Object.entries(obj).forEach(([key, value]) => {
    walkRecursive(value, callback, [...path, key])
  })
}

class TypedSchema {
  constructor (schema, name = 'Untitled') {
    this.name = name

    // Handle nested TypedSchema
    this.schema = this.map(schema, ({ value, path }) => {
      return (value instanceof TypedSchema) ? value.schema : value
    })
  }

  get prefix () {
    return `${this.name} schema:`
  }

  pathInSchema (path) {
    return dotProp.get(this.schema, path.join('.'))
  }

  validate (obj) {
    walkRecursive(obj, ({ value, path }) => {
      const expectedType = this.pathInSchema(path)
      if (!expectedType) {
        throw new Error(`${this.prefix} ${path.join('.')} is not in schema.`)
      }

      const type = typeof value
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

module.exports = TypedSchema
