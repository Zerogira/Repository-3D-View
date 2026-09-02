import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard } from '@react-three/drei';
import * as THREE from 'three';

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
 * Componente individual de Card Flutuante de Nó
 */
function LabelCard({ node }) {
  const isDir = node.type === 'dir' || node.isDir;
  const cardBorderColor = node.color || (isDir ? '#38bdf8' : '#f472b6');

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

  if (!labelGfx) return null;

  const posY = (node.y || 0) + (isDir ? 10 : 5.5);

  return (
    <Billboard
      position={[node.x || 0, posY, node.z || 0]}
      follow={true}
      lockX={false}
      lockY={false}
      lockZ={false}
    >
      <mesh renderOrder={2}>
        <planeGeometry args={[labelGfx.worldW, labelGfx.worldH]} />
        <meshBasicMaterial
          map={labelGfx.tex}
          transparent={true}
          opacity={0.96}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </Billboard>
  );
}

/**
 * src/components/3d/Graph/LabelsRender.jsx
 * 
 * Renderizador principal de rótulos com a estilização exata de Cards do Tree of Knowledge:
 * - Textura Canvas 2D nativa no WebGL com bordas neon vivas e fundo escuro.
 * - Billboard nativo mantendo orientação contínua para a câmera.
 * - LOD direto na GPU via useFrame sem re-renders no React.
 */
export default function LabelsRender({ nodes = [] }) {
  const dirGroupRef = useRef();
  const fileGroupRef = useRef();

  // Separa os nós por tipo (Diretórios vs Arquivos)
  const { dirLabelNodes, fileLabelNodes } = useMemo(() => {
    if (!nodes.length) return { dirLabelNodes: [], fileLabelNodes: [] };

    const dirs = [];
    const files = [];

    nodes.forEach((n) => {
      const isDir = n.type === 'dir' || n.isDir;
      if (isDir) dirs.push(n);
      else files.push(n);
    });

    return {
      dirLabelNodes: dirs.slice(0, 300),
      fileLabelNodes: files.slice(0, 700),
    };
  }, [nodes]);

  // LOD Inteligente na GPU: Pastas visíveis de longe; Arquivos aparecem ao aproxima a câmera (distância < 650)
  useFrame((state) => {
    const cameraDist = state.camera.position.distanceTo(centerVector);

    // 1. Rótulos de Pastas: Visíveis de longe (distância < 2500)
    if (dirGroupRef.current) {
      const isDirVisible = cameraDist < 2500;
      if (dirGroupRef.current.visible !== isDirVisible) {
        dirGroupRef.current.visible = isDirVisible;
      }
    }

    // 2. Rótulos de Arquivos do Pilar: Visíveis somente em zoom-in (distância < 650)
    if (fileGroupRef.current) {
      const isFileVisible = cameraDist < 650;
      if (fileGroupRef.current.visible !== isFileVisible) {
        fileGroupRef.current.visible = isFileVisible;
      }
    }
  });

  return (
    <group>
      {/* Rótulos das Pastas (Âncoras da Cidade - Visíveis de Longe) */}
      <group ref={dirGroupRef}>
        {dirLabelNodes.map((node) => (
          <LabelCard key={node.id} node={node} />
        ))}
      </group>

      {/* Rótulos dos Arquivos (Aparecem ao aproximar no Pilar) */}
      <group ref={fileGroupRef}>
        {fileLabelNodes.map((node) => (
          <LabelCard key={node.id} node={node} />
        ))}
      </group>
    </group>
  );
}
