import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';

interface LogViewerProps {
  logs: LogEntry[];
}

const LogViewer: React.FC<LogViewerProps> = ({ logs }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const getTypeStyle = (type: LogEntry['type']) => {
    // User Request:
    // Daily/Routine -> Gray-White (neutral)
    // Special Events -> Blue
    switch (type) {
      case 'neutral': 
        return 'text-gray-300'; // Daily/Routine
      case 'positive': 
        return 'text-blue-400'; // Special
      case 'negative': 
        return 'text-blue-400'; // Special
      case 'romantic': 
        return 'text-blue-300 font-medium'; // Special
      case 'drama': 
        return 'text-blue-500 font-bold'; // Very Special
      default: 
        return 'text-gray-300';
    }
  };

  return (
    <div className="flex-1 bg-black/50 border border-gray-700 rounded-xl overflow-hidden flex flex-col font-mono shadow-inner">
      <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-gray-500"></div>
        <span className="text-xs text-gray-400 ml-2">events.log</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {logs.length === 0 && (
          <div className="text-gray-600 text-center mt-10 text-sm">
            Ready to simulate...
          </div>
        )}
        {logs.map((log) => (
          <div key={log.id} className="text-sm animate-fade-in border-b border-gray-800/50 pb-1 last:border-0">
            <span className="text-gray-600 mr-2 text-xs">Day {log.day}</span>
            <span className={getTypeStyle(log.type)}>
              {log.text}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default LogViewer;