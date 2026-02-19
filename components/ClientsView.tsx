import React, { useState, useMemo, useEffect } from 'react';
import { 
  Briefcase, 
  Globe, 
  Mail, 
  Plus, 
  X, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  DollarSign,
  Activity,
  Edit2,
  ExternalLink,
  List,
  Printer,
  CheckCircle,
  Clock,
  Layers,
  UserCheck,
  Tag,
  Calendar,
  ShieldAlert,
  MapPin,
  Factory,
  ChevronDown,
  LayoutGrid,
  Search,
  Receipt
} from 'lucide-react';
import { Client, Project, ClientStatus, ProjectType, Assignment, Employee, ServiceLine, Invoice } from '../types';

interface ClientsViewProps {
  clients: Client[];
  serviceLines: ServiceLine[];
  projects: Project[];
  assignments: Assignment[];
  employees: Employee[];
  invoices: Invoice[];
  onAddClient: (client: Client) => void;
  onAddProject: (project: Project) => void;
  onUpdateProject: (project: Project) => void;
  onApproveCompliance: (clientId: string) => void;
  onUpdateClient: (client: Client) => void;
  onUpdateInvoiceStatus: (id: string, status: Invoice['status']) => void;
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(val);
};

// Deterministic color logic for client identification
export const getClientColorClasses = (clientId: string, isPending: boolean) => {
  if (isPending) return 'bg-amber-500 text-white shadow-amber-100 border-amber-400/20';
  
  const colors = [
    'bg-indigo-600 text-white shadow-indigo-100 border-indigo-500/20',
    'bg-emerald-600 text-white shadow-emerald-100 border-emerald-500/20',
    'bg-rose-600 text-white shadow-rose-100 border-rose-500/20',
    'bg-violet-600 text-white shadow-violet-100 border-violet-500/20',
    'bg-cyan-600 text-white shadow-cyan-100 border-cyan-400/20',
    'bg-blue-600 text-white shadow-blue-100 border-blue-500/20',
    'bg-fuchsia-600 text-white shadow-fuchsia-100 border-fuchsia-500/20',
    'bg-teal-600 text-white shadow-teal-100 border-teal-500/20'
  ];
  
  let hash = 0;
  for (let i = 0; i < clientId.length; i++) {
    hash = clientId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const InvoicePreview: React.FC<{ invoice: Invoice; client: Client }> = ({ invoice, client }) => {
  return (
    <div className="bg-white border-2 border-slate-900 shadow-2xl p-16 max-w-2xl mx-auto font-serif min-h-[900px] flex flex-col animate-in zoom-in-95 duration-500">
       <div className="flex justify-between items-start mb-20">
          <div className="space-y-4">
             <div className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-xl italic tracking-tighter shadow-lg">TTP</div>
             <div className="text-sm font-bold uppercase tracking-widest text-slate-400">TimeTrack Pro Firm</div>
             <div className="text-[10px] text-slate-500 leading-relaxed font-sans font-medium">
                77 Corporate Plaza, Executive Ave.<br />
                Financial District, London<br />
                UK-10022
             </div>
          </div>
          <div className="text-right">
             <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900 mb-2">Invoice</h1>
             <div className="text-lg font-black font-sans text-slate-400">#{invoice.invoiceNo}</div>
          </div>
       </div>

       <div className="grid grid-cols-2 gap-20 mb-20 font-sans">
          <div className="space-y-4">
             <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">Billed To</div>
             <div className="space-y-1">
                <div className="font-black text-slate-900 text-lg">{client.name}</div>
                <div className="text-[11px] text-slate-500 font-medium">
                   {client.contactPerson}<br />
                   {client.location}<br />
                   {client.contactEmail}
                </div>
             </div>
          </div>
          <div className="space-y-4 text-right">
             <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">Protocol Details</div>
             <div className="space-y-2">
                <div className="flex justify-end gap-10">
                   <span className="text-[10px] font-black uppercase text-slate-400">Issue Date</span>
                   <span className="text-xs font-bold text-slate-900">{invoice.date}</span>
                </div>
                <div className="flex justify-end gap-10">
                   <span className="text-[10px] font-black uppercase text-slate-400">Due Date</span>
                   <span className="text-xs font-bold text-slate-900">{invoice.dueDate}</span>
                </div>
             </div>
          </div>
       </div>

       <div className="flex-1 mb-10">
          <table className="w-full font-sans">
             <thead>
                <tr className="border-y border-slate-900 text-[10px] font-black uppercase tracking-widest text-slate-900">
                   <th className="py-4 text-left">Engagement Description</th>
                   <th className="py-4 text-center w-24">Hours</th>
                   <th className="py-4 text-center w-32">Rate</th>
                   <th className="py-4 text-right w-32">Total</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
                {invoice.items.map(item => (
                   <tr key={item.id} className="text-[11px] font-medium text-slate-700">
                      <td className="py-5 font-bold">{item.description}</td>
                      <td className="py-5 text-center">{item.hours}h</td>
                      <td className="py-5 text-center">${item.rate.toFixed(2)}/h</td>
                      <td className="py-5 text-right font-black text-slate-900">${item.amount.toLocaleString()}</td>
                   </tr>
                ))}
             </tbody>
          </table>
       </div>

       <div className="border-t-4 border-slate-900 pt-8 font-sans">
          <div className="flex flex-col items-end space-y-3">
             <div className="flex justify-between w-64 text-sm">
                <span className="font-bold text-slate-400 uppercase tracking-widest text-[10px] mt-1">Subtotal</span>
                <span className="font-bold text-slate-700">${invoice.subtotal.toLocaleString()}</span>
             </div>
             <div className="flex justify-between w-64 text-sm">
                <span className="font-bold text-slate-400 uppercase tracking-widest text-[10px] mt-1">Firm Tax (15%)</span>
                <span className="font-bold text-slate-700">${invoice.tax.toLocaleString()}</span>
             </div>
             <div className="flex justify-between w-64 pt-4 border-t border-slate-100">
                <span className="font-black text-slate-900 uppercase tracking-widest text-xs mt-2">Amount Due</span>
                <span className="text-3xl font-black text-slate-900 tracking-tighter">${invoice.total.toLocaleString()}</span>
             </div>
          </div>
       </div>

       <div className="mt-20 border-t border-slate-100 pt-10 text-[9px] font-medium text-slate-400 text-center uppercase tracking-[0.2em] space-y-4">
          <p>This is a formal billing instrument issued by TimeTrack Pro financial operations.</p>
          <div className="flex justify-center gap-10">
             <span>IBAN: GB99 TTP0 1234 5678 9012 34</span>
             <span>Swift: TTPBGB2L</span>
          </div>
       </div>
    </div>
  );
};

const InvoicePreviewModal: React.FC<{ invoice: Invoice; client: Client; onX: () => void }> = ({ invoice, client, onX }) => {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-8 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto">
       <div className="relative w-full max-w-2xl my-auto">
          <button onClick={onX} className="absolute -top-12 right-0 flex items-center gap-2 text-white font-black uppercase tracking-widest text-[11px] hover:text-indigo-300 transition-all focus:outline-none"><X size={20} /> Close Preview</button>
          <InvoicePreview invoice={invoice} client={client} />
          <div className="flex justify-center gap-4 mt-8">
             <button onClick={() => window.print()} className="px-8 py-3 bg-white text-slate-900 font-black uppercase tracking-widest text-xs rounded-xl flex items-center gap-2 shadow-xl hover:bg-slate-50 transition-all active:scale-95"><Printer size={16} /> Print Document</button>
             <button onClick={onX} className="px-8 py-3 bg-slate-800 text-white font-black uppercase tracking-widest text-xs rounded-xl hover:bg-slate-700 transition-all active:scale-95">Discard Preview</button>
          </div>
       </div>
    </div>
  );
};

const ClientsView: React.FC<ClientsViewProps> = ({ 
  clients, 
  serviceLines,
  projects, 
  assignments,
  employees,
  invoices,
  onAddClient, 
  onAddProject, 
  onUpdateProject,
  onApproveCompliance,
  onUpdateClient,
  onUpdateInvoiceStatus
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'financials' | 'ledger'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [previewingInvoice, setPreviewingInvoice] = useState<Invoice | null>(null);

  // New Client State
  const [newClientName, setNewClientName] = useState('');
  const [newClientLocation, setNewClientLocation] = useState('');
  const [newClientIndustryId, setNewClientIndustryId] = useState('');
  const [newClientNature, setNewClientNature] = useState('');
  
  // New Project State
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectCode, setNewProjectCode] = useState('');
  const [newProjectType, setNewProjectType] = useState<ProjectType>(ProjectType.BILLABLE);
  const [newProjectPM, setNewProjectPM] = useState('');

  useEffect(() => {
    if (selectedClient && showAddProjectModal) {
      if (editingProject) {
        setNewProjectName(editingProject.name);
        setNewProjectCode(editingProject.code);
        setNewProjectType(editingProject.type);
        setNewProjectPM(editingProject.managerId || '');
      } else {
        const clientProjs = projects.filter(p => p.clientId === selectedClient.id);
        const nextSeq = clientProjs.length + 1;
        const seqStr = String(nextSeq).padStart(2, '0');
        
        // Standardization Logic: [ACRONYM]-[Service Line]-PRJ-[Sequence]
        const clientAcronym = selectedClient.prefix.split('-')[0];
        const sl = serviceLines.find(s => s.name === selectedClient.serviceLine);
        const slCode = sl?.code || 'XX';

        const code = `${clientAcronym}-${slCode}-PRJ-${seqStr}`;

        setNewProjectName('');
        setNewProjectCode(code);
        setNewProjectType(ProjectType.BILLABLE);
        setNewProjectPM(employees.find(e => e.role === 'Admin')?.id || '');
      }
    }
  }, [selectedClient, showAddProjectModal, projects, editingProject, employees, serviceLines]);

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    const sl = serviceLines.find(s => s.id === newClientIndustryId);
    
    // Improved Acronym Extraction
    let clientPart = "";
    const parenMatch = newClientName.match(/\(([^)]+)\)/);
    if (parenMatch) {
      clientPart = parenMatch[1].trim().toUpperCase();
    } else {
      const words = newClientName.trim().split(/\s+/);
      if (words.length >= 2) {
         clientPart = words.map(w => w[0].replace(/[^A-Z0-9]/gi, '')).join('').toUpperCase().substring(0, 4);
      } else {
         clientPart = words[0].substring(0, 3).toUpperCase();
      }
    }

    const sequenceNum = clients.length + 1;
    const seqStr = String(sequenceNum).padStart(2, '0');
    const slCode = sl?.code || 'XX';
    
    // REQUIRED FORMAT: [CLIENT]-[SERVICE LINE]-[SEQUENCE]-TEMP
    const finalIdentifier = `${clientPart}-${slCode}-${seqStr}-TEMP`;
    
    const client: Client = {
      id: `C-${Date.now()}`,
      name: newClientName,
      prefix: finalIdentifier,
      serviceLine: sl?.name || 'Advisory',
      location: newClientIndustryId ? (sl?.name || 'Advisory') : (newClientLocation || 'Unspecified'),
      natureOfBusiness: newClientNature || '',
      contactPerson: 'Pending Review',
      contactNo: 'N/A',
      contactEmail: 'pending@compliance.local',
      status: ClientStatus.PENDING,
      sequence: sequenceNum
    };
    onAddClient(client);
    setShowAddModal(false);
    setNewClientName('');
    setNewClientLocation('');
    setNewClientIndustryId('');
    setNewClientNature('');
  };

  const handleSaveProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;
    if (editingProject) {
      onUpdateProject({
        ...editingProject,
        name: newProjectName,
        code: newProjectCode,
        type: newProjectType,
        managerId: newProjectPM || undefined
      });
    } else {
      onAddProject({
        id: `P-${Date.now()}`,
        clientId: selectedClient.id,
        name: newProjectName,
        code: newProjectCode,
        type: newProjectType,
        isActive: true,
        managerId: newProjectPM || undefined
      });
    }
    setShowAddProjectModal(false);
    setEditingProject(null);
  };

  const filteredClients = useMemo(() => {
    return clients.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.prefix.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [clients, searchTerm]);

  const clientInvoices = useMemo(() => {
    if (!selectedClient) return [];
    return invoices.filter(inv => inv.clientId === selectedClient.id);
  }, [selectedClient, invoices]);

  const clientProjects = useMemo(() => {
    if (!selectedClient) return [];
    return projects.filter(p => p.clientId === selectedClient.id);
  }, [selectedClient, projects]);

  const financials = useMemo(() => {
    if (!selectedClient) return { grossWip: 0, hours: 0, billed: 0, received: 0, netUnbilled: 0 };
    
    const clientProjectIds = projects.filter(p => p.clientId === selectedClient.id).map(p => p.id);
    
    const netUnbilledWip = assignments
      .filter(a => clientProjectIds.includes(a.projectId))
      .reduce((acc, curr) => {
        const emp = employees.find(e => e.id === curr.employeeId);
        return acc + (curr.hours * (emp?.chargeRate || 0));
      }, 0);

    const totalBilled = clientInvoices.filter(i => i.status !== 'Cancelled').reduce((s, i) => s + i.subtotal, 0);
    const totalReceived = clientInvoices.filter(i => i.status === 'Paid').reduce((s, i) => s + i.total, 0);

    return { 
      grossWip: netUnbilledWip + totalBilled, 
      netUnbilled: netUnbilledWip,
      billed: totalBilled, 
      received: totalReceived 
    };
  }, [selectedClient, projects, assignments, employees, clientInvoices]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between px-1">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Clients & Projects</h1>
          <p className="text-sm text-slate-500 font-medium">Oversee the lifecycle of your client relationships and project codes.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
             <button onClick={() => setViewMode('table')} className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-brand/10 text-brand shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><List size={18} /></button>
             <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-brand/10 text-brand shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><LayoutGrid size={18} /></button>
          </div>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-brand text-white rounded-lg text-sm font-bold shadow-lg shadow-brand/20 hover:brightness-110 transition-all active:scale-95"><Plus size={18} /> Onboard New Client</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 bg-slate-50/30 flex items-center gap-4">
             <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-lg border border-slate-200 max-w-sm w-full shadow-sm focus-within:ring-2 focus-within:ring-brand/10 transition-all">
                <Search size={14} className="text-slate-400" />
                <input type="text" placeholder="Search by client name or identifier..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-transparent border-none outline-none text-xs w-full text-slate-600 font-medium focus:ring-0" />
             </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <th className="p-4 text-left border-r border-slate-200/50">Client Portfolio</th>
                  <th className="p-4 text-left border-r border-slate-200/50">Service Line & Location</th>
                  <th className="p-4 text-center border-r border-slate-200/50">Compliance Status</th>
                  <th className="p-4 text-right border-r border-slate-200/50">Total Billed ($)</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClients.map(client => {
                  const isPending = client.status === ClientStatus.PENDING;
                  const billedVal = invoices.filter(inv => inv.clientId === client.id && inv.status !== 'Cancelled').reduce((s, i) => s + i.total, 0);
                  const acronym = client.prefix.split('-')[0];
                  const colorClasses = getClientColorClasses(client.id, isPending);
                  
                  return (
                    <tr key={client.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 border-r border-slate-200/50">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-[10px] shadow-sm transition-all group-hover:scale-105 border ${colorClasses}`}>
                            {acronym}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-sm text-slate-900 truncate group-hover:text-brand transition-colors">{client.name}</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{client.prefix}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 border-r border-slate-200/50">
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-slate-700">{client.serviceLine}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{client.location}</span>
                        </div>
                      </td>
                      <td className="p-4 border-r border-slate-200/50 text-center">
                         <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${isPending ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>{isPending ? 'Pending' : 'Active'}</span>
                      </td>
                      <td className="p-4 border-r border-slate-200/50 text-right">
                         <span className="font-black text-slate-900 text-sm">{formatCurrency(billedVal)}</span>
                      </td>
                      <td className="p-4 text-center">
                        <button onClick={() => { setSelectedClient(client); setActiveTab('overview'); }} className="p-2.5 bg-white text-slate-400 rounded-xl border border-slate-200 hover:border-brand hover:text-brand shadow-sm transition-all"><ExternalLink size={14} /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
      </div>

      {selectedClient && (
        <div className="fixed inset-0 z-[70] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setSelectedClient(null)}></div>
          <div className="relative w-full max-w-2xl bg-[#F8FAFC] h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 border-l border-slate-200">
             
             <div className="p-10 bg-[#0F172A] text-white flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-8">
                   <div className={`w-16 h-16 rounded-3xl flex items-center justify-center font-black text-xl shadow-2xl border ${getClientColorClasses(selectedClient.id, selectedClient.status === ClientStatus.PENDING)}`}>
                     {selectedClient.prefix.split('-')[0]}
                   </div>
                   <div>
                      <h2 className="text-3xl font-bold tracking-tight leading-none">{selectedClient.name}</h2>
                      <div className="flex items-center gap-4 mt-4">
                         <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border ${selectedClient.status === ClientStatus.PENDING ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>{selectedClient.status}</span>
                         <span className="text-slate-500 text-[11px] font-black uppercase tracking-widest border-l border-slate-700 pl-4">ID: {selectedClient.prefix}</span>
                      </div>
                   </div>
                </div>
                <button onClick={() => setSelectedClient(null)} className="p-3 hover:bg-white/10 rounded-full transition-colors"><X size={28} /></button>
             </div>

             <div className="flex bg-white border-b border-slate-200 px-10">
                {['overview', 'projects', 'financials', 'ledger'].map((tab) => (
                  <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-8 py-6 text-[11px] font-black uppercase tracking-widest transition-all relative ${activeTab === tab ? 'text-brand' : 'text-slate-400 hover:text-slate-600'}`}>
                    {tab}
                    {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-brand rounded-t-full"></div>}
                  </button>
                ))}
             </div>

             <div className="flex-1 overflow-y-auto p-10 space-y-10">
                {activeTab === 'overview' && (
                  <div className="space-y-10 animate-in fade-in duration-300">
                    {selectedClient.status === ClientStatus.PENDING && (
                      <div className="p-8 bg-amber-50 border border-amber-200 rounded-[2.5rem] flex items-center justify-between shadow-sm">
                         <div className="flex items-center gap-6">
                            <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center shadow-inner">
                               <ShieldAlert size={28} />
                            </div>
                            <div>
                               <h4 className="text-lg font-black text-amber-900 tracking-tight">Compliance Clearance Required</h4>
                               <p className="text-xs text-amber-700 font-medium uppercase tracking-widest mt-1">Temporary Code: {selectedClient.prefix}</p>
                            </div>
                         </div>
                         <button 
                          onClick={() => onApproveCompliance(selectedClient.id)}
                          className="px-8 py-4 bg-amber-600 text-white font-black uppercase text-[11px] tracking-widest rounded-2xl shadow-lg hover:bg-amber-700 transition-all active:scale-95 flex items-center gap-2"
                         >
                           <CheckCircle size={18} /> Clear Compliance
                         </button>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-10">
                       <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Briefcase size={14} className="text-brand" /> Service Line</div>
                          <div className="font-bold text-slate-900 text-lg">{selectedClient.serviceLine}</div>
                       </div>
                       <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><MapPin size={14} className="text-brand" /> Location</div>
                          <div className="font-bold text-slate-900 text-lg">{selectedClient.location}</div>
                       </div>
                    </div>
                 </div>
                )}

                {activeTab === 'projects' && (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between px-2">
                       <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><Layers size={16} /> Active Engagements</h4>
                       <button onClick={() => { setEditingProject(null); setShowAddProjectModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-lg shadow-brand/20">
                         <Plus size={14} /> New Project
                       </button>
                    </div>
                    <div className="space-y-4">
                       {clientProjects.length > 0 ? clientProjects.map(proj => (
                         <div key={proj.id} className="p-6 bg-white border border-slate-200 rounded-[1.5rem] hover:border-brand/30 hover:shadow-xl transition-all group flex items-center justify-between">
                            <div className="flex items-center gap-6">
                               <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm ${proj.type === ProjectType.BILLABLE ? 'bg-brand/5 border-brand/20 text-brand' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                                  <Briefcase size={20} />
                               </div>
                               <div>
                                  <div className="flex items-center gap-3">
                                     <span className="text-[11px] font-black text-brand uppercase tracking-widest font-mono">{proj.code}</span>
                                     <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${proj.type === ProjectType.BILLABLE ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>{proj.type}</span>
                                  </div>
                                  <div className="text-lg font-bold text-slate-900 mt-1">{proj.name}</div>
                               </div>
                            </div>
                            <div className="flex items-center gap-4">
                               <button onClick={() => { setEditingProject(proj); setShowAddProjectModal(true); }} className="p-3 bg-slate-50 text-slate-400 hover:text-brand rounded-xl transition-all border border-slate-100">
                                <Edit2 size={16} />
                               </button>
                            </div>
                         </div>
                       )) : (
                         <div className="p-20 text-center border-2 border-dashed border-slate-200 rounded-[3rem] text-slate-300 font-bold italic text-base">No engagement codes created.</div>
                       )}
                    </div>
                  </div>
                )}
             </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 ring-1 ring-black/5 flex flex-col animate-in zoom-in-95 duration-200">
              <div className="p-8 bg-slate-950 text-white flex justify-between items-start">
                 <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-brand/20 text-brand rounded-2xl flex items-center justify-center border border-brand/30 shadow-lg"><Briefcase size={24} /></div>
                   <div>
                     <h2 className="text-2xl font-bold tracking-tight">Onboard New Account</h2>
                     <p className="text-slate-400 text-[10px] mt-1 font-black uppercase tracking-widest">Compliance Status: Initiation</p>
                   </div>
                 </div>
                 <button onClick={() => setShowAddModal(false)} className="hover:bg-white/10 p-2 rounded-full transition-colors"><X size={24} /></button>
              </div>
              
              <form onSubmit={handleCreateClient} className="p-10 space-y-8 bg-white">
                  <div className="space-y-6">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black uppercase text-slate-400 px-1 tracking-widest">Legal Business Identity</label>
                       <input required value={newClientName} onChange={(e) => setNewClientName(e.target.value)} placeholder="e.g. Jersey Solution Limited (JSL)" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-brand/10 focus:border-brand outline-none transition-all" />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-slate-400 px-1 tracking-widest flex items-center gap-2"><Globe size={12} /> Location</label>
                          <input required value={newClientLocation} onChange={(e) => setNewClientLocation(e.target.value)} placeholder="e.g. Dubai, UAE" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none" />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-slate-400 px-1 tracking-widest flex items-center gap-2"><Factory size={12} /> Service Line</label>
                          <div className="relative">
                            <select required value={newClientIndustryId} onChange={(e) => setNewClientIndustryId(e.target.value)} className="w-full appearance-none p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none pr-10">
                               <option value="">Select Service Line...</option>
                               {serviceLines.map(sl => <option key={sl.id} value={sl.id}>{sl.name}</option>)}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                          </div>
                       </div>
                    </div>
                  </div>

                  <div className="p-6 bg-amber-50 border border-amber-100 rounded-[1.5rem] flex items-start gap-4">
                     <ShieldAlert className="text-amber-600 mt-1" size={20} />
                     <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
                        Compliance Requirement: New accounts are assigned a <span className="font-black">TEMP CODE</span> ([CLIENT]-[LINE]-[SEQ]-TEMP). Billing is restricted until compliance clearance is manually approved.
                     </p>
                  </div>

                  <button type="submit" className="w-full py-5 bg-brand text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-brand/20 hover:brightness-110 transition-all active:scale-[0.98]">
                    Generate Temporary Account Identifier
                  </button>
              </form>
           </div>
        </div>
      )}

      {showAddProjectModal && selectedClient && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
              <div className="p-6 bg-slate-950 text-white flex justify-between items-center">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-brand/20 text-brand rounded-xl flex items-center justify-center border border-brand/30">{editingProject ? <Edit2 size={20} /> : <Plus size={20} />}</div>
                    <div>
                      <h2 className="text-xl font-bold tracking-tight">{editingProject ? 'Edit Engagement' : 'Create Engagement'}</h2>
                      <p className="text-brand text-[10px] font-black uppercase tracking-widest mt-0.5">Project Registry v4.0</p>
                    </div>
                 </div>
                 <button onClick={() => { setShowAddProjectModal(false); setEditingProject(null); }} className="p-2 hover:bg-white/10 rounded-full transition-all"><X size={20} /></button>
              </div>
              <form onSubmit={handleSaveProject} className="p-10 space-y-6 bg-white">
                  <div className="space-y-1.5"><label className="text-[10px] font-black uppercase text-slate-400 px-1 tracking-widest">Legal Engagement Name</label><div className="relative"><input required value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} placeholder="e.g. Q1 Regulatory Audit" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-brand outline-none transition-all pl-12" /><Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} /></div></div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1.5"><label className="text-[10px] font-black uppercase text-slate-400 px-1 tracking-widest">System Identifier</label><div className="relative"><input required value={newProjectCode} onChange={(e) => setNewProjectCode(e.target.value)} className="w-full p-4 bg-slate-100 border border-slate-200 rounded-2xl text-sm font-black text-brand focus:ring-2 focus:ring-brand outline-none transition-all pl-12" /><Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-brand" size={18} /></div></div>
                    <div className="space-y-1.5"><label className="text-[10px] font-black uppercase text-slate-400 px-1 tracking-widest">Billing Class</label><div className="relative"><select value={newProjectType} onChange={(e) => setNewProjectType(e.target.value as ProjectType)} className="w-full appearance-none p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-brand outline-none transition-all pr-10"><option value={ProjectType.BILLABLE}>Billable</option><option value={ProjectType.NON_BILLABLE}>Non-Billable</option><option value={ProjectType.INTERNAL}>Internal</option></select><ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} /></div></div>
                  </div>
                  <button type="submit" className="w-full py-5 bg-brand text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-brand/20 hover:brightness-110 transition-all active:scale-[0.98] mt-4">{editingProject ? 'Update Engagement' : 'Initialize Engagement'}</button>
              </form>
           </div>
        </div>
      )}

      {previewingInvoice && selectedClient && (
        <InvoicePreviewModal 
          invoice={previewingInvoice} 
          client={selectedClient} 
          onX={() => setPreviewingInvoice(null)} 
        />
      )}
    </div>
  );
};

export default ClientsView;