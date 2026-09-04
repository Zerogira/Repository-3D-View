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
  // Separa as conexões entre pastas e arquivos
  const { folderLinks, filePositions, fileColors } = useMemo(() => {
    if (!nodes.length || !links.length) {
      return { folderLinks: [], filePositions: new Float32Array(0), fileColors: new Float32Array(0) };
    }

    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const folderList = [];
    const filePosList = [];
    const fileColList = [];
    const tempColor = new THREE.Color();

    links.forEach((link) => {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;

      const sourceNode = nodeMap.get(sourceId);
      const targetNode = nodeMap.get(targetId);

      if (sourceNode && targetNode) {
        const isTargetFile = targetNode.type !== 'dir' && !targetNode.isDir;

        if (isTargetFile) {
          filePosList.push(sourceNode.x || 0, sourceNode.y || 0, sourceNode.z || 0);
          filePosList.push(targetNode.x || 0, targetNode.y || 0, targetNode.z || 0);

          const colorHex = targetNode.branchColor || targetNode.color || '#38bdf8';
          tempColor.set(colorHex);
          fileColList.push(tempColor.r, tempColor.g, tempColor.b);
          fileColList.push(tempColor.r, tempColor.g, tempColor.b);
        } else {
          // Conexão Pasta -> Pasta
          const p1 = [sourceNode.x || 0, sourceNode.y || 0, sourceNode.z || 0];
          const p2 = [targetNode.x || 0, targetNode.y || 0, targetNode.z || 0];
          const color = targetNode.branchColor || targetNode.color || '#ffffff';
          folderList.push({
            id: `${sourceId}-${targetId}`,
            points: [p1, p2],
            color,
          });
        }
      }
    });

    return {
      folderLinks: folderList,
      filePositions: new Float32Array(filePosList),
      fileColors: new Float32Array(fileColList),
    };
  }, [nodes, links]);

  // Geometria para as conexões dos Pilares de Arquivos com Vertex Colors
  const fileGeometry = useMemo(() => {
    if (filePositions.length === 0) return null;
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(filePositions, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(fileColors, 3));
    return geom;
  }, [filePositions, fileColors]);

  return (
    <group>
      {/* 1. Conexões de Tronco / Ramos Principais (Fios laser ultrafinos e precisos) */}
      {folderLinks.map((fLink) => (
        <Line
          key={fLink.id}
          points={fLink.points}
          color={fLink.color}
          lineWidth={0.8}
          transparent
          opacity={0.55}
          depthWrite={false}
        />
      ))}

      {/* 2. Conexões dos Arquivos: Fios finos coloridos por vértice na paleta de cada galho */}
      {fileGeometry && (
        <lineSegments geometry={fileGeometry}>
          <lineBasicMaterial
            vertexColors={true}
            transparent={true}
            opacity={0.35}
            linewidth={1}
            depthWrite={false}
          />
        </lineSegments>
      )}
    </group>
  );
}
