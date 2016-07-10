const Shader = require('../')
const test = require('tape')
const gl = require('gl')(256, 256)

test('kindred-shader: uniforms', function (t) {
  const shader = Shader`
    attribute vec2 position;
    uniform vec3 color;
    uniform float alpha;

    void vert() {
      gl_Position = vec4(position, 1, 1);
    }

    void frag() {
      gl_FragColor = vec4(color, alpha);
    }
  `

  t.deepEqual(shader.uniforms, {}, 'uniforms are empty before binding')

  shader.bind(gl)

  t.deepEqual(shader.uniforms, {
    color: [0, 0, 0],
    alpha: 0
  }, 'assumes default uniform values')

  shader.uniforms.color = [1, 2, 3]
  shader.uniforms.alpha = 1

  t.deepEqual(shader.uniforms, {
    color: [1, 2, 3],
    alpha: 1
  }, 'updates are reflected locally')

  t.end()
})
