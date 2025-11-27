/**
 * Coupled Oscillator Visualizer Engine
 * Kuramoto model with Perlin noise modulation
 */

import { VisualizerEngine, AudioData, VisualizerParams, mapToPerceptualZone } from '../types';
import { createProgramFromSources, createFramebuffer, createFullscreenQuad, getUniformLocations, Framebuffer } from '../utils/webgl-utils';
import { generateNoiseTexture, initPerlin } from '../utils/perlin';
import { vertexShader, updateShader, renderShader } from './shaders';

export class OscillatorEngine implements VisualizerEngine {
  private canvas: HTMLCanvasElement | null = null;
  private gl: WebGL2RenderingContext | null = null;
  private initialized = false;
  
  // Simulation resolution (lower for performance)
  private simWidth = 320;
  private simHeight = 180;
  
  // WebGL resources
  private updateProgram: WebGLProgram | null = null;
  private renderProgram: WebGLProgram | null = null;
  private quad: { vao: WebGLVertexArrayObject; draw: () => void } | null = null;
  
  // Ping-pong framebuffers for state
  private stateBuffers: [Framebuffer | null, Framebuffer | null] = [null, null];
  private currentBuffer = 0;
  
  // Noise texture
  private noiseTexture: WebGLTexture | null = null;
  private noiseData: Float32Array | null = null;
  private noiseUpdateTime = 0;
  
  // Uniform locations
  private updateUniforms: Record<string, WebGLUniformLocation | null> = {};
  private renderUniforms: Record<string, WebGLUniformLocation | null> = {};
  
  // Time tracking
  private time = 0;
  private lastFrameTime = 0;
  
  constructor(private seed: string = 'default') {
    // Initialize Perlin with seed
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
    
    // Get WebGL2 context
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
    
    // Check for required extensions
    const floatExt = gl.getExtension('EXT_color_buffer_float');
    if (!floatExt) {
      console.warn('EXT_color_buffer_float not supported, falling back');
    }
    
    // Create shader programs
    this.updateProgram = createProgramFromSources(gl, vertexShader, updateShader);
    this.renderProgram = createProgramFromSources(gl, vertexShader, renderShader);
    
    if (!this.updateProgram || !this.renderProgram) {
      throw new Error('Failed to create shader programs');
    }
    
    // Get uniform locations
    this.updateUniforms = getUniformLocations(gl, this.updateProgram, [
      'u_state', 'u_noise', 'u_resolution', 'u_time', 'u_deltaTime',
      'u_bass', 'u_lowMid', 'u_mid', 'u_high', 'u_energy', 'u_beatIntensity',
      'u_depth', 'u_curvature', 'u_turbulence', 'u_branching', 'u_persistence', 'u_focus'
    ]);
    
    this.renderUniforms = getUniformLocations(gl, this.renderProgram, [
      'u_state', 'u_noise', 'u_time',
      'u_bass', 'u_energy', 'u_beatIntensity',
      'u_curvature', 'u_persistence', 'u_focus', 'u_branching'
    ]);
    
    // Create fullscreen quad
    this.quad = createFullscreenQuad(gl);
    if (!this.quad) {
      throw new Error('Failed to create fullscreen quad');
    }
    
    // Create ping-pong framebuffers
    this.stateBuffers[0] = createFramebuffer(gl, this.simWidth, this.simHeight);
    this.stateBuffers[1] = createFramebuffer(gl, this.simWidth, this.simHeight);
    
    if (!this.stateBuffers[0] || !this.stateBuffers[1]) {
      throw new Error('Failed to create framebuffers');
    }
    
    // Initialize state with random phases
    this.initializeState();
    
    // Create noise texture
    this.createNoiseTexture();
    
    this.initialized = true;
    console.log('OscillatorEngine initialized');
  }
  
  private initializeState(): void {
    const gl = this.gl!;
    
    // Create initial random phases
    const data = new Float32Array(this.simWidth * this.simHeight * 4);
    const TAU = Math.PI * 2;
    
    for (let i = 0; i < this.simWidth * this.simHeight; i++) {
      data[i * 4] = Math.random() * TAU;     // phase
      data[i * 4 + 1] = 0;                    // coupling
      data[i * 4 + 2] = 0;                    // energy
      data[i * 4 + 3] = 1;                    // unused
    }
    
    // Upload to both buffers
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
    
    // Generate initial noise
    this.noiseData = generateNoiseTexture(this.simWidth, this.simHeight, 4, 0);
    
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, this.simWidth, this.simHeight, 0, gl.RGBA, gl.FLOAT, this.noiseData);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  }
  
  private updateNoiseTexture(): void {
    const gl = this.gl!;
    
    // Update noise slowly for organic drift
    this.noiseUpdateTime += 0.016; // ~60fps
    
    // Only regenerate occasionally for performance
    if (Math.floor(this.noiseUpdateTime * 2) > Math.floor((this.noiseUpdateTime - 0.016) * 2)) {
      this.noiseData = generateNoiseTexture(this.simWidth, this.simHeight, 4, this.noiseUpdateTime);
      gl.bindTexture(gl.TEXTURE_2D, this.noiseTexture);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, this.simWidth, this.simHeight, gl.RGBA, gl.FLOAT, this.noiseData);
    }
  }
  
  dispose(): void {
    const gl = this.gl;
    if (!gl) return;
    
    // Clean up WebGL resources
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
    
    // Store for render pass
    this.lastAudio = audio;
    this.lastParams = params;
    
    // Update noise texture for organic movement
    this.updateNoiseTexture();
    
    // Map params through perceptual zones
    const pDepth = mapToPerceptualZone(params.depth);
    const pCurvature = mapToPerceptualZone(params.curvature);
    const pTurbulence = mapToPerceptualZone(params.turbulence);
    const pBranching = mapToPerceptualZone(params.branching);
    const pPersistence = mapToPerceptualZone(params.persistence);
    const pFocus = mapToPerceptualZone(params.focus);
    
    // Get current and next buffers
    const currentState = this.stateBuffers[this.currentBuffer]!;
    const nextState = this.stateBuffers[1 - this.currentBuffer]!;
    
    // Render to next state buffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, nextState.framebuffer);
    gl.viewport(0, 0, this.simWidth, this.simHeight);
    
    gl.useProgram(this.updateProgram);
    
    // Bind textures
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, currentState.texture);
    gl.uniform1i(this.updateUniforms.u_state, 0);
    
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.noiseTexture);
    gl.uniform1i(this.updateUniforms.u_noise, 1);
    
    // Set uniforms
    gl.uniform2f(this.updateUniforms.u_resolution, this.simWidth, this.simHeight);
    gl.uniform1f(this.updateUniforms.u_time, this.time);
    gl.uniform1f(this.updateUniforms.u_deltaTime, Math.min(deltaTime, 0.05)); // Cap delta time
    
    // Audio uniforms
    gl.uniform1f(this.updateUniforms.u_bass, audio.bass);
    gl.uniform1f(this.updateUniforms.u_lowMid, audio.lowMid);
    gl.uniform1f(this.updateUniforms.u_mid, audio.mid);
    gl.uniform1f(this.updateUniforms.u_high, audio.high);
    gl.uniform1f(this.updateUniforms.u_energy, audio.energy);
    gl.uniform1f(this.updateUniforms.u_beatIntensity, audio.beatIntensity);
    
    // Parameter uniforms
    gl.uniform1f(this.updateUniforms.u_depth, pDepth);
    gl.uniform1f(this.updateUniforms.u_curvature, pCurvature);
    gl.uniform1f(this.updateUniforms.u_turbulence, pTurbulence);
    gl.uniform1f(this.updateUniforms.u_branching, pBranching);
    gl.uniform1f(this.updateUniforms.u_persistence, pPersistence);
    gl.uniform1f(this.updateUniforms.u_focus, pFocus);
    
    // Draw
    this.quad!.draw();
    
    // Swap buffers
    this.currentBuffer = 1 - this.currentBuffer;
  }
  
  // Store last audio/params for render pass
  private lastAudio: AudioData = { bass: 0, lowMid: 0, mid: 0, high: 0, energy: 0, beatDetected: false, beatIntensity: 0 };
  private lastParams: VisualizerParams = { depth: 0.5, curvature: 0.3, turbulence: 0.4, branching: 0.5, persistence: 0.3, focus: 0.5 };

  render(): void {
    if (!this.initialized || !this.gl || !this.canvas) return;
    
    const gl = this.gl;
    const currentState = this.stateBuffers[this.currentBuffer]!;
    
    // Render to screen
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    
    gl.useProgram(this.renderProgram);
    
    // Bind state texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, currentState.texture);
    gl.uniform1i(this.renderUniforms.u_state, 0);
    
    // Bind noise texture
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.noiseTexture);
    gl.uniform1i(this.renderUniforms.u_noise, 1);
    
    // Set all uniforms
    gl.uniform1f(this.renderUniforms.u_time, this.time);
    gl.uniform1f(this.renderUniforms.u_bass, this.lastAudio.bass);
    gl.uniform1f(this.renderUniforms.u_energy, this.lastAudio.energy);
    gl.uniform1f(this.renderUniforms.u_beatIntensity, this.lastAudio.beatIntensity);
    gl.uniform1f(this.renderUniforms.u_curvature, mapToPerceptualZone(this.lastParams.curvature));
    gl.uniform1f(this.renderUniforms.u_persistence, mapToPerceptualZone(this.lastParams.persistence));
    gl.uniform1f(this.renderUniforms.u_focus, mapToPerceptualZone(this.lastParams.focus));
    gl.uniform1f(this.renderUniforms.u_branching, mapToPerceptualZone(this.lastParams.branching));
    
    // Draw
    this.quad!.draw();
  }
  
  isInitialized(): boolean {
    return this.initialized;
  }
  
  getName(): string {
    return 'Coupled Oscillators';
  }
  
  // Allow updating seed
  setSeed(seed: string): void {
    this.seed = seed;
    const seedNum = this.stringToSeed(seed);
    initPerlin(seedNum);
    
    if (this.initialized) {
      this.initializeState();
      this.createNoiseTexture();
    }
  }
}
