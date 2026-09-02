/**
 * src/core/layout.worker.js
 * 
 * Web Worker para processar o layout 3D em background (Anti-Freeze UI).
 */
import { computeCylindricalLayout } from './layoutEngine.js';

self.onmessage = function (e) {
  const { nodes, links } = e.data || {};

  try {
    // Executa a matemática do Horizonte em background
    const layoutedData = computeCylindricalLayout(nodes, links);

    // Retorna os dados calculados para a Main Thread
    self.postMessage({ type: 'SUCCESS', payload: layoutedData });
  } catch (error) {
    self.postMessage({ type: 'ERROR', error: error.message || 'Erro no cálculo do layout' });
  }
};
