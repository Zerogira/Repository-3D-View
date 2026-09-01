import React, { useRef, useCallback, useState, useEffect } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';
import { Camera, RotateCw, Sparkles, ZoomIn } from 'lucide-react';

export default function GraphViewer3D({ graphData, onNodeClick, filterTerm }) {
  const fgRef = useRef();
  const [autoRotate, setAutoRotate] = useState(false);
  const [particlesEnabled, setParticlesEnabled] = useState(true);

  // Auto rotate handler
  useEffect(() => {
    if (fgRef.current) {
      fgRef.current.controls().autoRotate = autoRotate;
      fgRef.current.controls().autoRotateSpeed = 0.8;
    }
  }, [autoRotate]);

  // Pre-create reusable materials for performance
  const folderMaterial = useRef(
    new THREE.MeshLambertMaterial({
      color: 0x22d3ee, // Cyan
      transparent: true,
      opacity: 0.95,
      wireframe: false,
    })
  );

  const fileMaterial = useRef(
    new THREE.MeshLambertMaterial({
      color: 0xec4899, // Pink
      transparent: true,
      opacity: 0.9,
    })
  );

  const dimmedMaterial = useRef(
    new THREE.MeshBasicMaterial({
      color: 0x334155,
      transparent: true,
      opacity: 0.15,
    })
  );

  // Node 3D Object custom renderer (Cyan Box for folders, Pink Sphere for files)
  const nodeThreeObject = useCallback(
    (node) => {
      const isFolder = node.type === 'folder';
      const isRoot = node.id === 'root';

      // Check if filtering is active and whether node matches
      const isSearchActive = Boolean(filterTerm && filterTerm.trim() !== '');
      const isMatched = isSearchActive
        ? node.name.toLowerCase().includes(filterTerm.toLowerCase()) ||
          node.path.toLowerCase().includes(filterTerm.toLowerCase())
        : true;

      // Select Geometry & Size
      let geometry;
      const baseVal = node.val || (isFolder ? 8 : 4);

      if (isFolder) {
        // Folders are Cubes (Boxes)
        const boxSize = Math.max(5, Math.min(baseVal * 1.2, 18));
        geometry = new THREE.BoxGeometry(boxSize, boxSize, boxSize);
      } else {
        // Files are Spheres
        const sphereRadius = Math.max(3, Math.min(baseVal * 0.8, 10));
        geometry = new THREE.SphereGeometry(sphereRadius, 16, 16);
      }

      // Material assignment based on search filter status
      let material;
      if (isSearchActive && !isMatched) {
        material = dimmedMaterial.current.clone();
      } else {
        if (isRoot) {
          material = new THREE.MeshStandardMaterial({
            color: 0xa855f7, // Purple for root
            roughness: 0.2,
            metalness: 0.5,
          });
        } else if (isFolder) {
          material = folderMaterial.current.clone();
        } else {
          material = fileMaterial.current.clone();
        }
      }

      const mesh = new THREE.Mesh(geometry, material);

      return mesh;
    },
    [filterTerm]
  );

  // Focus camera on node click
  const handleNodeClick = useCallback(
    (node) => {
      if (!fgRef.current || !node) return;

      // Distance to position camera
      const distance = 80;
      const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);

      fgRef.current.cameraPosition(
        { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }, // new position
        node, // lookAt node
        1500 // transition duration ms
      );

      if (onNodeClick) {
        onNodeClick(node);
      }
    },
    [onNodeClick]
  );

  // Reset Camera View
  const handleResetCamera = () => {
    if (fgRef.current) {
      fgRef.current.zoomToFit(1000, 50);
    }
  };

  return (
    <div className="relative w-full h-full min-h-[600px] rounded-2xl overflow-hidden border border-slate-800 bg-[#060911] shadow-2xl">
      {/* 3D Force Graph */}
      <ForceGraph3D
        ref={fgRef}
        graphData={graphData}
        nodeLabel={(node) => `
          <div style="
            background: rgba(15, 23, 42, 0.95);
            border: 1px solid ${node.type === 'folder' ? '#22d3ee' : '#ec4899'};
            padding: 8px 12px;
            border-radius: 8px;
            color: white;
            font-family: sans-serif;
            font-size: 12px;
            box-shadow: 0 0 15px ${node.type === 'folder' ? 'rgba(34,211,238,0.4)' : 'rgba(236,72,153,0.4)'};
          ">
            <strong style="color: ${node.type === 'folder' ? '#22d3ee' : '#ec4899'}; font-size: 13px;">
              ${node.type === 'folder' ? '📁 ' : '📄 '}${node.name}
            </strong>
            <div style="font-size: 10px; color: #94a3b8; margin-top: 2px;">${node.path}</div>
            ${node.size ? `<div style="font-size: 10px; color: #cbd5e1; margin-top: 2px;">Tamanho: ${(node.size / 1024).toFixed(1)} KB</div>` : ''}
          </div>
        `}
        nodeThreeObject={nodeThreeObject}
        onNodeClick={handleNodeClick}
        // Link styling & physics performance optimizations
        linkColor={() => 'rgba(51, 65, 85, 0.4)'}
        linkWidth={1.2}
        linkDirectionalParticles={particlesEnabled ? 2 : 0}
        linkDirectionalParticleWidth={2}
        linkDirectionalParticleSpeed={0.006}
        linkDirectionalParticleColor={(link) => '#22d3ee'}
        // Performance settings as specified in plan
        warmupTicks={150}
        cooldownTicks={100}
        backgroundColor="#060911"
        showNavInfo={false}
      />

      {/* Control Overlay Buttons */}
      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 bg-slate-900/80 p-2 rounded-xl border border-slate-800 backdrop-blur-md">
        <button
          onClick={handleResetCamera}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-all"
          title="Centralizar Câmera"
        >
          <Camera className="w-3.5 h-3.5 text-cyan-400" />
          Reset Câmera
        </button>

        <button
          onClick={() => setAutoRotate((prev) => !prev)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
            autoRotate
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-neon-cyan-sm'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
          }`}
          title="Alternar Rotação Automática"
        >
          <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} />
          Rotação
        </button>

        <button
          onClick={() => setParticlesEnabled((prev) => !prev)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
            particlesEnabled
              ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40 shadow-neon-pink-sm'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
          }`}
          title="Alternar Partículas de Fluxo"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Partículas
        </button>
      </div>

      {/* Legend Overlay */}
      <div className="absolute top-4 left-4 z-20 bg-slate-900/80 p-3 rounded-xl border border-slate-800 backdrop-blur-md text-xs space-y-1.5">
        <div className="flex items-center gap-2 text-slate-300 font-medium">
          <span className="w-3 h-3 bg-cyan-400 rounded-sm shadow-neon-cyan-sm inline-block"></span>
          <span>Pastas (Cubos Ciano)</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300 font-medium">
          <span className="w-3 h-3 bg-pink-500 rounded-full shadow-neon-pink-sm inline-block"></span>
          <span>Arquivos (Esferas Rosa)</span>
        </div>
      </div>
    </div>
  );
}
