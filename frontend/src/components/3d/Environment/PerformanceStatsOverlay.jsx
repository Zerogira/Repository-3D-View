import React, { useState, useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useAppStore } from '../../../core/store';

/**
 * src/components/3d/Environment/PerformanceStatsOverlay.jsx
 * 
 * Painel de Métricas de Performance 100% em Texto Nítido (sem canvas esticado).
 * Mede com precisão:
 * - FPS (Frames por segundo)
 * - Frame Time (ms de renderização por frame)
 * - Memória JS Heap (quando disponível em performance.memory)
 */
export function PerformanceStatsTracker() {
  const fpsRef = useRef({ frames: 0, prevTime: performance.now() });
  const setPerfStats = useAppStore((s) => s.setPerfStats);

  useFrame(() => {
    fpsRef.current.frames++;
    const now = performance.now();
    const elapsed = now - fpsRef.current.prevTime;

    if (elapsed >= 500) {
      const fps = Math.round((fpsRef.current.frames * 1000) / elapsed);
      const ms = (elapsed / fpsRef.current.frames).toFixed(1);
      let memoryMb = null;

      if (window.performance && window.performance.memory) {
        memoryMb = Math.round(window.performance.memory.usedJSHeapSize / (1024 * 1024));
      }

      if (setPerfStats) {
        setPerfStats({ fps, ms, memoryMb });
      }

      fpsRef.current.frames = 0;
      fpsRef.current.prevTime = now;
    }
  });

  return null;
}

export function PerformanceStatsTextCard() {
  const showStats = useAppStore((s) => s.showStats);
  const perfStats = useAppStore((s) => s.perfStats) || { fps: 60, ms: '16.6', memoryMb: null };

  if (!showStats) return null;

  const fpsColor =
    perfStats.fps >= 50
      ? 'text-emerald-400'
      : perfStats.fps >= 30
      ? 'text-amber-400'
      : 'text-rose-400';

  return (
    <div className="fixed left-4 bottom-4 w-80 h-12 box-border z-40 bg-slate-950/90 border border-emerald-500/40 rounded-2xl px-4 py-2 shadow-2xl backdrop-blur-xl flex items-center justify-between text-xs font-mono select-none">
      {/* FPS */}
      <div className="flex items-baseline gap-1.5">
        <span className="text-[10px] uppercase font-bold text-slate-400">FPS</span>
        <span className={`text-base font-extrabold ${fpsColor}`}>{perfStats.fps}</span>
      </div>

      <span className="text-slate-700">|</span>

      {/* Frame Time (ms) */}
      <div className="flex items-baseline gap-1.5">
        <span className="text-[10px] uppercase font-bold text-slate-400">MS</span>
        <span className="text-sm font-bold text-cyan-300">{perfStats.ms}</span>
      </div>

      {perfStats.memoryMb !== null && (
        <>
          <span className="text-slate-700">|</span>
          {/* Memória RAM / Heap */}
          <div className="flex items-baseline gap-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-400">MEM</span>
            <span className="text-sm font-bold text-purple-300">{perfStats.memoryMb} MB</span>
          </div>
        </>
      )}
    </div>
  );
}
