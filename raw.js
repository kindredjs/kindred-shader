var magicUniforms = require('gl-magic-uniforms')
var extract = require('gl-shader-extract')

module.exports = Shader

function Shader (vert, frag) {
  if (!(this instanceof Shader)) return new Shader(vert, frag)

  this.gl = null

  this.program = null
  this.vertShader = null
  this.fragShader = null

  this._vertSource = vert
  this._fragSource = frag

  this.uniforms = null
  this.attributes = null
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
  if (this.gl !== gl) {
    throw new Error('Shaders can only support one context at a time.')
  }

  this.gl.useProgram(this.program)

  return this
}

Shader.prototype._setup = function (gl) {
  if (!gl) throw new Error('._setup() needs to be called with a WebGLRenderingContext')
  if (this.gl) throw new Error('._setup() called unexpectedly')

  this.gl = gl

  this.program = gl.createProgram()
  this.vertShader = gl.createShader(gl.VERTEX_SHADER)
  this.fragShader = gl.createShader(gl.FRAGMENT_SHADER)

  gl.shaderSource(this.vertShader, this.vert)
  gl.shaderSource(this.fragShader, this.frag)
  gl.compileShader(this.vertShader)
  gl.compileShader(this.fragShader)

  if (!gl.getShaderParameter(this.vertShader, gl.COMPILE_STATUS)) {
    var err = gl.getShaderInfoLog(this.vertShader)
    throw new Error(err)
  }
  if (!gl.getShaderParameter(this.fragShader, gl.COMPILE_STATUS)) {
    var err = gl.getShaderInfoLog(this.fragShader)
    throw new Error(err)
  }

  gl.attachShader(this.program, this.vertShader)
  gl.attachShader(this.program, this.fragShader)
  gl.linkProgram(this.program)

  if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
    var err = gl.getProgramInfoLog(this.program)
    throw new Error(err)
  }

  gl.useProgram(this.program)

  var types = extract(gl, this.program)

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

Shader.prototype.toJSON = function () {
  return {
    vert: this.vert,
    frag: this.frag,
    uniforms: this.uniforms,
    attributes: this.attributes
  }
}
