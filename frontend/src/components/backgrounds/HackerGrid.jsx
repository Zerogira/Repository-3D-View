import React, { useEffect, useRef } from 'react';

/**
 * src/components/backgrounds/HackerGrid.jsx
 * 
 * Fundo estilo Hacker Matrix / Cyber Grid:
 * - Canvas cobrindo a tela toda (absolute inset-0 -z-10).
 * - Caracteres (+, -, <, >, {, }, /, *, ~, #, $, 0, 1) em baixa opacidade (0.06).
 * - No mousemove, acendem em Cyan (#00f0ff) e Magenta (#ff007f) num raio de 120px e sofrem fade-out suave.
 */
export default function HackerGrid() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const chars = ['+', '-', '<', '>', '{', '}', '/', '*', '~', '#', '$', '0', '1', ';', ':'];
    const cellSize = 32;
    let cols = Math.ceil(width / cellSize);
    let rows = Math.ceil(height / cellSize);

    // Estrutura de células
    let grid = [];
    const initGrid = () => {
      grid = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          grid.push({
            char: chars[Math.floor(Math.random() * chars.length)],
            x: c * cellSize + cellSize / 2,
            y: r * cellSize + cellSize / 2,
            intensity: 0,
            color: Math.random() > 0.5 ? '#00f0ff' : '#ff007f',
          });
        }
      }
    };
    initGrid();

    const mouse = { x: -1000, y: -1000, isMoving: false };
    let mouseStopTimeout = null;

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.isMoving = true;

      if (mouseStopTimeout) clearTimeout(mouseStopTimeout);
      mouseStopTimeout = setTimeout(() => {
        mouse.isMoving = false;
      }, 100);
    };

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      cols = Math.ceil(width / cellSize);
      rows = Math.ceil(height / cellSize);
      initGrid();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      ctx.font = '12px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (let i = 0; i < grid.length; i++) {
        const cell = grid[i];

        // Se o mouse estiver em movimento ativo e dentro do raio de 85px
        if (mouse.isMoving) {
          const dx = mouse.x - cell.x;
          const dy = mouse.y - cell.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 85) {
            const boost = (1 - dist / 85);
            if (boost > cell.intensity) {
              cell.intensity = boost;
            }
          }
        }

        // Decaimento contínuo da intensidade ao longo do tempo (apaga tudo ao parar)
        cell.intensity = Math.max(0, cell.intensity - 0.04);

        if (cell.intensity > 0.02) {
          ctx.fillStyle = cell.color;
          ctx.globalAlpha = Math.min(1, 0.2 + cell.intensity * 0.8);
          ctx.fillText(cell.char, cell.x, cell.y);
        } else {
          ctx.fillStyle = '#64748b';
          ctx.globalAlpha = 0.08;
          ctx.fillText(cell.char, cell.x, cell.y);
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
