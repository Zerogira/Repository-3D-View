import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileCode, FolderTree, Star, PieChart, Layers, ChevronRight, ChevronLeft, Sparkles, BoxSelect, Maximize2 } from 'lucide-react';

/**
 * src/components/SidebarStats.jsx
 * 
 * Painel de Estatísticas Flutuante em Glassmorphism (Ancorado no Canto Superior Direito).
 * Permite ao usuário recolher o painel para limpar 100% da tela para o 3D.
 */
export default function SidebarStats({
  stats,
  repoSlug,
  stars,
  isTruncated,
  floating = false,
  superNodeCount = 0,
  viewMode = '2D',
  onOpenGalaxy3D,
}) {
  const [isOpen, setIsOpen] = useState(true);

  if (!stats) return null;

  const content = (
    <div className="w-72 bg-slate-950/90 border border-slate-800/90 p-4 rounded-2xl space-y-4 shadow-2xl backdrop-blur-xl text-slate-100 max-h-[85vh] overflow-y-auto custom-scrollbar">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="truncate max-w-[170px]">
          <h3 className="font-extrabold text-xs text-slate-100 truncate">{repoSlug}</h3>
          <span className="text-[10px] text-cyan-400 font-mono font-medium">Estatísticas</span>
        </div>
        {stars !== undefined && (
          <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-950/60 border border-amber-500/30 rounded-lg text-amber-300 text-xs font-bold shrink-0">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            {stars >= 1000 ? `${(stars / 1000).toFixed(1)}k` : stars}
          </div>
        )}
      </div>

      {/* Botão de Boas-Vindas: Atalho com destaque para imersão 3D */}
      {viewMode === '2D' && onOpenGalaxy3D && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onOpenGalaxy3D}
          className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-500 via-purple-600 to-pink-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-neon-cyan hover:shadow-neon-pink-sm transition-all cursor-pointer group"
          title="Mergulhar no espaço tridimensional com visualização em tela cheia"
        >
          <BoxSelect className="w-4 h-4 text-cyan-200 group-hover:rotate-12 transition-transform" />
          <span>🌌 Abrir Modo Galaxy 3D</span>
          <Maximize2 className="w-3 h-3 ml-auto opacity-70" />
        </motion.button>
      )}

      {isTruncated && (
        <div className="p-2 bg-amber-950/60 border border-amber-500/40 rounded-xl text-[10px] text-amber-300">
          ⚠️ Repositório extenso. Exibindo parcial para preservar alta performance.
        </div>
      )}

      {/* Grid de Métricas Principais */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2.5 bg-slate-900/60 border border-cyan-500/20 rounded-xl">
          <div className="flex items-center gap-1 text-cyan-400 text-[11px] mb-0.5 font-semibold">
            <FolderTree className="w-3 h-3" /> Pastas
          </div>
          <span className="text-base font-bold text-slate-100">{stats.total_folders}</span>
        </div>

        <div className="p-2.5 bg-slate-900/60 border border-pink-500/20 rounded-xl">
          <div className="flex items-center gap-1 text-pink-400 text-[11px] mb-0.5 font-semibold">
            <FileCode className="w-3 h-3" /> Arquivos
          </div>
          <span className="text-base font-bold text-slate-100">{stats.total_files}</span>
        </div>
      </div>

      {/* Grid de Profundidade e Super Nós Compilados */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2.5 bg-slate-900/60 border border-slate-800/80 rounded-xl">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span>Profundidade</span>
          </div>
          <span className="font-bold text-slate-100 text-xs mt-1 block">{stats.max_depth} níveis</span>
        </div>

        <div className="p-2.5 bg-slate-900/60 border border-amber-500/30 rounded-xl bg-gradient-to-br from-amber-500/10 to-transparent">
          <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Super Nós</span>
          </div>
          <span className="font-bold text-amber-300 text-xs mt-1 block">
            {superNodeCount || stats.super_nodes || 0} compilados
          </span>
        </div>
      </div>

      {/* Top Extensões */}
      {stats.top_extensions && stats.top_extensions.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
            <PieChart className="w-3.5 h-3.5 text-cyan-400" />
            <span>Top Extensões</span>
          </div>

          <div className="space-y-1.5 pt-0.5">
            {stats.top_extensions.slice(0, 4).map((item) => {
              const percentage = Math.round((item.count / stats.total_files) * 100) || 1;
              return (
                <div key={item.ext} className="text-xs space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-mono font-semibold text-slate-200">{item.ext}</span>
                    <span className="text-slate-400">{item.count} ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-slate-950 h-1 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="bg-gradient-to-r from-cyan-400 to-pink-500 h-full rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  if (floating) {
    return (
      <div
        className={`absolute top-4 right-4 z-20 transition-transform duration-300 ease-in-out flex items-start ${
          isOpen ? 'translate-x-0' : 'translate-x-[calc(100%-12px)]'
        }`}
      >
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="mt-3 p-2 bg-slate-950/90 border border-slate-800 text-slate-300 hover:text-cyan-400 rounded-l-xl shadow-2xl backdrop-blur-md transition-colors cursor-pointer"
          title={isOpen ? 'Recolher Estatísticas' : 'Exibir Estatísticas'}
        >
          {isOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4 text-cyan-400" />}
        </button>
        {content}
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
      {content}
    </motion.div>
  );
}
