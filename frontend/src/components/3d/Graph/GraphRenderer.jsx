import React from 'react';
import NodesRender from './NodesRender';
import EdgesRender from './EdgesRender';
import LabelsRender from './LabelsRender';
import OrbitRingsRender from './OrbitRingsRender';
import { useAppStore } from '../../../core/store';

/**
 * src/components/3d/Graph/GraphRenderer.jsx
 * 
 * Componente orquestrador da camada de renderização dos atores 3D do Grafo:
 * - NodesRender: Desenha esferas/planetas via InstancedMesh com interpolação suave (1-2 Draw Calls)
 * - EdgesRender: Desenha linhas de conexões via LineSegments (1 Draw Call)
 * - OrbitRingsRender: Desenha anéis e trajetórias de órbitas quando no modo 'universe'
 * - LabelsRender: Desenha textos WebGL com LOD nativo via GPU
 */
export default function GraphRenderer({ nodes = [], links = [], orbitRings = [] }) {
  const showEdges = useAppStore((s) => s.showEdges);
  const showLabels = useAppStore((s) => s.showLabels);
  const showFolderLabels = useAppStore((s) => s.showFolderLabels);
  const showFileLabels = useAppStore((s) => s.showFileLabels);
  const layoutMode = useAppStore((s) => s.layoutMode);

  const hasAnyLabelActive = showLabels && (showFolderLabels || showFileLabels);

  return (
    <group>
      {/* 1. Anéis de Órbitas Planetárias (Modo Universe sincronizado com nós pais) */}
      {layoutMode === 'universe' && <OrbitRingsRender rings={orbitRings} nodes={nodes} />}

      {/* 2. Conexões entre pastas e arquivos (Linhas) */}
      {showEdges && <EdgesRender nodes={nodes} links={links} />}

      {/* 3. Nós Geométricos (InstancedMesh com voo/interpolação suave entre layouts) */}
      <NodesRender nodes={nodes} />

      {/* 4. Rótulos de Texto WebGL com LOD */}
      {hasAnyLabelActive && <LabelsRender nodes={nodes} />}
    </group>
  );
}
