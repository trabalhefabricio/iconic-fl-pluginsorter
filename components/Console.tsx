import React, { useRef, useEffect } from 'react';
import { Terminal, ChevronUp, ChevronDown } from 'lucide-react';
import { LogEntry } from '../types';

interface ConsoleProps {
  logs: LogEntry[];
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
}

const Console: React.FC<ConsoleProps> = ({ logs, isOpen, setIsOpen }) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (isOpen && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isOpen]);

  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'success': return 'text-green-400';
      case 'error': return 'text-red-400';
      case 'warning': return 'text-yellow-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className={`bg-slate-950 border-t border-slate-800 transition-all duration-300 flex flex-col shrink-0 ${isOpen ? 'h-48' : 'h-8'}`}>
      
      {/* Header / Toggle Bar */}
      <div 
        className="h-8 bg-slate-900 flex items-center justify-between px-4 cursor-pointer hover:bg-slate-800 transition-colors border-b border-slate-800"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <Terminal className="w-3 h-3" />
          <span>SYSTEM LOG</span>
          {logs.length > 0 && <span className="bg-slate-800 px-1.5 rounded-full text-[10px] text-slate-400">{logs.length}</span>}
        </div>
        <div>
          {isOpen ? <ChevronDown className="w-3 h-3 text-slate-500" /> : <ChevronUp className="w-3 h-3 text-slate-500" />}
        </div>
      </div>

      {/* Log Content */}
      {isOpen && (
        <div className="flex-1 overflow-y-auto p-2 font-mono text-xs space-y-1 custom-scrollbar bg-[#0a0f18]">
            {logs.length === 0 && <div className="text-slate-700 italic pl-2">&gt; Ready...</div>}
            {logs.map((log) => (
                <div key={log.id} className="flex gap-3 hover:bg-white/5 p-0.5 rounded">
                    <span className="text-slate-600 select-none min-w-[60px]">{log.timestamp}</span>
                    <span className={`${getLogColor(log.type)}`}>
                        {log.type === 'success' && '✓ '}
                        {log.type === 'error' && '✗ '}
                        {log.type === 'warning' && '! '}
                        {log.message}
                    </span>
                </div>
            ))}
            <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
};

export default Console;