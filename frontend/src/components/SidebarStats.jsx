import React from 'react';
import { motion } from 'framer-motion';
import { FileCode, FolderTree, Star, PieChart, Layers } from 'lucide-react';

export default function SidebarStats({ stats, repoSlug, stars, isTruncated }) {
  if (!stats) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      className="w-full lg:w-72 glass-panel p-5 rounded-2xl border border-slate-800 space-y-4"
    >
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div>
          <h3 className="font-extrabold text-sm text-slate-100 truncate max-w-[180px]">{repoSlug}</h3>
          <span className="text-[10px] text-cyan-400 font-medium">Estatísticas do Repositório</span>
        </div>
        {stars !== undefined && (
          <div className="flex items-center gap-1 px-2 py-1 bg-amber-950/60 border border-amber-500/30 rounded-lg text-amber-300 text-xs font-bold">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            {stars >= 1000 ? `${(stars / 1000).toFixed(1)}k` : stars}
          </div>
        )}
      </div>

      {isTruncated && (
        <div className="p-2.5 bg-amber-950/60 border border-amber-500/40 rounded-xl text-[11px] text-amber-300">
          ⚠️ Repositório extenso. Exibindo parcial da estrutura para preservar a performance 3D.
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="p-3 bg-slate-950/70 border border-cyan-500/20 rounded-xl">
          <div className="flex items-center gap-1.5 text-cyan-400 text-xs mb-1 font-semibold">
            <FolderTree className="w-3.5 h-3.5" /> Pastas
          </div>
          <span className="text-lg font-bold text-slate-100">{stats.total_folders}</span>
        </div>

        <div className="p-3 bg-slate-950/70 border border-pink-500/20 rounded-xl">
          <div className="flex items-center gap-1.5 text-pink-400 text-xs mb-1 font-semibold">
            <FileCode className="w-3.5 h-3.5" /> Arquivos
          </div>
          <span className="text-lg font-bold text-slate-100">{stats.total_files}</span>
        </div>
      </div>

      <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Layers className="w-4 h-4 text-purple-400" />
          <span>Profundidade Máxima</span>
        </div>
        <span className="font-bold text-slate-100 text-sm">{stats.max_depth} níveis</span>
      </div>

      {/* File Extension Breakdown */}
      {stats.top_extensions && stats.top_extensions.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
            <PieChart className="w-3.5 h-3.5 text-cyan-400" />
            <span>Top Extensões de Arquivos</span>
          </div>

          <div className="space-y-2 pt-1">
            {stats.top_extensions.map((item) => {
              const percentage = Math.round((item.count / stats.total_files) * 100) || 1;
              return (
                <div key={item.ext} className="text-xs space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono font-semibold text-slate-200">{item.ext}</span>
                    <span className="text-slate-400">{item.count} ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
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
    </motion.div>
  );
}
