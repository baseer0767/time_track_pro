
import React, { useState, useMemo } from 'react';
import { 
  BarChart4, 
  Users, 
  Clock, 
  Receipt, 
  TrendingUp, 
  Calendar,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Briefcase,
  ChevronRight,
  Filter,
  PieChart,
  Timer,
  Download,
  ShieldCheck,
  History,
  Activity,
  Layers,
  /* Added FileText to fix missing icon error */
  FileText
} from 'lucide-react';
import { Employee, Assignment, Project, Client, Invoice, ProjectType, ClientStatus, InternalCode } from '../types';
import { getClientColorClasses } from './ClientsView';

interface ReportsViewProps {
  employees: Employee[];
  assignments: Assignment[]; // Unbilled actuals
  allAssignments: Assignment[]; // All recorded time
  projects: Project[];
  clients: Client[];
  invoices: Invoice[];
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(val);
};

/**
 * Fixed: Completed missing UI implementation and added export default statement
 */
const ReportsView: React.FC<ReportsViewProps> = ({ 
  employees, 
  assignments, 
  allAssignments,
  projects, 
  clients, 
  invoices 
}) => {
  const [activeReport, setActiveReport] = useState<'resources' | 'financials' | 'governance' | 'overhead'>('resources');

  const todayStr = useMemo(() => new Date('2026-05-22').toISOString().split('T')[0], []);
  
  // 1. RESOURCE DATA
  const resourceData = useMemo(() => {
    return employees.filter(e => e.isActive).map(emp => {
      const myAsgns = allAssignments.filter(a => a.employeeId === emp.id);
      const totalHrs = myAsgns.reduce((s, a) => s + a.hours, 0);
      
      const dailyTotals: Record<string, number> = {};
      myAsgns.forEach(a => {
        dailyTotals[a.date] = (dailyTotals[a.date] || 0) + a.hours;
      });

      let rt = 0;
      let ot = 0;
      Object.values(dailyTotals).forEach(h => {
        rt += Math.min(8, h);
        ot += Math.max(0, h - 8);
      });

      const util = (rt / 40) * 100;

      return { ...emp, rt, ot, util, total: rt + ot };
    }).sort((a, b) => b.util - a.util);
  }, [employees, allAssignments]);

  // 2. FINANCIAL DATA
  const financialData = useMemo(() => {
    const unbilled = assignments.reduce((acc, curr) => {
      const emp = employees.find(e => e.id === curr.employeeId);
      const proj = projects.find(p => p.id === curr.projectId);
      if (proj?.type !== ProjectType.BILLABLE) return acc;
      return acc + (curr.hours * (emp?.chargeRate || 0));
    }, 0);

    const pipeline = {
      draft: invoices.filter(i => i.status === 'Draft').reduce((s, i) => s + i.total, 0),
      issued: invoices.filter(i => i.status === 'Issued').reduce((s, i) => s + i.total, 0),
      paid: invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + i.total, 0)
    };

    return { unbilled, ...pipeline };
  }, [assignments, employees, projects, invoices]);

  // 3. GOVERNANCE DATA
  const governanceData = useMemo(() => {
    const activeClients = clients.filter(c => c.status === ClientStatus.ACTIVE).length;
    const pendingClients = clients.filter(c => c.status === ClientStatus.PENDING).length;
    const activeProjects = projects.filter(p => p.isActive).length;
    
    return { activeClients, pendingClients, activeProjects };
  }, [clients, projects]);

  // 4. OVERHEAD DATA
  const overheadData = useMemo(() => {
    const internalTime = allAssignments.filter(a => {
        const p = projects.find(proj => proj.id === a.projectId);
        return !p || p.type !== ProjectType.BILLABLE;
    });

    const totalOverheadHrs = internalTime.reduce((s, a) => s + a.hours, 0);
    const billableHrs = allAssignments.reduce((s, a) => {
        const p = projects.find(proj => proj.id === a.projectId);
        return s + (p?.type === ProjectType.BILLABLE ? a.hours : 0);
    }, 0);

    return { totalOverheadHrs, billableHrs };
  }, [allAssignments, projects]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between px-1 gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Enterprise Reporting</h1>
          <p className="text-sm text-slate-500 font-medium">Extract actionable intelligence from across the operational landscape.</p>
        </div>
        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
          {[
            { id: 'resources', label: 'Talent Utilization', icon: Users },
            { id: 'financials', label: 'P&L Pipeline', icon: DollarSign },
            { id: 'governance', label: 'Compliance', icon: ShieldCheck },
            { id: 'overhead', label: 'Overhead', icon: Clock }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveReport(tab.id as any)}
              className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${
                activeReport === tab.id 
                  ? 'bg-brand text-white shadow-lg shadow-brand/20' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeReport === 'resources' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400">Utilization Registry (Active)</h3>
              <button className="text-[10px] font-black text-brand uppercase tracking-widest flex items-center gap-1.5 hover:underline">
                <Download size={14} /> Export CSV
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[9px] font-black uppercase tracking-widest text-slate-400">
                    <th className="p-4 text-left border-r border-slate-200/50">Consultant Identity</th>
                    <th className="p-4 text-center border-r border-slate-200/50">RT Hrs</th>
                    <th className="p-4 text-center border-r border-slate-200/50">OT Hrs</th>
                    <th className="p-4 text-center border-r border-slate-200/50">Total</th>
                    <th className="p-4 text-left">Utilization Efficiency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {resourceData.map(emp => (
                    <tr key={emp.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 border-r border-slate-200/50">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 text-sm">{emp.name}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{emp.designation}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center border-r border-slate-200/50 font-bold text-slate-600">{emp.rt}h</td>
                      <td className="p-4 text-center border-r border-slate-200/50 font-bold text-rose-500">{emp.ot}h</td>
                      <td className="p-4 text-center border-r border-slate-200/50 font-black text-slate-900">{emp.total}h</td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-1000 ${emp.util > 100 ? 'bg-amber-500' : emp.util < 70 ? 'bg-rose-500' : 'bg-brand'}`} 
                              style={{ width: `${Math.min(emp.util, 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-[10px] font-black text-slate-900 min-w-[3rem] text-right">{emp.util.toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-6">Talent Bench Health</h4>
              <div className="space-y-6 relative z-10">
                <div>
                  <div className="text-4xl font-black tracking-tight">{resourceData.filter(r => r.util >= 75 && r.util <= 100).length}</div>
                  <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Optimal Utilization Pool</div>
                </div>
                <div>
                  <div className="text-4xl font-black tracking-tight text-rose-500">{resourceData.filter(r => r.util < 75).length}</div>
                  <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Bench / Under-utilized</div>
                </div>
                <div>
                  <div className="text-4xl font-black tracking-tight text-amber-500">{resourceData.filter(r => r.util > 100).length}</div>
                  <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Over-utilized / Burnout Risk</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeReport === 'financials' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Unbilled Actuals', value: financialData.unbilled, icon: Clock, color: 'text-indigo-600', bg: 'bg-indigo-50' },
              { label: 'Draft Invoices', value: financialData.draft, icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: 'A/R Pipeline', value: financialData.issued, icon: TrendingUp, color: 'text-rose-600', bg: 'bg-rose-50' },
              { label: 'Revenue Realized', value: financialData.paid, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            ].map((kpi, i) => (
              <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-lg transition-all border-b-4" style={{ borderColor: 'var(--brand-primary)' }}>
                <div className={`w-10 h-10 rounded-xl ${kpi.bg} ${kpi.color} flex items-center justify-center mb-4`}><kpi.icon size={20} /></div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{kpi.label}</div>
                  <div className="text-2xl font-black text-slate-900 tracking-tighter">{formatCurrency(kpi.value)}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
             <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner">
                   <TrendingUp size={24} />
                </div>
                <div>
                   <h3 className="text-xl font-black text-slate-900 tracking-tight">Revenue Conversion</h3>
                   <p className="text-xs text-slate-500 font-medium">Tracking unbilled WIP through the billing lifecycle.</p>
                </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="space-y-8">
                   <div className="flex flex-col gap-2">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Managed Capital</div>
                      <div className="text-5xl font-black text-slate-900 tracking-tighter">
                         {formatCurrency(financialData.unbilled + financialData.draft + financialData.issued + financialData.paid)}
                      </div>
                   </div>
                   <div className="p-6 bg-slate-950 rounded-2xl text-white">
                      <div className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-4">Pipeline Composition</div>
                      <div className="space-y-4">
                         {[
                           { label: 'Unbilled', val: financialData.unbilled, color: 'bg-indigo-500' },
                           { label: 'Invoiced', val: financialData.issued + financialData.paid, color: 'bg-emerald-500' }
                         ].map(item => {
                           const total = financialData.unbilled + financialData.issued + financialData.paid;
                           const percent = (item.val / total) * 100;
                           return (
                             <div key={item.label} className="space-y-1.5">
                                <div className="flex justify-between text-[10px] font-bold"><span>{item.label}</span><span>{percent.toFixed(0)}%</span></div>
                                <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                                   <div className={`h-full ${item.color}`} style={{ width: `${percent}%` }}></div>
                                </div>
                             </div>
                           )
                         })}
                      </div>
                   </div>
                </div>

                <div className="lg:col-span-2 space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><History size={14} /> Historical Context</h4>
                  <div className="p-20 text-center border-2 border-dashed border-slate-100 rounded-[2.5rem] bg-slate-50/30">
                     <p className="text-slate-400 font-bold italic text-sm">Historical comparison logic requires additional fiscal snapshots.</p>
                  </div>
                </div>
             </div>
          </div>
        </div>
      )}

      {activeReport === 'governance' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4">
           <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner mb-2"><CheckCircle2 size={32} /></div>
              <div>
                 <div className="text-4xl font-black text-slate-900 tracking-tighter">{governanceData.activeClients}</div>
                 <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Compliant Accounts</div>
              </div>
           </div>
           <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center space-y-4">
              <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner mb-2"><AlertCircle size={32} /></div>
              <div>
                 <div className="text-4xl font-black text-slate-900 tracking-tighter">{governanceData.pendingClients}</div>
                 <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Pending Clearance</div>
              </div>
           </div>
           <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center space-y-4">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner mb-2"><Briefcase size={32} /></div>
              <div>
                 <div className="text-4xl font-black text-slate-900 tracking-tighter">{governanceData.activeProjects}</div>
                 <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Live Project Codes</div>
              </div>
           </div>
        </div>
      )}

      {activeReport === 'overhead' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-10 shadow-sm animate-in slide-in-from-bottom-4">
           <div className="flex items-center gap-6 mb-12">
              <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-[2.5rem] flex items-center justify-center shadow-inner"><Clock size={32} /></div>
              <div>
                 <h3 className="text-2xl font-black text-slate-900 tracking-tight">Overhead Efficiency Audit</h3>
                 <p className="text-sm text-slate-500 font-medium uppercase tracking-widest">Internal Activity vs. Client Engagement</p>
              </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-10">
                 <div className="space-y-2">
                    <div className="flex justify-between items-end">
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Billable Effort Intensity</span>
                       <span className="text-2xl font-black text-emerald-600">
                          {((overheadData.billableHrs / (overheadData.billableHrs + overheadData.totalOverheadHrs)) * 100).toFixed(1)}%
                       </span>
                    </div>
                    <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                       <div className="bg-emerald-500 h-full" style={{ width: `${(overheadData.billableHrs / (overheadData.billableHrs + overheadData.totalOverheadHrs)) * 100}%` }}></div>
                       <div className="bg-rose-500 h-full" style={{ width: `${(overheadData.totalOverheadHrs / (overheadData.billableHrs + overheadData.totalOverheadHrs)) * 100}%` }}></div>
                    </div>
                    <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase pt-1">
                       <span>Billable Hrs</span>
                       <span>Internal Overhead</span>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                       <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Non-Revenue Effort</div>
                       <div className="text-3xl font-black text-slate-900">{overheadData.totalOverheadHrs}h</div>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                       <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total System Time</div>
                       <div className="text-3xl font-black text-slate-900">{overheadData.billableHrs + overheadData.totalOverheadHrs}h</div>
                    </div>
                 </div>
              </div>

              <div className="p-10 bg-slate-900 rounded-[3rem] text-white flex flex-col justify-center relative overflow-hidden ring-1 ring-white/10 shadow-2xl">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                 <div className="relative z-10 space-y-6">
                    <div className="flex items-center gap-4 text-indigo-400">
                       <Activity size={24} />
                       <h4 className="text-[11px] font-black uppercase tracking-widest">Efficiency Insight</h4>
                    </div>
                    <p className="text-base text-indigo-100 font-medium leading-relaxed">
                       Your firm's overhead footprint is currently at <span className="text-rose-400 font-black">{((overheadData.totalOverheadHrs / (overheadData.billableHrs + overheadData.totalOverheadHrs)) * 100).toFixed(1)}%</span>. Standard benchmarks for high-performance firms target under 15% for non-revenue activities.
                    </p>
                    <button className="w-full py-4 bg-brand text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-xl shadow-brand/20">Analyze Overhead Drivers</button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ReportsView;
