/**
 * AgentOrbs - Row of 6 agent class orbs (Tamagotchi-style)
 *
 * Each agent class is a colored orb that shows health through motion:
 * - Smooth, gentle pulsing = healthy
 * - Jittery/noisy = errors
 * - Slow/dim = low confidence
 * - Tilted = drift
 *
 * Like Tamagotchis - if they look calm, they're healthy. If they're shaking, they need attention.
 */

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface AgentClass {
  id: string;
  name: string;
  color: string;
  health: number;      // 0-1: overall health
  confidence: number;  // 0-1: prediction confidence
  drift: number;       // 0-1: model drift
  errorRate: number;   // 0-1: error rate
}

const AGENTS: AgentClass[] = [
  { id: 'extractor', name: 'Extractor', color: '#06b6d4', health: 0.95, confidence: 0.88, drift: 0.05, errorRate: 0.02 },
  { id: 'validator', name: 'Validator', color: '#22c55e', health: 0.92, confidence: 0.85, drift: 0.08, errorRate: 0.03 },
  { id: 'linker', name: 'Linker', color: '#8b5cf6', health: 0.88, confidence: 0.82, drift: 0.12, errorRate: 0.05 },
  { id: 'deduper', name: 'Deduper', color: '#f59e0b', health: 0.90, confidence: 0.78, drift: 0.15, errorRate: 0.04 },
  { id: 'enricher', name: 'Enricher', color: '#ef4444', health: 0.85, confidence: 0.75, drift: 0.10, errorRate: 0.06 },
  { id: 'exporter', name: 'Exporter', color: '#ec4899', health: 0.93, confidence: 0.90, drift: 0.03, errorRate: 0.01 },
];

export function AgentOrbs() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.OrthographicCamera;
    renderer: THREE.WebGLRenderer;
    orbs: THREE.Mesh[];
  } | null>(null);
  const animationRef = useRef<number>(0);

  // Wait for container dimensions
  useEffect(() => {
    if (!containerRef.current) return;

    const check = () => {
      if (containerRef.current && containerRef.current.clientWidth > 0 && containerRef.current.clientHeight > 0) {
        setIsReady(true);
        return true;
      }
      return false;
    };

    if (check()) return;

    const interval = setInterval(() => {
      if (check()) clearInterval(interval);
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Initialize Three.js
  useEffect(() => {
    if (!isReady || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);

    // Orthographic camera for clean 2D-ish look
    const aspect = width / height;
    const frustumSize = 100;
    const camera = new THREE.OrthographicCamera(
      -frustumSize * aspect / 2,
      frustumSize * aspect / 2,
      frustumSize / 2,
      -frustumSize / 2,
      0.1,
      1000
    );
    camera.position.z = 100;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Create orbs
    const orbs: THREE.Mesh[] = [];
    const spacing = (frustumSize * aspect) / (AGENTS.length + 1);

    AGENTS.forEach((agent, i) => {
      const x = -frustumSize * aspect / 2 + spacing * (i + 1);

      // Main orb
      const geometry = new THREE.SphereGeometry(12, 32, 32);
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color(agent.color),
        transparent: true,
        opacity: 0.9,
      });
      const orb = new THREE.Mesh(geometry, material);
      orb.position.set(x, 0, 0);
      (orb as any).agentData = agent;
      scene.add(orb);
      orbs.push(orb);

      // Glow ring
      const ringGeometry = new THREE.RingGeometry(14, 16, 32);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color(agent.color),
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.position.set(x, 0, -1);
      scene.add(ring);
    });

    sceneRef.current = { scene, camera, renderer, orbs };

    // Animation
    let time = 0;

    const animate = () => {
      time += 0.016;

      orbs.forEach((orb, i) => {
        const agent = (orb as any).agentData as AgentClass;

        // Healthy = smooth gentle pulse
        // Unhealthy = jittery
        const healthPulse = Math.sin(time * 2 + i) * 0.1 * agent.health;
        const errorJitter = agent.errorRate * (Math.random() - 0.5) * 2;

        // Scale based on health + noise
        const scale = 1 + healthPulse + errorJitter * 0.1;
        orb.scale.setScalar(scale);

        // Position jitter from low confidence
        const confidenceNoise = (1 - agent.confidence) * 1.5;
        orb.position.y = (Math.random() - 0.5) * confidenceNoise;

        // Opacity reflects overall health
        const mat = orb.material as THREE.MeshBasicMaterial;
        mat.opacity = 0.5 + agent.health * 0.5;
      });

      renderer.render(scene, camera);
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Resize handler
    const handleResize = () => {
      if (!sceneRef.current || !containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      const newAspect = w / h;

      sceneRef.current.camera.left = -frustumSize * newAspect / 2;
      sceneRef.current.camera.right = frustumSize * newAspect / 2;
      sceneRef.current.camera.updateProjectionMatrix();
      sceneRef.current.renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationRef.current);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      sceneRef.current = null;
    };
  }, [isReady]);

  return (
    <div className="h-full w-full relative">
      {/* Labels */}
      <div className="absolute bottom-1 left-0 right-0 flex justify-around z-10 pointer-events-none">
        {AGENTS.map(agent => (
          <div key={agent.id} className="text-center">
            <div
              className="w-2 h-2 rounded-full mx-auto mb-0.5"
              style={{ backgroundColor: agent.color }}
            />
            <span className="text-[8px] text-[#64748b]">{agent.name}</span>
          </div>
        ))}
      </div>
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
