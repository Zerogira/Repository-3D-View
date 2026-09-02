import React from 'react';

/**
 * src/components/3d/Environment/FloorGrid.jsx
 * 
 * Chão cibernético nativo via THREE.GridHelper estático de alta definição:
 * - Elimina 100% de shaders de esteira, cintilação (flicker), alias e embaçamento de linhas.
 * - Linhas vetoriais 3D nativas ciano e azul escuro perfeitamente nítidas e cravadas no espaço.
 */
export default function FloorGrid({ minY = 0, gridRadius = 600 }) {
  const floorHeight = minY - 25;
  // Quantidade de divisões ajustada proporcionalmente ao tamanho do mapa para manter leveza visual
  const divisions = Math.max(40, Math.min(100, Math.round(gridRadius / 8)));

  return (
    <group position={[0, floorHeight, 0]}>
      {/* GridHelper Nativo dinâmico: Dimensionado proporcionalmente ao repositório retornado */}
      <gridHelper
        args={[gridRadius, divisions, '#06b6d4', '#1e293b']}
        position={[0, 0, 0]}
      />

      {/* Plano translúcido de fundo ajustado ao mesmo tamanho */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <planeGeometry args={[gridRadius, gridRadius]} />
        <meshBasicMaterial color="#070a12" opacity={0.75} transparent />
      </mesh>
    </group>
  );
}
