

import React, { useMemo, useState } from 'react';
import { AnalysisNode, AnalysisEdge } from '../services/geminiService';
import { useLanguage } from '../contexts/LanguageContext';

interface ConnectionMapProps {
  nodes: AnalysisNode[];
  edges: AnalysisEdge[];
}

const eraOrder: { [key: string]: number } = {
  'תנאים': 1, 'Tannaim': 1,
  'אמוראים': 2, 'Amoraim': 2,
  'סבוראים': 3, 'Savoraim': 3,
  'גאונים': 4, 'Geonim': 4,
  'ראשונים': 5, 'Rishonim': 5,
  'אחרונים': 6, 'Acharonim': 6,
  'אחרוני האחרונים': 7, 'Contemporary': 7,
};

const groupColors: { [key: string]: {light: string, dark: string} } = {
  'תנאים': {light: 'bg-red-100 text-red-800 border-red-300', dark: 'dark:bg-red-900/50 dark:text-red-200 dark:border-red-700/50'},
  'אמוראים': {light: 'bg-orange-100 text-orange-800 border-orange-300', dark: 'dark:bg-orange-900/50 dark:text-orange-200 dark:border-orange-700/50'},
  'סבוראים': {light: 'bg-amber-100 text-amber-800 border-amber-300', dark: 'dark:bg-amber-900/50 dark:text-amber-200 dark:border-amber-700/50'},
  'גאונים': {light: 'bg-yellow-100 text-yellow-800 border-yellow-300', dark: 'dark:bg-yellow-900/50 dark:text-yellow-200 dark:border-yellow-700/50'},
  'ראשונים': {light: 'bg-lime-100 text-lime-800 border-lime-300', dark: 'dark:bg-lime-900/50 dark:text-lime-200 dark:border-lime-700/50'},
  'אחרונים': {light: 'bg-green-100 text-green-800 border-green-300', dark: 'dark:bg-green-900/50 dark:text-green-200 dark:border-green-700/50'},
  'אחרוני האחרונים': {light: 'bg-teal-100 text-teal-800 border-teal-300', dark: 'dark:bg-teal-900/50 dark:text-teal-200 dark:border-teal-700/50'},
  'default': {light: 'bg-gray-100 text-gray-800 border-gray-300', dark: 'dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600'},
};

const ConnectionMap: React.FC<ConnectionMapProps> = ({ nodes, edges }) => {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const { t } = useLanguage();

  const layout = useMemo(() => {
    const groupedNodes: { [key: string]: AnalysisNode[] } = {};
    nodes.forEach(node => {
      const groupKey = node.group || 'default';
      if (!groupedNodes[groupKey]) {
        groupedNodes[groupKey] = [];
      }
      groupedNodes[groupKey].push(node);
    });
    
    const sortedGroups = Object.keys(groupedNodes).sort((a, b) => (eraOrder[a] || 99) - (eraOrder[b] || 99));

    const nodePositions: { [id: string]: { x: number; y: number } } = {};
    const viewWidth = Math.max(800, sortedGroups.length * 200);
    const viewHeight = 600;

    sortedGroups.forEach((group, colIndex) => {
      const columnNodes = groupedNodes[group];
      const x = (colIndex + 1) * (viewWidth / (sortedGroups.length + 1));
      columnNodes.forEach((node, rowIndex) => {
        const y = (rowIndex + 1) * (viewHeight / (columnNodes.length + 1));
        nodePositions[node.id] = { x, y };
      });
    });

    return { nodePositions, viewWidth, viewHeight };
  }, [nodes]);

  const { nodePositions, viewWidth, viewHeight } = layout;
  
  const isNodeRelated = (nodeId: string) => {
    if (!hoveredNodeId) return false;
    if (nodeId === hoveredNodeId) return true;
    return edges.some(edge => 
      (edge.from === hoveredNodeId && edge.to === nodeId) ||
      (edge.to === hoveredNodeId && edge.from === nodeId)
    );
  };
  
  const isEdgeRelated = (edge: AnalysisEdge) => {
     if (!hoveredNodeId) return false;
     return edge.from === hoveredNodeId || edge.to === hoveredNodeId;
  }

  return (
    <div className="relative w-full h-[500px] overflow-auto bg-gray-50/50 dark:bg-gray-900/50 rounded-lg border dark:border-gray-700/50 backdrop-blur-sm">
      <svg width={viewWidth} height={viewHeight} className="min-w-full min-h-full">
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="8" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" className="fill-current text-gray-400 dark:text-gray-500" />
          </marker>
           <marker id="arrowhead-hover" markerWidth="10" markerHeight="7" refX="8" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" className="fill-current text-blue-500" />
          </marker>
        </defs>
        
        {/* Edges */}
        {edges.map((edge, i) => {
          const fromNode = nodePositions[edge.from];
          const toNode = nodePositions[edge.to];
          if (!fromNode || !toNode) return null;

          const isRelated = isEdgeRelated(edge);
          const edgeClass = isRelated 
            ? "stroke-blue-500 stroke-2" 
            : "stroke-gray-300 dark:stroke-gray-600";
          const marker = isRelated ? "url(#arrowhead-hover)" : "url(#arrowhead)";

          // Calculate text position
          const textX = (fromNode.x + toNode.x) / 2;
          const textY = (fromNode.y + toNode.y) / 2;
          
          return (
            <g key={i} className={`transition-all duration-300 ${hoveredNodeId && !isRelated ? 'opacity-20' : 'opacity-100'}`}>
              <line
                x1={fromNode.x}
                y1={fromNode.y}
                x2={toNode.x}
                y2={toNode.y}
                className={edgeClass}
                markerEnd={marker}
              />
              <text x={textX} y={textY} dy="-5" textAnchor="middle" className="text-[10px] font-semibold fill-current text-gray-500 dark:text-gray-400">
                {edge.label}
              </text>
            </g>
          );
        })}
      </svg>
      
      {/* Nodes */}
      <div className="absolute top-0 left-0" style={{ width: viewWidth, height: viewHeight }}>
        {nodes.map(node => {
          const pos = nodePositions[node.id];
          if (!pos) return null;
          const isRelated = isNodeRelated(node.id);
          const colorClasses = groupColors[node.group] || groupColors['default'];
          const combinedColorClass = `${colorClasses.light} ${colorClasses.dark}`;
          
          return (
            <div
              key={node.id}
              onMouseEnter={() => setHoveredNodeId(node.id)}
              onMouseLeave={() => setHoveredNodeId(null)}
              className={`absolute p-2 rounded-lg shadow-md cursor-pointer transition-all duration-300 flex flex-col items-center justify-center text-center border-2 ${isRelated ? 'border-blue-500 dark:border-blue-400 shadow-xl' : 'border-transparent'} ${hoveredNodeId && !isRelated ? 'opacity-20' : 'opacity-100'}`}
              style={{
                left: pos.x,
                top: pos.y,
                transform: `translate(-50%, -50%) ${isRelated ? 'scale(1.1)' : 'scale(1)'}`,
                minWidth: '120px'
              }}
            >
              <div className={`w-full p-2 rounded-md ${combinedColorClass}`}>
                <div className="font-bold text-sm">{node.label}</div>
                <div className="text-xs font-semibold">{node.group}</div>
                <div className="text-xs">{node.era}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ConnectionMap;