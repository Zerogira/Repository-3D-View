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

/**
 * Calcula o raio da "Zona de Exclusão" de uma pasta:
 * Leva em consideração o raio orbital máximo que seus arquivos diretos ocuparão
 * mais o número de subpastas, garantindo que suas órbitas nunca colidam.
 */
export function getFolderExclusionRadius(fileCount = 0, subfolderCount = 0) {
  if (fileCount === 0) return Math.max(38, subfolderCount * 14);
  const baseOrbitRadius = Math.max(38, (fileCount * 3.4) / 1.5);
  const ringCount = Math.ceil(fileCount / 14);
  const maxOrbitRadius = baseOrbitRadius + (ringCount - 1) * 22;
  return maxOrbitRadius + 30; // Margem de segurança livre de colisão
}

/**
 * Formata bytes em string legível (B, KB, MB, GB)
 */
export function formatBytes(bytes = 0) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Identifica e enriquece nós que atuam como Super Nós:
 * - Diretórios com contagem de arquivos >= threshold (padrão 25)
 * - Ou pastas hiperdensas específicas (ex: node_modules, dist, vendor, packages com >= 12 arquivos)
 * - Calcula metadados agregados (totalFiles, totalSize, formattedSize, extensionStats, items)
 */
export function enrichSuperNodes(nodeMap, threshold = 15) {
  const denseFolderNames = new Set([
    'node_modules', 'dist', 'build', 'vendor', 'packages', 'assets', 'static', 'lib', 'docs', 'tests', 'test', 'locale', 'locales', 'translations', 'internal'
  ]);

  let superCount = 0;

  nodeMap.forEach((node) => {
    // Ignora arquivos e o nó raiz principal do repositório
    if (!node.isDir || node.id === 'root' || node.isRoot) return;

    const lowerName = (node.name || '').toLowerCase();
    const isSpecialDenseName = denseFolderNames.has(lowerName);
    const effectiveThreshold = isSpecialDenseName ? 8 : threshold;

    const directCount = typeof node.fileCount === 'number' ? node.fileCount : 0;
    const shouldBeSuperNode =
      node.isSuperNode ||
      node.is_super_node ||
      directCount >= effectiveThreshold;

    if (shouldBeSuperNode) {
      node.isSuperNode = true;
      superCount++;
      node.color = '#f59e0b'; // Cor âmbar neon estelar oficial de Super Nós
      node.superNodeColor = '#f59e0b';

      // Coleta arquivos filhos deste diretório a partir do nodeMap e marca para NÃO explodir no 3D
      const folderPath = node.path || node.id || '';
      const childFiles = [];
      let totalSize = 0;
      const extCounts = {};

      // Pacotes maciços de dependências ou vendor condensam subpastas inteiras recursivamente
      const isVendorBundle = lowerName === 'node_modules' || lowerName === 'vendor' || lowerName === 'dist';

      nodeMap.forEach((item) => {
        if (item.isDir) return;
        const isDirectChild = item.parentId === node.id || item.parent === node.id;
        const isNestedChild = item.path && item.path.startsWith(folderPath + '/');

        if (isDirectChild || (isVendorBundle && isNestedChild)) {
          childFiles.push(item);
          item.isCondensed = true; // MARCA O ARQUIVO COMO CONDENSADO (EXCLUÍDO DO CANVAS 3D)
          totalSize += item.size || 0;
          const name = item.name || '';
          const dotIdx = name.lastIndexOf('.');
          const ext = dotIdx !== -1 ? name.slice(dotIdx).toLowerCase() : 'sem ext';
          extCounts[ext] = (extCounts[ext] || 0) + 1;
        }
      });

      const totalFilesCount = Math.max(directCount, childFiles.length);
      node.fileCount = totalFilesCount;
      node.totalSize = totalSize;
      node.formattedSize = formatBytes(totalSize);
      node.formattedFileCount = totalFilesCount >= 1000 
        ? `${(totalFilesCount / 1000).toFixed(1)}k`
        : `${totalFilesCount}`;

      // Top 5 extensões
      node.extensionStats = Object.entries(extCounts)
        .map(([ext, count]) => {
          const percentage = totalFilesCount > 0 ? Math.round((count / totalFilesCount) * 100) : 0;
          const catInfo = getNodeCategoryAndColor(ext, false);
          return {
            ext,
            count,
            percentage,
            color: catInfo.color || '#38bdf8',
          };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      if (childFiles.length > 0) {
        node.items = childFiles;
      }

      // Geometria diferenciada com raio dinâmico mais imponente
      node.visualRadius = Math.min(26.0, 12.0 + Math.sqrt(totalFilesCount) * 1.6);
      node.radius = node.visualRadius;
    }
  });

  return superCount;
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

  // 3. Calcula Massa (Weight), Contagem de Arquivos e Raio Dinâmico por Volume
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

    // Escala dinâmica suave baseada em raiz quadrada do volume de arquivos
    if (node.isDir) {
      const isRoot = node.id === 'root' || node.depth === 0;
      node.visualRadius = isRoot ? 14.0 : Math.min(22.0, 7.5 + Math.sqrt(fileCount) * 1.8);
      node.radius = node.visualRadius;
    } else {
      node.visualRadius = 1.6;
      node.radius = 1.6;
    }

    return weight;
  }
  calculateWeights(rootNode.id);

  // 4. Calcula Profundidade (BFS) e Herança de Cores por Ramo (Branch Coloring)
  // O nó raiz é o Sol central do sistema: amarelo estelar vibrante
  const rootChildren = rootNode.children || [];
  const totalRootBranches = Math.max(1, rootChildren.length);
  
  rootNode.isRoot = true;
  rootNode.branchColor = '#facc15'; // Amarelo Dourado Sol Solar
  rootNode.color = '#facc15';
  rootNode.depth = 0;

  rootChildren.forEach((childId, idx) => {
    const child = nodeMap.get(childId);
    if (child) {
      const hue = Math.round((idx / totalRootBranches) * 360);
      child.branchColor = `hsl(${hue}, 85%, 60%)`;
      if (child.isDir) {
        child.color = child.branchColor;
      }
    }
  });

  let queue = [rootNode];
  let visited = new Set([rootNode.id]);
  while (queue.length > 0) {
    let current = queue.shift();
    current.children.forEach((childId) => {
      if (!visited.has(childId)) {
        let child = nodeMap.get(childId);
        if (child) {
          child.depth = current.depth + 1;
          // Herança da cor do ramo pai
          if (!child.branchColor) {
            child.branchColor = current.branchColor || '#38bdf8';
          }
          // Todos os nós (pastas e arquivos) herdam a cor da sua ramificação principal
          child.color = child.branchColor;

          visited.add(childId);
          queue.push(child);
        }
      }
    });
  }

  // 5. Enriquecimento de Super Nós (Executado após BFS para garantir integridade hierárquica)
  enrichSuperNodes(nodeMap);

  const CONFIG = {
    ROOT_Y: 200,
    DEPTH_Y_STEP: 180, // Expansão vertical das camadas (evita colisão de saias e cones)
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
      else if (!node.isCondensed) parentGroups[pId].files.push(node);
    });

    Object.keys(parentGroups).forEach((parentId) => {
      const parent = nodeMap.get(parentId) || rootNode;
      const { folders, files } = parentGroups[parentId];
      
      // =========================================================================
      // A. LAYOUT DAS PASTAS: ZONAS DE EXCLUSÃO + EXPANSÃO VERTICAL EM NÍVEIS
      // =========================================================================
      const totalFolderWeight = folders.reduce((sum, f) => sum + f.weight, 0);
      let accumulatedWeight = 0;

      // Calcula o perímetro necessário para acomodar confortavelmente todas as zonas de exclusão no Nível 1
      const totalExclusionDiameters = folders.reduce((sum, f) => {
        return sum + getFolderExclusionRadius(f.fileCount, (f.children || []).length) * 2.5;
      }, 0);
      const minLevel1Ring = Math.max(220, totalExclusionDiameters / (Math.PI * 2));

      folders.forEach((node, index) => {
        const midWeight = accumulatedWeight + node.weight / 2;
        accumulatedWeight += node.weight;

        // Expansão Vertical Proporcional à Profundidade (node.y = -(depth * step))
        const baseLayerY = CONFIG.ROOT_Y - (node.depth * CONFIG.DEPTH_Y_STEP);
        const staggerY = (index % 2 === 0 ? 30 : -30) + randomJitter(15);

        if (d === 1) {
          const angle = (index / Math.max(1, folders.length)) * (Math.PI * 2);
          const myExclusion = getFolderExclusionRadius(node.fileCount, (node.children || []).length);

          // Espaçamento Dinâmico: Base no anel expandido + zona de exclusão individual da pasta
          const pushDistance = Math.max(minLevel1Ring, 160 + myExclusion * 1.3);

          node.x = Math.cos(angle) * pushDistance;
          node.z = Math.sin(angle) * pushDistance;
          node.y = baseLayerY + staggerY;
        } else {
          // NÍVEIS 2+: Subúrbios em Leque com Zonas de Exclusão e Raio Proporcional a Descendentes
          const angleFromCenter = Math.atan2(parent.z, parent.x);
          const maxSpread = Math.min(Math.PI * 1.4, 0.8 + folders.length * 0.25);
          const proportion = totalFolderWeight > 0 ? midWeight / totalFolderWeight - 0.5 : 0;
          const spreadAngle = angleFromCenter + proportion * maxSpread;

          // Espaçamento Dinâmico: Proporcional à quantidade de descendentes e raio de exclusão
          const parentExclusion = getFolderExclusionRadius(parent.fileCount, (parent.children || []).length);
          const childExclusion = getFolderExclusionRadius(node.fileCount, (node.children || []).length);
          const weightBoost = Math.min(100, (node.weight || 1) * 3.5);
          const pushDistance = parentExclusion + childExclusion + 60 + weightBoost;

          node.x = parent.x + Math.cos(spreadAngle) * pushDistance;
          node.z = parent.z + Math.sin(spreadAngle) * pushDistance;
          node.y = baseLayerY + staggerY;
        }
      });

      // ==========================================
      // B. LAYOUT DOS ARQUIVOS (Dispersão Dinâmica Proporcional ao Perímetro)
      // Se a pasta for Super Nó, seus arquivos NÃO explodem no 3D (ficam no painel 2D)
      // ==========================================
      if (!parent.isSuperNode) {
        const activeFiles = files.filter((f) => !f.isCondensed);
        const fileCount = activeFiles.length;
        if (fileCount > 0) {
          const dynamicBaseRadius = Math.max(34, (fileCount * 3.5) / 1.5);
          const filesPerFloor = Math.min(16, Math.max(8, Math.floor(dynamicBaseRadius / 3.5)));

          let filesPlaced = 0;
          let currentRing = 1;

          while (filesPlaced < fileCount) {
            const filesInThisRing = Math.min(filesPerFloor, fileCount - filesPlaced);
            const ringRadius = dynamicBaseRadius + (currentRing - 1) * 6;

            for (let i = 0; i < filesInThisRing; i++) {
              const node = activeFiles[filesPlaced + i];
              const angle = (i / filesInThisRing) * (Math.PI * 2);

              node.x = parent.x + Math.cos(angle) * ringRadius;
              node.z = parent.z + Math.sin(angle) * ringRadius;
              node.y = parent.y + 24 + currentRing * 16;
            }

            filesPlaced += filesInThisRing;
            currentRing++;
          }
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

  // Filtra nós do 3D: exclui arquivos condensados em Super Nós (lidos exclusivamente no Drawer 2D)
  const visibleNodes = Array.from(nodeMap.values()).filter((n) => !n.isCondensed);
  const visibleNodeIds = new Set(visibleNodes.map((n) => n.id));
  const visibleLinks = links.filter((l) => {
    const src = typeof l.source === 'object' ? l.source.id : l.source;
    const tgt = typeof l.target === 'object' ? l.target.id : l.target;
    return visibleNodeIds.has(src) && visibleNodeIds.has(tgt);
  });

  return {
    nodes: visibleNodes,
    links: visibleLinks,
    superNodeCount: visibleNodes.filter((n) => n.isSuperNode).length,
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

/**
 * Predefinição 2: Layout Universe / Órbitas Planetárias
 * 
 * - Pastas atuam como Planetas/Estrelas principais distribuídos em sistemas estelares.
 * - Arquivos orbitam suas pastas-mães em anéis concêntricos (Math.cos / Math.sin),
 *   formando sistemas planetários e cinturões de asteroides/luas de código.
 * - Fornece também uma lista de 'orbitRings' para desenhar as linhas de órbita (anéis torus/line).
 */
export function computeUniverseLayout(rawNodes, rawLinks) {
  // Começamos calculando a estrutura básica e os centros das pastas
  const baseLayout = computeCylindricalLayout(rawNodes, rawLinks);
  const nodes = baseLayout.nodes;
  const links = baseLayout.links;

  if (!nodes.length) return baseLayout;

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const folderNodes = nodes.filter((n) => n.isDir);
  const orbitRings = [];

  folderNodes.forEach((parent) => {
    // Busca arquivos filhos diretos deste diretório
    const files = (parent.children || [])
      .map((id) => nodeMap.get(id))
      .filter((n) => n && !n.isDir);

    const fileCount = files.length;
    if (fileCount === 0) return;

    // Distribuição orbital com expansão dinâmica por perímetro
    // Se a pasta tiver 100 arquivos, o raio se expande massivamente para dar respiro
    const minOrbitRadius = Math.max(34, (fileCount * 3.2) / 1.5);
    const ringSpacing = 20 + Math.min(15, fileCount * 0.15);

    let filesPlaced = 0;
    let r = 0;

    while (filesPlaced < fileCount) {
      const ringRadius = minOrbitRadius + r * ringSpacing;
      // Quantidade de bolinhas suportadas neste anel proporcional à circunferência
      const filesPerRing = Math.max(10, Math.floor((ringRadius * Math.PI * 2) / 24));
      const countInThisRing = Math.min(filesPerRing, fileCount - filesPlaced);

      orbitRings.push({
        parentId: parent.id,
        x: parent.x || 0,
        y: parent.y || 0,
        z: parent.z || 0,
        radius: ringRadius,
        color: parent.branchColor || parent.color || '#38bdf8',
      });

      // Inclinação suave do plano orbital individual de cada pasta para dar profundidade cósmica
      const tiltX = ((parent.id.charCodeAt(0) || 0) % 5 - 2) * 0.08;
      const tiltZ = ((parent.id.charCodeAt(parent.id.length - 1) || 0) % 5 - 2) * 0.08;

      for (let i = 0; i < countInThisRing; i++) {
        const fileNode = files[filesPlaced + i];
        const angle = (i / countInThisRing) * (Math.PI * 2);

        const localX = Math.cos(angle) * ringRadius;
        const localZ = Math.sin(angle) * ringRadius;
        const localY = localX * tiltX + localZ * tiltZ;

        fileNode.x = (parent.x || 0) + localX;
        fileNode.y = (parent.y || 0) + localY;
        fileNode.z = (parent.z || 0) + localZ;
        fileNode.orbitRadius = ringRadius;
        fileNode.orbitAngle = angle;
      }

      filesPlaced += countInThisRing;
      r++;
    }
  });

  // Recalcula bounding box espacial e horizontes
  let minY = Infinity;
  let maxRadius = 0;

  nodes.forEach((node) => {
    if (typeof node.y === 'number' && node.y < minY) minY = node.y;
    const r = Math.hypot(node.x || 0, node.z || 0);
    if (r > maxRadius) maxRadius = r;
  });

  if (!isFinite(minY)) minY = 0;
  if (maxRadius < 100) maxRadius = 150;

  const gridRadius = Math.ceil(maxRadius * 2.8);
  const fogStart = Math.ceil(maxRadius * 1.5);
  const fogEnd = Math.ceil(maxRadius * 3.5);
  const maxCameraDistance = Math.ceil(maxRadius * 3.2);

  return {
    nodes,
    links,
    orbitRings,
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

/**
 * =============================================================================
 * GALAXY SOLAR (Radial Tree 2.5D - Sistema Solar Trigonométrico Plano)
 * =============================================================================
 * - Raiz no centro exato: X: 0, Y: 0, Z: 0.
 * - Profundidade dita o raio orbital: radius = depth * 55 (com espaçamento progressivo).
 * - Eixo Y quase plano com ruído sutil anti Z-fighting: Y = (Math.random() - 0.5) * 8.
 * - Distribuição trigonométrica em leque/pizza sem cruzamento de galhos.
 * - Herança de Cor Estrita: Filhos diretos da raiz (Nível 1) ganham matiz única HSL 360°,
 *   e todos os subdiretórios e arquivos descendentes herdam a mesma cor do seu setor.
 * - Arquivos folha formam anéis/aglomerados orbitais próximos de sua respectiva pasta pai.
 */
export function computeSolarLayout(rawNodes, rawLinks) {
  if (!Array.isArray(rawNodes) || rawNodes.length === 0) {
    return { nodes: [], links: [] };
  }

  // 1. Mapeamento de nós básicos
  const nodeMap = new Map(
    rawNodes.map((node) => {
      const isDir = node.type === 'dir' || node.type === 'folder';
      return [
        node.id,
        {
          ...node,
          isDir,
          children: [],
          depth: 0,
          weight: 1,
          fileCount: 0,
        },
      ];
    })
  );

  // 2. Mapeamento de conexões (Pai -> Filhos)
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

  // 3. Cálculo de Pesos e Contagem de Arquivos/Subdiretórios
  function calculateTreeWeights(nodeId) {
    const node = nodeMap.get(nodeId);
    if (!node) return 1;
    let weight = 1;
    let fileCount = 0;

    node.children.forEach((childId) => {
      const child = nodeMap.get(childId);
      if (child) {
        if (!child.isDir) fileCount++;
        weight += calculateTreeWeights(childId);
      }
    });

    node.weight = weight;
    node.fileCount = fileCount;

    // Escala dinâmica suave baseada em raiz quadrada do volume de arquivos
    if (node.isDir) {
      const isRoot = node.id === 'root' || node.depth === 0;
      node.visualRadius = isRoot ? 14.0 : Math.min(22.0, 7.5 + Math.sqrt(fileCount) * 1.8);
      node.radius = node.visualRadius;
    } else {
      node.visualRadius = 1.6;
      node.radius = 1.6;
    }

    return weight;
  }
  calculateTreeWeights(rootNode.id);

  // 4. Configuração do Nó Raiz (Sol Central)
  rootNode.isRoot = true;
  rootNode.depth = 0;
  rootNode.x = 0;
  rootNode.y = 0;
  rootNode.z = 0;
  rootNode.color = '#facc15';
  rootNode.branchColor = '#facc15';
  rootNode.visualRadius = 14.0;
  rootNode.radius = 14.0;

  // 5. Herança Cromática por Setores (Nível 1 define o setor da galáxia)
  const rootChildren = rootNode.children || [];
  const level1Folders = rootChildren
    .map((id) => nodeMap.get(id))
    .filter((n) => n && n.isDir);
  const level1Files = rootChildren
    .map((id) => nodeMap.get(id))
    .filter((n) => n && !n.isDir);

  const totalSectors = Math.max(1, level1Folders.length);

  // Paleta vibrante e contrastante para os setores planetários
  level1Folders.forEach((folder, idx) => {
    const hue = Math.round((idx / totalSectors) * 360);
    const sectorColor = `hsl(${hue}, 88%, 62%)`;
    folder.branchColor = sectorColor;
    folder.color = sectorColor;
  });

  // Arquivos diretos da raiz ficam dourados/neutros
  level1Files.forEach((file) => {
    file.branchColor = '#fef08a';
    file.color = '#fef08a';
  });

  // Propagação BFS de profundidade e cor de setor para todos os descendentes
  const queue = [rootNode];
  const visited = new Set([rootNode.id]);

  while (queue.length > 0) {
    const current = queue.shift();
    (current.children || []).forEach((childId) => {
      if (!visited.has(childId)) {
        const child = nodeMap.get(childId);
        if (child) {
          child.depth = current.depth + 1;
          // Herda estritamente a cor do ramo pai
          child.branchColor = child.branchColor || current.branchColor || '#38bdf8';
          child.color = child.branchColor;
          visited.add(childId);
          queue.push(child);
        }
      }
    });
  }

  // Enriquecimento de Super Nós executado após BFS
  enrichSuperNodes(nodeMap);

  // 6. Alocação Angular com "Camadas de Elétrons" e Sistema de Luas Locais
  const orbitRings = [];

  function layoutSubtree(node, startAngle, endAngle) {
    const children = (node.children || []).map((id) => nodeMap.get(id)).filter(Boolean);
    if (!children.length) return;

    const subFolders = children.filter((c) => c.isDir);
    const subFiles = children.filter((c) => !c.isDir);

    // =========================================================================
    // A. SUBPASTAS: Sweep Angle Allocation com Ângulo Mínimo & Padding de Fatias
    // =========================================================================
    if (subFolders.length > 0) {
      const isRoot = node.depth === 0;
      const angleSpan = endAngle - startAngle;

      // 1. Expansão Radial Agressiva (Progressive Depth Step):
      // Garante que órbitas profundas se abram amplamente e tenham espaço para seus leques
      // depth 0 = Raiz (0)
      // depth 1 = 195 (espaço amplo ao redor do sol)
      // depth 2 = 195 + 120 + 25 = 340
      // depth 3 = 195 + 240 + 75 = 510
      const depth = (node.depth || 0) + 1;
      const baseDistance = 85 + (depth * 105) + (depth * depth * 15);

      // 2. Garantia de Ângulo Mínimo & Padding entre Fatias (Proteção de Minorias)
      const numFolders = subFolders.length;
      // Gap vazio entre as fatias para criar corredores de respiro (2.5° na raiz, 1.5° nos subníveis)
      const gapRad = (numFolders > 1) ? Math.min(0.06, (isRoot ? 0.045 : 0.025)) : 0;
      const totalGaps = numFolders * gapRad;
      const usableSpan = Math.max(0.1, angleSpan - totalGaps);

      // Ângulo mínimo por fatia: pelo menos 14° (~0.24 rad) no Nível 1 ou proporção segura
      const minAngleRad = isRoot 
        ? Math.min(0.26, usableSpan / (numFolders * 1.2)) 
        : Math.min(0.18, usableSpan / (numFolders * 1.1));

      // Calcula pesos individuais
      const weights = subFolders.map((f) => Math.max(1, f.weight || 1));
      const totalWeight = weights.reduce((sum, w) => sum + w, 0);

      // Distribuição proporcional com clamping de mínimo
      let assignedSpans = weights.map((w) => (w / totalWeight) * usableSpan);

      // Ajuste iterativo: se algum galho ficou abaixo do mínimo, força o mínimo e reequilibra
      let deficit = 0;
      let flexibleWeight = 0;

      for (let i = 0; i < numFolders; i++) {
        if (assignedSpans[i] < minAngleRad) {
          deficit += minAngleRad - assignedSpans[i];
          assignedSpans[i] = minAngleRad;
        } else {
          flexibleWeight += weights[i];
        }
      }

      // Subtrai o déficit dos ramos grandes que têm espaço de sobra
      if (deficit > 0 && flexibleWeight > 0) {
        for (let i = 0; i < numFolders; i++) {
          if (assignedSpans[i] > minAngleRad) {
            const share = weights[i] / flexibleWeight;
            assignedSpans[i] = Math.max(minAngleRad, assignedSpans[i] - deficit * share);
          }
        }
      }

      let currentAngle = startAngle;

      subFolders.forEach((folder, idx) => {
        const childSpan = assignedSpans[idx];
        const childAngle = currentAngle + childSpan / 2;

        // Leve alternância radial (stagger) para desobstruir planetas vizinhos
        const staggerRadius = (idx % 2 === 1) ? 28 : 0;
        const finalRadius = baseDistance + staggerRadius;

        folder.x = Math.cos(childAngle) * finalRadius;
        folder.y = (Math.random() - 0.5) * 6; // Quase plano no Y anti Z-fighting
        folder.z = Math.sin(childAngle) * finalRadius;

        // Recursão para a subárvore da pasta dentro de sua fatia angular dedicada
        layoutSubtree(folder, currentAngle, currentAngle + childSpan);

        // Avança o ângulo somando a fatia + o corredor vazio (padding)
        currentAngle += childSpan + gapRad;
      });
    }

    // =========================================================================
    // B. ARQUIVOS: Empacotamento de Luas Estritamente Confinadas
    // Se a pasta for Super Nó, seus arquivos NÃO geram órbitas nem luas em 3D!
    // =========================================================================
    if (subFiles.length > 0 && !node.isSuperNode) {
      const activeSubFiles = subFiles.filter((f) => !f.isCondensed);
      const fileCount = activeSubFiles.length;
      if (fileCount > 0) {
        const parentX = node.x || 0;
        const parentY = node.y || 0;
        const parentZ = node.z || 0;

        // O raio da órbita das luas começa logo após o corpo do planeta pai
        const parentBodyRadius = node.visualRadius || 7.5;
        const moonBaseOrbit = parentBodyRadius + 7.0;
        const moonRingSpacing = 7.5;
        const maxAllowedMoonRadius = 45;

        let filesPlaced = 0;
        let ringIndex = 0;

        while (filesPlaced < fileCount) {
          const calculatedRadius = moonBaseOrbit + ringIndex * moonRingSpacing;
          const currentRingRadius = Math.min(maxAllowedMoonRadius, calculatedRadius);
          
          const capacity = Math.max(6, Math.floor((currentRingRadius * Math.PI * 2) / 8.0));
          const countInRing = Math.min(capacity, fileCount - filesPlaced);

          orbitRings.push({
            parentId: node.id,
            x: parentX,
            y: parentY,
            z: parentZ,
            radius: currentRingRadius,
            color: node.branchColor || node.color || '#38bdf8',
          });

          for (let i = 0; i < countInRing; i++) {
            const file = activeSubFiles[filesPlaced + i];
            const fileAngle = (i / countInRing) * (Math.PI * 2) + (ringIndex * 0.5);

            file.x = parentX + Math.cos(fileAngle) * currentRingRadius;
            file.y = parentY + (Math.random() - 0.5) * 4;
            file.z = parentZ + Math.sin(fileAngle) * currentRingRadius;
            file.orbitRadius = currentRingRadius;
            file.orbitAngle = fileAngle;
          }

          filesPlaced += countInRing;
          ringIndex++;
        }
      }
    }
  }

  // Inicia distribuição a 360° a partir do Sol central
  layoutSubtree(rootNode, 0, Math.PI * 2);

  // 7. Bounding Box e Métricas de Câmera
  let minY = Infinity;
  let maxRadius = 0;
  const nodes = Array.from(nodeMap.values());

  nodes.forEach((node) => {
    if (typeof node.y === 'number' && node.y < minY) minY = node.y;
    const r = Math.hypot(node.x || 0, node.z || 0);
    if (r > maxRadius) maxRadius = r;
  });

  if (!isFinite(minY)) minY = 0;
  if (maxRadius < 100) maxRadius = 150;

  const gridRadius = Math.ceil(maxRadius * 2.5);
  const fogStart = Math.ceil(maxRadius * 1.5);
  const fogEnd = Math.ceil(maxRadius * 3.5);
  const maxCameraDistance = Math.ceil(maxRadius * 3.2);

  // Filtra nós do 3D: exclui arquivos condensados em Super Nós
  const visibleNodes = Array.from(nodeMap.values()).filter((n) => !n.isCondensed);
  const visibleNodeIds = new Set(visibleNodes.map((n) => n.id));
  const visibleLinks = links.filter((l) => {
    const src = typeof l.source === 'object' ? l.source.id : l.source;
    const tgt = typeof l.target === 'object' ? l.target.id : l.target;
    return visibleNodeIds.has(src) && visibleNodeIds.has(tgt);
  });

  return {
    nodes: visibleNodes,
    links: visibleLinks,
    orbitRings,
    superNodeCount: visibleNodes.filter((n) => n.isSuperNode).length,
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
