import React, { useEffect, useRef } from 'react';

interface Point3D {
  x: number;
  y: number;
  z: number;
  baseX: number;
  baseY: number;
  baseZ: number;
  angle: number;
  speed: number;
  radius: number;
}

export default function Footer3DVisuals() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = rect?.width || 800;
      const height = 110;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    
    // ResizeObserver tracks container resize dynamically without reading raw window sizes
    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
    });
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const localX = e.clientX - rect.left;
      const localY = e.clientY - rect.top;
      mouseRef.current.targetX = (localX / rect.width) * 2 - 1;
      mouseRef.current.targetY = (localY / rect.height) * 2 - 1;
    };

    const handleMouseLeave = () => {
      mouseRef.current.targetX = 0;
      mouseRef.current.targetY = 0;
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mouseleave', handleMouseLeave);
    }

    // Generate high-end bio-visual particles (a 3D double sine-wave helix or lattice structure)
    const points: Point3D[] = [];
    const numPoints = 28;

    for (let i = 0; i < numPoints; i++) {
      // Helix A
      const pct = i / numPoints;
      const theta = pct * Math.PI * 4;
      const x = (pct - 0.5) * 580; // horizontal distribution
      
      points.push({
        x: x,
        y: Math.sin(theta) * 20,
        z: Math.cos(theta) * 20,
        baseX: x,
        baseY: Math.sin(theta) * 20,
        baseZ: Math.cos(theta) * 20,
        angle: theta,
        speed: 0.02 + Math.random() * 0.015,
        radius: 3.5 + Math.random() * 1.5,
      });

      // Helix B (Offset)
      points.push({
        x: x,
        y: Math.sin(theta + Math.PI) * 20,
        z: Math.cos(theta + Math.PI) * 20,
        baseX: x,
        baseY: Math.sin(theta + Math.PI) * 20,
        baseZ: Math.cos(theta + Math.PI) * 20,
        angle: theta + Math.PI,
        speed: 0.02 + Math.random() * 0.015,
        radius: 3.5 + Math.random() * 1.5,
      });
    }

    let rx = 0.005;
    let ry = 0.008;
    let frameId: number;

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      ctx.clearRect(0, 0, width, height);

      // Damp mouse coordinates
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.08;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.08;

      // Update 3D nodes rotations
      rx += 0.012 + mouseRef.current.y * 0.01;
      ry += 0.008 + mouseRef.current.x * 0.01;

      // Projection parameters
      const centerX = width / 2;
      const centerY = height / 2;
      const cameraDistance = 200;

      const projected = points.map((p) => {
        // Dynamic oscillation logic to simulate cardiac pulsation/DNA breathing
        p.angle += p.speed;
        const pulse = 1.0 + Math.sin(p.angle * 2) * 0.12;

        // Apply local rotation about the helix's axis
        const cosRy = Math.cos(ry);
        const sinRy = Math.sin(ry);
        
        // 3D Rotated values around Y-helix axis
        const rotX = p.baseX;
        const rotY = (p.baseY * Math.cos(p.angle) - p.baseZ * Math.sin(p.angle)) * pulse;
        const rotZ = (p.baseY * Math.sin(p.angle) + p.baseZ * Math.cos(p.angle)) * pulse;

        // Apply perspective
        const depth = rotZ + 120;
        const denom = Math.max(10, cameraDistance + depth);
        const perspective = cameraDistance / denom;

        const sx = centerX + rotX * perspective;
        const sy = centerY + rotY * perspective;

        return {
          sx,
          sy,
          sz: depth,
          radius: Math.max(0.1, p.radius * perspective),
          opacity: Math.max(0.08, Math.min(0.9, perspective * 0.85)),
        };
      });

      // 1. Draw connecting micro-bridges representing bio-bonds
      ctx.lineWidth = 0.7;
      for (let i = 0; i < projected.length; i += 2) {
        const ptA = projected[i];
        const ptB = projected[i + 1];

        if (ptA && ptB) {
          // Dark visuals - slate-800 & slate-400 bonds
          const avgZ = (ptA.sz + ptB.sz) / 2;
          const alpha = Math.max(0.03, Math.min(0.35, 120 / avgZ));
          
          ctx.beginPath();
          ctx.moveTo(ptA.sx, ptA.sy);
          ctx.lineTo(ptB.sx, ptB.sy);
          ctx.strokeStyle = `rgba(15, 23, 42, ${alpha})`;
          ctx.stroke();
        }
      }

      // 2. Draw backbone strands
      ctx.lineWidth = 0.95;
      for (let i = 2; i < projected.length; i += 2) {
        const prevA = projected[i - 2];
        const currA = projected[i];
        const prevB = projected[i - 1];
        const currB = projected[i + 1];

        if (prevA && currA) {
          ctx.beginPath();
          ctx.moveTo(prevA.sx, prevA.sy);
          ctx.lineTo(currA.sx, currA.sy);
          ctx.strokeStyle = 'rgba(30, 41, 59, 0.14)';
          ctx.stroke();
        }
        if (prevB && currB) {
          ctx.beginPath();
          ctx.moveTo(prevB.sx, prevB.sy);
          ctx.lineTo(currB.sx, currB.sy);
          ctx.strokeStyle = 'rgba(71, 85, 105, 0.12)';
          ctx.stroke();
        }
      }

      // 3. Draw individual elements
      projected.forEach((p, idx) => {
        // Deep high contrast colors for dark molecular visual look
        const color = idx % 2 === 0 ? 'rgba(15, 23, 42, 0.88)' : 'rgba(51, 65, 85, 0.84)';
        
        // Draw glow effect for larger particles
        if (p.radius > 2.8) {
          ctx.beginPath();
          ctx.arc(p.sx, p.sy, p.radius * 2.3, 0, Math.PI * 2);
          ctx.fillStyle = idx % 2 === 0 ? 'rgba(6, 182, 212, 0.08)' : 'rgba(124, 58, 237, 0.08)';
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(p.sx, p.sy, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      });

      frameId = requestAnimationFrame(draw);
    };

    frameId = requestAnimationFrame(draw);

    return () => {
      resizeObserver.disconnect();
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('mouseleave', handleMouseLeave);
      }
      cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="relative w-full rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-2 overflow-hidden shadow-xl"
      id="footer-3d-visuals-container"
    >
      {/* Decorative dark grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b12_1px,transparent_1px),linear-gradient(to_bottom,#1e293b12_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none opacity-40" />
      
      {/* Visual canvas */}
      <canvas 
        ref={canvasRef} 
        className="block cursor-crosshair z-10 mx-auto"
        id="footer-3d-visuals-canvas"
      />

      {/* Floating high-contrast developer overlay */}
      <div className="absolute inset-0 z-20 flex flex-col sm:flex-row items-center justify-between px-6 py-4 gap-4 bg-slate-950/40 pointer-events-none" id="footer-dev-overlay">
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="relative">
            <img 
              src="https://github.com/jkbharti159.png" 
              alt="Jitendra Bharti" 
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-full border-2 border-cyan-500/80 shadow-md shadow-cyan-500/10 object-cover"
              onError={(e) => {
                // If github image fails, we show a beautiful fallback
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900 animate-pulse" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-cyan-400 font-bold font-mono">Platform Creator</div>
            <div className="text-sm font-extrabold text-white tracking-tight">Developed by Jitendra Bharti</div>
          </div>
        </div>

        <div className="flex items-center gap-3 pointer-events-auto shrink-0 select-none">
          <a 
            href="https://www.linkedin.com/in/jkbharti159/" 
            target="_blank" 
            rel="noreferrer" 
            className="px-3.5 py-1.5 rounded-lg bg-slate-900/90 hover:bg-cyan-950/80 text-xs font-bold text-cyan-400 hover:text-cyan-300 border border-slate-800 hover:border-cyan-500/30 shadow-xs transition-all flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c==0-1.337-.025-3.061-1.865-3.061-1.867 0-2.153 1.459-2.153 2.964v5.701h-3v-11h2.88v1.503h.04c.401-.76 1.381-1.56 2.84-1.56 3.04 0 3.6 2.001 3.6 4.602v6.455z"/>
            </svg>
            <span>LinkedIn</span>
          </a>

          <a 
            href="https://jitendra-bharti.vercel.app/" 
            target="_blank" 
            rel="noreferrer" 
            className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-xs font-bold text-white shadow-md shadow-violet-500/10 hover:shadow-violet-500/20 transition-all flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5 stroke-current fill-none" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <span>Portfolio</span>
          </a>
        </div>
      </div>
      
      {/* Interactivity prompt */}
      <div className="absolute bottom-2 right-4 text-[9px] font-mono tracking-widest text-slate-500 pointer-events-none select-none uppercase">
        3D Biometric Thread • Move mouse to pivot
      </div>
    </div>
  );
}
