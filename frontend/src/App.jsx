import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, AlertCircle, Key, RefreshCw, Box, Layers, Filter } from 'lucide-react';
import Navbar from './components/Navbar';
import SearchBar from './components/SearchBar';
import GraphViewer3D from './components/GraphViewer3D';
import GraphViewer2D from './components/GraphViewer2D';
import SidebarStats from './components/SidebarStats';
import NodeDetailsModal from './components/NodeDetailsModal';
import TokenModal from './components/TokenModal';
import { fetchRepositoryGraph } from './services/api';

export default function App() {
  const [viewMode, setViewMode] = useState('3D');
  const [activeRepo, setActiveRepo] = useState('facebook/react');
  const [graphData, setGraphData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [errorStatus, setErrorStatus] = useState(null);
  
  // Selected Node state
  const [selectedNode, setSelectedNode] = useState(null);
  
  // In-graph search filter
  const [filterTerm, setFilterTerm] = useState('');
  
  // Token modal state
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  // Check stored token on load
  useEffect(() => {
    const token = localStorage.getItem('gittree_github_token');
    setHasToken(Boolean(token && token.trim()));
    // Initial default load
    loadRepository('facebook/react');
  }, []);

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
    if (activeRepo) {
      loadRepository(activeRepo);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f19] text-slate-100 relative">
      {/* Navigation Header */}
      <Navbar
        viewMode={viewMode}
        setViewMode={setViewMode}
        onOpenTokenModal={() => setIsTokenModalOpen(true)}
        hasToken={hasToken}
      />

      {/* Main Content Area */}
      <main className="flex-1 pt-24 pb-12 px-4 md:px-8 max-w-[1600px] w-full mx-auto flex flex-col space-y-6">
        
        {/* Hero Section & Search Bar */}
        <section className="text-center pt-2 pb-4 space-y-4">
          <motion.h1 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-5xl font-extrabold tracking-tight"
          >
            Explore Repositórios em{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-pink-400 to-purple-400 shadow-neon-cyan-sm">
              3D Interativo
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-slate-400 text-sm md:text-base max-w-xl mx-auto"
          >
            Mapeie visualmente a arquitetura de pastas (Cubos Ciano) e arquivos (Esferas Rosa) com física em tempo real.
          </motion.p>

          <SearchBar
            onSearch={loadRepository}
            isLoading={isLoading}
            activeRepo={activeRepo}
          />
        </section>

        {/* Error Notification Banner */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full max-w-3xl mx-auto p-4 bg-rose-950/80 border border-rose-500/50 rounded-2xl shadow-neon-pink-sm flex items-start gap-3 text-rose-200 text-sm"
            >
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <strong className="font-bold block mb-0.5">Atenção ao carregar repositório:</strong>
                <span>{errorMessage}</span>
                
                {errorStatus === 403 && (
                  <div className="mt-3 pt-2 border-t border-rose-500/30 flex items-center justify-between">
                    <span className="text-xs text-rose-300">
                      Adicione seu Personal Access Token para obter até 5.000 requisições por hora.
                    </span>
                    <button
                      onClick={() => setIsTokenModalOpen(true)}
                      className="px-3 py-1.5 bg-cyan-500 text-slate-950 text-xs font-bold rounded-lg shadow-neon-cyan flex items-center gap-1.5"
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

        {/* In-Graph Quick Live Search & Filter Tool */}
        {graphData && !isLoading && (
          <div className="flex items-center justify-between flex-wrap gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800 backdrop-blur-md">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Repositório Ativo:</span>
              <code className="text-cyan-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 font-mono">
                {graphData.repo} ({graphData.default_branch})
              </code>
            </div>

            {/* Filter Input */}
            <div className="relative flex items-center w-full sm:w-72">
              <Filter className="w-4 h-4 text-slate-400 absolute left-3" />
              <input
                type="text"
                value={filterTerm}
                onChange={(e) => setFilterTerm(e.target.value)}
                placeholder="Filtrar arquivos no grafo..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all font-mono"
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
          </div>
        )}

        {/* Graph Display Area + Sidebar */}
        <section className="flex-1 flex flex-col lg:flex-row gap-6 items-start min-h-[620px]">
          {/* Main Visualizer */}
          <div className="flex-1 w-full h-[650px] relative">
            {isLoading ? (
              <div className="w-full h-full rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col items-center justify-center space-y-4 shadow-2xl glass-panel">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin"></div>
                  <div className="absolute inset-2 rounded-full border-4 border-pink-500/20 border-t-pink-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-bold text-cyan-400">Reconstruindo Árvore do GitHub...</p>
                  <p className="text-xs text-slate-500">Mapeando hierarquia de pastas e arquivos</p>
                </div>
              </div>
            ) : graphData ? (
              viewMode === '3D' ? (
                <GraphViewer3D
                  graphData={graphData}
                  onNodeClick={(node) => setSelectedNode(node)}
                  filterTerm={filterTerm}
                />
              ) : (
                <GraphViewer2D
                  graphData={graphData}
                  onNodeClick={(node) => setSelectedNode(node)}
                  filterTerm={filterTerm}
                />
              )
            ) : (
              <div className="w-full h-full rounded-2xl bg-slate-950/60 border border-slate-800/80 flex flex-col items-center justify-center space-y-3 text-slate-500">
                <Box className="w-12 h-12 text-slate-700 stroke-1" />
                <p className="text-sm">Digite a URL de um repositório acima para visualizar a árvore em 3D.</p>
              </div>
            )}
          </div>

          {/* Sidebar Stats Panel */}
          {graphData && !isLoading && (
            <SidebarStats
              stats={graphData.stats}
              repoSlug={graphData.repo}
              stars={graphData.stars}
              isTruncated={graphData.is_truncated}
            />
          )}
        </section>

        {/* Clicked Node Info Drawer / Modal */}
        <NodeDetailsModal
          node={selectedNode}
          repoSlug={graphData?.repo}
          defaultBranch={graphData?.default_branch}
          onClose={() => setSelectedNode(null)}
        />
      </main>

      {/* GitHub Access Token Settings Modal */}
      <TokenModal
        isOpen={isTokenModalOpen}
        onClose={() => setIsTokenModalOpen(false)}
        onTokenUpdate={handleTokenUpdate}
      />
    </div>
  );
}
