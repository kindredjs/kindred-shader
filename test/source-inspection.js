const Shader = require('../')
const test = require('tape')

test('kindred-shader: source inspection', function (t) {
  const shader = Shader`
    attribute vec2 position;

    void vert() {
      gl_Position = vec4(position, 1, 1);
    }

    void frag() {
      gl_FragColor = vec4(1, 0, 1, 1);
    }
  `

  t.equal(typeof shader.frag, 'string', 'shader.frag contains shader source')
  t.equal(typeof shader.vert, 'string', 'shader.vert contains shader source')
  t.ok(shader.vert.indexOf('gl_Position') !== -1, 'shader.vert contains gl_Position')
  t.ok(shader.frag.indexOf('gl_Position') === -1, 'shader.frag omits gl_Position')
  t.ok(shader.frag.indexOf('gl_FragColor') !== -1, 'shader.frag contains gl_FragColor')
  t.ok(shader.vert.indexOf('gl_FragColor') === -1, 'shader.vert omits gl_FragColor')

  t.end()
})
