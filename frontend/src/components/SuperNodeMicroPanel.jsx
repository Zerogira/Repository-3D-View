import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  X,
  Search,
  Folder,
  FileCode,
  FileText,
  FileJson,
  FileSpreadsheet,
  File,
  Layers,
  Sparkles,
  Database,
  Terminal,
  ExternalLink,
  ChevronRight,
  Info,
} from 'lucide-react';
import { useAppStore } from '../core/store';
import { CATEGORIES, getNodeCategoryAndColor } from '../core/layoutEngine';

/**
 * Retorna ícone e cor correspondente com base no nome/extensão do arquivo
 */
function getFileIcon(filename = '') {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.ts') || lower.endsWith('.tsx') || lower.endsWith('.js') || lower.endsWith('.jsx')) {
    return <FileCode className="w-4 h-4 text-cyan-400 shrink-0" />;
  }
  if (lower.endsWith('.json') || lower.endsWith('.yaml') || lower.endsWith('.yml')) {
    return <FileJson className="w-4 h-4 text-purple-400 shrink-0" />;
  }
  if (lower.endsWith('.md') || lower.endsWith('.txt') || lower.endsWith('.pdf')) {
    return <FileText className="w-4 h-4 text-slate-400 shrink-0" />;
  }
  if (lower.endsWith('.sql') || lower.endsWith('.db') || lower.endsWith('.prisma')) {
    return <Database className="w-4 h-4 text-amber-400 shrink-0" />;
  }
  if (lower.endsWith('.sh') || lower.endsWith('.bat') || lower.endsWith('.ps1')) {
    return <Terminal className="w-4 h-4 text-emerald-400 shrink-0" />;
  }
  if (lower.endsWith('.csv') || lower.endsWith('.xlsx')) {
    return <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />;
  }
  return <File className="w-4 h-4 text-pink-400 shrink-0" />;
}

/**
 * Formata bytes em string legível (B, KB, MB, GB)
 */
function formatBytes(bytes = 0) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * src/components/SuperNodeMicroPanel.jsx
 * 
 * Painel Lateral DOM de Micro-Navegação (Fase 1):
 * - Renderizado no DOM (fora do Canvas WebGL 3D, zero custo de draw calls na GPU)
 * - Virtualização obrigatória via @tanstack/react-virtual (apenas ~20 itens montados no DOM)
 * - Cabeçalho com estatísticas totais agregadas e micro-gráfico de extensões
 * - Busca e filtro instantâneo em tempo real
 * - Clique no arquivo conecta diretamente com o CodeViewerPanel
 */
export default function SuperNodeMicroPanel() {
  const isSuperNodePanelOpen = useAppStore((s) => s.isSuperNodePanelOpen);
  const activeSuperNode = useAppStore((s) => s.activeSuperNode);
  const closeSuperNodePanel = useAppStore((s) => s.closeSuperNodePanel);
  const setSelectedNode = useAppStore((s) => s.setSelectedNode);

  const [searchTerm, setSearchTerm] = useState('');
  const parentRef = useRef(null);

  // Lista de arquivos contidos no Super Nó
  const rawItems = useMemo(() => {
    if (!activeSuperNode) return [];
    if (Array.isArray(activeSuperNode.items) && activeSuperNode.items.length > 0) {
      return activeSuperNode.items;
    }
    // Fallback: se os arquivos estão em activeSuperNode.children ou se é um mock gerado
    if (Array.isArray(activeSuperNode.childrenFiles)) {
      return activeSuperNode.childrenFiles;
    }
    return [];
  }, [activeSuperNode]);

  // Filtro de busca na lista de arquivos
  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return rawItems;
    const term = searchTerm.toLowerCase().trim();
    return rawItems.filter(
      (item) =>
        (item.name && item.name.toLowerCase().includes(term)) ||
        (item.path && item.path.toLowerCase().includes(term))
    );
  }, [rawItems, searchTerm]);

  // Virtualizador do @tanstack/react-virtual
  // Altura fixa estimada de 52px por linha para cálculo ultra-rápido de viewport
  const rowVirtualizer = useVirtualizer({
    count: filteredItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 52,
    overscan: 12,
  });

  // Estatísticas calculadas de extensões e tamanho total
  const stats = useMemo(() => {
    if (!activeSuperNode) {
      return { totalFiles: 0, totalSize: 0, extensions: [] };
    }

    const totalFiles = activeSuperNode.fileCount || rawItems.length || 0;
    let totalSize = activeSuperNode.totalSize || 0;

    // Se já tiver extensionStats pré-calculadas
    if (Array.isArray(activeSuperNode.extensionStats) && activeSuperNode.extensionStats.length > 0) {
      return {
        totalFiles,
        totalSize,
        extensions: activeSuperNode.extensionStats,
      };
    }

    // Calcula a partir de rawItems se não estiverem pré-calculadas
    const extCounts = {};
    rawItems.forEach((item) => {
      const name = item.name || '';
      const dotIdx = name.lastIndexOf('.');
      const ext = dotIdx !== -1 ? name.slice(dotIdx).toLowerCase() : 'sem ext';
      extCounts[ext] = (extCounts[ext] || 0) + 1;
      if (!activeSuperNode.totalSize && item.size) {
        totalSize += item.size;
      }
    });

    const sorted = Object.entries(extCounts)
      .map(([ext, count]) => {
        const percentage = totalFiles > 0 ? Math.round((count / totalFiles) * 100) : 0;
        const catInfo = getNodeCategoryAndColor(ext, false);
        return {
          ext,
          count,
          percentage,
          color: catInfo.color || '#38bdf8',
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalFiles,
      totalSize,
      extensions: sorted,
    };
  }, [activeSuperNode, rawItems]);

  if (!isSuperNodePanelOpen || !activeSuperNode) {
    return null;
  }

  const superNodeName = activeSuperNode.name || activeSuperNode.id || 'Diretório Massivo';
  const superNodePath = activeSuperNode.path || activeSuperNode.id || '';

  return (
    <AnimatePresence>
      <motion.aside
        initial={{ x: '-100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '-100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 26, stiffness: 260 }}
        className="fixed top-0 left-0 h-screen w-[460px] max-w-[95vw] z-50 bg-[#060a12]/95 border-r border-amber-500/30 shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl flex flex-col text-slate-100 select-none"
      >
        {/* ========================================================================= */}
        {/* HEADER DO SUPER NÓ                                                       */}
        {/* ========================================================================= */}
        <div className="p-5 border-b border-slate-800/80 bg-gradient-to-b from-amber-950/20 to-transparent shrink-0">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-[10px] font-mono font-extrabold uppercase tracking-wider rounded-md border border-amber-500/50 bg-amber-500/10 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.25)] flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
                SUPER NÓ // MICRO-NAVEGAÇÃO
              </span>
            </div>

            <button
              onClick={closeSuperNodePanel}
              className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors border border-slate-800 cursor-pointer"
              title="Fechar painel (ESC)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2.5 mt-2">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
              <Folder className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold tracking-tight text-slate-100 truncate" title={superNodeName}>
                {superNodeName}
              </h2>
              <p className="text-xs font-mono text-slate-500 truncate" title={superNodePath}>
                {superNodePath || '/'}
              </p>
            </div>
          </div>

          {/* CARDS DE METADADOS TOTAIS */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800/80">
              <span className="text-[10px] font-mono uppercase text-slate-400 block mb-0.5">Total de Itens</span>
              <span className="text-base font-mono font-extrabold text-amber-300">
                {stats.totalFiles.toLocaleString('pt-BR')} <span className="text-xs font-normal text-slate-500">arquivos</span>
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800/80">
              <span className="text-[10px] font-mono uppercase text-slate-400 block mb-0.5">Volume Estimado</span>
              <span className="text-base font-mono font-extrabold text-cyan-300">
                {activeSuperNode.formattedSize || formatBytes(stats.totalSize)}
              </span>
            </div>
          </div>

          {/* MICRO-GRÁFICOS DE BARRA HORIZONTAL (EXTENSÕES) */}
          {stats.extensions.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-800/60">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1.5">
                <span>Distribuição por Extensão</span>
                <span className="text-slate-500">Top {stats.extensions.length}</span>
              </div>

              {/* Barra segmentada contínua */}
              <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden flex border border-slate-800/80">
                {stats.extensions.map((extItem, idx) => (
                  <div
                    key={idx}
                    style={{
                      width: `${Math.max(extItem.percentage, 3)}%`,
                      backgroundColor: extItem.color || '#38bdf8',
                    }}
                    title={`${extItem.ext}: ${extItem.count} (${extItem.percentage}%)`}
                    className="h-full transition-all duration-300 hover:brightness-125"
                  />
                ))}
              </div>

              {/* Legendas dos segmentos */}
              <div className="flex flex-wrap gap-2 mt-2">
                {stats.extensions.map((extItem, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] font-mono flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-900/90 border border-slate-800"
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: extItem.color || '#38bdf8' }}
                    />
                    <span className="text-slate-300 font-semibold">{extItem.ext}</span>
                    <span className="text-slate-500">{extItem.percentage}%</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* BARRA DE PESQUISA RÁPIDA                                                 */}
        {/* ========================================================================= */}
        <div className="p-3 border-b border-slate-800/80 bg-slate-950/60 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Filtrar ${stats.totalFiles.toLocaleString('pt-BR')} arquivos...`}
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-900/90 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40 transition-all font-mono"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between mt-2 px-1 text-[11px] font-mono text-slate-500">
            <span>
              Exibindo <strong className="text-amber-300 font-bold">{filteredItems.length}</strong> itens
            </span>
            {searchTerm && (
              <span className="text-[10px] text-amber-400/80">
                Filtro ativo: "{searchTerm}"
              </span>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* LISTA VIRTUALIZADA COM @tanstack/react-virtual (ALTURA FLEX-1 COM OVERFLOW) */}
        {/* ========================================================================= */}
        <div
          ref={parentRef}
          className="flex-1 w-full overflow-y-auto custom-scrollbar relative px-3 py-2"
          style={{ contain: 'strict' }}
        >
          {filteredItems.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-center space-y-2 text-slate-500">
              <Info className="w-6 h-6 text-slate-600" />
              <p className="text-xs">Nenhum arquivo encontrado para o filtro informado.</p>
            </div>
          ) : (
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const item = filteredItems[virtualRow.index];
                if (!item) return null;

                const itemName = item.name || item.path?.split('/').pop() || 'arquivo';
                const itemPath = item.path || '';

                return (
                  <div
                    key={virtualRow.key}
                    data-index={virtualRow.index}
                    ref={rowVirtualizer.measureElement}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                    className="py-1"
                  >
                    <div
                      onClick={() => setSelectedNode(item)}
                      className="group flex items-center justify-between p-2 rounded-xl bg-slate-900/40 hover:bg-slate-900 border border-slate-800/60 hover:border-amber-500/40 cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {getFileIcon(itemName)}
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-semibold text-slate-200 group-hover:text-amber-300 transition-colors truncate block">
                            {itemName}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 truncate block">
                            {itemPath}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        {item.size ? (
                          <span className="text-[10px] font-mono text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                            {formatBytes(item.size)}
                          </span>
                        ) : null}
                        <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* FOOTER INFORMATIVO                                                       */}
        {/* ========================================================================= */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/90 text-center shrink-0">
          <p className="text-[10px] font-mono text-slate-500 flex items-center justify-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Virtualização Ativa • Zero Custo GPU • 60 FPS Preservados
          </p>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}
