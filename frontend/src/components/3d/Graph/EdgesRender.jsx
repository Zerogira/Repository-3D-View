import React, { useMemo } from 'react';
import * as THREE from 'three';

/**
 * src/components/3d/Graph/EdgesRender.jsx
 * 
 * Renderizador de conexões 3D em 1 Single Draw Call para a GPU.
 * Compila todas as linhas de ligação em um único Float32Array + THREE.BufferGeometry e renderiza via <lineSegments>.
 */
export default function EdgesRender({ nodes = [], links = [] }) {
  // Separa as posições das conexões: Pasta -> Pasta vs Pasta -> Arquivo (Pilar)
  const { folderPositions, filePositions } = useMemo(() => {
    if (!nodes.length || !links.length) {
      return { folderPositions: new Float32Array(0), filePositions: new Float32Array(0) };
    }

    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const folderPosList = [];
    const filePosList = [];

    links.forEach((link) => {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;

      const sourceNode = nodeMap.get(sourceId);
      const targetNode = nodeMap.get(targetId);

      if (sourceNode && targetNode) {
        const isTargetFile = targetNode.type !== 'dir' && !targetNode.isDir;
        const targetList = isTargetFile ? filePosList : folderPosList;

        targetList.push(sourceNode.x || 0, sourceNode.y || 0, sourceNode.z || 0);
        targetList.push(targetNode.x || 0, targetNode.y || 0, targetNode.z || 0);
      }
    });

    return {
      folderPositions: new Float32Array(folderPosList),
      filePositions: new Float32Array(filePosList),
    };
  }, [nodes, links]);

  // Geometria para as conexões entre Pastas (Ciano Brilhante)
  const folderGeometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(folderPositions, 3));
    return geom;
  }, [folderPositions]);

  // Geometria para as conexões dos Pilares de Arquivos (Cinza/Rosa Translúcido Sutil)
  const fileGeometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(filePositions, 3));
    return geom;
  }, [filePositions]);

  return (
    <group>
      {/* 1. Conexões de Infraestrutura: Pasta -> Pasta (Fios de Luz Brancos Translúcidos 0.35) */}
      {folderPositions.length > 0 && (
        <lineSegments geometry={folderGeometry}>
          <lineBasicMaterial
            color="#ffffff"
            transparent={true}
            opacity={0.35}
            linewidth={1.5}
            depthWrite={false}
          />
        </lineSegments>
      )}

      {/* 2. Conexões dos Pilares: Pasta -> Arquivo (Fios de Luz Brancos Sutis 0.22) */}
      {filePositions.length > 0 && (
        <lineSegments geometry={fileGeometry}>
          <lineBasicMaterial
            color="#ffffff"
            transparent={true}
            opacity={0.22}
            linewidth={1}
            depthWrite={false}
          />
        </lineSegments>
      )}
    </group>
  );
}
