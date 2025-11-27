/**
 * Audio Analyzer
 * Extracts musical features from audio for visualization
 */

import { AudioData } from './types';

export class AudioAnalyzer {
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array<ArrayBuffer> | null = null;
  
  // Smoothed values for musical feel
  private smoothedBass = 0;
  private smoothedLowMid = 0;
  private smoothedMid = 0;
  private smoothedHigh = 0;
  private smoothedEnergy = 0;
  
  // Beat detection state
  private beatThreshold = 0.6;
  private beatDecay = 0.98;
  private lastBeatTime = 0;
  private beatCooldown = 100; // ms between beats
  private energyHistory: number[] = [];
  private historySize = 43; // ~1 second at 60fps
  
  constructor() {}
  
  setAnalyser(analyser: AnalyserNode | null) {
    this.analyser = analyser;
    if (analyser) {
      this.dataArray = new Uint8Array(analyser.frequencyBinCount);
    } else {
      this.dataArray = null;
    }
  }
  
  analyze(): AudioData {
    if (!this.analyser || !this.dataArray) {
      return this.getEmptyAudioData();
    }
    
    this.analyser.getByteFrequencyData(this.dataArray);
    
    // Extract frequency bands
    // Bin indices depend on sample rate and FFT size
    // Assuming 44100 Hz and 2048 FFT size: each bin ≈ 21.5 Hz
    const rawBass = this.getAverageInRange(1, 7);      // ~20-150 Hz
    const rawLowMid = this.getAverageInRange(7, 23);   // ~150-500 Hz
    const rawMid = this.getAverageInRange(23, 93);     // ~500-2000 Hz
    const rawHigh = this.getAverageInRange(93, 372);   // ~2000-8000 Hz
    
    // Different smoothing for different bands
    // Bass: fast attack, slower release for punch
    this.smoothedBass = this.smooth(this.smoothedBass, rawBass, 
      rawBass > this.smoothedBass ? 0.5 : 0.08);
    
    // Low-mid: medium response
    this.smoothedLowMid = this.smooth(this.smoothedLowMid, rawLowMid,
      rawLowMid > this.smoothedLowMid ? 0.4 : 0.1);
    
    // Mid: balanced
    this.smoothedMid = this.smooth(this.smoothedMid, rawMid, 0.15);
    
    // High: very smooth to avoid jitter
    this.smoothedHigh = this.smooth(this.smoothedHigh, rawHigh, 0.1);
    
    // Overall energy
    const rawEnergy = (rawBass * 2 + rawLowMid + rawMid + rawHigh * 0.5) / 4.5;
    this.smoothedEnergy = this.smooth(this.smoothedEnergy, rawEnergy, 0.2);
    
    // Beat detection using energy spike
    this.energyHistory.push(this.smoothedBass);
    if (this.energyHistory.length > this.historySize) {
      this.energyHistory.shift();
    }
    
    const avgEnergy = this.energyHistory.reduce((a, b) => a + b, 0) / this.energyHistory.length;
    const now = performance.now();
    const beatDetected = 
      this.smoothedBass > avgEnergy * 1.5 &&
      this.smoothedBass > this.beatThreshold &&
      now - this.lastBeatTime > this.beatCooldown;
    
    if (beatDetected) {
      this.lastBeatTime = now;
    }
    
    // Beat intensity decays over time
    const timeSinceBeat = now - this.lastBeatTime;
    const beatIntensity = Math.max(0, 1 - timeSinceBeat / 200) * this.smoothedBass;
    
    return {
      bass: this.smoothedBass,
      lowMid: this.smoothedLowMid,
      mid: this.smoothedMid,
      high: this.smoothedHigh,
      energy: this.smoothedEnergy,
      beatDetected,
      beatIntensity,
    };
  }
  
  private getAverageInRange(start: number, end: number): number {
    if (!this.dataArray) return 0;
    let sum = 0;
    const actualEnd = Math.min(end, this.dataArray.length);
    for (let i = start; i < actualEnd; i++) {
      sum += this.dataArray[i];
    }
    return sum / (actualEnd - start) / 255;
  }
  
  private smooth(current: number, target: number, factor: number): number {
    return current + (target - current) * factor;
  }
  
  private getEmptyAudioData(): AudioData {
    // Gentle ambient values when no audio
    return {
      bass: 0.1,
      lowMid: 0.1,
      mid: 0.1,
      high: 0.05,
      energy: 0.1,
      beatDetected: false,
      beatIntensity: 0,
    };
  }
}
