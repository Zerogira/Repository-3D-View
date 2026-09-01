import React, { useRef, useCallback, useState, useEffect, useMemo } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';
import { Camera, Maximize2, Minimize2 } from 'lucide-react';
import SidebarFilterPanel from './SidebarFilterPanel';
import MiniMap from './MiniMap';

// Etapa 1: Validação de Dados e Pré-Cálculo de Layout Hierárquico Determinístico
function sanitizeGraphData(rawGraphData) {
  if (!rawGraphData) return { nodes: [], links: [] };

  const rawNodes = Array.isArray(rawGraphData.nodes) ? rawGraphData.nodes : [];
  const rawLinks = Array.isArray(rawGraphData.links)
    ? rawGraphData.links
    : Array.isArray(rawGraphData.hierarchyLinks)
    ? rawGraphData.hierarchyLinks
    : [];

  const validNodeIds = new Set();
  const sanitizedNodes = [];

  for (const n of rawNodes) {
    if (n && n.id && !validNodeIds.has(n.id)) {
      validNodeIds.add(n.id);
      sanitizedNodes.push({ ...n });
    }
  }

  const seenLinkKeys = new Set();
  const sanitizedLinks = [];

  for (const l of rawLinks) {
    if (!l) continue;
    const sId = typeof l.source === 'object' ? l.source?.id : l.source;
    const tId = typeof l.target === 'object' ? l.target?.id : l.target;

    if (sId && tId && validNodeIds.has(sId) && validNodeIds.has(tId)) {
      const linkKey = `${sId}->${tId}`;
      if (!seenLinkKeys.has(linkKey)) {
        seenLinkKeys.add(linkKey);
        sanitizedLinks.push({ ...l, source: sId, target: tId, isHierarchy: true });
      }
    }
  }

  // Pré-cálculo do Layout Hierárquico Radial (Sem Trava de Coordenadas Fixas)
  const childrenMap = new Map();
  sanitizedNodes.forEach((n) => {
    if (n.parent) {
      if (!childrenMap.has(n.parent)) childrenMap.set(n.parent, []);
      childrenMap.get(n.parent).push(n.id);
    }
  });

  const rootNode = sanitizedNodes.find((n) => n.id === 'root' || !n.parent) || sanitizedNodes[0];
  const positionsMap = new Map();

  if (rootNode) {
    // Raiz na origem
    positionsMap.set(rootNode.id, { x: 0, y: 0, z: 0 });

    const level1 = childrenMap.get(rootNode.id) || [];
    const r1 = Math.max(30, Math.min(80, 20 + Math.sqrt(level1.length) * 10));

    level1.forEach((id, i) => {
      const angle = (i / Math.max(level1.length, 1)) * Math.PI * 2 - Math.PI / 2;
      const px = Math.cos(angle) * r1;
      const py = 30;
      const pz = Math.sin(angle) * r1;
      positionsMap.set(id, { x: px, y: py, z: pz });
    });

    const layoutSubtree = (parentId, depth) => {
      const kids = childrenMap.get(parentId) || [];
      const parentPos = positionsMap.get(parentId);
      if (!parentPos || !kids.length) return;

      const n = kids.length;
      const orbitR = Math.max(16, 12 + depth * 8 + Math.sqrt(n) * 6);
      const spread = n <= 1 ? 0 : Math.min(Math.PI * 1.3, 0.7 + n * 0.35);
      const startAngle = -spread / 2;
      const stepAngle = n <= 1 ? 0 : spread / (n - 1);

      let dirX = parentPos.x;
      let dirZ = parentPos.z;
      const len = Math.hypot(dirX, dirZ) || 1;
      dirX /= len;
      dirZ /= len;

      const perpX = -dirZ;
      const perpZ = dirX;

      kids.forEach((kidId, i) => {
        if (positionsMap.has(kidId)) return;
        const angle = n === 1 ? 0 : startAngle + stepAngle * i;
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);

        const px = parentPos.x + (dirX * cosA + perpX * sinA) * orbitR;
        const py = parentPos.y + 25 + (i % 4) * 5;
        const pz = parentPos.z + (dirZ * cosA + perpZ * sinA) * orbitR;

        positionsMap.set(kidId, { x: px, y: py, z: pz });
        layoutSubtree(kidId, depth + 1);
      });
    };

    level1.forEach((id) => layoutSubtree(id, 1));
  }

  // Aplicar posições pré-calculadas nos nós sem travas estáticas (fx/fy/fz)
  const positionedNodes = sanitizedNodes.map((n, idx) => {
    const pos = positionsMap.get(n.id);
    if (pos) {
      return { ...n, x: pos.x, y: pos.y, z: pos.z };
    }
    // Fallback em espiral para nós órfãos
    const angle = idx * 0.5;
    const r = 25 + idx * 3;
    return {
      ...n,
      x: Math.cos(angle) * r,
      y: (idx % 5) * 6,
      z: Math.sin(angle) * r,
    };
  });

  return {
    repo: rawGraphData.repo,
    default_branch: rawGraphData.default_branch,
    nodes: positionedNodes,
    links: sanitizedLinks,
    hierarchyLinks: sanitizedLinks,
  };
}

// Item 2: Gerador de Labels 3D no estilo Billboard Canvas com Fonte Aumentada (36px)
function createLabelSprite(text, type, isRoot, isDimmed) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const padX = 18;
  const padY = 12;
  // Aumentado para 36px para leitura fácil e imediata
  const font = '700 36px JetBrains Mono, Inter, sans-serif';
  ctx.font = font;

  const displayLabel = text.length > 25 ? text.slice(0, 24) + '…' : text;
  const textWidth = Math.ceil(ctx.measureText(displayLabel).width);
  const width = textWidth + padX * 2;
  const height = 50 + padY;

  canvas.width = width;
  canvas.height = height;

  // Background
  ctx.fillStyle = isDimmed
    ? 'rgba(15, 23, 42, 0.45)'
    : isRoot
    ? 'rgba(88, 28, 135, 0.95)'
    : type === 'folder'
    ? 'rgba(15, 23, 42, 0.95)'
    : 'rgba(2, 6, 23, 0.90)';

  // Rounded rect
  const r = 10;
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(width - r, 0);
  ctx.quadraticCurveTo(width, 0, width, r);
  ctx.lineTo(width, height - r);
  ctx.quadraticCurveTo(width, height, width - r, height);
  ctx.lineTo(r, height);
  ctx.quadraticCurveTo(0, height, 0, height - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  ctx.fill();

  // Border
  ctx.strokeStyle = isDimmed
    ? '#334155'
    : isRoot
    ? '#c084fc'
    : type === 'folder'
    ? '#38bdf8'
    : '#f472b6';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Text
  ctx.font = font;
  ctx.fillStyle = isDimmed ? '#64748b' : '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(displayLabel, width / 2, height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  const spriteMaterial = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    opacity: isDimmed ? 0.4 : 1.0,
    depthTest: false,
  });

  const sprite = new THREE.Sprite(spriteMaterial);
  const aspect = width / height;
  const spriteHeight = isRoot ? 16 : 11;
  sprite.scale.set(spriteHeight * aspect, spriteHeight, 1);
  return sprite;
}

export default function GraphViewer3D({ graphData: rawData, onNodeClick, filterTerm, isFullScreen, onToggleFullScreen }) {
  const fgRef = useRef();

  // 1° Correção: Rotação Automática Padrão LIGADA (true)
  const [autoRotate, setAutoRotate] = useState(true);

  // 4° Correção: Partículas Iniciais DESLIGADAS por padrão (false) para desempenho
  const [particlesEnabled, setParticlesEnabled] = useState(false);

  // 6° Correção: Grade no Chão Ligada por Padrão
  const [showGrid, setShowGrid] = useState(true);

  // 8° Correção: Painel Lateral de Filtros Retrátil
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // States para Interatividade (Hover vs Seleção)
  const [hoveredNode, setHoveredNode] = useState(null);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [cameraPos, setCameraPos] = useState({ x: 0, y: 0, z: 0 });

  // Sanitização dos Dados
  const baseGraphData = useMemo(() => sanitizeGraphData(rawData), [rawData]);

  // Extração das extensões disponíveis para o painel lateral
  const availableExtensions = useMemo(() => {
    const setExts = new Set();
    (baseGraphData.nodes || []).forEach((n) => {
      if (n.type === 'file') {
        const ext = n.extension || (n.name.includes('.') ? `.${n.name.split('.').pop()}` : '');
        if (ext) setExts.add(ext.toLowerCase());
      }
    });
    return Array.from(setExts).sort();
  }, [baseGraphData]);

  // Estado das extensões selecionadas no filtro lateral (Todas marcadas inicialmente)
  const [selectedExtensions, setSelectedExtensions] = useState(new Set(availableExtensions));

  useEffect(() => {
    setSelectedExtensions(new Set(availableExtensions));
  }, [availableExtensions]);

  // Filtragem dos Nós e Links do Grafo com base nos Checkboxes
  const graphData = useMemo(() => {
    if (selectedExtensions.size === availableExtensions.length) {
      return baseGraphData;
    }

    const filteredNodes = baseGraphData.nodes.filter((n) => {
      if (n.type === 'folder' || n.id === 'root') return true;
      const ext = (n.extension || (n.name.includes('.') ? `.${n.name.split('.').pop()}` : '')).toLowerCase();
      return selectedExtensions.has(ext);
    });

    const filteredNodeIds = new Set(filteredNodes.map((n) => n.id));
    const filteredLinks = baseGraphData.links.filter((l) => {
      const sId = typeof l.source === 'object' ? l.source.id : l.source;
      const tId = typeof l.target === 'object' ? l.target.id : l.target;
      return filteredNodeIds.has(sId) && filteredNodeIds.has(tId);
    });

    return {
      ...baseGraphData,
      nodes: filteredNodes,
      links: filteredLinks,
    };
  }, [baseGraphData, selectedExtensions, availableExtensions]);

  // Caching de vizinhança e ancestralidade
  const { nodeNeighborsMap, nodeAncestorsMap } = useMemo(() => {
    const neighbors = new Map();
    const parentsMap = new Map();

    (graphData.links || []).forEach((l) => {
      const sId = typeof l.source === 'object' ? l.source.id : l.source;
      const tId = typeof l.target === 'object' ? l.target.id : l.target;

      if (!neighbors.has(sId)) neighbors.set(sId, new Set());
      if (!neighbors.has(tId)) neighbors.set(tId, new Set());
      neighbors.get(sId).add(tId);
      neighbors.get(tId).add(sId);
      parentsMap.set(tId, sId);
    });

    const ancestors = new Map();
    (graphData.nodes || []).forEach((n) => {
      const branch = new Set([n.id]);
      let curr = n.id;
      while (parentsMap.has(curr)) {
        const parentId = parentsMap.get(curr);
        branch.add(parentId);
        curr = parentId;
      }
      ancestors.set(n.id, branch);
    });

    return { nodeNeighborsMap: neighbors, nodeAncestorsMap: ancestors };
  }, [graphData]);

  // 3° Correção: Restrição de Câmera (minPolarAngle e maxPolarAngle) e Rotação Automática (autoRotate)
  useEffect(() => {
    if (!fgRef.current) return;
    const controls = fgRef.current.controls();
    if (controls) {
      const shouldRotate = Boolean(autoRotate && !selectedNodeId);
      controls.autoRotate = shouldRotate;
      controls.autoRotateSpeed = 0.4;
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;

      // 1. Limite inferior: Impede o usuário de inclinar a câmera para baixo do nível do chão (evita visão de ponta-cabeça)
      controls.maxPolarAngle = Math.PI / 2 - 0.02; // 88.8 graus
      
      // 2. Limite superior: Permite olhar completamente de cima para o diagrama (visão zenital top-down)
      controls.minPolarAngle = 0.05; // ~2.8 graus do topo direto

      controls.update();
    }

    // Posição Inicial Perfeita da Câmera (Elevada em Y=90, afastada em Z=220, mirada no centro)
    const rootNode = graphData.nodes?.find((n) => n.id === 'root' || !n.parent);
    const target = rootNode ? { x: rootNode.x || 0, y: rootNode.y || 0, z: rootNode.z || 0 } : { x: 0, y: 0, z: 0 };
    fgRef.current.cameraPosition({ x: 0, y: 90, z: 220 }, target, 1200);
  }, [autoRotate, selectedNodeId, graphData]);

  // Inserir Iluminação, Névoa Mínima Espacial e Campo de Estrelas Rotativo
  useEffect(() => {
    if (!fgRef.current) return;
    const scene = fgRef.current.scene();

    // 1. Cor de Fundo Cosmic Dark #010409 e Névoa Mínima Praticamente Imperceptível (Fog 2500 -> 8000)
    scene.background = new THREE.Color('#010409');
    scene.fog = new THREE.Fog('#010409', 2500, 8000);

    // 2. Iluminação Tridimensional Direcionada
    let ambientLight = scene.getObjectByName('SpaceAmbientLight');
    if (!ambientLight) {
      ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
      ambientLight.name = 'SpaceAmbientLight';
      scene.add(ambientLight);
    }

    let dirLight = scene.getObjectByName('SpaceDirLight');
    if (!dirLight) {
      dirLight = new THREE.DirectionalLight(0x93c5fd, 0.7);
      dirLight.position.set(30, 40, 20);
      dirLight.name = 'SpaceDirLight';
      scene.add(dirLight);
    }

    let pointLight = scene.getObjectByName('SpacePointLight');
    if (!pointLight) {
      pointLight = new THREE.PointLight(0x818cf8, 0.6);
      pointLight.position.set(-30, 15, -25);
      pointLight.name = 'SpacePointLight';
      scene.add(pointLight);
    }

    // 3. Campo de Estrelas Rotativo (5.000 pontos em órbita esférica)
    let starField = scene.getObjectByName('SpaceStarField');
    if (!starField) {
      const count = 5000;
      const pos = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const r = 90 + Math.random() * 140;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        pos[i * 3 + 2] = r * Math.cos(phi);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const mat = new THREE.PointsMaterial({
        size: 0.5,
        color: 0xa5d8ff,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
      });
      starField = new THREE.Points(geo, mat);
      starField.name = 'SpaceStarField';
      scene.add(starField);
    }

    // 4. Grade Espaço-Tempo no chão plano em Y = -2 (irmão na raiz da cena)
    let gridGroup = scene.getObjectByName('SpaceTimeGridGroup');
    if (!gridGroup) {
      gridGroup = new THREE.Group();
      gridGroup.name = 'SpaceTimeGridGroup';

      // GridHelper expandido para 1200x1200 unidades
      const grid = new THREE.GridHelper(1200, 60, 0x1d4ed8, 0x0f172a);
      gridGroup.add(grid);

      // Plano de chão horizontal
      const planeGeo = new THREE.PlaneGeometry(1200, 1200);
      const planeMat = new THREE.MeshBasicMaterial({
        color: 0x020617,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide,
      });
      const planeMesh = new THREE.Mesh(planeGeo, planeMat);
      planeMesh.rotation.x = -Math.PI / 2;
      planeMesh.position.y = -0.1;
      gridGroup.add(planeMesh);

      // Posicionado no chão imediato Y = -2
      gridGroup.position.set(0, -2, 0);
      scene.add(gridGroup);
    } else {
      gridGroup.position.set(0, -2, 0);
      gridGroup.visible = showGrid;
    }
  }, [showGrid, graphData]);

  // Renderizador Tridimensional Enriquecido dos Nós (7° Correção)
  const nodeThreeObject = useCallback(
    (node) => {
      const isFolder = node.type === 'folder';
      const isRoot = node.id === 'root';

      const isSearchActive = Boolean(filterTerm && filterTerm.trim() !== '');
      const isMatched = isSearchActive
        ? node.name.toLowerCase().includes(filterTerm.toLowerCase()) ||
          node.path.toLowerCase().includes(filterTerm.toLowerCase())
        : true;

      let isHighlighted = true;
      let isDimmed = false;

      if (hoveredNode) {
        const neighbors = nodeNeighborsMap.get(hoveredNode.id);
        isHighlighted = node.id === hoveredNode.id || (neighbors && neighbors.has(node.id));
        isDimmed = !isHighlighted;
      } else if (selectedNodeId) {
        const branch = nodeAncestorsMap.get(selectedNodeId);
        const selectedNeighbors = nodeNeighborsMap.get(selectedNodeId);
        isHighlighted =
          node.id === selectedNodeId ||
          (branch && branch.has(node.id)) ||
          (selectedNeighbors && selectedNeighbors.has(node.id));
        isDimmed = !isHighlighted;
      }

      const group = new THREE.Group();
      const baseVal = node.val || (isFolder ? 8 : 4);

      if (isFolder || isRoot) {
        // Modelo 3D Enriquecido para Pastas/Módulos: Cubo com Arestas Neon e Anel Orbital
        const boxSize = Math.max(6, Math.min(baseVal * 1.3, 20));
        const boxGeo = new THREE.BoxGeometry(boxSize, boxSize, boxSize);
        const boxMat = ((isSearchActive && !isMatched) || isDimmed)
          ? new THREE.MeshBasicMaterial({ color: 0x334155, transparent: true, opacity: 0.2 })
          : new THREE.MeshStandardMaterial({
              color: isRoot ? 0xa855f7 : 0x06b6d4,
              roughness: 0.2,
              metalness: 0.4,
              emissive: isRoot ? 0x7e22ce : 0x0284c7,
              emissiveIntensity: 0.6,
            });

        const mesh = new THREE.Mesh(boxGeo, boxMat);
        group.add(mesh);

        // Anel orbital tridimensional em volta de diretórios
        if (!isDimmed) {
          const ringGeo = new THREE.TorusGeometry(boxSize * 0.9, 0.6, 8, 24);
          const ringMat = new THREE.MeshBasicMaterial({
            color: isRoot ? 0xc084fc : 0x38bdf8,
            transparent: true,
            opacity: 0.6,
          });
          const ringMesh = new THREE.Mesh(ringGeo, ringMat);
          ringMesh.rotation.x = Math.PI / 2;
          group.add(ringMesh);
        }
      } else {
        // Modelo 3D Enriquecido para Arquivos: Esfera Cristalina com emissão rosa
        const sphereRadius = Math.max(4, Math.min(baseVal * 0.9, 12));
        const sphereGeo = new THREE.SphereGeometry(sphereRadius, 20, 20);
        const sphereMat = ((isSearchActive && !isMatched) || isDimmed)
          ? new THREE.MeshBasicMaterial({ color: 0x334155, transparent: true, opacity: 0.2 })
          : new THREE.MeshStandardMaterial({
              color: 0xec4899,
              roughness: 0.25,
              metalness: 0.3,
              emissive: 0xdb2777,
              emissiveIntensity: 0.5,
            });

        const mesh = new THREE.Mesh(sphereGeo, sphereMat);
        group.add(mesh);
      }

      // Rótulo Billboard 3D
      if (!isSearchActive || isMatched) {
        const sprite = createLabelSprite(node.name, node.type, isRoot, isDimmed);
        const offsetY = isFolder ? 14 : 10;
        sprite.position.set(0, offsetY, 0);
        group.add(sprite);
      }

      return group;
    },
    [filterTerm, hoveredNode, selectedNodeId, nodeNeighborsMap, nodeAncestorsMap]
  );

  // 5° Correção: Traços das Arestas Ultra Visíveis, Mais Grossos e Menos Transparentes
  const getLinkColor = useCallback(
    (link) => {
      const sId = typeof link.source === 'object' ? link.source.id : link.source;
      const tId = typeof link.target === 'object' ? link.target.id : link.target;

      if (hoveredNode) {
        const isHoverLink = sId === hoveredNode.id || tId === hoveredNode.id;
        return isHoverLink ? '#38bdf8' : 'rgba(100, 116, 139, 0.3)';
      }

      if (selectedNodeId) {
        const branch = nodeAncestorsMap.get(selectedNodeId);
        const isBranchLink = branch && branch.has(sId) && branch.has(tId);
        return isBranchLink ? '#38bdf8' : 'rgba(100, 116, 139, 0.3)';
      }

      // Aresta nitida e visível com 75% de opacidade
      return 'rgba(148, 163, 184, 0.75)';
    },
    [hoveredNode, selectedNodeId, nodeAncestorsMap]
  );

  const getLinkWidth = useCallback(
    (link) => {
      const sId = typeof link.source === 'object' ? link.source.id : link.source;
      const tId = typeof link.target === 'object' ? link.target.id : link.target;

      if (hoveredNode && (sId === hoveredNode.id || tId === hoveredNode.id)) {
        return 3.5;
      }
      if (selectedNodeId) {
        const branch = nodeAncestorsMap.get(selectedNodeId);
        if (branch && branch.has(sId) && branch.has(tId)) return 3.5;
      }
      return 2.2; // Aumentado para 2.2px para máxima legibilidade
    },
    [hoveredNode, selectedNodeId, nodeAncestorsMap]
  );

  // Reset de Câmera com Posição Inicial Perfeita (Elevada em Y=90, afastada em Z=220, mirada no centro)
  const handleResetCamera = useCallback(() => {
    setSelectedNodeId(null);
    setHoveredNode(null);
    if (fgRef.current) {
      const rootNode = graphData.nodes?.find((n) => n.id === 'root' || !n.parent);
      const target = rootNode ? { x: rootNode.x || 0, y: rootNode.y || 0, z: rootNode.z || 0 } : { x: 0, y: 0, z: 0 };
      fgRef.current.cameraPosition({ x: 0, y: 90, z: 220 }, target, 1200);
    }
  }, [graphData]);

  // Handlers de Filtro por Extensão
  const handleToggleExtension = (ext) => {
    setSelectedExtensions((prev) => {
      const next = new Set(prev);
      if (next.has(ext)) next.delete(ext);
      else next.add(ext);
      return next;
    });
  };

  const handleSelectAllExtensions = () => setSelectedExtensions(new Set(availableExtensions));
  const handleClearAllExtensions = () => setSelectedExtensions(new Set());

  return (
    <div
      className={
        isFullScreen
          ? 'fixed inset-0 top-0 left-0 w-screen h-screen z-[9999] bg-[#060911] m-0 p-0 overflow-hidden'
          : 'relative w-full h-full min-h-[650px] rounded-2xl overflow-hidden border border-slate-800 bg-[#060911] shadow-2xl'
      }
    >
      {/* 8° Correção: Painel Lateral de Filtros Retrátil */}
      <SidebarFilterPanel
        isOpen={isSidebarOpen}
        onToggleOpen={() => setIsSidebarOpen((prev) => !prev)}
        availableExtensions={availableExtensions}
        selectedExtensions={selectedExtensions}
        onToggleExtension={handleToggleExtension}
        onSelectAllExtensions={handleSelectAllExtensions}
        onClearAllExtensions={handleClearAllExtensions}
        autoRotate={autoRotate}
        onToggleAutoRotate={() => setAutoRotate((prev) => !prev)}
        particlesEnabled={particlesEnabled}
        onToggleParticles={() => setParticlesEnabled((prev) => !prev)}
        showGrid={showGrid}
        onToggleShowGrid={() => setShowGrid((prev) => !prev)}
        nodeCount={graphData.nodes?.length || 0}
      />

      {/* Visualizador 3D ForceGraph3D */}
      <ForceGraph3D
        ref={fgRef}
        graphData={graphData}
        nodeThreeObject={nodeThreeObject}
        onNodeClick={(node) => {
          setSelectedNodeId(node.id);
          if (fgRef.current && node) {
            const distance = 80;
            const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);
            fgRef.current.cameraPosition(
              { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
              node,
              1500
            );
          }
          if (onNodeClick) onNodeClick(node);
        }}
        onNodeHover={(node) => setHoveredNode(node || null)}
        onBackgroundClick={() => setSelectedNodeId(null)}
        linkColor={getLinkColor}
        linkWidth={getLinkWidth}
        linkDirectionalParticles={particlesEnabled ? 2 : 0}
        linkDirectionalParticleWidth={2}
        linkDirectionalParticleSpeed={0.006}
        linkDirectionalParticleColor={() => '#38bdf8'}
        warmupTicks={150}
        cooldownTicks={100}
        backgroundColor="#060911"
        showNavInfo={false}
      />

      {/* Botões de Ação overlay (Reset & Tela Cheia) */}
      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 bg-slate-900/80 p-2 rounded-xl border border-slate-800 backdrop-blur-md">
        <button
          onClick={handleResetCamera}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-all"
          title="Centralizar Câmera"
        >
          <Camera className="w-3.5 h-3.5 text-cyan-400" />
          Reset Câmera
        </button>

        {onToggleFullScreen && (
          <button
            onClick={onToggleFullScreen}
            className="px-3 py-1.5 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 hover:bg-cyan-900/60 transition-all shadow-neon-cyan-sm"
            title={isFullScreen ? 'Sair da Tela Cheia' : 'Expandir Tela Cheia'}
          >
            {isFullScreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            {isFullScreen ? 'Sair Tela Cheia' : 'Tela Cheia'}
          </button>
        )}
      </div>

      {/* 10° Correção: Mini-mapa 2D Top-Down no Canto Inferior Direito */}
      <MiniMap graphData={graphData} cameraPos={cameraPos} />
    </div>
  );
}


