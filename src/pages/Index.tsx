import { useState, useCallback } from "react";
import TopBanner from "@/components/TopBanner";
import PixelOfficeScene from "@/components/PixelOfficeScene";
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
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-background">
      {/* Top Banner */}
      <div className="h-[48px] shrink-0">
        <TopBanner />
      </div>

      {/* Main Office Scene */}
      <div className="flex-1 min-h-0">
        <PixelOfficeScene
          externalCommand={command}
          onCommandConsumed={handleCommandConsumed}
        />
      </div>

      {/* Command Prompt */}
      <div className="h-[44px] shrink-0">
        <CommandPrompt onCommand={handleCommand} />
      </div>
    </div>
  );
};

export default Index;
