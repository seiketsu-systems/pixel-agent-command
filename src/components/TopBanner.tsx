import { useState, useEffect } from "react";

const PixelLobster = () => (
  <div className="relative ring-pulse rounded-sm">
    <div className="text-2xl" style={{ imageRendering: "pixelated" }}>
      🦞
    </div>
  </div>
);

const LiveDot = () => (
  <div className="flex items-center gap-2">
    <div className="w-2 h-2 bg-neon-red rounded-none live-blink" />
    <span className="font-pixel text-neon-red text-[8px]">LIVE</span>
  </div>
);

const RetroClock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="font-pixel text-neon-amber text-[10px] led-pulse">
      {time.toLocaleTimeString("en-US", { hour12: false })}
    </span>
  );
};

const TopBanner = () => (
  <div className="h-full flex items-center justify-between px-4 border-b border-pane-border bg-pane-bg">
    <div className="flex items-center gap-3">
      <PixelLobster />
    </div>
    <div className="flex-1 text-center">
      <h1 className="font-pixel text-[9px] sm:text-[11px] text-neon-green leading-relaxed tracking-wider">
        MISSION CONTROL v2
      </h1>
      <p className="font-pixel text-[6px] sm:text-[7px] text-neon-cyan tracking-widest">
        PIXEL AGENT COMMAND
      </p>
    </div>
    <div className="flex items-center gap-4">
      <LiveDot />
      <RetroClock />
    </div>
  </div>
);

export default TopBanner;
