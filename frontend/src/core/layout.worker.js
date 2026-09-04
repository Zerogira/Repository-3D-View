/**
 * src/core/layout.worker.js
 * 
 * Web Worker para processar os layouts 3D ('classic', 'universe' ou 'physics' via d3-force-3d)
 * em background sem congelar a interface do usuário (60 FPS garantidos).
 */
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceY, forceRadial } from 'd3-force-3d';
import { computeCylindricalLayout, computeUniverseLayout } from './layoutEngine.js';

self.onmessage = function (e) {
  const { nodes, links, layout = 'classic', usePhysicsEngine = false } = e.data || {};

  try {
    // 1. Sempre computamos a estrutura base com cores de ramos e profundidades
    const baseLayout =
      layout === 'universe'
        ? computeUniverseLayout(nodes, links)
        : computeCylindricalLayout(nodes, links);

    // Se o Modo Física (BETA) não estiver ativo, devolve o layout matemático direto
    if (!usePhysicsEngine) {
      self.postMessage({
        type: 'SUCCESS',
        payload: { ...baseLayout, activeLayout: layout },
      });
      return;
    }

    // ---------------------------------------------------------
    // MODO FÍSICA 3D (BETA: d3-force-3d em disco galáctico estável)
    // ---------------------------------------------------------
    const baseNodes = baseLayout.nodes || [];
    const baseLinks = baseLayout.links || [];

    // Clona os nós quebrando a simetria plana com kick 3D e fixando o nó raiz no centro
    const simNodes = baseNodes.map((n, index) => {
      const isRoot = n.isRoot || n.id === 'root' || n.depth === 0 || index === 0;
      return {
        ...n,
        id: n.id || n.path,
        isRoot: isRoot,
        color: isRoot ? '#facc15' : n.color,
        // 1. O 'empurrão' aleatório nos 3 eixos para nascer em 3D real e quebrar simetria
        x: (Math.random() - 0.5) * 100,
        y: (Math.random() - 0.5) * 100,
        z: (Math.random() - 0.5) * 100,
        vx: 0,
        vy: 0,
        vz: 0,
        // 2. Fixa o nó principal (raiz) como núcleo imóvel da galáxia
        ...(isRoot && { fx: 0, fy: 0, fz: 0 }),
      };
    });

    const nodeIds = new Set(simNodes.map((n) => n.id));
    const simLinks = baseLinks
      .map((l) => {
        const src = typeof l.source === 'object' ? l.source.id : l.source;
        const tgt = typeof l.target === 'object' ? l.target.id : l.target;
        return { source: src, target: tgt };
      })
      .filter((l) => nodeIds.has(l.source) && nodeIds.has(l.target));

    // Mapeamento rápido de nós para consulta instantânea nas funções de força
    const nodeLookup = new Map(simNodes.map((n) => [n.id, n]));

    // IMPORTANTE: Passar 3 como segundo argumento do construtor forceSimulation(simNodes, 3)
    // Combina Safe Zone Macro (forceRadial) + Clustering Micro (forceLink dinâmico) + Esmagamento Planar (forceY)
    const simulation = forceSimulation(simNodes, 3)
      // 1. Safe Zone (Barreira Radial com Fosso Central):
      // - Raiz no centro absoluto (0)
      // - Nós primários (depth 1) orbitam perto (raio 60)
      // - Nós secundários e terciários (depth >= 2) são ejetados para depth * 120 com strength 0.8
      // criando um fosso impenetrável que impede os nós de invadirem o centro
      .force(
        'radial',
        forceRadial(
          (d) => {
            const depth = d.depth || 0;
            if (depth === 0) return 0;
            if (depth === 1) return 60;
            return depth * 120;
          },
          0,
          0,
          0
        ).strength((d) => ((d.depth || 0) >= 2 ? 0.8 : 0.5))
      )
      // 2. Clustering (Micro-estrutura com forceLink dinâmico):
      // Arquivos: mola com folga horizontal (25) e firme (strength 0.85) formando pratos orbitais
      // Pastas: mola espaçada (40) e flexível (strength 0.4)
      .force(
        'link',
        forceLink(simLinks)
          .id((d) => d.id)
          .distance((link) => {
            const tgtNode = typeof link.target === 'object' ? link.target : nodeLookup.get(link.target);
            const isFile = tgtNode && tgtNode.type !== 'dir' && !tgtNode.isDir;
            return isFile ? 25 : 40;
          })
          .strength((link) => {
            const tgtNode = typeof link.target === 'object' ? link.target : nodeLookup.get(link.target);
            const isFile = tgtNode && tgtNode.type !== 'dir' && !tgtNode.isDir;
            return isFile ? 0.85 : 0.4;
          })
      )
      // 3. Repulsão equilibrada para manter cachos coesos sem explodir
      .force('charge', forceManyBody().strength(-120))
      .force('center', forceCenter(0, 0, 0))
      // 4. "Prensador Hidráulico" Planar: Força agressiva no eixo Y para esmagar a nuvem em um Disco Galáctico fino
      .force('y', forceY(0).strength(0.8));

    // Executa a simulação estaticamente no Worker
    simulation.tick(300);
    simulation.stop();

    // Sanitização de segurança contra NaN e cálculo da bounding box
    let minY = Infinity;
    let maxRadius = 0;
    const simNodeMap = new Map();

    simNodes.forEach((node, idx) => {
      if (typeof node.x !== 'number' || isNaN(node.x)) node.x = (idx % 2 === 0 ? 1 : -1) * (idx * 2);
      if (typeof node.y !== 'number' || isNaN(node.y)) node.y = 0;
      if (typeof node.z !== 'number' || isNaN(node.z)) node.z = (idx % 2 === 0 ? -1 : 1) * (idx * 2);

      if (node.y < minY) minY = node.y;
      const r = Math.hypot(node.x, node.z);
      if (r > maxRadius) maxRadius = r;

      simNodeMap.set(node.id, node);
    });

    if (!isFinite(minY)) minY = 0;
    if (maxRadius < 100) maxRadius = 150;

    // Sincronização Dinâmica das Órbitas: Atualiza o centro de cada anel de órbita para acompanhar o novo nó pai
    const updatedOrbitRings = (baseLayout.orbitRings || []).map((ring) => {
      const parentNode = ring.parentId ? simNodeMap.get(ring.parentId) : null;
      if (parentNode) {
        return {
          ...ring,
          x: parentNode.x,
          y: parentNode.y,
          z: parentNode.z,
        };
      }
      return ring;
    });

    const gridRadius = Math.max(20000, Math.ceil(maxRadius * 2.8));
    const fogStart = Math.min(500, Math.ceil(maxRadius * 1.5));
    const fogEnd = Math.max(20000, Math.ceil(maxRadius * 3.5));
    const maxCameraDistance = 25000;

    // Retorna os dados com coordenadas físicas para o lerp suave do React Three Fiber
    self.postMessage({
      type: 'SUCCESS',
      payload: {
        nodes: simNodes,
        links: baseLinks,
        orbitRings: updatedOrbitRings,
        activeLayout: 'physics',
        layoutInfo: {
          minY,
          maxRadius,
          gridRadius,
          fogStart,
          fogEnd,
          maxCameraDistance,
        },
      },
    });
  } catch (error) {
    self.postMessage({
      type: 'ERROR',
      error: error.message || 'Erro no cálculo do layout com física 3D',
    });
  }
};
