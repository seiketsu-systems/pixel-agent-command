import { useState, useCallback } from "react";
import TopBanner from "@/components/TopBanner";
import FileTreePane from "@/components/FileTreePane";
import AgentLogPane from "@/components/AgentLogPane";
import SystemStatusPane from "@/components/SystemStatusPane";
import CommandPrompt from "@/components/CommandPrompt";

const Index = () => {
  const [command, setCommand] = useState<string | null>(null);

  const handleCommand = useCallback((cmd: string) => {
    setCommand(cmd);
  }, []);

  const handleCommandConsumed = useCallback(() => {
    setCommand(null);
  }, []);

  return (
    <div className="crt-overlay h-screen w-screen flex flex-col overflow-hidden">
      {/* Top Banner - 10% */}
      <div className="h-[10vh] shrink-0">
        <TopBanner />
      </div>

      {/* Main Command Center - 80% */}
      <div className="flex-1 flex min-h-0">
        {/* Pane 1: File Tree - 25% */}
        <div className="w-1/4 min-w-0">
          <FileTreePane />
        </div>

        {/* Pane 2: Agent Log - 50% */}
        <div className="w-2/4 min-w-0">
          <AgentLogPane
            externalCommand={command}
            onCommandConsumed={handleCommandConsumed}
          />
        </div>

        {/* Pane 3: System Status - 25% */}
        <div className="w-1/4 min-w-0">
          <SystemStatusPane />
        </div>
      </div>

      {/* Pane 4: Command Prompt - 10% */}
      <div className="h-[10vh] shrink-0">
        <CommandPrompt onCommand={handleCommand} />
      </div>
    </div>
  );
};

export default Index;
