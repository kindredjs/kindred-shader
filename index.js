const format = require('kindred-shader-formatter')
const Shader = require('./raw')

module.exports = createShader
module.exports.file = fileError

function createShader (source) {
  if (Array.isArray(source)) {
    var string = []

    for (var i = 0; i + 1 < source.length; i++) {
      string.push(source[i])
      string.push(arguments[i + 1])
    }

    string.push(source[source.length - 1])
    source = string.join('')
  }

  if (source.indexOf('#pragma glslify') !== -1) {
    throw new Error(
      'kindred\'s compile-time transform must be enabled to use glslify packages.'
    )
  }

  return new Shader(
    format.vert(source),
    format.frag(source)
  )
}

function fileError () {
  throw new Error('Shader.file() is currently only available when using kindred\'s compile-time transform.')
}
