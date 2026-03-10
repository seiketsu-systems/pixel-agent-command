import { useRef, useEffect, useCallback, useState } from "react";
import officeBg from "@/assets/office-bg.png";

// ── Types ──────────────────────────────────────────────
interface Agent {
  name: string;
  x: number;
  y: number;
  color: string;
  hairColor: string;
  activity: "typing" | "walking" | "talking";
  frame: number;
  // walking
  targetX?: number;
  targetY?: number;
  walkPath?: { x: number; y: number }[];
  walkIdx?: number;
  // speech
  speech?: string;
  speechTimer?: number;
}

interface ServerLED {
  x: number;
  y: number;
  color: string;
  phase: number;
}

interface CodeLine {
  text: string;
  color: string;
}

// ── Constants ──────────────────────────────────────────
const CODE_SNIPPETS: CodeLine[][] = [
  [
    { text: "fn sprite_collide(a, b) {", color: "#39ff14" },
    { text: "  let dx = a.x - b.x;", color: "#00e5ff" },
    { text: "  let dy = a.y - b.y;", color: "#00e5ff" },
    { text: "  return dx*dx+dy*dy < r;", color: "#ffab00" },
    { text: "}", color: "#39ff14" },
    { text: "// tile_map.load(3);", color: "#888" },
    { text: "pub fn render_frame() {", color: "#39ff14" },
    { text: "  gpu.clear(0x001100);", color: "#00e5ff" },
    { text: "  for s in sprites {", color: "#ffab00" },
    { text: "    s.draw(ctx);", color: "#00e5ff" },
    { text: "  }", color: "#ffab00" },
    { text: "}", color: "#39ff14" },
  ],
  [
    { text: "class Level3 extends Map {", color: "#39ff14" },
    { text: "  enemies: Vec<NPC> = [];", color: "#00e5ff" },
    { text: "  spawn_rate: 0.02,", color: "#ffab00" },
    { text: "  fn update(dt: f32) {", color: "#39ff14" },
    { text: "    self.tick(dt);", color: "#00e5ff" },
    { text: "    self.check_win();", color: "#00e5ff" },
    { text: "  }", color: "#39ff14" },
    { text: "}", color: "#39ff14" },
    { text: "// asset_pipeline OK", color: "#888" },
    { text: "let atlas = load('t.png');", color: "#ffab00" },
  ],
  [
    { text: "test level_3_boss() {", color: "#39ff14" },
    { text: "  let b = Boss::new(100);", color: "#00e5ff" },
    { text: "  assert!(b.hp == 100);", color: "#ffab00" },
    { text: "  b.take_dmg(25);", color: "#00e5ff" },
    { text: "  assert!(b.hp == 75);", color: "#ffab00" },
    { text: "  println!(\"PASS\");", color: "#39ff14" },
    { text: "}", color: "#39ff14" },
    { text: "// all tests: 47 pass", color: "#888" },
  ],
];

const SPEECH_LINES = [
  ["Discussieer de nieuwe sprite-collision handlers...", "Testgevallen voor niveau 3 worden uitgevoerd."],
  ["Asset pipeline v2 moet live voor vrijdag.", "Ik refactor de render loop nu."],
  ["Boss AI gedraagt zich vreemd in level 5.", "Laat me de state machine checken..."],
  ["Sprite atlas is 2x te groot, optimaliseren?", "Ja, pak de texture packer erbij."],
];

const FILE_LABELS = [
  "📁 01_research [DONE]",
  "📁 02_scripts [ACTIVE]",
  "📁 03_assets [QUEUED]",
  "📁 04_build [QUEUED]",
  "📁 05_deploy [QUEUED]",
  "📄 config.json",
  "📄 README.md",
];

// ── Component ──────────────────────────────────────────
interface PixelOfficeSceneProps {
  externalCommand?: string | null;
  onCommandConsumed?: () => void;
}

const PixelOfficeScene = ({ externalCommand, onCommandConsumed }: PixelOfficeSceneProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgRef = useRef<HTMLImageElement | null>(null);
  const bgLoaded = useRef(false);
  const animFrame = useRef(0);
  const frameCount = useRef(0);
  const codeScrollOffset = useRef<number[]>([0, 0, 0, 0, 0, 0]);
  const [commandLog, setCommandLog] = useState<string[]>([]);

  // Agents state
  const agentsRef = useRef<Agent[]>([
    // Left room - desk workers
    { name: "CODEGEN", x: 0.14, y: 0.52, color: "#2244aa", hairColor: "#111", activity: "typing", frame: 0 },
    { name: "ASSETGEN", x: 0.36, y: 0.52, color: "#cc44aa", hairColor: "#dda", activity: "typing", frame: 0 },
    { name: "TESTRUN", x: 0.14, y: 0.78, color: "#44aa44", hairColor: "#333", activity: "typing", frame: 0 },
    { name: "BUILD", x: 0.36, y: 0.78, color: "#aa8844", hairColor: "#c84", activity: "typing", frame: 0 },
    // Right room - desk workers
    { name: "DEPLOY", x: 0.6, y: 0.62, color: "#336688", hairColor: "#222", activity: "typing", frame: 0 },
    { name: "DEBUG", x: 0.72, y: 0.82, color: "#cc4466", hairColor: "#333", activity: "typing", frame: 0 },
    { name: "RENDER", x: 0.88, y: 0.82, color: "#222", hairColor: "#dda", activity: "typing", frame: 0 },
    // Walking agent
    {
      name: "RUNNER", x: 0.2, y: 0.42, color: "#cc3333", hairColor: "#222",
      activity: "walking", frame: 0,
      walkPath: [
        { x: 0.2, y: 0.42 }, { x: 0.35, y: 0.42 }, { x: 0.35, y: 0.65 },
        { x: 0.2, y: 0.65 }, { x: 0.2, y: 0.42 },
      ],
      walkIdx: 0,
    },
    // Meeting room talkers
    { name: "LEAD_A", x: 0.68, y: 0.28, color: "#228866", hairColor: "#222", activity: "talking", frame: 0,
      speech: SPEECH_LINES[0][0], speechTimer: 0 },
    { name: "LEAD_B", x: 0.82, y: 0.28, color: "#884488", hairColor: "#dda", activity: "talking", frame: 0,
      speech: SPEECH_LINES[0][1], speechTimer: 0 },
  ]);

  const speechIdx = useRef(0);
  const serverLEDs = useRef<ServerLED[]>([]);

  // Handle external commands
  useEffect(() => {
    if (externalCommand) {
      setCommandLog(prev => [...prev.slice(-4), `$ ${externalCommand}`]);
      onCommandConsumed?.();
    }
  }, [externalCommand, onCommandConsumed]);

  // Init server LEDs
  useEffect(() => {
    const leds: ServerLED[] = [];
    // Left server rack area (x ~0.02-0.06, y ~0.15-0.45)
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 3; col++) {
        leds.push({
          x: 0.025 + col * 0.012,
          y: 0.18 + row * 0.03,
          color: Math.random() > 0.3 ? "#39ff14" : (Math.random() > 0.5 ? "#ff3333" : "#ffab00"),
          phase: Math.random() * Math.PI * 2,
        });
      }
    }
    // Right server rack area
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 3; col++) {
        leds.push({
          x: 0.95 + col * 0.012,
          y: 0.65 + row * 0.03,
          color: Math.random() > 0.3 ? "#39ff14" : "#ffab00",
          phase: Math.random() * Math.PI * 2,
        });
      }
    }
    serverLEDs.current = leds;
  }, []);

  // Cycle speech bubbles
  useEffect(() => {
    const interval = setInterval(() => {
      speechIdx.current = (speechIdx.current + 1) % SPEECH_LINES.length;
      const agents = agentsRef.current;
      const leadA = agents.find(a => a.name === "LEAD_A");
      const leadB = agents.find(a => a.name === "LEAD_B");
      if (leadA) leadA.speech = SPEECH_LINES[speechIdx.current][0];
      if (leadB) leadB.speech = SPEECH_LINES[speechIdx.current][1];
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  // Load background
  useEffect(() => {
    const img = new Image();
    img.src = officeBg;
    img.onload = () => {
      bgRef.current = img;
      bgLoaded.current = true;
    };
  }, []);

  // Drawing helpers
  const drawPixelPerson = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, w: number, agent: Agent, time: number) => {
    const s = w * 0.025; // sprite size relative
    const bobY = agent.activity === "typing" ? Math.sin(time * 4 + agent.frame) * s * 0.1 : 0;
    const walkBob = agent.activity === "walking" ? Math.abs(Math.sin(time * 8)) * s * 0.15 : 0;

    // Shadow
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fillRect(x - s * 0.4, y + s * 0.6, s * 0.8, s * 0.15);

    // Body
    ctx.fillStyle = agent.color;
    ctx.fillRect(x - s * 0.3, y - s * 0.1 - bobY + walkBob, s * 0.6, s * 0.5);

    // Head
    ctx.fillStyle = "#ffd5a0";
    ctx.fillRect(x - s * 0.25, y - s * 0.5 - bobY + walkBob, s * 0.5, s * 0.4);

    // Hair
    ctx.fillStyle = agent.hairColor;
    ctx.fillRect(x - s * 0.28, y - s * 0.55 - bobY + walkBob, s * 0.56, s * 0.18);

    // Typing hands animation
    if (agent.activity === "typing") {
      const handOffset = Math.sin(time * 10 + agent.frame * 2) * s * 0.08;
      ctx.fillStyle = "#ffd5a0";
      ctx.fillRect(x - s * 0.4 + handOffset, y + s * 0.1, s * 0.12, s * 0.1);
      ctx.fillRect(x + s * 0.28 - handOffset, y + s * 0.1, s * 0.12, s * 0.1);
    }

    // Walking legs
    if (agent.activity === "walking") {
      const legPhase = Math.sin(time * 8) * s * 0.12;
      ctx.fillStyle = "#335";
      ctx.fillRect(x - s * 0.15 + legPhase, y + s * 0.35, s * 0.12, s * 0.25);
      ctx.fillRect(x + s * 0.05 - legPhase, y + s * 0.35, s * 0.12, s * 0.25);
    }
  }, []);

  const drawSpeechBubble = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, w: number, text: string, time: number) => {
    const bubbleW = w * 0.16;
    const bubbleH = w * 0.04;
    const bx = x - bubbleW / 2;
    const by = y - w * 0.06;

    // Bubble bg
    ctx.fillStyle = "rgba(0,0,0,0.85)";
    ctx.fillRect(bx, by, bubbleW, bubbleH);
    ctx.strokeStyle = "#39ff14";
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, by, bubbleW, bubbleH);

    // Tail
    ctx.fillStyle = "rgba(0,0,0,0.85)";
    ctx.beginPath();
    ctx.moveTo(x - 4, by + bubbleH);
    ctx.lineTo(x, by + bubbleH + 6);
    ctx.lineTo(x + 4, by + bubbleH);
    ctx.fill();

    // Text with typing effect
    const visibleChars = Math.floor((time * 12) % (text.length + 20));
    const shown = text.slice(0, Math.min(visibleChars, text.length));

    ctx.fillStyle = "#39ff14";
    ctx.font = `${Math.max(9, w * 0.011)}px "Press Start 2P", monospace`;
    ctx.textAlign = "left";

    // Word wrap
    const maxCharsPerLine = Math.floor(bubbleW / (w * 0.007));
    const line1 = shown.slice(0, maxCharsPerLine);
    const line2 = shown.slice(maxCharsPerLine, maxCharsPerLine * 2);

    ctx.fillText(line1, bx + 4, by + bubbleH * 0.4);
    if (line2) ctx.fillText(line2, bx + 4, by + bubbleH * 0.8);

    // Blink cursor
    if (visibleChars <= text.length && Math.floor(time * 2) % 2 === 0) {
      const cursorLine = shown.length <= maxCharsPerLine ? 0 : 1;
      const cursorText = cursorLine === 0 ? line1 : line2;
      const cx = bx + 4 + ctx.measureText(cursorText).width;
      const cy = by + (cursorLine === 0 ? bubbleH * 0.4 : bubbleH * 0.8);
      ctx.fillRect(cx + 1, cy - w * 0.008, w * 0.006, w * 0.01);
    }
  }, []);

  const drawCodeScreen = useCallback((ctx: CanvasRenderingContext2D, sx: number, sy: number, sw: number, sh: number, codeIdx: number, time: number) => {
    // Screen glow
    ctx.fillStyle = "rgba(0,17,0,0.9)";
    ctx.fillRect(sx, sy, sw, sh);
    ctx.strokeStyle = "#113311";
    ctx.lineWidth = 1;
    ctx.strokeRect(sx, sy, sw, sh);

    const code = CODE_SNIPPETS[codeIdx % CODE_SNIPPETS.length];
    const lineH = Math.max(8, sh / 6);
    const offset = (time * 15 + codeIdx * 100) % (code.length * lineH + sh);

    ctx.save();
    ctx.beginPath();
    ctx.rect(sx, sy, sw, sh);
    ctx.clip();

    ctx.font = `${Math.max(7, sw * 0.08)}px "VT323", monospace`;
    code.forEach((line, i) => {
      const ly = sy + sh - offset + i * lineH;
      if (ly > sy - lineH && ly < sy + sh + lineH) {
        ctx.fillStyle = line.color;
        ctx.textAlign = "left";
        ctx.fillText(line.text, sx + 2, ly);
      }
    });

    // Scanline effect
    for (let i = 0; i < sh; i += 3) {
      ctx.fillStyle = "rgba(0,0,0,0.15)";
      ctx.fillRect(sx, sy + i, sw, 1);
    }

    ctx.restore();
  }, []);

  const drawFileCabinet = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, w: number) => {
    const cw = w * 0.08;
    const ch = w * 0.14;

    // Cabinet body
    ctx.fillStyle = "#5a4a3a";
    ctx.fillRect(x, y, cw, ch);
    ctx.strokeStyle = "#3a2a1a";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, cw, ch);

    // Drawers with labels
    const drawerH = ch / FILE_LABELS.length;
    FILE_LABELS.forEach((label, i) => {
      const dy = y + i * drawerH;
      ctx.strokeStyle = "#4a3a2a";
      ctx.strokeRect(x + 2, dy + 1, cw - 4, drawerH - 2);

      // Handle
      ctx.fillStyle = "#aa8844";
      ctx.fillRect(x + cw / 2 - 3, dy + drawerH / 2 - 1, 6, 2);

      // Label
      ctx.fillStyle = label.includes("ACTIVE") ? "#ffab00" : label.includes("DONE") ? "#39ff14" : "#aaa";
      ctx.font = `${Math.max(6, w * 0.007)}px "Press Start 2P", monospace`;
      ctx.textAlign = "left";
      ctx.fillText(label, x + 3, dy + drawerH / 2 + 2);
    });
  }, []);

  const drawServerRack = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, w: number, time: number) => {
    const rw = w * 0.04;
    const rh = w * 0.12;

    // Rack body
    ctx.fillStyle = "#1a1a2a";
    ctx.fillRect(x, y, rw, rh);
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, rw, rh);

    // Title
    ctx.fillStyle = "#39ff14";
    ctx.font = `${Math.max(6, w * 0.006)}px "Press Start 2P", monospace`;
    ctx.textAlign = "center";
    ctx.fillText("SRV", x + rw / 2, y + 8);

    // Progress bars for CPU/RAM/GPU
    const metrics = [
      { label: "CPU", value: 0.45 + Math.sin(time * 0.7) * 0.15, color: "#39ff14" },
      { label: "RAM", value: 0.72 + Math.sin(time * 0.5) * 0.08, color: "#00e5ff" },
      { label: "GPU", value: 0.23 + Math.sin(time * 0.3) * 0.1, color: "#ffab00" },
    ];

    metrics.forEach((m, i) => {
      const barY = y + 14 + i * (rh / 5);
      const barW = rw - 6;
      const barH = rh / 8;

      // Label
      ctx.fillStyle = m.color;
      ctx.font = `${Math.max(5, w * 0.005)}px "Press Start 2P", monospace`;
      ctx.textAlign = "left";
      ctx.fillText(m.label, x + 3, barY);

      // Bar bg
      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(x + 3, barY + 2, barW, barH);

      // Bar fill with scan effect
      const fillW = barW * Math.min(1, Math.max(0, m.value));
      const gradient = ctx.createLinearGradient(x + 3, 0, x + 3 + fillW, 0);
      gradient.addColorStop(0, m.color);
      gradient.addColorStop(0.5, m.color + "cc");
      gradient.addColorStop(1, m.color);
      ctx.fillStyle = gradient;
      ctx.fillRect(x + 3, barY + 2, fillW, barH);
    });
  }, []);

  const drawWallClock = useCallback((ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) => {
    const now = new Date();
    // Face
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = "#f0e8d8";
    ctx.fill();
    ctx.strokeStyle = "#8a7a5a";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Hour marks
    for (let i = 0; i < 12; i++) {
      const angle = (i * Math.PI) / 6 - Math.PI / 2;
      ctx.fillStyle = "#333";
      ctx.fillRect(
        cx + Math.cos(angle) * r * 0.75 - 1,
        cy + Math.sin(angle) * r * 0.75 - 1,
        2, 2
      );
    }

    // Hour hand
    const hAngle = ((now.getHours() % 12) / 12) * Math.PI * 2 - Math.PI / 2;
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(hAngle) * r * 0.5, cy + Math.sin(hAngle) * r * 0.5);
    ctx.stroke();

    // Minute hand
    const mAngle = (now.getMinutes() / 60) * Math.PI * 2 - Math.PI / 2;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(mAngle) * r * 0.7, cy + Math.sin(mAngle) * r * 0.7);
    ctx.stroke();

    // Second hand
    const sAngle = (now.getSeconds() / 60) * Math.PI * 2 - Math.PI / 2;
    ctx.strokeStyle = "#cc3333";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(sAngle) * r * 0.65, cy + Math.sin(sAngle) * r * 0.65);
    ctx.stroke();
  }, []);

  const drawVendingMachine = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, w: number, time: number) => {
    const vw = w * 0.03;
    const vh = w * 0.055;

    // Pulsing glow
    const glow = 0.3 + Math.sin(time * 2) * 0.2;
    ctx.fillStyle = `rgba(0, 150, 255, ${glow})`;
    ctx.fillRect(x - 2, y - 2, vw + 4, vh + 4);

    // Body
    ctx.fillStyle = "#3a4a5a";
    ctx.fillRect(x, y, vw, vh);

    // Items display
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 2; c++) {
        const blink = Math.sin(time * 3 + r + c * 2) > 0;
        ctx.fillStyle = blink ? "#ff6644" : "#44cc44";
        ctx.fillRect(x + 2 + c * (vw / 2 - 1), y + 3 + r * (vh / 4), vw / 2 - 3, vh / 5);
      }
    }
  }, []);

  const drawWaterDispenser = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, w: number, time: number) => {
    const dw = w * 0.018;
    const dh = w * 0.04;

    // Body
    ctx.fillStyle = "#ccc";
    ctx.fillRect(x, y, dw, dh);

    // Water tank
    const waterLevel = 0.6 + Math.sin(time * 0.2) * 0.1;
    ctx.fillStyle = "rgba(100,180,255,0.6)";
    ctx.fillRect(x + 2, y + dh * (1 - waterLevel), dw - 4, dh * waterLevel - 4);

    // Bubble
    if (Math.floor(time * 2) % 3 === 0) {
      ctx.fillStyle = "rgba(200,230,255,0.7)";
      const bubbleY = y + dh * 0.3 + Math.sin(time * 4) * dh * 0.1;
      ctx.beginPath();
      ctx.arc(x + dw / 2, bubbleY, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }, []);

  const drawCommandLog = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, w: number, log: string[]) => {
    if (log.length === 0) return;
    const logW = w * 0.2;
    const logH = w * 0.06;

    ctx.fillStyle = "rgba(0,0,0,0.8)";
    ctx.fillRect(x, y, logW, logH);
    ctx.strokeStyle = "#39ff14";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, logW, logH);

    ctx.fillStyle = "#39ff14";
    ctx.font = `${Math.max(7, w * 0.008)}px "VT323", monospace`;
    ctx.textAlign = "left";
    log.slice(-3).forEach((line, i) => {
      ctx.fillText(line.slice(0, 40), x + 3, y + 10 + i * 12);
    });
  }, []);

  // ── Main render loop ──────────────────────────────────
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const time = frameCount.current / 60;
    frameCount.current++;

    // Clear
    ctx.fillStyle = "#0a0a14";
    ctx.fillRect(0, 0, w, h);

    // Draw background
    if (bgLoaded.current && bgRef.current) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(bgRef.current, 0, 0, w, h);
    }

    // Draw code on screens (overlay on desk monitors)
    const screenPositions = [
      { x: 0.08, y: 0.42, w: 0.06, h: 0.05 },  // Left room top-left desk
      { x: 0.30, y: 0.42, w: 0.06, h: 0.05 },  // Left room top-right desk
      { x: 0.08, y: 0.68, w: 0.06, h: 0.05 },  // Left room bottom-left
      { x: 0.30, y: 0.68, w: 0.06, h: 0.05 },  // Left room bottom-right
      { x: 0.60, y: 0.72, w: 0.06, h: 0.05 },  // Right room
      { x: 0.76, y: 0.72, w: 0.06, h: 0.05 },  // Right room
    ];

    screenPositions.forEach((sp, i) => {
      drawCodeScreen(ctx, sp.x * w, sp.y * h, sp.w * w, sp.h * h, i, time);
    });

    // Update walking agent
    const walker = agentsRef.current.find(a => a.activity === "walking");
    if (walker && walker.walkPath) {
      const target = walker.walkPath[(walker.walkIdx || 0) + 1] || walker.walkPath[0];
      const speed = 0.001;
      const dx = target.x - walker.x;
      const dy = target.y - walker.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < speed * 2) {
        walker.walkIdx = ((walker.walkIdx || 0) + 1) % (walker.walkPath.length - 1);
      } else {
        walker.x += (dx / dist) * speed;
        walker.y += (dy / dist) * speed;
      }
    }

    // Draw agents
    agentsRef.current.forEach(agent => {
      drawPixelPerson(ctx, agent.x * w, agent.y * h, w, agent, time);
    });

    // Draw speech bubbles for talkers
    agentsRef.current.filter(a => a.activity === "talking" && a.speech).forEach(agent => {
      drawSpeechBubble(ctx, agent.x * w, agent.y * h - h * 0.04, w, agent.speech!, time);
    });

    // Server LEDs
    serverLEDs.current.forEach(led => {
      const brightness = 0.4 + Math.sin(time * 3 + led.phase) * 0.6;
      ctx.globalAlpha = Math.max(0.2, brightness);
      ctx.fillStyle = led.color;
      ctx.fillRect(led.x * w, led.y * h, 3, 2);
      ctx.globalAlpha = 1;
    });

    // Draw overlays
    drawFileCabinet(ctx, w * 0.42, h * 0.55, w);
    drawServerRack(ctx, w * 0.93, h * 0.65, w, time);
    drawVendingMachine(ctx, w * 0.37, h * 0.08, w, time);
    drawWaterDispenser(ctx, w * 0.32, h * 0.08, w, time);
    drawWallClock(ctx, w * 0.27, h * 0.07, Math.min(w, h) * 0.025);

    // Command log overlay on center screen
    drawCommandLog(ctx, w * 0.4, h * 0.35, w, commandLog);

    // CRT scanlines
    ctx.globalAlpha = 0.06;
    for (let i = 0; i < h; i += 3) {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, i, w, 1);
    }
    ctx.globalAlpha = 1;

    // Vignette
    const grad = ctx.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w * 0.7);
    grad.addColorStop(0, "rgba(0,0,0,0)");
    grad.addColorStop(1, "rgba(0,0,0,0.3)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    animFrame.current = requestAnimationFrame(render);
  }, [drawPixelPerson, drawSpeechBubble, drawCodeScreen, drawFileCabinet, drawServerRack, drawWallClock, drawVendingMachine, drawWaterDispenser, drawCommandLog, commandLog]);

  useEffect(() => {
    animFrame.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animFrame.current);
  }, [render]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ imageRendering: "pixelated" }}
    />
  );
};

export default PixelOfficeScene;
