var addLineNumbers = require('add-line-numbers')
var magicUniforms = require('gl-magic-uniforms')
var extract = require('gl-shader-extract')

module.exports = createShader

function createShader (vert, frag) {
  return new Shader(vert, frag)
}

var counter = parseInt(Math.random().toString(32).slice(2, 10), 32)

function Shader (vert, frag) {
  this.gl = null
  this.id = counter++

  this.program = null
  this.vertShader = null
  this.fragShader = null

  this._vertSource = vert
  this._fragSource = frag

  this.compiled = false
  this.uniforms = {}
  this.attributes = {}
}

Object.defineProperties(Shader.prototype, {
  frag: { get: function () { return this._fragSource } },
  vert: { get: function () { return this._vertSource } }
})

Shader.prototype.bind = function (gl) {
  if (this.gl === null) {
    if (!gl) throw new Error('.bind() must be called with a WebGL context at least once.')
    this._setup(gl)
  } else
  if (gl && this.gl !== gl) {
    throw new Error('Shaders can only support one context at a time.')
  } else
  if (!this.compiled) {
    this._setup(gl)
  }

  this.gl.useProgram(this.program)

  return this
}

Shader.prototype._bail = function (source, error) {
  if (source) {
    error += '\n' + addLineNumbers(source)
  }

  throw new Error('\n' + error + '\n')
}

Shader.prototype._setup = function (gl) {
  if (!gl) throw new Error('._setup() needs to be called with a WebGLRenderingContext')
  if (this.gl && this.compiled) throw new Error('._setup() called unexpectedly')

  this.gl = gl

  this.program = gl.createProgram()
  this.vertShader = gl.createShader(gl.VERTEX_SHADER)
  this.fragShader = gl.createShader(gl.FRAGMENT_SHADER)

  gl.shaderSource(this.vertShader, this.vert)
  gl.shaderSource(this.fragShader, this.frag)
  gl.compileShader(this.vertShader)
  gl.compileShader(this.fragShader)

  if (!gl.getShaderParameter(this.vertShader, gl.COMPILE_STATUS)) {
    return this._bail(this.vert, gl.getShaderInfoLog(this.vertShader))
  }
  if (!gl.getShaderParameter(this.fragShader, gl.COMPILE_STATUS)) {
    return this._bail(this.frag, gl.getShaderInfoLog(this.fragShader))
  }

  gl.attachShader(this.program, this.vertShader)
  gl.attachShader(this.program, this.fragShader)
  gl.linkProgram(this.program)

  if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
    return this._bail('', gl.getProgramInfoLog(this.program))
  }

  gl.useProgram(this.program)

  var types = extract(gl, this.program)

  this.compiled = true
  this.uniforms = magicUniforms(gl, this.program, types.uniforms)
  this.attributes = {}

  for (var i = 0; i < types.attributes.length; i++) {
    var name = types.attributes[i].name
    Object.defineProperty(this.attributes, name, {
      value: gl.getAttribLocation(this.program, name),
      enumerable: true,
      configurable: false
    })
  }
}

Shader.prototype.dispose = function () {
  if (!this.gl) return
  var gl = this.gl

  gl.deleteShader(this.vertShader)
  gl.deleteShader(this.fragShader)
  gl.deleteProgram(this.program)

  this.gl = null
  this.program = null
  this.uniforms = null
  this.attributes = null
  this.vertShader = null
  this.fragShader = null
}

Shader.prototype.recompile = function (vert, frag) {
  var gl = this.gl
  var prevVert = this._vertSource
  var prevFrag = this._fragSource

  this.dispose()
  this._vertSource = vert
  this._fragSource = frag

  try {
    this.bind(gl)
  } catch (e) {
    this._vertSource = prevVert
    this._fragSource = prevFrag
    this.bind(gl)
    throw e
  }
}

Shader.prototype.copy = function () {
  return new Shader(this.vert, this.frag)
}

Shader.prototype.toJSON = function () {
  return {
    vert: this.vert,
    frag: this.frag,
    uniforms: this.uniforms,
    attributes: this.attributes
  }
}
