/**
 * src/core/layout.worker.js
 * 
 * Web Worker para processar os layouts 3D ('classic', 'universe' ou 'physics' via d3-force-3d)
 * em background sem congelar a interface do usuário (60 FPS garantidos).
 */
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceY } from 'd3-force-3d';
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
      const isRoot = n.id === 'root' || n.depth === 0 || index === 0;
      return {
        ...n,
        id: n.id || n.path,
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

    // IMPORTANTE: Passar 3 como segundo argumento do construtor forceSimulation(simNodes, 3)
    // para que todas as forças (especialmente forceManyBody) inicializem o octree tridimensional
    const simulation = forceSimulation(simNodes, 3)
      .force(
        'link',
        forceLink(simLinks)
          .id((d) => d.id)
          .distance(80) // Molas mais longas
      )
      .force('charge', forceManyBody().strength(-400)) // Repulsão BEM mais forte para afastar galhos pesados
      .force('center', forceCenter(0, 0, 0))
      // 3. O SEGREDO DA GALÁXIA: Achata levemente no eixo Y, forçando expansão em disco X e Z
      .force('y', forceY(0).strength(0.1));

    // Executa a simulação estaticamente (em milissegundos) no Worker
    simulation.tick(300);
    simulation.stop();

    // Sanitização de segurança contra NaN e cálculo da bounding box
    let minY = Infinity;
    let maxRadius = 0;

    simNodes.forEach((node, idx) => {
      if (typeof node.x !== 'number' || isNaN(node.x)) node.x = (idx % 2 === 0 ? 1 : -1) * (idx * 2);
      if (typeof node.y !== 'number' || isNaN(node.y)) node.y = 0;
      if (typeof node.z !== 'number' || isNaN(node.z)) node.z = (idx % 2 === 0 ? -1 : 1) * (idx * 2);

      if (node.y < minY) minY = node.y;
      const r = Math.hypot(node.x, node.z);
      if (r > maxRadius) maxRadius = r;
    });

    if (!isFinite(minY)) minY = 0;
    if (maxRadius < 100) maxRadius = 150;

    const gridRadius = Math.ceil(maxRadius * 2.8);
    const fogStart = Math.ceil(maxRadius * 1.5);
    const fogEnd = Math.ceil(maxRadius * 3.5);
    const maxCameraDistance = Math.ceil(maxRadius * 3.2);

    // Retorna os dados com coordenadas físicas para o lerp suave do React Three Fiber
    self.postMessage({
      type: 'SUCCESS',
      payload: {
        nodes: simNodes,
        links: baseLinks,
        orbitRings: baseLayout.orbitRings || [],
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
