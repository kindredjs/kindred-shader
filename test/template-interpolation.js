const Shader = require('../')
const test = require('tape')

test('kindred-shader: template-interpolation', function (t) {
  const fragColor = 'gl_FragColor'
  const red = 1
  const green = 0
  const blue = 1
  const alpha = 1

  const shader = Shader`
    void vert() {
      ${fragColor} = vec4(${red}, ${green}, ${blue}, ${alpha});
    }
  `

  t.ok(shader.vert.indexOf('gl_FragColor = vec4(1, 0, 1, 1)') !== -1, 'interpolation a-ok!')
  t.end()
})
