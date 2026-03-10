import { useState, useRef, useEffect } from "react";

interface CommandPromptProps {
  onCommand: (cmd: string) => void;
}

const CommandPrompt = ({ onCommand }: CommandPromptProps) => {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onCommand(input.trim());
      setInput("");
    }
  };

  return (
    <div
      className="h-full flex items-center bg-terminal-bg border-t border-pane-border px-3 cursor-text"
      onClick={() => inputRef.current?.focus()}
    >
      <span className="font-pixel text-[10px] text-neon-green mr-2">$</span>
      <form onSubmit={handleSubmit} className="flex-1 flex items-center">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 bg-transparent font-terminal text-base text-foreground outline-none caret-transparent"
          placeholder=""
          spellCheck={false}
        />
        <span className="font-terminal text-foreground pixel-blink">█</span>
      </form>
    </div>
  );
};

export default CommandPrompt;
