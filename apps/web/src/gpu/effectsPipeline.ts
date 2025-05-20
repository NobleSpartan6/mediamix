export interface ShaderSources {
  vertex: string
  fragment: string
}

interface CompiledProgram {
  program: WebGLProgram
  attrib: number
}

import { getShader } from './registerShader'

/**
 * Simple GPU effects pipeline using WebGL2.
 * If WebGL is unavailable (e.g. during tests), all methods are no-ops.
 */
export class GPUEffectPipeline {
  private gl: WebGL2RenderingContext | null

  private programs = new Map<string, CompiledProgram>()

  private vertexBuffer: WebGLBuffer | null = null

  constructor(private canvas: HTMLCanvasElement) {
    this.gl = (canvas.getContext('webgl2') as WebGL2RenderingContext) || null
    if (this.gl) this.initBuffers()
  }

  private initBuffers() {
    const gl = this.gl!
    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    const verts = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1])
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW)
    this.vertexBuffer = buffer
  }

  private compileProgram(vsSource: string, fsSource: string): CompiledProgram | null {
    const gl = this.gl
    if (!gl) return null

    const compile = (type: number, src: string) => {
      const shader = gl.createShader(type)
      if (!shader) return null
      gl.shaderSource(shader, src)
      gl.compileShader(shader)
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader))
        gl.deleteShader(shader)
        return null
      }
      return shader
    }

    const vert = compile(gl.VERTEX_SHADER, vsSource)
    const frag = compile(gl.FRAGMENT_SHADER, fsSource)
    if (!vert || !frag) return null

    const program = gl.createProgram()
    if (!program) return null
    gl.attachShader(program, vert)
    gl.attachShader(program, frag)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program))
      gl.deleteProgram(program)
      return null
    }
    const attrib = gl.getAttribLocation(program, 'a_position')
    return { program, attrib }
  }

  /**
   * Render the given video frame through a named shader onto the canvas.
   */
  apply(video: HTMLVideoElement, shaderName: string) {
    const gl = this.gl
    if (!gl) return
    const shader = getShader(shaderName)
    if (!shader) return

    let compiled = this.programs.get(shaderName)
    if (!compiled) {
      const p = this.compileProgram(shader.vertex, shader.fragment)
      if (!p) return
      compiled = p
      this.programs.set(shaderName, compiled)
    }

    gl.viewport(0, 0, this.canvas.width, this.canvas.height)
    gl.useProgram(compiled.program)

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer)
    gl.enableVertexAttribArray(compiled.attrib)
    gl.vertexAttribPointer(compiled.attrib, 2, gl.FLOAT, false, 0, 0)

    const tex = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video)

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

    gl.deleteTexture(tex)
  }
}
