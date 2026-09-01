import React from 'react';

export default function MiniMap({ graphData }) {
  if (!graphData || !graphData.nodes || graphData.nodes.length === 0) return null;

  const nodes = graphData.nodes;
  const links = graphData.links || [];

  // Consider nodes that have position x, z
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  let hasCoords = false;

  nodes.forEach((n) => {
    const x = typeof n.x === 'number' ? n.x : 0;
    const z = typeof n.z === 'number' ? n.z : 0;
    if (x !== 0 || z !== 0) hasCoords = true;
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minZ = Math.min(minZ, z);
    maxZ = Math.max(maxZ, z);
  });

  const rangeX = maxX - minX || 1;
  const rangeZ = maxZ - minZ || 1;

  return (
    <div className="absolute bottom-4 right-4 z-20 w-36 h-36 bg-slate-950/90 border border-slate-800 rounded-2xl p-2 shadow-2xl backdrop-blur-md flex flex-col justify-between pointer-events-none">
      <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-400">
        <span>MINIMAPA</span>
        <span className="text-cyan-400">{nodes.length} nós</span>
      </div>
      <svg viewBox="0 0 100 100" className="w-full h-28">
        {/* Links */}
        {links.map((l, i) => {
          const s = typeof l.source === 'object' ? l.source : nodes.find((n) => n.id === l.source);
          const t = typeof l.target === 'object' ? l.target : nodes.find((n) => n.id === l.target);
          if (!s || !t) return null;
          const sx = typeof s.x === 'number' ? ((s.x - minX) / rangeX) * 84 + 8 : 50;
          const sz = typeof s.z === 'number' ? ((s.z - minZ) / rangeZ) * 84 + 8 : 50;
          const tx = typeof t.x === 'number' ? ((t.x - minX) / rangeX) * 84 + 8 : 50;
          const tz = typeof t.z === 'number' ? ((t.z - minZ) / rangeZ) * 84 + 8 : 50;

          return (
            <line
              key={`${s.id || i}-${t.id || i}`}
              x1={sx}
              y1={sz}
              x2={tx}
              y2={tz}
              stroke="rgba(71, 85, 105, 0.5)"
              strokeWidth="0.8"
            />
          );
        })}

        {/* Nodes */}
        {nodes.map((n) => {
          const cx = typeof n.x === 'number' ? ((n.x - minX) / rangeX) * 84 + 8 : 50;
          const cz = typeof n.z === 'number' ? ((n.z - minZ) / rangeZ) * 84 + 8 : 50;
          const isRoot = n.id === 'root';
          const isFolder = n.type === 'folder';

          return (
            <circle
              key={n.id}
              cx={cx}
              cy={cz}
              r={isRoot ? 3.5 : isFolder ? 2.2 : 1.4}
              fill={isRoot ? '#c084fc' : isFolder ? '#38bdf8' : '#f472b6'}
              opacity={0.85}
            />
          );
        })}
      </svg>
    </div>
  );
}

