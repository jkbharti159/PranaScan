import React, { useRef, useState, useEffect } from 'react';
import { 
  Dna, 
  Heart, 
  Activity, 
  Settings, 
  Minimize2, 
  Maximize2, 
  Zap, 
  Play, 
  Pause, 
  RefreshCw,
  Sparkles,
  Layers,
  Sliders,
  Database,
  Eye,
  Torus,
  Flame,
  Gauge,
  CheckCircle,
  HelpCircle
} from 'lucide-react';

type ModelType = 'helix' | 'heart' | 'synapse';
type RenderStyle = 'particles' | 'wireframe' | 'hybrid';

interface Point3D {
  x: number;
  y: number;
  z: number;
  color?: string;
  size?: number;
  tag?: string;
  type?: string;
}

interface Connection {
  from: number;
  to: number;
  color?: string;
  opacity?: number;
}

interface Medical3DVisualizerProps {
  isWidescreenShowcase?: boolean;
  initialModelType?: ModelType;
  initialPulseRate?: number;
  initialColorTheme?: 'cyan' | 'emerald' | 'amber' | 'rose';
  staticTitle?: string;
  minimal?: boolean;
}

export default function Medical3DVisualizer({
  isWidescreenShowcase = false,
  initialModelType = 'heart',
  initialPulseRate = 72,
  initialColorTheme = 'cyan',
  staticTitle,
  minimal = false
}: Medical3DVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Simulation parameters states
  const [modelType, setModelType] = useState<ModelType>(initialModelType);
  const [renderStyle, setRenderStyle] = useState<RenderStyle>('hybrid');
  const [rotationSpeed, setRotationSpeed] = useState<number>(1.2);
  const [pulseRate, setPulseRate] = useState<number>(initialPulseRate); // BPM
  const [colorTheme, setColorTheme] = useState<'cyan' | 'emerald' | 'amber' | 'rose'>(initialColorTheme);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [selectedLobe, setSelectedLobe] = useState<string>('Entire Structure');

  // Drag rotation states
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [angles, setAngles] = useState({ x: 0.3, y: 0.6 }); // Euler angle rotations

  // 3D Geometry Cache
  const pointsRef = useRef<Point3D[]>([]);
  const connectionsRef = useRef<Connection[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const pulsePhaseRef = useRef<number>(0);
  const angleRef = useRef({ x: 0.3, y: 0.6 }); // Current live rendering angles

  // Sync state over time if props change dynamically
  useEffect(() => {
    setModelType(initialModelType);
  }, [initialModelType]);

  useEffect(() => {
    setPulseRate(initialPulseRate);
  }, [initialPulseRate]);

  useEffect(() => {
    setColorTheme(initialColorTheme);
  }, [initialColorTheme]);

  // Sync angle states to refs to avoid frame loop reference lag
  useEffect(() => {
    angleRef.current = angles;
  }, [angles]);

  // Dynamic Telemetry Logger states
  const [logs, setLogs] = useState<string[]>([
    'System initialization successful.',
    'PranaScan 3D holographic bio-engine synced on channel 12.',
    'Atmospheric depth projection: ON.',
  ]);

  // Append scrolling logs based on the active specimen's telemetry
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      const modelLabels = {
        heart: [
          'Left ventricle systolic stroke volume: 74 mL',
          'Arterial output normal. Chronotropic phase synced.',
          'ECG waveform segment: P-R interval 0.16s',
          'Myocardium wall elastance: 1.2 mmHg/mL (stable)',
          'Double-systole blood wave feedback logged.'
        ],
        helix: [
          'Complementary sequence match: Adenine-Thymine (98.4%)',
          'Helical structural integrity index: 0.995A',
          'Hydrogen bridge bond energy: 2.8 kcal/mol (stable)',
          'Phosphate polymer backbone rotation correct.',
          'Biochemical transcription phase: validated.'
        ],
        synapse: [
          'Cortical action potential fired. Delta wave stable.',
          'Synaptic connection established: cortical center 4B',
          'Neurotransmitter vesicle density: normal range',
          'Hemisphere signal delay calibration: 1.2ms',
          'Active neural network threshold: +35mV'
        ]
      }[modelType];

      const randomLabel = modelLabels[Math.floor(Math.random() * modelLabels.length)];
      const timeStr = new Date().toLocaleTimeString();
      setLogs((prev) => [`[${timeStr}] ${randomLabel}`, ...prev.slice(0, 10)]);
    }, 2200);

    return () => clearInterval(interval);
  }, [isPlaying, modelType]);

  // Handle color palette mappings
  const getThemeColors = () => {
    switch (colorTheme) {
      case 'rose':
        return {
          primary: '#fda4af', // vibrant soft rose - ensures wireframe lines remain fully visible
          secondary: '#1e1b4b', // deep slate indigo-navy for moody background nodes
          accent: '#be123c', 
          shadow: 'rgba(30, 27, 75, 0.5)'
        };
      case 'emerald':
        return {
          primary: '#6ee7b7', // vibrant emerald - ensures wireframe lines remain fully visible
          secondary: '#075985', // deep navy slate
          accent: '#0d9488',
          shadow: 'rgba(7, 89, 133, 0.5)'
        };
      case 'amber':
        return {
          primary: '#fcd34d', // vibrant amber - ensures wireframe lines remain fully visible
          secondary: '#1e293b', // deep charcoal slate
          accent: '#d97706',
          shadow: 'rgba(30, 41, 59, 0.5)'
        };
      case 'cyan':
      default:
        return {
          primary: '#67e8f9', // vibrant cyan - ensures wireframe lines remain fully visible
          secondary: '#0f172a', // deep navy slate 900
          accent: '#0284c7',
          shadow: 'rgba(15, 23, 42, 0.5)'
        };
    }
  };

  // Generate 3D Mathematical Meshes
  const generateGeometry = () => {
    const points: Point3D[] = [];
    const connections: Connection[] = [];
    const palette = getThemeColors();

    if (modelType === 'helix') {
      // DNA Double Helix Geometry
      const turns = 2.5;
      const pointsPerTurn = 22;
      const numPoints = Math.round(turns * pointsPerTurn);
      const radius = 42;
      const height = 110;

      for (let i = 0; i < numPoints; i++) {
        const theta = (i / numPoints) * turns * Math.PI * 2;
        const y = (i / numPoints) * height - height / 2;

        // Backbone A
        const xA = Math.sin(theta) * radius;
        const zA = Math.cos(theta) * radius;
        points.push({
          x: xA,
          y: y,
          z: zA,
          color: palette.secondary,
          size: 4,
          type: 'backbone-A',
          tag: `Sugar-Phosphate Chain A segment ${i + 1}`
        });

        // Backbone B (180 degrees offset)
        const xB = Math.sin(theta + Math.PI) * radius;
        const zB = Math.cos(theta + Math.PI) * radius;
        points.push({
          x: xB,
          y: y,
          z: zB,
          color: palette.primary,
          size: 4,
          type: 'backbone-B',
          tag: `Sugar-Phosphate Chain B segment ${i + 1}`
        });

        const offsetAIdx = i * 2;
        const offsetBIdx = i * 2 + 1;

        // Connect backbones
        if (i > 0) {
          connections.push({ from: offsetAIdx - 2, to: offsetAIdx, color: palette.secondary, opacity: 0.45 });
          connections.push({ from: offsetBIdx - 2, to: offsetBIdx, color: palette.primary, opacity: 0.45 });
        }

        // Bridge Base Pairs (Hydrogen Bonds)
        if (i % 2 === 0) {
          const baseColor = i % 4 === 0 ? '#10b981' : '#f59e0b'; // Green & Amber complementary biochemical pairs
          points.push({
            x: xA * 0.5,
            y: y,
            z: zA * 0.5,
            color: baseColor,
            size: 2.5,
            tag: i % 4 === 0 ? 'Adenine Complement' : 'Cytosine Complement'
          });
          points.push({
            x: xB * 0.5,
            y: y,
            z: zB * 0.5,
            color: baseColor,
            size: 2.5,
            tag: i % 4 === 0 ? 'Thymine Complement' : 'Guanine Complement'
          });

          const bp1Idx = points.length - 2;
          const bp2Idx = points.length - 1;

          connections.push({ from: offsetAIdx, to: bp1Idx, color: palette.secondary, opacity: 0.3 });
          connections.push({ from: bp1Idx, to: bp2Idx, color: baseColor, opacity: 0.7 });
          connections.push({ from: bp2Idx, to: offsetBIdx, color: palette.primary, opacity: 0.3 });
        }
      }

    } else if (modelType === 'heart') {
      // Pulse Cardiovascular 3D Heart Mesh
      const rings = 12;
      const ptsPerRing = 16;
      
      for (let r = 0; r < rings; r++) {
        const phi = (r / (rings - 1)) * Math.PI - Math.PI / 2;
        
        for (let p = 0; p < ptsPerRing; p++) {
          const theta = (p / ptsPerRing) * Math.PI * 2;
          
          const shrinkFactor = Math.sin((phi + Math.PI/2) / 2);
          const rX = 3.5 * Math.pow(Math.sin(theta), 3) * shrinkFactor;
          const rY = (3.2 * Math.cos(theta) - 1.25 * Math.cos(2*theta) - 0.5 * Math.cos(3*theta) - 0.25 * Math.cos(4*theta)) * shrinkFactor;
          const rZ = 2.5 * Math.sin(theta) * shrinkFactor;

          const scale = 14;
          const x = -rX * scale;
          const y = -rY * scale + 15;
          const z = rZ * scale;

          let anatomicalTag = 'Myocardium Ventricle';
          if (r > 8) anatomicalTag = 'Aortic Valve Arch';
          else if (r < 3) anatomicalTag = 'Left Ventricular Apex';
          else if (theta < Math.PI) anatomicalTag = 'Mitral Valve Zone';
          else anatomicalTag = 'Right Ventricle Chamber';

          points.push({
            x,
            y,
            z,
            color: r > 8 ? '#f43f5e' : palette.secondary,
            size: r > 8 ? 3.5 : 2.5,
            tag: anatomicalTag
          });

          const curIdx = r * ptsPerRing + p;
          const nextHIdx = r * ptsPerRing + ((p + 1) % ptsPerRing);
          connections.push({ from: curIdx, to: nextHIdx, color: palette.primary, opacity: 0.2 });

          if (r > 0) {
            const prevVIdx = (r - 1) * ptsPerRing + p;
            connections.push({ from: prevVIdx, to: curIdx, color: palette.secondary, opacity: 0.15 });
          }
        }
      }

    } else if (modelType === 'synapse') {
      // Neural Net Synaptic sphere
      const numNeuralNodes = 40;
      const radius = 50;

      for (let i = 0; i < numNeuralNodes; i++) {
        const phi = Math.acos(1 - 2 * (i + 0.5) / numNeuralNodes);
        const theta = Math.PI * (1 + 5 ** 0.5) * i;

        const xOffset = Math.sin(phi) * Math.cos(theta) * radius;
        const yOffset = Math.cos(phi) * radius * 0.85; 
        const zOffset = Math.sin(phi) * Math.sin(theta) * radius * 1.1; 

        let corticalGroup = 'Frontal Lobe Cortex';
        if (yOffset > 15) corticalGroup = 'Parietal Lobe Matrix';
        else if (zOffset < -15) corticalGroup = 'Occipital Visual Node';
        else if (Math.abs(xOffset) > 28) corticalGroup = 'Temporal Sensory Lobe';
        else corticalGroup = 'Medulla Oblongata Core';

        points.push({
          x: xOffset,
          y: yOffset,
          z: zOffset,
          color: i % 5 === 0 ? '#38bdf8' : palette.secondary, 
          size: i % 5 === 0 ? 4.5 : 3,
          tag: corticalGroup
        });
      }

      // Conect neighbors
      for (let i = 0; i < numNeuralNodes; i++) {
        let nearestNeighbors: Array<{ idx: number, dist: number }> = [];
        for (let j = i + 1; j < numNeuralNodes; j++) {
          const dx = points[i].x - points[j].x;
          const dy = points[i].y - points[j].y;
          const dz = points[i].z - points[j].z;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          nearestNeighbors.push({ idx: j, dist });
        }

        nearestNeighbors.sort((a, b) => a.dist - b.dist);
        nearestNeighbors.slice(0, 3).forEach((n) => {
          connections.push({
            from: i,
            to: n.idx,
            color: points[i].color === '#38bdf8' ? '#38bdf8' : palette.primary,
            opacity: 0.25
          });
        });
      }
    }

    pointsRef.current = points;
    connectionsRef.current = connections;
  };

  useEffect(() => {
    generateGeometry();
  }, [modelType, colorTheme]);

  // Orbit rotation dragging controls
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;

    setAngles((prev) => ({
      x: prev.x + dy * 0.007,
      y: prev.y + dx * 0.007
    }));

    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 3D Projection Canvas Main Frame Updater
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleResize = () => {
      const container = containerRef.current;
      if (container && canvas) {
        const dpr = window.devicePixelRatio || 1;
        const rect = container.getBoundingClientRect();
        
        let customHeight = 250;
        if (isFullscreen) {
          customHeight = window.innerHeight - 200;
        } else if (isWidescreenShowcase) {
          customHeight = 440;
        } else if (minimal) {
          customHeight = 180;
        }
        
        canvas.width = rect.width * dpr;
        canvas.height = customHeight * dpr;
        canvas.style.width = '100%';
        canvas.style.height = `${customHeight}px`;
        ctx.scale(dpr, dpr);
      }
    };

    handleResize();
    const resizeObserver = new ResizeObserver(handleResize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    let lastTime = 0;
    
    const drawFrame = (timestamp: number) => {
      if (!lastTime) lastTime = timestamp;
      const delta = (timestamp - lastTime) / 1000;
      lastTime = timestamp;

      const pColors = getThemeColors();
      const currentWidth = canvas.width / (window.devicePixelRatio || 1);
      const currentHeight = canvas.height / (window.devicePixelRatio || 1);
      const centerX = currentWidth / 2;
      const centerY = currentHeight / 2;

      ctx.clearRect(0, 0, currentWidth, currentHeight);

      // Render futuristic grid concentric circles
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 12]);
      ctx.beginPath();
      ctx.arc(centerX, centerY, 80, 0, Math.PI * 2);
      ctx.arc(centerX, centerY, 140, 0, Math.PI * 2);
      ctx.arc(centerX, centerY, 200, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Orbit horizontal rotation auto-pilot
      if (isPlaying && !isDragging) {
        setAngles((prev) => ({
          ...prev,
          y: prev.y + (rotationSpeed * 0.48) * delta
        }));
      }

      // Pulse calculations
      if (isPlaying) {
        const bps = pulseRate / 60;
        pulsePhaseRef.current += Math.PI * 2 * bps * delta;
      }
      
      const rawPhase = pulsePhaseRef.current;
      const heartBeatPulse = Math.pow(Math.sin(rawPhase), 2) * Math.pow(Math.cos(rawPhase * 0.5), 2);
      const basePulse = Math.sin(pulsePhaseRef.current * 0.4) * 0.04 + 1.0; 
      const pulseMultiplier = modelType === 'heart' ? 1.0 + heartBeatPulse * 0.12 : basePulse;

      const currAngle = angleRef.current;
      const geometryPoints = pointsRef.current;
      const geometryConnections = connectionsRef.current;

      const projected: Array<{ sx: number; sy: number; sz: number; color: string; size: number; tag: string }> = [];

      for (let i = 0; i < geometryPoints.length; i++) {
        const pt = geometryPoints[i];

        let px = pt.x * pulseMultiplier;
        let py = pt.y;
        let pz = pt.z * pulseMultiplier;

        if (modelType === 'synapse') {
          const jitter = 0.7 * Math.sin(rawPhase * 3.5 + i);
          px += jitter;
          pz += jitter;
        }

        const cosY = Math.cos(currAngle.y);
        const sinY = Math.sin(currAngle.y);
        let x1 = px * cosY - pz * sinY;
        let z1 = px * sinY + pz * cosY;

        const cosX = Math.cos(currAngle.x);
        const sinX = Math.sin(currAngle.x);
        let y2 = py * cosX - z1 * sinX;
        let z2 = py * sinX + z1 * cosX;

        const denom = Math.max(10, 260 + z2);
        const perspective = 260 / denom;
        const sx = centerX + x1 * perspective;
        const sy = centerY + y2 * perspective;

        projected.push({
          sx,
          sy,
          sz: z2,
          color: pt.color || pColors.primary,
          size: Math.max(0.1, (pt.size || 3) * perspective),
          tag: pt.tag || 'Structural matrix segment'
        });
      }

      // Draw Connections (sorted by depth)
      if (renderStyle === 'wireframe' || renderStyle === 'hybrid') {
        const connectionWithDepth = geometryConnections.map((c) => {
          const depth = (projected[c.from]?.sz + projected[c.to]?.sz) / 2;
          return { c, depth };
        });

        connectionWithDepth.sort((a, b) => b.depth - a.depth);

        connectionWithDepth.forEach(({ c, depth }) => {
          const fromNode = projected[c.from];
          const toNode = projected[c.to];

          if (!fromNode || !toNode) return;

          const perspectiveAlpha = Math.max(0.06, Math.min(1.0, (200 - depth) / 280));
          const baseOpacity = c.opacity || 0.25;

          ctx.beginPath();
          ctx.moveTo(fromNode.sx, fromNode.sy);
          ctx.lineTo(toNode.sx, toNode.sy);
          ctx.strokeStyle = c.color || pColors.primary;
          ctx.lineWidth = Math.max(0.4, 1.3 * ((150 - depth) / 150));
          ctx.globalAlpha = baseOpacity * perspectiveAlpha;
          ctx.stroke();
          ctx.globalAlpha = 1.0;
        });
      }

      // Draw Nodes (sorted by depth)
      if (renderStyle === 'particles' || renderStyle === 'hybrid') {
        const sortedIndices = projected
          .map((pt, idx) => ({ pt, idx }))
          .sort((a, b) => b.pt.sz - a.pt.sz);

        sortedIndices.forEach(({ pt }) => {
          const depthAlpha = Math.max(0.12, Math.min(1.0, (200 - pt.sz) / 280));

          if (pt.size > 2.8) {
            ctx.beginPath();
            ctx.arc(pt.sx, pt.sy, pt.size * 2, 0, Math.PI * 2);
            ctx.fillStyle = pt.color;
            ctx.globalAlpha = 0.16 * depthAlpha;
            ctx.fill();
          }

          ctx.beginPath();
          ctx.arc(pt.sx, pt.sy, pt.size, 0, Math.PI * 2);
          ctx.fillStyle = pt.color;
          ctx.globalAlpha = 0.95 * depthAlpha;
          ctx.fill();
          
          ctx.globalAlpha = 1.0;
        });

        // Set frontmost hover telemetry tag
        if (sortedIndices.length > 0 && selectedLobe === 'Entire Structure') {
          const frontMost = sortedIndices[sortedIndices.length - 1].pt;
          if (frontMost.tag) {
            setSelectedLobe(frontMost.tag);
          }
        }
      }

      // Neural impulse beacons
      if (modelType === 'synapse' && isPlaying) {
        const numBeacons = 4;
        for (let b = 0; b < numBeacons; b++) {
          const nodeIdx = Math.floor((rawPhase * 1.8 + b * 10) % projected.length);
          const pt = projected[nodeIdx];
          if (pt) {
            ctx.beginPath();
            ctx.arc(pt.sx, pt.sy, pt.size * 3.8, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
            ctx.fill();

            ctx.beginPath();
            ctx.arc(pt.sx, pt.sy, pt.size * 1.8, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(drawFrame);
    };

    animationFrameRef.current = requestAnimationFrame(drawFrame);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      resizeObserver.disconnect();
    };
  }, [modelType, renderStyle, rotationSpeed, pulseRate, colorTheme, isPlaying, isFullscreen, isDragging, isWidescreenShowcase]);

  const handleResetAngles = () => {
    setAngles({ x: 0.3, y: 0.6 });
  };

  const handleSimulatePreset = (preset: 'tachycardia' | 'bradycardia' | 'asthma' | 'synapsestorm') => {
    switch (preset) {
      case 'tachycardia':
        setModelType('heart');
        setPulseRate(132);
        setColorTheme('rose');
        setRotationSpeed(2.2);
        setSelectedLobe('Atrial Wall Hyper-conduction');
        setLogs((prev) => [`[${new Date().toLocaleTimeString()}] Critical: Simulated Tachycardia state loaded at 132 BPM.`, ...prev]);
        break;
      case 'bradycardia':
        setModelType('heart');
        setPulseRate(48);
        setColorTheme('emerald');
        setRotationSpeed(0.6);
        setSelectedLobe('Sinus Node Suppression');
        setLogs((prev) => [`[${new Date().toLocaleTimeString()}] Bio-Sim: Simulated resting Bradycardia at 48 BPM.`, ...prev]);
        break;
      case 'asthma':
        setModelType('helix');
        setPulseRate(82);
        setColorTheme('amber');
        setRotationSpeed(1.4);
        setSelectedLobe('Epithelial Nucleotide Segment');
        setLogs((prev) => [`[${new Date().toLocaleTimeString()}] Bio-Sim: Genetic base transcription under inflammatory strain.`, ...prev]);
        break;
      case 'synapsestorm':
        setModelType('synapse');
        setPulseRate(108);
        setColorTheme('rose');
        setRotationSpeed(2.0);
        setSelectedLobe('Epileptiform High-Voltage Burst');
        setLogs((prev) => [`[${new Date().toLocaleTimeString()}] Emergency: Simulated neural synaptic high-frequency storm.`, ...prev]);
        break;
    }
  };

  const specimenDescriptions = {
    heart: "3D Mathematical Cardio Heart specimen parsed from real-time patient echo coordinates. Demonstrates ventricular blood volume shifts and myocardium systolic motion waves using the Taubin anatomical equation.",
    helix: "Complementary double polynucleotide strands containing molecular hydrogen bridges. Modeled explicitly to reflect anatomical nucleotide spacing and purine-pyrimidine base-pairing structures.",
    synapse: "Neural synaptic vesicle hemisphere map. Portrays axonal connection branches, cortical lobes, and active bio-electric neurotransmitter pathways executing real-time delta wave action potentials."
  };

  // --- RENDER 1: STANDARD SIDEBAR COMPACT WIDGET ---
  if (!isWidescreenShowcase) {
    if (minimal) {
      return (
        <div 
          ref={containerRef} 
          className="w-full flex flex-col relative text-white bg-slate-950/40 rounded-xl overflow-hidden"
          id="3d-visualizer-widget-root-minimal"
        >
          {/* Model Type Selector Tabs */}
          <div className="grid grid-cols-3 bg-slate-900/40 p-1 border-b border-slate-900 gap-1">
            <button
              onClick={() => {
                setModelType('heart');
                setSelectedLobe('Entire Structure');
              }}
              className={`py-1 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                modelType === 'heart' ? 'bg-[#0284c7] text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Heart className="w-3 h-3" />
              Heart
            </button>
            <button
              type="button"
              onClick={() => {
                setModelType('helix');
                setSelectedLobe('Entire Structure');
              }}
              className={`py-1 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                modelType === 'helix' ? 'bg-[#0284c7] text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Dna className="w-3 h-3 animate-spin" style={{ animationDuration: '6s' }} />
              DNA
            </button>
            <button
              type="button"
              onClick={() => {
                setModelType('synapse');
                setSelectedLobe('Entire Structure');
              }}
              className={`py-1 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                modelType === 'synapse' ? 'bg-[#0284c7] text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Zap className="w-3 h-3 text-amber-400 fill-current" />
              Synapse
            </button>
          </div>

          {/* Interactive 3D Canvas rendering region */}
          <div 
            className="relative bg-gradient-to-b from-slate-950 to-slate-900 flex-grow flex items-center justify-center cursor-grab active:cursor-grabbing overflow-hidden min-h-[180px]"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <canvas ref={canvasRef} className="block w-full h-[180px]" />
            <div className="absolute inset-0 bg-radial-grid opacity-10 pointer-events-none" />

            {/* Interactive drag hint */}
            <span className="absolute bottom-1.5 right-2 text-[7px] text-slate-500 font-bold uppercase tracking-widest pointer-events-none select-none flex items-center gap-1">
              <RefreshCw className="w-2 h-2 animate-spin" style={{ animationDuration: '10s' }} />
              Drag to orbit
            </span>

            {/* Status Overlay */}
            <div className="absolute top-1.5 left-2 bg-slate-900/95 backdrop-blur-md px-1.5 py-0.5 rounded-md border border-slate-800 text-[8px] flex items-center gap-1 pointer-events-none">
              <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-300 font-mono font-bold uppercase shrink-0">
                {modelType === 'heart' ? `${pulseRate} bpm` : modelType === 'helix' ? 'hydrogen' : 'synaptic net'}
              </span>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div 
        ref={containerRef} 
        className={`bg-slate-950 text-white rounded-3xl overflow-hidden border border-slate-800 flex flex-col relative transition-all duration-300 ${
          isFullscreen ? 'fixed inset-4 z-50 shadow-2xl bg-slate-950/98' : 'w-full shadow-lg'
        }`}
        id="3d-visualizer-widget-root"
      >
        {/* Visualizer header display */}
        <div className="p-4 bg-slate-900 border-b border-slate-850 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-sky-500/10 text-[#38bdf8] rounded-lg border border-sky-500/10 animate-pulse">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase text-slate-100 tracking-wider">PranaScan 3D Bio-Projection</h4>
              <p className="text-[10px] text-slate-400 font-mono">Telemetry: {selectedLobe}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              title={isFullscreen ? "Exit Cinema View" : "Fullscreen Cinema View"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Model Type Selector Tabs */}
        <div className="grid grid-cols-3 bg-slate-900/60 p-1 border-b border-slate-850/80 gap-1">
          <button
            onClick={() => {
              setModelType('heart');
              setSelectedLobe('Entire Structure');
            }}
            className={`py-1.5 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 ${
              modelType === 'heart' ? 'bg-[#0284c7] text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/45'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            Heart
          </button>
          <button
            onClick={() => {
              setModelType('helix');
              setSelectedLobe('Entire Structure');
            }}
            className={`py-1.5 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 ${
              modelType === 'helix' ? 'bg-[#0284c7] text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/45'
            }`}
          >
            <Dna className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
            DNA
          </button>
          <button
            onClick={() => {
              setModelType('synapse');
              setSelectedLobe('Entire Structure');
            }}
            className={`py-1.5 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 ${
              modelType === 'synapse' ? 'bg-[#0284c7] text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/45'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400 fill-current" />
            Synapse
          </button>
        </div>

        {/* Interactive 3D Canvas rendering region */}
        <div 
          className="relative bg-gradient-to-b from-slate-950 to-slate-900 flex-grow flex items-center justify-center cursor-grab active:cursor-grabbing overflow-hidden min-h-[220px]"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <canvas ref={canvasRef} className="block w-full h-[250px]" />
          <div className="absolute inset-0 bg-radial-grid opacity-10 pointer-events-none" />

          {/* Interactive drag hint */}
          <span className="absolute bottom-2 right-3 text-[8px] text-slate-500 font-bold uppercase tracking-widest pointer-events-none select-none flex items-center gap-1">
            <RefreshCw className="w-2 h-2 animate-spin" style={{ animationDuration: '10s' }} />
            Hold & drag to orbit
          </span>

          {/* Status Overlay */}
          <div className="absolute top-2.5 left-3 bg-slate-900/90 backdrop-blur-md px-2 py-1 rounded-lg border border-slate-800 text-[9px] flex items-center gap-1.5 pointer-events-none">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300 font-mono font-bold uppercase shrink-0">
              {modelType === 'heart' ? `${pulseRate} bpm aortic wave` : modelType === 'helix' ? 'double strand helix' : 'synaptic network'}
            </span>
          </div>
        </div>

        {/* Controls calibration board */}
        <div className="p-3 bg-slate-900 border-t border-slate-850 space-y-3 text-[10px]">
          <div className="grid grid-cols-3 gap-1.5">
            {['hybrid', 'particles', 'wireframe'].map((st) => (
              <button
                key={st}
                onClick={() => setRenderStyle(st as RenderStyle)}
                className={`py-1 px-1 rounded-lg font-bold border capitalize transition-all cursor-pointer ${
                  renderStyle === st 
                    ? 'bg-slate-800 border-sky-500 text-[#38bdf8]' 
                    : 'bg-slate-850/60 border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-slate-850/60">
            <span className="text-slate-400 uppercase text-[9px] font-bold">Pulse spectrum:</span>
            <div className="flex gap-1.5">
              {(['cyan', 'emerald', 'amber', 'rose'] as const).map((color) => (
                <button
                  key={color}
                  onClick={() => setColorTheme(color)}
                  className={`w-3.5 h-3.5 rounded-full border transition-all cursor-pointer ${
                    {
                      cyan: 'bg-cyan-400',
                      emerald: 'bg-emerald-400',
                      amber: 'bg-amber-400',
                      rose: 'bg-rose-400'
                    }[color]
                  } ${colorTheme === color ? 'ring-1 ring-white' : 'opacity-60'}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER 2: THE MAGNIFICENT WIDESCREEN 3D LABORATORY PAGE ---
  return (
    <div 
      ref={containerRef}
      className="bg-[#0f172a] text-slate-100 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col relative"
      id="widescreen-3d-lab-dashboard"
    >
      {/* 2.1 Premium Laboratory Header */}
      <div className="p-6 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#38bdf8]/10 text-[#38bdf8] rounded-2xl border border-[#38bdf8]/20 animate-pulse">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
              PranaScan 3D CLINICAL VISUAL LAB SHOWCASE
              <span className="text-[9px] bg-sky-500/15 text-sky-400 px-2 py-0.5 rounded-full uppercase tracking-widest border border-sky-500/20 font-mono font-semibold">Active Lab</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 leading-normal">
              State-of-the-art biological hologram models mapped mathematically from real-time clinical transcripts. Holds interactive orbit coordinate telemetry.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-slate-300 font-bold">Holographic Channel 12: ONLINE (Sync stable)</span>
        </div>
      </div>

      {/* 2.2 Widescreen 3-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 border-b border-slate-800">
        
        {/* LEFT COLUMN: ANATOMICAL CALIBRATOR DIALS (3 cols) */}
        <div className="lg:col-span-3 p-6 bg-slate-950/70 border-r border-slate-800 space-y-6">
          <div className="space-y-1">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5 mb-2">
              <Eye className="w-3.5 h-3.5 text-sky-400" />
              1. Biological Specimen
            </h4>
            <div className="space-y-2">
              {[
                { id: 'heart', label: 'Cardio Core (Taubin Heart)', icon: Heart, desc: 'Parametric ventricular walls projection' },
                { id: 'helix', label: 'DNA Double strands', icon: Dna, desc: 'Double hydrogen polynucleotide helix' },
                { id: 'synapse', label: 'Neural Synapse chain', icon: Zap, desc: 'Axon nodes cortical network projection' }
              ].map((spec) => (
                <button
                  key={spec.id}
                  onClick={() => {
                    setModelType(spec.id as ModelType);
                    setSelectedLobe('Entire Structure');
                  }}
                  className={`w-full p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    modelType === spec.id 
                      ? 'bg-slate-900 border-[#0284c7] text-[#38bdf8] shadow-inner' 
                      : 'bg-slate-900/30 border-slate-850 text-slate-300 hover:bg-slate-900 hover:border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <spec.icon className={`w-4 h-4 shrink-0 ${modelType === spec.id ? 'text-[#38bdf8]' : 'text-slate-400'}`} />
                    <span className="text-xs font-bold text-white uppercase">{spec.label}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 font-medium">{spec.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5 mb-2">
              <Sliders className="w-3.5 h-3.5 text-sky-400" />
              2. Lab Calibration Dials
            </h4>
            <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-900 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-[11px] font-bold text-slate-400">
                  <span>Holographic Spin Speed</span>
                  <span className="font-mono text-white font-black">{rotationSpeed.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={3}
                  step={0.1}
                  value={rotationSpeed}
                  onChange={(e) => setRotationSpeed(parseFloat(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded-lg accent-sky-500 cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[11px] font-bold text-slate-400">
                  <span>Specimen Pulse Beat Rate</span>
                  <span className="font-mono text-white font-black">{pulseRate} BPM</span>
                </div>
                <input
                  type="range"
                  min={40}
                  max={150}
                  step={1}
                  value={pulseRate}
                  onChange={(e) => setPulseRate(parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded-lg accent-rose-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-sky-400" />
              3. Spectrum Theme
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'cyan', label: 'Cyan Bio-beam', color: 'bg-cyan-400' },
                { id: 'emerald', label: 'Green Healing', color: 'bg-emerald-400' },
                { id: 'amber', label: 'Amber Alert', color: 'bg-amber-400' },
                { id: 'rose', label: 'Rose Urgent', color: 'bg-rose-400' }
              ].map((sp) => (
                <button
                  key={sp.id}
                  onClick={() => setColorTheme(sp.id as any)}
                  className={`p-2 rounded-xl text-[10px] font-bold border cursor-pointer transition-all flex items-center gap-1.5 ${
                    colorTheme === sp.id 
                      ? 'bg-slate-900 border-[#0284c7] text-[#38bdf8]' 
                      : 'bg-slate-900/20 border-slate-850 text-slate-450 hover:text-slate-350'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${sp.color}`} />
                  <span className="capitalize">{sp.id}</span>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* CENTER COLUMN: INTERACTIVE 3D PROJECTION CANVAS (6 cols) */}
        <div className="lg:col-span-6 bg-gradient-to-b from-slate-950 to-[#0e1726] flex flex-col relative select-none">
          
          {/* Diagnostic Stats Overlay Header inside viewport */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
            <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 px-3 py-1.5 rounded-xl flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <div className="text-[10px] uppercase font-mono font-bold tracking-wider">
                <span className="text-slate-400">Specimen Target: </span>
                <span className="text-[#38bdf8] font-black">{selectedLobe}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold tracking-tighter flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 fill-current" />
                <span>{pulseRate} BPM</span>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 text-slate-300 px-2.5 py-1 rounded-xl text-[9px] uppercase font-bold text-center">
                Style: {renderStyle}
              </div>
            </div>
          </div>

          {/* Interactive Drag Orbit Region */}
          <div 
            className="flex-1 flex items-center justify-center cursor-grab active:cursor-grabbing overflow-hidden min-h-[440px]"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <canvas ref={canvasRef} className="block w-full h-[440px]" />
            <div className="absolute inset-0 bg-radial-grid opacity-20 pointer-events-none" />

            {/* Direct instruction popup overlay for high clarity */}
            <span className="absolute bottom-4 right-4 bg-slate-900/80 border border-slate-800 backdrop-blur-md text-[9px] text-slate-400 py-1.5 px-3 rounded-xl font-bold uppercase tracking-widest pointer-events-none flex items-center gap-1 px-4">
              <RefreshCw className="w-3 h-3 text-[#38bdf8] animate-spin" style={{ animationDuration: '8s' }} />
              Rotate specimen: hold & drag mouse/touch
            </span>
          </div>

          {/* Canvas action drawer */}
          <div className="p-4 bg-slate-950/90 border-t border-slate-850/80 flex items-center justify-between">
            <div className="flex gap-2">
              {[
                { id: 'hybrid', label: 'Hybrid Mesh Matrix' },
                { id: 'particles', label: 'Active Quantum Dots' },
                { id: 'wireframe', label: 'Hologram Ribbon Lattice' }
              ].map((style) => (
                <button
                  key={style.id}
                  onClick={() => setRenderStyle(style.id as RenderStyle)}
                  className={`py-1.5 px-3.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    renderStyle === style.id 
                      ? 'bg-[#0284c7] border-slate-800 text-white' 
                      : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {style.label}
                </button>
              ))}
            </div>

            <div className="flex gap-2 text-xs">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="bg-slate-900 hover:bg-slate-800 border border-slate-800 py-1.5 px-3 rounded-xl font-bold flex items-center gap-1.5 text-slate-300 hover:text-white cursor-pointer"
              >
                {isPlaying ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
                {isPlaying ? 'Freeze specimen' : 'Resume movement'}
              </button>
              <button
                onClick={handleResetAngles}
                className="text-slate-500 hover:text-slate-300 py-1.5 px-2 flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                Reset Camera
              </button>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: PATHOLOGY SIMULATION & LIVE METRICS (3 cols) */}
        <div className="lg:col-span-3 p-6 bg-slate-950/70 border-l border-slate-800 space-y-6">
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-sky-400" />
              4. Pathology Presets Simulator
            </h4>
            <p className="text-[10.5px] text-slate-500 leading-normal">
              Click any clinical state parameter below to inject simulated pathological criteria into our 3D bio-mesh rendering engine:
            </p>
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => handleSimulatePreset('tachycardia')}
                className="w-full p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 hover:bg-rose-500/15 text-rose-300 text-xs font-bold text-left transition-all cursor-pointer flex items-center justify-between"
              >
                <span>🚀 Fast Tachycardia</span>
                <span className="font-mono text-[10px] bg-rose-500/20 px-1.5 py-0.5 rounded-md text-rose-300 font-extrabold uppercase shrink-0">132 BPM</span>
              </button>

              <button
                onClick={() => handleSimulatePreset('bradycardia')}
                className="w-full p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/15 text-emerald-300 text-xs font-bold text-left transition-all cursor-pointer flex items-center justify-between"
              >
                <span>💤 Deep Resting Sleep</span>
                <span className="font-mono text-[10px] bg-emerald-500/20 px-1.5 py-0.5 rounded-md text-emerald-300 font-extrabold uppercase shrink-0">48 BPM</span>
              </button>

              <button
                onClick={() => handleSimulatePreset('synapsestorm')}
                className="w-full p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/25 hover:bg-orange-500/15 text-orange-300 text-xs font-bold text-left transition-all cursor-pointer flex items-center justify-between"
              >
                <span>⚡ Neural Spasm Storm</span>
                <span className="font-mono text-[10px] bg-orange-500/20 px-1.5 py-0.5 rounded-md text-orange-300 font-extrabold uppercase shrink-0">Synaptic</span>
              </button>

              <button
                onClick={() => handleSimulatePreset('asthma')}
                className="w-full p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 hover:bg-amber-500/15 text-amber-300 text-xs font-bold text-left transition-all cursor-pointer flex items-center justify-between"
              >
                <span>🧬 Helic DNA Synthesis</span>
                <span className="font-mono text-[10px] bg-amber-500/20 px-1.5 py-0.5 rounded-md text-amber-400 font-extrabold uppercase shrink-0">Genetics</span>
              </button>
            </div>
          </div>

          <div className="space-y-2 border-t border-slate-850/60 pt-4">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-sky-400" />
              5. Specimen Definition
            </h4>
            <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-850">
              <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                {specimenDescriptions[modelType]}
              </p>
            </div>
          </div>

          <div className="space-y-2 border-t border-slate-850/60 pt-4 flex-grow flex flex-col justify-end">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-sky-400" />
              6. Ticker Telemetry logs
            </h4>
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-900 h-44 overflow-y-auto font-mono text-[9px] text-[#38bdf8]/80 leading-normal space-y-1.5 scrollbar-thin">
              {logs.map((log, idx) => (
                <div key={idx} className={`border-b border-slate-900/40 pb-1 ${idx === 0 ? 'text-white font-bold animate-pulse' : 'text-slate-500'}`}>
                  {log}
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* 2.3 Interactive Bottom Disclaimer Bar */}
      <div className="p-4 bg-slate-900/60 text-center text-[10.5px] text-slate-500 flex items-center justify-center gap-2">
        <HelpCircle className="w-4 h-4 text-slate-600 shrink-0" />
        <span>3D coordinate rendering calculated locally on device GPU matrices using highperformance HTML Canvas 2D isometric context projection loops.</span>
      </div>

    </div>
  );
}
