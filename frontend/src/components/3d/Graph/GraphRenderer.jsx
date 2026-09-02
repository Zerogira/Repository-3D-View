import React from 'react';
import NodesRender from './NodesRender';
import EdgesRender from './EdgesRender';
import LabelsRender from './LabelsRender';
import { useAppStore } from '../../../core/store';

/**
 * src/components/3d/Graph/GraphRenderer.jsx
 * 
 * Componente orquestrador da camada de renderização dos atores 3D do Grafo:
 * - NodesRender: Desenha esferas/cubos via InstancedMesh (1-2 Draw Calls)
 * - EdgesRender: Desenha linhas via LineSegments + Float32Array (1 Draw Call) (showEdges)
 * - LabelsRender: Desenha textos WebGL com LOD nativo via GPU (showLabels)
 */
export default function GraphRenderer({ nodes = [], links = [] }) {
  const showEdges = useAppStore((s) => s.showEdges);
  const showLabels = useAppStore((s) => s.showLabels);

  return (
    <group>
      {/* 1. Conexões entre pastas e arquivos (Linhas) */}
      {showEdges && <EdgesRender nodes={nodes} links={links} />}

      {/* 2. Nós Geométricos (InstancedMesh) */}
      <NodesRender nodes={nodes} />

      {/* 3. Rótulos de Texto WebGL com LOD */}
      {showLabels && <LabelsRender nodes={nodes} />}
    </group>
  );
}
