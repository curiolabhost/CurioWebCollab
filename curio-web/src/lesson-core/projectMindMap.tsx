
import { useMemo, useState } from "react";
import { ArrowRight, Lightbulb, Zap } from "lucide-react";

/* ============================================================
   Types (generic)
============================================================ */

export type MindMapNode = {
  id: string;
  title: string;
  description?: string;
  connections: string[];

  // you were using these for styling
  color: string; // e.g. "bg-white text-gray-900 border-gray-200"
  type?: "hub" | string;

  // icon is a React component (lucide icon or your own)
  icon?: React.ComponentType<{ className?: string }>;
};

export type ButtonBehavior = {
  screen: string;
  buttons: { name: string; action: string }[];
};

export type ProjectOverview = {
  title: string;
  description: string;
  keyFeatures: { title: string; description: string }[];
};

export type NodePosition = { x: number; y: number };
export type NodePositions = Record<string, NodePosition>;

interface ProjectMindMapProps {
  // lesson navigation
  onBack?: () => void;
  onContinue?: () => void;

  // project-provided data (no project imports in this file)
  mindmapNodes: MindMapNode[];
  buttonBehaviors: ButtonBehavior[];
  projectOverview: ProjectOverview;

  /**
   * Optional: positions for nodes (in % coordinates)
   * If not provided, nodes default to center.
   */
  positions?: NodePositions;

  /**
   * Optional: which node id gets the special “hub branching” line logic.
   * Defaults to "main-menu" to match your current implementation.
   */
  hubId?: string;

  /**
   * Optional: customize the key-feature icon (defaults to Lightbulb)
   */
  KeyFeatureIcon?: React.ComponentType<{ className?: string }>;
}

/* ============================================================
   Component (generic)
============================================================ */

export function ProjectMindmap({
  onBack,
  onContinue,
  mindmapNodes,
  buttonBehaviors,
  projectOverview,
  positions,
  hubId = "main-menu",
  KeyFeatureIcon = Lightbulb,
}: ProjectMindMapProps) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const nodeById = useMemo(() => {
    const m = new Map<string, MindMapNode>();
    (mindmapNodes || []).forEach((n) => m.set(n.id, n));
    return m;
  }, [mindmapNodes]);

  const getNodePosition = (nodeId: string) => {
    const pos = positions?.[nodeId];
    return pos || { x: 50, y: 50 };
  };

  const isNodeHighlighted = (nodeId: string) => {
    if (!selectedNode) return false;
    const node = nodeById.get(selectedNode);
    return !!node && (node.connections.includes(nodeId) || selectedNode === nodeId);
  };

  const selectedNodeData = selectedNode ? nodeById.get(selectedNode) : undefined;
  const hoveredNodeData = hoveredNode ? nodeById.get(hoveredNode) : undefined;
  const displayNode = hoveredNodeData || selectedNodeData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-12 py-8">
          <h1 className="text-gray-900 mb-3">{projectOverview?.title}</h1>
          <p className="text-m text-gray-600 max-w-4xl">{projectOverview?.description}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-12 py-12">
        {/* Key Features */}

        {/* Interactive Mindmap */}
        <section className="mb-5">
          <h2 className="mb-2">Screen Flow &amp; Navigation</h2>
          <p className="text-gray-600 mb-5">
            Click on any screen to see its connections and component behaviors.
          </p>

          {/* ============================================================
             CHANGE: left (map) + right (details) layout
          ============================================================ */}
          <div className="grid grid-cols-3 gap-6">
            {/* Left: Mindmap (2/3 width) */}
            <div className="col-span-2">
              <div className="bg-white rounded-2xl p-12 border border-gray-200 shadow-lg">
                {/* SVG Canvas for Flowchart */}
                <div className="relative w-full" style={{ height: "600px" }}>
                  {/* Connection Lines */}
                  <svg
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    style={{ zIndex: 0 }}
                  >
                    <defs>
                      <marker
                        id="arrowhead"
                        markerWidth="10"
                        markerHeight="10"
                        refX="9"
                        refY="3"
                        orient="auto"
                      >
                        <polygon points="0 0, 10 3, 0 6" fill="#9CA3AF" />
                      </marker>
                      <marker
                        id="arrowhead-highlight"
                        markerWidth="10"
                        markerHeight="10"
                        refX="9"
                        refY="3"
                        orient="auto"
                      >
                        <polygon points="0 0, 10 3, 0 6" fill="#6366F1" />
                      </marker>
                    </defs>

                    {(mindmapNodes || []).map((node) => {
                      const fromPos = getNodePosition(node.id);

                      // Hub logic (generic): draw a shared vertical + horizontal trunk for connections
                      if (node.id === hubId) {
                        const isHighlighted =
                          selectedNode === node.id ||
                          node.connections.some((id) => selectedNode === id);

                        return (
                          <g key={node.id}>
                            {/* Vertical line from hub down */}
                            <line
                              x1={`${fromPos.x}%`}
                              y1={`${fromPos.y + 4}%`}
                              x2={`${fromPos.x}%`}
                              y2={`${fromPos.y + 8}%`}
                              stroke={isHighlighted ? "#6366F1" : "#D1D5DB"}
                              strokeWidth={isHighlighted ? "3" : "2"}
                              className="transition-all duration-300"
                            />

                            {/* Horizontal line spanning min/max x of children (instead of hardcoded 15% to 85%) */}
                            {(() => {
                              const xs = node.connections.map((toId) => getNodePosition(toId).x);
                              const minX = xs.length ? Math.min(...xs) : fromPos.x;
                              const maxX = xs.length ? Math.max(...xs) : fromPos.x;
                              return (
                                <line
                                  x1={`${minX}%`}
                                  y1={`${fromPos.y + 8}%`}
                                  x2={`${maxX}%`}
                                  y2={`${fromPos.y + 8}%`}
                                  stroke={isHighlighted ? "#6366F1" : "#D1D5DB"}
                                  strokeWidth={isHighlighted ? "3" : "2"}
                                  className="transition-all duration-300"
                                />
                              );
                            })()}

                            {/* Vertical lines to each option */}
                            {node.connections.map((toId) => {
                              const toPos = getNodePosition(toId);
                              const isConnHighlighted =
                                selectedNode === node.id || selectedNode === toId;

                              return (
                                <line
                                  key={toId}
                                  x1={`${toPos.x}%`}
                                  y1={`${fromPos.y + 8}%`}
                                  x2={`${toPos.x}%`}
                                  y2={`${toPos.y - 4}%`}
                                  stroke={isConnHighlighted ? "#6366F1" : "#D1D5DB"}
                                  strokeWidth={isConnHighlighted ? "3" : "2"}
                                  markerEnd={
                                    isConnHighlighted
                                      ? "url(#arrowhead-highlight)"
                                      : "url(#arrowhead)"
                                  }
                                  className="transition-all duration-300"
                                />
                              );
                            })}
                          </g>
                        );
                      }

                      // Regular connections for other nodes
                      return node.connections.map((toId) => {
                        const toPos = getNodePosition(toId);
                        const isHighlighted = selectedNode === node.id || selectedNode === toId;

                        return (
                          <g key={`${node.id}-${toId}`}>
                            <line
                              x1={`${fromPos.x}%`}
                              y1={`${fromPos.y + 4}%`}
                              x2={`${toPos.x}%`}
                              y2={`${toPos.y - 4}%`}
                              stroke={isHighlighted ? "#6366F1" : "#D1D5DB"}
                              strokeWidth={isHighlighted ? "3" : "2"}
                              markerEnd={
                                isHighlighted ? "url(#arrowhead-highlight)" : "url(#arrowhead)"
                              }
                              className="transition-all duration-300"
                            />
                          </g>
                        );
                      });
                    })}
                  </svg>

                  {/* Nodes */}
                  {(mindmapNodes || []).map((node) => {
                    const pos = getNodePosition(node.id);
                    const Icon = node.icon;

                    const isSelected = selectedNode === node.id;
                    const isHovered = hoveredNode === node.id;
                    const isConnected = isNodeHighlighted(node.id);

                    return (
                      <div
                        key={node.id}
                        className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 ${
                          isSelected || isHovered ? "z-20 scale-110" : isConnected ? "z-10" : "z-0"
                        }`}
                        style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                        onClick={() => setSelectedNode(node.id === selectedNode ? null : node.id)}
                        onMouseEnter={() => setHoveredNode(node.id)}
                        onMouseLeave={() => setHoveredNode(null)}
                      >
                        <div
                          className={`${node.color} border-2 rounded-xl px-6 py-4 min-w-[180px] shadow-md hover:shadow-xl transition-all ${
                            isSelected ? "ring-4 ring-indigo-300" : ""
                          } ${
                            isConnected && !isSelected
                              ? "opacity-100"
                              : !selectedNode
                              ? "opacity-100"
                              : "opacity-40"
                          }`}
                        >
                          {Icon ? (
                            <div className="flex justify-center mb-2">
                              <Icon className="w-6 h-6" />
                            </div>
                          ) : null}

                          <div className="text-center text-sm">{node.title}</div>

                          {node.type === "hub" ? (
                            <div className="flex justify-center mt-2">
                              <div className="px-2 py-1 bg-purple-600 text-white text-xs rounded-full">
                                HUB
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: Node Details Panel (1/3 width) */}
            <div className="col-span-1">
              {displayNode ? (
                <div className="bg-white rounded-xl p-8 border-2 border-indigo-200 shadow-lg sticky top-6">
                  <div className="flex flex-col items-center text-center">
                    <div className={`${displayNode.color} border-2 rounded-xl p-6 mb-4`}>
                      {displayNode.icon ? <displayNode.icon className="w-8 h-8" /> : null}
                    </div>

                    <h3 className="text-xl mb-2">{displayNode.title}</h3>
                    <p className="text-gray-600 mb-4">{displayNode.description}</p>

                    {displayNode.connections?.length ? (
                      <div className="w-full">
                        <div className="text-sm text-gray-500 mb-2">Connects to:</div>
                        <div className="flex gap-2 flex-wrap justify-center">
                          {displayNode.connections.map((connId) => {
                            const connNode = nodeById.get(connId);
                            return (
                              <div
                                key={connId}
                                className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm rounded-full"
                              >
                                {connNode?.title}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl p-8 border border-gray-200 flex items-center justify-center text-center h-full">
                  <p className="text-sm text-gray-500">Click or hover over a screen to see details</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Button Behaviors */}
        {!!buttonBehaviors?.length ? (
          <section className="mb-12">
            <div className="grid grid-cols-2 gap-6">
              {buttonBehaviors.map((behavior, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Zap className="w-5 h-5 text-orange-500" />
                    <h3 className="text-lg">{behavior.screen}</h3>
                  </div>

                  <div className="space-y-3">
                    {behavior.buttons.map((button, btnIndex) => (
                      <div key={btnIndex} className="flex items-start gap-3">
                        <div className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-md flex-shrink-0">
                          {button.name}
                        </div>
                        <div className="text-sm text-gray-600 flex-1">{button.action}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* Continue Button */}
        {onContinue ? (
          <div className="flex justify-center">
            <button
              onClick={onContinue}
              className="flex items-center gap-3 px-12 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              Begin Project Build
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

