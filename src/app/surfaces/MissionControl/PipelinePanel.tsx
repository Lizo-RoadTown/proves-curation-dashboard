/**
 * PipelinePanel - 3D Multi-University Pipeline Flow
 *
 * Shows actual university source pipelines as flowing streams.
 * Each university has its own colored stream.
 *
 * Visual encoding:
 * - Stream presence = university is active
 * - Stream thickness = volume (rate of extraction)
 * - Particle speed = latency (fast = low latency)
 * - Stream breaks = failures
 *
 * Inbound: Sources → Knowledge Graph (left to center)
 * Outbound: Knowledge Graph → Consumers (center to right)
 */

import { useEffect, useRef } from "react";
import * as THREE from "three";

interface UniversityPipeline {
  id: string;
  name: string;
  color: string;
  inbound: {
    rate: number;      // items/sec
    latencyMs: number;
    status: 'healthy' | 'degraded' | 'down';
  };
  outbound: {
    rate: number;
    latencyMs: number;
    status: 'healthy' | 'degraded' | 'down';
  };
}

interface PipelinePanelProps {
  pipelines: UniversityPipeline[];
}

// Default pipelines for the 5 universities (would come from Supabase realtime)
const DEFAULT_PIPELINES: UniversityPipeline[] = [
  { id: 'cpp', name: 'Cal Poly Pomona', color: '#22c55e', inbound: { rate: 1.5, latencyMs: 280, status: 'healthy' }, outbound: { rate: 0.8, latencyMs: 350, status: 'healthy' } },
  { id: 'columbia', name: 'Columbia', color: '#3b82f6', inbound: { rate: 0.9, latencyMs: 420, status: 'healthy' }, outbound: { rate: 0.5, latencyMs: 380, status: 'healthy' } },
  { id: 'northeastern', name: 'Northeastern', color: '#ef4444', inbound: { rate: 1.2, latencyMs: 310, status: 'healthy' }, outbound: { rate: 0.7, latencyMs: 400, status: 'healthy' } },
  { id: 'ucsc', name: 'UC Santa Cruz', color: '#f59e0b', inbound: { rate: 0.6, latencyMs: 500, status: 'degraded' }, outbound: { rate: 0.3, latencyMs: 450, status: 'healthy' } },
  { id: 'txstate', name: 'Texas State', color: '#8b5cf6', inbound: { rate: 0.4, latencyMs: 380, status: 'healthy' }, outbound: { rate: 0.2, latencyMs: 420, status: 'healthy' } },
];

interface PipelineStream {
  curve: THREE.CatmullRomCurve3;
  tube: THREE.Mesh;
  particles: THREE.Points;
  particleSeeds: Float32Array;
  color: THREE.Color;
  direction: 'inbound' | 'outbound';
  rate: number;
  latencyMs: number;
  status: string;
}

export function PipelinePanel({ pipelines = DEFAULT_PIPELINES }: PipelinePanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    streams: PipelineStream[];
    centralNode: THREE.Mesh;
  } | null>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 30, 80);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Central node (knowledge graph representation)
    const centralGeometry = new THREE.SphereGeometry(4, 16, 16);
    const centralMaterial = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.8,
    });
    const centralNode = new THREE.Mesh(centralGeometry, centralMaterial);
    scene.add(centralNode);

    // Glow around central node
    const glowGeometry = new THREE.SphereGeometry(8, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.1,
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    scene.add(glow);

    // Create streams for each university
    const streams: PipelineStream[] = [];
    const PARTICLE_COUNT = 50;

    pipelines.forEach((pipeline, index) => {
      const yOffset = (index - (pipelines.length - 1) / 2) * 8;
      const color = new THREE.Color(pipeline.color);

      // Inbound stream (left to center)
      if (pipeline.inbound.status !== 'down') {
        const inboundCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(-50, yOffset + 5, 0),
          new THREE.Vector3(-30, yOffset + 3, 5),
          new THREE.Vector3(-15, yOffset * 0.5, 3),
          new THREE.Vector3(-5, 0, 0),
        ]);

        const inboundStream = createStream(
          scene,
          inboundCurve,
          color,
          pipeline.inbound,
          'inbound',
          PARTICLE_COUNT
        );
        streams.push(inboundStream);
      }

      // Outbound stream (center to right)
      if (pipeline.outbound.status !== 'down') {
        const outboundCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(5, 0, 0),
          new THREE.Vector3(15, yOffset * 0.5, -3),
          new THREE.Vector3(30, yOffset + 3, -5),
          new THREE.Vector3(50, yOffset + 5, 0),
        ]);

        const outboundStream = createStream(
          scene,
          outboundCurve,
          color,
          pipeline.outbound,
          'outbound',
          PARTICLE_COUNT
        );
        streams.push(outboundStream);
      }
    });

    sceneRef.current = { scene, camera, renderer, streams, centralNode };

    // Handle resize
    const handleResize = () => {
      if (!sceneRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      sceneRef.current.camera.aspect = w / h;
      sceneRef.current.camera.updateProjectionMatrix();
      sceneRef.current.renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationRef.current);
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, [pipelines]);

  // Animation loop
  useEffect(() => {
    if (!sceneRef.current) return;

    const { scene, camera, renderer, streams, centralNode } = sceneRef.current;
    let lastTime = performance.now();
    let time = 0;

    const animate = () => {
      const now = performance.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      time += dt;

      // Pulse central node
      const pulse = 1 + Math.sin(time * 2) * 0.1;
      centralNode.scale.setScalar(pulse);

      // Update each stream
      streams.forEach(stream => {
        // Speed based on rate and latency
        const rateFactor = Math.min(2, stream.rate);
        const latFactor = Math.max(0.3, 800 / Math.max(100, stream.latencyMs));
        const speed = 0.15 * rateFactor * latFactor;

        // Status affects speed
        const statusMul = stream.status === 'degraded' ? 0.4 : 1.0;
        const finalSpeed = speed * statusMul;

        // Update particle positions
        const positions = stream.particles.geometry.attributes.position as THREE.BufferAttribute;
        const posArray = positions.array as Float32Array;

        for (let i = 0; i < stream.particleSeeds.length; i++) {
          // Advance along curve
          stream.particleSeeds[i] = (stream.particleSeeds[i] + dt * finalSpeed) % 1;
          const t = stream.particleSeeds[i];
          const pos = stream.curve.getPointAt(t);

          posArray[i * 3] = pos.x;
          posArray[i * 3 + 1] = pos.y;
          posArray[i * 3 + 2] = pos.z;
        }

        positions.needsUpdate = true;

        // Tube opacity based on status
        const tubeMat = stream.tube.material as THREE.MeshBasicMaterial;
        tubeMat.opacity = stream.status === 'degraded' ? 0.03 : 0.06;

        // Particle opacity based on status
        const partMat = stream.particles.material as THREE.PointsMaterial;
        partMat.opacity = stream.status === 'degraded' ? 0.4 : 0.8;
      });

      renderer.render(scene, camera);
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <div className="h-full w-full relative">
      <div className="absolute top-2 left-3 z-10 flex items-center gap-3">
        <span className="text-[10px] font-medium text-[#64748b]">PIPELINES</span>
        <div className="flex items-center gap-2">
          {pipelines.slice(0, 5).map(p => (
            <div key={p.id} className="flex items-center gap-1">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: p.color }}
              />
            </div>
          ))}
        </div>
      </div>
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}

// Helper to create a pipeline stream
function createStream(
  scene: THREE.Scene,
  curve: THREE.CatmullRomCurve3,
  color: THREE.Color,
  state: { rate: number; latencyMs: number; status: string },
  direction: 'inbound' | 'outbound',
  particleCount: number
): PipelineStream {
  // Tube (faint path)
  const thickness = Math.min(1.5, 0.3 + state.rate * 0.5);
  const tubeGeometry = new THREE.TubeGeometry(curve, 32, thickness, 6, false);
  const tubeMaterial = new THREE.MeshBasicMaterial({
    color: color,
    transparent: true,
    opacity: 0.06,
    depthWrite: false,
  });
  const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
  scene.add(tube);

  // Particles
  const particleGeometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const particleSeeds = new Float32Array(particleCount);

  for (let i = 0; i < particleCount; i++) {
    const t = Math.random();
    particleSeeds[i] = t;
    const pos = curve.getPointAt(t);
    positions[i * 3] = pos.x;
    positions[i * 3 + 1] = pos.y;
    positions[i * 3 + 2] = pos.z;

    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }

  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const particleMaterial = new THREE.PointsMaterial({
    size: Math.min(4, 2 + state.rate),
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const particles = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(particles);

  return {
    curve,
    tube,
    particles,
    particleSeeds,
    color,
    direction,
    rate: state.rate,
    latencyMs: state.latencyMs,
    status: state.status,
  };
}

// Re-export with simpler interface for backwards compatibility
export interface PipelineState {
  rate: number;
  latencyMs: number;
  status: 'healthy' | 'degraded' | 'down';
}
