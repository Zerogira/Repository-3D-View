import React from 'react';
import { Box, Key, ArrowLeft, GitBranch, Layers, BoxSelect, Filter } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * src/components/Navbar.jsx
 * 
 * Header limpo com Toggle Segmentado 2D/3D no centro e Breadcrumbs à esquerda.
 */
export default function Navbar({
  viewMode,
  setViewMode,
  onOpenTokenModal,
  hasToken,
  currentView = 'HOME',
  activeRepo = '',
  onBackToHome,
  filterTerm = '',
  setFilterTerm,
}) {
  return (
    <header className="h-16 px-4 md:px-8 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80 flex items-center justify-between z-40 shrink-0 select-none">
      <div className="w-full max-w-[1600px] mx-auto flex items-center justify-between gap-4">
        
        {/* LADO ESQUERDO: Logo Marca & Breadcrumbs */}
        <div className="flex items-center gap-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 cursor-pointer"
            onClick={onBackToHome || (() => window.location.reload())}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-pink-500 p-[2px] shadow-neon-cyan-sm shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Box className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div className="hidden sm:block">
              <span className="font-extrabold text-lg tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-pink-400 to-purple-400">
                GitTree
              </span>
              <span className="text-[10px] ml-1.5 px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 font-medium">
                3D View
              </span>
            </div>
          </motion.div>

          {/* Breadcrumbs quando no Workspace */}
          {currentView === 'WORKSPACE' && (
            <div className="flex items-center gap-2 border-l border-slate-800/80 pl-4 text-xs font-mono">
              {onBackToHome && (
                <button
                  onClick={onBackToHome}
                  className="px-2.5 py-1 bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-400 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                  title="Voltar para a Tela Inicial de Busca"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Projetos</span>
                </button>
              )}
              {activeRepo && (
                <div className="hidden md:flex items-center gap-1.5 text-slate-400 bg-slate-900/60 px-3 py-1 rounded-xl border border-slate-800/80">
                  <GitBranch className="w-3.5 h-3.5 text-pink-400" />
                  <span className="text-cyan-300 font-bold">{activeRepo}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* CENTRO: Toggle Switch Segmentado 2D / 3D (Visível apenas no Workspace) */}
        {currentView === 'WORKSPACE' ? (
          <div className="flex items-center bg-slate-900/90 border border-slate-800 p-1 rounded-2xl shadow-inner font-mono text-xs">
            <button
              onClick={() => setViewMode('2D')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === '2D'
                  ? 'bg-slate-800 text-pink-300 border border-pink-500/40 shadow-neon-pink-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-pink-400" />
              <span>Plano 2D</span>
            </button>

            <button
              onClick={() => setViewMode('3D')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === '3D'
                  ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-neon-cyan'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BoxSelect className="w-3.5 h-3.5 text-cyan-300" />
              <span>Modo Galaxy 3D</span>
            </button>
          </div>
        ) : null}

        {/* LADO DIREITO: Filtro de Arquivos + API Token */}
        <div className="flex items-center gap-3">
          {/* Filtro do Grafo (no Workspace) */}
          {currentView === 'WORKSPACE' && setFilterTerm && (
            <div className="relative hidden lg:flex items-center w-56">
              <Filter className="w-3.5 h-3.5 text-slate-500 absolute left-3" />
              <input
                type="text"
                value={filterTerm}
                onChange={(e) => setFilterTerm(e.target.value)}
                placeholder="Filtrar arquivos..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:shadow-neon-cyan transition-all font-mono"
              />
              {filterTerm && (
                <button
                  onClick={() => setFilterTerm('')}
                  className="absolute right-2.5 text-xs text-slate-500 hover:text-slate-200"
                >
                  ×
                </button>
              )}
            </div>
          )}

          {/* GitHub Token Config Button */}
          <button
            onClick={onOpenTokenModal}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              hasToken
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400 shadow-sm'
                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-cyan-500/50 hover:text-cyan-400'
            }`}
            title="Configurar GitHub Personal Access Token"
          >
            <Key className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">{hasToken ? 'Token Ativo' : 'API Token'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
