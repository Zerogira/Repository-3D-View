import React, { useRef, useMemo, useState, useCallback, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAppStore } from '../../../core/store';

const tempObject = new THREE.Object3D();
const tempColor = new THREE.Color();

/**
 * src/components/3d/Graph/NodesRender.jsx
 * 
 * Renderizador de alta performance via InstancedMesh (Fase 2):
 * - Pastas Comuns: Bolinhas esféricas sólidas (ciano elétrico / cores dos ramos)
 * - Super Nós: Geometria diferenciada <icosahedronGeometry> com wireframe neon âmbar/dourado (#f59e0b)
 *   e rotação contínua dos poliedros facetados
 * - Arquivos: Bolinhas esféricas sólidas por categoria
 * - Interação de clique no Super Nó: dispara abertura do painel de micro-navegação e foco suave de câmera
 */
export default function NodesRender({ nodes = [] }) {
  const setSelectedNode = useAppStore((s) => s.setSelectedNode);
  const setHoveredNode = useAppStore((s) => s.setHoveredNode);
  const openSuperNodePanel = useAppStore((s) => s.openSuperNodePanel);
  const setCameraTarget = useAppStore((s) => s.setCameraTarget);
  const showFileGeometry = useAppStore((s) => s.showFileGeometry);
  const layoutMode = useAppStore((s) => s.layoutMode);

  // Separa nós por tipo: Super Nós, Diretórios Regulares e Arquivos
  const superNodes = useMemo(
    () => nodes.filter((n) => (n.type === 'dir' || n.isDir) && n.isSuperNode),
    [nodes]
  );
  const regularDirNodes = useMemo(
    () => nodes.filter((n) => (n.type === 'dir' || n.isDir) && !n.isSuperNode),
    [nodes]
  );
  const fileNodes = useMemo(
    () => nodes.filter((n) => n.type !== 'dir' && !n.isDir),
    [nodes]
  );

  const regularDirMeshRef = useRef();
  const superWireMeshRef = useRef();
  const superCoreMeshRef = useRef();
  const fileMeshRef = useRef();

  // Índice do nó atualmente sob o ponteiro do mouse
  const [hoveredState, setHoveredState] = useState({ type: null, index: -1 });
  const prevHoveredRef = useRef({ type: null, index: -1 });

  // Buffers de posições interpoladas (Lerp Cósmico suave)
  const regularDirPositionsRef = useRef([]);
  const superPositionsRef = useRef([]);
  const filePositionsRef = useRef([]);

  // Atualiza ou inicializa as posições quando o array muda
  useEffect(() => {
    if (regularDirPositionsRef.current.length !== regularDirNodes.length) {
      regularDirPositionsRef.current = regularDirNodes.map((n) => ({
        x: n.x || 0,
        y: n.y || 0,
        z: n.z || 0,
      }));
    }

    if (superPositionsRef.current.length !== superNodes.length) {
      superPositionsRef.current = superNodes.map((n) => ({
        x: n.x || 0,
        y: n.y || 0,
        z: n.z || 0,
      }));
    }

    if (filePositionsRef.current.length !== fileNodes.length) {
      filePositionsRef.current = fileNodes.map((n) => ({
        x: n.x || 0,
        y: n.y || 0,
        z: n.z || 0,
      }));
    }
  }, [regularDirNodes, superNodes, fileNodes]);

  // Loop de Animação 60 FPS:
  // 1. Interpola suavemente posições
  // 2. Gira as facetas wireframe dos Super Nós (<icosahedronGeometry>)
  useFrame((state, delta) => {
    const lerpFactor = Math.min(1, delta * 6.5);
    const isQuantum = layoutMode === 'quantum';
    const elapsed = state.clock.elapsedTime;
    let regNeedsUpdate = false;
    let superNeedsUpdate = false;
    let fileNeedsUpdate = false;

    const hoverChanged =
      prevHoveredRef.current.type !== hoveredState.type ||
      prevHoveredRef.current.index !== hoveredState.index;

    // -------------------------------------------------------------
    // 1. Diretórios Regulares (Esferas)
    // -------------------------------------------------------------
    if (regularDirMeshRef.current && regularDirNodes.length > 0) {
      for (let i = 0; i < regularDirNodes.length; i++) {
        const target = regularDirNodes[i];
        const current = regularDirPositionsRef.current[i] || { x: target.x || 0, y: target.y || 0, z: target.z || 0 };
        regularDirPositionsRef.current[i] = current;

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
          regNeedsUpdate = true;
        } else {
          current.x = tx;
          current.y = ty;
          current.z = tz;
        }

        const isHovered = hoveredState.type === 'regularDir' && hoveredState.index === i;
        const isRoot = target.isRoot || target.depth === 0 || target.id === 'root';
        const fileCount = target.fileCount || 0;
        const dynamicRadius = target.visualRadius || (isRoot ? 14.0 : Math.min(22.0, 7.5 + Math.sqrt(fileCount) * 1.8));
        const baseScale = dynamicRadius;
        const scale = isHovered ? baseScale * 1.35 : baseScale;

        const breatheY = (isQuantum && !isRoot)
          ? Math.sin(elapsed * 1.4 + i * 0.8) * 1.8
          : 0;

        tempObject.position.set(current.x, current.y + breatheY, current.z);
        tempObject.scale.set(scale, scale, scale);
        tempObject.rotation.set(0, 0, 0);
        tempObject.updateMatrix();

        regularDirMeshRef.current.setMatrixAt(i, tempObject.matrix);

        const baseColor = isRoot ? '#facc15' : (target.color || '#00f0ff');
        const colorHex = isHovered ? '#ffffff' : baseColor;
        tempColor.set(colorHex);
        regularDirMeshRef.current.setColorAt(i, tempColor);
      }

      if (regNeedsUpdate || hoverChanged || isQuantum || hoveredState.type === 'regularDir' || prevHoveredRef.current.type === 'regularDir') {
        regularDirMeshRef.current.instanceMatrix.needsUpdate = true;
        if (regularDirMeshRef.current.instanceColor) regularDirMeshRef.current.instanceColor.needsUpdate = true;
        regularDirMeshRef.current.computeBoundingSphere();
      }
    }

    // -------------------------------------------------------------
    // 2. Super Nós (Icosaedro com Wireframe Neon + Núcleo Rotativo)
    // -------------------------------------------------------------
    if (superWireMeshRef.current && superNodes.length > 0) {
      for (let i = 0; i < superNodes.length; i++) {
        const target = superNodes[i];
        const current = superPositionsRef.current[i] || { x: target.x || 0, y: target.y || 0, z: target.z || 0 };
        superPositionsRef.current[i] = current;

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
          superNeedsUpdate = true;
        } else {
          current.x = tx;
          current.y = ty;
          current.z = tz;
        }

        const isHovered = hoveredState.type === 'superNode' && hoveredState.index === i;
        const baseRadius = target.visualRadius || 18.0;
        const wireScale = isHovered ? baseRadius * 1.45 : baseRadius * 1.18;
        const coreScale = isHovered ? baseRadius * 1.15 : baseRadius * 0.85;

        // Rotação suave contínua das facetas do icosaedro
        const rotX = elapsed * 0.45 + i * 0.5;
        const rotY = elapsed * 0.65 + i * 0.3;
        const rotZ = elapsed * 0.25;

        // Atualiza a malha do Wireframe
        tempObject.position.set(current.x, current.y, current.z);
        tempObject.scale.set(wireScale, wireScale, wireScale);
        tempObject.rotation.set(rotX, rotY, rotZ);
        tempObject.updateMatrix();
        superWireMeshRef.current.setMatrixAt(i, tempObject.matrix);

        const wireColorHex = isHovered ? '#ffffff' : '#fbbf24';
        tempColor.set(wireColorHex);
        superWireMeshRef.current.setColorAt(i, tempColor);

        // Atualiza o Núcleo Sólido Translúcido
        if (superCoreMeshRef.current) {
          tempObject.scale.set(coreScale, coreScale, coreScale);
          tempObject.rotation.set(-rotX * 0.5, -rotY * 0.5, 0);
          tempObject.updateMatrix();
          superCoreMeshRef.current.setMatrixAt(i, tempObject.matrix);

          const coreColorHex = isHovered ? '#fef08a' : '#f59e0b';
          tempColor.set(coreColorHex);
          superCoreMeshRef.current.setColorAt(i, tempColor);
        }
      }

      // Atualiza sempre para manter a rotação contínua das facetas a 60 FPS
      superWireMeshRef.current.instanceMatrix.needsUpdate = true;
      if (superWireMeshRef.current.instanceColor) superWireMeshRef.current.instanceColor.needsUpdate = true;
      superWireMeshRef.current.computeBoundingSphere();

      if (superCoreMeshRef.current) {
        superCoreMeshRef.current.instanceMatrix.needsUpdate = true;
        if (superCoreMeshRef.current.instanceColor) superCoreMeshRef.current.instanceColor.needsUpdate = true;
        superCoreMeshRef.current.computeBoundingSphere();
      }
    }

    // -------------------------------------------------------------
    // 3. Arquivos (Bolinhas leves)
    // -------------------------------------------------------------
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
        const scale = isHovered ? 3.8 : 2.2;

        const breatheY = isQuantum
          ? Math.sin(elapsed * 1.6 + i * 0.45) * 1.5
          : 0;

        tempObject.position.set(current.x, current.y + breatheY, current.z);
        tempObject.scale.set(scale, scale, scale);
        tempObject.rotation.set(0, 0, 0);
        tempObject.updateMatrix();

        fileMeshRef.current.setMatrixAt(i, tempObject.matrix);

        const baseColor = target.color || '#f43f5e';
        const colorHex = isHovered ? '#ffffff' : baseColor;
        tempColor.set(colorHex);
        fileMeshRef.current.setColorAt(i, tempColor);
      }

      if (fileNeedsUpdate || hoverChanged || isQuantum || hoveredState.type === 'file' || prevHoveredRef.current.type === 'file') {
        fileMeshRef.current.instanceMatrix.needsUpdate = true;
        if (fileMeshRef.current.instanceColor) fileMeshRef.current.instanceColor.needsUpdate = true;
        fileMeshRef.current.computeBoundingSphere();
      }
    }

    prevHoveredRef.current = hoveredState;
  });

  // Handlers de clique para Diretórios Regulares
  const handleRegularDirClick = (e) => {
    e.stopPropagation();
    if (e.instanceId !== undefined && regularDirNodes[e.instanceId]) {
      const node = regularDirNodes[e.instanceId];
      setSelectedNode(node);
      openSuperNodePanel(node);
      setCameraTarget({ x: node.x || 0, y: node.y || 0, z: node.z || 0, isSuperNode: false });
    }
  };

  // Handlers de clique para Super Nós
  const handleSuperNodeClick = (e) => {
    e.stopPropagation();
    if (e.instanceId !== undefined && superNodes[e.instanceId]) {
      const node = superNodes[e.instanceId];
      setSelectedNode(node);
      openSuperNodePanel(node);
      // Dispara voo suave de câmera para o Super Nó
      setCameraTarget({ x: node.x || 0, y: node.y || 0, z: node.z || 0, isSuperNode: true });
    }
  };

  // Handlers de clique para Arquivos
  const handleFileClick = (e) => {
    e.stopPropagation();
    if (e.instanceId !== undefined && fileNodes[e.instanceId]) {
      setSelectedNode(fileNodes[e.instanceId]);
    }
  };

  // Handlers de Hover
  const handleRegularDirPointerOver = useCallback(
    (e) => {
      if (useAppStore.getState().isMovingCamera) return;
      e.stopPropagation();
      const id = e.instanceId;
      if (id !== undefined && regularDirNodes[id]) {
        document.body.style.cursor = 'pointer';
        setHoveredState({ type: 'regularDir', index: id });
        setHoveredNode(regularDirNodes[id]);
      }
    },
    [regularDirNodes, setHoveredNode]
  );

  const handleRegularDirPointerOut = useCallback(() => {
    document.body.style.cursor = 'auto';
    setHoveredState({ type: null, index: -1 });
    setHoveredNode(null);
  }, [setHoveredNode]);

  const handleSuperPointerOver = useCallback(
    (e) => {
      if (useAppStore.getState().isMovingCamera) return;
      e.stopPropagation();
      const id = e.instanceId;
      if (id !== undefined && superNodes[id]) {
        document.body.style.cursor = 'pointer';
        setHoveredState({ type: 'superNode', index: id });
        setHoveredNode(superNodes[id]);
      }
    },
    [superNodes, setHoveredNode]
  );

  const handleSuperPointerOut = useCallback(() => {
    document.body.style.cursor = 'auto';
    setHoveredState({ type: null, index: -1 });
    setHoveredNode(null);
  }, [setHoveredNode]);

  const handleFilePointerOver = useCallback(
    (e) => {
      if (useAppStore.getState().isMovingCamera) return;
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
      {/* 1. InstancedMesh para Diretórios Regulares (Esferas) */}
      {regularDirNodes.length > 0 && (
        <instancedMesh
          ref={regularDirMeshRef}
          args={[null, null, regularDirNodes.length]}
          onClick={handleRegularDirClick}
          onPointerOver={handleRegularDirPointerOver}
          onPointerOut={handleRegularDirPointerOut}
        >
          <sphereGeometry args={[1.0, 10, 8]} />
          <meshBasicMaterial toneMapped={false} />
        </instancedMesh>
      )}

      {/* 2. InstancedMesh para Super Nós (Geometria Holográfica: Wireframe Icosaédrico Dourado + Núcleo) */}
      {superNodes.length > 0 && (
        <group>
          {/* Núcleo interno translúcido */}
          <instancedMesh
            ref={superCoreMeshRef}
            args={[null, null, superNodes.length]}
          >
            <icosahedronGeometry args={[1.0, 1]} />
            <meshBasicMaterial
              transparent={true}
              opacity={0.5}
              toneMapped={false}
            />
          </instancedMesh>

          {/* Gaiola Externa Wireframe com rotação ativa */}
          <instancedMesh
            ref={superWireMeshRef}
            args={[null, null, superNodes.length]}
            onClick={handleSuperNodeClick}
            onPointerOver={handleSuperPointerOver}
            onPointerOut={handleSuperPointerOut}
          >
            <icosahedronGeometry args={[1.0, 1]} />
            <meshBasicMaterial
              wireframe={true}
              toneMapped={false}
            />
          </instancedMesh>
        </group>
      )}

      {/* 3. InstancedMesh para Arquivos */}
      {showFileGeometry && fileNodes.length > 0 && (
        <instancedMesh
          ref={fileMeshRef}
          args={[null, null, fileNodes.length]}
          onClick={handleFileClick}
          onPointerOver={handleFilePointerOver}
          onPointerOut={handleFilePointerOut}
        >
          <sphereGeometry args={[1.6, 8, 6]} />
          <meshBasicMaterial
            transparent={true}
            opacity={0.8}
            toneMapped={false}
          />
        </instancedMesh>
      )}
    </group>
  );
}
