# docs/styles

* [Defining styles](#defining-styles)
* [Using the `selector` property](#using-the-selector-property)
  + [Style order](#style-order)
  + [Default style](#default-style)
  + [Select by `FeatureCollection` name](#select-by-featurecollection-name)
* [Outlining strokes](#outlining-strokes)
* [Simplifying features geometries](#simplifying-features-geometries)
* [Rendering features label](#rendering-features-label)
* [Skipping feature rendering](#skipping-feature-rendering)

<br>

## Defining styles

Styles are defined as a top-level `JSON` array:
###### `style.json`
```json
[
  {
    "selector": "properties.foo === 'bar'",
    "tolerance": "2",
    "fill": {
      "color": "rgba(0, 0, 0, 0.5)",
      "pattern": "symbol.svg"
    },
    "stroke": {
      "color": "white",
      "weight": 5,
      "join": "round",
      "cap": "square",
      "dash": [10, 5],
      "outline": {
        "color": "black",
        "weight": 10,
        "join": "mitter",
        "cap": "square"
      }
    },
    "label": {
      "value": "properties.name",
      "size": 20,
      "font": "friction mono alt",
      "align": "center",
      "color": "black",
      "repeat": 10,
      "offset": [0, 0],
      "outline": {
        "color": "white",
        "weight": 2
      }
    }
  },
  …
]
```

## Using the `selector` property

The `selector` property is a string which will be [`eval`](https://www.npmjs.com/package/safe-eval) in the context of a feature. The style will be applied to a given feature if the evaluation returns a truthy value for its context.

### Style order

Only the last matched style will be applied to the feature. For now, there is no inheritance logic.

### Default style

A style without a `selector` property will be matched against each feature. As only the last matched style is applied, it is recommanded to place a default style at the beginining of its array.

### Select by `FeatureCollection` name

When streaming multiple files (ie using `$ cat *.geojson | ppmm-builder`), it can be useful to target features by their `FeatureCollection`.

If your `FeatureCollection` has a `name` property, each of its features will inherit a `parent` top-level prop which can be used in a selector:

###### `style.json`
```json
[
  {
    "selector": "parent === 'FeatureCollection_1' && properties.foo === 'bar'",
    …
  },
  …
]
```
<sup>**Tip:** rendering order is determined by files order in the input stream. This order can be easily defined using `bash` auto-expansion: `$ cat {countries,road,names}.geojson | ppmm-builder`.
</sup>


## Outlining strokes

A `outline` property can be declared inside the `stroke` object of a style to define an additional stroke around a stroke. It takes the sames properties than the default `stroke` object, minus `pattern` and the `outline` prop itself.

## Simplifying features geometries

A `tolerance` property can be declared inside a style to simplify matching features geometries using [`simplify-path`](https://github.com/mattdesl/simplify-path). Its value is expressed in pixels.


## Rendering features label

A `label` object can be declared inside a style to define label rendering.
Like `selector`, the `value` key is evaled with the feature context so that you can use its properties as a label value.

Note that custom font will need to be installed on your system as this module does not handle font file registration yet.

Label will be placed depending of its feature's type:
- on `Polygon` the label will be placed at [_pole of inaccessibility_](https://github.com/mapbox/polylabel#polylabel-)
- on `String` the label will be placed along the path every `repeat` interval
- on `Point` the label will placed at the point's coordinates

## Skipping feature rendering

A `hidden` property can be declared inside a style to skip its rendering:

###### `style.json`
```json
[
  {
    "selector": "properties.IMPORTANCE === 0",
    "hidden": true
  },
  …
]
```
