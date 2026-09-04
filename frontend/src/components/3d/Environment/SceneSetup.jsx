import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, GizmoHelper, GizmoViewport } from '@react-three/drei';
import FloorGrid from './FloorGrid';
import { PerformanceStatsTracker } from './PerformanceStatsOverlay';
import { useAppStore } from '../../../core/store';

/**
 * src/components/3d/Environment/SceneSetup.jsx
 * 
 * Infraestrutura e palco do ambiente 3D:
 * - Iluminação cibernética (Ambient, Directional, PointLights)
 * - OrbitControls sincronizado com navegação interativa do Minimapa e target da câmera
 * - Painel de métricas <Stats/> condicional (showStats)
 * - Bússola de orientação <GizmoHelper/> com elevação ergonômica acima do minimapa
 * - Chão cibernético <FloorGrid/> condicional (showGrid)
 */
export default function SceneSetup({
  minY = 0,
  gridRadius = 600,
  fogStart = 300,
  fogEnd = 700,
  maxCameraDistance = 650,
}) {
  const showStats = useAppStore((s) => s.showStats);
  const showGizmo = useAppStore((s) => s.showGizmo);
  const showGrid = useAppStore((s) => s.showGrid);
  const autoRotate = useAppStore((s) => s.autoRotate);
  const setIsMovingCamera = useAppStore((s) => s.setIsMovingCamera);
  const cameraTarget = useAppStore((s) => s.cameraTarget);
  const setCameraView = useAppStore((s) => s.setCameraView);

  const controlsRef = useRef();
  const { camera } = useThree();

  // Sincroniza o target da câmera sempre que o usuário clica ou arrasta no minimapa
  useEffect(() => {
    if (controlsRef.current && cameraTarget) {
      controlsRef.current.target.set(cameraTarget.x || 0, cameraTarget.y || 0, cameraTarget.z || 0);
      controlsRef.current.update();
    }
  }, [cameraTarget]);

  // Atualiza periodicamente a visão para o minimapa desenhar o retângulo do viewport
  useFrame(() => {
    if (controlsRef.current) {
      const tgt = controlsRef.current.target;
      const dist = camera.position.distanceTo(tgt);
      setCameraView({
        x: tgt.x,
        z: tgt.z,
        dist: dist,
        camX: camera.position.x,
        camZ: camera.position.z,
      });
    }
  });

  return (
    <>
      {/* Nevoeiro Cibernético: Horizonte estendido para não cortar a visão da galáxia */}
      <fog attach="fog" args={['#070a12', Math.min(fogStart, 500), Math.max(fogEnd, 20000)]} />

      {/* Iluminação Cibernética (Otimizada para alta taxa de quadros) */}
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[100, 200, 100]}
        intensity={1.2}
      />
      {/* Luzes de Acento Neon (Ciano e Rosa) */}
      <pointLight position={[-150, 100, -150]} intensity={1.5} color="#22d3ee" distance={500} />
      <pointLight position={[150, 100, 150]} intensity={1.5} color="#ec4899" distance={500} />

      {/* OrbitControls sem travas artificiais de zoom para navegação macro/micro total */}
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableDamping
        dampingFactor={0.05}
        maxPolarAngle={Math.PI * 0.85}
        minDistance={5}
        maxDistance={25000}
        autoRotate={autoRotate}
        autoRotateSpeed={0.8}
        onStart={() => setIsMovingCamera(true)}
        onEnd={() => setIsMovingCamera(false)}
      />

      {/* Tracker de Métricas de Performance 3D (Text-Only, sem distorção de canvas) */}
      {showStats && <PerformanceStatsTracker />}

      {/* Bússola 3D de Orientação Tática (Gizmo) flutuando ergonomicamente acima do minimapa */}
      {showGizmo && (
        <GizmoHelper
          alignment="bottom-right"
          margin={[70, 220]}
        >
          <GizmoViewport
            axisColors={['#ef4444', '#10b981', '#3b82f6']}
            labelColor="#ffffff"
            hideNegativeAxes={false}
          />
        </GizmoHelper>
      )}

      {/* Chão Cibernético Dinâmico Proporcional */}
      {showGrid && <FloorGrid minY={minY} gridRadius={gridRadius} />}
    </>
  );
}
