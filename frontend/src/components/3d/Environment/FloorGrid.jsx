import React from 'react';

/**
 * src/components/3d/Environment/FloorGrid.jsx
 * 
 * Componente visual do chão cibernético em Y=0.
 */
export default function FloorGrid() {
  return (
    <group position={[0, 0, 0]}>
      {/* Grid cibernético neon em Y=0 */}
      <gridHelper
        args={[2000, 100, '#06b6d4', '#1e293b']}
        position={[0, 0, 0]}
      />

      {/* Plano sutil para receber sombras e dar sensação de profundidade no chão */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
        <planeGeometry args={[2000, 2000]} />
        <meshBasicMaterial color="#070a12" opacity={0.8} transparent />
      </mesh>
    </group>
  );
}
