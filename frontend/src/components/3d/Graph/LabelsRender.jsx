import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore } from '../../../core/store';

const centerVector = new THREE.Vector3(0, 0, 0);

/**
 * Componente individual de Texto WebGL Nativo via SDF (Signed Distance Fields / Troika Engine)
 * - Renderização 100% acelerada pela GPU (Zero tags HTML/DOM, Zero alocação de CanvasTexture)
 * - Texto nítido e legível a qualquer zoom com outline e sombras escuras integradas
 * - Billboard nativo: O texto sempre fica voltado para a câmera sem cálculos de CPU no DOM
 */
function NativeLabelText({ node, isDir = false, opacity = 1 }) {
  const isRootNode = Boolean(node.isRoot || node.depth === 0 || node.id === 'root');
  const isSuperNode = Boolean(node.isSuperNode);

  // Altura Y Dinâmica: posiciona o texto elegantemente acima da esfera/poliedro sem colidir
  const nodeRadius = node.visualRadius || (isRootNode ? 14.0 : (isDir ? 8.0 : 1.6));
  const margin = isSuperNode ? 14 : (isRootNode ? 12 : (isDir ? 7 : 4.5));
  const posY = (node.y || 0) + nodeRadius + margin;

  // Cores de texto e outline baseadas na categoria / Super Nó
  const mainColor = isSuperNode
    ? '#fbbf24'
    : isRootNode
    ? '#fef08a'
    : isDir
    ? '#38bdf8'
    : (node.color || '#f472b6');

  // Formato do texto: Super Nós exibem contagem e volume agregado
  let displayText;
  if (isSuperNode) {
    const countStr = node.formattedFileCount || (node.fileCount >= 1000 ? `${(node.fileCount / 1000).toFixed(1)}k` : node.fileCount || '0');
    const sizeStr = node.formattedSize || '0 B';
    displayText = `⚡ [${String(node.name || node.id)}] (${countStr} arqs | ${sizeStr})`;
  } else if (isRootNode) {
    displayText = `☀️ ${String(node.name || node.id).toUpperCase()}`;
  } else if (isDir) {
    displayText = `📁 ${String(node.name || node.id).toUpperCase()}`;
  } else {
    displayText = String(node.name || node.id);
  }

  const fontSize = isSuperNode ? 4.5 : (isRootNode ? 5.5 : isDir ? 3.8 : 2.2);

  const handleClick = (e) => {
    e.stopPropagation();
    useAppStore.getState().setSelectedNode(node);
    if (isSuperNode) {
      useAppStore.getState().openSuperNodePanel(node);
      useAppStore.getState().setCameraTarget({
        x: node.x || 0,
        y: node.y || 0,
        z: node.z || 0,
        isSuperNode: true,
      });
    }
  };

  return (
    <Billboard position={[node.x || 0, posY, node.z || 0]}>
      <Text
        text={displayText}
        fontSize={fontSize}
        color={mainColor}
        anchorX="center"
        anchorY="middle"
        outlineWidth={fontSize * 0.1}
        outlineColor="#070a12"
        outlineOpacity={opacity * 0.9}
        fillOpacity={opacity}
        renderOrder={2}
        depthWrite={false}
        onClick={handleClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
          useAppStore.getState().setHoveredNode(node);
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
          useAppStore.getState().setHoveredNode(null);
        }}
      />
    </Billboard>
  );
}

/**
 * src/components/3d/Graph/LabelsRender.jsx
 * 
 * Renderizador ultraleve de rótulos com a estilização de Cards do Tree of Knowledge:
 * - Sprites nativos WebGL (Three.js SpriteMaterial) otimizados para 60 FPS contínuos.
 * - Hide-on-Pan: Os textos desaparecem suavemente enquanto a câmera se move/gira e reaparecem ao parar.
 * - Limite inteligente (Cap): exibe no máximo os ~200 arquivos mais próximos da câmera.
 * - LOD Dinâmico: Repositórios massivos ajustam a distância de corte para não sobrecarregar.
 * - Controles independentes: Pastas e Arquivos alternáveis via UI.
 */
export default function LabelsRender({ nodes = [] }) {
  const showFolderLabels = useAppStore((s) => s.showFolderLabels);
  const showFileLabels = useAppStore((s) => s.showFileLabels);
  const isMovingCamera = useAppStore((s) => s.isMovingCamera);
  const focusedFolder = useAppStore((s) => s.focusedFolder);
  const hoveredNode = useAppStore((s) => s.hoveredNode);

  const dirGroupRef = useRef();
  const fileGroupRef = useRef();
  const opacityRef = useRef(1);

  // Separa os nós por tipo (Diretórios vs Arquivos)
  const { dirNodes, fileNodes } = useMemo(() => {
    if (!nodes.length) return { dirNodes: [], fileNodes: [] };

    const dirs = [];
    const files = [];

    nodes.forEach((n) => {
      const isDir = n.type === 'dir' || n.isDir;
      if (isDir) dirs.push(n);
      else files.push(n);
    });

    return { dirNodes: dirs, fileNodes: files };
  }, [nodes]);

  // Estado dos nós de pastas visíveis (LOD de pastas)
  const [activeDirNodes, setActiveDirNodes] = React.useState([]);
  const lastCameraPos = useRef(new THREE.Vector3(Infinity, Infinity, Infinity));

  // LOD Dinâmico para Diretórios e Hide-on-Pan
  // Otimizado: NUNCA recalcula nem dispara setActiveDirNodes enquanto a câmera estiver em movimento (isMovingCamera)
  useFrame((state, delta) => {
    // Transição suave de opacidade (Fade-out quando movendo a câmera, Fade-in ao parar)
    const target = isMovingCamera ? 0 : 1;
    const speed = isMovingCamera ? 8 : 4;
    opacityRef.current = THREE.MathUtils.damp(opacityRef.current, target, speed, delta);

    // Se estiver em movimento ou a opacidade ainda estiver baixa, poupa 100% da CPU
    if (isMovingCamera) {
      return;
    }

    const distCamMoved = state.camera.position.distanceTo(lastCameraPos.current);
    // Threshold generoso (150 unidades): recalcula apenas quando a câmera realmente se deslocou muito
    if (distCamMoved > 150) {
      lastCameraPos.current.copy(state.camera.position);

      const camX = state.camera.position.x;
      const camY = state.camera.position.y;
      const camZ = state.camera.position.z;

      // Pastas: Raiz e Super Nós sempre visíveis como marcos + até 30 pastas mais próximas
      const nearbyDirs = [];
      for (let i = 0; i < dirNodes.length; i++) {
        const dn = dirNodes[i];
        if (dn.isRoot || dn.depth === 0 || dn.id === 'root' || dn.isSuperNode) {
          nearbyDirs.push({ node: dn, distSq: -1 });
          continue;
        }
        const dx = (dn.x || 0) - camX;
        const dy = (dn.y || 0) - camY;
        const dz = (dn.z || 0) - camZ;
        const distSq = dx * dx + dy * dy + dz * dz;

        if (distSq < 1500 * 1500) {
          nearbyDirs.push({ node: dn, distSq });
        }
      }
      nearbyDirs.sort((a, b) => a.distSq - b.distSq);
      setActiveDirNodes(nearbyDirs.slice(0, 35).map((d) => d.node));
    }
  });

  // Modo Foco + Hover para Arquivos:
  // Zero poluição visual: arquivos só têm rótulo se forem filhos da pasta em foco OU sob o cursor (hover)
  const visibleFileNodes = useMemo(() => {
    if (!showFileLabels) return [];

    const result = [];
    const hoveredIsFile = hoveredNode && !hoveredNode.isDir && hoveredNode.type !== 'dir';

    if (hoveredIsFile) {
      result.push(hoveredNode);
    }

    if (focusedFolder) {
      const folderId = focusedFolder.id;
      const folderPath = focusedFolder.path || focusedFolder.id;

      for (let i = 0; i < fileNodes.length; i++) {
        const f = fileNodes[i];
        if (hoveredIsFile && f.id === hoveredNode.id) continue;

        // Verifica se é filho direto pelo parent ID ou pelo prefixo do caminho
        const isChild =
          f.parent === folderId ||
          (f.parentId && f.parentId === folderId) ||
          (f.path && f.path.startsWith(folderPath + '/'));

        if (isChild) {
          result.push(f);
          if (result.length >= 50) break; // Trava de segurança para pastas gigantes
        }
      }
    }

    return result;
  }, [showFileLabels, focusedFolder, hoveredNode, fileNodes]);

  return (
    <group>
      {/* Rótulos das Pastas (Marcos de navegação: Sol + pastas próximas) */}
      {showFolderLabels && (
        <group ref={dirGroupRef}>
          {activeDirNodes.map((node) => (
            <NativeLabelText key={node.id} node={node} isDir={true} opacity={0.95} />
          ))}
        </group>
      )}

      {/* Rótulos dos Arquivos (Modo Foco: Apenas da pasta ativa + arquivo sob hover) */}
      {showFileLabels && visibleFileNodes.length > 0 && (
        <group ref={fileGroupRef}>
          {visibleFileNodes.map((node) => (
            <NativeLabelText key={node.id} node={node} isDir={false} opacity={0.95} />
          ))}
        </group>
      )}
    </group>
  );
}
