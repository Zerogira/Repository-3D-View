import React, { useMemo } from 'react';
import * as THREE from 'three';

/**
 * src/components/3d/Graph/OrbitRingsRender.jsx
 * 
 * Renderizador ultraleve de anéis de órbitas planetárias em 1 Single Draw Call:
 * - Compila todos os círculos orbitais em um único THREE.LineSegments com BufferGeometry.
 * - Estética cósmica neon (ciano/azul/roxo) com transparência sutil que desenha as órbitas dos arquivos.
 */
export default function OrbitRingsRender({ rings = [] }) {
  const { linePositions, lineColors } = useMemo(() => {
    if (!rings || !rings.length) return { linePositions: new Float32Array(0), lineColors: new Float32Array(0) };

    const segmentsPerRing = 48;
    const coords = [];
    const colors = [];
    const tempColor = new THREE.Color();

    rings.forEach((ring) => {
      const { x = 0, y = 0, z = 0, radius = 20, color = '#38bdf8' } = ring;
      tempColor.set(color);

      for (let i = 0; i < segmentsPerRing; i++) {
        const theta1 = (i / segmentsPerRing) * Math.PI * 2;
        const theta2 = ((i + 1) / segmentsPerRing) * Math.PI * 2;

        const x1 = x + Math.cos(theta1) * radius;
        const z1 = z + Math.sin(theta1) * radius;
        const x2 = x + Math.cos(theta2) * radius;
        const z2 = z + Math.sin(theta2) * radius;

        coords.push(x1, y, z1);
        coords.push(x2, y, z2);

        colors.push(tempColor.r, tempColor.g, tempColor.b);
        colors.push(tempColor.r, tempColor.g, tempColor.b);
      }
    });

    return {
      linePositions: new Float32Array(coords),
      lineColors: new Float32Array(colors),
    };
  }, [rings]);

  const geometry = useMemo(() => {
    if (linePositions.length === 0) return null;
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));
    return geom;
  }, [linePositions, lineColors]);

  if (!rings.length || !geometry) return null;

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial
        vertexColors={true}
        transparent={true}
        opacity={0.35}
        depthWrite={false}
      />
    </lineSegments>
  );
}
