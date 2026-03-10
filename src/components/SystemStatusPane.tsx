import { useState, useEffect } from "react";

const agents = [
  { name: "CODEGEN_AGENT", status: "online" },
  { name: "ASSETGEN_AGENT", status: "online" },
  { name: "TESTRUN_AGENT", status: "online" },
  { name: "DEPLOY_AGENT", status: "offline" },
];

const RetroProgressBar = ({ value, label }: { value: number; label: string }) => (
  <div className="space-y-0.5">
    <div className="flex justify-between font-pixel text-[6px]">
      <span className="text-neon-cyan">{label}</span>
      <span className="text-neon-amber">{value}%</span>
    </div>
    <div className="h-3 bg-muted border border-pane-border overflow-hidden">
      <div
        className="h-full progress-scan transition-all duration-1000"
        style={{ width: `${value}%` }}
      />
    </div>
  </div>
);

const LEDIndicator = ({ status }: { status: string }) => (
  <div
    className={`w-2 h-2 ${status === "online" ? "bg-neon-green led-pulse" : "bg-neon-red"}`}
  />
);

const MiniChart = ({ data }: { data: number[] }) => {
  const max = Math.max(...data);
  return (
    <div className="flex items-end gap-px h-8">
      {data.map((v, i) => (
        <div
          key={i}
          className="w-1.5 bg-neon-cyan"
          style={{ height: `${(v / max) * 100}%`, opacity: 0.5 + (i / data.length) * 0.5 }}
        />
      ))}
    </div>
  );
};

const SystemStatusPane = () => {
  const [progress, setProgress] = useState(34);
  const [downloads, setDownloads] = useState(1247);
  const [activeUsers, setActiveUsers] = useState(89);
  const [chartData] = useState([12, 19, 8, 25, 14, 31, 22, 28, 17, 35, 20, 42]);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => Math.min(100, p + Math.floor(Math.random() * 3)));
      setDownloads(d => d + Math.floor(Math.random() * 5));
      setActiveUsers(u => u + (Math.random() > 0.5 ? 1 : -1));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full flex flex-col bg-pane-bg overflow-hidden">
      <div className="px-2 py-1.5 border-b border-pane-border">
        <span className="font-pixel text-[7px] text-neon-purple">SYSTEM STATUS</span>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {/* Current Task */}
        <div className="space-y-1">
          <p className="font-pixel text-[6px] text-neon-gold">CURRENT TASK</p>
          <p className="font-terminal text-sm text-foreground">pixel-platformer</p>
          <p className="font-terminal text-xs text-muted-foreground">Stage: Script Generation</p>
          <RetroProgressBar value={progress} label="PIPELINE" />
        </div>

        {/* Agent Cluster */}
        <div className="space-y-1">
          <p className="font-pixel text-[6px] text-neon-gold">AGENT CLUSTER</p>
          <div className="space-y-1">
            {agents.map((a) => (
              <div key={a.name} className="flex items-center gap-2 font-terminal text-xs">
                <LEDIndicator status={a.status} />
                <span className={a.status === "online" ? "text-foreground" : "text-muted-foreground"}>
                  {a.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Metrics */}
        <div className="space-y-1">
          <p className="font-pixel text-[6px] text-neon-gold">APP METRICS</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="border border-pane-border p-1.5">
              <p className="font-pixel text-[5px] text-muted-foreground">DOWNLOADS</p>
              <p className="font-terminal text-lg text-neon-green">{downloads.toLocaleString()}</p>
            </div>
            <div className="border border-pane-border p-1.5">
              <p className="font-pixel text-[5px] text-muted-foreground">ACTIVE</p>
              <p className="font-terminal text-lg text-neon-cyan">{activeUsers}</p>
            </div>
          </div>
          <div className="border border-pane-border p-1.5">
            <p className="font-pixel text-[5px] text-muted-foreground mb-1">ACTIVITY (7D)</p>
            <MiniChart data={chartData} />
          </div>
        </div>

        {/* System */}
        <div className="space-y-1">
          <p className="font-pixel text-[6px] text-neon-gold">RESOURCES</p>
          <RetroProgressBar value={72} label="MEMORY" />
          <RetroProgressBar value={45} label="CPU" />
          <RetroProgressBar value={23} label="GPU" />
        </div>
      </div>
    </div>
  );
};

export default SystemStatusPane;
