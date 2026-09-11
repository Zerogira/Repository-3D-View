import React, { useRef, useState, useCallback } from 'react';
import { useAppStore } from '../core/store';

/**
 * src/components/MiniMap.jsx
 * 
 * Minimapa 2D Interativo (Radar Tático com Câmera Sincronizada):
 * - Clique ou arraste no minimapa desloca suavemente o target da câmera 3D principal.
 * - Desenha o retângulo de viewport translúcido mostrando onde a câmera está focada.
 */
export default function MiniMap({ graphData, nodes: propNodes, links: propLinks, onPanTo }) {
  const nodes = propNodes || graphData?.nodes || [];
  const links = propLinks || graphData?.links || [];

  const cameraView = useAppStore((s) => s.cameraView);
  const setCameraTarget = useAppStore((s) => s.setCameraTarget);
  const isDraggingRef = useRef(false);
  const svgRef = useRef(null);

  // Mapeamento dinâmico dos limites de coordenadas X e Z (com fallback para Y em 2D)
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;

  nodes.forEach((n) => {
    const x = typeof n.x === 'number' && !isNaN(n.x) ? n.x : 0;
    const z = typeof n.z === 'number' && !isNaN(n.z) ? n.z : (typeof n.y === 'number' && !isNaN(n.y) ? n.y : 0);
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minZ = Math.min(minZ, z);
    maxZ = Math.max(maxZ, z);
  });

  if (!isFinite(minX)) minX = -100;
  if (!isFinite(maxX)) maxX = 100;
  if (!isFinite(minZ)) minZ = -100;
  if (!isFinite(maxZ)) maxZ = 100;

  const rangeX = Math.max(1, maxX - minX);
  const rangeZ = Math.max(1, maxZ - minZ);

  // Converte posição do clique (0 a 100 no SVG) para coordenadas reais 3D/2D
  const handleMapInteraction = useCallback(
    (e) => {
      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const svgX = ((e.clientX - rect.left) / rect.width) * 100;
      const svgZ = ((e.clientY - rect.top) / rect.height) * 100;

      // Desfaz a projeção ((val - min) / range) * 82 + 9
      const realX = ((svgX - 9) / 82) * rangeX + minX;
      const realZ = ((svgZ - 9) / 82) * rangeZ + minZ;

      if (onPanTo) {
        onPanTo(realX, realZ);
      } else {
        setCameraTarget({ x: realX, y: 0, z: realZ, isMinimapPan: true });
      }
    },
    [minX, rangeX, minZ, rangeZ, setCameraTarget, onPanTo]
  );

  const handlePointerDown = (e) => {
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Fallback gracioso caso browser restrinja
    }
    isDraggingRef.current = true;
    handleMapInteraction(e);
  };

  const handlePointerMove = (e) => {
    if (isDraggingRef.current) {
      handleMapInteraction(e);
    }
  };

  const handlePointerUp = (e) => {
    try {
      if (e.currentTarget?.hasPointerCapture?.(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignora erro de liberação
    }
    isDraggingRef.current = false;
  };

  // Coordenadas projetadas da câmera para desenhar o marcador de posição
  const is2D = Boolean(cameraView?.is2D);
  const camSvgX = cameraView ? ((cameraView.x - minX) / rangeX) * 82 + 9 : 50;
  const camSvgZ = cameraView ? ((cameraView.z - minZ) / rangeZ) * 82 + 9 : 50;

  // Em 2D: retângulo proporcional ao tamanho real da tela; em 3D: tamanho baseado na distância
  const boxW = is2D && cameraView?.viewWidth
    ? Math.max(6, Math.min(85, (cameraView.viewWidth / rangeX) * 82))
    : (cameraView?.dist ? Math.max(10, Math.min(32, (cameraView.dist / (rangeX || 1)) * 38)) : 18);

  const boxH = is2D && cameraView?.viewHeight
    ? Math.max(6, Math.min(85, (cameraView.viewHeight / rangeZ) * 82))
    : boxW;

  // Em 3D: calcula cone de visão apontando da posição da câmera (cam) para o ponto de foco (target)
  const tgtSvgX = !is2D && cameraView?.tgtX !== undefined ? ((cameraView.tgtX - minX) / rangeX) * 82 + 9 : null;
  const tgtSvgZ = !is2D && cameraView?.tgtZ !== undefined ? ((cameraView.tgtZ - minZ) / rangeZ) * 82 + 9 : null;
  let fovConePath = null;
  if (!is2D && tgtSvgX !== null && tgtSvgZ !== null) {
    const angle = Math.atan2(tgtSvgZ - camSvgZ, tgtSvgX - camSvgX);
    const coneLen = 14;
    const spread = 0.42;
    const p1x = camSvgX + Math.cos(angle - spread) * coneLen;
    const p1y = camSvgZ + Math.sin(angle - spread) * coneLen;
    const p2x = camSvgX + Math.cos(angle + spread) * coneLen;
    const p2y = camSvgZ + Math.sin(angle + spread) * coneLen;
    fovConePath = `M ${camSvgX} ${camSvgZ} L ${p1x} ${p1y} A ${coneLen} ${coneLen} 0 0 1 ${p2x} ${p2y} Z`;
  }

  if (!nodes || nodes.length === 0) return null;

  return (
    <div
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      className="w-48 h-48 bg-slate-950/90 border border-slate-700/80 rounded-2xl p-2.5 shadow-2xl backdrop-blur-md flex flex-col justify-between pointer-events-auto select-none transition-all hover:border-cyan-500/50"
    >
      {/* Header do Minimapa Interativo */}
      <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-300 border-b border-slate-800 pb-1">
        <span className="flex items-center gap-1.5 text-cyan-400">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
          RADAR INTERATIVO
        </span>
        <span className="text-[9px] text-slate-400">Arraste p/ mover</span>
      </div>

      {/* SVG 2D Interativo com Viewport e Câmera Sincronizada */}
      <svg
        ref={svgRef}
        viewBox="0 0 100 100"
        className="w-full h-36 cursor-crosshair rounded-lg bg-slate-900/40"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
      >
        {/* Conexões (Linhas) */}
        {links.map((l, i) => {
          const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
          const targetId = typeof l.target === 'object' ? l.target.id : l.target;

          const s = nodes.find((n) => n.id === sourceId);
          const t = nodes.find((n) => n.id === targetId);
          if (!s || !t) return null;

          const sx = typeof s.x === 'number' ? ((s.x - minX) / rangeX) * 82 + 9 : 50;
          const szVal = typeof s.z === 'number' && !isNaN(s.z) ? s.z : (typeof s.y === 'number' && !isNaN(s.y) ? s.y : 0);
          const sz = ((szVal - minZ) / rangeZ) * 82 + 9;
          const tx = typeof t.x === 'number' ? ((t.x - minX) / rangeX) * 82 + 9 : 50;
          const tzVal = typeof t.z === 'number' && !isNaN(t.z) ? t.z : (typeof t.y === 'number' && !isNaN(t.y) ? t.y : 0);
          const tz = ((tzVal - minZ) / rangeZ) * 82 + 9;

          return (
            <line
              key={`${sourceId}-${targetId}-${i}`}
              x1={sx}
              y1={sz}
              x2={tx}
              y2={tz}
              stroke="rgba(255, 255, 255, 0.18)"
              strokeWidth="0.65"
            />
          );
        })}

        {/* Nós (Pontos Coloridos por Categoria) */}
        {nodes.map((n) => {
          const cx = typeof n.x === 'number' ? ((n.x - minX) / rangeX) * 82 + 9 : 50;
          const czVal = typeof n.z === 'number' && !isNaN(n.z) ? n.z : (typeof n.y === 'number' && !isNaN(n.y) ? n.y : 0);
          const cz = ((czVal - minZ) / rangeZ) * 82 + 9;
          const isRoot = n.id === 'root' || n.depth === 0;
          const isFolder = n.isDir || n.type === 'dir' || n.type === 'folder';

          const dotColor = isRoot
            ? '#c084fc'
            : n.color || (isFolder ? '#22d3ee' : '#f43f5e');

          return (
            <circle
              key={n.id}
              cx={cx}
              cy={cz}
              r={isRoot ? 3.2 : isFolder ? 2.2 : 1.3}
              fill={dotColor}
              opacity={isRoot ? 1 : 0.85}
            />
          );
        })}

        {/* Indicador de Câmera e Viewport Sincronizado */}
        {cameraView && (
          <g className="pointer-events-none transition-all duration-75">
            {/* Cone de Visão Direcional (Modo 3D) */}
            {fovConePath && (
              <path
                d={fovConePath}
                fill="rgba(34, 211, 238, 0.25)"
                stroke="rgba(34, 211, 238, 0.6)"
                strokeWidth="0.75"
              />
            )}

            {/* Retângulo de Viewport */}
            <rect
              x={camSvgX - boxW / 2}
              y={camSvgZ - boxH / 2}
              width={boxW}
              height={boxH}
              fill="rgba(34, 211, 238, 0.12)"
              stroke="#22d3ee"
              strokeWidth="1.2"
              rx="2"
            />

            {/* Aura e Ponto da Posição Física da Câmera */}
            <circle
              cx={camSvgX}
              cy={camSvgZ}
              r="3.5"
              fill="rgba(236, 72, 153, 0.3)"
            />
            <circle
              cx={camSvgX}
              cy={camSvgZ}
              r="2"
              fill="#ec4899"
              stroke="#ffffff"
              strokeWidth="0.6"
            />
          </g>
        )}
      </svg>
    </div>
  );
}
