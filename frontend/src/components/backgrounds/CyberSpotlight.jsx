import React, { useEffect, useState } from 'react';
import { motion, useSpring } from 'framer-motion';

/**
 * src/components/backgrounds/CyberSpotlight.jsx
 * 
 * Fundo estilo Cyber Spotlight (Lanternas Orgânicas com Blur 3XL):
 * - Fundo escuro profundo.
 * - Orbes luminosos Cyan (#00f0ff) e Magenta (#ff007f) com blur-3xl e opacidade suave (0.16).
 * - Seguem o cursor suavemente com efeito de mola física (spring animation).
 */
export default function CyberSpotlight() {
  const springConfig = { damping: 28, stiffness: 120, mass: 0.5 };
  const mouseX = useSpring(window.innerWidth / 2, springConfig);
  const mouseY = useSpring(window.innerHeight / 2, springConfig);

  const springConfigLag = { damping: 38, stiffness: 90, mass: 0.8 };
  const lagX = useSpring(window.innerWidth / 2, springConfigLag);
  const lagY = useSpring(window.innerHeight / 2, springConfigLag);

  useEffect(() => {
    const handleMouseMove = (e) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      lagX.set(e.clientX);
      lagY.set(e.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY, lagX, lagY]);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[#070a12] pointer-events-none select-none">
      {/* Luz Cyan Principal (#00f0ff) */}
      <motion.div
        style={{
          x: mouseX,
          y: mouseY,
          translateX: '-50%',
          translateY: '-50%',
        }}
        className="absolute w-[520px] h-[520px] rounded-full bg-[#00f0ff] opacity-25 blur-[100px] pointer-events-none"
      />

      {/* Luz Magenta Secundária (#ff007f) com inércia */}
      <motion.div
        style={{
          x: lagX,
          y: lagY,
          translateX: '-20%',
          translateY: '-60%',
        }}
        className="absolute w-[460px] h-[460px] rounded-full bg-[#ff007f] opacity-25 blur-[100px] pointer-events-none"
      />

      {/* Luz Violeta Central de Atmosfera */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-purple-600/15 blur-[140px] pointer-events-none" />
    </div>
  );
}
