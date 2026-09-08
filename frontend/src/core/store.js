import { create } from 'zustand';

const ALL_CATEGORIES = ['FRONTEND', 'BACKEND', 'DATABASE', 'CONFIG', 'DOCS'];

/**
 * src/core/store.js
 * 
 * Estado global estático do GitTree Visualizer via Zustand.
 * Gerencia filtros por categoria funcional, seleções e toggles de recursos 3D.
 */
export const useAppStore = create((set) => ({
  // Filtros e busca por texto
  filterTerm: '',
  setFilterTerm: (term) => set({ filterTerm: term }),

  // Categorias funcionais ativas
  activeCategories: ALL_CATEGORIES,
  toggleCategory: (cat) =>
    set((state) => {
      const exists = state.activeCategories.includes(cat);
      const next = exists
        ? state.activeCategories.filter((c) => c !== cat)
        : [...state.activeCategories, cat];
      return { activeCategories: next };
    }),
  selectAllCategories: () => set({ activeCategories: ALL_CATEGORIES }),
  clearAllCategories: () => set({ activeCategories: [] }),

  // Nó selecionado no grafo
  selectedNode: null,
  setSelectedNode: (node) =>
    set((state) => {
      // Se selecionou uma pasta/diretório, automaticamente ativa ela como pasta em foco
      const isDir = node && (node.type === 'dir' || node.isDir);
      return {
        selectedNode: node,
        focusedFolder: isDir ? node : (node ? state.focusedFolder : null),
      };
    }),

  // Pasta em foco (Modo Foco: exibe apenas os rótulos de arquivos desta pasta)
  focusedFolder: null,
  setFocusedFolder: (folder) => set({ focusedFolder: folder }),

  // Nó em hover no grafo (reação física de escala e glow)
  hoveredNode: null,
  setHoveredNode: (node) => set({ hoveredNode: node }),

  // Estado da Barra Lateral (inicia aberta por padrão)
  isSidebarOpen: true,
  setIsSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  // Predefinição de Layout 3D Oficial ('classic' | 'solar' | 'quantum')
  layoutMode: 'classic',
  setLayoutMode: (mode) => set({ 
    layoutMode: mode, 
    activeLayout: mode,
    usePhysicsEngine: mode === 'quantum',
  }),
  // Aliases de compatibilidade
  activeLayout: 'classic',
  setActiveLayout: (mode) => set({ 
    layoutMode: mode, 
    activeLayout: mode,
    usePhysicsEngine: mode === 'quantum',
  }),

  // Compatibilidade legada para toggle (se acionado, alterna entre 'quantum' e 'classic')
  usePhysicsEngine: false,
  setUsePhysicsEngine: (status) => set({ 
    usePhysicsEngine: status, 
    layoutMode: status ? 'quantum' : 'classic',
    activeLayout: status ? 'quantum' : 'classic',
  }),
  toggleUsePhysicsEngine: () => set((state) => {
    const nextStatus = !state.usePhysicsEngine;
    return {
      usePhysicsEngine: nextStatus,
      layoutMode: nextStatus ? 'quantum' : 'classic',
      activeLayout: nextStatus ? 'quantum' : 'classic',
    };
  }),

  // Toggles de Recursos Visuais 3D
  showEdges: true,
  setShowEdges: (show) => set({ showEdges: show }),
  toggleShowEdges: () => set((state) => ({ showEdges: !state.showEdges })),

  showLabels: true,
  setShowLabels: (show) => set({ showLabels: show }),
  toggleShowLabels: () => set((state) => ({ showLabels: !state.showLabels })),

  showFolderLabels: true,
  setShowFolderLabels: (show) => set({ showFolderLabels: show }),
  toggleShowFolderLabels: () => set((state) => ({ showFolderLabels: !state.showFolderLabels })),

  showFileLabels: true,
  setShowFileLabels: (show) => set({ showFileLabels: show }),
  toggleShowFileLabels: () => set((state) => ({ showFileLabels: !state.showFileLabels })),

  showFileGeometry: true,
  setShowFileGeometry: (show) => set({ showFileGeometry: show }),
  toggleShowFileGeometry: () => set((state) => ({ showFileGeometry: !state.showFileGeometry })),

  showGizmo: true,
  setShowGizmo: (show) => set({ showGizmo: show }),
  toggleShowGizmo: () => set((state) => ({ showGizmo: !state.showGizmo })),

  showStats: true,
  setShowStats: (show) => set({ showStats: show }),
  toggleShowStats: () => set((state) => ({ showStats: !state.showStats })),

  // Estatísticas de performance em texto (FPS, MS, MB)
  perfStats: { fps: 60, ms: '16.6', memoryMb: null },
  setPerfStats: (stats) => set({ perfStats: stats }),

  showGrid: true,
  setShowGrid: (show) => set({ showGrid: show }),
  toggleShowGrid: () => set((state) => ({ showGrid: !state.showGrid })),

  // Auto Rotação da Cena 3D / Grid
  autoRotate: true,
  setAutoRotate: (auto) => set({ autoRotate: auto }),
  toggleAutoRotate: () => set((state) => ({ autoRotate: !state.autoRotate })),

  // Estado de Navegação/Interação da Câmera (Hide-on-Pan para 60 FPS amanteigados)
  isMovingCamera: false,
  setIsMovingCamera: (isMoving) => set({ isMovingCamera: isMoving }),

  // Target Dinâmico da Câmera 3D (Sincronizado com o Minimapa Interativo e Seleção de Nós)
  cameraTarget: { x: 0, y: 0, z: 0 },
  setCameraTarget: (target) => set({ cameraTarget: target }),

  // Posição Atual da Câmera (para renderizar o retângulo de viewport no Minimapa)
  cameraView: { x: 0, z: 0, zoom: 1 },
  setCameraView: (view) => set({ cameraView: view }),

  // Estado do Web Worker / Carregamento do Grafo
  isLoadingGraph: false,
  setIsLoadingGraph: (isLoading) => set({ isLoadingGraph: isLoading }),

  workerStatus: 'IDLE',
  setWorkerStatus: (status) => set({ workerStatus: status }),

  workerError: null,
  setWorkerError: (error) => set({ workerError: error }),
}));
