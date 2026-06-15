import React, { useEffect, useRef, useState } from 'react';

interface SuffixNode {
  name: string;
  meaning: string;
  x: number;
  y: number;
  z: number;
  color: string;
  glowColor: string;
}

export default function Suffixes3DVisualizer({ activeSuffix, onHoverSuffix }: { activeSuffix: string | null; onHoverSuffix: (suffix: string | null) => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  // 5 Key Nodes for clinical suffixes
  const nodes: SuffixNode[] = [
    { name: '-itis', meaning: 'Inflammation swell', x: -50, y: -40, z: 20, color: 'rgb(244, 63, 94)', glowColor: 'rgba(244,63,94,0.4)' },
    { name: '-ectomy', meaning: 'Resection point', x: 50, y: -40, z: -20, color: 'rgb(59, 130, 246)', glowColor: 'rgba(59,130,246,0.4)' },
    { name: '-otomy', meaning: 'Incision slit', x: -40, y: 40, z: -45, color: 'rgb(234, 179, 8)', glowColor: 'rgba(234,179,8,0.4)' },
    { name: '-megaly', meaning: 'Enlargement mass', x: 40, y: 40, z: 45, color: 'rgb(168, 85, 247)', glowColor: 'rgba(168,85,247,0.4)' },
    { name: '-pathy', meaning: 'Degeneration field', x: 0, y: 0, z: 0, color: 'rgb(16, 185, 129)', glowColor: 'rgba(16,185,129,0.4)' },
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
      mouseRef.current.targetX = x * 0.5;
      mouseRef.current.targetY = y * 0.5;
    };

    const handleMouseLeave = () => {
      mouseRef.current.targetX = 0;
      mouseRef.current.targetY = 0;
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    // Secondary surrounding orbit particles to make the 3D space look incredibly deep and biological
    const particles: {x: number, y: number, z: number, phase: number, speed: number}[] = [];
    for (let i = 0; i < 45; i++) {
      const radius = 60 + Math.random() * 50;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      particles.push({
        x: radius * Math.sin(phi) * Math.cos(theta),
        y: radius * Math.cos(phi),
        z: radius * Math.sin(phi) * Math.sin(theta),
        phase: Math.random() * 10,
        speed: 0.005 + Math.random() * 0.01
      });
    }

    let angleX = 0.01;
    let angleY = 0.015;

    const loop = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      ctx.clearRect(0, 0, w, h);

      // Damp rotation offsets
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.08;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.08;

      angleX += 0.005 + mouseRef.current.y * 0.02;
      angleY += 0.007 + mouseRef.current.x * 0.02;

      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);
      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);

      const cx = w / 2;
      const cy = h / 2;
      const d = 180; // depth viewpoint

      // Helper function for 3D projection
      const project = (px: number, py: number, pz: number) => {
        // Rotate about Y axis
        let x1 = px * cosY - pz * sinY;
        let z1 = px * sinY + pz * cosY;

        // Rotate about X axis
        let y2 = py * cosX - z1 * sinX;
        let z2 = py * sinX + z1 * cosX;

        const scale = d / (d + z2);
        return {
          sx: cx + x1 * scale,
          sy: cy + y2 * scale,
          sz: z2,
          scale
        };
      };

      // Draw secondary matrix grid lines in 3D (creates high-tech bio-scaffolding look)
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.lineWidth = 0.5;
      for (let i = 0; i < nodes.length; i++) {
        const projA = project(nodes[i].x, nodes[i].y, nodes[i].z);
        for (let j = i + 1; j < nodes.length; j++) {
          const projB = project(nodes[j].x, nodes[j].y, nodes[j].z);
          
          // Gradient or alpha based on depth
          const opacity = Math.max(0.02, Math.min(0.2, (projA.scale + projB.scale) / 8));
          ctx.beginPath();
          ctx.moveTo(projA.sx, projA.sy);
          ctx.lineTo(projB.sx, projB.sy);
          ctx.strokeStyle = `rgba(148, 163, 184, ${opacity})`;
          ctx.stroke();
        }
      }

      // Draw biological orbital particles (ambient cellular nodes)
      particles.forEach((p) => {
        p.phase += p.speed;
        // animate coordinates slightly to vibrate
        const offsetMultiplier = 1 + Math.sin(p.phase) * 0.08;
        const proj = project(p.x * offsetMultiplier, p.y * offsetMultiplier, p.z * offsetMultiplier);
        
        const alpha = Math.max(0.04, Math.min(0.4, proj.scale * 0.25));
        ctx.beginPath();
        ctx.arc(proj.sx, proj.sy, Math.max(0.2, 1.2 * proj.scale), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(148, 163, 184, ${alpha})`;
        ctx.fill();
      });

      // Draw active interactive suffix clusters
      nodes.forEach((node) => {
        const isHovered = activeSuffix === node.name;
        const sizeMultiplier = isHovered ? 1.7 : 1.0;
        
        // Calculate biological breathing pulsing for hovered item
        const pulse = isHovered ? (1 + Math.sin(angleY * 6) * 0.15) : 1;
        const proj = project(node.x, node.y, node.z);

        const radius = Math.max(0.5, 6 * proj.scale * sizeMultiplier * pulse);
        
        // Glow layer for gorgeous 3D volumetric feedback
        ctx.beginPath();
        ctx.arc(proj.sx, proj.sy, radius * 2.8, 0, Math.PI * 2);
        ctx.fillStyle = isHovered ? node.glowColor : 'rgba(51, 65, 85, 0.2)';
        ctx.fill();

        // Core Solid Circle
        ctx.beginPath();
        ctx.arc(proj.sx, proj.sy, radius, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.lineWidth = isHovered ? 2.5 : 1;
        ctx.stroke();
        ctx.fill();

        // Connected label node card
        ctx.font = isHovered ? 'bold 11px sans-serif' : '9px monospace';
        ctx.fillStyle = isHovered ? '#38bdf8' : '#cbd5e1';
        ctx.textAlign = 'center';
        
        const labelYOffset = radius + (isHovered ? 15 : 11);
        ctx.fillText(node.name, proj.sx, proj.sy - labelYOffset);

        if (isHovered) {
          ctx.font = '8px monospace';
          ctx.fillStyle = '#f43f5e';
          ctx.fillText(node.meaning.toUpperCase(), proj.sx, proj.sy + labelYOffset);
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
  }, [activeSuffix]);

  return (
    <div 
      ref={containerRef} 
      className="relative w-full rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 p-2 overflow-hidden shadow-xl h-full w-full flex items-center justify-center cursor-help shadow-cyan-950/10"
      id="suffixes-3d-visualizer-container"
    >
      <div className="absolute inset-0 bg-[radial-gradient(#334155_1.2px,transparent_1.2px)] [background-size:16px_16px] opacity-35 pointer-events-none" />
      
      <canvas 
        ref={canvasRef} 
        className="block"
        id="suffixes-3d-visualizer-canvas"
      />
    </div>
  );
}
