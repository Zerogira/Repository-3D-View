import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, GizmoHelper, GizmoViewport } from '@react-three/drei';
import * as THREE from 'three';
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

  const targetLookAt = useRef(new THREE.Vector3());
  const targetCamPos = useRef(new THREE.Vector3());
  const isTransitioning = useRef(false);

  // Sincroniza o target e posição da câmera com interpolação suave (Camera Lerp)
  useEffect(() => {
    if (!controlsRef.current || !cameraTarget) return;

    targetLookAt.current.set(cameraTarget.x || 0, cameraTarget.y || 0, cameraTarget.z || 0);

    // Caso 1: Pan do Minimapa -> Move fisicamente a posição da CÂMERA para a coordenada clicada
    if (cameraTarget.isMinimapPan) {
      const currentTarget = controlsRef.current.target;
      const currentCamPos = camera.position;

      // A nova posição da CÂMERA vai para a coordenada clicada no minimapa (mantendo a altitude Y)
      const newCamX = cameraTarget.x || 0;
      const newCamY = currentCamPos.y;
      const newCamZ = cameraTarget.z || 0;

      // Deslocamento horizontal que a câmera realiza
      const deltaX = newCamX - currentCamPos.x;
      const deltaZ = newCamZ - currentCamPos.z;

      // O target translada em paralelo na mesma proporção para a câmera não girar
      const newTargetX = currentTarget.x + deltaX;
      const newTargetY = currentTarget.y;
      const newTargetZ = currentTarget.z + deltaZ;

      targetCamPos.current.set(newCamX, newCamY, newCamZ);
      targetLookAt.current.set(newTargetX, newTargetY, newTargetZ);
      isTransitioning.current = true;
      return;
    }

    // Caso 2: Se for Super Nó ou foco suave: calcula aproximação isométrica elegante
    if (cameraTarget.isSuperNode || cameraTarget.smooth) {
      const offsetDir = new THREE.Vector3().subVectors(camera.position, targetLookAt.current).normalize();
      if (offsetDir.lengthSq() < 0.01) {
        offsetDir.set(0.6, 0.4, 0.7).normalize();
      }
      // Distância de aproximação ideal para um Super Nó sem colidir
      const idealDistance = 90;
      targetCamPos.current.copy(targetLookAt.current).addScaledVector(offsetDir, idealDistance);
      targetCamPos.current.y = Math.max(targetCamPos.current.y, targetLookAt.current.y + 35);

      isTransitioning.current = true;
    } else {
      controlsRef.current.target.set(cameraTarget.x || 0, cameraTarget.y || 0, cameraTarget.z || 0);
      controlsRef.current.update();
      isTransitioning.current = false;
    }
  }, [cameraTarget, camera]);

  const lastViewUpdate = useRef({ time: 0, x: 0, z: 0, camX: 0, camZ: 0 });

  // Sincroniza a interpolação suave de câmera e o minimapa com throttle (~100ms)
  useFrame((state, delta) => {
    if (!controlsRef.current) return;

    // Voo de Câmera Suave (Lerp) para o Super Nó
    if (isTransitioning.current) {
      const lerpSpeed = Math.min(1, delta * 4.2);
      controlsRef.current.target.lerp(targetLookAt.current, lerpSpeed);
      camera.position.lerp(targetCamPos.current, lerpSpeed);
      controlsRef.current.update();

      const distTarget = controlsRef.current.target.distanceTo(targetLookAt.current);
      const distCam = camera.position.distanceTo(targetCamPos.current);
      if (distTarget < 0.5 && distCam < 1.0) {
        controlsRef.current.target.copy(targetLookAt.current);
        controlsRef.current.update();
        isTransitioning.current = false;
      }
    }

    const now = performance.now();
    if (now - lastViewUpdate.current.time < 100) return; // Limita a ~10 Hz

    const tgt = controlsRef.current.target;
    const camX = camera.position.x;
    const camZ = camera.position.z;

    const dx = tgt.x - lastViewUpdate.current.x;
    const dz = tgt.z - lastViewUpdate.current.z;
    const dCamX = camX - lastViewUpdate.current.camX;
    const dCamZ = camZ - lastViewUpdate.current.camZ;

    if (Math.abs(dx) > 0.5 || Math.abs(dz) > 0.5 || Math.abs(dCamX) > 0.5 || Math.abs(dCamZ) > 0.5) {
      lastViewUpdate.current = { time: now, x: tgt.x, z: tgt.z, camX, camZ };
      const dist = camera.position.distanceTo(tgt);
      setCameraView({
        x: camX, // Posição física real da câmera para projeção no minimapa
        z: camZ,
        dist: dist,
        camX: camX,
        camZ: camZ,
        tgtX: tgt.x,
        tgtZ: tgt.z,
        is2D: false,
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
        onStart={() => {
          isTransitioning.current = false;
          setIsMovingCamera(true);
        }}
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
