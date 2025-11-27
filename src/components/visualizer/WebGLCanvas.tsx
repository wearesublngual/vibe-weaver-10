/**
 * WebGL Canvas Component
 * Renders the visualizer engine to a canvas
 */

import { useEffect, useRef, useCallback } from 'react';
import { OscillatorEngine } from '@/visualizers/oscillator/OscillatorEngine';
import { AudioAnalyzer } from '@/visualizers/audio-analyzer';
import { VisualizerParams, DEFAULT_PARAMS } from '@/visualizers/types';

interface WebGLCanvasProps {
  seed: string;
  params: VisualizerParams;
  analyser: AnalyserNode | null;
  imageSource?: HTMLImageElement | null;
}

const WebGLCanvas = ({ seed, params, analyser, imageSource }: WebGLCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<OscillatorEngine | null>(null);
  const audioAnalyzerRef = useRef<AudioAnalyzer>(new AudioAnalyzer());
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const paramsRef = useRef<VisualizerParams>(params);
  
  // Keep params ref updated
  useEffect(() => {
    paramsRef.current = params;
  }, [params]);
  
  // Update audio analyzer when analyser node changes
  useEffect(() => {
    audioAnalyzerRef.current.setAnalyser(analyser);
  }, [analyser]);
  
  // Update seed when it changes
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setSeed(seed);
    }
  }, [seed]);
  
  // Update image source when it changes
  useEffect(() => {
    if (engineRef.current && imageSource) {
      engineRef.current.setImage(imageSource);
    }
  }, [imageSource]);
  
  // Animation loop
  const animate = useCallback((currentTime: number) => {
    if (!engineRef.current?.isInitialized()) {
      animationRef.current = requestAnimationFrame(animate);
      return;
    }
    
    // Calculate delta time
    const deltaTime = lastTimeRef.current ? (currentTime - lastTimeRef.current) / 1000 : 0.016;
    lastTimeRef.current = currentTime;
    
    // Get audio data
    const audioData = audioAnalyzerRef.current.analyze();
    
    // Update and render
    engineRef.current.update(audioData, paramsRef.current, deltaTime);
    engineRef.current.render();
    
    animationRef.current = requestAnimationFrame(animate);
  }, []);
  
  // Initialize engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Set canvas size
    const updateSize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    
    // Create and initialize engine
    const engine = new OscillatorEngine(seed);
    engineRef.current = engine;
    
    engine.init(canvas)
      .then(() => {
        console.log('Visualizer engine ready');
        // If we already have an image, set it
        if (imageSource) {
          engine.setImage(imageSource);
        }
        // Start animation loop
        animationRef.current = requestAnimationFrame(animate);
      })
      .catch((err) => {
        console.error('Failed to initialize visualizer:', err);
      });
    
    return () => {
      window.removeEventListener('resize', updateSize);
      cancelAnimationFrame(animationRef.current);
      engine.dispose();
    };
  }, [animate, seed]);
  
  return (
    <canvas
      ref={canvasRef}
      className="h-full w-full"
      style={{ width: '100%', height: '100%' }}
    />
  );
};

export default WebGLCanvas;
