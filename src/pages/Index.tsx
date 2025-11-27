import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Hand, Fingerprint, Globe } from "lucide-react";
const Index = () => {
  return <div className="relative min-h-screen overflow-hidden bg-void">
      {/* Scanline effect */}
      <div className="scanline" />

      {/* HUD Elements */}
      {/* Left side vertical text */}
      <div className="fixed left-4 top-1/2 -translate-y-1/2 z-20 hidden md:block">
        <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/40 uppercase writing-vertical">
          ▮ sublingual radio · soma · maps for the places we haven't been yet
        </p>
      </div>

      {/* Bottom left console text */}
      <div className="fixed left-4 bottom-4 z-20 hidden md:block">
        <div className="font-mono text-[10px] text-muted-foreground/40 space-y-0.5">
          <p>&gt; listening for future signals_</p>
          <p>&gt; music_as_map :: active</p>
          <p>&gt; press H to hide HUD</p>
        </div>
      </div>

      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-deep-blue via-background to-background" />

      {/* Subtle grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:6rem_6rem] opacity-10" />

      {/* Gradient orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-phosphor/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-electric/20 rounded-full blur-[120px]" />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-20">
        {/* Album Release Header */}
        <motion.div initial={{
        opacity: 0,
        y: -20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.6
      }} className="fixed top-0 left-0 right-0 z-30 border-b border-phosphor/20 bg-void/90 backdrop-blur-md py-3 px-4">
          <div className="flex items-center justify-center gap-2 text-center">
            <span className="font-mono text-xs tracking-wider text-phosphor font-semibold">SOMA</span>
            <span className="text-muted-foreground/40">—</span>
            <span className="font-mono text-xs text-foreground/80">Maps for Places We Haven't Been Yet</span>
            <span className="text-muted-foreground/40">—</span>
            <span className="font-mono text-xs text-signal uppercase tracking-wider">Out Now</span>
            <span className="text-muted-foreground/40 hidden sm:inline">·</span>
            <span className="font-mono text-[10px] text-muted-foreground/60 hidden sm:inline">Brought to you by Sublingual Records</span>
          </div>
        </motion.div>

        {/* SOMA Title - Layered Effect */}
        <motion.div initial={{
        opacity: 0,
        scale: 0.9
      }} animate={{
        opacity: 1,
        scale: 1
      }} transition={{
        duration: 1,
        ease: "easeOut"
      }} className="mb-8 text-center">
          <div className="soma-title animate-float">
            {/* Hindi layer behind */}
            <span className="hindi-layer font-hindi select-none" aria-hidden="true">
              सोमा
            </span>
            {/* English outline */}
            <span className="english-layer text-7xl md:text-9xl tracking-tight">SOMA</span>
          </div>

          <motion.p initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} transition={{
          delay: 0.5,
          duration: 0.8
        }} className="mt-4 font-mono text-xs tracking-[0.3em] text-signal uppercase">
            Official Album Visualizer
          </motion.p>
        </motion.div>

        {/* Main content */}
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.8,
        delay: 0.3
      }} className="max-w-2xl text-center">
          <h2 className="mb-4 text-2xl font-light tracking-tight md:text-3xl text-foreground/90">
            Maps for Places We Haven't Been Yet
          </h2>

          <motion.p initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} transition={{
          duration: 0.8,
          delay: 0.5
        }} className="mb-6 text-base text-muted-foreground md:text-lg italic">
            A Psychedelic Trip Simulator
            <br />
            <span className="text-foreground/60">(For People Who Still Have Day Jobs)</span>
          </motion.p>

          <motion.div initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} transition={{
          duration: 0.8,
          delay: 0.7
        }} className="mb-6 text-sm text-muted-foreground leading-relaxed max-w-xl mx-auto">
            <p className="mb-4">
              The official album visualizer for SOMA — and a low-stakes, browser-based psychedelic experience simulator
              based by research from Harvard's Science of Psychedelics and the Qualia Research Institute.
              <span className="text-phosphor font-medium">​</span> ​
            </p>
            <p className="font-mono text-xs text-signal/70 leading-loose">
              All of the perceptual weirdness.
              <br />
              None of the identity dissolution.
            </p>
          </motion.div>

          {/* CTA Button */}
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.8,
          delay: 0.9
        }} className="mb-16">
            <Link to="/visualizer">
              <Button size="lg" className="group relative overflow-hidden bg-phosphor font-mono text-base font-semibold text-primary-foreground shadow-glow-phosphor transition-all hover:shadow-glow-electric hover:bg-electric">
                <span className="relative z-10 flex items-center gap-2">
                  Launch the Visualizer
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </span>
                <div className="absolute inset-0 bg-electric opacity-0 transition-opacity group-hover:opacity-100" />
              </Button>
            </Link>
            <p className="mt-4 font-mono text-xs text-muted-foreground/70">
              ⚠️ SEIZURE WARNING: Contains intense visual patterns, flickers, and rapid motion. View with caution.
            </p>
          </motion.div>
        </motion.div>

        {/* Features */}
        <motion.div initial={{
        opacity: 0,
        y: 40
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.8,
        delay: 1.1
      }} className="grid max-w-5xl gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="group rounded-lg border border-phosphor/20 bg-card/40 p-5 backdrop-blur-sm transition-all hover:border-phosphor/50 hover:bg-card/60">
            <div className="mb-3 text-2xl">🌀</div>
            <h3 className="mb-2 font-mono text-xs font-semibold text-foreground uppercase tracking-wider">
              Reactive Visuals
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              The world melts exactly the way your mind would melt on psychadelics
            </p>
          </div>

          <div className="group rounded-lg border border-electric/20 bg-card/40 p-5 backdrop-blur-sm transition-all hover:border-electric/50 hover:bg-card/60">
            <Hand className="mb-3 h-6 w-6 text-electric" />
            <h3 className="mb-2 font-mono text-xs font-semibold text-foreground uppercase tracking-wider">
              Interactive Controls
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Slide the sliders. Raise the "dosage." Witness small, beautiful crimes against Euclidean reality.
            </p>
          </div>

          <div className="group rounded-lg border border-glitch/20 bg-card/40 p-5 backdrop-blur-sm transition-all hover:border-glitch/50 hover:bg-card/60">
            <Fingerprint className="mb-3 h-6 w-6 text-glitch" />
            <h3 className="mb-2 font-mono text-xs font-semibold text-foreground uppercase tracking-wider">
              Unique Seeds
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              No session repeats. Share your seed code with friends to debate what you think you saw.
            </p>
          </div>

          <div className="group rounded-lg border border-signal/20 bg-card/40 p-5 backdrop-blur-sm transition-all hover:border-signal/50 hover:bg-card/60">
            <Globe className="mb-3 h-6 w-6 text-signal" />
            <h3 className="mb-2 font-mono text-xs font-semibold text-foreground uppercase tracking-wider">
              Browser-Based
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              No downloads. No VR headset. No ayahuasca diet. Let your laptop do the hallucinating.
            </p>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} transition={{
        duration: 0.8,
        delay: 1.3
      }} className="mt-16 text-center">
          <p className="font-mono text-xs text-muted-foreground/60">SUBLINGUAL RECORDS // ALBUM ZERO</p>
        </motion.div>
      </div>
    </div>;
};
export default Index;