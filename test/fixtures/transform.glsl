attribute vec2 position;

void vert() {
  gl_Position = vec4(position, 1, 1);
}

void frag() {
  gl_FragColor = vec4(1, 0, 1, 1);
}
