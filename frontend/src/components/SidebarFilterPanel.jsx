import React from 'react';
import {
  Filter,
  Layers,
  Eye,
  EyeOff,
  Compass,
  Activity,
  Grid,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  RotateCw,
} from 'lucide-react';
import { useAppStore } from '../core/store';
import { CATEGORIES } from '../core/layoutEngine';

/**
 * src/components/SidebarFilterPanel.jsx
 * 
 * Painel de Controle e Filtros Lateral Esquerdo Retrátil (Dark Mode Cyberpunk):
 * - Inicia aberto por padrão com transição suave (Framer Motion / CSS transform)
 * - Filtro por Categorias Funcionais (Frontend, Backend, Banco de Dados, Config, Docs)
 * - Toggles para recursos visuais 3D (Linhas, Rótulos, Bússola, Stats, Grade do Chão, Auto Rotação)
 */
export default function SidebarFilterPanel({ nodeCount = 0, nodes = [] }) {
  const isSidebarOpen = useAppStore((s) => s.isSidebarOpen);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);

  const activeCategories = useAppStore((s) => s.activeCategories);
  const toggleCategory = useAppStore((s) => s.toggleCategory);
  const selectAllCategories = useAppStore((s) => s.selectAllCategories);
  const clearAllCategories = useAppStore((s) => s.clearAllCategories);

  const showEdges = useAppStore((s) => s.showEdges);
  const toggleShowEdges = useAppStore((s) => s.toggleShowEdges);

  const showLabels = useAppStore((s) => s.showLabels);
  const toggleShowLabels = useAppStore((s) => s.toggleShowLabels);

  const showGizmo = useAppStore((s) => s.showGizmo);
  const toggleShowGizmo = useAppStore((s) => s.toggleShowGizmo);

  const showStats = useAppStore((s) => s.showStats);
  const toggleShowStats = useAppStore((s) => s.toggleShowStats);

  const showGrid = useAppStore((s) => s.showGrid);
  const toggleShowGrid = useAppStore((s) => s.toggleShowGrid);

  const autoRotate = useAppStore((s) => s.autoRotate);
  const toggleAutoRotate = useAppStore((s) => s.toggleAutoRotate);

  // Calcula a quantidade de nós por categoria funcional
  const categoryCounts = React.useMemo(() => {
    const counts = { FRONTEND: 0, BACKEND: 0, DATABASE: 0, CONFIG: 0, DOCS: 0 };
    nodes.forEach((n) => {
      const cat = n.category || 'BACKEND';
      if (counts[cat] !== undefined) counts[cat]++;
    });
    return counts;
  }, [nodes]);

  return (
    <div
      className={`absolute top-4 left-4 z-30 transition-transform duration-300 ease-in-out flex items-start ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-[calc(100%-12px)]'
      }`}
    >
      {/* Container Principal do Painel */}
      <div className="w-72 bg-slate-950/90 border border-slate-800/90 rounded-2xl p-4 shadow-2xl backdrop-blur-xl space-y-4 max-h-[85vh] overflow-y-auto custom-scrollbar text-slate-200">
        
        {/* Header do Painel */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100">
              Painel de Controle 3D
            </h3>
          </div>
          <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded-lg border border-cyan-800/50">
            {nodeCount} nós
          </span>
        </div>

        {/* Seção 1: Filtros por Categoria Funcional */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              Categorias Funcionais
            </span>
            <div className="flex gap-2 text-[10px]">
              <button
                onClick={selectAllCategories}
                className="text-cyan-400 hover:text-cyan-300 font-bold transition-colors cursor-pointer"
              >
                Todos
              </button>
              <span className="text-slate-600">|</span>
              <button
                onClick={clearAllCategories}
                className="text-slate-400 hover:text-slate-200 font-bold transition-colors cursor-pointer"
              >
                Limpar
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            {Object.entries(CATEGORIES).map(([key, catInfo]) => {
              const isChecked = activeCategories.includes(key);
              const count = categoryCounts[key] || 0;

              return (
                <label
                  key={key}
                  onClick={() => toggleCategory(key)}
                  className={`flex items-center justify-between px-2.5 py-2 rounded-xl text-xs cursor-pointer transition-all border ${
                    isChecked
                      ? 'bg-slate-900/90 border-slate-700/80 text-slate-100 shadow-md'
                      : 'bg-slate-950/40 border-transparent text-slate-500 hover:text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 shrink-0" style={{ color: catInfo.color }} />
                    ) : (
                      <Square className="w-4 h-4 text-slate-600 shrink-0" />
                    )}
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: catInfo.color }}
                    ></span>
                    <span className="font-semibold">{catInfo.label}</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                    {count}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Seção 2: Controles Visuais 3D */}
        <div className="border-t border-slate-800/80 pt-3 space-y-2">
          <span className="text-xs font-semibold text-slate-400 block mb-1">
            Recursos da Cena 3D
          </span>

          {/* Toggle Linhas/Conexões */}
          <button
            onClick={toggleShowEdges}
            className={`w-full px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between border transition-all cursor-pointer ${
              showEdges
                ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300'
                : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Conexões (Linhas)</span>
            </div>
            <span className="text-[10px] font-bold uppercase">
              {showEdges ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Toggle Cards de Rótulos */}
          <button
            onClick={toggleShowLabels}
            className={`w-full px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between border transition-all cursor-pointer ${
              showLabels
                ? 'bg-purple-950/40 border-purple-500/40 text-purple-300'
                : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {showLabels ? <Eye className="w-3.5 h-3.5 text-purple-400" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>Cards de Nomes</span>
            </div>
            <span className="text-[10px] font-bold uppercase">
              {showLabels ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Toggle Bússola Gizmo */}
          <button
            onClick={toggleShowGizmo}
            className={`w-full px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between border transition-all cursor-pointer ${
              showGizmo
                ? 'bg-pink-950/40 border-pink-500/40 text-pink-300'
                : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Compass className="w-3.5 h-3.5 text-pink-400" />
              <span>Bússola (Gizmo)</span>
            </div>
            <span className="text-[10px] font-bold uppercase">
              {showGizmo ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Toggle Métricas Stats */}
          <button
            onClick={toggleShowStats}
            className={`w-full px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between border transition-all cursor-pointer ${
              showStats
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Métricas (Stats FPS)</span>
            </div>
            <span className="text-[10px] font-bold uppercase">
              {showStats ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Toggle Chão Cibernético Grid */}
          <button
            onClick={toggleShowGrid}
            className={`w-full px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between border transition-all cursor-pointer ${
              showGrid
                ? 'bg-blue-950/40 border-blue-500/40 text-blue-300'
                : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Grid className="w-3.5 h-3.5 text-blue-400" />
              <span>Chão Cibernético</span>
            </div>
            <span className="text-[10px] font-bold uppercase">
              {showGrid ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Toggle Rotação Automática (Grid / Cena 3D) */}
          <button
            onClick={toggleAutoRotate}
            className={`w-full px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between border transition-all cursor-pointer ${
              autoRotate
                ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <RotateCw className="w-3.5 h-3.5 text-amber-400" />
              <span>Rotação do Grid</span>
            </div>
            <span className="text-[10px] font-bold uppercase">
              {autoRotate ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>
      </div>

      {/* Botão Retrátil de Contrair/Expandir o Painel */}
      <button
        onClick={toggleSidebar}
        className="mt-3 p-2 bg-slate-950/90 border border-slate-800 text-slate-300 hover:text-cyan-400 rounded-r-xl shadow-2xl backdrop-blur-md transition-colors cursor-pointer"
        title={isSidebarOpen ? 'Recolher Painel Lateral' : 'Expandir Painel Lateral'}
      >
        {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4 text-cyan-400" />}
      </button>
    </div>
  );
}
