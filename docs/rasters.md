# docs/rasters

<br>

## Defining rasters

Rasters are defined as a top-level `JSON` array:
###### `style.json`
```json
[
  {
    "src": "raster.tiff",
    "opacity": 0.3,
    "before": "previous.parent && parent !== previous.parent && parent === 'name'"
  },
  {
    "src": "raster.tiff",
    "opacity": 1,
    "before": "zoom > 1 && properties.foo === 'bar'"
  },
  …
]
```

## Using the `before` property

The `before` property is a string which will be [`eval`](https://www.npmjs.com/package/safe-eval) in the context of a feature. The rasters will be rendered immediately before a given feature if the evaluation returns a truthy value for its context. Additionally, a `zoom` is exposed in the context.

### Rasters order

If multiple rasters can be rendered before a specific feature, the z-order will be the same as defined in the `JSON` array.

