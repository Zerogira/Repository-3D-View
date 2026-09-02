import React, { useRef, useLayoutEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useAppStore } from '../../../core/store';

const tempObject = new THREE.Object3D();
const tempColor = new THREE.Color();

/**
 * src/components/3d/Graph/NodesRender.jsx
 * 
 * Renderizador de nós 3D via InstancedMesh com efeito de brilho emissivo (Tree of Knowledge spec).
 */
export default function NodesRender({ nodes = [] }) {
  const setSelectedNode = useAppStore((s) => s.setSelectedNode);

  // Separa nós por tipo (diretórios vs arquivos)
  const dirNodes = useMemo(() => nodes.filter((n) => n.type === 'dir' || n.isDir), [nodes]);
  const fileNodes = useMemo(() => nodes.filter((n) => n.type !== 'dir' && !n.isDir), [nodes]);

  const dirMeshRef = useRef();
  const fileMeshRef = useRef();

  useLayoutEffect(() => {
    // 1. Atualiza Instâncias de Diretórios (Pastas = Cubos Neon Ciano)
    if (dirMeshRef.current && dirNodes.length > 0) {
      dirNodes.forEach((node, i) => {
        const scale = 3.2 + (Math.max(0, 5 - (node.depth || 0)) * 0.4);
        tempObject.position.set(node.x || 0, node.y || 0, node.z || 0);
        tempObject.scale.set(scale, scale, scale);
        tempObject.updateMatrix();

        dirMeshRef.current.setMatrixAt(i, tempObject.matrix);
        tempColor.set(node.color || '#22d3ee');
        dirMeshRef.current.setColorAt(i, tempColor);
      });
      dirMeshRef.current.instanceMatrix.needsUpdate = true;
      if (dirMeshRef.current.instanceColor) dirMeshRef.current.instanceColor.needsUpdate = true;
    }

    // 2. Atualiza Instâncias de Arquivos (Esferas Neon com Brilho Intensificado)
    if (fileMeshRef.current && fileNodes.length > 0) {
      fileNodes.forEach((node, i) => {
        const scale = 2.2;
        tempObject.position.set(node.x || 0, node.y || 0, node.z || 0);
        tempObject.scale.set(scale, scale, scale);
        tempObject.updateMatrix();

        fileMeshRef.current.setMatrixAt(i, tempObject.matrix);
        tempColor.set(node.color || '#f472b6');
        fileMeshRef.current.setColorAt(i, tempColor);
      });
      fileMeshRef.current.instanceMatrix.needsUpdate = true;
      if (fileMeshRef.current.instanceColor) fileMeshRef.current.instanceColor.needsUpdate = true;
    }
  }, [dirNodes, fileNodes]);

  const handleDirClick = (e) => {
    e.stopPropagation();
    if (e.instanceId !== undefined && dirNodes[e.instanceId]) {
      setSelectedNode(dirNodes[e.instanceId]);
    }
  };

  const handleFileClick = (e) => {
    e.stopPropagation();
    if (e.instanceId !== undefined && fileNodes[e.instanceId]) {
      setSelectedNode(fileNodes[e.instanceId]);
    }
  };

  return (
    <group>
      {/* 1. InstancedMesh para Diretórios (Cubos Neon Ciano) */}
      {dirNodes.length > 0 && (
        <instancedMesh
          ref={dirMeshRef}
          args={[null, null, dirNodes.length]}
          onClick={handleDirClick}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[2.6, 2.6, 2.6]} />
          <meshStandardMaterial
            emissive="#1e293b"
            emissiveIntensity={0.6}
            roughness={0.2}
            metalness={0.6}
            toneMapped={false}
          />
        </instancedMesh>
      )}

      {/* 2. InstancedMesh para Arquivos (Esferas com Glow Emissivo) */}
      {fileNodes.length > 0 && (
        <instancedMesh
          ref={fileMeshRef}
          args={[null, null, fileNodes.length]}
          onClick={handleFileClick}
          castShadow
          receiveShadow
        >
          <sphereGeometry args={[2.0, 24, 24]} />
          <meshStandardMaterial
            emissive="#334155"
            emissiveIntensity={0.8}
            roughness={0.15}
            metalness={0.4}
            toneMapped={false}
          />
        </instancedMesh>
      )}
    </group>
  );
}
