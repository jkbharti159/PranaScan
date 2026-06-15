import React, { useEffect, useRef } from 'react';

interface Point3D {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  radius: number;
  color: string;
}

interface MiniHelixNode {
  theta: number;
  y: number;
  side: 'A' | 'B';
}

export default function Ambient3DBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high density displays (retina scaling)
    const handleResize = () => {
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = '100vw';
      canvas.style.height = '100vh';
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Track mouse coordinates for rich perspective sway (parallax)
    const handleMouseMove = (e: MouseEvent) => {
      // Normalize mouse positions to range [-1, 1]
      mouseRef.current.targetX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.targetY = (e.clientY / window.innerHeight) * 2 - 1;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Track scroll coordinates for buttery smooth parallax vertical translation and rotations
    let targetScrollY = 0;
    let currentScrollY = 0;

    const handleScroll = () => {
      targetScrollY = window.scrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    // 1. Generate 3D Biolattice Cloud
    const particleCount = 42;
    const particles: Point3D[] = [];
    
    // Rich high-contrast medical colors tailored specifically to stand out clearly on white/light backgrounds!
    const colors = [
      'rgba(15, 23, 42, 0.72)',    // Slate 900 (Deeper Slate Charcoal)
      'rgba(23, 37, 84, 0.68)',    // Navy 950 (Deeper Moody Navy)
      'rgba(30, 41, 59, 0.65)',    // Slate 800 (Slate Grey)
      'rgba(30, 58, 138, 0.62)',   // Blue 900 (Deep Slate Navy Blue)
    ];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: (Math.random() - 0.5) * 600,
        y: (Math.random() - 0.5) * 600,
        z: (Math.random() - 0.5) * 400,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        vz: (Math.random() - 0.5) * 0.3,
        radius: Math.random() * 3.5 + 1.8, // Slightly larger nodes for rich visual feedback
        color: colors[i % colors.length]
      });
    }

    // 2. Generate side mini 3D Double Helix structures
    const helixNodes: MiniHelixNode[] = [];
    const turns = 4.0;
    const nodesCount = 50;
    const helixRadius = 32;
    const helixHeight = 420;

    for (let i = 0; i < nodesCount; i++) {
      const parentPercent = i / nodesCount;
      const theta = parentPercent * turns * Math.PI * 2;
      const y = parentPercent * helixHeight - helixHeight / 2;
      
      helixNodes.push({ theta, y, side: 'A' });
      helixNodes.push({ theta, y, side: 'B' });
    }

    let angleX = 0.20;
    let angleY = 0.40;
    let helixRotationAngle = 0;

    let animationFrameId: number;

    const animate = () => {
      const currentWidth = window.innerWidth;
      const currentHeight = window.innerHeight;

      ctx.clearRect(0, 0, currentWidth, currentHeight);

      // Interpolate mouse coordinates (parallax ease)
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      // Smoothen out scrolling movement with custom easing multiplier
      currentScrollY += (targetScrollY - currentScrollY) * 0.085;

      // Introduce visual camera orbital tilt parameters driven by scroll depth
      const scrollAngleX = currentScrollY * 0.0010;
      const scrollAngleY = currentScrollY * 0.0004;

      const currentAngleX = angleX + mouseRef.current.y * 0.15 + scrollAngleX;
      const currentAngleY = angleY + mouseRef.current.x * 0.22 + scrollAngleY;

      // Spin speed can also pick up speed slightly on rapid scroll
      const activeRotationDelta = 0.006 + Math.min(0.02, Math.abs(targetScrollY - currentScrollY) * 0.00005);
      helixRotationAngle += activeRotationDelta;

      const centerX = currentWidth / 2;
      const centerY = currentHeight / 2;

      // ---------------- RENDER 1: RADIOGRAPHIC GRID RINGS IN THE BACKGROUND ----------------
      ctx.strokeStyle = 'rgba(71, 85, 105, 0.28)'; // Darker slate grey for rich contrast
      ctx.lineWidth = 1.3;
      ctx.setLineDash([6, 12]);
      
      // Sluggish scrolling offset to give rings depth
      const gridOffsetY = -currentScrollY * 0.12;

      ctx.beginPath();
      ctx.arc(centerX + mouseRef.current.x * 40, centerY + mouseRef.current.y * 30 + gridOffsetY, 280, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(centerX + mouseRef.current.x * 40, centerY + mouseRef.current.y * 30 + gridOffsetY, 520, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]); // Reset dashed state

      // ------------ RENDER 2: 3D PARTICLE BIOLATTICE CLOUD (CENTERED) ------------
      const projectedParticles = particles.map((pt) => {
        // Drift positions
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.z += pt.vz;

        // Keep inside virtual container bounds
        if (Math.abs(pt.x) > 350) pt.vx *= -1;
        if (Math.abs(pt.y) > 350) pt.vy *= -1;
        if (Math.abs(pt.z) > 250) pt.vz *= -1;

        // Orbit rotation around Y axis
        const cosY = Math.cos(currentAngleY);
        const sinY = Math.sin(currentAngleY);
        let x1 = pt.x * cosY - pt.z * sinY;
        let z1 = pt.x * sinY + pt.z * cosY;

        // Orbit rotation around X axis
        const cosX = Math.cos(currentAngleX);
        const sinX = Math.sin(currentAngleX);
        let y2 = pt.y * cosX - z1 * sinX;
        let z2 = pt.y * sinX + z1 * cosX;

        // Distance division perspective
        const distance = 460;
        const denominator = Math.max(10, distance + z2);
        const perspective = distance / denominator;
        
        // Push slightly in horizontal layout on desktop so it lines up with background white space
        const screenX = centerX + x1 * perspective + (currentWidth > 1150 ? 180 : 0);
        
        // Parallax scroll: elements closer to screen shift slightly faster than elements far back
        const parallaxStrength = 0.16 + (perspective * 0.14);
        const screenY = centerY + y2 * perspective - currentScrollY * parallaxStrength;

		return {
          sx: screenX,
          sy: screenY,
          sz: z2,
          radius: Math.max(0.1, pt.radius * perspective),
          color: pt.color
        };
      });

      // Render connection lattice segments
      ctx.lineWidth = 0.95;
      for (let i = 0; i < projectedParticles.length; i++) {
        for (let j = i + 1; j < projectedParticles.length; j++) {
          const pt1 = projectedParticles[i];
          const pt2 = projectedParticles[j];

          const dx = pt1.sx - pt2.sx;
          const dy = pt1.sy - pt2.sy;
          const dist2D = Math.sqrt(dx * dx + dy * dy);

          if (dist2D < 190) {
            // Factor dynamic alpha (faint connections for background depth) - darker Slate Navy links
            const alphaFactor = Math.max(0, 1 - dist2D / 190) * 0.35;
            ctx.beginPath();
            ctx.moveTo(pt1.sx, pt1.sy);
            ctx.lineTo(pt2.sx, pt2.sy);
            ctx.strokeStyle = `rgba(30, 41, 59, ${alphaFactor})`;
            ctx.stroke();
          }
        }
      }

      // Draw particle points
      projectedParticles.forEach((pt) => {
        ctx.beginPath();
        ctx.arc(pt.sx, pt.sy, pt.radius, 0, Math.PI * 2);
        ctx.fillStyle = pt.color;
        ctx.fill();
        
        // Extra soft light halo to blend beautifully with page paper look
        if (pt.radius > 2.2) {
          ctx.beginPath();
          ctx.arc(pt.sx, pt.sy, pt.radius * 2.8, 0, Math.PI * 2);
          ctx.fillStyle = pt.color.replace(/[\d\.]+\)$/, '0.08)');
          ctx.fill();
        }
      });


      // --------- RENDER 3: TWO FLOATING 3D DOUBLE HELIXES IN BACKGROUND PANELS ---------
      // Standard positions flanking the main dashboard grid columns, adjusted smoothly by scroll offset
      const helixPositions = [
        // Top right screen region (slides up naturally when scrolling)
        { cx: currentWidth - 160, cy: 260 - currentScrollY * 0.35 },
        // Bottom left screen region (slides up at a different rate, creating parallax)
        { cx: 140, cy: currentHeight - 320 - currentScrollY * 0.22 }
      ];

      helixPositions.forEach((pos) => {
        // Safe check for resolution bounds (allow rendering slightly off-screen while scrolling)
        if (pos.cx < -200 || pos.cx > currentWidth + 200 || pos.cy < -400 || pos.cy > currentHeight + 400) return;

        const projectedHelix: Array<{ sx: number; sy: number; sz: number; color: string; size: number; side: string; pairIdx: number }> = [];

        for (let i = 0; i < helixNodes.length; i++) {
          const node = helixNodes[i];
          const thetaRotated = node.theta + helixRotationAngle;

          let rx = 0;
          let rz = 0;
          let color = 'rgba(23, 37, 84, 0.72)'; // Royal Navy Blue

          if (node.side === 'A') {
            rx = Math.sin(thetaRotated) * helixRadius;
            rz = Math.cos(thetaRotated) * helixRadius;
            color = 'rgba(15, 23, 42, 0.75)'; // Deep Slate
          } else {
            rx = Math.sin(thetaRotated + Math.PI) * helixRadius;
            rz = Math.cos(thetaRotated + Math.PI) * helixRadius;
            color = 'rgba(30, 58, 138, 0.68)'; // Deep Teal
          }

          const px = rx;
          const py = node.y;
          const pz = rz;

          // Standard isometric projection coordinates
          const cosY = Math.cos(0.20);
          const sinY = Math.sin(0.20);
          let x1 = px * cosY - pz * sinY;
          let z1 = px * sinY + pz * cosY;

          const distanceVal = 340;
          const denomVal = Math.max(10, distanceVal + z1);
          const scaleFactor = distanceVal / denomVal;
          
          const sx = pos.cx + x1 * scaleFactor;
          const sy = pos.cy + py * scaleFactor;

          projectedHelix.push({
            sx,
            sy,
            sz: z1,
            color,
            size: Math.max(0.1, 2.2 * scaleFactor), // Slightly chunkier for light-background clarity
            side: node.side,
            pairIdx: Math.floor(i / 2)
          });
        }

        // Draw backbone strands
        ctx.lineWidth = 1.1;
        for (let i = 2; i < projectedHelix.length; i++) {
          const pt1 = projectedHelix[i - 2];
          const pt2 = projectedHelix[i];
          if (pt1.side === pt2.side) {
            ctx.beginPath();
            ctx.moveTo(pt1.sx, pt1.sy);
            ctx.lineTo(pt2.sx, pt2.sy);
            ctx.strokeStyle = pt1.side === 'A' ? 'rgba(30, 41, 59, 0.38)' : 'rgba(15, 118, 110, 0.35)';
            ctx.stroke();
          }
        }

        // Draw hydrogen atomic bond bridges (nucleotide links)
        ctx.lineWidth = 0.8;
        for (let i = 0; i < projectedHelix.length; i += 2) {
          const nodeA = projectedHelix[i];
          const nodeB = projectedHelix[i + 1];

          if (nodeA && nodeB) {
            ctx.beginPath();
            ctx.moveTo(nodeA.sx, nodeA.sy);
            ctx.lineTo(nodeB.sx, nodeB.sy);
            ctx.strokeStyle = 'rgba(71, 85, 105, 0.32)'; // Richer slate connector
            ctx.stroke();
          }
        }

        // Draw individual base pairs points
        projectedHelix.forEach((hNode) => {
          ctx.beginPath();
          ctx.arc(hNode.sx, hNode.sy, hNode.size, 0, Math.PI * 2);
          ctx.fillStyle = hNode.color;
          ctx.fill();
        });
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none select-none z-0 opacity-[0.72]"
      style={{
        mixBlendMode: 'multiply', // Multiplies background details perfectly with bright slate container spaces!
      }}
      id="ambient-3d-hologram-background"
    />
  );
}
