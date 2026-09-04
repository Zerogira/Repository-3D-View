import React from 'react';

/**
 * src/components/3d/Environment/FloorGrid.jsx
 * 
 * Chão cibernético nativo via THREE.GridHelper estático de alta definição:
 * - Elimina 100% de shaders de esteira, cintilação (flicker), alias e embaçamento de linhas.
 * - Linhas vetoriais 3D nativas ciano e azul escuro perfeitamente nítidas e cravadas no espaço.
 */
export default function FloorGrid({ minY = 0, gridRadius = 20000 }) {
  const floorHeight = minY - 25;
  // Piso massivo garantindo que o grafo nunca ultrapasse o chão (80 divisões ideais para alta taxa de quadros)
  const actualRadius = Math.max(gridRadius, 20000);
  const divisions = 80;

  return (
    <group position={[0, floorHeight, 0]}>
      {/* GridHelper Nativo de Alta Escala Otimizado */}
      <gridHelper
        args={[actualRadius, divisions, '#06b6d4', '#1e293b']}
        position={[0, 0, 0]}
      />

      {/* Plano translúcido de fundo ajustado à escala massiva */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <planeGeometry args={[actualRadius, actualRadius]} />
        <meshBasicMaterial color="#070a12" opacity={0.75} transparent />
      </mesh>
    </group>
  );
}
