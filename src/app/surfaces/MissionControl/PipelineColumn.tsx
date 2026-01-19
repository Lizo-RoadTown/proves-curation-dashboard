/**
 * PipelineColumn - Vertical stack of university pipeline indicators
 *
 * Shows 5 universities as animated pipe segments.
 * Visual encoding:
 * - Color = university identity
 * - Pulse animation = flow rate (faster pulse = more data)
 * - Opacity = health (dim = degraded)
 * - Width = volume (thicker = more throughput)
 */

import { useEffect, useRef, useState } from "react";

interface Pipeline {
  id: string;
  name: string;
  abbrev: string;
  color: string;
  rate: number;        // 0-2: flow rate
  latencyMs: number;   // ms
  status: 'healthy' | 'degraded' | 'down';
}

const PIPELINES: Pipeline[] = [
  { id: 'cpp', name: 'Cal Poly Pomona', abbrev: 'CPP', color: '#22c55e', rate: 1.5, latencyMs: 280, status: 'healthy' },
  { id: 'columbia', name: 'Columbia', abbrev: 'COL', color: '#3b82f6', rate: 0.9, latencyMs: 420, status: 'healthy' },
  { id: 'northeastern', name: 'Northeastern', abbrev: 'NEU', color: '#ef4444', rate: 1.2, latencyMs: 310, status: 'healthy' },
  { id: 'ucsc', name: 'UC Santa Cruz', abbrev: 'UCSC', color: '#f59e0b', rate: 0.6, latencyMs: 500, status: 'degraded' },
  { id: 'txstate', name: 'Texas State', abbrev: 'TXS', color: '#8b5cf6', rate: 0.4, latencyMs: 380, status: 'healthy' },
];

interface PipelineColumnProps {
  direction: 'in' | 'out';
}

export function PipelineColumn({ direction }: PipelineColumnProps) {
  return (
    <div className="flex-1 flex flex-col justify-around py-2">
      {PIPELINES.map(pipeline => (
        <PipelineIndicator key={pipeline.id} pipeline={pipeline} direction={direction} />
      ))}
    </div>
  );
}

function PipelineIndicator({ pipeline, direction }: { pipeline: Pipeline; direction: 'in' | 'out' }) {
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    const speed = 1 + pipeline.rate; // faster rate = faster animation
    const interval = setInterval(() => {
      setPulse(p => (p + 0.05 * speed) % 1);
    }, 50);
    return () => clearInterval(interval);
  }, [pipeline.rate]);

  const opacity = pipeline.status === 'degraded' ? 0.4 : pipeline.status === 'down' ? 0.1 : 0.9;
  const width = Math.max(4, Math.min(12, 4 + pipeline.rate * 4));

  // Pulse creates a moving gradient effect
  const pulseIntensity = Math.sin(pulse * Math.PI * 2) * 0.3 + 0.7;

  return (
    <div className="flex items-center gap-1 px-1" title={pipeline.name}>
      {/* Label */}
      <span className="text-[8px] text-[#64748b] w-8 truncate">{pipeline.abbrev}</span>

      {/* Pipe */}
      <div
        className="flex-1 h-full flex items-center justify-center"
        style={{ minHeight: '16px' }}
      >
        <div
          className="rounded-full transition-all duration-100"
          style={{
            backgroundColor: pipeline.color,
            opacity: opacity * pulseIntensity,
            width: `${width}px`,
            height: '100%',
            minHeight: '12px',
            boxShadow: pipeline.status === 'healthy'
              ? `0 0 ${4 + pulseIntensity * 4}px ${pipeline.color}40`
              : 'none',
          }}
        />
      </div>

      {/* Flow direction indicator */}
      <span
        className="text-[8px]"
        style={{
          color: pipeline.color,
          opacity: pulseIntensity * opacity,
        }}
      >
        {direction === 'in' ? '→' : '←'}
      </span>
    </div>
  );
}
