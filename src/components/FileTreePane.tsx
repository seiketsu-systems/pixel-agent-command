import { useState } from "react";

interface TreeNode {
  name: string;
  type: "folder" | "file";
  children?: TreeNode[];
  status?: string;
}

const projectTree: TreeNode[] = [
  {
    name: "pixel-platformer",
    type: "folder",
    children: [
      {
        name: "pipeline",
        type: "folder",
        children: [
          { name: "01_research", type: "folder", status: "DONE" },
          { name: "02_scripts", type: "folder", status: "ACTIVE" },
          { name: "03_assets", type: "folder", status: "QUEUED" },
          { name: "04_build", type: "folder", status: "QUEUED" },
          { name: "05_deploy", type: "folder", status: "QUEUED" },
        ],
      },
      { name: "config.json", type: "file" },
      { name: "README.md", type: "file" },
    ],
  },
  {
    name: "retro-rpg",
    type: "folder",
    children: [
      { name: "src", type: "folder" },
      { name: "assets", type: "folder" },
      { name: "main.ts", type: "file" },
    ],
  },
  {
    name: "neon-runner",
    type: "folder",
    children: [
      { name: "levels", type: "folder" },
      { name: "index.html", type: "file" },
    ],
  },
];

const statusColor: Record<string, string> = {
  DONE: "text-neon-green",
  ACTIVE: "text-neon-amber",
  QUEUED: "text-muted-foreground",
};

const TreeItem = ({ node, depth = 0 }: { node: TreeNode; depth?: number }) => {
  const [open, setOpen] = useState(depth < 2);
  const icon = node.type === "folder" ? (open ? "📂" : "📁") : "📄";

  return (
    <div>
      <button
        onClick={() => node.type === "folder" && setOpen(!open)}
        className="w-full text-left flex items-center gap-1 py-0.5 px-1 hover:bg-muted/30 font-terminal text-sm transition-colors"
        style={{ paddingLeft: `${depth * 12 + 4}px` }}
      >
        <span style={{ imageRendering: "pixelated" }}>{icon}</span>
        <span className={node.type === "folder" ? "text-neon-cyan" : "text-foreground"}>
          {node.name}
        </span>
        {node.status && (
          <span className={`font-pixel text-[6px] ml-auto ${statusColor[node.status] || "text-muted-foreground"}`}>
            {node.status}
          </span>
        )}
      </button>
      {open && node.children?.map((child, i) => (
        <TreeItem key={i} node={child} depth={depth + 1} />
      ))}
    </div>
  );
};

const FileTreePane = () => (
  <div className="h-full flex flex-col bg-pane-bg border-r border-pane-border overflow-hidden">
    <div className="px-2 py-1.5 border-b border-pane-border flex items-center justify-between">
      <span className="font-pixel text-[7px] text-neon-cyan">PROJECT TREE</span>
      <button className="font-pixel text-[7px] text-neon-gold hover:text-neon-amber transition-colors px-1.5 py-0.5 border border-pane-border hover:border-neon-gold">
        + NEW
      </button>
    </div>
    <div className="flex-1 overflow-y-auto py-1">
      {projectTree.map((node, i) => (
        <TreeItem key={i} node={node} />
      ))}
    </div>
  </div>
);

export default FileTreePane;
