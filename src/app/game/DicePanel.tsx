'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DiceProps {
  values: [number, number];
  rolling: boolean;
  onRoll: () => void;
  disabled: boolean;
}

const DICE_FACES: Record<number, number[][]> = {
  1: [[1, 1]],
  2: [[0, 0], [2, 2]],
  3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [0, 2], [2, 0], [2, 2]],
  5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
  6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]],
};

function DiceDot({ delay }: { delay: number }) {
  return (
    <motion.div
      className="w-3 h-3 rounded-full bg-lada/90"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 600, damping: 12, delay }}
    />
  );
}

function SingleDie({ value, isRolling }: { value: number; isRolling: boolean }) {
  const [flicker, setFlicker] = useState(value);

  useEffect(() => {
    if (isRolling) {
      const iv = setInterval(() => setFlicker(Math.floor(Math.random() * 6) + 1), 55);
      return () => clearInterval(iv);
    }
    setFlicker(value);
  }, [isRolling, value]);

  const dots = DICE_FACES[flicker] || DICE_FACES[1];

  return (
    <motion.div
      className="relative"
      animate={
        isRolling
          ? {
              y: [0, -40, 0, -20, 0, -8, 0],
              rotateZ: [0, -20, 25, -15, 10, -5, 0],
              scale: [1, 1.15, 0.9, 1.1, 0.95, 1.05, 1],
            }
          : { y: 0, rotateZ: 0, scale: 1 }
      }
      transition={isRolling ? { duration: 0.8, ease: [0.22, 1, 0.36, 1] } : { duration: 0.15 }}
    >
      {/* Ground shadow */}
      <motion.div
        className="absolute -bottom-2 left-1 right-1 h-4 bg-black/15 rounded-full blur-md"
        animate={isRolling ? { scaleX: [1, 0.6, 1, 0.8, 1] } : { scaleX: 1 }}
        transition={{ duration: 0.8 }}
      />

      {/* Die body */}
      <div className="relative w-[68px] h-[68px] bg-gradient-to-br from-white via-gray-50 to-gray-200 border-[3px] border-lada/70 rounded-2xl shadow-xl overflow-hidden">
        {/* Glossy highlight */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/70 via-transparent to-transparent rounded-2xl pointer-events-none" />
        {/* Bottom edge shadow */}
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-black/5 rounded-b-2xl" />

        {/* Dot grid */}
        <div className="relative z-10 grid grid-cols-3 grid-rows-3 w-full h-full p-3">
          {Array.from({ length: 9 }).map((_, i) => {
            const row = Math.floor(i / 3);
            const col = i % 3;
            const hasDot = dots.some((d) => d[0] === row && d[1] === col);
            return (
              <div key={i} className="flex items-center justify-center">
                {hasDot && <DiceDot delay={Math.random() * 0.05} />}
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

export default function DicePanel({ values, rolling, onRoll, disabled }: DiceProps) {
  const [isRolling, setIsRolling] = useState(false);
  const total = values[0] + values[1];
  const isDouble = values[0] === values[1];

  const handleRoll = () => {
    if (disabled || isRolling) return;
    setIsRolling(true);
    onRoll();
    setTimeout(() => setIsRolling(false), 1000);
  };

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Dice pair */}
      <div className="flex gap-6 items-end">
        <SingleDie value={values[0]} isRolling={isRolling} />
        <SingleDie value={values[1]} isRolling={isRolling} />
      </div>

      {/* Result */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${values[0]}-${values[1]}`}
          initial={{ opacity: 0, y: 15, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -15, scale: 0.8 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className="text-center min-h-[60px] flex flex-col items-center justify-center"
        >
          <span className="text-5xl font-black text-lada drop-shadow-sm">{total}</span>
          <AnimatePresence>
            {isDouble && !isRolling && (
              <motion.div
                initial={{ scale: 0, y: 5 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0 }}
                transition={{ type: 'spring', stiffness: 400, delay: 0.1 }}
                className="mt-1"
              >
                <span className="text-sm font-black text-gula bg-gula/20 px-4 py-1 rounded-full border-2 border-gula/40">
                  DOUBLE!
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>

      {/* Button */}
      <motion.button
        className={`btn-retro text-lg px-8 py-3 font-black transition-colors ${
          disabled || isRolling
            ? 'opacity-30 cursor-not-allowed bg-garam text-lada/40 border-lada/20'
            : 'bg-gula text-lada hover:bg-yellow-400 active:bg-yellow-500'
        }`}
        onClick={handleRoll}
        disabled={disabled || isRolling}
        whileHover={!disabled && !isRolling ? { scale: 1.04, y: -2 } : undefined}
        whileTap={!disabled && !isRolling ? { scale: 0.96 } : undefined}
      >
        <AnimatePresence mode="wait">
          {isRolling ? (
            <motion.span
              key="rolling"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
            >
              🎲 Melempar...
            </motion.span>
          ) : (
            <motion.span
              key="idle"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
            >
              🎲 Lempar Dadu
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
