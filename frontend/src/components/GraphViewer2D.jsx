import React, { useRef, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { Camera } from 'lucide-react';

export default function GraphViewer2D({ graphData, onNodeClick, filterTerm }) {
  const fgRef = useRef();

  const handleNodeClick = useCallback(
    (node) => {
      if (fgRef.current && node) {
        fgRef.current.centerAt(node.x, node.y, 1000);
        fgRef.current.zoom(2.5, 1000);
      }
      if (onNodeClick) {
        onNodeClick(node);
      }
    },
    [onNodeClick]
  );

  const handleReset = () => {
    if (fgRef.current) {
      fgRef.current.zoomToFit(1000, 40);
    }
  };

  const drawNodeCanvas = useCallback(
    (node, ctx, globalScale) => {
      const isFolder = node.type === 'folder';
      const isSearchActive = Boolean(filterTerm && filterTerm.trim() !== '');
      const isMatched = isSearchActive
        ? node.name.toLowerCase().includes(filterTerm.toLowerCase()) ||
          node.path.toLowerCase().includes(filterTerm.toLowerCase())
        : true;

      const size = Math.max(3, (node.val || 5) * 0.7);

      ctx.save();

      if (isSearchActive && !isMatched) {
        ctx.globalAlpha = 0.15;
        ctx.fillStyle = '#334155';
      } else {
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = isFolder ? '#22d3ee' : '#ec4899';
        ctx.shadowColor = isFolder ? 'rgba(34, 211, 238, 0.6)' : 'rgba(236, 72, 153, 0.6)';
        ctx.shadowBlur = 8;
      }

      ctx.beginPath();
      if (isFolder) {
        // Draw square for folder
        ctx.rect(node.x - size, node.y - size, size * 2, size * 2);
      } else {
        // Draw circle for file
        ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
      }
      ctx.fill();

      // Render text label when zoomed in or when matching search
      if (globalScale > 1.2 || isMatched && isSearchActive) {
        const label = node.name;
        const fontSize = Math.max(3, 10 / globalScale);
        ctx.font = `${fontSize}px Outfit, sans-serif`;
        ctx.fillStyle = isMatched ? '#ffffff' : '#94a3b8';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, node.x, node.y + size + fontSize);
      }

      ctx.restore();
    },
    [filterTerm]
  );

  return (
    <div className="relative w-full h-full min-h-[600px] rounded-2xl overflow-hidden border border-slate-800 bg-[#060911] shadow-2xl">
      <ForceGraph2D
        ref={fgRef}
        graphData={graphData}
        nodeCanvasObject={drawNodeCanvas}
        onNodeClick={handleNodeClick}
        linkColor={() => 'rgba(51, 65, 85, 0.35)'}
        linkWidth={1}
        linkDirectionalParticles={1}
        linkDirectionalParticleWidth={2}
        linkDirectionalParticleColor={() => '#22d3ee'}
        warmupTicks={100}
        cooldownTicks={80}
        backgroundColor="#060911"
      />

      {/* Control Buttons */}
      <div className="absolute bottom-4 left-4 z-20 bg-slate-900/80 p-2 rounded-xl border border-slate-800 backdrop-blur-md">
        <button
          onClick={handleReset}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-all"
        >
          <Camera className="w-3.5 h-3.5 text-pink-400" />
          Centralizar Vista 2D
        </button>
      </div>
    </div>
  );
}
