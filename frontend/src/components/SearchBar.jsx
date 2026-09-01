import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Sparkles, FolderGit2, ArrowRight } from 'lucide-react';

const PRESET_REPOS = [
  { name: 'facebook/react', label: 'React', desc: 'UI Library' },
  { name: 'vuejs/core', label: 'Vue.js', desc: 'Framework' },
  { name: 'fastapi/fastapi', label: 'FastAPI', desc: 'Python API' },
  { name: 'tailwindlabs/tailwindcss', label: 'Tailwind', desc: 'CSS Framework' }
];

export default function SearchBar({ onSearch, isLoading, activeRepo }) {
  const [inputVal, setInputVal] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputVal.trim()) {
      onSearch(inputVal.trim());
    }
  };

  const handlePresetClick = (repoSlug) => {
    setInputVal(repoSlug);
    onSearch(repoSlug);
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Central Search Form */}
      <motion.form
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        onSubmit={handleSubmit}
        className="relative group"
      >
        <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 via-pink-500 to-purple-500 rounded-2xl blur opacity-30 group-hover:opacity-75 transition duration-500"></div>
        <div className="relative flex items-center bg-slate-900/90 border border-slate-800 rounded-2xl p-2 shadow-2xl glass-panel">
          <div className="pl-3 pr-2 text-cyan-400">
            <FolderGit2 className="w-6 h-6" />
          </div>

          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Digite o repositório do GitHub (ex: facebook/react ou usuario/repo)..."
            className="w-full bg-transparent text-slate-100 placeholder-slate-500 text-sm md:text-base font-medium focus:outline-none px-2 py-2.5"
            disabled={isLoading}
          />

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={isLoading || !inputVal.trim()}
            className={`px-5 py-3 rounded-xl text-xs md:text-sm font-bold flex items-center gap-2 transition-all shrink-0 ${
              isLoading || !inputVal.trim()
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-cyan-400 to-cyan-500 text-slate-950 shadow-neon-cyan hover:shadow-cyan-400/50'
            }`}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Gerar Grafo</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </div>
      </motion.form>

      {/* Preset Repositories Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="flex items-center justify-center gap-2 mt-4 flex-wrap"
      >
        <span className="text-xs text-slate-400 flex items-center gap-1 mr-1">
          <Sparkles className="w-3.5 h-3.5 text-pink-400" /> Teste Rápido:
        </span>

        {PRESET_REPOS.map((preset) => {
          const isActive = activeRepo?.toLowerCase() === preset.name.toLowerCase();
          return (
            <button
              key={preset.name}
              onClick={() => handlePresetClick(preset.name)}
              disabled={isLoading}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-pink-950/70 border-pink-500/60 text-pink-300 shadow-neon-pink-sm'
                  : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:border-cyan-500/50 hover:text-cyan-400 hover:bg-cyan-950/30'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
              {preset.label}
              <span className="text-[10px] text-slate-500 font-normal">({preset.desc})</span>
            </button>
          );
        })}
      </motion.div>
    </div>
  );
}
