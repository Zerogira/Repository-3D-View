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
      // A. LAYOUT DAS PASTAS
      // ==========================================
      folders.forEach((node, index) => {
        if (d === 1) {
          // NÍVEL 1: Distribuição Igualitária 360° em Anel Perfeito
          // Todos os módulos principais ocupam fatias iguais do anel, eliminando desequilíbrio do centro.
          const angle = (index / Math.max(1, folders.length)) * (Math.PI * 2);
          
          // O peso é usado exclusivamente para afastar suavemente as pastas mais densas.
          const pushDistance = CONFIG.BASE_MODULE_RADIUS + Math.sqrt(node.weight) * 4.5;
          
          node.x = Math.cos(angle) * pushDistance;
          node.z = Math.sin(angle) * pushDistance;
          node.y = parent.y + (index % 2 === 0 ? 25 : -25) + randomJitter(10); // Ondulação vertical suave
        } else {
          // NÍVEIS 2+: Subúrbios Orgânicos Direcionais
          const angleFromCenter = Math.atan2(parent.z || 0.1, parent.x || 0.1);
          const maxSpread = 1.6;
          
          const proportion = folders.length > 1 ? (index / (folders.length - 1)) - 0.5 : 0;
          const spreadAngle = angleFromCenter + (proportion * maxSpread);
          
          const pushDistance = 45 + Math.sqrt(node.weight) * 3 + Math.sqrt(parent.weight) * 1.5;
          node.x = parent.x + Math.cos(spreadAngle) * pushDistance;
          node.z = parent.z + Math.sin(spreadAngle) * pushDistance;
          node.y = parent.y + randomJitter(15);
        }
      });

      // ==========================================
      // B. LAYOUT DOS ARQUIVOS (Efeito Bouquet Achatado)
      // ==========================================
      const fileCount = files.length;
      if (fileCount > 0) {
        const dynamicClusterRadius = 18 + Math.pow(fileCount, 0.6) * 3.5;
        const isRoot = parent.depth === 0;
        const outwardAngle = isRoot ? 0 : Math.atan2(parent.z, parent.x);

        files.forEach((node) => {
          let theta, phi;

          if (isRoot) {
            // Arquivos soltos na raiz formam uma nuvem esférica no centro
            theta = Math.random() * 2 * Math.PI;
            phi = Math.acos(2 * Math.random() - 1);
          } else {
            // Bouquet Orgânico: Nascem voltados para fora em leque de ~216°
            const spreadArc = Math.PI * 1.2; 
            theta = outwardAngle + (Math.random() - 0.5) * spreadArc;
            // Mantém os arquivos no cinturão do equador da pasta (0.3 a 0.7 PI)
            phi = (0.3 + 0.4 * Math.random()) * Math.PI;
          }
          
          const r = dynamicClusterRadius * (0.5 + 0.5 * Math.random()); 
          node.x = parent.x + r * Math.sin(phi) * Math.cos(theta);
          node.y = parent.y + (r * Math.cos(phi)) * 0.65; // Achatamento do disco em Y
          node.z = parent.z + r * Math.sin(phi) * Math.sin(theta);
        });
      }
    });
  }

  return { nodes: Array.from(nodeMap.values()), links: links };
}
