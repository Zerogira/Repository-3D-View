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
  Folder,
  FileText,
  Orbit,
  Globe,
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
export default function SidebarFilterPanel({ nodeCount = 0, nodes = [], is2D = false }) {
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

  const showFolderLabels = useAppStore((s) => s.showFolderLabels);
  const toggleShowFolderLabels = useAppStore((s) => s.toggleShowFolderLabels);

  const showFileLabels = useAppStore((s) => s.showFileLabels);
  const toggleShowFileLabels = useAppStore((s) => s.toggleShowFileLabels);

  const showFileGeometry = useAppStore((s) => s.showFileGeometry);
  const toggleShowFileGeometry = useAppStore((s) => s.toggleShowFileGeometry);

  const showGizmo = useAppStore((s) => s.showGizmo);
  const toggleShowGizmo = useAppStore((s) => s.toggleShowGizmo);

  const showStats = useAppStore((s) => s.showStats);
  const toggleShowStats = useAppStore((s) => s.toggleShowStats);

  const showGrid = useAppStore((s) => s.showGrid);
  const toggleShowGrid = useAppStore((s) => s.toggleShowGrid);

  const autoRotate = useAppStore((s) => s.autoRotate);
  const toggleAutoRotate = useAppStore((s) => s.toggleAutoRotate);

  const layoutMode = useAppStore((s) => s.layoutMode);
  const setLayoutMode = useAppStore((s) => s.setLayoutMode);

  const usePhysicsEngine = useAppStore((s) => s.usePhysicsEngine);
  const toggleUsePhysicsEngine = useAppStore((s) => s.toggleUsePhysicsEngine);

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
      className={`absolute top-4 left-4 bottom-[76px] max-h-[calc(100%-76px)] z-30 transition-transform duration-300 ease-in-out flex items-start ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-[calc(100%-12px)]'
      }`}
    >
      {/* Container Principal do Painel (flex flex-col max-h-full) */}
      <div className="w-80 max-h-full bg-slate-950/90 border border-slate-800/90 rounded-2xl p-4 shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden text-slate-200">
        
        {/* Header do Painel */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100">
              Painel de Controle {is2D ? '2D' : '3D'}
            </h3>
          </div>
          <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded-lg border border-cyan-800/50">
            {nodeCount} nós
          </span>
        </div>

        {/* Conteúdo Rolável: Categorias, Layouts e Toggles Visuais */}
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1 pt-2">

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

        {/* Seção 2: Controles Visuais 3D/2D */}
        <div className="border-t border-slate-800/80 pt-3 space-y-2.5">
          <div>
            <span className="text-xs font-semibold text-slate-400 block mb-1.5">
              Predefinição de Layout
            </span>
            <div className="grid grid-cols-3 gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
              {/* Modo 1: Classic */}
              <button
                type="button"
                onClick={() => setLayoutMode('classic')}
                className={`px-2 py-1.5 rounded-lg text-[11px] font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                  layoutMode === 'classic'
                    ? 'bg-cyan-950/80 border border-cyan-500/60 text-cyan-300 shadow-neon-cyan-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Galaxy Clássico: Árvore estruturada descendente"
              >
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                <span>Clássico</span>
              </button>

              {/* Modo 2: Solar */}
              <button
                type="button"
                onClick={() => setLayoutMode('solar')}
                className={`px-2 py-1.5 rounded-lg text-[11px] font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                  layoutMode === 'solar'
                    ? 'bg-amber-950/80 border border-amber-500/60 text-amber-300 shadow-neon-amber-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Galaxy Solar: Sistema Solar plano com setores cromáticos HSL"
              >
                <Orbit className="w-3.5 h-3.5 text-amber-400" />
                <span>Solar</span>
              </button>

              {/* Modo 3: Quantum */}
              <button
                type="button"
                onClick={() => setLayoutMode('quantum')}
                className={`px-2 py-1.5 rounded-lg text-[11px] font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                  layoutMode === 'quantum'
                    ? 'bg-fuchsia-950/80 border border-fuchsia-500/60 text-fuchsia-300 shadow-neon-pink-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Galaxy Quantum: Simulação física orgânica viva"
              >
                <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
                <span>Quantum</span>
              </button>
            </div>
          </div>

          <span className="text-xs font-semibold text-slate-400 block pt-1">
            Recursos da Cena {is2D ? '2D' : '3D'}
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

          {/* Toggle Nomes das Pastas */}
          <button
            onClick={toggleShowFolderLabels}
            className={`w-full px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between border transition-all cursor-pointer ${
              showFolderLabels
                ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300'
                : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Folder className="w-3.5 h-3.5 text-cyan-400" />
              <span>Nomes das Pastas</span>
            </div>
            <span className="text-[10px] font-bold uppercase">
              {showFolderLabels ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Toggle Nomes dos Arquivos */}
          <button
            onClick={toggleShowFileLabels}
            className={`w-full px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between border transition-all cursor-pointer ${
              showFileLabels
                ? 'bg-pink-950/40 border-pink-500/40 text-pink-300'
                : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-pink-400" />
              <span>Nomes dos Arquivos</span>
            </div>
            <span className="text-[10px] font-bold uppercase">
              {showFileLabels ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Toggle Geometria dos Arquivos (Bolinhas) */}
          <button
            onClick={toggleShowFileGeometry}
            className={`w-full px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between border transition-all cursor-pointer ${
              showFileGeometry
                ? 'bg-pink-950/40 border-pink-500/40 text-pink-300'
                : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              <span>Bolinhas dos Arquivos</span>
            </div>
            <span className="text-[10px] font-bold uppercase">
              {showFileGeometry ? 'ON' : 'OFF'}
            </span>
          </button>

          {!is2D && (
            <>
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
            </>
          )}
        </div>
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
