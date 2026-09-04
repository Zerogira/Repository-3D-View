import React, { useRef, useLayoutEffect, useMemo, useState, useCallback, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAppStore } from '../../../core/store';

const tempObject = new THREE.Object3D();
const tempColor = new THREE.Color();

/**
 * src/components/3d/Graph/NodesRender.jsx
 * 
 * Renderizador de alta performance via InstancedMesh com bolinhas sólidas, cores vivas e maiores:
 * - Pastas: Bolinhas esféricas sólidas grandes e vibrantes (ciano elétrico #00f0ff)
 * - Arquivos: Bolinhas esféricas sólidas ampliadas com cores vivas e ricas por categoria
 * - Mantém rigorosamente as distâncias espaciais originais da árvore/física
 * - Efeito de Hover Físico: Pulso de escala (+30%) com iluminação laser nítida
 */
export default function NodesRender({ nodes = [] }) {
  const setSelectedNode = useAppStore((s) => s.setSelectedNode);
  const setHoveredNode = useAppStore((s) => s.setHoveredNode);
  const showFileGeometry = useAppStore((s) => s.showFileGeometry);

  // Separa nós por tipo (diretórios vs arquivos)
  const dirNodes = useMemo(() => nodes.filter((n) => n.type === 'dir' || n.isDir), [nodes]);
  const fileNodes = useMemo(() => nodes.filter((n) => n.type !== 'dir' && !n.isDir), [nodes]);

  const dirMeshRef = useRef();
  const fileMeshRef = useRef();

  // Índice do nó atualmente sob o ponteiro do mouse
  const [hoveredState, setHoveredState] = useState({ type: null, index: -1 });
  const prevHoveredRef = useRef({ type: null, index: -1 });

  // Guarda as posições interpoladas atuais (Voo Cósmico / Transição Suave)
  const dirPositionsRef = useRef([]);
  const filePositionsRef = useRef([]);

  // Inicializa ou atualiza as posições de destino quando o array de nós muda
  useEffect(() => {
    // Alinha o buffer de posições interpoladas para diretórios
    if (dirPositionsRef.current.length !== dirNodes.length) {
      dirPositionsRef.current = dirNodes.map((n) => ({
        x: n.x || 0,
        y: n.y || 0,
        z: n.z || 0,
      }));
    }

    // Alinha o buffer de posições interpoladas para arquivos
    if (filePositionsRef.current.length !== fileNodes.length) {
      filePositionsRef.current = fileNodes.map((n) => ({
        x: n.x || 0,
        y: n.y || 0,
        z: n.z || 0,
      }));
    }
  }, [dirNodes, fileNodes]);

  // Loop de Animação 60 FPS: Interpola suavemente (lerp) as posições no espaço 3D (Voo entre layouts)
  useFrame((_, delta) => {
    // Fator de suavização do voo adaptado ao framerate
    const lerpFactor = Math.min(1, delta * 6.5);
    let dirNeedsUpdate = false;
    let fileNeedsUpdate = false;

    const hoverChanged =
      prevHoveredRef.current.type !== hoveredState.type ||
      prevHoveredRef.current.index !== hoveredState.index;

    // 1. Interpolação de Diretórios
    if (dirMeshRef.current && dirNodes.length > 0) {
      for (let i = 0; i < dirNodes.length; i++) {
        const target = dirNodes[i];
        const current = dirPositionsRef.current[i] || { x: target.x || 0, y: target.y || 0, z: target.z || 0 };
        dirPositionsRef.current[i] = current;

        const tx = target.x || 0;
        const ty = target.y || 0;
        const tz = target.z || 0;

        const dx = tx - current.x;
        const dy = ty - current.y;
        const dz = tz - current.z;

        if (Math.abs(dx) > 0.05 || Math.abs(dy) > 0.05 || Math.abs(dz) > 0.05) {
          current.x += dx * lerpFactor;
          current.y += dy * lerpFactor;
          current.z += dz * lerpFactor;
          dirNeedsUpdate = true;
        } else {
          current.x = tx;
          current.y = ty;
          current.z = tz;
        }

        const isHovered = hoveredState.type === 'dir' && hoveredState.index === i;
        const baseScale = 7.5 + Math.max(0, 4 - (target.depth || 0)) * 0.75;
        const scale = isHovered ? baseScale * 1.35 : baseScale;

        tempObject.position.set(current.x, current.y, current.z);
        tempObject.scale.set(scale, scale, scale);
        tempObject.rotation.set(0, 0, 0);
        tempObject.updateMatrix();

        dirMeshRef.current.setMatrixAt(i, tempObject.matrix);

        const baseColor = target.color || '#00f0ff';
        const colorHex = isHovered ? '#ffffff' : baseColor;
        tempColor.set(colorHex);
        dirMeshRef.current.setColorAt(i, tempColor);
      }

      if (dirNeedsUpdate || hoverChanged || hoveredState.type === 'dir' || prevHoveredRef.current.type === 'dir') {
        dirMeshRef.current.instanceMatrix.needsUpdate = true;
        if (dirMeshRef.current.instanceColor) dirMeshRef.current.instanceColor.needsUpdate = true;
        dirMeshRef.current.computeBoundingSphere();
      }
    }

    // 2. Interpolação de Arquivos (Voo Suave para as Órbitas Planetárias)
    if (fileMeshRef.current && fileNodes.length > 0) {
      for (let i = 0; i < fileNodes.length; i++) {
        const target = fileNodes[i];
        const current = filePositionsRef.current[i] || { x: target.x || 0, y: target.y || 0, z: target.z || 0 };
        filePositionsRef.current[i] = current;

        const tx = target.x || 0;
        const ty = target.y || 0;
        const tz = target.z || 0;

        const dx = tx - current.x;
        const dy = ty - current.y;
        const dz = tz - current.z;

        if (Math.abs(dx) > 0.05 || Math.abs(dy) > 0.05 || Math.abs(dz) > 0.05) {
          current.x += dx * lerpFactor;
          current.y += dy * lerpFactor;
          current.z += dz * lerpFactor;
          fileNeedsUpdate = true;
        } else {
          current.x = tx;
          current.y = ty;
          current.z = tz;
        }

        const isHovered = hoveredState.type === 'file' && hoveredState.index === i;
        const scale = isHovered ? 2.5 : 1.2;

        tempObject.position.set(current.x, current.y, current.z);
        tempObject.scale.set(scale, scale, scale);
        tempObject.rotation.set(0, 0, 0);
        tempObject.updateMatrix();

        fileMeshRef.current.setMatrixAt(i, tempObject.matrix);

        const baseColor = target.color || '#f43f5e';
        const colorHex = isHovered ? '#ffffff' : baseColor;
        tempColor.set(colorHex);
        fileMeshRef.current.setColorAt(i, tempColor);
      }

      if (fileNeedsUpdate || hoverChanged || hoveredState.type === 'file' || prevHoveredRef.current.type === 'file') {
        fileMeshRef.current.instanceMatrix.needsUpdate = true;
        if (fileMeshRef.current.instanceColor) fileMeshRef.current.instanceColor.needsUpdate = true;
        fileMeshRef.current.computeBoundingSphere();
      }
    }

    prevHoveredRef.current = hoveredState;
  });

  // Handlers de clique
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

  // Handlers de Hover para Pastas
  const handleDirPointerOver = useCallback(
    (e) => {
      e.stopPropagation();
      const id = e.instanceId;
      if (id !== undefined && dirNodes[id]) {
        document.body.style.cursor = 'pointer';
        setHoveredState({ type: 'dir', index: id });
        setHoveredNode(dirNodes[id]);
      }
    },
    [dirNodes, setHoveredNode]
  );

  const handleDirPointerOut = useCallback(() => {
    document.body.style.cursor = 'auto';
    setHoveredState({ type: null, index: -1 });
    setHoveredNode(null);
  }, [setHoveredNode]);

  // Handlers de Hover para Arquivos
  const handleFilePointerOver = useCallback(
    (e) => {
      e.stopPropagation();
      const id = e.instanceId;
      if (id !== undefined && fileNodes[id]) {
        document.body.style.cursor = 'pointer';
        setHoveredState({ type: 'file', index: id });
        setHoveredNode(fileNodes[id]);
      }
    },
    [fileNodes, setHoveredNode]
  );

  const handleFilePointerOut = useCallback(() => {
    document.body.style.cursor = 'auto';
    setHoveredState({ type: null, index: -1 });
    setHoveredNode(null);
  }, [setHoveredNode]);

  return (
    <group>
      {/* 1. InstancedMesh para Diretórios (Bolinhas Sólidas Grandes Ciano Elétrico) */}
      {dirNodes.length > 0 && (
        <instancedMesh
          ref={dirMeshRef}
          args={[null, null, dirNodes.length]}
          onClick={handleDirClick}
          onPointerOver={handleDirPointerOver}
          onPointerOut={handleDirPointerOut}
        >
          <sphereGeometry args={[2.0, 24, 24]} />
          <meshBasicMaterial
            toneMapped={false}
          />
        </instancedMesh>
      )}

      {/* 2. InstancedMesh para Arquivos (Poeira Estelar Holográfica Sci-Fi com Additive Blending) */}
      {showFileGeometry && fileNodes.length > 0 && (
        <instancedMesh
          ref={fileMeshRef}
          args={[null, null, fileNodes.length]}
          onClick={handleFileClick}
          onPointerOver={handleFilePointerOver}
          onPointerOut={handleFilePointerOut}
        >
          <sphereGeometry args={[0.8, 16, 16]} />
          <meshBasicMaterial
            transparent={true}
            opacity={0.65}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </instancedMesh>
      )}
    </group>
  );
}
