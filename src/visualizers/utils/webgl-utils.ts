/**
 * WebGL Utilities
 * Shader compilation, framebuffer management, etc.
 */

export function createShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compile error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  
  return shader;
}

export function createProgram(
  gl: WebGL2RenderingContext,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader
): WebGLProgram | null {
  const program = gl.createProgram();
  if (!program) return null;
  
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  
  return program;
}

export function createProgramFromSources(
  gl: WebGL2RenderingContext,
  vertexSource: string,
  fragmentSource: string
): WebGLProgram | null {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  
  if (!vertexShader || !fragmentShader) return null;
  
  return createProgram(gl, vertexShader, fragmentShader);
}

export interface Framebuffer {
  framebuffer: WebGLFramebuffer;
  texture: WebGLTexture;
}

export function createFramebuffer(
  gl: WebGL2RenderingContext,
  width: number,
  height: number,
  format: number = gl.RGBA32F
): Framebuffer | null {
  const texture = gl.createTexture();
  if (!texture) return null;
  
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, format, width, height, 0, gl.RGBA, gl.FLOAT, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  
  const framebuffer = gl.createFramebuffer();
  if (!framebuffer) return null;
  
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  
  // Check framebuffer status
  const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  if (status !== gl.FRAMEBUFFER_COMPLETE) {
    console.error('Framebuffer incomplete:', status);
    return null;
  }
  
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  
  return { framebuffer, texture };
}

export function createFullscreenQuad(gl: WebGL2RenderingContext): {
  vao: WebGLVertexArrayObject;
  draw: () => void;
} | null {
  const vao = gl.createVertexArray();
  if (!vao) return null;
  
  gl.bindVertexArray(vao);
  
  // Fullscreen triangle (more efficient than quad)
  const positions = new Float32Array([
    -1, -1,
     3, -1,
    -1,  3,
  ]);
  
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
  
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  
  gl.bindVertexArray(null);
  
  return {
    vao,
    draw: () => {
      gl.bindVertexArray(vao);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
  };
}

export function getUniformLocations<T extends string>(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  names: T[]
): Record<T, WebGLUniformLocation | null> {
  const locations: Record<string, WebGLUniformLocation | null> = {};
  for (const name of names) {
    locations[name] = gl.getUniformLocation(program, name);
  }
  return locations as Record<T, WebGLUniformLocation | null>;
}
