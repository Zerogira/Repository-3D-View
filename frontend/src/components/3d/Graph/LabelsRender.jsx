import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore } from '../../../core/store';

const centerVector = new THREE.Vector3(0, 0, 0);
const MAX_VISIBLE_LABELS = 1000;
const LOD_DISTANCE_THRESHOLD = 3000;

/**
 * Função utilitária para desenhar retângulos com cantos arredondados no Canvas 2D
 */
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * Gera a textura 2D do Card do Nó baseada na especificação Tree of Knowledge (PDF).
 * Cria um card cibernético com fundo escuro, texto branco nítido e borda neon com a cor do nó/categoria.
 */
function makeLabelTexture(text, borderColor, isDir = false) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const padX = isDir ? 22 : 16;
  const padY = isDir ? 14 : 10;
  const font = isDir
    ? 'bold 30px "JetBrains Mono", Consolas, Inter, sans-serif'
    : '500 22px "JetBrains Mono", Consolas, Inter, sans-serif';

  ctx.font = font;

  const displayText = isDir ? `📂 ${text.toUpperCase()}` : text;
  const truncatedText =
    displayText.length > 30 ? `${displayText.slice(0, 29)}…` : displayText;
  const tw = Math.ceil(ctx.measureText(truncatedText).width);

  const w = tw + padX * 2;
  const h = (isDir ? 44 : 34) + padY * 2;

  canvas.width = w;
  canvas.height = h;

  // 1. Fundo do Card (Fundo Escuro Cyberpunk)
  ctx.fillStyle = isDir ? 'rgba(6, 11, 25, 0.95)' : 'rgba(10, 16, 31, 0.88)';
  roundRect(ctx, 1, 1, w - 2, h - 2, 8);
  ctx.fill();

  // 2. Borda Neon (Cor da Categoria Funcional do Nó)
  ctx.strokeStyle = borderColor || '#38bdf8';
  ctx.lineWidth = isDir ? 3.5 : 2.0;
  roundRect(ctx, 2, 2, w - 4, h - 4, 7);
  ctx.stroke();

  // 3. Texto do Título
  ctx.font = font;
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'middle';
  ctx.fillText(truncatedText, padX, h / 2);

  // Conversão para CanvasTexture do Three.js
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;

  const aspect = w / h;
  const worldH = isDir ? 11 : 6.5;
  const worldW = worldH * aspect;

  return { tex, worldW, worldH };
}

/**
 * Componente individual de Card Flutuante de Nó via Sprite nativo do Three.js
 * (Desempenho 60 FPS: 1 Draw Call simples por sprite, com suporte a transição de opacidade Hide-on-Pan)
 */
function LabelCard({ node, opacityRef }) {
  const isDir = node.type === 'dir' || node.isDir;
  const cardBorderColor = node.color || (isDir ? '#38bdf8' : '#f472b6');
  const matRef = useRef();

  // Gera a textura do card
  const labelGfx = useMemo(() => {
    const titleText = node.name || node.id || '';
    return makeLabelTexture(titleText, cardBorderColor, isDir);
  }, [node.name, node.id, cardBorderColor, isDir]);

  // Limpeza de memória da textura ao desmontar
  useEffect(() => {
    return () => {
      if (labelGfx?.tex) labelGfx.tex.dispose();
    };
  }, [labelGfx]);

  // Sincroniza opacidade contínua do sprite via useFrame sem disparar re-renders no React
  useFrame(() => {
    if (matRef.current && opacityRef) {
      const targetOp = opacityRef.current * 0.96;
      if (Math.abs(matRef.current.opacity - targetOp) > 0.01) {
        matRef.current.opacity = targetOp;
        matRef.current.visible = targetOp > 0.05;
      }
    }
  });

  if (!labelGfx) return null;

  // Altura Y Dinâmica: posY = y + raioDoNó + margem
  // Para pastas: geometria r=2.0 multiplicada pela escala (7.5 a 10.5) = raio de 15 a 21 + margem de respiro (8)
  // Para arquivos: geometria r=1.5 multiplicada pela escala (3.2) = raio de ~4.8 + margem de respiro (4.5)
  const nodeRadius = isDir
    ? 2.0 * (7.5 + Math.max(0, 4 - (node.depth || 0)) * 0.75)
    : 1.5 * 3.2;
  const margin = isDir ? 8 : 4.5;
  const posY = (node.y || 0) + nodeRadius + margin;

  const handleClick = (e) => {
    e.stopPropagation();
    useAppStore.getState().setSelectedNode(node);
  };

  return (
    <sprite
      position={[node.x || 0, posY, node.z || 0]}
      scale={[labelGfx.worldW, labelGfx.worldH, 1]}
      renderOrder={2}
      onClick={handleClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto';
      }}
    >
      <spriteMaterial
        ref={matRef}
        map={labelGfx.tex}
        transparent={true}
        opacity={0.96}
        depthWrite={false}
      />
    </sprite>
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
      {/* Rótulos das Pastas (Âncoras - Cubos) */}
      {showFolderLabels && (
        <group ref={dirGroupRef}>
          {dirNodes.slice(0, 300).map((node) => (
            <LabelCard key={node.id} node={node} opacityRef={opacityRef} />
          ))}
        </group>
      )}

      {/* Rótulos dos Arquivos (Esferas / Bolinhas mais próximas com Cap de 150~250) */}
      {showFileLabels && (
        <group ref={fileGroupRef}>
          {activeFileNodes.map((node) => (
            <LabelCard key={node.id} node={node} opacityRef={opacityRef} />
          ))}
        </group>
      )}
    </group>
  );
}
