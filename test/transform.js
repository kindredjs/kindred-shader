const transform = require('../transform')
const from2 = require('from2-string')
const test = require('tape')
const bl = require('bl')
const vm = require('vm')

test('kindred-shader: template transform', basicCheck(`
  const Shader = require('kindred-shader')
  const alpha  = 1.0
  const shader = Shader\`
    attribute vec2 position;

    void vert() {
      gl_Position = vec4(position, 1, 1);
    }

    void frag() {
      gl_FragColor = vec4(1, 0, 1, \${alpha});
    }
  \`

  console.log('hello world!')
`, {
  transform: true
}))

test('kindred-shader: file transform', basicCheck(`
  const Shader = require('kindred-shader')
  const shader = Shader.file('./fixtures/transform.glsl')
  console.log('hello world!')
`, {
  transform: true
}))

test('kindred-shader: file + template transform', basicCheck(`
  const Shader  = require('kindred-shader')
  const alpha   = 1.0
  const shader1 = Shader.file('./fixtures/transform.glsl')
  const shader2 = Shader\`
    attribute vec2 position;

    void vert() {
      gl_Position = vec4(position, 1, 1);
    }

    void frag() {
      gl_FragColor = vec4(1, 0, 1, \${alpha});
    }
  \`

  console.log('hello world!')
`, {
  transform: true,
  count: 2
}))

test('kindred-shader: file without transform', basicCheck(`
  const Shader = require('kindred-shader')
  const shader = Shader.file('./fixtures/transform.glsl')
  console.log('hello world!')
`, {
  transform: false,
  error: true
}))

function basicCheck (src, opts) {
  opts = opts || {}

  var transforming = !!opts.transform
  var error = !!opts.error
  var count = opts.count || 1

  return function (t) {
    if (!transforming) {
      return transformComplete(null, src)
    }

    from2(src)
      .pipe(transform(__filename, {}))
      .pipe(bl(transformComplete))

    function transformComplete (err, src) {
      if (err) return t.ifError(err)

      t.plan(error ? 2 : 9 * count + 2)
      t.pass('transform completed successfully')

      var normalContext = {
        require: function (path) {
          t.equal(path, 'kindred-shader/raw', 'require now resolves to Shader.raw')
          return function (vert, frag) {
            t.equal(typeof vert, 'string', 'vertex shader supplied as string')
            t.equal(typeof frag, 'string', 'fragment shader supplied as string')
            t.ok(vert.indexOf('#define GLSLIFY') !== -1, 'glslify applied to vert shader')
            t.ok(frag.indexOf('#define GLSLIFY') !== -1, 'glslify applied to frag shader')
            t.ok(vert.indexOf('gl_Position') !== -1, 'gl_Position is included in vert shader')
            t.ok(frag.indexOf('gl_Position') === -1, 'gl_Position is omitted from frag shader')
            t.ok(frag.indexOf('gl_FragColor') !== -1, 'gl_FragColor is included in frag shader')
            t.ok(vert.indexOf('gl_FragColor') === -1, 'gl_FragColor is omitted from vert shader')
          }
        },
        console: {
          log: function (log) {
            t.equal(log, 'hello world!', 'script that follows shader is preserved')
          }
        }
      }

      if (error) {
        t.throws(function () {
          vm.runInContext(src)
        }, 'Shader.file should throw when not using the transform')
      } else {
        vm.runInNewContext(src, normalContext)
      }
    }
  }
}
