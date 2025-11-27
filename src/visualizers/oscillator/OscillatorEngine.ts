/**
 * Perceptual Visualizer Engine
 * Audio-reactive with meaningful visual constraints
 */

import { VisualizerEngine, AudioData, VisualizerParams, mapToPerceptualZone } from '../types';
import { createProgramFromSources, createFramebuffer, createFullscreenQuad, getUniformLocations, Framebuffer } from '../utils/webgl-utils';
import { generateNoiseTexture, initPerlin } from '../utils/perlin';
import { vertexShader, updateShader, renderShader } from './shaders';

export class OscillatorEngine implements VisualizerEngine {
  private canvas: HTMLCanvasElement | null = null;
  private gl: WebGL2RenderingContext | null = null;
  private initialized = false;
  
  // Simulation resolution
  private simWidth = 512;
  private simHeight = 288;
  
  // WebGL resources
  private updateProgram: WebGLProgram | null = null;
  private renderProgram: WebGLProgram | null = null;
  private quad: { vao: WebGLVertexArrayObject; draw: () => void } | null = null;
  
  // Ping-pong framebuffers
  private stateBuffers: [Framebuffer | null, Framebuffer | null] = [null, null];
  private currentBuffer = 0;
  
  // Noise texture
  private noiseTexture: WebGLTexture | null = null;
  private noiseTime = 0;
  
  // Uniform locations
  private updateUniforms: Record<string, WebGLUniformLocation | null> = {};
  private renderUniforms: Record<string, WebGLUniformLocation | null> = {};
  
  // Time tracking
  private time = 0;
  
  // Store last values for render pass
  private lastAudio: AudioData = { 
    bass: 0.1, lowMid: 0.1, mid: 0.1, high: 0.05, 
    energy: 0.1, beatDetected: false, beatIntensity: 0 
  };
  private lastParams: VisualizerParams = { 
    depth: 0.5, curvature: 0.3, turbulence: 0.4, 
    branching: 0.5, persistence: 0.3, focus: 0.5 
  };
  
  constructor(private seed: string = 'default') {
    const seedNum = this.stringToSeed(seed);
    initPerlin(seedNum);
  }
  
  private stringToSeed(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }
  
  async init(canvas: HTMLCanvasElement): Promise<void> {
    this.canvas = canvas;
    
    const gl = canvas.getContext('webgl2', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
    });
    
    if (!gl) {
      throw new Error('WebGL2 not supported');
    }
    
    this.gl = gl;
    
    // Check for float texture support
    const floatExt = gl.getExtension('EXT_color_buffer_float');
    const floatLinear = gl.getExtension('OES_texture_float_linear');
    
    if (!floatExt) {
      console.warn('EXT_color_buffer_float not available, using fallback');
    }
    
    // Create programs
    this.updateProgram = createProgramFromSources(gl, vertexShader, updateShader);
    this.renderProgram = createProgramFromSources(gl, vertexShader, renderShader);
    
    if (!this.updateProgram || !this.renderProgram) {
      console.error('Failed to create shader programs');
      throw new Error('Shader compilation failed');
    }
    
    // Get uniform locations
    const updateUniformNames = [
      'u_state', 'u_noise', 'u_resolution', 'u_time', 'u_deltaTime',
      'u_bass', 'u_lowMid', 'u_mid', 'u_high', 'u_energy', 'u_beatIntensity',
      'u_depth', 'u_curvature', 'u_turbulence', 'u_branching', 'u_persistence', 'u_focus'
    ];
    
    const renderUniformNames = [
      'u_state', 'u_noise', 'u_time',
      'u_bass', 'u_energy', 'u_beatIntensity',
      'u_depth', 'u_curvature', 'u_turbulence', 'u_branching', 'u_persistence', 'u_focus'
    ];
    
    this.updateUniforms = getUniformLocations(gl, this.updateProgram, updateUniformNames);
    this.renderUniforms = getUniformLocations(gl, this.renderProgram, renderUniformNames);
    
    // Create fullscreen quad
    this.quad = createFullscreenQuad(gl);
    if (!this.quad) {
      throw new Error('Failed to create quad');
    }
    
    // Create framebuffers - try float, fall back to half float
    let format: number = gl.RGBA32F;
    
    this.stateBuffers[0] = createFramebuffer(gl, this.simWidth, this.simHeight, format);
    
    if (!this.stateBuffers[0]) {
      // Fallback to RGBA16F
      format = gl.RGBA16F;
      this.stateBuffers[0] = createFramebuffer(gl, this.simWidth, this.simHeight, format);
    }
    
    if (!this.stateBuffers[0]) {
      // Last resort - RGBA8
      console.warn('Using RGBA8 fallback');
      this.stateBuffers[0] = this.createRGBA8Framebuffer(gl, this.simWidth, this.simHeight);
    }
    
    this.stateBuffers[1] = createFramebuffer(gl, this.simWidth, this.simHeight, format);
    if (!this.stateBuffers[1]) {
      this.stateBuffers[1] = this.createRGBA8Framebuffer(gl, this.simWidth, this.simHeight);
    }
    
    if (!this.stateBuffers[0] || !this.stateBuffers[1]) {
      throw new Error('Failed to create framebuffers');
    }
    
    // Initialize state
    this.initializeState();
    
    // Create noise texture
    this.createNoiseTexture();
    
    this.initialized = true;
    console.log('Perceptual visualizer engine initialized');
  }
  
  private createRGBA8Framebuffer(gl: WebGL2RenderingContext, width: number, height: number): Framebuffer | null {
    const texture = gl.createTexture();
    if (!texture) return null;
    
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    
    const framebuffer = gl.createFramebuffer();
    if (!framebuffer) return null;
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    
    return { framebuffer, texture };
  }
  
  private initializeState(): void {
    const gl = this.gl!;
    
    // Initialize with some variation
    const data = new Float32Array(this.simWidth * this.simHeight * 4);
    
    for (let y = 0; y < this.simHeight; y++) {
      for (let x = 0; x < this.simWidth; x++) {
        const i = (y * this.simWidth + x) * 4;
        const u = x / this.simWidth;
        const v = y / this.simHeight;
        
        // Initial phase variation
        data[i] = Math.random() * Math.PI * 2;
        // Initial energy - slight radial gradient
        const dist = Math.sqrt((u - 0.5) ** 2 + (v - 0.5) ** 2);
        data[i + 1] = 0.3 + (1 - dist) * 0.2;
        // Wave value
        data[i + 2] = 0.5;
        // Beat
        data[i + 3] = 0;
      }
    }
    
    for (const buffer of this.stateBuffers) {
      if (buffer) {
        gl.bindTexture(gl.TEXTURE_2D, buffer.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, this.simWidth, this.simHeight, 0, gl.RGBA, gl.FLOAT, data);
      }
    }
  }
  
  private createNoiseTexture(): void {
    const gl = this.gl!;
    
    this.noiseTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.noiseTexture);
    
    const noiseData = generateNoiseTexture(this.simWidth, this.simHeight, 4, 0);
    
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, this.simWidth, this.simHeight, 0, gl.RGBA, gl.FLOAT, noiseData);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  }
  
  private updateNoiseTexture(): void {
    const gl = this.gl!;
    
    this.noiseTime += 0.005; // Slow drift
    
    // Update less frequently
    if (Math.floor(this.noiseTime * 10) > Math.floor((this.noiseTime - 0.005) * 10)) {
      const noiseData = generateNoiseTexture(this.simWidth, this.simHeight, 4, this.noiseTime);
      gl.bindTexture(gl.TEXTURE_2D, this.noiseTexture);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, this.simWidth, this.simHeight, gl.RGBA, gl.FLOAT, noiseData);
    }
  }
  
  dispose(): void {
    const gl = this.gl;
    if (!gl) return;
    
    if (this.updateProgram) gl.deleteProgram(this.updateProgram);
    if (this.renderProgram) gl.deleteProgram(this.renderProgram);
    
    for (const buffer of this.stateBuffers) {
      if (buffer) {
        gl.deleteFramebuffer(buffer.framebuffer);
        gl.deleteTexture(buffer.texture);
      }
    }
    
    if (this.noiseTexture) gl.deleteTexture(this.noiseTexture);
    
    this.initialized = false;
  }
  
  update(audio: AudioData, params: VisualizerParams, deltaTime: number): void {
    if (!this.initialized || !this.gl) return;
    
    const gl = this.gl;
    this.time += deltaTime;
    
    // Store for render
    this.lastAudio = audio;
    this.lastParams = params;
    
    // Update noise slowly
    this.updateNoiseTexture();
    
    // Map params through perceptual zones
    const pDepth = mapToPerceptualZone(params.depth);
    const pCurvature = mapToPerceptualZone(params.curvature);
    const pTurbulence = mapToPerceptualZone(params.turbulence);
    const pBranching = mapToPerceptualZone(params.branching);
    const pPersistence = mapToPerceptualZone(params.persistence);
    const pFocus = mapToPerceptualZone(params.focus);
    
    // Get buffers
    const currentState = this.stateBuffers[this.currentBuffer]!;
    const nextState = this.stateBuffers[1 - this.currentBuffer]!;
    
    // Render to next buffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, nextState.framebuffer);
    gl.viewport(0, 0, this.simWidth, this.simHeight);
    
    gl.useProgram(this.updateProgram);
    
    // Textures
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, currentState.texture);
    gl.uniform1i(this.updateUniforms.u_state, 0);
    
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.noiseTexture);
    gl.uniform1i(this.updateUniforms.u_noise, 1);
    
    // Uniforms
    gl.uniform2f(this.updateUniforms.u_resolution, this.simWidth, this.simHeight);
    gl.uniform1f(this.updateUniforms.u_time, this.time);
    gl.uniform1f(this.updateUniforms.u_deltaTime, Math.min(deltaTime, 0.05));
    
    // Audio
    gl.uniform1f(this.updateUniforms.u_bass, audio.bass);
    gl.uniform1f(this.updateUniforms.u_lowMid, audio.lowMid);
    gl.uniform1f(this.updateUniforms.u_mid, audio.mid);
    gl.uniform1f(this.updateUniforms.u_high, audio.high);
    gl.uniform1f(this.updateUniforms.u_energy, audio.energy);
    gl.uniform1f(this.updateUniforms.u_beatIntensity, audio.beatIntensity);
    
    // Params
    gl.uniform1f(this.updateUniforms.u_depth, pDepth);
    gl.uniform1f(this.updateUniforms.u_curvature, pCurvature);
    gl.uniform1f(this.updateUniforms.u_turbulence, pTurbulence);
    gl.uniform1f(this.updateUniforms.u_branching, pBranching);
    gl.uniform1f(this.updateUniforms.u_persistence, pPersistence);
    gl.uniform1f(this.updateUniforms.u_focus, pFocus);
    
    this.quad!.draw();
    
    // Swap
    this.currentBuffer = 1 - this.currentBuffer;
  }
  
  render(): void {
    if (!this.initialized || !this.gl || !this.canvas) return;
    
    const gl = this.gl;
    const currentState = this.stateBuffers[this.currentBuffer]!;
    
    // Map params
    const pDepth = mapToPerceptualZone(this.lastParams.depth);
    const pCurvature = mapToPerceptualZone(this.lastParams.curvature);
    const pTurbulence = mapToPerceptualZone(this.lastParams.turbulence);
    const pBranching = mapToPerceptualZone(this.lastParams.branching);
    const pPersistence = mapToPerceptualZone(this.lastParams.persistence);
    const pFocus = mapToPerceptualZone(this.lastParams.focus);
    
    // Render to screen
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    
    gl.useProgram(this.renderProgram);
    
    // Textures
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, currentState.texture);
    gl.uniform1i(this.renderUniforms.u_state, 0);
    
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.noiseTexture);
    gl.uniform1i(this.renderUniforms.u_noise, 1);
    
    // Uniforms
    gl.uniform1f(this.renderUniforms.u_time, this.time);
    gl.uniform1f(this.renderUniforms.u_bass, this.lastAudio.bass);
    gl.uniform1f(this.renderUniforms.u_energy, this.lastAudio.energy);
    gl.uniform1f(this.renderUniforms.u_beatIntensity, this.lastAudio.beatIntensity);
    gl.uniform1f(this.renderUniforms.u_depth, pDepth);
    gl.uniform1f(this.renderUniforms.u_curvature, pCurvature);
    gl.uniform1f(this.renderUniforms.u_turbulence, pTurbulence);
    gl.uniform1f(this.renderUniforms.u_branching, pBranching);
    gl.uniform1f(this.renderUniforms.u_persistence, pPersistence);
    gl.uniform1f(this.renderUniforms.u_focus, pFocus);
    
    this.quad!.draw();
  }
  
  isInitialized(): boolean {
    return this.initialized;
  }
  
  getName(): string {
    return 'Perceptual Engine';
  }
  
  setSeed(seed: string): void {
    this.seed = seed;
    const seedNum = this.stringToSeed(seed);
    initPerlin(seedNum);
    
    if (this.initialized) {
      this.initializeState();
    }
  }
}
