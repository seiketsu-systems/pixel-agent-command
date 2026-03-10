import { useState, useEffect, useRef } from "react";

interface LogEntry {
  time: string;
  level: "SUCCESS" | "ERROR" | "SYSTEM" | "WARNING";
  message: string;
}

const levelColor: Record<string, string> = {
  SUCCESS: "text-neon-green",
  ERROR: "text-neon-red",
  SYSTEM: "text-neon-cyan",
  WARNING: "text-neon-amber",
};

const levelTag: Record<string, string> = {
  SUCCESS: "[OK]",
  ERROR: "[ERR]",
  SYSTEM: "[SYS]",
  WARNING: "[WRN]",
};

const initialLogs: LogEntry[] = [
  { time: "00:00:01", level: "SYSTEM", message: "PIXEL AGENT COMMAND v2.0 initialized..." },
  { time: "00:00:02", level: "SYSTEM", message: "Loading agent cluster... 4 agents online." },
  { time: "00:00:03", level: "SUCCESS", message: "CODEGEN_AGENT connected to workspace." },
  { time: "00:00:04", level: "SUCCESS", message: "ASSETGEN_AGENT sprite pipeline ready." },
  { time: "00:00:05", level: "WARNING", message: "TESTRUN_AGENT: GPU acceleration unavailable, falling back to CPU." },
  { time: "00:00:06", level: "SUCCESS", message: "Project 'pixel-platformer' loaded. Pipeline stage: 02_scripts" },
  { time: "00:00:08", level: "SYSTEM", message: "Scanning dependencies... 47 packages OK." },
  { time: "00:00:10", level: "SUCCESS", message: "Build cache warm. Ready for commands." },
];

const autoMessages: LogEntry[] = [
  { time: "", level: "SYSTEM", message: "Heartbeat check... all systems nominal." },
  { time: "", level: "SUCCESS", message: "CODEGEN_AGENT: Generated 12 new sprite collision handlers." },
  { time: "", level: "WARNING", message: "Memory usage at 72%. Consider garbage collection." },
  { time: "", level: "SUCCESS", message: "ASSETGEN_AGENT: Tileset batch #4 rendered (128 tiles)." },
  { time: "", level: "SYSTEM", message: "Auto-save triggered. Snapshot stored." },
  { time: "", level: "SUCCESS", message: "DEPLOY_AGENT: Staging environment updated." },
  { time: "", level: "WARNING", message: "TESTRUN_AGENT: 2 edge-case failures detected in level_03." },
  { time: "", level: "SUCCESS", message: "Hot-reload complete. Preview server refreshed." },
];

const getTimeStr = () => {
  const d = new Date();
  return d.toLocaleTimeString("en-US", { hour12: false });
};

interface AgentLogPaneProps {
  externalCommand?: string | null;
  onCommandConsumed?: () => void;
}

const AgentLogPane = ({ externalCommand, onCommandConsumed }: AgentLogPaneProps) => {
  const [logs, setLogs] = useState<LogEntry[]>(initialLogs);
  const [displayedChars, setDisplayedChars] = useState<Record<number, number>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoIdx = useRef(0);

  // Auto-add messages
  useEffect(() => {
    const interval = setInterval(() => {
      const msg = autoMessages[autoIdx.current % autoMessages.length];
      autoIdx.current++;
      setLogs(prev => [...prev, { ...msg, time: getTimeStr() }]);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  // Handle external commands
  useEffect(() => {
    if (externalCommand) {
      setLogs(prev => [
        ...prev,
        { time: getTimeStr(), level: "SYSTEM", message: `> ${externalCommand}` },
        { time: getTimeStr(), level: "SUCCESS", message: `Command acknowledged: "${externalCommand}"` },
      ]);
      onCommandConsumed?.();
    }
  }, [externalCommand, onCommandConsumed]);

  // Typing effect for latest log
  useEffect(() => {
    const lastIdx = logs.length - 1;
    if (lastIdx < 0) return;
    if (displayedChars[lastIdx] !== undefined) return;

    const msg = logs[lastIdx].message;
    let charIdx = 0;
    setDisplayedChars(prev => ({ ...prev, [lastIdx]: 0 }));

    const interval = setInterval(() => {
      charIdx++;
      setDisplayedChars(prev => ({ ...prev, [lastIdx]: charIdx }));
      if (charIdx >= msg.length) clearInterval(interval);
    }, 15);

    return () => clearInterval(interval);
  }, [logs.length]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, displayedChars]);

  return (
    <div className="h-full flex flex-col bg-terminal-bg border-r border-pane-border overflow-hidden">
      <div className="px-2 py-1.5 border-b border-pane-border">
        <span className="font-pixel text-[7px] text-neon-amber">AGENT LOG</span>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 font-terminal text-sm space-y-0.5">
        {logs.map((log, i) => {
          const isLast = i === logs.length - 1;
          const chars = displayedChars[i];
          const text = isLast && chars !== undefined ? log.message.slice(0, chars) : log.message;
          const showCursor = isLast && chars !== undefined && chars < log.message.length;

          return (
            <div key={i} className="flex gap-2 leading-tight">
              <span className="text-muted-foreground shrink-0">{log.time}</span>
              <span className={`shrink-0 ${levelColor[log.level]}`}>{levelTag[log.level]}</span>
              <span className={levelColor[log.level]}>
                {text}
                {showCursor && <span className="pixel-blink">█</span>}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AgentLogPane;
