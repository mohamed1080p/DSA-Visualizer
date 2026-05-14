import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Frown, Minus, X } from 'lucide-react';

interface ConfettiPiece {
  id: number;
  x: number;
  delay: number;
  duration: number;
  color: string;
  size: number;
  rotation: number;
  swayAmount: number;
}

const CONFETTI_COLORS = [
  '#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE',
  '#FF9FF3', '#54A0FF', '#5F27CD', '#01A3A4', '#F368E0',
];

function generateConfetti(count: number): ConfettiPiece[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 2.5 + Math.random() * 2,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    size: 6 + Math.random() * 10,
    rotation: Math.random() * 360,
    swayAmount: -30 + Math.random() * 60,
  }));
}

function ConfettiCanvas() {
  const [pieces] = useState(() => generateConfetti(80));

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: -20, x: `${p.x}vw`, rotate: p.rotation, opacity: 1 }}
          animate={{
            y: '110vh',
            x: `calc(${p.x}vw + ${p.swayAmount}px)`,
            rotate: p.rotation + 720,
            opacity: [1, 1, 1, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: 'linear',
          }}
          style={{
            position: 'absolute',
            width: p.size,
            height: p.size * 0.6,
            backgroundColor: p.color,
            borderRadius: p.size > 12 ? '50%' : '2px',
          }}
        />
      ))}
    </div>
  );
}

interface VictoryOverlayProps {
  outcome: 'win' | 'loss' | 'draw';
  onClose: () => void;
}

export default function VictoryOverlay({ outcome, onClose }: VictoryOverlayProps) {
  const [showConfetti, setShowConfetti] = useState(outcome === 'win');

  // Auto-dismiss confetti after a while
  useEffect(() => {
    if (outcome === 'win') {
      const timer = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [outcome]);

  const handleClose = useCallback(() => {
    setShowConfetti(false);
    onClose();
  }, [onClose]);

  const isWin = outcome === 'win';
  const isDraw = outcome === 'draw';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-md"
          onClick={handleClose}
        />

        {/* Confetti */}
        {showConfetti && <ConfettiCanvas />}

        {/* Main Card */}
        <motion.div
          initial={{ scale: 0.3, opacity: 0, y: 60 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.1 }}
          className="relative z-[70] mx-4 w-full max-w-lg overflow-hidden rounded-3xl border border-border bg-surface shadow-elevated"
        >
          {/* Glow background for winners */}
          {isWin && (
            <motion.div
              animate={{
                opacity: [0.3, 0.6, 0.3],
                scale: [1, 1.1, 1],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -inset-4 rounded-3xl"
              style={{
                background: 'radial-gradient(circle, oklch(0.78 0.18 80 / 0.3), transparent 70%)',
              }}
            />
          )}

          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background/50 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Content */}
          <div className="relative flex flex-col items-center px-8 pb-10 pt-12 text-center">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', damping: 10, stiffness: 150, delay: 0.3 }}
              className={`mb-6 flex h-24 w-24 items-center justify-center rounded-full ${
                isWin
                  ? 'bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 shadow-[0_0_60px_-10px_rgba(255,200,0,0.6)]'
                  : isDraw
                    ? 'bg-gradient-to-br from-slate-400 to-slate-600'
                    : 'bg-gradient-to-br from-red-500 to-rose-700'
              }`}
            >
              {isWin ? (
                <Trophy className="h-12 w-12 text-white drop-shadow-lg" />
              ) : isDraw ? (
                <Minus className="h-12 w-12 text-white drop-shadow-lg" />
              ) : (
                <Frown className="h-12 w-12 text-white drop-shadow-lg" />
              )}
            </motion.div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              {isWin ? (
                <>
                  <h2
                    className="font-display text-5xl font-black uppercase tracking-tight"
                    style={{
                      background: 'linear-gradient(135deg, #FFD700, #FFA500, #FF6347)',
                      WebkitBackgroundClip: 'text',
                      backgroundClip: 'text',
                      color: 'transparent',
                      textShadow: 'none',
                    }}
                  >
                    Winner Winner
                  </h2>
                  <motion.h2
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8, type: 'spring', damping: 8, stiffness: 120 }}
                    className="mt-1 font-display text-5xl font-black uppercase tracking-tight"
                    style={{
                      background: 'linear-gradient(135deg, #FFA500, #FF6347, #FF1493)',
                      WebkitBackgroundClip: 'text',
                      backgroundClip: 'text',
                      color: 'transparent',
                    }}
                  >
                    Chicken Dinner! 🍗
                  </motion.h2>
                </>
              ) : isDraw ? (
                <h2 className="font-display text-4xl font-black uppercase tracking-tight text-muted-foreground">
                  It's a Draw
                </h2>
              ) : (
                <h2 className="font-display text-4xl font-black uppercase tracking-tight text-destructive">
                  Defeated
                </h2>
              )}
            </motion.div>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-4 max-w-xs text-sm text-muted-foreground"
            >
              {isWin
                ? 'You crushed it! Your algorithm skills are legendary. 🏆'
                : isDraw
                  ? 'Evenly matched! Both warriors fought with honor.'
                  : 'Don\'t give up! Every loss is a step toward mastery. 💪'}
            </motion.p>

            {/* Animated stars for winner */}
            {isWin && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="mt-6 flex gap-2"
              >
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, scale: 0, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: 1.3 + i * 0.15, type: 'spring', damping: 8 }}
                    className="text-3xl"
                  >
                    ⭐
                  </motion.span>
                ))}
              </motion.div>
            )}

            {/* Close / return button */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5 }}
              onClick={handleClose}
              className={`mt-8 flex h-12 items-center gap-2 rounded-xl px-10 font-display text-sm font-bold transition-all ${
                isWin
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:shadow-[0_0_30px_-5px_rgba(255,200,0,0.5)]'
                  : 'bg-primary text-primary-foreground hover:shadow-glow'
              }`}
            >
              {isWin ? '🎉 Back to Arena' : 'Return to Arena'}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
