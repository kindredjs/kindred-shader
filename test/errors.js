const Shader = require('../')
const test = require('tape')
const GL = require('gl')
const gl = GL(256, 256)

test('kindred-shader: compiler errors', function (t) {
  const valid = Shader`
    attribute vec2 position;

    void vert() {
      gl_Position = vec4(position, 1, 1);
    }

    void frag() {
      gl_FragColor = vec4(1);
    }
  `

  const invalid = Shader`
    attribute vec2 position;

    void vert() {
      unused_reference;
      gl_Position = vec4(position, 1, 1);
    }

    void frag() {
      gl_FragColor = vec4(1);
    }
  `

  t.throws(function () {
    invalid.bind(gl)
  }, 'invalid shaders throw on binding')

  t.throws(function () {
    invalid.bind(gl)
  }, 'invalid shaders throw every binding')

  t.doesNotThrow(function () {
    valid.bind(gl)
  }, 'valid shaders do not throw on binding')

  t.equal(valid.compiled, true, 'valid shader considered "compiled"')
  t.equal(invalid.compiled, false, 'invalid shader not considered "compiled"')

  try {
    invalid.bind(gl)
  } catch (e) {
    t.ok(
      e.message.indexOf('1:') !== -1 &&
      e.message.indexOf('2:') !== -1 &&
      e.message.indexOf('3:') !== -1
    , 'line numbers included in error output')
  }

  t.end()
})

test('kindred-shader: invalid context errors', function (t) {
  const secondary = GL(64, 64)
  const shader = Shader`
    attribute vec2 position;

    void vert() {
      gl_Position = vec4(position, 1, 1);
    }

    void frag() {
      gl_FragColor = vec4(1);
    }
  `

  t.throws(function () {
    shader.bind()
  }, 'binding without a context causes an error')

  t.doesNotThrow(function () {
    shader.bind(gl)
  }, 'can be attempted again successfully')

  t.throws(function () {
    shader.bind(secondary)
  }, 'errors when handed a fresh context')

  t.doesNotThrow(function () {
    shader.dispose()
    shader.bind(secondary)
  }, 'can use .dispose() to set a fresh context safely')

  t.ok(shader.compiled, 'shader.compiled === true')
  t.end()
})

test('kindred-shader: glslify error (without transform)', function (t) {
  try {
    Shader`
      attribute vec2 position;

      #pragma glslify: square = require('glsl-square-frame')

      void vert() {
        gl_Position = vec4(position, 1, 1);
      }

      void frag() {
        gl_FragColor = vec4(1);
      }
    `
  } catch (e) {
    t.ok(e.message.indexOf('glslify') !== -1, 'error on using glslify, referring as such')
    t.end()
    return
  }

  t.fail('Shader did not throw error on creation')
})
