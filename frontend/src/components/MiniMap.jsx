import React from 'react';

/**
 * src/components/MiniMap.jsx
 * 
 * Minimapa 2D flutuante de visão geral do grafo (radar tático).
 */
export default function MiniMap({ graphData, nodes: propNodes, links: propLinks }) {
  const nodes = propNodes || graphData?.nodes || [];
  const links = propLinks || graphData?.links || [];

  if (!nodes || nodes.length === 0) return null;

  // Mapeamento dinâmico dos limites de coordenadas X e Z
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;

  nodes.forEach((n) => {
    const x = typeof n.x === 'number' ? n.x : 0;
    const z = typeof n.z === 'number' ? n.z : 0;
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minZ = Math.min(minZ, z);
    maxZ = Math.max(maxZ, z);
  });

  const rangeX = maxX - minX || 1;
  const rangeZ = maxZ - minZ || 1;

  return (
    <div className="w-44 h-44 bg-slate-950/90 border border-slate-700/80 rounded-2xl p-2.5 shadow-2xl backdrop-blur-md flex flex-col justify-between pointer-events-auto select-none">
      {/* Header do Minimapa */}
      <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-300 border-b border-slate-800 pb-1">
        <span className="flex items-center gap-1.5 text-cyan-400">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
          MINIMAPA RADAR
        </span>
        <span className="text-slate-400">{nodes.length} nós</span>
      </div>

      {/* SVG 2D do Grafo Vista de Cima (Top-Down) */}
      <svg viewBox="0 0 100 100" className="w-full h-32">
        {/* Conexões (Linhas) */}
        {links.map((l, i) => {
          const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
          const targetId = typeof l.target === 'object' ? l.target.id : l.target;

          const s = nodes.find((n) => n.id === sourceId);
          const t = nodes.find((n) => n.id === targetId);
          if (!s || !t) return null;

          const sx = typeof s.x === 'number' ? ((s.x - minX) / rangeX) * 82 + 9 : 50;
          const sz = typeof s.z === 'number' ? ((s.z - minZ) / rangeZ) * 82 + 9 : 50;
          const tx = typeof t.x === 'number' ? ((t.x - minX) / rangeX) * 82 + 9 : 50;
          const tz = typeof t.z === 'number' ? ((t.z - minZ) / rangeZ) * 82 + 9 : 50;

          return (
            <line
              key={`${sourceId}-${targetId}-${i}`}
              x1={sx}
              y1={sz}
              x2={tx}
              y2={tz}
              stroke="rgba(56, 189, 248, 0.25)"
              strokeWidth="0.75"
            />
          );
        })}

        {/* Nós (Pontos Coloridos por Categoria) */}
        {nodes.map((n) => {
          const cx = typeof n.x === 'number' ? ((n.x - minX) / rangeX) * 82 + 9 : 50;
          const cz = typeof n.z === 'number' ? ((n.z - minZ) / rangeZ) * 82 + 9 : 50;
          const isRoot = n.id === 'root' || n.depth === 0;
          const isFolder = n.isDir || n.type === 'dir' || n.type === 'folder';

          const dotColor = isRoot
            ? '#c084fc'
            : n.color || (isFolder ? '#22d3ee' : '#f472b6');

          return (
            <circle
              key={n.id}
              cx={cx}
              cy={cz}
              r={isRoot ? 3.5 : isFolder ? 2.4 : 1.5}
              fill={dotColor}
              opacity={isRoot ? 1 : 0.85}
            />
          );
        })}
      </svg>
    </div>
  );
}
