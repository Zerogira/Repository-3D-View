import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Canvas } from '@react-three/fiber';
import { Maximize2, Minimize2 } from 'lucide-react';
import SceneSetup from './3d/Environment/SceneSetup';
import GraphRenderer from './3d/Graph/GraphRenderer';
import SidebarFilterPanel from './SidebarFilterPanel';
import MiniMap from './MiniMap';
import { useAppStore } from '../core/store';
import { computeCylindricalLayout } from '../core/layoutEngine';

/**
 * src/components/GraphViewer3D.jsx
 * 
 * Componente principal do Visualizador 3D do GitTree:
 * - Painel de Controle e Filtros Lateral Esquerdo Retrátil (SidebarFilterPanel)
 * - Minimapa Tático 2D integrado no canto inferior esquerdo
 * - Suporte a Tela Cheia Absoluta via React Portal (createPortal em document.body)
 * - Processa a matemática no Web Worker em background (Anti-Freeze UI)
 * - Palco 3D R3F (SceneSetup: Luzes, OrbitControls com trava de chão, Bússola Gizmo e Stats)
 * - Atores 3D (GraphRenderer: NodesRender InstancedMesh, EdgesRender Single Draw Call, LabelsRender WebGL Canvas Cards)
 */
export default function GraphViewer3D({
  graphData,
  onNodeClick,
  filterTerm = '',
  isFullScreen = false,
  onToggleFullScreen,
}) {
  const [calculatedData, setCalculatedData] = useState({ nodes: [], links: [] });
  const [isProcessingLayout, setIsProcessingLayout] = useState(false);
  const [workerError, setWorkerError] = useState(null);

  const activeCategories = useAppStore((s) => s.activeCategories);
  const setSelectedNode = useAppStore((s) => s.setSelectedNode);
  const workerRef = useRef(null);

  // Instanciação e controle do Web Worker
  useEffect(() => {
    if (!graphData || !Array.isArray(graphData.nodes) || graphData.nodes.length === 0) {
      setCalculatedData({ nodes: [], links: [] });
      return;
    }

    setIsProcessingLayout(true);
    setWorkerError(null);

    try {
      const worker = new Worker(
        new URL('../core/layout.worker.js', import.meta.url),
        { type: 'module' }
      );
      workerRef.current = worker;

      worker.onmessage = (e) => {
        const { type, payload, error } = e.data || {};
        if (type === 'SUCCESS' && payload) {
          setCalculatedData(payload);
        } else if (type === 'ERROR') {
          console.warn('Web Worker reportou erro, fallback para Main Thread:', error);
          const fallbackData = computeCylindricalLayout(graphData.nodes, graphData.links || []);
          setCalculatedData(fallbackData);
        }
        setIsProcessingLayout(false);
      };

      worker.onerror = (err) => {
        console.warn('Erro no Web Worker, fallback para Main Thread:', err);
        const fallbackData = computeCylindricalLayout(graphData.nodes, graphData.links || []);
        setCalculatedData(fallbackData);
        setIsProcessingLayout(false);
      };

      worker.postMessage({
        nodes: graphData.nodes,
        links: graphData.links || graphData.hierarchyLinks || [],
      });

      return () => {
        worker.terminate();
      };
    } catch (err) {
      console.warn('Falha ao criar Web Worker, executando na Main Thread:', err);
      const fallbackData = computeCylindricalLayout(graphData.nodes, graphData.links || []);
      setCalculatedData(fallbackData);
      setIsProcessingLayout(false);
    }
  }, [graphData]);

  // Tecla ESC para sair do modo Tela Cheia
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFullScreen && onToggleFullScreen) {
        onToggleFullScreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreen, onToggleFullScreen]);

  // Filtro de Busca em Tempo Real e Categorias Funcionais
  const filteredNodes = useMemo(() => {
    let result = calculatedData.nodes;

    // Filtro por Categoria Funcional (mantém nó raiz sempre visível)
    if (Array.isArray(activeCategories) && activeCategories.length < 5) {
      result = result.filter(
        (n) => n.id === 'root' || n.depth === 0 || activeCategories.includes(n.category)
      );
    }

    // Filtro de Busca por Texto
    if (filterTerm && filterTerm.trim()) {
      const term = filterTerm.toLowerCase().trim();
      result = result.filter(
        (n) =>
          (n.name && n.name.toLowerCase().includes(term)) ||
          (n.id && n.id.toLowerCase().includes(term)) ||
          (n.path && n.path.toLowerCase().includes(term))
      );
    }

    return result;
  }, [calculatedData.nodes, filterTerm, activeCategories]);

  // Conteúdo Principal da Viewport 3D
  const content = (
    <div
      className={`w-full h-full bg-[#070a12] flex flex-col ${
        isFullScreen
          ? 'fixed inset-0 z-[99999] w-screen h-screen overflow-hidden'
          : 'relative overflow-hidden rounded-2xl border border-slate-800'
      }`}
    >
      {/* Painel de Controle e Filtros Lateral Esquerdo Retrátil */}
      <SidebarFilterPanel nodeCount={filteredNodes.length} nodes={calculatedData.nodes} />

      {/* Botões de Ação no Topo Direito (Full Screen Toggle) */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        {onToggleFullScreen && (
          <button
            onClick={onToggleFullScreen}
            className="p-2.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-xl transition-all shadow-xl backdrop-blur-md cursor-pointer flex items-center gap-2 text-xs font-bold"
            title={isFullScreen ? 'Sair da Tela Cheia (ESC)' : 'Modo Galaxy Tela Cheia'}
          >
            {isFullScreen ? (
              <>
                <Minimize2 className="w-4 h-4 text-pink-400" />
                <span>Sair da Tela Cheia</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-4 h-4 text-cyan-400" />
                <span>Tela Cheia</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Overlay de Processamento do Web Worker */}
      {isProcessingLayout ? (
        <div className="absolute inset-0 z-30 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center space-y-4">
          <div className="relative w-14 h-14">
            <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin"></div>
            <div
              className="absolute inset-2 rounded-full border-4 border-pink-500/20 border-t-pink-500 animate-spin"
              style={{ animationDirection: 'reverse', animationDuration: '1.2s' }}
            ></div>
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-bold text-cyan-400">Calculando Nebulosa Orgânica no Web Worker...</p>
            <p className="text-xs text-slate-500">Mapeando setores e pesos de diretórios</p>
          </div>
        </div>
      ) : null}

      {/* Canvas Principal do React Three Fiber */}
      <div className="w-full h-full">
        <Canvas
          shadows
          camera={{ position: [0, 220, 450], fov: 50, near: 1, far: 3500 }}
          gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
          onCreated={({ gl }) => {
            gl.setClearColor('#070a12');
          }}
        >
          {/* Palco 3D Dinâmico: Luzes, OrbitControls (com trava proporcional), Bússola e Stats */}
          <SceneSetup
            minY={calculatedData.layoutInfo?.minY || 0}
            gridRadius={calculatedData.layoutInfo?.gridRadius || 600}
            fogStart={calculatedData.layoutInfo?.fogStart || 300}
            fogEnd={calculatedData.layoutInfo?.fogEnd || 700}
            maxCameraDistance={calculatedData.layoutInfo?.maxCameraDistance || 650}
          />

          {/* Atores 3D: GraphRenderer com InstancedMesh, LineSegments 1 Draw Call e WebGL Text LOD */}
          <GraphRenderer nodes={filteredNodes} links={calculatedData.links} />
        </Canvas>
      </div>

      {/* MiniMapa Tático Flutuante no Canto Inferior Esquerdo */}
      <div className="absolute bottom-4 left-4 z-20">
        <MiniMap nodes={filteredNodes} links={calculatedData.links} />
      </div>
    </div>
  );

  if (isFullScreen) {
    return createPortal(content, document.body);
  }

  return content;
}
