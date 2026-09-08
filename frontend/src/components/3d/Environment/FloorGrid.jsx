import React from 'react';

/**
 * src/components/3d/Environment/FloorGrid.jsx
 * 
 * Chão cibernético nativo via THREE.GridHelper estático de alta definição:
 * - Elimina 100% de shaders de esteira, cintilação (flicker), alias e embaçamento de linhas.
 * - Linhas vetoriais 3D nativas ciano e azul escuro perfeitamente nítidas e cravadas no espaço.
 */
export default function FloorGrid({ minY = 0, gridRadius = 6000 }) {
  const floorHeight = minY - 25;
  // Escala calibrada para cobrir a galáxia com folga sem sufocar o fill-rate da GPU (40 divisões leves)
  const actualRadius = Math.max(gridRadius, 6000);
  const divisions = 40;

  return (
    <group position={[0, floorHeight, 0]}>
      {/* GridHelper Nativo de Alta Escala Otimizado: renderOrder={1} garante que seja desenhado sobre o piso sem cintilação */}
      <gridHelper
        args={[actualRadius, divisions, '#06b6d4', '#1e293b']}
        position={[0, 0, 0]}
        renderOrder={1}
      />

      {/* Plano translúcido de fundo posicionado com folga vertical segura (Y = -3.0) e polygonOffset para anular Z-Fighting de qualquer ângulo */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3.0, 0]} renderOrder={0}>
        <planeGeometry args={[actualRadius, actualRadius]} />
        <meshBasicMaterial
          color="#070a12"
          opacity={0.75}
          transparent
          polygonOffset={true}
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
