import React, { useState, useEffect } from 'react';
import { Settings, Sparkles, Grid, Cpu, X } from 'lucide-react';
import HackerGrid from './HackerGrid';
import CyberSpotlight from './CyberSpotlight';
import NetworkNodes from './NetworkNodes';

/**
 * src/components/backgrounds/BackgroundSwitcher.jsx
 * 
 * Gerenciador e Alternador Dinâmico de Backgrounds para a Home:
 * - Botão flutuante minimalista de engrenagem no canto inferior direito.
 * - Modal elegante com as 3 opções de efeitos em tempo real.
 * - Salva a preferência no localStorage ('gittree_bg_style').
 */
export default function BackgroundSwitcher() {
  const [bgStyle, setBgStyle] = useState('grid'); // 'grid' | 'spotlight' | 'nodes'
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('gittree_bg_style');
    if (saved && ['grid', 'spotlight', 'nodes'].includes(saved)) {
      setBgStyle(saved);
    }
  }, []);

  const handleSelectStyle = (style) => {
    setBgStyle(style);
    localStorage.setItem('gittree_bg_style', style);
  };

  return (
    <>
      {/* 1. Renderização do Fundo Escolhido */}
      {bgStyle === 'grid' && <HackerGrid />}
      {bgStyle === 'spotlight' && <CyberSpotlight />}
      {bgStyle === 'nodes' && <NetworkNodes />}

      {/* 2. Botão Flutuante de Engrenagem (Canto Inferior Direito da Home) */}
      <div className="fixed bottom-5 right-5 z-40">
        <button
          onClick={() => setIsModalOpen(true)}
          className="p-3.5 rounded-2xl bg-slate-950/85 hover:bg-slate-900 border border-slate-800 hover:border-pink-500/50 text-slate-400 hover:text-pink-400 shadow-2xl backdrop-blur-xl transition-all duration-300 cursor-pointer group flex items-center justify-center hover:shadow-neon-pink-sm"
          title="Personalizar Tema de Fundo (Easter Egg)"
        >
          <Settings className="w-5 h-5 group-hover:rotate-90 text-slate-400 group-hover:text-pink-400 transition-all duration-300" />
        </button>
      </div>

      {/* 3. Modal de Troca de Background */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-950/95 border border-cyan-900/50 rounded-2xl p-5 shadow-2xl shadow-cyan-950/40 relative font-sans space-y-4">
            {/* Header do Modal */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono">
                  Tema de Fundo
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Experimente os efeitos de fundo cibernéticos em tempo real:
            </p>

            {/* Opções de Background */}
            <div className="space-y-2">
              <button
                onClick={() => handleSelectStyle('grid')}
                className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  bgStyle === 'grid'
                    ? 'bg-cyan-950/60 border-cyan-500/60 text-cyan-300 shadow-neon-cyan-sm'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Grid className="w-4 h-4 text-cyan-400" />
                  <div>
                    <p className="text-xs font-bold text-slate-200">Hacker Grid</p>
                    <p className="text-[10px] text-slate-500">Matriz de caracteres interativa no mouse</p>
                  </div>
                </div>
                {bgStyle === 'grid' && (
                  <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-neon-cyan"></span>
                )}
              </button>

              <button
                onClick={() => handleSelectStyle('spotlight')}
                className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  bgStyle === 'spotlight'
                    ? 'bg-fuchsia-950/60 border-fuchsia-500/60 text-fuchsia-300 shadow-neon-pink-sm'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="w-4 h-4 text-fuchsia-400" />
                  <div>
                    <p className="text-xs font-bold text-slate-200">Cyber Spotlight</p>
                    <p className="text-[10px] text-slate-500">Lanternas coloridas Cyan & Magenta com blur</p>
                  </div>
                </div>
                {bgStyle === 'spotlight' && (
                  <span className="w-2 h-2 rounded-full bg-fuchsia-400 shadow-neon-pink"></span>
                )}
              </button>

              <button
                onClick={() => handleSelectStyle('nodes')}
                className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  bgStyle === 'nodes'
                    ? 'bg-sky-950/60 border-sky-500/60 text-sky-300 shadow-neon-cyan-sm'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Cpu className="w-4 h-4 text-sky-400" />
                  <div>
                    <p className="text-xs font-bold text-slate-200">Network Nodes</p>
                    <p className="text-[10px] text-slate-500">Constelação de partículas conectadas a laser</p>
                  </div>
                </div>
                {bgStyle === 'nodes' && (
                  <span className="w-2 h-2 rounded-full bg-sky-400 shadow-neon-cyan"></span>
                )}
              </button>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-300 transition-colors cursor-pointer"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
