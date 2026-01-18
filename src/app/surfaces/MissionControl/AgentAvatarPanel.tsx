/**
 * AgentAvatarPanel - Agent Health Visualization
 *
 * Shows agent state through motion-encoded visualization.
 * Health, confidence, drift, and error rate are encoded visually.
 */

import { useEffect, useRef } from "react";
import * as THREE from "three";

interface AgentAvatarPanelProps {
  health: number;      // 0-1
  confidence: number;  // 0-1
  drift: number;       // 0-1
  errorRate: number;   // 0-1
}

export function AgentAvatarPanel({ health, confidence, drift, errorRate }: AgentAvatarPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    core: THREE.Mesh;
    shell: THREE.Mesh;
    ring: THREE.Mesh;
    group: THREE.Group;
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
    camera.position.z = 60;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x0ea5e9, 1.5, 100);
    pointLight.position.set(20, 20, 30);
    scene.add(pointLight);

    // Agent avatar group
    const group = new THREE.Group();
    scene.add(group);

    // Core - icosahedron
    const coreGeometry = new THREE.IcosahedronGeometry(10, 2);
    const coreMaterial = new THREE.MeshStandardMaterial({
      color: 0x0ea5e9,
      roughness: 0.3,
      metalness: 0.2,
      emissive: 0x0ea5e9,
      emissiveIntensity: 0.4,
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    group.add(core);

    // Shell - wireframe
    const shellGeometry = new THREE.IcosahedronGeometry(14, 1);
    const shellMaterial = new THREE.MeshBasicMaterial({
      color: 0x64748b,
      wireframe: true,
      transparent: true,
      opacity: 0.25,
    });
    const shell = new THREE.Mesh(shellGeometry, shellMaterial);
    group.add(shell);

    // Ring - torus
    const ringGeometry = new THREE.TorusGeometry(18, 0.8, 8, 64);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.4,
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    group.add(ring);

    sceneRef.current = { scene, camera, renderer, core, shell, ring, group };

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

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationRef.current);
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  // Animation loop - updates based on props
  useEffect(() => {
    if (!sceneRef.current) return;

    const { scene, camera, renderer, core, shell, ring, group } = sceneRef.current;
    let lastTime = performance.now();

    const animate = () => {
      const now = performance.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      // Rotation based on health + confidence (activity level)
      const activity = (health + confidence) / 2;
      group.rotation.y += dt * (0.3 + activity * 0.6);

      // Drift: tilt
      group.rotation.z = THREE.MathUtils.lerp(group.rotation.z, drift * 0.5, 0.05);

      // Error rate: wobble
      const wobble = errorRate * 3;
      const time = now * 0.001;
      group.position.x = Math.sin(time * 2.5) * wobble;
      group.position.y = Math.cos(time * 2) * wobble;

      // Health: scale
      const scale = THREE.MathUtils.lerp(0.7, 1.1, health);
      core.scale.setScalar(scale);

      // Confidence: emissive intensity
      const mat = core.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = THREE.MathUtils.lerp(0.1, 0.6, confidence);

      // Ring responds to drift
      ring.rotation.x += dt * (0.15 + drift * 1.2);

      // Shell responds to error
      shell.rotation.x += dt * errorRate * 2;
      shell.rotation.z += dt * errorRate * 1.5;

      renderer.render(scene, camera);
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [health, confidence, drift, errorRate]);

  return (
    <div className="h-full w-full relative">
      <div className="absolute top-2 left-3 text-xs font-medium text-[#94a3b8] z-10">
        AGENT STATUS
      </div>

      {/* Stats overlay */}
      <div className="absolute bottom-2 left-2 right-2 z-10 grid grid-cols-2 gap-1 text-[10px]">
        <div className="flex items-center justify-between px-2 py-1 bg-[#1e293b]/80 rounded">
          <span className="text-[#64748b]">Health</span>
          <span className="text-[#22c55e]">{(health * 100).toFixed(0)}%</span>
        </div>
        <div className="flex items-center justify-between px-2 py-1 bg-[#1e293b]/80 rounded">
          <span className="text-[#64748b]">Confidence</span>
          <span className="text-[#06b6d4]">{(confidence * 100).toFixed(0)}%</span>
        </div>
        <div className="flex items-center justify-between px-2 py-1 bg-[#1e293b]/80 rounded">
          <span className="text-[#64748b]">Drift</span>
          <span className={drift > 0.3 ? "text-[#f59e0b]" : "text-[#94a3b8]"}>{(drift * 100).toFixed(0)}%</span>
        </div>
        <div className="flex items-center justify-between px-2 py-1 bg-[#1e293b]/80 rounded">
          <span className="text-[#64748b]">Errors</span>
          <span className={errorRate > 0.1 ? "text-[#ef4444]" : "text-[#94a3b8]"}>{(errorRate * 100).toFixed(0)}%</span>
        </div>
      </div>

      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
