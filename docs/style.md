# docs/style

## Defining style

###### `style.json`
```json
{
  …
  "__property": "FOO",
  "bar": {
    "tolerance": "2",
    "fill": {
      "color": "rgba(0, 0, 0, 0.5)",
      "pattern": {
        "symbols": ["symbol-1.svg", "symbol-2.png"],
        "repeat": [20, 20],
        "jitter":  [10, 10]
      }
    },
    "stroke": {
      "color": "white",
      "weight": 5,
      "join": "round",
      "cap": "square",
      "pattern": {
        "symbols": ["symbol-1.svg"],
        "repeat": [20, null],
        "jitter": [0, 10]
      },
      "outline": {
        "color": "black",
        "weight": 10,
        "join": "mitter",
        "cap": "square"
      }
    },
    "label": {
      "__property": "NAME",
      "size": 20,
      "font": "friction mono alt",
      "align": "center",
      "color": "black",
      "repeat": 10
    }
  },
  …
}
```

### Simplifying geometries
A `tolerance` property can be declared inside a style to simplify matching features geometries using [`simplify-path`](https://github.com/mattdesl/simplify-path). Its value is expressed in pixels.


### Rendering labels
A `label` object can be declared inside a style to define label rendering. Use the `__property` key to define which `feature.properties` will be used as a value for the label.

Note that custom font will need to be installed on your system as this module does not handle font file registration yet.

Label will be placed depending of its feature's type:
- on `Polygon` the label will be placed at [_pole of inaccessibility_](https://github.com/mapbox/polylabel#polylabel-)
- on `String` the label will be placed along the path every `repeat` interval
- on `Point` the label will placed at the point's coordinates

## Applying style

###### `map.geojson`
```geojson
[
  …
  {
    "type": …,
    "geometry": {…},
    "properties": {
      "hidden": false,
      "FOO": "bar"
    }
  },
  …
]
```

## Default style
You can define a default style for all features that do not match the `__property` selector.

###### `style.json`

```json
{
  "__default": {
    "color": …,
    "fill": …
  },
  …
}
```

## Select by `FeatureCollection` name
When streaming multiple files (ie using `$ cat *.geojson | ppmm-builder`), it can be useful to apply style by selecting each `FeatureCollection`.

If your `FeatureCollection` has a `name` property, each of its feature will inherit a `__assumed_parent` custom property which can be used as a style selector:

###### `style.json`
```json
{
  "__property": "__assumed_parent",
  "FeatureCollection_1": {…},
  "FeatureCollection_2": {…},
  …
}
```
<sup>**Tip:** rendering order is determined by files order in the input stream. This can be easily defined using `bash` auto-expansion: `$ cat {countries,road,names}.geojson | ppmm-builder`.
</sup>
