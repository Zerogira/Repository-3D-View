import React, { useEffect, useRef } from 'react';

/**
 * src/components/backgrounds/NetworkNodes.jsx
 * 
 * Fundo estilo Rede Neural / Constelação de Nós (Canvas):
 * - Dezenas de partículas flutuando suavemente pelo espaço escuro.
 * - Conexões automáticas entre partículas próximas.
 * - No mousemove, nós num raio de 150px traçam teias laser com o cursor em Cyan (#00f0ff) e Magenta (#ff007f).
 */
export default function NetworkNodes() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Densidade de partículas aumentada significativamente (sem espaços vazios)
    const particleCount = Math.min(140, Math.floor((width * height) / 9000));
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.65,
        vy: (Math.random() - 0.5) * 0.65,
        radius: Math.random() * 1.8 + 1.2,
        color: Math.random() > 0.45 ? '#00f0ff' : '#ff007f',
      });
    }

    const mouse = { x: -1000, y: -1000 };

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Atualizar e desenhar partículas
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.x += p.vx;
        p.y += p.vy;

        // Bouncing suave nas bordas
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.55;
        ctx.fill();

        // 2. Conectar com partículas vizinhas próximas (< 100px)
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = '#38bdf8';
            ctx.globalAlpha = (1 - dist / 100) * 0.15;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }

        // 3. Conectar interativamente ao mouse (< 150px)
        const dmx = mouse.x - p.x;
        const dmy = mouse.y - p.y;
        const distMouse = Math.sqrt(dmx * dmx + dmy * dmy);

        if (distMouse < 180) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = p.color;
          ctx.globalAlpha = (1 - distMouse / 180) * 0.85;
          ctx.lineWidth = 1.8;
          ctx.stroke();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 w-screen h-screen pointer-events-none"
    />
  );
}
