import React from 'react';
import { Filter, Layers, RotateCw, Sparkles, Grid, CheckSquare, Square, ChevronLeft, ChevronRight } from 'lucide-react';

export default function SidebarFilterPanel({
  isOpen,
  onToggleOpen,
  availableExtensions,
  selectedExtensions,
  onToggleExtension,
  onSelectAllExtensions,
  onClearAllExtensions,
  autoRotate,
  onToggleAutoRotate,
  particlesEnabled,
  onToggleParticles,
  showGrid,
  onToggleShowGrid,
  nodeCount,
}) {
  return (
    <div
      className={`absolute top-4 left-4 z-30 transition-all duration-300 flex items-start ${
        isOpen ? 'translate-x-0' : '-translate-x-[calc(100%-40px)]'
      }`}
    >
      {/* Panel Container */}
      <div className="w-72 bg-slate-950/90 border border-slate-800 rounded-2xl p-4 shadow-2xl backdrop-blur-xl space-y-4 max-h-[85vh] overflow-y-auto custom-scrollbar">
        {/* Panel Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Filtros & Opções 3D
            </h3>
          </div>
          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-800/50">
            {nodeCount} nós
          </span>
        </div>

        {/* Extensions Filter Section */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              Tipos de Arquivo ({availableExtensions.length})
            </span>
            <div className="flex gap-2 text-[10px]">
              <button
                onClick={onSelectAllExtensions}
                className="text-cyan-400 hover:underline"
              >
                Todos
              </button>
              <span className="text-slate-600">|</span>
              <button
                onClick={onClearAllExtensions}
                className="text-slate-400 hover:underline"
              >
                Limpar
              </button>
            </div>
          </div>

          <div className="space-y-1 max-h-44 overflow-y-auto pr-1 custom-scrollbar">
            {availableExtensions.map((ext) => {
              const isChecked = selectedExtensions.has(ext);
              return (
                <label
                  key={ext}
                  onClick={() => onToggleExtension(ext)}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-all border ${
                    isChecked
                      ? 'bg-slate-900 border-slate-700 text-slate-200'
                      : 'bg-slate-950/40 border-transparent text-slate-500 hover:text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {isChecked ? (
                      <CheckSquare className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    ) : (
                      <Square className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                    )}
                    <span className="font-mono text-[11px]">
                      {ext || '(sem extensão)'}
                    </span>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Rendering Options Section */}
        <div className="border-t border-slate-800/80 pt-3 space-y-2">
          <span className="text-xs font-semibold text-slate-400 block mb-2">
            Controles Visuais
          </span>

          {/* Auto Rotate Toggle */}
          <button
            onClick={onToggleAutoRotate}
            className={`w-full px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between border transition-all ${
              autoRotate
                ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300'
                : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} />
              <span>Rotação Automática</span>
            </div>
            <span className="text-[10px] font-bold uppercase">
              {autoRotate ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Particles Toggle */}
          <button
            onClick={onToggleParticles}
            className={`w-full px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between border transition-all ${
              particlesEnabled
                ? 'bg-pink-950/40 border-pink-500/40 text-pink-300'
                : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Partículas de Fluxo</span>
            </div>
            <span className="text-[10px] font-bold uppercase">
              {particlesEnabled ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Space Grid Floor Toggle */}
          <button
            onClick={onToggleShowGrid}
            className={`w-full px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between border transition-all ${
              showGrid
                ? 'bg-purple-950/40 border-purple-500/40 text-purple-300'
                : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <Grid className="w-3.5 h-3.5" />
              <span>Grade Espaço-Tempo</span>
            </div>
            <span className="text-[10px] font-bold uppercase">
              {showGrid ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>
      </div>

      {/* Collapse/Expand Handle Button */}
      <button
        onClick={onToggleOpen}
        className="mt-3 ml-1 p-2 bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-cyan-400 rounded-r-xl shadow-xl backdrop-blur-md transition-colors"
        title={isOpen ? 'Ocultar Painel Lateral' : 'Exibir Painel de Filtros'}
      >
        {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>
    </div>
  );
}
