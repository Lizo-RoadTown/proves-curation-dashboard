/**
 * MissionControlLayer - 3D instruments layered into the knowledge graph scene
 *
 * This module adds Mission Control instruments directly to the 3d-force-graph's
 * Three.js scene, giving us a unified 3D experience.
 *
 * Instruments:
 * 1. PipelineStreams - Animated particles along spline curves (in/out flows)
 * 2. AgentAvatar - Single 3D object encoding health/confidence/drift/error via motion
 * 3. HeatVolume - Point sprites with additive blending showing validation activity
 *
 * Usage:
 *   const layer = initMissionControlLayer(scene, camera, renderer);
 *   // In animation loop:
 *   updateMissionControlLayer(layer, state, deltaTime);
 *   // Cleanup:
 *   disposeMissionControlLayer(layer);
 */

import * as THREE from 'three';

// =============================================================================
// TYPES
// =============================================================================

export interface MissionControlState {
  pipelines: {
    inbound: PipelineState;
    outbound: PipelineState;
  };
  agent: AgentState;
  heat: HeatPoint[];
}

export interface PipelineState {
  rate: number;        // items/sec (affects particle density/speed)
  latencyMs: number;   // ms (affects particle speed)
  status: 'healthy' | 'degraded' | 'down';
}

export interface AgentState {
  health: number;      // 0-1, affects scale stability
  confidence: number;  // 0-1, affects emissive glow
  drift: number;       // 0-1, affects tilt/wobble
  errorRate: number;   // 0-1, affects jitter amplitude
}

export interface HeatPoint {
  pos: THREE.Vector3;
  intensity: number;   // 0-1
  ts: number;          // timestamp for decay
}

export interface MissionControlLayer {
  group: THREE.Group;
  pipelines: {
    inbound: PipelineObject;
    outbound: PipelineObject;
  };
  agent: AgentObject;
  heat: HeatObject;
}

interface PipelineObject {
  curve: THREE.CatmullRomCurve3;
  tube: THREE.Mesh;
  particles: THREE.Points;
  particleSeeds: Float32Array;
  state: PipelineState;
}

interface AgentObject {
  group: THREE.Group;
  core: THREE.Mesh;
  shell: THREE.Mesh;
  ring: THREE.Mesh;
  state: AgentState;
}

interface HeatObject {
  points: THREE.Points;
  geometry: THREE.BufferGeometry;
  material: THREE.PointsMaterial;
  heatPoints: HeatPoint[];
}

// =============================================================================
// CONSTANTS
// =============================================================================

const PARTICLE_COUNT = 120;
const HEAT_DECAY_MS = 45000; // Heat points fade over 45 seconds
const AGENT_POSITION = new THREE.Vector3(0, 80, 0); // Above the graph

// Pipeline curves - positioned to flow into/out of the graph center
const INBOUND_CURVE_POINTS: [number, number, number][] = [
  [-200, 40, 100],
  [-120, 25, 50],
  [-60, 12, 20],
  [-20, 5, 5],
  [0, 0, 0],
];

const OUTBOUND_CURVE_POINTS: [number, number, number][] = [
  [0, 0, 0],
  [20, 5, -5],
  [60, 12, -20],
  [120, 25, -50],
  [200, 40, -100],
];

// =============================================================================
// INITIALIZATION
// =============================================================================

export function initMissionControlLayer(
  scene: THREE.Scene,
  _camera: THREE.Camera,
  _renderer: THREE.WebGLRenderer
): MissionControlLayer {
  const group = new THREE.Group();
  group.name = 'MissionControlLayer';

  // Initialize pipelines
  const inboundPipeline = createPipeline(INBOUND_CURVE_POINTS, 0x06b6d4); // cyan
  const outboundPipeline = createPipeline(OUTBOUND_CURVE_POINTS, 0x22c55e); // green

  group.add(inboundPipeline.tube);
  group.add(inboundPipeline.particles);
  group.add(outboundPipeline.tube);
  group.add(outboundPipeline.particles);

  // Initialize agent avatar
  const agent = createAgentAvatar();
  group.add(agent.group);

  // Initialize heat volume
  const heat = createHeatVolume();
  group.add(heat.points);

  // Add to scene
  scene.add(group);

  return {
    group,
    pipelines: {
      inbound: inboundPipeline,
      outbound: outboundPipeline,
    },
    agent,
    heat,
  };
}

// =============================================================================
// PIPELINE CREATION
// =============================================================================

function createPipeline(curvePoints: [number, number, number][], color: number): PipelineObject {
  const curve = new THREE.CatmullRomCurve3(
    curvePoints.map(p => new THREE.Vector3(...p)),
    false,
    'catmullrom',
    0.5
  );

  // Faint tube for the pipe body
  const tubeGeometry = new THREE.TubeGeometry(curve, 64, 1.5, 8, false);
  const tubeMaterial = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.08,
    depthWrite: false,
  });
  const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);

  // Particles that flow along the pipe
  const particleGeometry = new THREE.BufferGeometry();
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const particleSeeds = new Float32Array(PARTICLE_COUNT);

  // Initialize particle positions along the curve
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const t = Math.random();
    particleSeeds[i] = t;
    const pos = curve.getPointAt(t);
    positions[i * 3] = pos.x;
    positions[i * 3 + 1] = pos.y;
    positions[i * 3 + 2] = pos.z;

    // Color with slight variation
    const c = new THREE.Color(color);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }

  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const particleMaterial = new THREE.PointsMaterial({
    size: 3,
    vertexColors: true,
    transparent: true,
    opacity: 0.7,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const particles = new THREE.Points(particleGeometry, particleMaterial);

  return {
    curve,
    tube,
    particles,
    particleSeeds,
    state: { rate: 1, latencyMs: 500, status: 'healthy' },
  };
}

// =============================================================================
// AGENT AVATAR CREATION
// =============================================================================

function createAgentAvatar(): AgentObject {
  const group = new THREE.Group();
  group.position.copy(AGENT_POSITION);

  // Core - icosahedron that represents the agent
  const coreGeometry = new THREE.IcosahedronGeometry(8, 2);
  const coreMaterial = new THREE.MeshStandardMaterial({
    color: 0x0ea5e9,
    roughness: 0.35,
    metalness: 0.2,
    emissive: 0x0ea5e9,
    emissiveIntensity: 0.3,
  });
  const core = new THREE.Mesh(coreGeometry, coreMaterial);
  group.add(core);

  // Shell - wireframe showing error state
  const shellGeometry = new THREE.IcosahedronGeometry(10, 1);
  const shellMaterial = new THREE.MeshBasicMaterial({
    color: 0x64748b,
    wireframe: true,
    transparent: true,
    opacity: 0.2,
  });
  const shell = new THREE.Mesh(shellGeometry, shellMaterial);
  group.add(shell);

  // Ring - torus that indicates drift
  const ringGeometry = new THREE.TorusGeometry(14, 0.5, 8, 64);
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0x06b6d4,
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
  });
  const ring = new THREE.Mesh(ringGeometry, ringMaterial);
  ring.rotation.x = Math.PI / 2;
  group.add(ring);

  return {
    group,
    core,
    shell,
    ring,
    state: { health: 1, confidence: 1, drift: 0, errorRate: 0 },
  };
}

// =============================================================================
// HEAT VOLUME CREATION
// =============================================================================

function createHeatVolume(): HeatObject {
  const geometry = new THREE.BufferGeometry();
  const material = new THREE.PointsMaterial({
    size: 4,
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
  });

  // Start with empty arrays
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(0), 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(0), 3));

  const points = new THREE.Points(geometry, material);

  return {
    points,
    geometry,
    material,
    heatPoints: [],
  };
}

// =============================================================================
// UPDATE LOOP
// =============================================================================

export function updateMissionControlLayer(
  layer: MissionControlLayer,
  state: MissionControlState,
  dt: number
): void {
  // Update pipelines
  updatePipeline(layer.pipelines.inbound, state.pipelines.inbound, dt);
  updatePipeline(layer.pipelines.outbound, state.pipelines.outbound, dt);

  // Update agent avatar
  updateAgent(layer.agent, state.agent, dt);

  // Update heat volume
  updateHeat(layer.heat, state.heat);
}

function updatePipeline(pipeline: PipelineObject, state: PipelineState, dt: number): void {
  pipeline.state = state;

  // Calculate speed based on rate and latency
  const rateFactor = THREE.MathUtils.clamp(state.rate, 0, 2);
  const latFactor = THREE.MathUtils.clamp(800 / Math.max(120, state.latencyMs), 0.4, 2.0);
  const baseSpeed = 0.08 * rateFactor * latFactor;

  // Status affects speed
  const statusMul = state.status === 'down' ? 0.05 : state.status === 'degraded' ? 0.5 : 1.0;
  const speed = baseSpeed * statusMul;

  // Update particle positions
  const positions = pipeline.particles.geometry.attributes.position as THREE.BufferAttribute;
  const posArray = positions.array as Float32Array;

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    // Advance particle along curve
    pipeline.particleSeeds[i] = (pipeline.particleSeeds[i] + dt * speed) % 1;
    const t = pipeline.particleSeeds[i];
    const pos = pipeline.curve.getPointAt(t);

    posArray[i * 3] = pos.x;
    posArray[i * 3 + 1] = pos.y;
    posArray[i * 3 + 2] = pos.z;
  }

  positions.needsUpdate = true;

  // Update tube opacity based on status
  const tubeMat = pipeline.tube.material as THREE.MeshBasicMaterial;
  tubeMat.opacity = state.status === 'down' ? 0.02 : state.status === 'degraded' ? 0.05 : 0.08;

  // Update particle opacity based on status
  const particleMat = pipeline.particles.material as THREE.PointsMaterial;
  particleMat.opacity = state.status === 'down' ? 0.15 : state.status === 'degraded' ? 0.4 : 0.7;
}

function updateAgent(agent: AgentObject, state: AgentState, dt: number): void {
  agent.state = state;
  const g = agent.group;
  const core = agent.core;
  const ring = agent.ring;

  // Activity: rotation based on health + confidence
  const activity = THREE.MathUtils.clamp((state.health + state.confidence) / 2, 0, 1);
  g.rotation.y += dt * (0.3 + activity * 0.8);

  // Drift: tilt + slow precession
  const drift = THREE.MathUtils.clamp(state.drift, 0, 1);
  g.rotation.z = THREE.MathUtils.lerp(g.rotation.z, drift * 0.4, 0.04);

  // Error rate: wobble/jitter
  const e = THREE.MathUtils.clamp(state.errorRate, 0, 1);
  const wobble = e * 2;
  const time = Date.now() * 0.001;
  g.position.x = AGENT_POSITION.x + Math.sin(time * 2) * wobble;
  g.position.y = AGENT_POSITION.y + Math.cos(time * 1.7) * wobble;

  // Health: scale
  const health = THREE.MathUtils.clamp(state.health, 0, 1);
  const baseScale = THREE.MathUtils.lerp(0.8, 1.1, health);
  core.scale.setScalar(baseScale);

  // Confidence: emissive intensity
  const coreMat = core.material as THREE.MeshStandardMaterial;
  coreMat.emissiveIntensity = THREE.MathUtils.lerp(0.1, 0.5, state.confidence);

  // Ring responds to drift
  ring.rotation.x += dt * (0.2 + drift * 1.5);
}

function updateHeat(heat: HeatObject, heatPoints: HeatPoint[]): void {
  heat.heatPoints = heatPoints;
  const now = Date.now();

  // Filter out fully decayed points
  const activePoints = heatPoints.filter(p => now - p.ts < HEAT_DECAY_MS);

  if (activePoints.length === 0) {
    // Clear geometry if no active points
    heat.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(0), 3));
    heat.geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(0), 3));
    return;
  }

  const positions = new Float32Array(activePoints.length * 3);
  const colors = new Float32Array(activePoints.length * 3);

  for (let i = 0; i < activePoints.length; i++) {
    const p = activePoints[i];
    const age = Math.min(1, (now - p.ts) / HEAT_DECAY_MS);
    const fade = 1 - age;

    positions[i * 3] = p.pos.x;
    positions[i * 3 + 1] = p.pos.y;
    positions[i * 3 + 2] = p.pos.z;

    // Cool cyan-ish heat color
    const intensity = Math.max(0, Math.min(1, p.intensity)) * fade;
    colors[i * 3] = 0.15 * intensity;
    colors[i * 3 + 1] = 0.55 * intensity;
    colors[i * 3 + 2] = 0.85 * intensity;
  }

  heat.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  heat.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  heat.geometry.computeBoundingSphere();
}

// =============================================================================
// HEAT EMISSION (call when nodes are validated/promoted)
// =============================================================================

export function emitHeat(
  heat: HeatObject,
  position: THREE.Vector3,
  intensity: number = 0.8
): void {
  heat.heatPoints.push({
    pos: position.clone(),
    intensity,
    ts: Date.now(),
  });

  // Limit heat points to prevent memory issues
  if (heat.heatPoints.length > 500) {
    heat.heatPoints = heat.heatPoints.slice(-500);
  }
}

// =============================================================================
// CLEANUP
// =============================================================================

export function disposeMissionControlLayer(layer: MissionControlLayer): void {
  // Dispose pipelines
  disposePipeline(layer.pipelines.inbound);
  disposePipeline(layer.pipelines.outbound);

  // Dispose agent
  layer.agent.core.geometry.dispose();
  (layer.agent.core.material as THREE.Material).dispose();
  layer.agent.shell.geometry.dispose();
  (layer.agent.shell.material as THREE.Material).dispose();
  layer.agent.ring.geometry.dispose();
  (layer.agent.ring.material as THREE.Material).dispose();

  // Dispose heat
  layer.heat.geometry.dispose();
  layer.heat.material.dispose();

  // Remove from scene
  layer.group.parent?.remove(layer.group);
}

function disposePipeline(pipeline: PipelineObject): void {
  pipeline.tube.geometry.dispose();
  (pipeline.tube.material as THREE.Material).dispose();
  pipeline.particles.geometry.dispose();
  (pipeline.particles.material as THREE.Material).dispose();
}
