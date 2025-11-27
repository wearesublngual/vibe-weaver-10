/**
 * Advanced Audio Analyzer
 * Extracts musical features for expressive visualization
 */

import { AudioData } from './types';

export class AudioAnalyzer {
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;
  
  // Current smoothed values
  private bass = 0;
  private lowMid = 0;
  private mid = 0;
  private high = 0;
  private energy = 0;
  
  // Previous frame values (for velocity/onset detection)
  private prevBass = 0;
  private prevLowMid = 0;
  private prevMid = 0;
  private prevHigh = 0;
  private prevEnergy = 0;
  
  // Peak hold values (decay slowly, capture transients)
  private peakBass = 0;
  private peakEnergy = 0;
  
  // Spectral flux (rate of change in spectrum)
  private spectralFlux = 0;
  private prevSpectrum: number[] = [];
  
  // Beat detection
  private energyHistory: number[] = [];
  private historySize = 43; // ~700ms at 60fps
  private lastBeatTime = 0;
  private beatCooldown = 120; // ms minimum between beats
  private adaptiveThreshold = 0.5;
  
  // Auto-gain normalization
  private maxObservedEnergy = 0.1;
  private gainDecay = 0.999; // Slowly forget max
  
  constructor() {}
  
  setAnalyser(analyser: AnalyserNode | null) {
    this.analyser = analyser;
    if (analyser) {
      this.dataArray = new Uint8Array(analyser.frequencyBinCount);
      this.prevSpectrum = new Array(analyser.frequencyBinCount).fill(0);
    } else {
      this.dataArray = null;
    }
  }
  
  analyze(): AudioData {
    if (!this.analyser || !this.dataArray) {
      return this.getIdleAudioData();
    }
    
    this.analyser.getByteFrequencyData(this.dataArray as Uint8Array<ArrayBuffer>);
    
    // Store previous values for velocity calculation
    this.prevBass = this.bass;
    this.prevLowMid = this.lowMid;
    this.prevMid = this.mid;
    this.prevHigh = this.high;
    this.prevEnergy = this.energy;
    
    // Extract frequency bands with more precise ranges
    // Assuming 44100 Hz sample rate, 2048 FFT = 21.5 Hz per bin
    const rawSubBass = this.getBandEnergy(1, 3);     // 20-60 Hz (kick thump)
    const rawBass = this.getBandEnergy(3, 8);        // 60-170 Hz (bass body)
    const rawLowMid = this.getBandEnergy(8, 23);     // 170-500 Hz (warmth)
    const rawMid = this.getBandEnergy(23, 93);       // 500-2000 Hz (presence)
    const rawHighMid = this.getBandEnergy(93, 186);  // 2000-4000 Hz (clarity)
    const rawHigh = this.getBandEnergy(186, 372);    // 4000-8000 Hz (air)
    
    // Combine sub-bass and bass for stronger kick response
    const combinedBass = rawSubBass * 0.6 + rawBass * 0.4;
    
    // Calculate spectral flux (how much the spectrum is changing)
    let flux = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      const diff = (this.dataArray[i] / 255) - this.prevSpectrum[i];
      if (diff > 0) flux += diff; // Only count increases (onset)
      this.prevSpectrum[i] = this.dataArray[i] / 255;
    }
    this.spectralFlux = flux / this.dataArray.length * 10; // Normalize
    
    // Asymmetric smoothing: fast attack, slow release
    // This makes the visuals "punch" on transients but flow smoothly otherwise
    this.bass = this.asymmetricSmooth(this.bass, combinedBass, 0.6, 0.05);
    this.lowMid = this.asymmetricSmooth(this.lowMid, rawLowMid, 0.5, 0.08);
    this.mid = this.asymmetricSmooth(this.mid, rawMid, 0.4, 0.1);
    this.high = this.asymmetricSmooth(this.high, rawHigh + rawHighMid * 0.5, 0.3, 0.12);
    
    // Overall energy (weighted toward bass for dance music)
    const rawEnergy = combinedBass * 0.4 + rawLowMid * 0.25 + rawMid * 0.2 + rawHigh * 0.15;
    this.energy = this.asymmetricSmooth(this.energy, rawEnergy, 0.5, 0.08);
    
    // Auto-gain: normalize to observed maximum
    this.maxObservedEnergy = Math.max(this.maxObservedEnergy * this.gainDecay, this.energy);
    const normalizedEnergy = this.energy / Math.max(this.maxObservedEnergy, 0.1);
    
    // Peak detection with decay
    this.peakBass = Math.max(this.peakBass * 0.92, this.bass);
    this.peakEnergy = Math.max(this.peakEnergy * 0.94, normalizedEnergy);
    
    // Beat detection using multiple signals
    this.energyHistory.push(this.bass);
    if (this.energyHistory.length > this.historySize) {
      this.energyHistory.shift();
    }
    
    // Adaptive threshold based on recent history
    const avgEnergy = this.energyHistory.reduce((a, b) => a + b, 0) / this.energyHistory.length;
    const variance = this.energyHistory.reduce((sum, e) => sum + Math.pow(e - avgEnergy, 2), 0) / this.energyHistory.length;
    this.adaptiveThreshold = avgEnergy + Math.sqrt(variance) * 1.5;
    
    const now = performance.now();
    const timeSinceBeat = now - this.lastBeatTime;
    
    // Beat is detected when:
    // 1. Bass exceeds adaptive threshold
    // 2. Spectral flux is high (something changed)
    // 3. Enough time has passed since last beat
    const beatDetected = 
      this.bass > this.adaptiveThreshold &&
      this.bass > this.prevBass * 1.2 && // Bass is rising
      this.spectralFlux > 0.1 &&
      timeSinceBeat > this.beatCooldown;
    
    if (beatDetected) {
      this.lastBeatTime = now;
    }
    
    // Beat intensity: peaks quickly, decays smoothly
    // Uses exponential decay for natural feel
    const beatDecay = Math.exp(-timeSinceBeat / 150); // 150ms half-life
    const beatIntensity = beatDetected ? 1.0 : beatDecay * this.peakBass;
    
    // Velocity: rate of change (THIS IS KEY for "feeling" the music)
    const bassVelocity = Math.max(0, this.bass - this.prevBass) * 5;
    const energyVelocity = Math.max(0, normalizedEnergy - this.prevEnergy) * 5;
    
    return {
      // Levels (0-1)
      bass: this.bass,
      lowMid: this.lowMid,
      mid: this.mid,
      high: this.high,
      energy: normalizedEnergy,
      
      // Beat
      beatDetected,
      beatIntensity: Math.min(1, beatIntensity + bassVelocity * 0.5),
      
      // Extended data (we'll add these to the interface)
      // For now, encode velocity in beatIntensity
    };
  }
  
  private getBandEnergy(startBin: number, endBin: number): number {
    if (!this.dataArray) return 0;
    
    let sum = 0;
    const actualEnd = Math.min(endBin, this.dataArray.length);
    
    for (let i = startBin; i < actualEnd; i++) {
      // Square for perceptual loudness
      const val = this.dataArray[i] / 255;
      sum += val * val;
    }
    
    return Math.sqrt(sum / (actualEnd - startBin)); // RMS
  }
  
  private asymmetricSmooth(current: number, target: number, attackRate: number, releaseRate: number): number {
    const rate = target > current ? attackRate : releaseRate;
    return current + (target - current) * rate;
  }
  
  private getIdleAudioData(): AudioData {
    // Gentle breathing motion when no audio
    const t = performance.now() / 1000;
    const breath = Math.sin(t * 0.5) * 0.05 + 0.1;
    
    return {
      bass: breath,
      lowMid: breath * 0.8,
      mid: breath * 0.6,
      high: breath * 0.3,
      energy: breath,
      beatDetected: false,
      beatIntensity: 0,
    };
  }
  
  // Debug method to visualize audio data
  getDebugInfo(): string {
    return `B:${this.bass.toFixed(2)} LM:${this.lowMid.toFixed(2)} M:${this.mid.toFixed(2)} H:${this.high.toFixed(2)} E:${this.energy.toFixed(2)} Flux:${this.spectralFlux.toFixed(2)}`;
  }
}
