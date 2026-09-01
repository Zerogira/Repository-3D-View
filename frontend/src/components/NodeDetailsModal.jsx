import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Folder, ExternalLink, X, HardDrive, GitBranch, Layers } from 'lucide-react';

export default function NodeDetailsModal({ node, repoSlug, defaultBranch, onClose }) {
  if (!node) return null;

  const isFolder = node.type === 'folder';
  const githubFileUrl = `https://github.com/${repoSlug}/${isFolder ? 'tree' : 'blob'}/${defaultBranch || 'main'}/${node.path}`;

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return 'N/A (Diretório)';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 50 }}
        className="fixed top-24 right-6 z-30 w-full max-w-sm glass-panel-glow-cyan p-5 rounded-2xl shadow-2xl border border-slate-800"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className={`p-3 rounded-xl border ${
            isFolder 
              ? 'bg-cyan-950/80 border-cyan-500/40 text-cyan-400' 
              : 'bg-pink-950/80 border-pink-500/40 text-pink-400'
          }`}>
            {isFolder ? <Folder className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
          </div>
          <div className="overflow-hidden">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
              isFolder
                ? 'bg-cyan-950 text-cyan-300 border-cyan-500/30'
                : 'bg-pink-950 text-pink-300 border-pink-500/30'
            }`}>
              {isFolder ? 'Diretório' : 'Arquivo'}
            </span>
            <h4 className="text-base font-bold text-slate-100 truncate mt-1" title={node.name}>
              {node.name}
            </h4>
          </div>
        </div>

        <div className="space-y-2.5 text-xs text-slate-300 mb-5">
          <div className="p-2.5 bg-slate-950/70 rounded-xl border border-slate-800/80">
            <span className="text-slate-500 block text-[10px] font-semibold mb-0.5">Caminho Completo:</span>
            <code className="text-cyan-300 break-all font-mono">{node.path || '/'}</code>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 bg-slate-950/70 rounded-xl border border-slate-800/80 flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-pink-400 shrink-0" />
              <div>
                <span className="text-slate-500 block text-[10px]">Tamanho</span>
                <span className="font-semibold">{formatBytes(node.size)}</span>
              </div>
            </div>

            <div className="p-2.5 bg-slate-950/70 rounded-xl border border-slate-800/80 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400 shrink-0" />
              <div>
                <span className="text-slate-500 block text-[10px]">Nível Ninho</span>
                <span className="font-semibold">Profundidade {node.depth}</span>
              </div>
            </div>
          </div>

          {node.extension && (
            <div className="p-2.5 bg-slate-950/70 rounded-xl border border-slate-800/80 flex items-center justify-between">
              <span className="text-slate-500 text-[10px]">Extensão de Arquivo:</span>
              <span className="font-mono font-bold text-pink-400">{node.extension}</span>
            </div>
          )}
        </div>

        {node.path && (
          <a
            href={githubFileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-neon-cyan hover:shadow-cyan-400/50 transition-all"
          >
            <span>Ver no GitHub</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
