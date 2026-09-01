import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, ShieldCheck, X, Trash2 } from 'lucide-react';

export default function TokenModal({ isOpen, onClose, onTokenUpdate }) {
  const [tokenInput, setTokenInput] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const stored = localStorage.getItem('gittree_github_token') || '';
      setTokenInput(stored);
      setSavedSuccess(false);
    }
  }, [isOpen]);

  const handleSave = (e) => {
    e.preventDefault();
    const cleanToken = tokenInput.trim();
    if (cleanToken) {
      localStorage.setItem('gittree_github_token', cleanToken);
    } else {
      localStorage.removeItem('gittree_github_token');
    }
    setSavedSuccess(true);
    onTokenUpdate(cleanToken);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  const handleClear = () => {
    localStorage.removeItem('gittree_github_token');
    setTokenInput('');
    onTokenUpdate('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative glass-panel-glow-cyan"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-cyan-950/80 border border-cyan-500/30 rounded-xl text-cyan-400">
                <Key className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">GitHub Personal Token</h3>
                <p className="text-xs text-slate-400">Aumente o limite de 60 para 5.000 requisições/hora</p>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Personal Access Token (PAT)
                </label>
                <input
                  type="password"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono"
                />
              </div>

              <div className="flex items-center gap-2 p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-400">
                <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Armazenado com segurança apenas no seu navegador (`localStorage`). O backend nunca imprime ou grava seu token.</span>
              </div>

              {savedSuccess && (
                <div className="p-2.5 bg-emerald-950/70 border border-emerald-500/40 text-emerald-400 text-xs rounded-xl font-medium text-center">
                  Token salvo com sucesso!
                </div>
              )}

              <div className="flex items-center justify-between gap-3 pt-2">
                {localStorage.getItem('gittree_github_token') ? (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="px-3 py-2 text-xs font-medium text-rose-400 hover:text-rose-300 flex items-center gap-1.5 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remover Token
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl shadow-neon-cyan transition-all"
                  >
                    Salvar Token
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
