import React, { useState, useMemo, useEffect } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Search, 
  Clock, 
  Briefcase, 
  X, 
  ChevronRight, 
  Activity, 
  Receipt, 
  List, 
  LayoutGrid, 
  CalendarDays, 
  CalendarRange, 
  Edit3, 
  RotateCcw, 
  Plus, 
  Trash2,
  AlertTriangle,
  ArrowDown,
  Scale,
  Lock,
  CheckCircle2,
  Percent,
  RefreshCw
} from 'lucide-react';
import { Client, Project, Assignment, Employee, ProjectType, InternalCode, Invoice, InvoiceLineItem, ClientStatus } from '../types';
import { getClientColorClasses } from './ClientsView';

interface WIPLedgerProps {
  clients: Client[];
  projects: Project[];
  assignments: Assignment[];
  employees: Employee[];
  internalRegistry: InternalCode[];
  onCreateInvoice: (invoice: Invoice, consumptionMap: Record<string, number>) => void;
}

// Extended type for the builder to track available WIP
interface DraftLineItem extends InvoiceLineItem {
  maxHours: number;
  maxAmount: number;
  isManual: boolean;
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(val);
};

const ClientPrefixBadge: React.FC<{ client: Client; size?: string }> = ({ client, size = "w-10 h-10" }) => {
  const acronym = client.prefix.split('-')[0];
  const colorClasses = getClientColorClasses(client.id, client.status === ClientStatus.PENDING);
  
  return (
    <div className={`${size} rounded-2xl flex items-center justify-center font-black shadow-lg border transition-transform hover:scale-105 ${colorClasses}`}>
      <span className={size.includes('w-14') || size.includes('w-16') ? 'text-lg' : 'text-[10px]'}>{acronym}</span>
    </div>
  );
};

const WIPLedger: React.FC<WIPLedgerProps> = ({ clients, projects, assignments, employees, internalRegistry, onCreateInvoice }) => {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [minWipFilter, setMinWipFilter] = useState<number>(0);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [showInvoiceBuilder, setShowInvoiceBuilder] = useState(false);

  // Selection state for projects within a client
  const [selectedProjectsForInvoice, setSelectedProjectsForInvoice] = useState<Set<string>>(new Set());

  // Invoice Builder State
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceDue, setInvoiceDue] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [billingCutoffDate, setBillingCutoffDate] = useState('2026-12-31');
  const [taxRate, setTaxRate] = useState(15); 
  const [recoveryRate, setRecoveryRate] = useState(0); // Hourly recovery rate
  
  // Local state for manually editable line items
  const [draftLineItems, setDraftLineItems] = useState<DraftLineItem[]>([]);

  // Clear project selection when changing clients
  useEffect(() => {
    setSelectedProjectsForInvoice(new Set());
    setRecoveryRate(0);
  }, [selectedClientId]);

  const toggleProjectSelection = (pId: string) => {
    setSelectedProjectsForInvoice(prev => {
      const next = new Set(prev);
      if (next.has(pId)) next.delete(pId);
      else next.add(pId);
      return next;
    });
  };

  const ledgerData = useMemo(() => {
    return clients.map(client => {
      const clientProjects = projects.filter(p => p.clientId === client.id);
      const isInternalClient = client.id === 'C3';
      
      const wipItems = assignments.filter(a => {
        const isClientProject = clientProjects.some(cp => cp.id === a.projectId);
        const isClientInternal = isInternalClient && internalRegistry.some(ir => ir.id === a.projectId);
        return isClientProject || isClientInternal;
      });
      
      const totalHours = wipItems.reduce((acc, curr) => acc + curr.hours, 0);
      const totalValue = wipItems.reduce((acc, curr) => {
        const emp = employees.find(e => e.id === curr.employeeId);
        const proj = projects.find(p => p.id === curr.projectId);
        if (proj?.type !== ProjectType.BILLABLE) return acc;
        return acc + (curr.hours * (emp?.chargeRate || 0));
      }, 0);

      let agingDays = 0;
      if (wipItems.length > 0) {
        const latestDate = new Date(Math.max(...wipItems.map(a => new Date(a.date).getTime())));
        const today = new Date('2026-06-01');
        agingDays = Math.floor((today.getTime() - latestDate.getTime()) / (1000 * 60 * 60 * 24));
      }

      return {
        ...client,
        totalHours,
        totalValue,
        projectCount: clientProjects.length + (isInternalClient ? internalRegistry.length : 0),
        agingDays: Math.max(0, agingDays),
        rawWipItems: wipItems
      };
    }).filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.prefix.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesMinWip = item.totalValue >= minWipFilter;
      return (item.totalHours > 0 || item.totalValue > 0) && matchesSearch && matchesMinWip;
    });
  }, [clients, projects, assignments, employees, internalRegistry, searchTerm, minWipFilter]);

  const grandTotal = ledgerData.reduce((acc, curr) => acc + curr.totalValue, 0);
  const selectedItem = useMemo(() => ledgerData.find(item => item.id === selectedClientId), [ledgerData, selectedClientId]);

  // Sync draft line items whenever project selection or cutoff changes
  useEffect(() => {
    if (!selectedItem || !showInvoiceBuilder) return;

    const newDrafts: DraftLineItem[] = [];
    
    projects.filter(p => p.clientId === selectedItem.id && selectedProjectsForInvoice.has(p.id)).forEach(proj => {
      const projAsgn = selectedItem.rawWipItems.filter(a => a.projectId === proj.id && a.date <= billingCutoffDate);
      
      const hours = projAsgn.reduce((sum, a) => sum + a.hours, 0);
      const value = projAsgn.reduce((sum, a) => {
        const emp = employees.find(e => e.id === a.employeeId);
        return sum + (a.hours * (emp?.chargeRate || 0));
      }, 0);

      const existingIndex = draftLineItems.findIndex(i => i.projectId === proj.id);
      
      if (existingIndex !== -1) {
         const existing = draftLineItems[existingIndex];
         newDrafts.push({
           ...existing,
           maxHours: hours,
           maxAmount: value,
           hours: Math.min(numericClamp(existing.hours), hours),
           amount: Math.min(numericClamp(existing.amount), value)
         });
      } else {
         newDrafts.push({
           id: `LI-${proj.id}-${Date.now()}`,
           projectId: proj.id,
           description: `${proj.name} - Professional Services`,
           hours,
           rate: hours > 0 ? value / hours : (employees.find(e => e.role === 'Admin')?.chargeRate || 200),
           amount: value,
           maxHours: hours,
           maxAmount: value,
           isManual: false
         });
      }
    });

    draftLineItems.filter(i => i.isManual).forEach(manual => {
       newDrafts.push(manual);
    });
    
    setDraftLineItems(newDrafts);
  }, [selectedItem, projects, billingCutoffDate, selectedProjectsForInvoice, showInvoiceBuilder]);

  const numericClamp = (val: any) => parseFloat(val) || 0;

  const builderTotals = useMemo(() => {
    const totalHours = draftLineItems.reduce((s, i) => s + i.hours, 0);
    const recoveryAmount = totalHours * recoveryRate;
    const subtotal = draftLineItems.reduce((s, i) => s + i.amount, 0) + recoveryAmount;
    const tax = subtotal * (taxRate / 100);
    return { totalHours, recoveryAmount, subtotal, tax, total: subtotal + tax };
  }, [draftLineItems, taxRate, recoveryRate]);

  const updateLineItem = (id: string, field: 'hours' | 'amount' | 'description', value: string) => {
    setDraftLineItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const nextItem = { ...item };
      if (field === 'description') {
        nextItem.description = value;
      } else {
        const numericVal = Math.max(0, parseFloat(value) || 0);
        if (!item.isManual) {
          if (field === 'hours') {
            const clampedHours = Math.min(numericVal, item.maxHours);
            nextItem.hours = clampedHours;
            nextItem.amount = clampedHours * item.rate;
          }
        } else {
          if (field === 'hours') nextItem.hours = numericVal;
          if (field === 'amount') nextItem.amount = numericVal;
        }
      }
      return nextItem;
    }));
  };

  const removeLineItem = (id: string) => {
    const item = draftLineItems.find(i => i.id === id);
    setDraftLineItems(prev => prev.filter(i => i.id !== id));
    if (item && !item.isManual) {
       const next = new Set(selectedProjectsForInvoice);
       next.delete(item.projectId);
       setSelectedProjectsForInvoice(next);
    }
  };

  const handleGenerateInvoice = () => {
    if (!selectedItem) return;

    // Identify all unique projects present in the draft
    const uniqueProjectIdsInDraft = Array.from(new Set(draftLineItems.map(item => item.projectId)));

    uniqueProjectIdsInDraft.forEach((projId, index) => {
      const projectSpecificItems = draftLineItems.filter(item => item.projectId === projId);
      if (projectSpecificItems.length === 0) return;

      // Add recovery fee as a separate line item if rate is set
      if (recoveryRate > 0) {
        const projHours = projectSpecificItems.reduce((s, i) => s + i.hours, 0);
        projectSpecificItems.push({
          id: `REC-${projId}-${Date.now()}`,
          projectId: projId,
          description: `Hourly Recovery Adjustment (${formatCurrency(recoveryRate)}/hr)`,
          hours: projHours,
          rate: recoveryRate,
          amount: projHours * recoveryRate,
          maxHours: 0,
          maxAmount: 0,
          isManual: true
        } as any);
      }

      const subtotal = projectSpecificItems.reduce((s, i) => s + i.amount, 0);
      const tax = subtotal * (taxRate / 100);
      const total = subtotal + tax;
      
      const consumptionMap: Record<string, number> = {};
      const billedAssignmentIds: string[] = [];
      
      projectSpecificItems.forEach(item => {
        if (!item.isManual) {
          const sortedAsgn = [...selectedItem.rawWipItems]
            .filter(a => a.projectId === item.projectId && a.date <= billingCutoffDate)
            .sort((a, b) => a.date.localeCompare(b.date));
          
          let remainingToBill = item.hours;
          for (const asgn of sortedAsgn) {
            if (remainingToBill <= 0) break;
            const amountToTake = Math.min(asgn.hours, remainingToBill);
            consumptionMap[asgn.id] = amountToTake;
            billedAssignmentIds.push(asgn.id);
            remainingToBill -= amountToTake;
          }
        }
      });

      // Generate a unique invoice number for this specific project
      const nextInvoiceNumber = `${selectedItem.prefix}-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}-${index + 1}`;
      
      const newInvoice: Invoice = {
        id: `INV-${Date.now()}-${projId}`,
        invoiceNo: nextInvoiceNumber,
        clientId: selectedItem.id,
        date: invoiceDate,
        dueDate: invoiceDue,
        items: projectSpecificItems.map(({ maxHours, maxAmount, isManual, ...rest }) => ({ ...rest })), 
        subtotal,
        tax,
        total,
        status: 'Draft',
        statusHistory: [],
        billedAssignmentIds: billedAssignmentIds
      };

      onCreateInvoice(newInvoice, consumptionMap);
    });

    setShowInvoiceBuilder(false);
    setSelectedClientId(null);
    setDraftLineItems([]);
    setSelectedProjectsForInvoice(new Set());
    setRecoveryRate(0);
  };

  const getAgingLabel = (days: number) => {
    if (days < 7) return { label: 'Recent', class: 'bg-emerald-50 text-emerald-600 border-emerald-100' };
    if (days < 14) return { label: '1 Week', class: 'bg-brand/5 text-brand border-brand/20' };
    if (days < 30) return { label: '2-4 Weeks', class: 'bg-amber-50 text-amber-600 border-amber-100' };
    return { label: 'Critical (>30d)', class: 'bg-rose-50 text-rose-600 border-rose-100 font-black' };
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-1">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Work-in-Progress Ledger</h1>
          <p className="text-sm text-slate-500 font-medium">Manage and bill accrued effort across client portfolios.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-slate-950 px-6 py-4 rounded-2xl shadow-xl border border-slate-800 flex items-center gap-5">
             <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center shadow-lg shadow-brand/20">
                <TrendingUp className="w-5 h-5 text-white" />
             </div>
             <div>
                <div className="text-[9px] font-black uppercase tracking-widest text-indigo-400">Total Unbilled</div>
                <div className="text-2xl font-black text-white tracking-tight">{formatCurrency(grandTotal)}</div>
             </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[1.5rem] border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between gap-4">
           <div className="flex items-center gap-4 flex-1">
              <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-lg border border-slate-200 max-w-sm w-full shadow-sm focus-within:ring-2 focus-within:ring-brand/10 transition-all">
                <Search size={14} className="text-slate-400" />
                <input type="text" placeholder="Filter portfolio..." className="bg-transparent border-none outline-none text-xs w-full text-slate-600 font-medium focus:ring-0" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                 <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-brand/10 text-brand shadow-sm' : 'text-slate-400 hover:text-slate-600'}`} title="Table View"><List size={16} /></button>
                 <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-brand/10 text-brand shadow-sm' : 'text-slate-400 hover:text-slate-600'}`} title="Grid View"><LayoutGrid size={16} /></button>
              </div>
           </div>
        </div>

        {viewMode === 'table' ? (
          <div className="overflow-x-auto">
             <table className="w-full border-collapse">
                <thead>
                   <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <th className="p-4 text-left border-r border-slate-200/50">Engagement Portfolio</th>
                      <th className="p-4 text-center border-r border-slate-200/50">WIP Hours</th>
                      <th className="p-4 text-right border-r border-slate-200/50">WIP Value</th>
                      <th className="p-4 text-center border-r border-slate-200/50">Aging</th>
                      <th className="p-4 text-center">Action</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {ledgerData.map(item => {
                     const aging = getAgingLabel(item.agingDays);
                     return (
                      <tr key={item.id} className="group hover:bg-brand/5 transition-colors cursor-pointer" onClick={() => setSelectedClientId(item.id)}>
                          <td className="p-4 border-r border-slate-200/50">
                            <div className="flex items-center gap-4">
                                <ClientPrefixBadge client={item} size="w-10 h-10" />
                                <div className="min-w-0">
                                  <div className="font-bold text-sm text-slate-900 truncate group-hover:text-brand transition-colors">{item.name}</div>
                                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{item.projectCount} Streams</div>
                                </div>
                            </div>
                          </td>
                          <td className="p-4 text-center border-r border-slate-200/50 font-bold text-slate-600">
                             {item.totalHours.toFixed(2)}h
                          </td>
                          <td className="p-4 text-right border-r border-slate-200/50 font-black text-slate-900">
                             {formatCurrency(item.totalValue)}
                          </td>
                          <td className="p-4 text-center border-r border-slate-200/50">
                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${aging.class}`}>
                                {aging.label}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <button className="p-2 bg-white text-slate-400 rounded-xl border border-slate-200 hover:border-brand hover:text-brand shadow-sm transition-all">
                                <ChevronRight size={16} />
                            </button>
                          </td>
                      </tr>
                     );
                   })}
                </tbody>
             </table>
          </div>
        ) : (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in zoom-in-95 duration-300">
             {ledgerData.map(item => {
               const aging = getAgingLabel(item.agingDays);
               return (
                <div 
                  key={item.id} 
                  onClick={() => setSelectedClientId(item.id)} 
                  className="bg-white rounded-[2rem] p-7 border border-slate-200 shadow-sm hover:shadow-xl hover:border-brand transition-all group cursor-pointer flex flex-col"
                >
                   <div className="flex justify-between items-start mb-6">
                      <ClientPrefixBadge client={item} size="w-14 h-14" />
                      <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${aging.class}`}>
                        {aging.label}
                      </span>
                   </div>

                   <h3 className="text-[17px] font-black text-slate-900 group-hover:text-brand transition-colors mb-6 leading-snug">{item.name}</h3>
                   
                   <div className="bg-slate-50/70 p-6 rounded-[1.25rem] border border-slate-100 mb-8 shadow-inner">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Unbilled WIP Value</div>
                      <div className="text-3xl font-black text-slate-900 tracking-tighter group-hover:text-brand transition-colors leading-none">
                        {formatCurrency(item.totalValue)}
                      </div>
                   </div>

                   <div className="mt-auto pt-5 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-400">
                         <Clock size={14} />
                         <span className="text-xs font-bold">{item.totalHours.toFixed(2)}h Logged</span>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-brand group-hover:text-white transition-all shadow-sm">
                         <ChevronRight size={20} />
                      </div>
                   </div>
                </div>
               );
             })}
          </div>
        )}
      </div>

      {/* Selected Client WIP Detail & Project Selection Sidepanel */}
      {selectedItem && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => { setSelectedClientId(null); setShowInvoiceBuilder(false); }}></div>
          <div className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 border-l border-slate-200">
             
             <div className="p-8 bg-slate-950 text-white flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-6">
                   <ClientPrefixBadge client={selectedItem} size="w-16 h-16" />
                   <div>
                      <h2 className="text-2xl font-black tracking-tight leading-none uppercase">{selectedItem.name}</h2>
                      <div className="text-[10px] font-black text-brand uppercase tracking-widest mt-4 flex items-center gap-2">
                         <Activity size={14} /> Transactional Portfolio Review
                      </div>
                   </div>
                </div>
                <button onClick={() => { setSelectedClientId(null); setShowInvoiceBuilder(false); }} className="p-3 hover:bg-white/10 rounded-full transition-colors text-white/40 hover:text-white"><X size={28}/></button>
             </div>
             
             {!showInvoiceBuilder ? (
               <>
                 <div className="flex-1 overflow-y-auto p-10 space-y-10 bg-[#F8FAFC]">
                    <div className="grid grid-cols-2 gap-6">
                       <div className="bg-white p-7 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col justify-center">
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                             <DollarSign size={12} className="text-emerald-500" /> WIP Value
                          </div>
                          <div className="text-3xl font-black text-brand tracking-tighter">{formatCurrency(selectedItem.totalValue)}</div>
                       </div>
                       <div className="bg-white p-7 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col justify-center">
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                             <Clock size={12} className="text-indigo-500" /> Recorded Time
                          </div>
                          <div className="text-3xl font-black text-slate-900 tracking-tighter">{selectedItem.totalHours.toFixed(2)}h</div>
                       </div>
                    </div>

                    <div className="space-y-6">
                       <div className="flex justify-between items-center px-2">
                          <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-3">
                             <Briefcase size={16} /> Engagement Line Items
                          </h3>
                          <div className="text-[9px] font-black text-brand uppercase">Select for Invoicing</div>
                       </div>
                       
                       <div className="space-y-4">
                          {projects.filter(p => p.clientId === selectedItem.id).map((proj, idx) => {
                            const projAsgn = selectedItem.rawWipItems.filter(a => a.projectId === proj.id);
                            const projHours = projAsgn.reduce((sum, a) => sum + a.hours, 0);
                            const projVal = projAsgn.reduce((sum, a) => {
                              if (proj.type !== ProjectType.BILLABLE) return sum;
                              const emp = employees.find(e => e.id === a.employeeId);
                              return sum + (a.hours * (emp?.chargeRate || 0));
                            }, 0);
                            
                            if (projHours === 0) return null;
                            const isSelected = selectedProjectsForInvoice.has(proj.id);

                            return (
                              <div 
                                key={proj.id} 
                                onClick={() => toggleProjectSelection(proj.id)}
                                className={`p-6 border rounded-[1.5rem] transition-all cursor-pointer group/proj relative overflow-hidden ${
                                  isSelected 
                                  ? 'bg-white border-brand ring-2 ring-brand/20 shadow-xl' 
                                  : 'bg-white border-slate-200 hover:border-brand/30 shadow-sm'
                                }`}
                              >
                                 {isSelected && (
                                   <div className="absolute top-0 right-0 w-16 h-16 -mr-8 -mt-8 bg-brand rotate-45 flex items-end justify-center pb-1">
                                      <CheckCircle2 size={12} className="text-white -rotate-45" />
                                   </div>
                                 )}
                                 
                                 <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-5">
                                       <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-[10px] border shadow-sm transition-colors ${
                                          isSelected ? 'bg-brand text-white border-brand/50' : 'bg-slate-50 border-slate-100 text-slate-400'
                                       }`}>
                                          {String(idx + 1).padStart(2, '0')}
                                       </div>
                                       <div>
                                          <div className={`text-[10px] font-black uppercase tracking-widest transition-colors ${
                                            isSelected ? 'text-brand' : 'text-slate-400'
                                          }`}>
                                            {proj.code}
                                          </div>
                                          <div className="text-base font-bold text-slate-900 mt-0.5">{proj.name}</div>
                                       </div>
                                    </div>
                                    <div className="text-right">
                                       <div className="text-xl font-black text-slate-900 tracking-tight">{formatCurrency(projVal)}</div>
                                       <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{projHours.toFixed(2)} Hours</div>
                                    </div>
                                 </div>
                              </div>
                            );
                          })}
                       </div>
                    </div>
                 </div>

                 <div className="p-8 border-t border-slate-100 bg-white space-y-4">
                    {selectedProjectsForInvoice.size > 0 && (
                       <div className="p-4 bg-brand/5 border border-brand/10 rounded-2xl flex items-center justify-between">
                          <span className="text-[10px] font-black text-brand uppercase tracking-widest">
                            Ready to document {selectedProjectsForInvoice.size} engagement{selectedProjectsForInvoice.size > 1 ? 's' : ''}
                          </span>
                          <button onClick={() => setSelectedProjectsForInvoice(new Set())} className="text-[10px] font-black text-slate-400 uppercase hover:text-rose-500 transition-colors">Clear</button>
                       </div>
                    )}
                    <button 
                      disabled={selectedProjectsForInvoice.size === 0}
                      onClick={() => setShowInvoiceBuilder(true)}
                      className="w-full py-5 text-white font-black bg-brand rounded-2xl hover:brightness-110 transition-all text-base shadow-xl shadow-brand/20 flex items-center justify-center gap-3 active:scale-[0.99] disabled:opacity-50 disabled:grayscale"
                    >
                       <Receipt size={24} /> 
                       {selectedProjectsForInvoice.size === 0 
                         ? 'Select Projects to Invoice' 
                         : `Draft Invoices for ${selectedProjectsForInvoice.size} Engagement${selectedProjectsForInvoice.size > 1 ? 's' : ''}`}
                    </button>
                 </div>
               </>
             ) : (
               <>
                 <div className="flex-1 overflow-y-auto p-10 space-y-10 bg-white">
                    <div className="flex items-center justify-between text-brand mb-2">
                       <div className="flex items-center gap-3">
                          <CalendarRange size={20} />
                          <h3 className="text-[13px] font-black uppercase tracking-widest">Billing Engine Configuration</h3>
                       </div>
                       <div className="px-3 py-1.5 bg-brand/5 text-brand rounded-lg text-[9px] font-black uppercase tracking-widest border border-brand/20">
                          Creating {selectedProjectsForInvoice.size} Separate Invoices
                       </div>
                    </div>

                    <div className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-6 shadow-inner">
                       <div className="space-y-1.5">
                          <label className="text-[9px] font-black uppercase text-brand px-1 tracking-widest flex items-center gap-2">
                            <CalendarDays size={12} /> Work Snap-shot Date
                          </label>
                          <input type="date" value={billingCutoffDate} onChange={e => setBillingCutoffDate(e.target.value)} className="w-full p-3 bg-white border border-brand/20 rounded-xl text-sm font-black text-brand outline-none focus:ring-4 focus:ring-brand/10 shadow-sm" />
                       </div>
                       
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                             <label className="text-[9px] font-black uppercase text-slate-400 px-1 tracking-widest">Invoice Issue Date</label>
                             <input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-brand/30" />
                          </div>
                          <div className="space-y-1.5">
                             <label className="text-[9px] font-black uppercase text-slate-400 px-1 tracking-widest">Collection Due Date</label>
                             <input type="date" value={invoiceDue} onChange={e => setInvoiceDue(e.target.value)} className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-brand/30" />
                          </div>
                       </div>

                       <div className="space-y-1.5 pt-2 border-t border-slate-200/50">
                          <label className="text-[9px] font-black uppercase text-brand px-1 tracking-widest flex items-center gap-2">
                            <RefreshCw size={12} /> Hourly Recovery Rate
                          </label>
                          <div className="relative group">
                            <input 
                              type="number" 
                              step="1"
                              min="0"
                              value={recoveryRate === 0 ? '' : recoveryRate} 
                              onChange={e => setRecoveryRate(Math.max(0, parseFloat(e.target.value) || 0))} 
                              placeholder="e.g. 50.00 / hr"
                              className="w-full p-3 bg-white border border-brand/20 rounded-xl text-sm font-black text-brand outline-none focus:ring-4 focus:ring-brand/10 shadow-sm pl-10" 
                            />
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-brand/40">$</div>
                          </div>
                          <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tight px-1">Added to base WIP for all selected hours.</p>
                       </div>
                    </div>

                    <div className="space-y-6">
                       <label className="text-[10px] font-black uppercase text-slate-400 px-1 tracking-widest flex items-center gap-2">
                          <Edit3 size={12} /> Billed Engagement Lines (By Project)
                       </label>
                       
                       <div className="space-y-6">
                          {draftLineItems.length > 0 ? draftLineItems.map(item => {
                             const proj = projects.find(p => p.id === item.projectId);
                             const isManual = item.isManual;
                             
                             return (
                               <div key={item.id} className={`p-6 rounded-[2rem] border transition-all relative group/line ${isManual ? 'bg-brand/5 border-brand/20 shadow-md' : 'bg-white border-slate-200 shadow-sm hover:border-brand/30'}`}>
                                  <div className="flex items-start justify-between mb-5">
                                     <div className="min-w-0 flex-1">
                                        <div className="text-[9px] font-black text-brand uppercase tracking-widest">{proj?.code}</div>
                                        <div className="text-xs font-bold text-slate-900 truncate">{proj?.name}</div>
                                     </div>
                                     <button onClick={() => removeLineItem(item.id)} className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors" title="Remove Line">
                                        <Trash2 size={14} />
                                     </button>
                                  </div>

                                  <div className="mb-4 grid grid-cols-2 gap-4 px-1 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                                     <div className="flex flex-col">
                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Billable Pool</span>
                                        <span className="text-[10px] font-black text-slate-900">{item.maxHours.toFixed(2)} Available Hrs</span>
                                     </div>
                                     <div className="flex flex-col text-right">
                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Rate Authority</span>
                                        <span className="text-[10px] font-black text-brand">
                                           {formatCurrency(item.rate)}/hr
                                        </span>
                                     </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                                     <div className="space-y-1.5">
                                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                           <Clock size={10} /> Selected Hours
                                        </label>
                                        <div className="relative">
                                           <input 
                                             type="number" 
                                             step="0.25"
                                             min="0"
                                             max={item.maxHours}
                                             value={item.hours === 0 ? '' : item.hours}
                                             onChange={e => updateLineItem(item.id, 'hours', e.target.value)}
                                             className={`w-full p-3 bg-slate-50 border rounded-xl text-sm font-black focus:ring-2 focus:ring-brand outline-none transition-all focus:bg-white border-slate-200 text-slate-700`}
                                           />
                                        </div>
                                     </div>
                                     <div className="space-y-1.5">
                                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                           <DollarSign size={10} /> Computed Value
                                        </label>
                                        <div className="relative">
                                           <input 
                                             readOnly
                                             type="number"
                                             min="0"
                                             value={item.amount === 0 ? '' : item.amount}
                                             className={`w-full p-3 bg-slate-100 border-transparent text-slate-400 border rounded-xl text-sm font-black outline-none cursor-not-allowed`}
                                           />
                                           <div className="absolute top-1/2 -translate-y-1/2 right-3 opacity-50">
                                              <Lock size={12} className="text-slate-400" />
                                           </div>
                                        </div>
                                     </div>
                                  </div>
                               </div>
                             );
                          }) : (
                             <div className="p-16 text-center border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-slate-50/30">
                                <p className="text-slate-400 font-bold italic text-xs">Selection empty.</p>
                             </div>
                          )}
                       </div>
                    </div>

                    <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden ring-1 ring-white/10">
                       <div className="absolute top-0 right-0 w-48 h-48 bg-brand/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                       <div className="space-y-4 relative z-10">
                          <div className="flex justify-between items-center text-brand">
                             <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Aggregate Subtotal</span>
                             <span className="font-bold text-sm">{formatCurrency(builderTotals.subtotal - builderTotals.recoveryAmount)}</span>
                          </div>
                          
                          {builderTotals.recoveryAmount > 0 && (
                            <div className="flex justify-between items-center text-emerald-400">
                               <span className="text-[10px] font-black uppercase tracking-widest opacity-60 flex items-center gap-2">
                                 Recovery Adjustment ({builderTotals.totalHours.toFixed(2)}h)
                               </span>
                               <span className="font-bold text-sm">+{formatCurrency(builderTotals.recoveryAmount)}</span>
                            </div>
                          )}

                          <div className="flex justify-between items-center text-brand border-b border-white/5 pb-4">
                             <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 opacity-60">Firm Levy ({taxRate}%) 
                               <input type="number" min="0" value={taxRate} onChange={e => setTaxRate(Math.max(0, parseFloat(e.target.value) || 0))} className="w-12 bg-white/5 border border-white/10 rounded px-1 text-center outline-none focus:bg-brand/40" /> %
                             </span>
                             <span className="font-bold text-sm">{formatCurrency(builderTotals.tax)}</span>
                          </div>
                          
                          <div className="flex justify-between items-end pt-2">
                             <div className="flex flex-col">
                                <span className="text-[11px] font-black uppercase tracking-widest text-brand brightness-125">Combined Transaction</span>
                                <span className="text-[9px] font-bold text-brand/40 uppercase italic">Preparing {selectedProjectsForInvoice.size} separate documents...</span>
                             </div>
                             <div className="text-5xl font-black text-white tracking-tighter">
                               {formatCurrency(builderTotals.total)}
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="p-8 border-t border-slate-100 bg-white flex gap-4 flex-shrink-0">
                    <button onClick={() => setShowInvoiceBuilder(false)} className="flex-1 py-4 bg-slate-50 border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-100 transition-all shadow-sm">Discard Selection</button>
                    <button 
                      onClick={handleGenerateInvoice}
                      disabled={builderTotals.total <= 0}
                      className="flex-[2] py-4 bg-brand text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-brand/20 hover:brightness-110 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale"
                    >
                       Finalize & Post {selectedProjectsForInvoice.size} Invoices
                    </button>
                 </div>
               </>
             )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WIPLedger;