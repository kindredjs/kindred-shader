const Shader = require('../')
const test = require('tape')
const gl = require('gl')(256, 256)

test('kindred-shader: attributes', function (t) {
  const shader = Shader`
    attribute vec2 position;
    attribute vec2 uv1;
    attribute vec2 uv2;
    varying vec2 vuv1;
    varying vec2 vuv2;

    void vert() {
      vuv1 = uv1;
      vuv2 = uv2;
      gl_Position = vec4(position, 1, 1);
    }

    void frag() {
      gl_FragColor = vec4(vuv1 + vuv2, 1, 1);
    }
  `

  t.deepEqual(shader.attributes, {}, 'attributes are empty before binding')

  shader.bind(gl)
  t.deepEqual(shader.attributes, {
    position: 0,
    uv1: 1,
    uv2: 2
  }, 'attribute positions are listed after binding')

  shader.attributes.position = 10
  t.deepEqual(shader.attributes.position, 0, 'shader attributes are read only')

  t.end()
})
