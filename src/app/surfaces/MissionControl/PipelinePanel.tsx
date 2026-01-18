/**
 * PipelinePanel - Inbound/Outbound Flow Visualization
 *
 * Shows the flow of data through the extraction pipeline.
 * Animated particles indicate rate and health.
 */

import { useEffect, useRef } from "react";

interface PipelineState {
  rate: number;        // items/sec
  latencyMs: number;   // average latency
  status: 'healthy' | 'degraded' | 'down';
}

interface PipelinePanelProps {
  inbound: PipelineState;
  outbound: PipelineState;
}

export function PipelinePanel({ inbound, outbound }: PipelinePanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize canvas to container
    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width;
        canvas.height = rect.height;
      }
    };
    resize();
    window.addEventListener('resize', resize);

    // Particle system
    interface Particle {
      x: number;
      y: number;
      speed: number;
      direction: 'in' | 'out';
    }

    const particles: Particle[] = [];
    const PARTICLE_COUNT = 40;

    // Initialize particles
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        speed: 0.5 + Math.random() * 1.5,
        direction: i < PARTICLE_COUNT / 2 ? 'in' : 'out',
      });
    }

    // Animation loop
    let lastTime = performance.now();

    const animate = () => {
      const now = performance.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      // Clear
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerY = canvas.height / 2;
      const inboundY = centerY - 40;
      const outboundY = centerY + 40;

      // Draw pipeline tracks
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 20;
      ctx.lineCap = 'round';

      // Inbound track
      ctx.beginPath();
      ctx.moveTo(20, inboundY);
      ctx.lineTo(canvas.width - 20, inboundY);
      ctx.stroke();

      // Outbound track
      ctx.beginPath();
      ctx.moveTo(20, outboundY);
      ctx.lineTo(canvas.width - 20, outboundY);
      ctx.stroke();

      // Draw and update particles
      particles.forEach(p => {
        const isInbound = p.direction === 'in';
        const state = isInbound ? inbound : outbound;
        const y = isInbound ? inboundY : outboundY;

        // Speed based on rate and status
        const statusMul = state.status === 'down' ? 0.1 : state.status === 'degraded' ? 0.5 : 1;
        const rateMul = Math.min(2, state.rate);
        const moveSpeed = p.speed * rateMul * statusMul * 60 * dt;

        // Move particle
        if (isInbound) {
          p.x += moveSpeed; // left to right
          if (p.x > canvas.width + 10) p.x = -10;
        } else {
          p.x -= moveSpeed; // right to left
          if (p.x < -10) p.x = canvas.width + 10;
        }

        // Color based on status
        const color = state.status === 'down'
          ? '#ef4444'
          : state.status === 'degraded'
            ? '#f59e0b'
            : isInbound ? '#06b6d4' : '#22c55e';

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        // Glow effect
        ctx.beginPath();
        ctx.arc(p.x, y, 8, 0, Math.PI * 2);
        const gradient = ctx.createRadialGradient(p.x, y, 0, p.x, y, 8);
        gradient.addColorStop(0, color + '40');
        gradient.addColorStop(1, color + '00');
        ctx.fillStyle = gradient;
        ctx.fill();
      });

      // Labels
      ctx.font = '11px Inter, system-ui, sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.textAlign = 'left';
      ctx.fillText('INBOUND', 24, inboundY - 18);
      ctx.fillText('OUTBOUND', 24, outboundY - 18);

      // Stats
      ctx.textAlign = 'right';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`${inbound.rate.toFixed(1)}/s · ${inbound.latencyMs}ms`, canvas.width - 24, inboundY - 18);
      ctx.fillText(`${outbound.rate.toFixed(1)}/s · ${outbound.latencyMs}ms`, canvas.width - 24, outboundY - 18);

      // Status indicators
      const drawStatus = (x: number, y: number, status: string) => {
        const color = status === 'down' ? '#ef4444' : status === 'degraded' ? '#f59e0b' : '#22c55e';
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      };

      drawStatus(12, inboundY, inbound.status);
      drawStatus(12, outboundY, outbound.status);

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationRef.current);
    };
  }, [inbound, outbound]);

  return (
    <div className="h-full w-full relative">
      <div className="absolute top-2 left-3 text-xs font-medium text-[#94a3b8]">
        PIPELINE FLOW
      </div>
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}
