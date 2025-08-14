
import React, { useMemo, useState } from 'react';
import { FlowchartData, FlowchartNode } from '../services/geminiService';
import { useLanguage } from '../contexts/LanguageContext';

const nodeTypeClasses: Record<FlowchartNode['type'], string> = {
  start: 'fill-green-200 dark:fill-green-800/50 stroke-green-500 dark:stroke-green-500',
  decision: 'fill-amber-200 dark:fill-amber-800/50 stroke-amber-500 dark:stroke-amber-500',
  process: 'fill-blue-200 dark:fill-blue-800/50 stroke-blue-500 dark:stroke-blue-500',
  result: 'fill-indigo-200 dark:fill-indigo-800/50 stroke-indigo-500 dark:stroke-indigo-500',
};

const NODE_WIDTH = 150;
const NODE_HEIGHT = 60;
const HORIZONTAL_SPACING = 100;
const VERTICAL_SPACING = 80;

const Flowchart: React.FC<{ data: FlowchartData }> = ({ data }) => {
  const { dir } = useLanguage();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const layout = useMemo(() => {
    const positions: { [key: string]: { x: number; y: number } } = {};
    const levels: { [key: string]: number } = {};
    const nodesInLevel: { [key: number]: number } = {};

    const startNode = data.nodes.find(n => n.type === 'start');
    if (!startNode) return { positions, width: 0, height: 0 };

    const queue: string[] = [startNode.id];
    levels[startNode.id] = 0;
    nodesInLevel[0] = 1;
    const visited = new Set<string>([startNode.id]);

    while (queue.length > 0) {
      const u = queue.shift()!;
      data.edges
        .filter(e => e.from === u)
        .forEach(edge => {
          if (!visited.has(edge.to)) {
            visited.add(edge.to);
            const level = levels[u] + 1;
            levels[edge.to] = level;
            nodesInLevel[level] = (nodesInLevel[level] || 0) + 1;
            queue.push(edge.to);
          }
        });
    }

    const nodesAtLevel: { [key: number]: string[] } = {};
    Object.entries(levels).forEach(([nodeId, level]) => {
      if (!nodesAtLevel[level]) nodesAtLevel[level] = [];
      nodesAtLevel[level].push(nodeId);
    });

    let maxWidth = 0;
    Object.keys(nodesAtLevel).forEach(levelStr => {
      const level = parseInt(levelStr, 10);
      const levelNodes = nodesAtLevel[level];
      const levelWidth = levelNodes.length * (NODE_WIDTH + HORIZONTAL_SPACING);
      if (levelWidth > maxWidth) maxWidth = levelWidth;
      
      levelNodes.forEach((nodeId, index) => {
        const x = (index + 1) * (levelWidth / (levelNodes.length + 1));
        const y = level * (NODE_HEIGHT + VERTICAL_SPACING) + NODE_HEIGHT;
        positions[nodeId] = { x, y };
      });
    });

    const totalWidth = Math.max(800, maxWidth + HORIZONTAL_SPACING);
    const totalHeight = Object.keys(nodesAtLevel).length * (NODE_HEIGHT + VERTICAL_SPACING) + NODE_HEIGHT;

    return { positions, width: totalWidth, height: totalHeight };
  }, [data]);

  const { positions, width, height } = layout;

  const getPolygonPoints = (type: FlowchartNode['type'], x: number, y: number) => {
    if (type === 'decision') {
      return `${x},${y - NODE_HEIGHT / 2} ${x + NODE_WIDTH / 2},${y} ${x},${y + NODE_HEIGHT / 2} ${x - NODE_WIDTH / 2},${y}`;
    }
    return ''; // rect is handled via x,y,width,height attributes
  };

  const isRelated = (id: string) => {
    if (!hoveredId) return false;
    if (id === hoveredId) return true;
    return data.edges.some(e => 
      (e.from === hoveredId && e.to === id) || 
      (e.to === hoveredId && e.from === id)
    );
  };
  
  const isEdgeRelated = (from: string, to: string) => {
    if (!hoveredId) return false;
    return from === hoveredId || to === hoveredId;
  };


  return (
    <div className="relative w-full h-[500px] overflow-auto bg-gray-50/50 dark:bg-gray-900/50 rounded-lg border dark:border-gray-700/50 backdrop-blur-sm">
      <svg width={width} height={height} className="min-w-full min-h-full">
         <defs>
          <marker id="flow-arrowhead" markerWidth="10" markerHeight="7" refX="8" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" className="fill-current text-gray-400 dark:text-gray-500" />
          </marker>
           <marker id="flow-arrowhead-hover" markerWidth="10" markerHeight="7" refX="8" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" className="fill-current text-primary-500" />
          </marker>
        </defs>
        
        {/* Edges */}
        {data.edges.map(edge => {
          const fromPos = positions[edge.from];
          const toPos = positions[edge.to];
          if (!fromPos || !toPos) return null;
          
          const isHovered = isEdgeRelated(edge.from, edge.to);

          return (
             <g key={`${edge.from}-${edge.to}`} onMouseEnter={() => setHoveredId(edge.from)} onMouseLeave={() => setHoveredId(null)} className={`transition-opacity duration-300 ${hoveredId && !isHovered ? 'opacity-20' : 'opacity-100'}`}>
                <line
                    x1={fromPos.x}
                    y1={fromPos.y}
                    x2={toPos.x}
                    y2={toPos.y}
                    className={`stroke-2 transition-colors ${isHovered ? 'stroke-primary-500' : 'stroke-gray-300 dark:stroke-gray-600'}`}
                    markerEnd={isHovered ? 'url(#flow-arrowhead-hover)' : 'url(#flow-arrowhead)'}
                />
                {edge.label && (
                    <text x={(fromPos.x + toPos.x) / 2} y={(fromPos.y + toPos.y) / 2} dy={-5} textAnchor="middle" className={`text-xs font-semibold ${isHovered ? 'fill-primary-600 dark:fill-primary-300' : 'fill-gray-500'}`}>
                        {edge.label}
                    </text>
                )}
             </g>
          );
        })}
        
        {/* Nodes */}
        {data.nodes.map(node => {
          const pos = positions[node.id];
          if (!pos) return null;

          const isHovered = isRelated(node.id);
          const nodeShape = node.type === 'decision' 
            ? <polygon points={getPolygonPoints(node.type, pos.x, pos.y)} />
            : node.type === 'start' || node.type === 'result'
            ? <rect x={pos.x - NODE_WIDTH / 2} y={pos.y - NODE_HEIGHT / 2} width={NODE_WIDTH} height={NODE_HEIGHT} rx={30} />
            : <rect x={pos.x - NODE_WIDTH / 2} y={pos.y - NODE_HEIGHT / 2} width={NODE_WIDTH} height={NODE_HEIGHT} rx={10} />
            
          return (
             <g key={node.id} onMouseEnter={() => setHoveredId(node.id)} onMouseLeave={() => setHoveredId(null)} className={`cursor-pointer transition-all duration-300 ${hoveredId && !isHovered ? 'opacity-20' : 'opacity-100'}`} transform={isHovered ? `translate(${pos.x}, ${pos.y}) scale(1.05) translate(-${pos.x}, -${pos.y})` : ''}>
                <g className={nodeTypeClasses[node.type]}>
                    {nodeShape}
                </g>
                <foreignObject x={pos.x - NODE_WIDTH / 2} y={pos.y - NODE_HEIGHT / 2} width={NODE_WIDTH} height={NODE_HEIGHT}>
                     <div className="w-full h-full flex items-center justify-center p-2 text-center text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-100" dir={dir}>
                        {node.label}
                    </div>
                </foreignObject>
             </g>
          );
        })}
      </svg>
    </div>
  );
};

export default Flowchart;