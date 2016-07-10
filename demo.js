const triangle = require('a-big-triangle')
const Shader = require('kindred-shader')
const Fit = require('canvas-fit')

const canvas = document.body.appendChild(document.createElement('canvas'))
const gl = canvas.getContext('webgl')
const start = Date.now()
const alpha = '1.0'

const shader = Shader`
  attribute vec2 position;
  uniform float time;
  uniform vec2 shape;

  #pragma glslify: square = require('glsl-square-frame')

  void vert() {
    gl_Position = vec4(position, 1, 1);
  }

  void frag() {
    vec2 uv = square(shape, gl_FragCoord.xy);

    gl_FragColor = vec4(fract(uv * 3. + time), sin(time), 0);
    gl_FragColor.a = ${alpha};
  }
`.bind(gl)

render()
function render () {
  window.requestAnimationFrame(render)

  const width = canvas.width
  const height = canvas.height

  gl.viewport(0, 0, width, height)
  shader.bind()
  shader.uniforms.time = (Date.now() - start) / 1000
  shader.uniforms.shape = [width, height]
  triangle(gl)
}

window.addEventListener('resize', Fit(canvas), false)
