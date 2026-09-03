/**
 * src/core/layout.worker.js
 * 
 * Web Worker para processar os layouts 3D ('classic' ou 'universe') em background (Anti-Freeze UI).
 */
import { computeCylindricalLayout, computeUniverseLayout } from './layoutEngine.js';

self.onmessage = function (e) {
  const { nodes, links, layout = 'classic' } = e.data || {};

  try {
    const layoutedData =
      layout === 'universe'
        ? computeUniverseLayout(nodes, links)
        : computeCylindricalLayout(nodes, links);

    // Retorna os dados calculados para a Main Thread
    self.postMessage({ type: 'SUCCESS', payload: { ...layoutedData, activeLayout: layout } });
  } catch (error) {
    self.postMessage({ type: 'ERROR', error: error.message || 'Erro no cálculo do layout' });
  }
};
