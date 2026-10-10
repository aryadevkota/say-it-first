/**
 * AffectRadarCanvas.tsx — Presentation Component
 *
 * 2D Cartesian phase plot mapping Valence (X) x Arousal (Y).
 * Specification: Tech Spec §6.2 Panel 2
 */

import React, { useEffect, useRef } from 'react';
import type { AffectVector } from '../../domain/entities/AffectVector';

export interface AffectRadarCanvasProps {
  currentVad: AffectVector;
  historyCoordinates?: AffectVector[];
  width?: number;
  height?: number;
}

export const AffectRadarCanvas: React.FC<AffectRadarCanvasProps> = ({
  currentVad,
  historyCoordinates = [],
  width = 240,
  height = 240,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const scale = (w / 2) * 0.85;

    // Clear background
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#1A2232';
    ctx.fillRect(0, 0, w, h);

    // Draw grid rings
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    [0.33, 0.66, 1.0].forEach((r) => {
      ctx.beginPath();
      ctx.arc(cx, cy, scale * r, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Draw axes
    ctx.beginPath();
    ctx.moveTo(cx - scale, cy);
    ctx.lineTo(cx + scale, cy);
    ctx.moveTo(cx, cy - scale);
    ctx.lineTo(cx, cy + scale);
    ctx.stroke();

    // Axis labels
    ctx.fillStyle = '#64748B';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('+A (Urgent)', cx, cy - scale - 4);
    ctx.fillText('-A (Calm)', cx, cy + scale + 12);
    ctx.textAlign = 'right';
    ctx.fillText('-V (Guarded)', cx - scale - 4, cy + 3);
    ctx.textAlign = 'left';
    ctx.fillText('+V (Receptive)', cx + scale + 4, cy + 3);

    // Draw historical trajectory trail
    if (historyCoordinates.length > 0) {
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.35)'; // Violet trail
      ctx.lineWidth = 2;
      historyCoordinates.forEach((coord, i) => {
        const x = cx + coord.valence * scale;
        const y = cy - coord.arousal * scale;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

    // Draw current coordinate point
    const currX = cx + currentVad.valence * scale;
    const currY = cy - currentVad.arousal * scale;

    // Glow ring
    ctx.beginPath();
    ctx.arc(currX, currY, 8, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(16, 185, 129, 0.25)'; // Sage glow
    ctx.fill();

    // Solid inner point
    ctx.beginPath();
    ctx.arc(currX, currY, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#10B981'; // Sage
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }, [currentVad, historyCoordinates, width, height]);

  return (
    <div
      className="flex flex-col items-center p-4 bg-[#1A2232] rounded-2xl border border-slate-800 shadow-md"
      data-testid="affect-radar-container"
    >
      <span className="text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
        Affect Radar (V × A)
      </span>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="rounded-xl border border-slate-700/50"
        data-testid="affect-radar-canvas"
      />
    </div>
  );
};
