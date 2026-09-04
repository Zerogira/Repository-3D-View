import React, { useState, useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Activity, Play, CheckCircle2, ChevronUp, ChevronDown, AlertTriangle } from 'lucide-react';
import { useAppStore } from '../../../core/store';

/**
 * src/components/3d/Environment/PerformanceStatsOverlay.jsx
 * 
 * Profiler Profissional de Performance 3D via GPU (Three.js renderer.info):
 * - FPS e Frame Time (ms) contínuos
 * - Draw Calls em tempo real (gl.info.render.calls)
 * - Triângulos e Polígonos na cena (gl.info.render.triangles)
 * - Geometrias e Texturas alocadas na memória VRAM (gl.info.memory)
 * - Memória JS Heap RAM (MB)
 * - Modo Benchmark Automatizado de Diagnóstico ("Rodar Diagnóstico"):
 *   Liga e desliga features (Base -> Linhas -> Bolinhas -> Textos) medindo impacto real de cada recurso!
 */
export function PerformanceStatsTracker() {
  const { gl } = useThree();
  const fpsRef = useRef({ frames: 0, prevTime: performance.now() });
  const setPerfStats = useAppStore((s) => s.setPerfStats);
  const metricsRef = useRef({ calls: 0, triangles: 0, geometries: 0, textures: 0 });

  // Desativa o autoReset automático no início do render para não zerar as contagens reais
  useEffect(() => {
    if (gl?.info) {
      gl.info.autoReset = false;
    }
    return () => {
      if (gl?.info) gl.info.autoReset = true;
    };
  }, [gl]);

  useFrame(() => {
    fpsRef.current.frames++;
    const now = performance.now();
    const elapsed = now - fpsRef.current.prevTime;

    // Captura os dados da cena real acumulados neste frame
    if (gl?.info) {
      metricsRef.current = {
        calls: Math.max(metricsRef.current.calls, gl.info.render.calls || 0),
        triangles: Math.max(metricsRef.current.triangles, gl.info.render.triangles || 0),
        geometries: gl.info.memory.geometries || 0,
        textures: gl.info.memory.textures || 0,
      };
      // Reseta manualmente para o próximo frame
      gl.info.reset();
    }

    // Atualiza o store a cada ~500ms
    if (elapsed >= 500) {
      const fps = Math.round((fpsRef.current.frames * 1000) / elapsed);
      const ms = (elapsed / fpsRef.current.frames).toFixed(1);
      let memoryMb = null;

      if (window.performance && window.performance.memory) {
        memoryMb = Math.round(window.performance.memory.usedJSHeapSize / (1024 * 1024));
      }

      if (setPerfStats) {
        setPerfStats({
          fps,
          ms,
          memoryMb,
          drawCalls: metricsRef.current.calls,
          triangles: metricsRef.current.triangles,
          geometries: metricsRef.current.geometries,
          textures: metricsRef.current.textures,
        });
      }

      fpsRef.current.frames = 0;
      fpsRef.current.prevTime = now;
      metricsRef.current.calls = 0;
      metricsRef.current.triangles = 0;
    }
  });

  return null;
}

export function PerformanceStatsTextCard() {
  const showStats = useAppStore((s) => s.showStats);
  const perfStats = useAppStore((s) => s.perfStats) || {
    fps: 60,
    ms: '16.6',
    memoryMb: null,
    drawCalls: 0,
    triangles: 0,
    textures: 0,
  };

  const [isExpanded, setIsExpanded] = useState(false);
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [benchmarkResults, setBenchmarkResults] = useState(null);
  const [benchmarkStep, setBenchmarkStep] = useState('');

  // Toggles do store para automação de benchmark
  const setShowEdges = useAppStore((s) => s.setShowEdges);
  const setShowFileGeometry = useAppStore((s) => s.setShowFileGeometry);
  const setShowFolderLabels = useAppStore((s) => s.setShowFolderLabels);
  const setShowFileLabels = useAppStore((s) => s.setShowFileLabels);

  if (!showStats) return null;

  const fps = perfStats.fps || 60;
  const fpsColor =
    fps >= 50 ? 'text-emerald-400' : fps >= 30 ? 'text-amber-400' : 'text-rose-400';

  const drawCalls = perfStats.drawCalls || 0;
  const drawCallsColor =
    drawCalls > 800 ? 'text-rose-400' : drawCalls > 300 ? 'text-amber-400' : 'text-cyan-300';

  // Execução do Diagnóstico Científico de Performance
  const runDiagnosticBenchmark = async () => {
    if (isBenchmarking) return;
    setIsBenchmarking(true);
    setIsExpanded(true);
    setBenchmarkResults(null);

    // Salva o estado original do usuário
    const originalState = {
      edges: useAppStore.getState().showEdges,
      fileGeo: useAppStore.getState().showFileGeometry,
      folderLabels: useAppStore.getState().showFolderLabels,
      fileLabels: useAppStore.getState().showFileLabels,
    };

    const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
    const results = [];

    try {
      // 1. Fase Base (Só o chão e pastas mínimas)
      setBenchmarkStep('1/4: Medindo Base (Só Chão/Núcleo)...');
      setShowEdges(false);
      setShowFileGeometry(false);
      setShowFolderLabels(false);
      setShowFileLabels(false);
      await sleep(1000);
      const s1 = useAppStore.getState().perfStats;
      results.push({ name: 'Base (Cena Mínima)', fps: s1.fps, calls: s1.drawCalls, tris: s1.triangles });

      // 2. Fase + Linhas/Conexões
      setBenchmarkStep('2/4: Medindo Impacto das Linhas...');
      setShowEdges(true);
      await sleep(1000);
      const s2 = useAppStore.getState().perfStats;
      results.push({ name: '+ Conexões (Linhas)', fps: s2.fps, calls: s2.drawCalls, tris: s2.triangles });

      // 3. Fase + Bolinhas de Arquivos
      setBenchmarkStep('3/4: Medindo Geometria dos Arquivos...');
      setShowFileGeometry(true);
      await sleep(1000);
      const s3 = useAppStore.getState().perfStats;
      results.push({ name: '+ Bolinhas de Arquivos', fps: s3.fps, calls: s3.drawCalls, tris: s3.triangles });

      // 4. Fase + Rótulos e Textos WebGL
      setBenchmarkStep('4/4: Medindo Textos e Sprites...');
      setShowFolderLabels(true);
      setShowFileLabels(true);
      await sleep(1000);
      const s4 = useAppStore.getState().perfStats;
      results.push({ name: '+ Textos / Rótulos', fps: s4.fps, calls: s4.drawCalls, tris: s4.triangles });

      setBenchmarkResults(results);
    } finally {
      // Restaura o estado anterior do usuário
      setShowEdges(originalState.edges);
      setShowFileGeometry(originalState.fileGeo);
      setShowFolderLabels(originalState.folderLabels);
      setShowFileLabels(originalState.fileLabels);
      setIsBenchmarking(false);
      setBenchmarkStep('');
    }
  };

  return (
    <div className="fixed left-4 bottom-4 z-40 flex flex-col items-start gap-2 select-none font-mono">
      {/* Painel Expandido de Raio-X da GPU e Benchmark */}
      {isExpanded && (
        <div className="w-96 bg-slate-950/95 border border-cyan-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-xl space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Profiler de GPU (renderer.info)
              </span>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-slate-500 hover:text-slate-300 p-0.5 rounded cursor-pointer"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Grid de Métricas de Hardware */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5">
              <span className="text-[10px] uppercase text-slate-400 block font-semibold">Draw Calls</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className={`text-base font-extrabold ${drawCallsColor}`}>{drawCalls}</span>
                <span className="text-[10px] text-slate-500">chamadas/frame</span>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5">
              <span className="text-[10px] uppercase text-slate-400 block font-semibold">Polígonos / Triângulos</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-base font-extrabold text-amber-300">
                  {((perfStats.triangles || 0) / 1000).toFixed(1)}k
                </span>
                <span className="text-[10px] text-slate-500">tris</span>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5">
              <span className="text-[10px] uppercase text-slate-400 block font-semibold">Texturas VRAM</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-sm font-bold text-fuchsia-300">{perfStats.textures || 0}</span>
                <span className="text-[10px] text-slate-500">em cache</span>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5">
              <span className="text-[10px] uppercase text-slate-400 block font-semibold">Geometrias Tridim.</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-sm font-bold text-emerald-300">{perfStats.geometries || 0}</span>
                <span className="text-[10px] text-slate-500">buffers</span>
              </div>
            </div>
          </div>

          {/* Botão de Diagnóstico de Gargalos */}
          <div className="pt-1">
            <button
              onClick={runDiagnosticBenchmark}
              disabled={isBenchmarking}
              className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                isBenchmarking
                  ? 'bg-cyan-950/60 border-cyan-500/60 text-cyan-300 animate-pulse cursor-wait'
                  : 'bg-cyan-500/20 hover:bg-cyan-500/30 border-cyan-500/40 text-cyan-300 shadow-neon-cyan-sm'
              }`}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isBenchmarking ? benchmarkStep : 'Rodar Diagnóstico de Gargalos (1 a 1)'}</span>
            </button>
          </div>

          {/* Resultados do Benchmark */}
          {benchmarkResults && (
            <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-3 space-y-2 text-[11px]">
              <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Relatório de Diagnóstico Comparativo:</span>
              </div>
              <div className="space-y-1 divide-y divide-slate-800/50">
                {benchmarkResults.map((r, i) => (
                  <div key={i} className="pt-1 first:pt-0 flex items-center justify-between text-slate-300">
                    <span>{r.name}</span>
                    <div className="flex items-center gap-3">
                      <span className={r.fps >= 50 ? 'text-emerald-400' : 'text-amber-400'}>{r.fps} FPS</span>
                      <span className="text-slate-500 text-[10px]">{r.calls} calls</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Barra Compacta na Base */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="h-11 box-border bg-slate-950/90 border border-emerald-500/40 hover:border-cyan-500/60 rounded-2xl px-4 py-2 shadow-2xl backdrop-blur-xl flex items-center gap-3 text-xs cursor-pointer transition-all hover:bg-slate-900/90"
        title="Clique para abrir o Profiler Detalhado da GPU e Diagnóstico"
      >
        {/* FPS */}
        <div className="flex items-baseline gap-1.5">
          <span className="text-[10px] uppercase font-bold text-slate-400">FPS</span>
          <span className={`text-base font-extrabold ${fpsColor}`}>{fps}</span>
        </div>

        <span className="text-slate-700">|</span>

        {/* Frame Time (ms) */}
        <div className="flex items-baseline gap-1.5">
          <span className="text-[10px] uppercase font-bold text-slate-400">MS</span>
          <span className="text-sm font-bold text-cyan-300">{perfStats.ms}</span>
        </div>

        <span className="text-slate-700">|</span>

        {/* Draw Calls da GPU */}
        <div className="flex items-baseline gap-1.5">
          <span className="text-[10px] uppercase font-bold text-slate-400">CALLS</span>
          <span className={`text-sm font-bold ${drawCallsColor}`}>{drawCalls}</span>
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

        <div className="ml-1 text-slate-500 hover:text-cyan-400">
          {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </div>
      </div>
    </div>
  );
}

