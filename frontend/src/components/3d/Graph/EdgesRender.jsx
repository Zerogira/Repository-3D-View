import React, { useMemo } from 'react';
import * as THREE from 'three';

/**
 * src/components/3d/Graph/EdgesRender.jsx
 * 
 * Renderizador de conexões 3D em 1 Single Draw Call para a GPU.
 * Compila todas as linhas de ligação em um único Float32Array + THREE.BufferGeometry e renderiza via <lineSegments>.
 */
export default function EdgesRender({ nodes = [], links = [] }) {
  // Mapeamento rápido de ID para Nó com Posições
  const { positions, lineCount } = useMemo(() => {
    if (!nodes.length || !links.length) {
      return { positions: new Float32Array(0), lineCount: 0 };
    }

    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const validPositions = [];

    links.forEach((link) => {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;

      const sourceNode = nodeMap.get(sourceId);
      const targetNode = nodeMap.get(targetId);

      if (sourceNode && targetNode) {
        // Ponto de início (Pai)
        validPositions.push(sourceNode.x || 0, sourceNode.y || 0, sourceNode.z || 0);
        // Ponto de fim (Filho)
        validPositions.push(targetNode.x || 0, targetNode.y || 0, targetNode.z || 0);
      }
    });

    return {
      positions: new Float32Array(validPositions),
      lineCount: validPositions.length / 6,
    };
  }, [nodes, links]);

  // Cria a geometria do Three.js contendo todos os segmentos de linha unificados
  const geometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geom;
  }, [positions]);

  if (lineCount === 0) return null;

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial
        color="#38bdf8"
        transparent
        opacity={0.35}
        linewidth={1}
        depthWrite={false}
      />
    </lineSegments>
  );
}
