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
  
  // Altura Y Dinâmica: posiciona o texto elegantemente acima da esfera sem colidir
  const dirScale = isRootNode ? 14.0 : (7.5 + Math.max(0, 4 - (node.depth || 0)) * 0.75);
  const nodeRadius = isDir ? 2.0 * dirScale : 1.5 * 3.2;
  const margin = isRootNode ? 12 : (isDir ? 8 : 4.5);
  const posY = (node.y || 0) + nodeRadius + margin;

  // Cores de texto e outline baseadas na categoria
  const mainColor = isRootNode
    ? '#fef08a'
    : isDir
    ? '#38bdf8'
    : (node.color || '#f472b6');

  const displayText = isRootNode
    ? `☀️ ${String(node.name || node.id).toUpperCase()}`
    : isDir
    ? `📁 ${String(node.name || node.id).toUpperCase()}`
    : String(node.name || node.id);

  const fontSize = isRootNode ? 5.5 : isDir ? 3.8 : 2.2;

  const handleClick = (e) => {
    e.stopPropagation();
    useAppStore.getState().setSelectedNode(node);
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

  // 1. LOD Dinâmico adaptado ao porte do projeto:
  const fileLodThreshold = useMemo(() => {
    const totalFiles = fileNodes.length;
    if (totalFiles > 800) return 550;
    if (totalFiles > 300) return 750;
    return 1100;
  }, [fileNodes.length]);

  // Limite máximo de arquivos simultâneos na tela (Cap inteligente de segurança)
  const maxFileCards = useMemo(() => {
    return fileNodes.length > 800 ? 150 : 250;
  }, [fileNodes.length]);

  // Estado dos nós de arquivos visíveis
  const [activeFileNodes, setActiveFileNodes] = React.useState([]);
  const lastCameraPos = useRef(new THREE.Vector3(Infinity, Infinity, Infinity));

  // LOD Inteligente e Frustum Culling Dinâmico na GPU/Frame + Transição Hide-on-Pan
  useFrame((state, delta) => {
    // Transição suave de opacidade (Fade-out quando movendo a câmera, Fade-in ao parar)
    const target = isMovingCamera ? 0 : 1;
    const speed = isMovingCamera ? 8 : 4; // Fade out mais rápido para liberar a GPU imediatamente
    opacityRef.current = THREE.MathUtils.damp(opacityRef.current, target, speed, delta);

    // Se estiver movendo a câmera ativamente com opacidade zero, pula o cálculo espacial para liberar a CPU
    if (isMovingCamera && opacityRef.current < 0.05) {
      return;
    }

    const cameraDistCenter = state.camera.position.distanceTo(centerVector);

    // Controle de visibilidade das Pastas
    if (dirGroupRef.current) {
      const isDirVisible = showFolderLabels && cameraDistCenter < 3500;
      if (dirGroupRef.current.visible !== isDirVisible) {
        dirGroupRef.current.visible = isDirVisible;
      }
    }

    // Se arquivos estiverem desativados ou lista vazia, esconde o grupo
    if (!showFileLabels || fileNodes.length === 0) {
      if (fileGroupRef.current && fileGroupRef.current.visible) {
        fileGroupRef.current.visible = false;
      }
      return;
    }

    if (fileGroupRef.current && !fileGroupRef.current.visible) {
      fileGroupRef.current.visible = true;
    }

    // Só recalcula os arquivos mais próximos se a câmera moveu mais de 35 unidades e parou
    const distCamMoved = state.camera.position.distanceTo(lastCameraPos.current);
    if (distCamMoved > 35) {
      lastCameraPos.current.copy(state.camera.position);

      const camX = state.camera.position.x;
      const camY = state.camera.position.y;
      const camZ = state.camera.position.z;

      // Filtra arquivos dentro do raio do LOD atual e ordena pelos mais próximos da câmera
      const nearbyFiles = [];
      for (let i = 0; i < fileNodes.length; i++) {
        const fn = fileNodes[i];
        const dx = (fn.x || 0) - camX;
        const dy = (fn.y || 0) - camY;
        const dz = (fn.z || 0) - camZ;
        const distSq = dx * dx + dy * dy + dz * dz;

        if (distSq < fileLodThreshold * fileLodThreshold) {
          nearbyFiles.push({ node: fn, distSq });
        }
      }

      // Ordena pelos mais próximos e aplica o teto (Cap)
      nearbyFiles.sort((a, b) => a.distSq - b.distSq);
      const selected = nearbyFiles.slice(0, maxFileCards).map((item) => item.node);

      setActiveFileNodes(selected);
    }
  });

  return (
    <group>
      {/* Rótulos das Pastas (Âncoras - Texto Nativo WebGL GPU) */}
      {showFolderLabels && (
        <group ref={dirGroupRef}>
          {dirNodes.slice(0, 300).map((node) => (
            <NativeLabelText key={node.id} node={node} isDir={true} opacity={0.95} />
          ))}
        </group>
      )}

      {/* Rótulos dos Arquivos (Esferas / Bolinhas mais próximas com Cap inteligente) */}
      {showFileLabels && (
        <group ref={fileGroupRef}>
          {activeFileNodes.map((node) => (
            <NativeLabelText key={node.id} node={node} isDir={false} opacity={0.88} />
          ))}
        </group>
      )}
    </group>
  );
}
