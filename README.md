# kindred-shader

[![](https://img.shields.io/badge/stability-experimental-ffa100.svg?style=flat-square)](https://nodejs.org/api/documentation.html#documentation_stability_index)
[![](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](http://standardjs.com/)
[![](https://img.shields.io/npm/v/kindred-shader.svg?style=flat-square)](https://npmjs.com/package/kindred-shader)
[![](https://img.shields.io/circleci/project/kindredjs/kindred-shader/master.svg?style=flat-square)](https://circleci.com/gh/kindredjs/kindred-shader)
[![](https://img.shields.io/appveyor/ci/hughsk/kindred-shader.svg?style=flat-square)]()

A lightweight WebGL shader API.

* Weighs just under 3kB after optimising! (uglify + gzip + transform)
* Plays nice with [glslify](https://github.com/stackgl/glslify).
* Easy to set up using tagged [template literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals).
* Supports inlining shaders from separate files.
* Uses [kindred-shader-formatter](https://github.com/kindredjs/kindred-shader-formatter) to combine your vertex and fragment shaders into a single source.
* Lives under the [kindred](https://github.com/kindredjs) umbrella, but works well anywhere :)

Largely inspired by [@mikolalysenko](https://github.com/mikolalysenko)'s [gl-shader](https://github.com/stackgl/gl-shader) and [@mattdesl](https://github.com/mattdesl/)'s [glo-shader](https://github.com/glo-js/glo-shader).

## Usage

See [demo.js](demo.js) for a full example.

``` javascript
var canvas = document.createElement('canvas')
var gl = canvas.getContext('webgl')

var sh = require('kindred-shader')
var shader = sh`
  uniform mat4 uProj;
  uniform mat4 uView;

  attribute vec3 position;
  attribute vec3 normal;
  varying vec3 vNormal;

  void vert() {
    vNormal = normalize(normal);
    gl_Position = uProj * uView * vec4(position, 1);
  }

  void frag() {
    gl_FragColor = vec4(vNormal * 0.5 + 0.5, 1);
  }
`

render()
function render () {
  requestAnimationFrame(render)

  shader.bind(gl)
  shader.uniforms.uProj = projectionMatrix
  shader.uniforms.uView = viewMatrix

  // ... draw the object ...
}
```

## API

WIP :)

### `shader = Shader(template)`
### `shader.bind(gl)`
### `shader.dispose()`
### `shader.uniforms`
### `shader.attributes`
### `shader.vert`
### `shader.frag`
### `shader = Shader.file(source)`
### `shader = Shader.raw(vert, frag)`
### `shader.recompile(vert, frag)`

## Browserify Transform

Optionally, you can use `kindred-shader/transform` as a [browserify transform]() by including the following in your project's `package.json` file:

``` json
{
  "browserify": {
    "transform": [
      "kindred-shader/transform"
    ]
  }
}
```

This will unlock support for [glslify](https://github.com/stackgl/glslify) in your shaders, and using `Shader.file` to include external shader files.

* Support for `Shader.file`.
* Builtin support for [glslify](https://github.com/stackgl/glslify).
* Hides code that's unnecessary at runtime, bringing the library size down by more than half.

You can also get this transform working with your tool of choice using browserify transform plugins, e.g.:

* **webpack**: [hughsk/ify-loader](https://github.com/hughsk/ify-loader)
* **rollup**: [lautis/rollup-plugin-browserify-transform](https://github.com/lautis/rollup-plugin-browserify-transform)

## See Also

* [gl-shader](https://github.com/stackgl/gl-shader)
* [glo-shader](https://github.com/glo-js/glo-shader)
* [glslify](https://github.com/stackgl/glslify)
* [gl-magic-uniforms](https://github.com/stackgl/gl-magic-uniforms)
* [kindred-shader-formatter](https://github.com/kindredjs/kindred-shader-formatter)

## License

MIT. See [LICENSE.md](LICENSE.md) for details.
