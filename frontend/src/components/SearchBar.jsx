import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Sparkles, FolderGit2, ArrowRight, History, Trash2 } from 'lucide-react';

const DEMO_REPOS = [
  { name: 'vuejs/core', label: 'Vue.js', desc: 'Framework' },
  { name: 'facebook/react', label: 'React', desc: 'UI Library' },
  { name: 'fastapi/fastapi', label: 'FastAPI', desc: 'Python API' },
  { name: 'tailwindlabs/tailwindcss', label: 'Tailwind', desc: 'CSS Engine' },
];

export default function SearchBar({
  onSearch,
  isLoading,
  activeRepo,
  compact = false,
  recentRepos = [],
  onClearRecent,
}) {
  const [inputVal, setInputVal] = useState(activeRepo || '');

  useEffect(() => {
    if (activeRepo) setInputVal(activeRepo);
  }, [activeRepo]);

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

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="flex items-center gap-2 w-full max-w-lg">
        <div className="relative flex-1 flex items-center bg-slate-950/90 border border-slate-800 rounded-xl px-3 py-1.5 focus-within:border-cyan-400 focus-within:shadow-neon-cyan transition-all">
          <FolderGit2 className="w-4 h-4 text-cyan-400 shrink-0 mr-2" />
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Mudar repositório (ex: owner/repo)..."
            className="w-full bg-transparent text-slate-100 placeholder-slate-500 text-xs font-mono focus:outline-none"
            disabled={isLoading}
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !inputVal.trim()}
          className="px-3.5 py-1.5 bg-gradient-to-r from-cyan-400 to-cyan-500 text-slate-950 text-xs font-bold rounded-xl shadow-neon-cyan hover:shadow-cyan-400/50 transition-all shrink-0 flex items-center gap-1 cursor-pointer disabled:opacity-50"
        >
          {isLoading ? (
            <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <span>Mapear</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </form>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      {/* Central Search Form */}
      <motion.form
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        onSubmit={handleSubmit}
        className="relative group"
      >
        <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 via-pink-500 to-purple-500 rounded-2xl blur opacity-35 group-hover:opacity-80 transition duration-500"></div>
        <div className="relative flex items-center bg-slate-950/90 border border-slate-800 rounded-2xl p-2 shadow-2xl backdrop-blur-xl focus-within:border-cyan-400 focus-within:shadow-neon-cyan transition-all">
          <div className="pl-3 pr-2 text-cyan-400">
            <FolderGit2 className="w-6 h-6" />
          </div>

          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Digite o repositório do GitHub (ex: facebook/react ou usuario/repo)..."
            className="w-full bg-transparent text-slate-100 placeholder-slate-500 text-sm md:text-base font-medium focus:outline-none px-2 py-2.5 font-mono"
            disabled={isLoading}
          />

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={isLoading || !inputVal.trim()}
            className={`px-5 py-3 rounded-xl text-xs md:text-sm font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
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

      {/* Preset Repositories & Recent Shortcuts Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="flex flex-col items-center gap-3"
      >
        {/* Demonstração em 1 Clique */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400 flex items-center gap-1 mr-1">
            <Sparkles className="w-3.5 h-3.5 text-pink-400" /> Demonstração:
          </span>

          {DEMO_REPOS.map((preset) => {
            const isActive = activeRepo?.toLowerCase() === preset.name.toLowerCase();
            return (
              <button
                key={preset.name}
                onClick={() => handlePresetClick(preset.name)}
                disabled={isLoading}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-pink-950/70 border-pink-500/60 text-pink-300 shadow-neon-pink-sm'
                    : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-cyan-500/50 hover:text-cyan-400 hover:bg-cyan-950/30'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                {preset.label}
                <span className="text-[10px] text-slate-500 font-normal">({preset.desc})</span>
              </button>
            );
          })}
        </div>

        {/* Histórico Recente */}
        {recentRepos.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
            <span className="flex items-center gap-1 text-slate-500">
              <History className="w-3.5 h-3.5 text-cyan-400" /> Recentes:
            </span>
            {recentRepos.map((repo) => (
              <button
                key={repo}
                onClick={() => handlePresetClick(repo)}
                disabled={isLoading}
                className="px-2.5 py-1 bg-slate-950 border border-slate-800/80 hover:border-slate-700 text-slate-300 rounded-lg font-mono text-[11px] hover:text-cyan-400 transition-all cursor-pointer"
              >
                {repo}
              </button>
            ))}

            {onClearRecent && (
              <button
                onClick={onClearRecent}
                className="p-1 text-slate-600 hover:text-rose-400 transition-colors ml-1"
                title="Limpar histórico recente"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
