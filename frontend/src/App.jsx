import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Key, FolderGit2, Sparkles, History, Trash2, Minimize } from 'lucide-react';
import Navbar from './components/Navbar';
import SearchBar from './components/SearchBar';
import GraphViewer3D from './components/GraphViewer3D';
import GraphViewer2D from './components/GraphViewer2D';
import SidebarStats from './components/SidebarStats';
import NodeDetailsModal from './components/NodeDetailsModal';
import CodeViewerPanel from './components/CodeViewerPanel';
import TokenModal from './components/TokenModal';
import BackgroundSwitcher from './components/backgrounds/BackgroundSwitcher';
import { fetchRepositoryGraph } from './services/api';
import { useAppStore } from './core/store';

export default function App() {
  const [viewMode, setViewMode] = useState('3D'); // '3D' | '2D'
  const [currentView, setCurrentView] = useState('HOME'); // 'HOME' | 'WORKSPACE'
  const [activeRepo, setActiveRepo] = useState('vuejs/core');
  const [graphData, setGraphData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [errorStatus, setErrorStatus] = useState(null);

  // Histórico de Repositórios Recentes
  const [recentRepos, setRecentRepos] = useState([]);

  // Full screen state
  const [is3DFullScreen, setIs3DFullScreen] = useState(false);

  // Alterna tela cheia verdadeira no monitor via Fullscreen API nativo
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIs3DFullScreen(true);
      }).catch(() => {
        setIs3DFullScreen((prev) => !prev);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIs3DFullScreen(false);
      }).catch(() => {
        setIs3DFullScreen(false);
      });
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIs3DFullScreen(Boolean(document.fullscreenElement));
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && is3DFullScreen) {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
        setIs3DFullScreen(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [is3DFullScreen]);

  // Selected Node state (sincronizado com Zustand para os nós 3D/2D)
  const selectedNode = useAppStore((s) => s.selectedNode);
  const setSelectedNode = useAppStore((s) => s.setSelectedNode);

  // In-graph search filter
  const [filterTerm, setFilterTerm] = useState('');

  // Token modal state
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  // Carrega preferências e histórico recente ao iniciar
  useEffect(() => {
    const token = localStorage.getItem('gittree_github_token');
    setHasToken(Boolean(token && token.trim()));

    try {
      const storedRecents = JSON.parse(localStorage.getItem('gittree_recent_repos') || '[]');
      if (Array.isArray(storedRecents)) setRecentRepos(storedRecents);
    } catch {
      setRecentRepos([]);
    }
  }, []);

  const saveRecentRepo = (repoSlug) => {
    setRecentRepos((prev) => {
      const filtered = prev.filter((r) => r.toLowerCase() !== repoSlug.toLowerCase());
      const next = [repoSlug, ...filtered].slice(0, 6);
      try {
        localStorage.setItem('gittree_recent_repos', JSON.stringify(next));
      } catch (e) {
        console.warn('Falha ao salvar repositório recente no localStorage:', e);
      }
      return next;
    });
  };

  const handleClearRecent = () => {
    setRecentRepos([]);
    try {
      localStorage.removeItem('gittree_recent_repos');
    } catch (e) {
      console.warn('Falha ao limpar histórico:', e);
    }
  };

  const loadRepository = async (repoSlug) => {
    setIsLoading(true);
    setErrorMessage(null);
    setErrorStatus(null);
    setSelectedNode(null);
    setFilterTerm('');

    try {
      const data = await fetchRepositoryGraph(repoSlug);
      setGraphData(data);
      setActiveRepo(repoSlug);
      saveRecentRepo(repoSlug);
      setCurrentView('WORKSPACE');
    } catch (err) {
      setErrorMessage(err.message || 'Falha ao carregar dados do repositório.');
      setErrorStatus(err.status || 500);
      setGraphData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTokenUpdate = (token) => {
    setHasToken(Boolean(token && token.trim()));
    if (activeRepo && currentView === 'WORKSPACE') {
      loadRepository(activeRepo);
    }
  };

  return (
    <div className="h-screen w-screen bg-[#070a12] text-slate-100 flex flex-col overflow-hidden font-sans select-none">
      {/* Header Superior Limpo */}
      {!is3DFullScreen && (
        <Navbar
          viewMode={viewMode}
          setViewMode={setViewMode}
          onOpenTokenModal={() => setIsTokenModalOpen(true)}
          hasToken={hasToken}
          currentView={currentView}
          activeRepo={activeRepo}
          onBackToHome={() => setCurrentView('HOME')}
          filterTerm={filterTerm}
          setFilterTerm={setFilterTerm}
          isFullScreen={is3DFullScreen}
          onToggleFullScreen={toggleFullScreen}
        />
      )}

      {/* ROTA 1: PÁGINA INICIAL (HOME) */}
      {currentView === 'HOME' ? (
        <main className="w-full h-screen min-h-screen overflow-y-auto px-4 md:px-8 flex flex-col items-center justify-center space-y-8 max-w-4xl mx-auto custom-scrollbar relative z-10 bg-transparent">
          {/* Alternador de Backgrounds Dinâmicos (HackerGrid / CyberSpotlight / NetworkNodes) */}
          <BackgroundSwitcher />

          {/* Hero Header */}
          <div className="text-center space-y-4 max-w-2xl">
            <motion.h1
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-6xl font-extrabold tracking-tight"
            >
              Explore Repositórios em{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-pink-400 to-purple-400 drop-shadow-[0_0_20px_rgba(34,211,238,0.35)]">
                Árvores 3D
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-slate-400 text-sm md:text-base"
            >
              Mapeamento de arquiteturas GitHub em visualização de Nebulosa Orgânica 3D & 2D.
            </motion.p>
          </div>

          {/* Barra de Pesquisa Principal Centralizada */}
          <SearchBar
            onSearch={loadRepository}
            isLoading={isLoading}
            activeRepo={activeRepo}
            recentRepos={recentRepos}
            onClearRecent={handleClearRecent}
          />

          {/* Error Notification Banner na Home */}
          <AnimatePresence>
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="w-full max-w-2xl p-4 bg-rose-950/80 border border-rose-500/50 rounded-2xl shadow-neon-pink-sm flex items-start gap-3 text-rose-200 text-sm"
              >
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <strong className="font-bold block mb-0.5">Erro ao carregar repositório:</strong>
                  <span>{errorMessage}</span>

                  {errorStatus === 403 && (
                    <div className="mt-3 pt-2 border-t border-rose-500/30 flex items-center justify-between">
                      <span className="text-xs text-rose-300">
                        Adicione seu API Token para liberar 5.000 requisições por hora.
                      </span>
                      <button
                        onClick={() => setIsTokenModalOpen(true)}
                        className="px-3 py-1.5 bg-cyan-500 text-slate-950 text-xs font-bold rounded-lg shadow-neon-cyan flex items-center gap-1.5 cursor-pointer"
                      >
                        <Key className="w-3.5 h-3.5" />
                        Inserir Token
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      ) : (
        /* ROTA 2: WORKSPACE DE VISUALIZAÇÃO (CANVAS EXPANDIDO 100vh) */
        <main
          className={`flex-1 w-full h-full relative overflow-hidden bg-[#070a12] ${
            is3DFullScreen ? 'fixed inset-0 z-30 w-screen h-screen' : ''
          }`}
        >
          {isLoading ? (
            <div className="w-full h-full bg-slate-950/90 backdrop-blur-xl flex flex-col items-center justify-center space-y-4">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin"></div>
                <div
                  className="absolute inset-2 rounded-full border-4 border-pink-500/20 border-t-pink-500 animate-spin"
                  style={{ animationDirection: 'reverse', animationDuration: '1.4s' }}
                ></div>
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-bold text-cyan-400">Reconstruindo Cidade Orgânica do GitHub...</p>
                <p className="text-xs text-slate-500">Mapeando hierarquia e distribuindo pesos no Web Worker</p>
              </div>
            </div>
          ) : graphData ? (
            <div className="w-full h-full relative">
              {viewMode === '3D' || is3DFullScreen ? (
                <GraphViewer3D
                  graphData={graphData}
                  onNodeClick={(node) => setSelectedNode(node)}
                  filterTerm={filterTerm}
                  isFullScreen={is3DFullScreen}
                  onToggleFullScreen={toggleFullScreen}
                />
              ) : (
                <GraphViewer2D
                  graphData={graphData}
                  onNodeClick={(node) => setSelectedNode(node)}
                  filterTerm={filterTerm}
                />
              )}

              {/* SidebarStats Flutuante no Canto Superior Direito */}
              <SidebarStats
                stats={graphData.stats}
                repoSlug={graphData.repo}
                stars={graphData.stars}
                isTruncated={graphData.is_truncated}
                floating={true}
              />
            </div>
          ) : null}
        </main>
      )}

      {/* Botão Flutuante Centralizado para Sair da Tela Cheia quando em Fullscreen */}
      {is3DFullScreen && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40 flex items-center pointer-events-auto">
          <button
            onClick={toggleFullScreen}
            className="px-4 py-1.5 bg-slate-950/90 hover:bg-cyan-950/90 border border-slate-700 hover:border-cyan-500/80 text-slate-200 hover:text-cyan-300 text-xs font-mono font-bold rounded-full shadow-2xl backdrop-blur-xl flex items-center gap-2 transition-all cursor-pointer"
            title="Sair da Tela Cheia (ESC)"
          >
            <Minimize className="w-3.5 h-3.5 text-cyan-400" />
            <span>Sair da Tela Cheia (ESC)</span>
          </button>
        </div>
      )}

      {/* Drawer Lateral Retrátil de Código-Fonte (Syntax Highlighter) */}
      <CodeViewerPanel
        node={selectedNode}
        repoSlug={graphData?.repo}
        defaultBranch={graphData?.default_branch}
        onClose={() => setSelectedNode(null)}
      />

      {/* Modal de Token do GitHub Access */}
      <TokenModal
        isOpen={isTokenModalOpen}
        onClose={() => setIsTokenModalOpen(false)}
        onTokenUpdate={handleTokenUpdate}
      />
    </div>
  );
}
