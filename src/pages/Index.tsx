import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Radio, Waves, Sparkles } from "lucide-react";

const Index = () => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-void">
      {/* Scanline effect */}
      <div className="scanline" />
      
      {/* Background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20" />
      
      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-br from-phosphor/5 via-transparent to-electric/5" />
      
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8 text-center"
        >
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-phosphor/30 bg-card/50 px-4 py-2 backdrop-blur-sm">
            <Radio className="h-4 w-4 text-phosphor animate-pulse" />
            <span className="font-mono text-xs tracking-wider text-signal">
              SUBLINGUAL RADIO // TRANSMISSION ACTIVE
            </span>
          </div>
        </motion.div>

        {/* Main content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-4xl text-center"
        >
          <h1 className="mb-6 text-6xl font-bold tracking-tight md:text-8xl">
            <span className="bg-gradient-to-r from-phosphor via-electric to-phosphor bg-clip-text text-transparent animate-pulse-glow">
              SUBLINGUAL
            </span>
            <br />
            <span className="text-4xl font-light text-foreground/80 md:text-5xl">
              Visualizer
            </span>
          </h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mb-4 text-xl text-muted-foreground md:text-2xl"
          >
            A speculative design artifact at the intersection of music,
            <br className="hidden md:block" />
            generative systems, and human intentionality
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mb-12 font-mono text-sm text-signal"
          >
            // Real-time sound-reactive generative art engine
            <br />
            // Every session is unique. Every vibe is emergent.
            <br />
            // You don't just listen — you interfere.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Link to="/visualizer">
              <Button
                size="lg"
                className="group relative overflow-hidden bg-phosphor font-mono text-lg font-semibold text-primary-foreground shadow-glow-phosphor transition-all hover:shadow-glow-electric hover:bg-electric"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Launch Visualizer
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </span>
                <div className="absolute inset-0 bg-electric opacity-0 transition-opacity group-hover:opacity-100" />
              </Button>
            </Link>

            <Button
              variant="outline"
              size="lg"
              className="border-phosphor/30 bg-card/50 font-mono text-lg text-foreground backdrop-blur-sm hover:border-phosphor hover:bg-card/80"
            >
              <Waves className="mr-2 h-5 w-5" />
              About SOMA
            </Button>
          </motion.div>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="mt-24 grid max-w-5xl gap-6 md:grid-cols-3"
        >
          <div className="group rounded-lg border border-phosphor/20 bg-card/30 p-6 backdrop-blur-sm transition-all hover:border-phosphor/50 hover:bg-card/50">
            <Waves className="mb-4 h-8 w-8 text-phosphor" />
            <h3 className="mb-2 font-mono text-lg font-semibold text-foreground">
              Sound → System
            </h3>
            <p className="text-sm text-muted-foreground">
              Real-time audio analysis transforms music into living, breathing visual systems using Hydra + Web Audio
            </p>
          </div>

          <div className="group rounded-lg border border-electric/20 bg-card/30 p-6 backdrop-blur-sm transition-all hover:border-electric/50 hover:bg-card/50">
            <Sparkles className="mb-4 h-8 w-8 text-electric" />
            <h3 className="mb-2 font-mono text-lg font-semibold text-foreground">
              Emergent Worlds
            </h3>
            <p className="text-sm text-muted-foreground">
              Each session generates a unique visual universe. Seed-based randomness ensures no two experiences are the same
            </p>
          </div>

          <div className="group rounded-lg border border-glitch/20 bg-card/30 p-6 backdrop-blur-sm transition-all hover:border-glitch/50 hover:bg-card/50">
            <Radio className="mb-4 h-8 w-8 text-glitch" />
            <h3 className="mb-2 font-mono text-lg font-semibold text-foreground">
              Cyborg Co-Creation
            </h3>
            <p className="text-sm text-muted-foreground">
              Neither human nor machine is in full control. The art emerges from the collaboration between both
            </p>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="mt-24 text-center"
        >
          <p className="font-mono text-xs text-muted-foreground">
            SUBLINGUAL RECORDS // ALBUM ZERO: SOMA
            <br />
            "Maps for the Places We Haven't Been Yet"
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Index;
