/**
 * AgentAvatarPanel - 3D Multi-Agent Class Visualization
 *
 * Shows each agent CLASS as its own 3D object in a shared scene.
 * 6 agent types, each with motion-encoded health.
 *
 * Motion encoding (per agent):
 * - Rotation speed = activity level (health)
 * - Wobble = low confidence
 * - Surface noise = error rate
 * - Tilt = drift
 *
 * If an agent looks calm and centered → trust is high.
 * If it looks noisy or unstable → intervene.
 */

import { useEffect, useRef } from "react";
import * as THREE from "three";

interface AgentClass {
  id: string;
  name: string;
  color: string;
  health: number;      // 0-1: rotation speed
  confidence: number;  // 0-1: shape stability
  drift: number;       // 0-1: axis tilt
  errorRate: number;   // 0-1: surface noise
}

interface AgentAvatarPanelProps {
  agents: AgentClass[];
}

// Default 6 agent classes (would come from Supabase realtime)
const DEFAULT_AGENTS: AgentClass[] = [
  { id: 'extractor', name: 'Extractor', color: '#06b6d4', health: 0.95, confidence: 0.88, drift: 0.05, errorRate: 0.02 },
  { id: 'validator', name: 'Validator', color: '#22c55e', health: 0.92, confidence: 0.85, drift: 0.08, errorRate: 0.03 },
  { id: 'linker', name: 'Linker', color: '#8b5cf6', health: 0.88, confidence: 0.82, drift: 0.12, errorRate: 0.05 },
  { id: 'deduper', name: 'Deduper', color: '#f59e0b', health: 0.90, confidence: 0.78, drift: 0.15, errorRate: 0.04 },
  { id: 'enricher', name: 'Enricher', color: '#ef4444', health: 0.85, confidence: 0.75, drift: 0.10, errorRate: 0.06 },
  { id: 'exporter', name: 'Exporter', color: '#ec4899', health: 0.93, confidence: 0.90, drift: 0.03, errorRate: 0.01 },
];

interface AgentMesh {
  group: THREE.Group;
  core: THREE.Mesh;
  shell: THREE.Mesh;
  ring: THREE.Mesh;
  originalPositions: Float32Array;
  state: AgentClass;
}

export function AgentAvatarPanel({ agents = DEFAULT_AGENTS }: AgentAvatarPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    agentMeshes: AgentMesh[];
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
    camera.position.set(0, 20, 60);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    const keyLight = new THREE.PointLight(0x88ccff, 1, 150);
    keyLight.position.set(30, 30, 50);
    scene.add(keyLight);

    // Create agent meshes in a 3x2 grid
    const agentMeshes: AgentMesh[] = [];
    const cols = 3;
    const spacingX = 22;
    const spacingY = 18;

    agents.forEach((agent, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = (col - (cols - 1) / 2) * spacingX;
      const y = (row === 0 ? 1 : -1) * spacingY / 2;

      const agentMesh = createAgentMesh(agent, x, y);
      scene.add(agentMesh.group);
      agentMeshes.push(agentMesh);
    });

    sceneRef.current = { scene, camera, renderer, agentMeshes };

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
  }, [agents]);

  // Animation loop
  useEffect(() => {
    if (!sceneRef.current) return;

    const { scene, camera, renderer, agentMeshes } = sceneRef.current;
    let time = 0;

    const animate = () => {
      time += 0.016;

      agentMeshes.forEach(agent => {
        const { group, core, shell, ring, originalPositions, state } = agent;

        // === ROTATION (health/activity) ===
        const rotationSpeed = 0.15 + state.health * 0.4;
        group.rotation.y += 0.01 * rotationSpeed;

        // === CONFIDENCE (wobble) ===
        const wobbleAmount = (1 - state.confidence) * 0.12;
        group.rotation.x = Math.sin(time * 2.5 + state.health * 10) * wobbleAmount;
        group.rotation.z = Math.cos(time * 2 + state.confidence * 10) * wobbleAmount * 0.6;

        // === DRIFT (tilt) ===
        shell.rotation.x = THREE.MathUtils.lerp(
          shell.rotation.x,
          state.drift * 0.35 + Math.sin(time * 0.6) * state.drift * 0.1,
          0.04
        );

        // === ERROR RATE (surface noise) ===
        const positions = core.geometry.attributes.position.array as Float32Array;
        const noise = state.errorRate * 0.5;
        for (let i = 0; i < positions.length; i += 3) {
          positions[i] = originalPositions[i] + (Math.random() - 0.5) * noise;
          positions[i + 1] = originalPositions[i + 1] + (Math.random() - 0.5) * noise;
          positions[i + 2] = originalPositions[i + 2] + (Math.random() - 0.5) * noise;
        }
        core.geometry.attributes.position.needsUpdate = true;

        // Core scale (health)
        const coreScale = 0.8 + state.health * 0.3;
        core.scale.setScalar(coreScale);

        // Emissive (confidence)
        const mat = core.material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = 0.15 + state.confidence * 0.4;

        // Ring rotation
        ring.rotation.z += 0.008 * (0.4 + state.health * 0.6);
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
        <span className="text-[10px] font-medium text-[#64748b]">AGENTS</span>
        <div className="flex items-center gap-2">
          {agents.slice(0, 6).map(a => (
            <div key={a.id} className="flex items-center gap-1">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: a.color }}
              />
            </div>
          ))}
        </div>
      </div>
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}

// Create a single agent mesh
function createAgentMesh(agent: AgentClass, x: number, y: number): AgentMesh {
  const group = new THREE.Group();
  group.position.set(x, y, 0);

  const color = new THREE.Color(agent.color);

  // Core
  const coreGeometry = new THREE.IcosahedronGeometry(4, 2);
  const coreMaterial = new THREE.MeshStandardMaterial({
    color: color,
    roughness: 0.25,
    metalness: 0.2,
    emissive: color,
    emissiveIntensity: 0.3,
  });
  const core = new THREE.Mesh(coreGeometry, coreMaterial);
  group.add(core);

  const originalPositions = new Float32Array(coreGeometry.attributes.position.array);

  // Shell
  const shellGeometry = new THREE.IcosahedronGeometry(6, 1);
  const shellMaterial = new THREE.MeshBasicMaterial({
    color: 0x64748b,
    wireframe: true,
    transparent: true,
    opacity: 0.12,
  });
  const shell = new THREE.Mesh(shellGeometry, shellMaterial);
  group.add(shell);

  // Ring
  const ringGeometry = new THREE.TorusGeometry(8, 0.25, 6, 32);
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: color,
    transparent: true,
    opacity: 0.2,
  });
  const ring = new THREE.Mesh(ringGeometry, ringMaterial);
  ring.rotation.x = Math.PI / 2;
  group.add(ring);

  return { group, core, shell, ring, originalPositions, state: agent };
}

// Re-export for backwards compatibility
export interface AgentState {
  health: number;
  confidence: number;
  drift: number;
  errorRate: number;
}
