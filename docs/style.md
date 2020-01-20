# docs/style

## Defining style

###### `style.json`
```json
{
  …
  "__property": "FOO",
  "bar": {
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
    }
  },
  …
}
```

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
