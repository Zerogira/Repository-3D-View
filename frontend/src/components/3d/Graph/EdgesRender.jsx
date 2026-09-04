import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Line } from '@react-three/drei';

/**
 * src/components/3d/Graph/EdgesRender.jsx
 * 
 * Renderizador híbrido de conexões 3D:
 * 1. Pasta -> Pasta: Conexões de infraestrutura via <Line> do @react-three/drei (MeshLine)
 *    com espessura real (lineWidth={3}), cor herdada da ramificação (branchColor) e brilho neon.
 * 2. Pasta -> Arquivo: Conexões em lote (BufferGeometry / lineSegments) com cores de vértice
 *    combinando perfeitamente com a cor do ramo para manter alta performance a 60 FPS.
 */
export default function EdgesRender({ nodes = [], links = [] }) {
  // Geometria Única Consolidada: Compila conexões de Troncos (Pastas) e Arquivos
  // em 1 Single Draw Call nativo via THREE.BufferGeometry + lineSegments
  const { geometry, hasLinks } = useMemo(() => {
    if (!nodes.length || !links.length) {
      return { geometry: null, hasLinks: false };
    }

    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const posList = [];
    const colList = [];
    const tempColor = new THREE.Color();

    links.forEach((link) => {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;

      const sNode = nodeMap.get(sourceId);
      const tNode = nodeMap.get(targetId);

      if (sNode && tNode) {
        // Pontos de início e fim
        posList.push(sNode.x || 0, sNode.y || 0, sNode.z || 0);
        posList.push(tNode.x || 0, tNode.y || 0, tNode.z || 0);

        // Cor temática herdada do ramo de destino ou do nó
        const colorHex = tNode.branchColor || tNode.color || '#38bdf8';
        tempColor.set(colorHex);

        colList.push(tempColor.r, tempColor.g, tempColor.b);
        colList.push(tempColor.r, tempColor.g, tempColor.b);
      }
    });

    if (posList.length === 0) return { geometry: null, hasLinks: false };

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(posList), 3));
    geom.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colList), 3));

    return { geometry: geom, hasLinks: true };
  }, [nodes, links]);

  if (!hasLinks || !geometry) return null;

  return (
    // 1 Single Draw Call para TODAS as conexões da galáxia (Troncos + Folhas)
    <lineSegments geometry={geometry}>
      <lineBasicMaterial
        vertexColors={true}
        transparent={true}
        opacity={0.45}
        linewidth={1}
        depthWrite={false}
      />
    </lineSegments>
  );
}
