"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

interface Props {
  prenom: string;
}

export function BirthdayOverlay({ prenom }: Props) {
  const [visible, setVisible] = useState(true);
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    const fire = (opts: confetti.Options) =>
      confetti({ zIndex: 9999, ...opts });

    // Salve initiale
    fire({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.55 },
      colors: ["#d94f2b", "#c9952a", "#5b4fcf", "#2a7c6f", "#f5f0e8"],
    });

    // Côtés
    setTimeout(() => {
      fire({ particleCount: 60, angle: 60, spread: 55, origin: { x: 0, y: 0.6 } });
      fire({ particleCount: 60, angle: 120, spread: 55, origin: { x: 1, y: 0.6 } });
    }, 300);

    // Deuxième vague
    setTimeout(() => {
      fire({ particleCount: 80, spread: 100, origin: { y: 0.4 }, startVelocity: 30 });
    }, 700);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(15, 22, 35, 0.92)" }}
        >
          <motion.div
            initial={{ scale: 0.7, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: -20 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="relative mx-4 max-w-md w-full rounded-3xl text-center overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #1a2540 0%, #0f1623 100%)",
              border: "1px solid rgba(201,149,42,0.3)",
              boxShadow: "0 0 80px rgba(201,149,42,0.15), 0 25px 60px rgba(0,0,0,0.5)",
            }}
          >
            {/* Glow de fond */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse at 50% 0%, rgba(201,149,42,0.12) 0%, transparent 70%)",
              }}
            />

            <div className="relative px-8 py-10">
              {/* Emojis animés */}
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="text-6xl mb-4 select-none"
              >
                🎂
              </motion.div>

              {/* Titre */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl font-black mb-2"
                style={{ color: "#c9952a" }}
              >
                Joyeux anniversaire
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="text-4xl font-black text-white mb-4"
              >
                {prenom} ! 🎉
              </motion.p>

              {/* Message */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-sm leading-relaxed mb-8"
                style={{ color: "rgba(245,240,232,0.7)" }}
              >
                Toute l'équipe ÉduRéussite QC te souhaite une magnifique journée.
                Continue de briller — tu le mérites ! ✨
              </motion.p>

              {/* Ballons décoratifs */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="flex justify-center gap-3 text-2xl mb-8 select-none"
              >
                {["🎈", "🎊", "🎁", "🎊", "🎈"].map((e, i) => (
                  <motion.span
                    key={i}
                    animate={{ y: [0, -6, 0] }}
                    transition={{
                      repeat: Infinity,
                      duration: 1.5,
                      delay: i * 0.15,
                      ease: "easeInOut",
                    }}
                  >
                    {e}
                  </motion.span>
                ))}
              </motion.div>

              {/* Bouton */}
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setVisible(false)}
                className="w-full rounded-2xl py-3 text-sm font-bold text-white transition-opacity"
                style={{ background: "linear-gradient(90deg, #d94f2b, #c9952a)" }}
              >
                Merci ! Allons travailler 🚀
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
