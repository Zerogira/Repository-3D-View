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
  setSelectedNode: (node) => set({ selectedNode: node }),

  // Estado da Barra Lateral (inicia aberta por padrão)
  isSidebarOpen: true,
  setIsSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  // Toggles de Recursos Visuais 3D
  showEdges: true,
  setShowEdges: (show) => set({ showEdges: show }),
  toggleShowEdges: () => set((state) => ({ showEdges: !state.showEdges })),

  showLabels: true,
  setShowLabels: (show) => set({ showLabels: show }),
  toggleShowLabels: () => set((state) => ({ showLabels: !state.showLabels })),

  showGizmo: true,
  setShowGizmo: (show) => set({ showGizmo: show }),
  toggleShowGizmo: () => set((state) => ({ showGizmo: !state.showGizmo })),

  showStats: true,
  setShowStats: (show) => set({ showStats: show }),
  toggleShowStats: () => set((state) => ({ showStats: !state.showStats })),

  showGrid: true,
  setShowGrid: (show) => set({ showGrid: show }),
  toggleShowGrid: () => set((state) => ({ showGrid: !state.showGrid })),

  // Estado do Web Worker / Carregamento do Grafo
  isLoadingGraph: false,
  setIsLoadingGraph: (isLoading) => set({ isLoadingGraph: isLoading }),

  workerStatus: 'IDLE',
  setWorkerStatus: (status) => set({ workerStatus: status }),

  workerError: null,
  setWorkerError: (error) => set({ workerError: error }),
}));
