import React, { useState, useMemo } from 'react';
import { 
  FileTerminal, 
  Copy, 
  CheckCircle2, 
  Settings, 
  Layout, 
  Plus, 
  Trash2,
  AlertCircle,
  Hash,
  ShieldCheck,
  Zap,
  Info,
  ChevronDown,
  Sparkles,
  BookOpen,
  Power,
  RefreshCw
} from 'lucide-react';
import { Client, Project, InternalCode, ServiceLine, ClientStatus } from '../types';

interface CodeGeneratorProps {
  clients: Client[];
  projects: Project[];
  serviceLines: ServiceLine[];
  internalRegistry: InternalCode[];
  setInternalRegistry: React.Dispatch<React.SetStateAction<InternalCode[]>>;
}

const CodeGenerator: React.FC<CodeGeneratorProps> = ({ clients, projects, serviceLines, internalRegistry, setInternalRegistry }) => {
  const [activeTab, setActiveTab] = useState<'project' | 'internal'>('project');
  const [copied, setCopied] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [serviceLineModality, setServiceLineModality] = useState('TT');
  const [showToast, setShowToast] = useState(false);

  // For managing internal codes
  const [newInternalDesc, setNewInternalDesc] = useState('');
  const [newInternalCategory, setNewInternalCategory] = useState<InternalCode['category']>('ADM');

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setShowToast(true);
    setTimeout(() => {
      setCopied(false);
      setShowToast(false);
    }, 2000);
  };

  const currentClient = clients.find(c => c.id === selectedClientId);
  
  // Standardization Logic: [ACRONYM]-[Service Line]-PRJ-[Sequence]
  const generatedCode = useMemo(() => {
    if (!currentClient) return '---';
    const clientProjs = projects.filter(p => p.clientId === currentClient.id);
    const nextSeq = clientProjs.length + 1;
    const seqStr = String(nextSeq).padStart(2, '0');
    
    const acronym = currentClient.prefix.split('-')[0];
    return `${acronym}-${serviceLineModality}-PRJ-${seqStr}`;
  }, [currentClient, projects, serviceLineModality]);

  const addInternalCode = () => {
    if (!newInternalDesc) return;

    const categoryPrefix = `TT-INT-${newInternalCategory}`;
    const existingInCategory = internalRegistry.filter(item => item.code.startsWith(categoryPrefix));
    const sequenceNumber = existingInCategory.length + 1;
    const finalCode = `${categoryPrefix}-${String(sequenceNumber).padStart(2, '0')}`;

    const newEntry: InternalCode = {
      id: `I-${Date.now()}`,
      code: finalCode,
      description: newInternalDesc,
      category: newInternalCategory,
      isActive: true
    };

    setInternalRegistry(prev => [...prev, newEntry]);
    setNewInternalDesc('');
  };

  const toggleInternalCodeStatus = (id: string) => {
    setInternalRegistry(prev => prev.map(item => 
      item.id === id ? { ...item, isActive: !item.isActive } : item
    ));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-end px-1">
        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
           {['project', 'internal'].map(tab => (
             <button 
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-6 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
             >
               {tab} Codes
             </button>
           ))}
        </div>
      </div>

      {activeTab === 'project' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-8">
              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase text-slate-400 px-1 tracking-widest">Select Portfolio</label>
                    <div className="relative group">
                      <select 
                        value={selectedClientId}
                        onChange={(e) => setSelectedClientId(e.target.value)}
                        className="w-full appearance-none p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all pr-12"
                      >
                        <option value="">Choose a client...</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.name} ({c.prefix})</option>)}
                      </select>
                      <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase text-slate-400 px-1 tracking-widest">Service Line Modality</label>
                    <div className="grid grid-cols-3 gap-2">
                       {serviceLines.map(sl => (
                         <button 
                          key={sl.id}
                          onClick={() => setServiceLineModality(sl.code)}
                          title={sl.name}
                          className={`py-3 px-4 rounded-xl border-2 font-black text-xs transition-all ${
                            serviceLineModality === sl.code
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm' 
                              : 'border-slate-50 hover:border-slate-200 text-slate-400'
                          }`}
                         >
                           {sl.code}
                         </button>
                       ))}
                    </div>
                 </div>
              </div>

              <div className="bg-slate-900 rounded-2xl p-10 text-center space-y-6 relative overflow-hidden group border border-slate-800 shadow-2xl">
                 <div className="absolute inset-0 bg-indigo-600/5 group-hover:bg-indigo-600/10 transition-all duration-700"></div>
                 <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest relative z-10">Target Engagement Code</div>
                 <div className="text-4xl font-black text-white tracking-tighter relative z-10 break-all">{generatedCode}</div>
                 <button 
                    disabled={!selectedClientId}
                    onClick={() => handleCopy(generatedCode)}
                    className="relative z-10 flex items-center justify-center gap-2 mx-auto px-8 py-3.5 bg-indigo-600 text-white font-black uppercase text-xs tracking-widest rounded-xl shadow-xl shadow-indigo-900/50 hover:-translate-y-1 active:scale-95 transition-all disabled:opacity-30 disabled:translate-y-0"
                 >
                    <Copy size={16} />
                    Copy Code
                 </button>
              </div>
           </div>

           <div className="space-y-6">
              <div className="bg-indigo-50/50 rounded-2xl p-8 border border-indigo-100 relative overflow-hidden">
                 <div className="flex items-center gap-3 mb-6">
                    <ShieldCheck className="text-indigo-600" size={20} />
                    <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-900">Standardized Logic</h3>
                 </div>
                 <div className="space-y-5">
                    <p className="text-slate-600 text-sm font-medium leading-relaxed">
                       TimeTrack Pro enforces a strict <span className="text-indigo-600 font-black">[ACRONYM]-[SL]-PRJ-[SEQ]</span> format.
                    </p>
                 </div>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'internal' && (
        <div className="space-y-6">
           <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
              <div className="flex items-center gap-3 mb-8">
                 <Layout className="w-6 h-6 text-indigo-600" />
                 <h3 className="text-xl font-bold text-slate-900 tracking-tight">System Internal Registry</h3>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10 p-8 bg-slate-50 rounded-2xl border border-slate-100">
                 <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase text-slate-400 px-1 tracking-widest">Activity Type</label>
                    <div className="relative">
                      <select 
                        value={newInternalCategory}
                        onChange={(e) => setNewInternalCategory(e.target.value as InternalCode['category'])}
                        className="w-full appearance-none p-4 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all pr-12"
                      >
                        <option value="ADM">ADM (Administrative)</option>
                        <option value="PTO">PTO (Personal Time Off)</option>
                        <option value="L&D">L&D (Learning & Dev)</option>
                        <option value="AL">AL (Annual Leave)</option>
                        <option value="SL">SL (Sick Leave)</option>
                        <option value="CL">CL (Casual Leave)</option>
                      </select>
                      <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                 </div>
                 <div className="space-y-2 lg:col-span-2">
                    <label className="text-[11px] font-black uppercase text-slate-400 px-1 tracking-widest">Activity Description</label>
                    <div className="flex gap-3">
                       <input 
                          value={newInternalDesc}
                          onChange={(e) => setNewInternalDesc(e.target.value)}
                          placeholder="Describe the internal task..." 
                          className="flex-1 p-4 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                       />
                       <button onClick={addInternalCode} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 rounded-xl transition-all shadow-lg flex items-center justify-center">
                          <Plus className="w-6 h-6" />
                       </button>
                    </div>
                 </div>
              </div>

              <div className="space-y-3">
                 {internalRegistry.map(item => (
                    <div key={item.id} className={`flex items-center justify-between p-5 bg-white border rounded-2xl transition-all group ${item.isActive ? 'border-slate-100 hover:border-indigo-100 shadow-sm' : 'border-slate-50 opacity-60 grayscale bg-slate-50/50'}`}>
                       <div className="flex items-center gap-8">
                          <div className={`w-44 py-2.5 rounded-xl flex items-center justify-center border ${item.isActive ? 'bg-slate-100 border-slate-200/50' : 'bg-slate-200 border-slate-300'}`}>
                             <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest">{item.code}</span>
                          </div>
                          <div>
                             <div className={`font-bold text-sm ${item.isActive ? 'text-slate-900' : 'text-slate-500 line-through'}`}>{item.description}</div>
                             <div className="flex items-center gap-2 mt-1.5">
                               <div className={`text-[10px] font-black px-2 py-0.5 rounded-lg border uppercase tracking-widest inline-block ${
                                 item.category === 'ADM' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                 item.category === 'PTO' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                 item.category === 'AL' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                 item.category === 'SL' ? 'bg-red-50 text-red-600 border-red-100' :
                                 item.category === 'CL' ? 'bg-cyan-50 text-cyan-600 border-cyan-100' :
                                 'bg-emerald-50 text-emerald-600 border-emerald-100'
                               }`}>
                                 {item.category}
                               </div>
                               {!item.isActive && (
                                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2 py-0.5 bg-slate-200 rounded-lg">Inactive</span>
                               )}
                             </div>
                          </div>
                       </div>
                       <button 
                        onClick={() => toggleInternalCodeStatus(item.id)} 
                        className={`p-2.5 transition-all rounded-xl border flex items-center gap-2 ${
                          item.isActive 
                            ? 'text-slate-400 hover:text-rose-500 hover:bg-rose-50 border-transparent hover:border-rose-100' 
                            : 'text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 border-emerald-100'
                        }`}
                        title={item.isActive ? 'Set Inactive' : 'Set Active'}
                       >
                          {item.isActive ? <Power size={16} /> : <RefreshCw size={16} />}
                          <span className="text-[10px] font-black uppercase tracking-widest px-1">
                            {item.isActive ? 'Retire' : 'Restore'}
                          </span>
                       </button>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      )}

      {showToast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-10 fade-in duration-500">
          <div className="glass-panel text-slate-900 px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-indigo-100">
            <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
               <CheckCircle2 size={18} className="text-white" />
            </div>
            <span className="font-black uppercase text-[10px] tracking-widest text-indigo-900">Identifier Copied</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CodeGenerator;