
import React, { useState } from 'react';
import { X, Book, Brain, Shield, Layers, AlertTriangle, FileText, Zap, Keyboard, Command, Cpu, MousePointer2, HelpCircle, GraduationCap, FolderTree, RotateCcw } from 'lucide-react';

interface WikiModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WikiModal: React.FC<WikiModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'guide' | 'logic' | 'shortcuts' | 'faq'>('guide');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-5xl bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl flex flex-col h-[85vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl border border-white/5 shadow-inner">
                <Book className="w-6 h-6 text-orange-500" />
             </div>
             <div>
                <h2 className="text-2xl font-black text-white tracking-tight">Help & Documentation</h2>
                <p className="text-sm text-slate-400 font-medium">Iconic FL Plugin Sorter <span className="text-slate-600">|</span> v1.0.0</p>
             </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-all hover:rotate-90 duration-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Sidebar + Content Layout */}
        <div className="flex flex-1 overflow-hidden">
            
            {/* Navigation Sidebar */}
            <div className="w-64 bg-slate-900/30 border-r border-slate-800 p-4 flex flex-col gap-2 shrink-0">
               <NavButton 
                    active={activeTab === 'guide'} 
                    onClick={() => setActiveTab('guide')} 
                    icon={<Zap className="w-4 h-4" />}
                    label="User Guide"
               />
               <NavButton 
                    active={activeTab === 'logic'} 
                    onClick={() => setActiveTab('logic')} 
                    icon={<Cpu className="w-4 h-4" />}
                    label="AI & Core Logic"
               />
               <NavButton 
                    active={activeTab === 'shortcuts'} 
                    onClick={() => setActiveTab('shortcuts')} 
                    icon={<Keyboard className="w-4 h-4" />}
                    label="Keyboard Shortcuts"
               />
               <NavButton 
                    active={activeTab === 'faq'} 
                    onClick={() => setActiveTab('faq')} 
                    icon={<HelpCircle className="w-4 h-4" />}
                    label="Troubleshooting"
               />
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-950 p-8">
                {activeTab === 'guide' && <GuideContent />}
                {activeTab === 'logic' && <LogicContent />}
                {activeTab === 'shortcuts' && <ShortcutsContent />}
                {activeTab === 'faq' && <FaqContent />}
            </div>
        </div>
      </div>
    </div>
  );
};

const NavButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
    <button 
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 text-left
            ${active 
                ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/20 translate-x-1' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
    >
        {icon}
        {label}
    </button>
);

const GuideContent = () => (
    <div className="space-y-8 max-w-3xl animate-in slide-in-from-right-4 duration-300 fade-in">
        <section>
            <h3 className="text-2xl font-bold text-white mb-6">Workflow Overview</h3>
            <div className="grid gap-6">
                <Step 
                    num="1" 
                    title="Initialize & Scan" 
                    desc="Select your FL Studio Plugin Database folder. The app scans every file, grouping .fst files with their assets (.png/.nfo)."
                />
                <Step 
                    num="2" 
                    title="AI Analysis" 
                    desc="Click 'Analyze' to send plugin names to Gemini. The AI matches them against your Category List. You can edit this list in the Sidebar."
                />
                <Step 
                    num="3" 
                    title="Review & Refine" 
                    desc="Use the Grid to review results. Right-click items to quickly fix mistakes. The app 'Learns' from your manual corrections."
                />
                <Step 
                    num="4" 
                    title="Execute" 
                    desc="Click 'Organize Files'. This PHYSICALLY moves files on your hard drive into folders matching your categories."
                />
            </div>
        </section>

        <section className="bg-slate-900/50 p-6 rounded-xl border border-slate-800">
             <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                 <MousePointer2 className="w-5 h-5 text-blue-400" /> Interaction Tips
             </h4>
             <ul className="grid grid-cols-2 gap-4 text-sm text-slate-400">
                 <li className="flex items-start gap-2">
                     <span className="bg-slate-800 p-1 rounded text-slate-200 font-mono text-xs">Right-Click</span>
                     <span>Opens Context Menu for quick tagging/renaming.</span>
                 </li>
                 <li className="flex items-start gap-2">
                     <span className="bg-slate-800 p-1 rounded text-slate-200 font-mono text-xs">Click + Drag</span>
                     <span>Drag a plugin onto a Category in the sidebar to move it.</span>
                 </li>
                 <li className="flex items-start gap-2">
                     <span className="bg-slate-800 p-1 rounded text-slate-200 font-mono text-xs">Double-Click</span>
                     <span>Currently selects item (future: open detailed view).</span>
                 </li>
             </ul>
        </section>
    </div>
);

const LogicContent = () => (
    <div className="space-y-8 max-w-3xl animate-in slide-in-from-right-4 duration-300 fade-in">
        
        <section>
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Brain className="w-6 h-6 text-purple-500" /> The AI Brain
            </h3>
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 text-slate-300 text-sm leading-relaxed space-y-4">
                 <p>
                    Iconic uses <strong>Google Gemini 2.5 Flash</strong>. It doesn't just look at filenames; it uses a vast internal knowledge base of VSTs to identify plugins even if filenames are obscure (e.g., "Pro-Q 3" is identified as an Equalizer).
                 </p>
                 <div className="flex gap-4 p-4 bg-slate-950 rounded border border-slate-800/50">
                     <div className="w-1/2">
                         <span className="text-xs font-bold text-slate-500 uppercase">Input</span>
                         <div className="font-mono text-orange-400 mt-1">"ValhallaRoom.fst"</div>
                     </div>
                     <div className="text-slate-600">→</div>
                     <div className="w-1/2">
                         <span className="text-xs font-bold text-slate-500 uppercase">AI Reasoning</span>
                         <div className="text-slate-400 mt-1 text-xs">"ValhallaRoom is a algorithmic reverb plugin. User has category 'FX - Reverb'. Match found."</div>
                     </div>
                 </div>
            </div>
        </section>

        <section>
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <GraduationCap className="w-6 h-6 text-green-500" /> Learned Memory
            </h3>
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 text-slate-300 text-sm leading-relaxed">
                <p className="mb-4">
                    The app saves a file called <code className="text-orange-300">.iconic-state.json</code> in your root folder. 
                    If you manually move "Serum" to "Bass" using the Context Menu or Sidebar, the app records this as a <strong>Rule</strong>.
                </p>
                <div className="flex items-center gap-3 text-xs bg-green-900/20 border border-green-500/20 p-3 rounded-lg text-green-300">
                    <Shield className="w-4 h-4" />
                    Next time you run Analyze, your manual rules override the AI's suggestions automatically.
                </div>
            </div>
        </section>

        <section>
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Layers className="w-6 h-6 text-blue-500" /> The Bundle Rule
            </h3>
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
                <p className="text-sm text-slate-300 mb-4">
                    FL Studio creates 3 files for every plugin. Iconic treats them as a single atomic unit.
                </p>
                <div className="flex flex-wrap gap-2 text-xs font-mono">
                    <div className="bg-slate-800 px-3 py-2 rounded text-white border-l-4 border-blue-500">Plugin.fst <span className="text-slate-500 ml-2">// The Preset</span></div>
                    <div className="bg-slate-800 px-3 py-2 rounded text-slate-400 border border-slate-700">Plugin.png <span className="text-slate-600 ml-2">// Screenshot</span></div>
                    <div className="bg-slate-800 px-3 py-2 rounded text-slate-400 border border-slate-700">Plugin.nfo <span className="text-slate-600 ml-2">// Metadata</span></div>
                </div>
            </div>
        </section>

    </div>
);

const ShortcutsContent = () => (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-300 fade-in">
        
        <div className="grid grid-cols-2 gap-8">
            <div>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Keyboard className="w-5 h-5 text-yellow-500" /> Selection
                </h3>
                <div className="space-y-2">
                    <ShortcutKey keys={['Click']} label="Select Item" />
                    <ShortcutKey keys={['Ctrl', 'Click']} label="Toggle Item Selection" />
                    <ShortcutKey keys={['Shift', 'Click']} label="Add Range / Add to Selection" />
                    <ShortcutKey keys={['Ctrl', 'A']} label="Select All Visible" />
                    <ShortcutKey keys={['Esc']} label="Deselect All" />
                </div>
            </div>

            <div>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Command className="w-5 h-5 text-red-500" /> Actions
                </h3>
                <div className="space-y-2">
                    <ShortcutKey keys={['Del']} label="Mark as Duplicate / Trash" />
                    <ShortcutKey keys={['Backspace']} label="Mark as Duplicate / Trash" />
                    <ShortcutKey keys={['Right Click']} label="Open Context Menu" />
                    <ShortcutKey keys={['Drag']} label="Move to Category Sidebar" />
                </div>
            </div>
        </div>

        <div>
            <h3 className="text-lg font-bold text-white mb-4">Grid Navigation</h3>
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 flex justify-center gap-4">
                <div className="flex flex-col items-center gap-2">
                    <kbd className="w-12 h-12 flex items-center justify-center bg-slate-800 rounded-lg border-b-4 border-slate-950 text-slate-200 font-mono text-xl">↑</kbd>
                    <span className="text-xs text-slate-500">Up</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                    <div className="flex gap-2">
                        <kbd className="w-12 h-12 flex items-center justify-center bg-slate-800 rounded-lg border-b-4 border-slate-950 text-slate-200 font-mono text-xl">←</kbd>
                        <kbd className="w-12 h-12 flex items-center justify-center bg-slate-800 rounded-lg border-b-4 border-slate-950 text-slate-200 font-mono text-xl">↓</kbd>
                        <kbd className="w-12 h-12 flex items-center justify-center bg-slate-800 rounded-lg border-b-4 border-slate-950 text-slate-200 font-mono text-xl">→</kbd>
                    </div>
                    <span className="text-xs text-slate-500">Navigate Grid</span>
                </div>
            </div>
        </div>
    </div>
);

const FaqContent = () => (
    <div className="space-y-6 max-w-3xl animate-in slide-in-from-right-4 duration-300 fade-in">
        <FaqItem question="Where are my API keys stored?">
            Your Gemini API Key is stored in your browser's local memory only. It is never sent to any server other than Google's AI API. It is wiped when you refresh the page.
        </FaqItem>
        
        <FaqItem question="What is '_Unused_Assets'?">
            <div className="space-y-2">
                <p>When Iconic flattens your library to reorganize it, it might find files that are not plugins (e.g. random .txt files, loose images, or installers).</p>
                <p>To avoid deleting potentially important data, and to keep your category folders clean, these files are moved to the <code>_Unused_Assets</code> folder.</p>
            </div>
        </FaqItem>

        <FaqItem question="How does Deduplication decide what to keep?">
            <p>It uses a "Newest Wins" strategy.</p>
            <p className="mt-2 text-slate-400">Example: You have <code>Serum.fst (Modified 2024)</code> and <code>Serum.fst (Modified 2021)</code>.</p>
            <p className="text-slate-400">The 2024 version is kept. The 2021 version is marked as a duplicate and will be deleted upon execution.</p>
        </FaqItem>

        <FaqItem question="Can I undo the organization?">
             <div className="flex items-start gap-3 bg-red-950/30 p-3 rounded border border-red-900/50">
                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                <div className="text-red-200 text-xs">
                    <strong className="block mb-1">Technically, yes (Immediate Undo).</strong>
                    After organization, an "Undo" button appears. This relies on a manifest file. If you refresh the page, the Undo capability is lost forever.
                    <br/><br/>
                    Always review your grid before clicking Organize.
                </div>
             </div>
        </FaqItem>

        <FaqItem question="Does this work with nested folders?">
            Yes. The first thing Iconic does during scanning is recursively find every plugin in every subfolder. When you organize, it flattens this structure into your clean Category folders.
        </FaqItem>
    </div>
);

// --- Sub Components ---

const Step = ({ num, title, desc }: { num: string, title: string, desc: string }) => (
    <div className="flex gap-4 p-4 bg-slate-900/50 rounded-xl border border-slate-800 hover:bg-slate-900 transition-colors">
        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-black text-slate-500 border border-slate-700 shrink-0 shadow-inner">
            {num}
        </div>
        <div>
            <h4 className="font-bold text-white mb-1">{title}</h4>
            <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
        </div>
    </div>
);

const ShortcutKey = ({ keys, label }: { keys: string[], label: string }) => (
    <div className="flex justify-between items-center bg-slate-900 p-3 rounded-lg border border-slate-800/50">
        <span className="text-sm font-medium text-slate-300">{label}</span>
        <div className="flex gap-1.5">
            {keys.map((k, i) => (
                <div key={i} className="flex items-center gap-1.5">
                    {i > 0 && <span className="text-slate-600 text-xs">+</span>}
                    <kbd className="bg-slate-800 border-b-2 border-slate-950 px-2 py-1 rounded text-xs font-mono text-slate-200 min-w-[30px] text-center shadow-sm">
                        {k}
                    </kbd>
                </div>
            ))}
        </div>
    </div>
);

const FaqItem = ({ question, children }: { question: string, children?: React.ReactNode }) => (
    <details className="group bg-slate-900 rounded-xl border border-slate-800 overflow-hidden open:ring-1 open:ring-orange-500/20 transition-all">
        <summary className="flex items-center justify-between p-4 cursor-pointer font-bold text-slate-200 hover:bg-slate-800 transition-colors select-none">
            <span>{question}</span>
            <RotateCcw className="w-4 h-4 text-slate-500 group-open:rotate-180 transition-transform" />
        </summary>
        <div className="p-4 pt-0 text-sm text-slate-400 leading-relaxed border-t border-transparent group-open:border-slate-800/50 group-open:pt-4">
            {children}
        </div>
    </details>
);

export default WikiModal;
