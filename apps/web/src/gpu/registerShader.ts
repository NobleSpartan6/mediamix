const registry = new Map<string, { vertex: string; fragment: string }>()

export const registerShader = (name: string, sources: { vertex: string; fragment: string }): void => {
  registry.set(name, sources)
}

registerShader('passthrough', {
  vertex: `#version 300 es
in vec2 a_position;
out vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`,
  fragment: `#version 300 es
precision mediump float;
in vec2 v_uv;
uniform sampler2D u_texture;
out vec4 outColor;
void main() {
  outColor = texture(u_texture, v_uv);
}`,
})

export const getShader = (name: string) => registry.get(name)
