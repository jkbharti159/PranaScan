import React, { useEffect, useRef } from 'react';

interface AbbreviationOrbiter {
  name: string;
  latin: string;
  description: string;
  radius: number;
  speed: number;
  angle: number;
  color: string;
  pathColor: string;
  glowColor: string;
}

export default function Abbreviations3DVisualizer({ activeAbbrev }: { activeAbbrev: string | null }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  // Customized orbit definitions mapping directly to the medical frequencies
  const orbiters: AbbreviationOrbiter[] = [
    { name: 'PRN', latin: 'Pro Re Nata', description: 'As needed', radius: 35, speed: 0.02, angle: 0, color: 'rgb(59, 130, 246)', pathColor: 'rgba(59,130,246,0.1)', glowColor: 'rgba(59,130,246,0.4)' },
    { name: 'qd / Daily', latin: 'Quaque Die', description: 'Once daily loop', radius: 50, speed: 0.012, angle: Math.PI * 0.4, color: 'rgb(16, 185, 129)', pathColor: 'rgba(16,185,129,0.1)', glowColor: 'rgba(16,185,129,0.4)' },
    { name: 'bid', latin: 'Bis in Die', description: 'Twice daily check', radius: 68, speed: 0.025, angle: Math.PI * 0.8, color: 'rgb(244, 63, 94)', pathColor: 'rgba(244,63,94,0.1)', glowColor: 'rgba(244,63,94,0.4)' },
    { name: 'NPO', latin: 'Nil Per Os', description: 'Fasting shield', radius: 84, speed: 0.007, angle: Math.PI * 1.2, color: 'rgb(234, 179, 8)', pathColor: 'rgba(234,179,8,0.1)', glowColor: 'rgba(234,179,8,0.4)' },
    { name: 'R.I.C.E', latin: 'Rest Ice Comp Elev', description: 'Structural recovery', radius: 100, speed: 0.015, angle: Math.PI * 1.6, color: 'rgb(168, 85, 247)', pathColor: 'rgba(168,85,247,0.1)', glowColor: 'rgba(168,85,247,0.4)' }
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameId: number;

    const resize = () => {
       const rect = containerRef.current?.getBoundingClientRect();
       const dpr = window.devicePixelRatio || 1;
       const w = rect?.width || 380;
       const h = rect?.height || 230;
       canvas.width = w * dpr;
       canvas.height = h * dpr;
       canvas.style.width = `${w}px`;
       canvas.style.height = `${h}px`;
       ctx.scale(dpr, dpr);
     };

    resize();
    const observer = new ResizeObserver(() => resize());
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width * 2 - 1;
      const y = (e.clientY - rect.top) / rect.height * 2 - 1;
      mouseRef.current.targetX = x * 0.4;
      mouseRef.current.targetY = y * 0.4;
    };

    const handleMouseLeave = () => {
      mouseRef.current.targetX = 0;
      mouseRef.current.targetY = 0;
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    let yaw = 0;
    let pitch = 0.5; // perspective tilt of orbits

    const loop = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      ctx.clearRect(0, 0, w, h);

      // Damp mouse influence
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.08;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.08;

      pitch = 0.4 + mouseRef.current.y;
      yaw += 0.004 + mouseRef.current.x * 0.01;

      const cx = w / 2;
      const cy = h / 2;
      const d = 260; // Camera distance

      // Project 3D circle orbits flat to capture true depth tilt
      const projectOrbiter = (orb: AbbreviationOrbiter, theta: number) => {
        // Compute 3D space relative position
        const localX = orb.radius * Math.cos(theta);
        const localZ = orb.radius * Math.sin(theta);
        
        // Rotate orbit coordinates globally on pitch/yaw
        const cosY = Math.cos(yaw);
        const sinY = Math.sin(yaw);
        const cosP = Math.cos(pitch);
        const sinP = Math.sin(pitch);

        const x1 = localX * cosY - localZ * sinY;
        const z1 = localX * sinY + localZ * cosY;

        const y2 = -z1 * sinP;
        const z2 = z1 * cosP;

        const scale = d / (d + z2);

        return {
          sx: cx + x1 * scale,
          sy: cy + y2 * scale,
          sz: z2,
          scale
        };
      };

      // 1. Draw central clinical nucleus (representing prescription core)
      ctx.beginPath();
      ctx.arc(cx, cy, 14, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fill();

      // Pulsing cellular core label
      ctx.font = 'bold 8px monospace';
      ctx.fillStyle = '#34d399';
      ctx.textAlign = 'center';
      ctx.fillText("MED", cx, cy - 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillText("CORE", cx, cy + 7);

      // 2. Draw Orbit Paths and active tracking rings
      orbiters.forEach((orb) => {
        const isMatched = activeAbbrev?.toLowerCase().includes(orb.name.toLowerCase().split(' ')[0]) || false;
        
        // Render 3D path ellipse representation
        ctx.beginPath();
        for (let a = 0; a <= Math.PI * 2; a += 0.1) {
          const proj = projectOrbiter(orb, a);
          if (a === 0) {
            ctx.moveTo(proj.sx, proj.sy);
          } else {
            ctx.lineTo(proj.sx, proj.sy);
          }
        }
        ctx.closePath();
        ctx.strokeStyle = isMatched ? 'rgba(56, 189, 248, 0.45)' : 'rgba(148, 163, 184, 0.15)';
        ctx.lineWidth = isMatched ? 1.6 : 0.8;
        ctx.stroke();

        // Increment rotation state for the revolving satellite
        orb.angle += orb.speed;

        // Project currently revolving node position
        const nodeProj = projectOrbiter(orb, orb.angle);
        const ptSize = Math.max(0.5, (isMatched ? 9.5 : 6) * nodeProj.scale);

        // Render ambient node shadow / glow
        ctx.beginPath();
        ctx.arc(nodeProj.sx, nodeProj.sy, ptSize * 2.8, 0, Math.PI * 2);
        ctx.fillStyle = isMatched ? orb.glowColor : 'rgba(148, 163, 184, 0.08)';
        ctx.fill();

        // Core Solid Circle for Medication Node
        ctx.beginPath();
        ctx.arc(nodeProj.sx, nodeProj.sy, ptSize, 0, Math.PI * 2);
        ctx.fillStyle = orb.color;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = isMatched ? 3 : 1;
        ctx.stroke();
        ctx.fill();

        // Label positioning
        const textYOffset = ptSize + (isMatched ? 16 : 10);
        ctx.font = isMatched ? 'bold 11px sans-serif' : '9px monospace';
        ctx.fillStyle = isMatched ? '#38bdf8' : '#94a3b8';
        ctx.textAlign = 'center';
        ctx.fillText(orb.name, nodeProj.sx, nodeProj.sy - textYOffset);

        if (isMatched) {
          ctx.font = '8px monospace';
          ctx.fillStyle = '#818cf8';
          ctx.fillText(orb.latin, nodeProj.sx, nodeProj.sy + textYOffset);
        }
      });

      frameId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      observer.disconnect();
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(frameId);
    };
  }, [activeAbbrev]);

  return (
    <div 
      ref={containerRef} 
      className="relative w-full rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 p-2 overflow-hidden shadow-xl h-full w-full flex items-center justify-center cursor-help shadow-indigo-950/10"
      id="abbrev-3d-visualizer-container"
    >
      <div className="absolute inset-0 bg-[radial-gradient(#334155_1.2px,transparent_1.2px)] [background-size:16px_16px] opacity-35 pointer-events-none" />
      
      <canvas 
        ref={canvasRef} 
        className="block"
        id="abbrev-3d-visualizer-canvas"
      />
    </div>
  );
}
