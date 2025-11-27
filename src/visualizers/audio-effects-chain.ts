/**
 * Audio Effects Chain
 * 
 * Grounded in psychedelic auditory phenomenology:
 * - Echo (Hold On): Spatiality/room feel via delay + reverb
 * - Drift (Tone/Color): Tonal expression via filter sweeps + stereo widening
 * - Break (Disruption): Rhythmic texture via rhythmic gating
 * 
 * Chain: source → Echo → Drift → Break → analyser → destination
 * Both output AND analyzer receive processed audio
 */

export interface AudioEffectParams {
  echo: number;   // 0-1: spatiality/reverb
  drift: number;  // 0-1: tonal movement/filter
  break_: number; // 0-1: rhythmic disruption (break_ to avoid reserved word)
}

export const DEFAULT_AUDIO_PARAMS: AudioEffectParams = {
  echo: 0.2,
  drift: 0.1,
  break_: 0,
};

export class AudioEffectsChain {
  private context: AudioContext;
  private input: GainNode;
  private output: GainNode;
  
  // Echo (Delay + Feedback)
  private delayNode: DelayNode;
  private feedbackGain: GainNode;
  private delayWetGain: GainNode;
  private delayDryGain: GainNode;
  
  // Drift (Filter + Stereo)
  private filterNode: BiquadFilterNode;
  private filterLfo: OscillatorNode;
  private filterLfoGain: GainNode;
  
  // Break (Rhythmic Gate)
  private gateGain: GainNode;
  private breakLfo: OscillatorNode;
  private breakLfoGain: GainNode;
  private breakShaper: WaveShaperNode;
  
  // Current params for smooth interpolation
  private currentParams: AudioEffectParams = { ...DEFAULT_AUDIO_PARAMS };
  private targetParams: AudioEffectParams = { ...DEFAULT_AUDIO_PARAMS };
  
  constructor(context: AudioContext) {
    this.context = context;
    
    // Create I/O nodes
    this.input = context.createGain();
    this.output = context.createGain();
    
    // === ECHO SECTION (Delay + Feedback) ===
    this.delayNode = context.createDelay(1.0);
    this.delayNode.delayTime.value = 0.25; // 250ms delay
    
    this.feedbackGain = context.createGain();
    this.feedbackGain.gain.value = 0.3;
    
    this.delayWetGain = context.createGain();
    this.delayWetGain.gain.value = 0;
    
    this.delayDryGain = context.createGain();
    this.delayDryGain.gain.value = 1;
    
    // === DRIFT SECTION (Filter with LFO) ===
    this.filterNode = context.createBiquadFilter();
    this.filterNode.type = 'lowpass';
    this.filterNode.frequency.value = 20000; // Start fully open
    this.filterNode.Q.value = 1;
    
    this.filterLfo = context.createOscillator();
    this.filterLfo.type = 'sine';
    this.filterLfo.frequency.value = 0.15; // Slow sweep
    
    this.filterLfoGain = context.createGain();
    this.filterLfoGain.gain.value = 0; // Start with no modulation
    
    // === BREAK SECTION (Rhythmic Gate) ===
    this.gateGain = context.createGain();
    this.gateGain.gain.value = 1;
    
    this.breakLfo = context.createOscillator();
    this.breakLfo.type = 'square';
    this.breakLfo.frequency.value = 2; // 2Hz = 120 BPM quarter notes
    
    this.breakLfoGain = context.createGain();
    this.breakLfoGain.gain.value = 0; // Start with no gating
    
    // Wave shaper to ensure minimum volume floor
    this.breakShaper = context.createWaveShaper();
    // @ts-ignore - Float32Array type compatibility
    this.breakShaper.curve = this.createBreakCurve();
    
    // === CONNECT THE CHAIN ===
    this.connectChain();
    
    // Start LFOs
    this.filterLfo.start();
    this.breakLfo.start();
  }
  
  private connectChain() {
    // Input splits to dry and delay paths
    this.input.connect(this.delayDryGain);
    this.input.connect(this.delayNode);
    
    // Delay feedback loop
    this.delayNode.connect(this.feedbackGain);
    this.feedbackGain.connect(this.delayNode);
    this.delayNode.connect(this.delayWetGain);
    
    // Merge dry and wet into filter
    this.delayDryGain.connect(this.filterNode);
    this.delayWetGain.connect(this.filterNode);
    
    // Filter LFO modulates filter frequency
    this.filterLfo.connect(this.filterLfoGain);
    this.filterLfoGain.connect(this.filterNode.frequency);
    
    // Filter to gate
    this.filterNode.connect(this.gateGain);
    
    // Break LFO through shaper to gate gain
    this.breakLfo.connect(this.breakShaper);
    this.breakShaper.connect(this.breakLfoGain);
    this.breakLfoGain.connect(this.gateGain.gain);
    
    // Gate to output
    this.gateGain.connect(this.output);
  }
  
  private createBreakCurve(): Float32Array | null {
    // Creates a curve that ensures minimum volume floor (0.3)
    // and smooth transitions
    const samples = 256;
    const curve = new Float32Array(samples);
    for (let i = 0; i < samples; i++) {
      const x = (i / (samples - 1)) * 2 - 1; // -1 to 1
      // Map to 0.3 to 1.0 range with smoothing
      curve[i] = 0.65 + Math.tanh(x * 2) * 0.35;
    }
    return curve as Float32Array | null;
  }
  
  getInput(): AudioNode {
    return this.input;
  }
  
  getOutput(): AudioNode {
    return this.output;
  }
  
  setParams(params: AudioEffectParams) {
    this.targetParams = { ...params };
  }
  
  // Call this in animation loop for smooth parameter changes
  update() {
    const smoothing = 0.05;
    
    // Smooth interpolation
    this.currentParams.echo += (this.targetParams.echo - this.currentParams.echo) * smoothing;
    this.currentParams.drift += (this.targetParams.drift - this.currentParams.drift) * smoothing;
    this.currentParams.break_ += (this.targetParams.break_ - this.currentParams.break_) * smoothing;
    
    const now = this.context.currentTime;
    
    // === ECHO MAPPING ===
    // 0-30: barely audible, 30-70: roomy, 70-100: dubby
    const echo = this.currentParams.echo;
    const delayWet = echo < 0.3 
      ? echo / 0.3 * 0.15  // 0-15% wet
      : echo < 0.7 
        ? 0.15 + (echo - 0.3) / 0.4 * 0.35  // 15-50% wet
        : 0.5 + (echo - 0.7) / 0.3 * 0.3;   // 50-80% wet
    
    // Feedback clamped to prevent runaway
    const feedback = Math.min(0.6, echo * 0.6);
    const delayTime = 0.15 + echo * 0.35; // 150-500ms
    
    this.delayWetGain.gain.setTargetAtTime(delayWet, now, 0.05);
    this.delayDryGain.gain.setTargetAtTime(1 - delayWet * 0.3, now, 0.05);
    this.feedbackGain.gain.setTargetAtTime(feedback, now, 0.05);
    this.delayNode.delayTime.setTargetAtTime(delayTime, now, 0.1);
    
    // Store computed echo values for debug
    this._debugValues.echo = { wet: delayWet, feedback, delayTime };
    
    // === DRIFT MAPPING ===
    // Higher floor to prevent audio dropout at 100%
    const drift = this.currentParams.drift;
    
    // Filter frequency: floor of 4kHz to prevent dropout
    const minFreq = 4000;
    const baseFreq = drift < 0.3
      ? 18000 - drift / 0.3 * 4000  // 18kHz → 14kHz 
      : drift < 0.7
        ? 14000 - (drift - 0.3) / 0.4 * 6000  // 14kHz → 8kHz
        : Math.max(minFreq, 8000 - (drift - 0.7) / 0.3 * 4000);  // 8kHz → 4kHz
    
    // LFO depth: moderate, capped to stay above floor
    const lfoDepth = drift < 0.3 
      ? drift / 0.3 * 1500  // 0-1500Hz modulation
      : drift < 0.7
        ? 1500 + (drift - 0.3) / 0.4 * 1500  // 1500-3000Hz
        : 3000 + (drift - 0.7) / 0.3 * 1000; // 3000-4000Hz (capped)
    
    // Q: moderate resonance
    const filterQ = 1.5 + drift * 3.5; // 1.5-5 Q
    
    // LFO speed: moderate
    const lfoSpeed = 0.25 + drift * 1.25; // 0.25-1.5 Hz
    
    this.filterNode.frequency.setTargetAtTime(baseFreq, now, 0.05);
    this.filterNode.Q.setTargetAtTime(filterQ, now, 0.05);
    this.filterLfoGain.gain.setTargetAtTime(lfoDepth, now, 0.05);
    this.filterLfo.frequency.setTargetAtTime(lfoSpeed, now, 0.05);
    
    // Store computed drift values for debug
    this._debugValues.drift = { baseFreq, lfoDepth, filterQ, lfoSpeed };
    
    // === BREAK MAPPING ===
    // Starts at 5% instead of 15% for earlier activation
    const brk = this.currentParams.break_;
    
    let gateDepth = 0;
    let gateRate = 0;
    let gateMin = 1;
    let gateMax = 1;
    
    if (brk < 0.03) {
      // Off - no gating (only first 3%)
      gateDepth = 0;
      gateRate = 0.5;
      gateMin = 1;
      gateMax = 1;
    } else {
      // More aggressive gating - deeper cuts, faster onset
      gateMin = brk < 0.2
        ? 1 - (brk - 0.03) / 0.17 * 0.4  // 1.0 → 0.6 (noticeable from start)
        : brk < 0.4
          ? 0.6 - (brk - 0.2) / 0.2 * 0.25  // 0.6 → 0.35 (rhythmic)
          : brk < 0.7
            ? 0.35 - (brk - 0.4) / 0.3 * 0.15  // 0.35 → 0.2 (deep)
            : 0.2 - (brk - 0.7) / 0.3 * 0.12; // 0.2 → 0.08 (dramatic)
      
      gateMax = 1;
      gateDepth = gateMax - gateMin;
      
      // Rate: faster overall
      gateRate = brk < 0.2
        ? 0.5 + (brk - 0.03) * 4  // 0.5-1.2 Hz (pulse)
        : brk < 0.4
          ? 1.2 + (brk - 0.2) * 5  // 1.2-2.2 Hz (rhythmic)
          : brk < 0.7
            ? 2.2 + (brk - 0.4) * 4  // 2.2-3.4 Hz (choppy)
            : 3.4 + (brk - 0.7) * 6; // 3.4-5.2 Hz (stutter)
    }
    
    // Set the LFO rate
    this.breakLfo.frequency.setTargetAtTime(gateRate, now, 0.05);
    
    // Scale the LFO output for volume modulation
    const lfoScale = gateDepth * 0.7;
    this.breakLfoGain.gain.setTargetAtTime(lfoScale, now, 0.05);
    
    // Set base gate gain to center of range
    const gateCenter = gateMin + gateDepth * 0.5;
    this.gateGain.gain.setTargetAtTime(gateCenter, now, 0.05);
    
    // Store computed break values for debug
    this._debugValues.break_ = { gateDepth, gateRate, gateMin, gateMax, gateCenter };
  }
  
  // Debug values storage
  private _debugValues = {
    echo: { wet: 0, feedback: 0, delayTime: 0 },
    drift: { baseFreq: 20000, lfoDepth: 0, filterQ: 1, lfoSpeed: 0.1 },
    break_: { gateDepth: 0, gateRate: 0, gateMin: 1, gateMax: 1, gateCenter: 1 }
  };
  
  getDebugValues() {
    return this._debugValues;
  }
  
  getCurrentParams(): AudioEffectParams {
    return { ...this.currentParams };
  }
  
  dispose() {
    this.filterLfo.stop();
    this.breakLfo.stop();
    this.input.disconnect();
    this.output.disconnect();
  }
}
