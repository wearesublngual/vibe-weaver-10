import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Hand, Fingerprint, Globe } from "lucide-react";

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
        {/* Header badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8 text-center"
        >
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-phosphor/30 bg-card/50 px-4 py-2 backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-phosphor animate-pulse" />
            <span className="font-mono text-xs tracking-wider text-signal">
              SOMA VISUALIZER
            </span>
          </div>
        </motion.div>

        {/* Main content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-3xl text-center"
        >
          <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
            <span className="bg-gradient-to-r from-phosphor via-electric to-phosphor bg-clip-text text-transparent">
              Maps for Places
            </span>
            <br />
            <span className="text-foreground/90">
              We Haven't Been Yet
            </span>
          </h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mb-6 text-lg text-muted-foreground md:text-xl italic"
          >
            A Psychedelic Trip Simulator
            <br />
            <span className="text-foreground/70">(For People Who Still Have Day Jobs)</span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mb-6 text-sm text-muted-foreground leading-relaxed max-w-2xl mx-auto"
          >
            <p className="mb-4">
              This is the official album visualizer for <span className="text-phosphor font-medium">SOMA</span> —
              and, unintentionally (but also very intentionally),
              a low-stakes, browser-based psychedelic experience simulator
              inspired by research from Harvard's Science of Psychedelics
              and the Qualia Research Institute.
            </p>
            <p className="font-mono text-xs text-signal/80">
              All of the perceptual weirdness.
              <br />
              None of the identity dissolution.
              <br />
              Zero awkward "So… how are you feeling?" phone calls the morning after.
            </p>
          </motion.div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="mb-16"
          >
            <Link to="/visualizer">
              <Button
                size="lg"
                className="group relative overflow-hidden bg-phosphor font-mono text-lg font-semibold text-primary-foreground shadow-glow-phosphor transition-all hover:shadow-glow-electric hover:bg-electric"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Launch the Visualizer
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </span>
                <div className="absolute inset-0 bg-electric opacity-0 transition-opacity group-hover:opacity-100" />
              </Button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-4"
        >
          <div className="group rounded-lg border border-phosphor/20 bg-card/30 p-6 backdrop-blur-sm transition-all hover:border-phosphor/50 hover:bg-card/50">
            <div className="mb-4 text-2xl">🌀</div>
            <h3 className="mb-2 font-mono text-sm font-semibold text-foreground">
              Reactive Visuals
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              The world melts exactly the way your mind would melt
              if your consciousness had a dedicated soundtrack —
              which now it does.
            </p>
          </div>

          <div className="group rounded-lg border border-electric/20 bg-card/30 p-6 backdrop-blur-sm transition-all hover:border-electric/50 hover:bg-card/50">
            <Hand className="mb-4 h-6 w-6 text-electric" />
            <h3 className="mb-2 font-mono text-sm font-semibold text-foreground">
              Interactive Controls
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Slide the sliders. Turn the knobs. Raise the "dosage."
              Witness the vibe commit small, beautiful crimes against Euclidean reality.
            </p>
          </div>

          <div className="group rounded-lg border border-glitch/20 bg-card/30 p-6 backdrop-blur-sm transition-all hover:border-glitch/50 hover:bg-card/50">
            <Fingerprint className="mb-4 h-6 w-6 text-glitch" />
            <h3 className="mb-2 font-mono text-sm font-semibold text-foreground">
              Unique Session Seeds
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              No session repeats itself. Share your seed code with friends
              if you want them to see what you saw — or debate what you think you saw.
            </p>
          </div>

          <div className="group rounded-lg border border-signal/20 bg-card/30 p-6 backdrop-blur-sm transition-all hover:border-signal/50 hover:bg-card/50">
            <Globe className="mb-4 h-6 w-6 text-signal" />
            <h3 className="mb-2 font-mono text-sm font-semibold text-foreground">
              Runs In Your Browser
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              No downloads. No VR headset. No ayahuasca diet.
              Just enter, breathe, and let your laptop do the hallucinating for you.
            </p>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="mt-20 text-center"
        >
          <p className="font-mono text-xs text-muted-foreground">
            SUBLINGUAL RECORDS // ALBUM ZERO: SOMA
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Index;
