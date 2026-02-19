import React, { useState, useMemo } from 'react';
import { 
  Receipt, 
  Search, 
  Filter, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  ChevronRight, 
  DollarSign, 
  Download, 
  Printer,
  X,
  CreditCard,
  Building2,
  Tag,
  RotateCcw,
  History,
  User,
  ArrowRight,
  Layers,
  Building,
  AlertTriangle
} from 'lucide-react';
import { Invoice, Client, InvoiceStatus, Project } from '../types';

interface InvoicesViewProps {
  invoices: Invoice[];
  clients: Client[];
  projects: Project[];
  onUpdateStatus: (id: string, status: InvoiceStatus) => void;
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(val);
};

const RevokeConfirmationModal: React.FC<{ invoice: Invoice; onConfirm: () => void; onCancel: () => void }> = ({ invoice, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
       <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
          <div className="p-8 bg-rose-600 text-white flex justify-between items-center">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center border border-white/30 shadow-lg">
                   <AlertTriangle size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight">Revoke Document</h2>
                  <p className="text-rose-100 text-[10px] font-black uppercase tracking-widest mt-1">Irreversible System Action</p>
                </div>
             </div>
             <button onClick={onCancel} className="p-2 hover:bg-white/10 rounded-full transition-all"><X size={24} /></button>
          </div>
          <div className="p-8 space-y-6">
             <p className="text-sm text-slate-600 font-medium leading-relaxed">
                Do you want to revoke the invoice <span className="font-black text-slate-900">#{invoice.invoiceNo}</span>?
             </p>
             <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl">
                <p className="text-[11px] text-rose-700 font-bold leading-relaxed">
                   This will void the formal document and return all billed hours to the <span className="uppercase">Unbilled WIP Ledger</span> for future cycles.
                </p>
             </div>
             <div className="flex gap-4">
                <button onClick={onCancel} className="flex-1 py-4 text-slate-600 font-bold bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all">Cancel</button>
                <button onClick={onConfirm} className="flex-[2] py-4 bg-rose-600 text-white font-black uppercase tracking-widest text-[11px] rounded-2xl shadow-xl shadow-rose-100 hover:bg-rose-700 transition-all active:scale-95">Confirm Revocation</button>
             </div>
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
          <div className="bg-white border-2 border-slate-900 shadow-2xl p-16 font-serif min-h-[900px] flex flex-col animate-in zoom-in-95 duration-500">
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
          <div className="flex justify-center gap-4 mt-8">
             <button onClick={() => window.print()} className="px-8 py-3 bg-white text-slate-900 font-black uppercase tracking-widest text-xs rounded-xl flex items-center gap-2 shadow-xl hover:bg-slate-50 transition-all active:scale-95"><Printer size={16} /> Print Document</button>
             <button onClick={onX} className="px-8 py-3 bg-slate-800 text-white font-black uppercase tracking-widest text-xs rounded-xl hover:bg-slate-700 transition-all active:scale-95">Discard Preview</button>
          </div>
       </div>
    </div>
  );
};

const InvoicesView: React.FC<InvoicesViewProps> = ({ invoices, clients, projects, onUpdateStatus }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'All'>('All');
  const [viewHistoryId, setViewHistoryId] = useState<string | null>(null);
  const [previewInvoiceId, setPreviewInvoiceId] = useState<string | null>(null);
  const [revokeInvoiceId, setRevokeInvoiceId] = useState<string | null>(null);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const client = clients.find(c => c.id === inv.clientId);
      const matchesSearch = inv.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          client?.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || inv.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [invoices, clients, searchTerm, statusFilter]);

  const totals = useMemo(() => {
    const draft = invoices.filter(i => i.status === 'Draft').reduce((s, i) => s + i.total, 0);
    const issued = invoices.filter(i => i.status === 'Issued').reduce((s, i) => s + i.total, 0);
    const paid = invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + i.total, 0);
    return { draft, issued, paid, total: issued + paid };
  }, [invoices]);

  const historyInvoice = useMemo(() => invoices.find(inv => inv.id === viewHistoryId), [invoices, viewHistoryId]);
  const previewInvoice = useMemo(() => invoices.find(inv => inv.id === previewInvoiceId), [invoices, previewInvoiceId]);
  const previewClient = useMemo(() => previewInvoice ? clients.find(c => c.id === previewInvoice.clientId) : null, [previewInvoice, clients]);
  const revokeInvoice = useMemo(() => invoices.find(inv => inv.id === revokeInvoiceId), [invoices, revokeInvoiceId]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-1">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Firm Invoices</h1>
          <p className="text-sm text-slate-500 font-medium">Full historical register of issued and pending billing instruments.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
           <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Accounts Receivable</div>
              <div className="text-lg font-black text-rose-600">{formatCurrency(totals.issued)}</div>
           </div>
           <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Cash Realized</div>
              <div className="text-lg font-black text-emerald-600">{formatCurrency(totals.paid)}</div>
           </div>
           <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hidden md:block">
              <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Draft WIP Buffer</div>
              <div className="text-lg font-black text-indigo-600">{formatCurrency(totals.draft)}</div>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 bg-slate-50/30 flex flex-wrap items-center gap-4">
           <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-lg border border-slate-200 max-w-sm w-full shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all">
              <Search size={14} className="text-slate-400" />
              <input type="text" placeholder="Filter invoices or clients..." className="bg-transparent border-none outline-none text-xs w-full text-slate-600 font-medium focus:ring-0" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
           </div>
           <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
              {['All', 'Draft', 'Issued', 'Paid', 'Revoked'].map(status => (
                <button 
                  key={status} 
                  onClick={() => setStatusFilter(status as any)}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === status ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {status}
                </button>
              ))}
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <th className="p-4 text-left border-r border-slate-200/50">Invoice Metadata</th>
                <th className="p-4 text-left border-r border-slate-200/50">Engagement Summary</th>
                <th className="p-4 text-center border-r border-slate-200/50">Status</th>
                <th className="p-4 text-right border-r border-slate-200/50">Subtotal</th>
                <th className="p-4 text-right border-r border-slate-200/50 text-indigo-400">Tax (15%)</th>
                <th className="p-4 text-right border-r border-slate-200/50">Total</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length > 0 ? filteredInvoices.map(inv => {
                const client = clients.find(c => c.id === inv.clientId);
                const isRevoked = inv.status === 'Revoked';
                const billedProjectCodes = Array.from(new Set(inv.items.map(i => i.projectId).map(pId => projects.find(p => p.id === pId)?.code).filter(Boolean)));

                return (
                  <tr key={inv.id} className={`group hover:bg-slate-50/50 transition-colors cursor-pointer ${isRevoked ? 'bg-slate-50/30 opacity-70' : ''}`} onClick={() => setViewHistoryId(inv.id)}>
                    <td className="p-4 border-r border-slate-200/50">
                      <div className="flex items-center gap-4">
                         <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm ${
                           inv.status === 'Paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                           inv.status === 'Revoked' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                           'bg-slate-100 text-slate-400 border-slate-200'
                         }`}>
                            <Receipt size={18} />
                         </div>
                         <div className="min-w-0">
                            <div className="flex items-center gap-2">
                               <div className="text-[11px] font-black text-slate-900 tracking-tight">#{inv.invoiceNo}</div>
                               <div className="text-[8px] font-black bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded border border-indigo-100 uppercase tracking-tighter">{client?.prefix}</div>
                            </div>
                            <div className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mt-0.5 truncate">{client?.name}</div>
                            <div className="flex flex-wrap gap-1 mt-1.5">
                               {billedProjectCodes.map(code => (
                                 <span key={code} className="text-[7px] font-black text-slate-400 border border-slate-200 px-1 rounded uppercase bg-slate-50 group-hover:border-indigo-200 group-hover:text-indigo-500 transition-colors shadow-none">{code}</span>
                               ))}
                            </div>
                         </div>
                      </div>
                    </td>
                    <td className="p-4 border-r border-slate-200/50">
                       <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-[9px] font-bold text-slate-500 uppercase">
                             <Calendar size={12} className="text-slate-300" /> Issued {inv.date}
                          </div>
                          <div className="text-[9px] font-medium text-slate-400 italic max-w-[200px] truncate">
                             {inv.items.map(i => i.description.split('-')[0]).join(', ')}
                          </div>
                       </div>
                    </td>
                    <td className="p-4 border-r border-slate-200/50 text-center">
                       <div className={`inline-flex px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border items-center gap-1.5 ${
                          inv.status === 'Paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                          inv.status === 'Draft' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 
                          inv.status === 'Revoked' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                          'bg-amber-50 text-amber-600 border-amber-100'
                        }`}>
                          {inv.status}
                          <History size={10} className="opacity-50" />
                       </div>
                    </td>
                    <td className="p-4 border-r border-slate-200/50 text-right font-bold text-slate-600 text-xs">
                       {formatCurrency(inv.subtotal)}
                    </td>
                    <td className="p-4 border-r border-slate-200/50 text-right font-bold text-indigo-400 text-xs italic">
                       {formatCurrency(inv.tax)}
                    </td>
                    <td className="p-4 border-r border-slate-200/50 text-right font-black text-slate-900">
                       {formatCurrency(inv.total)}
                    </td>
                    <td className="p-4 text-center">
                       <div className="flex items-center justify-center gap-2">
                          {inv.status === 'Draft' && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); onUpdateStatus(inv.id, 'Issued'); }} 
                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all border border-transparent hover:border-indigo-100" 
                                title="Issue Document"
                            >
                                <FileText size={14} />
                            </button>
                          )}
                          {inv.status === 'Issued' && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); onUpdateStatus(inv.id, 'Paid'); }} 
                                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all border border-transparent hover:border-emerald-100" 
                                title="Confirm Payment"
                            >
                                <CheckCircle2 size={14} />
                            </button>
                          )}
                          {inv.status !== 'Revoked' && (
                            <button 
                                onClick={(e) => { 
                                    e.stopPropagation(); 
                                    setRevokeInvoiceId(inv.id);
                                }} 
                                className="p-2 text-rose-400 hover:bg-rose-50 rounded-lg transition-all border border-transparent hover:border-rose-100" 
                                title="Revoke & Reconcile"
                            >
                                <RotateCcw size={14} />
                            </button>
                          )}
                          <button 
                            onClick={(e) => { e.stopPropagation(); setPreviewInvoiceId(inv.id); }} 
                            className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all" 
                            title="Launch Print Preview"
                          >
                            <Printer size={14} />
                          </button>
                       </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={7} className="p-20 text-center">
                     <div className="max-w-xs mx-auto space-y-3">
                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 border border-dashed border-slate-200 mx-auto shadow-inner"><Receipt size={24} /></div>
                        <p className="text-slate-400 font-bold italic text-sm">No billing records matched your filter criteria.</p>
                     </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* STATUS HISTORY FLYOUT */}
      {viewHistoryId && historyInvoice && (
        <div className="fixed inset-0 z-[210] flex justify-end">
           <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setViewHistoryId(null)}></div>
           <div className="relative w-full max-w-sm bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 border-l border-slate-200">
              <div className="p-6 bg-slate-950 text-white flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <History size={20} className="text-indigo-400" />
                    <div>
                       <h2 className="text-lg font-bold leading-none">Invoice Lifecycle</h2>
                       <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">Audit Trail #{historyInvoice.invoiceNo}</p>
                    </div>
                 </div>
                 <button onClick={() => setViewHistoryId(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors focus:outline-none"><X size={20} /></button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 bg-[#F8FAFC]">
                 <div className="relative">
                    <div className="absolute left-[11px] top-4 bottom-4 w-0.5 bg-slate-200"></div>
                    <div className="space-y-12 relative">
                       {historyInvoice.statusHistory && historyInvoice.statusHistory.length > 0 ? historyInvoice.statusHistory.map((entry, idx) => (
                         <div key={idx} className="flex gap-6 items-start relative">
                            <div className={`w-6 h-6 rounded-full border-4 border-white shadow-md flex-shrink-0 z-10 ${
                              entry.status === 'Draft' ? 'bg-indigo-500' :
                              entry.status === 'Issued' ? 'bg-amber-500' :
                              entry.status === 'Paid' ? 'bg-emerald-500' :
                              entry.status === 'Revoked' ? 'bg-rose-500' : 'bg-slate-400'
                            }`}></div>
                            <div className="flex-1 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm group hover:border-indigo-100 transition-colors">
                               <div className="flex items-center justify-between mb-2">
                                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${
                                    entry.status === 'Draft' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                    entry.status === 'Issued' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                    entry.status === 'Paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                    'bg-rose-50 text-rose-600 border-rose-100'
                                  }`}>{entry.status}</span>
                                  <span className="text-[9px] font-bold text-slate-400 italic">{entry.date}</span>
                               </div>
                               <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                  <User size={12} className="text-slate-300" />
                                  <span className="font-bold">Modified by {entry.user}</span>
                               </div>
                            </div>
                         </div>
                       )) : (
                         <div className="p-10 text-center">
                            <p className="text-xs text-slate-400 italic">No historical status transitions recorded.</p>
                         </div>
                       )}
                    </div>
                 </div>

                 {historyInvoice.status === 'Revoked' && (
                    <div className="mt-12 p-5 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3">
                       <RotateCcw className="text-rose-500 shrink-0 mt-0.5" size={16} />
                       <div>
                          <h4 className="text-[10px] font-black text-rose-700 uppercase tracking-widest mb-1">Status: Document Revoked</h4>
                          <p className="text-[11px] text-rose-600/80 font-medium leading-relaxed">This invoice was voided on {historyInvoice.statusHistory?.[historyInvoice.statusHistory.length - 1]?.date || 'N/A'}. All associated unbilled WIP has been reconciled and returned to the unbilled ledger for correction or re-issuance.</p>
                       </div>
                    </div>
                 )}
              </div>
              
              <div className="p-6 border-t border-slate-100 bg-white">
                 <button onClick={() => setViewHistoryId(null)} className="w-full py-4 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 transition-all active:scale-95 shadow-lg">Close Transaction Trail</button>
              </div>
           </div>
        </div>
      )}

      {/* REVOKE CONFIRMATION MODAL */}
      {revokeInvoiceId && revokeInvoice && (
        <RevokeConfirmationModal 
           invoice={revokeInvoice}
           onConfirm={() => {
              onUpdateStatus(revokeInvoice.id, 'Revoked');
              setRevokeInvoiceId(null);
           }}
           onCancel={() => setRevokeInvoiceId(null)}
        />
      )}

      {/* PRINT PREVIEW MODAL */}
      {previewInvoice && previewClient && (
        <InvoicePreviewModal 
          invoice={previewInvoice} 
          client={previewClient} 
          onX={() => setPreviewInvoiceId(null)} 
        />
      )}
    </div>
  );
};

export default InvoicesView;
