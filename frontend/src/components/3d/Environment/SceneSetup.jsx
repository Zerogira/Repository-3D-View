import React from 'react';
import { OrbitControls, Stats, GizmoHelper, GizmoViewport } from '@react-three/drei';
import FloorGrid from './FloorGrid';
import { useAppStore } from '../../../core/store';

/**
 * src/components/3d/Environment/SceneSetup.jsx
 * 
 * Infraestrutura e palco do ambiente 3D:
 * - Iluminação cibernética (Ambient, Directional, PointLights)
 * - OrbitControls com restrição de maxPolarAngle (impede a câmera de descer abaixo de Y=0)
 * - Painel de métricas <Stats/> condicional (showStats)
 * - Bússola de orientação <GizmoHelper/> condicional (showGizmo)
 * - Chão cibernético <FloorGrid/> condicional (showGrid)
 */
export default function SceneSetup() {
  const showStats = useAppStore((s) => s.showStats);
  const showGizmo = useAppStore((s) => s.showGizmo);
  const showGrid = useAppStore((s) => s.showGrid);

  return (
    <>
      {/* Iluminação Cibernética */}
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[100, 200, 100]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      {/* Luzes de Acento Neon (Ciano e Rosa) */}
      <pointLight position={[-150, 100, -150]} intensity={1.5} color="#22d3ee" distance={500} />
      <pointLight position={[150, 100, 150]} intensity={1.5} color="#ec4899" distance={500} />

      {/* Trava Físico-Câmera: maxPolarAngle impede descer abaixo do chão em Y=0 */}
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.05}
        maxPolarAngle={Math.PI / 2 - 0.05}
        minDistance={10}
        maxDistance={1500}
      />

      {/* Painel de Métricas de Performance da GPU */}
      {showStats && <Stats className="react-three-stats" />}

      {/* Bússola 3D de Orientação Tática (Norte/Sul/Leste/Oeste) */}
      {showGizmo && (
        <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
          <GizmoViewport
            axisColors={['#ef4444', '#10b981', '#3b82f6']}
            labelColor="#ffffff"
            hideNegativeAxes={false}
          />
        </GizmoHelper>
      )}

      {/* Chão Cibernético */}
      {showGrid && <FloorGrid />}
    </>
  );
}
