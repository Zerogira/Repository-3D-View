import React, { useRef, useCallback, useState, useMemo, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { Camera, ZoomIn, ZoomOut } from 'lucide-react';
import SidebarFilterPanel from './SidebarFilterPanel';
import MiniMap from './MiniMap';
import { useAppStore } from '../core/store';
import { computeCylindricalLayout, computeSolarLayout, getNodeCategoryAndColor } from '../core/layoutEngine';

/**
 * src/components/GraphViewer2D.jsx
 * 
 * Visualizador 2D Modernizado (Alinhado com o Motor Matemático 3D):
 * - Utiliza os mesmos layouts matemáticos do 3D: Clássico (Árvore Hierárquica), Solar (Órbitas Polares) e Quantum (Física 2D).
 * - Totalmente reativo aos controles do Painel Lateral: Categorias Funcionais (Frontend, Backend, etc.),
 *   Linhas, Nomes das Pastas, Nomes dos Arquivos e Bolinhas dos Arquivos.
 * - Suporte nativo completo a Super Nós (diamantes holográficos âmbar com badge ⚡ e contagem de arquivos).
 * - Clique em nós: arquivos abrem o CodeViewerPanel à direita; pastas/Super Nós abrem o SuperNodeMicroPanel à esquerda.
 * - Minimapa Radar 2D sincronizado no canto inferior direito com navegação por clique e arrasto em tempo real.
 * - Zero lag: livre de shadowBlur, com halos vetoriais concêntricos ultraleves (60 FPS garantidos).
 */
export default function GraphViewer2D({ graphData, onNodeClick, filterTerm = '' }) {
  const fgRef = useRef();
  const containerRef = useRef(null);

  // Estados Globais do Zustand Store
  const layoutMode = useAppStore((s) => s.layoutMode);
  const activeCategories = useAppStore((s) => s.activeCategories);
  const showEdges = useAppStore((s) => s.showEdges);
  const showLabels = useAppStore((s) => s.showLabels);
  const showFolderLabels = useAppStore((s) => s.showFolderLabels);
  const showFileLabels = useAppStore((s) => s.showFileLabels);
  const showFileGeometry = useAppStore((s) => s.showFileGeometry);
  const selectedNode = useAppStore((s) => s.selectedNode);
  const setSelectedNode = useAppStore((s) => s.setSelectedNode);
  const hoveredNode = useAppStore((s) => s.hoveredNode);
  const setHoveredNode = useAppStore((s) => s.setHoveredNode);
  const openSuperNodePanel = useAppStore((s) => s.openSuperNodePanel);
  const setCameraView = useAppStore((s) => s.setCameraView);

  // 1. Cálculo Matemático da Base de Layout (Reutiliza os mesmos motores do 3D projetados em 2D)
  const baseLayout = useMemo(() => {
    if (!graphData || !Array.isArray(graphData.nodes) || graphData.nodes.length === 0) {
      return { nodes: [], links: [] };
    }

    const rawNodes = graphData.nodes;
    const rawLinks = graphData.links || graphData.hierarchyLinks || [];

    // Escolhe o motor matemático oficial
    let computed;
    if (layoutMode === 'classic') {
      computed = computeCylindricalLayout(rawNodes, rawLinks);
    } else {
      // 'solar' ou 'quantum'
      computed = computeSolarLayout(rawNodes, rawLinks);
    }

    const isQuantum = layoutMode === 'quantum';
    const computedNodes = computed.nodes || [];

    // Mapeia coordenadas 3D para o plano 2D (X, Y)
    const nodes2D = computedNodes.map((n) => {
      let x2D = 0;
      let y2D = 0;

      if (layoutMode === 'classic') {
        // No clássico, o topo é o nível 0 (raiz) e os galhos descem verticalmente
        x2D = typeof n.x === 'number' ? n.x : 0;
        y2D = typeof n.y === 'number' ? -((n.y - 200) * 0.9) : 0;
      } else {
        // No solar ou quantum, a visão superior (Top-Down) do disco cósmico usa X e Z
        x2D = typeof n.x === 'number' ? n.x : 0;
        y2D = typeof n.z === 'number' ? n.z : (typeof n.y === 'number' ? n.y : 0);
      }

      const isRoot = n.id === 'root' || n.depth === 0;

      return {
        ...n,
        x: x2D,
        y: y2D,
        // Nos modos matemáticos fixos (Solar e Clássico), fixa fx e fy para cravar posições com 0 CPU
        // No modo Quantum (Física), libera fx e fy (exceto raiz) para simulação física viva
        fx: isQuantum ? (isRoot ? 0 : undefined) : x2D,
        fy: isQuantum ? (isRoot ? 0 : undefined) : y2D,
      };
    });

    return {
      nodes: nodes2D,
      links: computed.links || [],
    };
  }, [graphData, layoutMode]);

  // Sincronização do Viewport da Câmera 2D com o Minimapa
  const updateCameraViewFromTransform = useCallback(
    (k) => {
      if (!fgRef.current || !containerRef.current) return;
      const width = containerRef.current.clientWidth || window.innerWidth;
      const height = containerRef.current.clientHeight || window.innerHeight;
      const center = fgRef.current.screen2GraphCoords(width / 2, height / 2);
      if (center && typeof center.x === 'number' && !isNaN(center.x)) {
        const zoomFactor = k || (fgRef.current.zoom ? fgRef.current.zoom() : 1);
        setCameraView({
          x: center.x,
          z: center.y, // No minimapa 2D, o eixo vertical Y é mapeado em Z
          dist: Math.max(width, height) / zoomFactor,
          viewWidth: width / zoomFactor,
          viewHeight: height / zoomFactor,
          is2D: true,
        });
      }
    },
    [setCameraView]
  );

  // Reaquecer simulação ou recentralizar ao alternar o layout
  useEffect(() => {
    if (fgRef.current) {
      if (layoutMode === 'quantum') {
        fgRef.current.d3ReheatSimulation();
      }
      const timer = setTimeout(() => {
        fgRef.current?.zoomToFit(800, 45);
        setTimeout(() => {
          if (fgRef.current) {
            updateCameraViewFromTransform(fgRef.current.zoom?.());
          }
        }, 850);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [layoutMode, updateCameraViewFromTransform]);

  // 2. Filtros Dinâmicos em Tempo Real (Categorias Funcionais, Bolinhas, Busca e Super Nós)
  const displayGraph = useMemo(() => {
    const rawNodes = baseLayout.nodes || [];
    const rawLinks = baseLayout.links || [];

    // A. Filtro por Categoria Funcional (sempre mantém o nó raiz)
    let filteredNodes = rawNodes;
    if (Array.isArray(activeCategories) && activeCategories.length < 5) {
      filteredNodes = filteredNodes.filter(
        (n) => n.id === 'root' || n.depth === 0 || activeCategories.includes(n.category)
      );
    }

    // B. Filtro de Geometria dos Arquivos (Toggle "Bolinhas dos Arquivos")
    if (!showFileGeometry) {
      filteredNodes = filteredNodes.filter((n) => n.isDir || n.isSuperNode || n.id === 'root');
    }

    // C. Filtro de Busca por Texto
    if (filterTerm && filterTerm.trim()) {
      const term = filterTerm.toLowerCase().trim();
      filteredNodes = filteredNodes.filter(
        (n) =>
          (n.name && n.name.toLowerCase().includes(term)) ||
          (n.id && n.id.toLowerCase().includes(term)) ||
          (n.path && n.path.toLowerCase().includes(term))
      );
    }

    const visibleNodeIds = new Set(filteredNodes.map((n) => n.id));

    // D. Filtro de Conexões (Linhas)
    const filteredLinks = rawLinks
      .map((l) => {
        const src = typeof l.source === 'object' ? l.source.id : l.source;
        const tgt = typeof l.target === 'object' ? l.target.id : l.target;
        return { source: src, target: tgt };
      })
      .filter((l) => visibleNodeIds.has(l.source) && visibleNodeIds.has(l.target));

    return {
      nodes: filteredNodes,
      links: filteredLinks,
    };
  }, [baseLayout, activeCategories, showFileGeometry, filterTerm]);

  // 3. Ações de Interação (Navegação sob Demanda e Master-Detail)
  const handleNodeClick = useCallback(
    (node) => {
      if (!node) return;

      const isFolder = node.isDir || node.type === 'dir' || node.type === 'folder';

      if (isFolder || node.isSuperNode) {
        // Centralização suave com zoom em pastas e Super Nós
        if (fgRef.current && typeof node.x === 'number' && typeof node.y === 'number') {
          fgRef.current.centerAt(node.x, node.y, 600);
          fgRef.current.zoom(2.0, 600);
        }

        // Abre o Drawer Lateral Esquerdo de Micro-Navegação (SuperNodeMicroPanel)
        let childFiles = node.items;
        if (!childFiles || childFiles.length === 0) {
          const folderPath = node.path || node.id || '';
          childFiles = (graphData?.nodes || []).filter((n) => {
            if (n.type === 'dir' || n.type === 'folder' || n.isDir) return false;
            return (
              n.parentId === node.id ||
              n.parent === node.id ||
              (n.path && n.path.startsWith(folderPath + '/'))
            );
          });
        }

        openSuperNodePanel({
          ...node,
          fileCount: node.fileCount || childFiles.length,
          items: childFiles,
        });
      } else {
        // ARQUIVO: Centralização suave e abertura imediata do CodeViewerPanel à direita
        if (fgRef.current && typeof node.x === 'number' && typeof node.y === 'number') {
          fgRef.current.centerAt(node.x, node.y, 500);
        }
        setSelectedNode(node);
      }

      if (onNodeClick) {
        onNodeClick(node);
      }
    },
    [graphData, openSuperNodePanel, setSelectedNode, onNodeClick]
  );

  // Ações de Zoom e Centralização
  const handleReset = useCallback(() => {
    if (fgRef.current) {
      fgRef.current.zoomToFit(800, 50);
    }
  }, []);

  const handleZoomIn = useCallback(() => {
    if (fgRef.current) {
      fgRef.current.zoom(fgRef.current.zoom() * 1.35, 350);
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (fgRef.current) {
      fgRef.current.zoom(fgRef.current.zoom() / 1.35, 350);
    }
  }, []);

  // 4. Renderização do Canvas 2D Otimizada (Zero shadowBlur)
  const drawNodeCanvas = useCallback(
    (node, ctx, globalScale) => {
      const isRoot = node.id === 'root' || node.depth === 0;
      const isSuperNode = node.isSuperNode;
      const isFolder = node.isDir || node.type === 'folder';

      const isSearchActive = Boolean(filterTerm && filterTerm.trim() !== '');
      const isMatched = isSearchActive
        ? (node.name && node.name.toLowerCase().includes(filterTerm.toLowerCase())) ||
          (node.path && node.path.toLowerCase().includes(filterTerm.toLowerCase()))
        : true;

      const isHovered = hoveredNode?.id === node.id;
      const isSelected = selectedNode?.id === node.id;

      ctx.save();

      // Opacidade baseada na busca
      if (isSearchActive && !isMatched) {
        ctx.globalAlpha = 0.12;
      } else {
        ctx.globalAlpha = 1.0;
      }

      const baseColor = isRoot ? '#facc15' : (isSuperNode ? '#f59e0b' : (node.color || '#38bdf8'));

      // A. DESENHO GEOMÉTRICO DO NÓ
      if (isSuperNode) {
        // SUPER NÓ: Diamante / Losango Holográfico Dourado com Aura Vetorial
        const radius = Math.min(18, 9 + Math.sqrt(node.fileCount || 10) * 1.3);

        // Halo vetorial concêntrico suave (sem shadowBlur)
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + 5, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(245, 158, 11, 0.22)';
        ctx.fill();

        // Diamante
        ctx.beginPath();
        ctx.moveTo(node.x, node.y - radius);
        ctx.lineTo(node.x + radius, node.y);
        ctx.lineTo(node.x, node.y + radius);
        ctx.lineTo(node.x - radius, node.y);
        ctx.closePath();

        ctx.fillStyle = '#f59e0b';
        ctx.fill();
        ctx.strokeStyle = isHovered || isSelected ? '#ffffff' : '#fef08a';
        ctx.lineWidth = isHovered || isSelected ? 3 : 1.8;
        ctx.stroke();

        // Núcleo brilhante
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius * 0.42, 0, 2 * Math.PI);
        ctx.fillStyle = '#fef3c7';
        ctx.fill();

      } else if (isFolder || isRoot) {
        // DIRETÓRIO REGULAR
        const radius = isRoot ? 14 : Math.min(13, 6 + Math.sqrt(node.fileCount || 2) * 1.1);

        if (isHovered || isSelected) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, radius + 4, 0, 2 * Math.PI);
          ctx.fillStyle = 'rgba(56, 189, 248, 0.28)';
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = baseColor;
        ctx.fill();
        ctx.strokeStyle = isHovered || isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.55)';
        ctx.lineWidth = isHovered || isSelected ? 2.5 : 1.2;
        ctx.stroke();

      } else {
        // ARQUIVO REGULAR
        const radius = Math.max(2.5, Math.min(5.5, (node.val || 4) * 0.6));

        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = baseColor;
        ctx.fill();

        if (isHovered || isSelected) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }

      // B. RÓTULOS DE TEXTO (LOD - Level of Detail)
      const shouldShowLabel =
        (showLabels && isSuperNode) ||
        (showLabels && showFolderLabels && (isFolder || isRoot)) ||
        (showLabels && showFileLabels && !isFolder && (globalScale > 1.3 || isHovered || (isSearchActive && isMatched)));

      if (shouldShowLabel) {
        const name = node.name || node.id || '';
        let labelText = name;
        if (isSuperNode) {
          labelText = `⚡ ${name} (${node.fileCount || 0})`;
        } else if (isFolder && !isRoot) {
          labelText = `📁 ${name}`;
        }

        const fontSize = isSuperNode 
          ? Math.max(10, Math.min(14, 11 / Math.sqrt(globalScale)))
          : Math.max(8, Math.min(12, 10 / Math.sqrt(globalScale)));

        ctx.font = `600 ${fontSize}px "Outfit", system-ui, -apple-system, sans-serif`;
        const textMetrics = ctx.measureText(labelText);
        const textWidth = textMetrics.width;
        const textHeight = fontSize * 1.2;
        const paddingX = 6;
        const paddingY = 3;

        const badgeY = node.y + (isSuperNode ? 18 : (isFolder ? 14 : 6));
        const badgeX = node.x - textWidth / 2 - paddingX;
        const badgeW = textWidth + paddingX * 2;
        const badgeH = textHeight + paddingY * 2;

        // Fundo estilo Badge / Pílula
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 4);
        } else {
          ctx.rect(badgeX, badgeY, badgeW, badgeH);
        }
        ctx.fillStyle = isSuperNode ? 'rgba(20, 14, 4, 0.92)' : 'rgba(7, 10, 18, 0.88)';
        ctx.fill();
        ctx.strokeStyle = isSuperNode ? '#f59e0b' : (isHovered ? '#ffffff' : 'rgba(148, 163, 184, 0.3)');
        ctx.lineWidth = isSuperNode ? 1.2 : 0.8;
        ctx.stroke();

        // Texto com alto contraste
        ctx.fillStyle = isSuperNode ? '#fbbf24' : (isHovered || isSelected ? '#ffffff' : '#f1f5f9');
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(labelText, node.x, badgeY + badgeH / 2);
      }

      ctx.restore();
    },
    [filterTerm, hoveredNode, selectedNode, showLabels, showFolderLabels, showFileLabels]
  );

  // Pintura da Área de Clique para Hit-Testing Preciso (Independente de Zoom)
  const drawNodePointerArea = useCallback((node, color, ctx, globalScale) => {
    const isSuperNode = node.isSuperNode;
    const isFolder = node.isDir || node.type === 'folder' || node.type === 'dir';
    const scale = globalScale || 1;
    // Garante um raio de clique mínimo na tela de pelo menos 16 a 24 pixels reais
    const minScreenRadius = isSuperNode ? 24 : (isFolder ? 20 : 16);
    const hitRadius = Math.max(minScreenRadius / scale, isSuperNode ? 22 : (isFolder ? 16 : 10));

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(node.x, node.y, hitRadius, 0, 2 * Math.PI);
    ctx.fill();
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[600px] overflow-hidden bg-[#070a12] select-none">
      {/* 1. Painel de Controle e Filtros Lateral Esquerdo (Contextual 2D) */}
      <SidebarFilterPanel
        nodeCount={displayGraph.nodes.length}
        nodes={baseLayout.nodes}
        is2D={true}
      />

      {/* 2. Grafo 2D Canvas Otimizado */}
      <ForceGraph2D
        ref={fgRef}
        graphData={displayGraph}
        nodeCanvasObject={drawNodeCanvas}
        nodePointerAreaPaint={drawNodePointerArea}
        enableNodeDrag={false}
        onNodeClick={handleNodeClick}
        onNodeHover={(node) => {
          document.body.style.cursor = node ? 'pointer' : 'default';
          setHoveredNode(node || null);
        }}
        onZoom={(transform) => {
          updateCameraViewFromTransform(transform?.k);
        }}
        linkColor={() => (showEdges ? 'rgba(71, 85, 105, 0.45)' : 'rgba(0, 0, 0, 0)')}
        linkWidth={1}
        linkDirectionalParticles={0}
        warmupTicks={layoutMode === 'quantum' ? 60 : 0}
        cooldownTicks={layoutMode === 'quantum' ? 100 : 0}
        backgroundColor="#070a12"
      />

      {/* 3. Barra de Ferramentas Flutuante 2D (Glassmorphism no Canto Inferior Esquerdo) */}
      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-1.5 p-1.5 bg-slate-950/90 border border-slate-800/90 rounded-2xl shadow-2xl backdrop-blur-xl pointer-events-auto">
        {/* Zoom In */}
        <button
          onClick={handleZoomIn}
          className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 border border-slate-800/80 transition-all cursor-pointer"
          title="Aproximar Zoom (+)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        {/* Zoom Out */}
        <button
          onClick={handleZoomOut}
          className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 border border-slate-800/80 transition-all cursor-pointer"
          title="Afastar Zoom (-)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        {/* Centralizar / Fit View */}
        <button
          onClick={handleReset}
          className="px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-cyan-300 border border-slate-800/80 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          title="Ajustar ao Centro da Tela"
        >
          <Camera className="w-4 h-4 text-cyan-400" />
          <span>Centralizar</span>
        </button>

        {/* Badge Informativo de Nós Visíveis */}
        <div className="px-2.5 py-1 bg-slate-900/90 border border-slate-800 rounded-lg text-[11px] font-mono text-cyan-400 font-bold ml-1">
          {displayGraph.nodes.length} nós 2D
        </div>
      </div>

      {/* 4. MiniMapa Tático Flutuante no Canto Inferior Direito */}
      <div className="absolute bottom-4 right-4 z-20 pointer-events-auto">
        <MiniMap
          nodes={displayGraph.nodes}
          links={displayGraph.links}
          onPanTo={(x, y) => {
            if (fgRef.current) {
              fgRef.current.centerAt(x, y, 0);
            }
            if (containerRef.current) {
              const width = containerRef.current.clientWidth || window.innerWidth;
              const height = containerRef.current.clientHeight || window.innerHeight;
              const k = fgRef.current?.zoom ? fgRef.current.zoom() : 1;
              setCameraView({
                x,
                z: y,
                dist: Math.max(width, height) / (k || 1),
                viewWidth: width / (k || 1),
                viewHeight: height / (k || 1),
                is2D: true,
              });
            }
          }}
        />
      </div>
    </div>
  );
}
