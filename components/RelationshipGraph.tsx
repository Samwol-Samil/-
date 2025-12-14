import React, { useMemo, useState } from 'react';
import { Character } from '../types';

interface RelationshipGraphProps {
  characters: Character[];
}

const RelationshipGraph: React.FC<RelationshipGraphProps> = ({ characters }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Configuration for the layout
  const width = 600;
  const height = 500;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2 - 60; // Leave padding for labels

  // Calculate node positions in a circle
  const nodes = useMemo(() => {
    return characters.map((char, index) => {
      const angle = (index / characters.length) * 2 * Math.PI - Math.PI / 2; // Start from top
      return {
        ...char,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      };
    });
  }, [characters, centerX, centerY, radius]);

  // Determine relationship type based on score
  const getRelationshipType = (score: number) => {
    if (score >= 90) return 'married';
    if (score >= 50) return 'lover';
    if (score > 0) return 'friend';
    return 'enemy';
  };

  const getStrokeColor = (score: number) => {
    const type = getRelationshipType(score);
    const opacity = Math.min(Math.abs(score) / 100 + 0.3, 1);
    
    switch (type) {
      case 'married': return `rgba(168, 85, 247, ${opacity})`; // Purple
      case 'lover': return `rgba(236, 72, 153, ${opacity})`; // Pink
      case 'friend': return `rgba(59, 130, 246, ${opacity})`; // Blue
      default: return `rgba(239, 68, 68, ${opacity})`; // Red (Enemy/Negative)
    }
  };

  const getMarkerId = (score: number) => {
    const type = getRelationshipType(score);
    switch (type) {
      case 'married': return "url(#arrowhead-purple)";
      case 'lover': return "url(#arrowhead-pink)";
      case 'friend': return "url(#arrowhead-blue)";
      default: return "url(#arrowhead-red)";
    }
  };

  // Generate lines (edges) between nodes
  const edges = useMemo(() => {
    const edgeList: any[] = [];
    
    nodes.forEach(source => {
      Object.entries(source.relationships).forEach(([targetId, score]) => {
        const target = nodes.find(n => n.id === targetId);
        if (!target) return;
        
        // Only show significant relationships or if selected
        // Lower threshold to show 'friends' more easily
        if (Math.abs(score) < 10 && selectedId !== source.id) return;

        edgeList.push({
          source,
          target,
          score,
          id: `${source.id}-${target.id}`
        });
      });
    });
    return edgeList;
  }, [nodes, selectedId]);

  const selectedNode = useMemo(() => nodes.find(n => n.id === selectedId), [nodes, selectedId]);

  return (
    <div className="flex-1 bg-black/50 border border-gray-700 rounded-xl flex flex-col items-center justify-center p-4 shadow-inner relative overflow-hidden">
       {/* Legend */}
       <div className="absolute top-4 left-4 z-10 bg-gray-900/80 p-3 rounded-lg border border-gray-700 backdrop-blur-sm pointer-events-none">
        <h4 className="text-[10px] text-gray-500 uppercase font-bold mb-2 tracking-wider">Relationship Types</h4>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-xs text-gray-300">
            <div className="w-8 h-0.5 bg-purple-500"></div> 
            <span>결혼/부부 (90+)</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-300">
            <div className="w-8 h-0.5 bg-pink-500"></div> 
            <span>연인/썸 (50+)</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-300">
            <div className="w-8 h-0.5 bg-blue-500"></div> 
            <span>동료/친구 (0+)</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-300">
            <div className="w-8 h-0.5 bg-red-500"></div> 
            <span>앙숙/혐관 (음수)</span>
          </div>
        </div>
      </div>

      <svg 
        width="100%" 
        height="100%" 
        viewBox={`0 0 ${width} ${height}`} 
        className="max-w-3xl max-h-[80vh] z-0 cursor-default"
        onClick={() => setSelectedId(null)}
      >
        <defs>
          <marker id="arrowhead-blue" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" />
          </marker>
          <marker id="arrowhead-red" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />
          </marker>
          <marker id="arrowhead-pink" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#ec4899" />
          </marker>
          <marker id="arrowhead-purple" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#a855f7" />
          </marker>
        </defs>

        {/* Connections */}
        {edges.map((edge) => {
          const isHighlighted = selectedId === edge.source.id;
          const isDimmed = selectedId && selectedId !== edge.source.id;
          
          // Curved lines to separate A->B and B->A
          const midX = (edge.source.x + edge.target.x) / 2;
          const midY = (edge.source.y + edge.target.y) / 2;
          const dx = edge.target.x - edge.source.x;
          const dy = edge.target.y - edge.source.y;
          // Offset control point
          const controlX = midX - dy * 0.1; 
          const controlY = midY + dx * 0.1;

          return (
            <path
              key={edge.id}
              d={`M ${edge.source.x} ${edge.source.y} Q ${controlX} ${controlY} ${edge.target.x} ${edge.target.y}`}
              stroke={getStrokeColor(edge.score)}
              strokeWidth={isHighlighted ? 3 : Math.max(1.5, Math.abs(edge.score) / 20)}
              fill="none"
              opacity={isDimmed ? 0.1 : 0.8}
              markerEnd={getMarkerId(edge.score)}
              className="transition-all duration-300"
            />
          );
        })}

        {/* Nodes */}
        {nodes.map((node) => (
          <g 
            key={node.id} 
            className="cursor-pointer transition-transform duration-200 hover:scale-110"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedId(prev => prev === node.id ? null : node.id);
            }}
          >
            {/* Selection Glow */}
            {selectedId === node.id && (
              <circle cx={node.x} cy={node.y} r="35" fill="rgba(255,255,255,0.2)" stroke="white" strokeWidth="1" strokeDasharray="4 2" />
            )}
            
            {/* Character Node Circle */}
            <circle
              cx={node.x}
              cy={node.y}
              r="24"
              fill="#1f2937"
              stroke={
                node.status.includes('연애') ? '#ec4899' : 
                node.status.includes('기혼') ? '#a855f7' : '#4b5563'
              }
              strokeWidth="2"
            />
            
            {/* Initials */}
            <text
              x={node.x}
              y={node.y}
              dy="0.3em"
              textAnchor="middle"
              fill="white"
              fontSize="12"
              fontWeight="bold"
              className="pointer-events-none"
            >
              {node.name.substring(0, 2)}
            </text>

            {/* Name Label */}
            <text
              x={node.x}
              y={node.y + 40}
              textAnchor="middle"
              fill={selectedId === node.id ? "#fff" : "#d1d5db"}
              fontSize="12"
              fontWeight={selectedId === node.id ? "bold" : "normal"}
              className="pointer-events-none"
              style={{ textShadow: '0px 2px 4px black' }}
            >
              {node.name}
            </text>
            
            {/* Status Indicator */}
            <text
              x={node.x}
              y={node.y + 54}
              textAnchor="middle"
              fill="#6b7280"
              fontSize="10"
              className="pointer-events-none"
            >
              {node.role}
            </text>
          </g>
        ))}
      </svg>

      {/* Selected Character Detail Overlay */}
      {selectedNode && (
        <div 
          className="absolute z-50 p-3 rounded-xl bg-gray-900/95 border border-gray-600 shadow-2xl backdrop-blur-md w-52 text-xs pointer-events-none animate-fade-in"
          style={{
            left: `${(selectedNode.x / width) * 100}%`,
            top: `${(selectedNode.y / height) * 100}%`,
            // Flip tooltip above if node is in bottom half to prevent clipping
            transform: selectedNode.y > centerY ? 'translate(-50%, -100% - 20px)' : 'translate(-50%, 20px)'
          }}
        >
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-700">
            <span className="font-bold text-white text-sm">{selectedNode.name}</span>
            <span className="text-gray-400 font-mono">{selectedNode.age}세</span>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
               <span className="text-gray-500">MBTI</span>
               <span className="text-blue-400 font-bold">{selectedNode.mbti}</span>
            </div>
            
            <div>
              <div className="text-gray-500 mb-0.5">Likes</div>
              <div className="text-gray-300 leading-tight">
                {selectedNode.likes.length ? selectedNode.likes.join(', ') : '-'}
              </div>
            </div>

            <div>
              <div className="text-gray-500 mb-0.5">Dislikes</div>
              <div className="text-gray-300 leading-tight">
                {selectedNode.dislikes.length ? selectedNode.dislikes.join(', ') : '-'}
              </div>
            </div>
          </div>
          
          {/* Status Badge in Tooltip */}
          <div className="mt-3 pt-2 border-t border-gray-700 text-center">
             <span className={`px-2 py-0.5 rounded-full text-[10px] ${selectedNode.isEmployed ? 'bg-blue-900/50 text-blue-200' : 'bg-red-900/50 text-red-200'}`}>
               {selectedNode.isEmployed ? selectedNode.status : '해고됨'}
             </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RelationshipGraph;