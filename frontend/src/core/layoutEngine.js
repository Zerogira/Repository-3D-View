/**
 * src/core/layoutEngine.js
 * Motor matemático v7: Centro Radial Igualitário (360°) + Subúrbios Orgânicos + Bouquet de Arquivos.
 * 
 * - Nível 1: Distribuição igualitária 360° cravada para todos os módulos diretos da raiz,
 *   eliminando a divisão binária em 2 povoados.
 * - Níveis 2+: Expansão direcional em leque em direção às bordas.
 * - Arquivos: Nuvem/Disco Bouquet achatado em 200° virado para fora do centro.
 * - Mantida a categorização por cores funcionais e suporte ao Web Worker.
 */

export const CATEGORIES = {
  FRONTEND: { label: 'Frontend', color: '#60a5fa', exts: ['.jsx', '.tsx', '.vue', '.html', '.css', '.scss', '.less', '.svg'] },
  BACKEND:  { label: 'Backend', color: '#34d399', exts: ['.js', '.ts', '.py', '.java', '.go', '.php', '.c', '.cpp', '.rs', '.rb'] },
  DATABASE: { label: 'Banco de Dados', color: '#fbbf24', exts: ['.sql', '.prisma', '.db', '.sqlite', '.graphql'] },
  CONFIG:   { label: 'Config / Infra', color: '#c084fc', exts: ['.json', '.env', '.yaml', '.yml', '.config.js', '.config.ts', 'package.json', 'Dockerfile'] },
  DOCS:     { label: 'Documentação', color: '#94a3b8', exts: ['.md', '.txt', '.pdf', '.rst', '.license'] },
};

export function getNodeCategoryAndColor(filename, isDir = false) {
  if (isDir) return { category: 'FRONTEND', color: '#22d3ee' };
  if (!filename) return { category: 'DOCS', color: '#f472b6' };

  const nameLower = filename.toLowerCase();
  
  for (const [categoryKey, data] of Object.entries(CATEGORIES)) {
    if (data.exts.some((ext) => nameLower.endsWith(ext) || nameLower.includes(ext))) {
      return { category: categoryKey, color: data.color };
    }
  }
  return { category: 'BACKEND', color: '#f472b6' };
}

export function computeCylindricalLayout(rawNodes, rawLinks) {
  if (!Array.isArray(rawNodes) || rawNodes.length === 0) {
    return { nodes: [], links: [] };
  }

  // 1. Mapeia os nós com cores, categorias e propriedades de peso
  const nodeMap = new Map(
    rawNodes.map((node) => {
      const isDir = node.type === 'dir' || node.type === 'folder';
      const catInfo = getNodeCategoryAndColor(node.name || node.id, isDir);
      const color = node.color || catInfo.color;
      const category = node.category || catInfo.category;
      return [
        node.id,
        { ...node, color, category, isDir, children: [], depth: 0, weight: 1, fileCount: 0 },
      ];
    })
  );

  // 2. Mapeia conexões (Pai -> Filhos)
  const links = Array.isArray(rawLinks) ? rawLinks : [];
  links.forEach((link) => {
    if (!link) return;
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
    if (nodeMap.has(sourceId) && nodeMap.has(targetId)) {
      nodeMap.get(sourceId).children.push(targetId);
      nodeMap.get(targetId).parentId = sourceId;
    }
  });

  const rootNode = nodeMap.get('root') || Array.from(nodeMap.values())[0]; 
  if (!rootNode) return { nodes: [], links: [] };

  // 3. Calcula Massa (Weight) e Contagem de Arquivos
  function calculateWeights(nodeId) {
    const node = nodeMap.get(nodeId);
    if (!node) return 1;
    let weight = 1;
    let fileCount = 0;
    
    node.children.forEach((childId) => {
      const child = nodeMap.get(childId);
      if (child) {
        if (!child.isDir) fileCount++;
        weight += calculateWeights(childId);
      }
    });
    
    node.weight = weight;
    node.fileCount = fileCount;
    return weight;
  }
  calculateWeights(rootNode.id);

  // 4. Calcula Profundidade (BFS)
  let queue = [rootNode];
  let visited = new Set([rootNode.id]);
  while (queue.length > 0) {
    let current = queue.shift();
    current.children.forEach((childId) => {
      if (!visited.has(childId)) {
        let child = nodeMap.get(childId);
        if (child) {
          child.depth = current.depth + 1;
          visited.add(childId);
          queue.push(child);
        }
      }
    });
  }

  const CONFIG = {
    ROOT_Y: 100,
    BASE_MODULE_RADIUS: 80, // Raio do anel central igualitário
  };

  rootNode.x = 0;
  rootNode.y = CONFIG.ROOT_Y;
  rootNode.z = 0;

  const randomJitter = (spread) => (Math.random() - 0.5) * spread;
  const maxDepth = Math.max(...Array.from(nodeMap.values()).map((n) => n.depth || 0));

  for (let d = 1; d <= maxDepth; d++) {
    const nodesAtDepth = Array.from(nodeMap.values()).filter((n) => n.depth === d);
    
    const parentGroups = {};
    nodesAtDepth.forEach((node) => {
      const pId = node.parentId || rootNode.id;
      if (!parentGroups[pId]) parentGroups[pId] = { folders: [], files: [] };
      if (node.isDir) parentGroups[pId].folders.push(node);
      else parentGroups[pId].files.push(node);
    });

    Object.keys(parentGroups).forEach((parentId) => {
      const parent = nodeMap.get(parentId) || rootNode;
      const { folders, files } = parentGroups[parentId];
      
      // ==========================================
      // A. LAYOUT DAS PASTAS (Ponto Doce Ajustado)
      // ==========================================
      const totalFolderWeight = folders.reduce((sum, f) => sum + f.weight, 0);
      let accumulatedWeight = 0;

      folders.forEach((node, index) => {
        const midWeight = accumulatedWeight + node.weight / 2;
        accumulatedWeight += node.weight;

        if (d === 1) {
          const angle = (index / Math.max(1, folders.length)) * (Math.PI * 2);

          // Ponto Doce Nível 1: Base 80 + multiplicador 7
          const pushDistance = 80 + Math.sqrt(node.weight) * 7;

          node.x = Math.cos(angle) * pushDistance;
          node.z = Math.sin(angle) * pushDistance;
          node.y = parent.y + (index % 2 === 0 ? 25 : -25) + randomJitter(10);
        } else {
          // NÍVEIS 2+: Subúrbios em Leque
          const angleFromCenter = Math.atan2(parent.z, parent.x);
          const maxSpread = Math.min(Math.PI * 1.2, 0.6 + folders.length * 0.15);
          const proportion = totalFolderWeight > 0 ? midWeight / totalFolderWeight - 0.5 : 0;
          const spreadAngle = angleFromCenter + proportion * maxSpread;

          // Ponto Doce Níveis 2+: Base 45 + multiplicadores ajustados (5 e 8)
          const pushDistance = 45 + Math.sqrt(parent.weight) * 5 + Math.sqrt(node.weight) * 8;

          node.x = parent.x + Math.cos(spreadAngle) * pushDistance;
          node.z = parent.z + Math.sin(spreadAngle) * pushDistance;

          // Oscilação vertical moderada (30 / -30)
          node.y = parent.y + (index % 2 === 0 ? 30 : -30) + randomJitter(15);
        }
      });

      // ==========================================
      // B. LAYOUT DOS ARQUIVOS (Pilar de Dados / Data Column)
      // ==========================================
      const fileCount = files.length;
      if (fileCount > 0) {
        let filesPlaced = 0;
        let currentRing = 1;

        while (filesPlaced < fileCount) {
          // Quantidade de arquivos por andar (anel)
          const filesInThisRing = Math.min(8, fileCount - filesPlaced);

          // O raio é curto e fixo para ficar colado na pasta mãe
          const ringRadius = 15;

          for (let i = 0; i < filesInThisRing; i++) {
            const node = files[filesPlaced + i];

            // Espalha no círculo (360º)
            const angle = (i / filesInThisRing) * (Math.PI * 2);

            // X e Z ficam colados na pasta mãe
            node.x = parent.x + Math.cos(angle) * ringRadius;
            node.z = parent.z + Math.sin(angle) * ringRadius;

            // EMPILHAMENTO VERTICAL (Eixo Y):
            // Cada "currentRing" é um andar do prédio, subindo 12 unidades por vez
            node.y = parent.y + 12 + currentRing * 12;
          }

          filesPlaced += filesInThisRing;
          currentRing++;
        }
      }
    });
  }

  // === CÁLCULO DA BOUNDING BOX E MÉTRICAS ESPACIAIS DINÂMICAS ===
  let minY = Infinity;
  let maxRadius = 0;

  nodeMap.forEach((node) => {
    if (typeof node.y === 'number' && node.y < minY) {
      minY = node.y;
    }
    // Distância radial no plano XZ a partir da origem (0,0)
    const r = Math.hypot(node.x || 0, node.z || 0);
    if (r > maxRadius) {
      maxRadius = r;
    }
  });

  if (!isFinite(minY)) minY = 0;
  if (maxRadius < 100) maxRadius = 150;

  // Tamanho do chão proporcional ao nó mais distante + folga de respiro (+ 40%)
  const gridRadius = Math.ceil(maxRadius * 2.8);
  
  // Limite dinâmico da câmera e nevoeiro proporcional ao tamanho real da galáxia carregada
  const fogStart = Math.ceil(maxRadius * 1.5);
  const fogEnd = Math.ceil(maxRadius * 3.5);
  const maxCameraDistance = Math.ceil(maxRadius * 3.2);

  return {
    nodes: Array.from(nodeMap.values()),
    links: links,
    layoutInfo: {
      minY,
      maxRadius,
      gridRadius,
      fogStart,
      fogEnd,
      maxCameraDistance,
    },
  };
}
