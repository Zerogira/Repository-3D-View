import React from 'react';
import { Box, Key, Layers, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Navbar({ viewMode, setViewMode, onOpenTokenModal, hasToken }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 px-6 py-4 glass-panel border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => window.location.reload()}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-pink-500 p-[2px] shadow-neon-cyan-sm">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Box className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-pink-400 to-purple-400">
              GitTree
            </span>
            <span className="text-xs ml-1.5 px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 font-medium">
              3D View
            </span>
          </div>
        </motion.div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {/* GitHub Token Config Button */}
          <button
            onClick={onOpenTokenModal}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
              hasToken
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400 shadow-sm'
                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-cyan-500/50 hover:text-cyan-400'
            }`}
            title="Configurar GitHub Personal Access Token"
          >
            <Key className="w-3.5 h-3.5" />
            {hasToken ? 'Token Ativo' : 'API Token'}
          </button>
        </div>
      </div>
    </header>
  );
}
