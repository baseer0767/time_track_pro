import React, { useMemo } from 'react';
import { 
  Users, 
  Briefcase, 
  Layers, 
  TrendingUp, 
  Clock, 
  Zap, 
  Calendar,
  CheckCircle2,
  DollarSign, 
  BarChart3, 
  ClipboardCheck, 
  Target, 
  AlertTriangle, 
  Timer, 
  LayoutGrid
} from 'lucide-react';
import { Client, Project, Assignment, Employee, ProjectType, InternalCode, TimesheetPeriod, TimesheetData, Invoice, ClientStatus, AppConfig } from '../types';

interface DashboardViewProps {
  user: Employee;
  clients: Client[];
  projects: Project[];
  assignments: Assignment[];
  employees: Employee[];
  internalRegistry: InternalCode[];
  periods: TimesheetPeriod[];
  timesheets: Record<string, TimesheetData>;
  invoices: Invoice[];
  appConfig?: AppConfig;
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(val);
};

const DashboardView: React.FC<DashboardViewProps> = ({ 
  user, clients, projects, assignments, employees, internalRegistry, periods, timesheets, invoices, appConfig
}) => {
  const isAdmin = user.role === 'Admin';
  
  const activePeriod = useMemo(() => {
    if (periods.length === 0) return null;
    const todayStr = new Date().toISOString().split('T')[0];
    const current = periods.find(p => todayStr >= p.startDate && todayStr <= p.endDate);
    if (current) return current;
    const open = periods.find(p => p.status === 'OPEN');
    return open || periods[0];
  }, [periods]);

  const weekDates = useMemo(() => {
    if (!activePeriod) return [];
    const dates = [];
    const temp = new Date(activePeriod.startDate + 'T12:00:00');
    for (let i = 0; i < 7; i++) {
      dates.push(new Date(temp).toISOString().split('T')[0]);
      temp.setDate(temp.getDate() + 1);
    }
    return dates;
  }, [activePeriod]);

  const adminData = useMemo(() => {
    if (!isAdmin) return null;
    const activeEmps = employees.filter(e => e.isActive);
    const periodAssignments = assignments.filter(a => weekDates.includes(a.date));
    
    const unbilledWip = assignments.reduce((acc, curr) => {
      const emp = employees.find(e => e.id === curr.employeeId);
      const proj = projects.find(p => p.id === curr.projectId);
      if (proj?.type !== ProjectType.BILLABLE) return acc;
      return acc + (curr.hours * (emp?.chargeRate || 0));
    }, 0);

    const totalHrsThisWeek = periodAssignments.reduce((s, a) => s + a.hours, 0);
    const overallUtil = (totalHrsThisWeek / (activeEmps.length * 40)) * 100;

    let currentDrafts = 0;
    let currentPending = 0;

    if (activePeriod) {
      Object.entries(timesheets).forEach(([key, sheet]) => {
        const ts = sheet as TimesheetData;
        if (key.endsWith(`-${activePeriod.startDate}`)) {
          if (ts.status === 'Draft' || ts.status === 'Rejected') {
            currentDrafts++;
          } else if (ts.status === 'Submitted') {
            currentPending++;
          }
        }
      });
    }

    // Comprehensive list for dashboard lookup
    const allLookupItems = [
      ...projects,
      ...internalRegistry.map(i => ({
        id: i.id,
        clientId: 'C3', // Internal client ID
        name: i.description,
        code: i.code,
        type: ProjectType.INTERNAL,
        isActive: i.isActive
      }))
    ];

    const hoursPerProject = allLookupItems.filter(p => p.isActive).map(p => {
        const hrs = periodAssignments.filter(a => a.projectId === p.id).reduce((s, a) => s + a.hours, 0);
        const resCount = new Set(periodAssignments.filter(a => a.projectId === p.id).map(a => a.employeeId)).size;
        const client = clients.find(c => c.id === p.clientId);
        // Fallback for internal clients or missing references
        const clientName = client?.name || (p.type === ProjectType.INTERNAL ? 'Firm Internal' : 'Unknown Client');
        return { ...p, hrs, resCount, clientName };
    }).filter(p => p.hrs > 0).sort((a,b) => b.hrs - a.hrs);

    const revByClient = clients.filter(c => c.status === ClientStatus.ACTIVE).map(c => {
        const cProjs = projects.filter(p => p.clientId === c.id).map(p => p.id);
        const rev = assignments.filter(a => cProjs.includes(a.projectId)).reduce((s, a) => {
            const emp = employees.find(e => e.id === a.employeeId);
            return s + (a.hours * (emp?.chargeRate || 0));
        }, 0);
        return { name: c.name, rev };
    }).sort((a,b) => b.rev - a.rev);

    return {
        totalEmployees: activeEmps.length,
        activeProjects: projects.filter(p => p.isActive).length,
        unbilledWip,
        overallUtil,
        pendingCount: currentPending,
        draftCount: currentDrafts,
        hoursPerProject: hoursPerProject.slice(0, 5),
        revByClient: revByClient.slice(0, 5)
    };
  }, [isAdmin, employees, clients, projects, internalRegistry, assignments, weekDates, timesheets, activePeriod]);

  const consultantData = useMemo(() => {
    if (isAdmin || !activePeriod) return null;
    const sheetKey = `${user.id}-${activePeriod.startDate}`;
    const sheet = timesheets[sheetKey];
    
    let billableHrs = 0;
    let totalHrs = 0;
    const activeProjectIds = new Set<string>();

    if (sheet) {
        weekDates.forEach(date => {
            sheet.manualProjectIds.forEach(pId => {
                const hours = sheet.timeEntries[`${pId}-${date}`] || 0;
                if (hours > 0) {
                    activeProjectIds.add(pId);
                    totalHrs += hours;
                    const proj = projects.find(p => p.id === pId);
                    if (proj?.type === ProjectType.BILLABLE) billableHrs += hours;
                }
            });
        });
    }

    return {
        util: (billableHrs / 40) * 100,
        billableHrs,
        totalHrs,
        weekCompletion: (totalHrs / 40) * 100,
        activeProjectCount: activeProjectIds.size
    };
  }, [isAdmin, user.id, activePeriod, timesheets, weekDates, projects]);

  if (isAdmin && adminData) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
             <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Portfolio WIP</div>
             <div className="text-3xl font-black text-slate-900 tracking-tight">{formatCurrency(adminData.unbilledWip)}</div>
             <div className="mt-2 text-[10px] text-emerald-600 font-bold uppercase">Firm Unbilled Value</div>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
             <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Overall Util</div>
             <div className="text-3xl font-black text-slate-900 tracking-tight">{adminData.overallUtil.toFixed(1)}%</div>
             <div className="mt-2 text-[10px] text-indigo-600 font-bold uppercase">Weekly Firm Benchmark</div>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
             <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pending Sync</div>
             <div className="text-3xl font-black text-amber-500 tracking-tight">{adminData.pendingCount}</div>
             <div className="mt-2 text-[10px] text-amber-600 font-bold uppercase">Awaiting PM Review</div>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
             <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Drafts</div>
             <div className="text-3xl font-black text-slate-900 tracking-tight">{adminData.draftCount}</div>
             <div className="mt-2 text-[10px] text-slate-400 font-bold uppercase">Started this cycle</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2"><Target size={16} className="text-brand"/> Top Engagements (Weekly)</h3>
              <div className="space-y-4">
                 {adminData.hoursPerProject.length > 0 ? adminData.hoursPerProject.map(proj => (
                    <div key={proj.id} className="flex items-center justify-between p-5 bg-slate-50/50 rounded-2xl border border-slate-100/50 hover:bg-white hover:shadow-lg hover:border-brand/20 transition-all group">
                       <div className="flex items-center gap-5 min-w-0">
                          <div className={`w-14 h-14 rounded-xl flex items-center justify-center font-black text-[10px] shadow-sm flex-shrink-0 border transition-all ${proj.type === ProjectType.BILLABLE ? 'bg-brand text-white border-brand' : 'bg-white text-slate-400 border-slate-200'}`}>
                            {proj.code.split('-')[0]}
                          </div>
                          <div className="min-w-0 flex-1">
                             <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-[9px] font-black text-brand uppercase tracking-[0.15em] leading-none">{proj.code}</span>
                                {proj.type === ProjectType.INTERNAL && <span className="text-[7px] px-1 py-0.5 bg-slate-200 text-slate-500 rounded font-black uppercase">Internal</span>}
                             </div>
                             <div className="text-[13px] font-black text-slate-900 truncate group-hover:text-brand transition-colors leading-tight">{proj.name}</div>
                             <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight truncate opacity-80 mt-1">
                                {proj.clientName} • {proj.resCount} {proj.resCount === 1 ? 'Resource' : 'Resources'}
                             </div>
                          </div>
                       </div>
                       <div className="flex flex-col items-end gap-1 ml-4 flex-shrink-0">
                          <div className="text-lg font-black text-slate-900">{proj.hrs}h</div>
                          <div className="w-12 h-1 bg-slate-200 rounded-full overflow-hidden">
                             <div className="bg-brand h-full" style={{ width: `${Math.min((proj.hrs/40)*100, 100)}%` }}></div>
                          </div>
                       </div>
                    </div>
                 )) : (
                    <div className="p-12 text-center border-2 border-dashed border-slate-100 rounded-3xl text-slate-300 font-bold italic">No active time for Period {activePeriod?.week}.</div>
                 )}
              </div>
           </div>

           <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm flex flex-col">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2"><ClipboardCheck size={16} className="text-brand"/> Governance Control</h3>
              <div className="flex-1 flex flex-col justify-center gap-6">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-6 bg-brand/5 rounded-[2rem] border border-brand/10 text-center">
                       <div className="text-4xl font-black text-brand">{adminData.pendingCount}</div>
                       <div className="text-[9px] font-black text-brand/60 uppercase mt-1">Submitted</div>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-200 text-center">
                       <div className="text-4xl font-black text-slate-900">{adminData.draftCount}</div>
                       <div className="text-[9px] font-black text-slate-400 uppercase mt-1">Drafts</div>
                    </div>
                 </div>
                 <button className="w-full py-4.5 bg-slate-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-brand transition-all active:scale-95">Audit Period Compliance</button>
              </div>
           </div>
        </div>
      </div>
    );
  }

  if (!isAdmin && consultantData) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-brand p-8 rounded-[2.5rem] text-white shadow-xl shadow-brand/20 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
             <div className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">My Weekly Util</div>
             <div className="text-6xl font-black tracking-tighter">{consultantData.util.toFixed(0)}%</div>
             <div className="mt-6 flex items-center gap-3">
                <div className="h-1.5 flex-1 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white transition-all duration-1000" style={{ width: `${Math.min(consultantData.util, 100)}%` }}></div>
                </div>
                <span className="text-[10px] font-black uppercase">{consultantData.billableHrs}h B</span>
             </div>
          </div>
          <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl border border-slate-800 flex flex-col justify-center">
             <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Time Recorded</div>
             <div className="text-5xl font-black tracking-tighter">{consultantData.totalHrs}h</div>
             <div className="mt-2 text-[10px] font-bold text-slate-500 uppercase">Target: 40h/week</div>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-center">
             <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Engagements</div>
             <div className="text-5xl font-black text-slate-900 tracking-tighter">{consultantData.activeProjectCount}</div>
             <div className="mt-2 text-[10px] font-black text-brand uppercase">Active this cycle</div>
          </div>
        </div>

        <div className="bg-white rounded-[3rem] border border-slate-200 p-10 shadow-sm">
           <div className="flex items-center gap-6 mb-10">
              <div className="w-16 h-16 bg-slate-50 rounded-[1.5rem] flex items-center justify-center text-brand border border-slate-100 shadow-inner">
                 <Clock size={32} />
              </div>
              <div>
                 <h3 className="text-2xl font-black text-slate-900 tracking-tight">Cycle Productivity</h3>
                 <p className="text-sm text-slate-500 font-medium">Performance summary for Period {activePeriod?.week || 'N/A'}.</p>
              </div>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                 <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Timesheet Maturity</span>
                    <span className="text-lg font-black text-brand">{consultantData.weekCompletion.toFixed(1)}%</span>
                 </div>
                 <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="bg-brand h-full transition-all duration-1000" style={{ width: `${Math.min(consultantData.weekCompletion, 100)}%` }}></div>
                 </div>
                 <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    You have logged <span className="font-black text-slate-900">{consultantData.totalHrs} hours</span> against your firm requirement for the current fiscal week.
                 </p>
              </div>
              <div className="p-7 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center justify-around">
                 <div className="text-center">
                    <div className="text-3xl font-black text-slate-900">{consultantData.billableHrs}h</div>
                    <div className="text-[9px] font-black text-brand uppercase tracking-widest mt-1">Billable</div>
                 </div>
                 <div className="w-px h-10 bg-slate-200"></div>
                 <div className="text-center">
                    <div className="text-3xl font-black text-slate-900">{(consultantData.totalHrs - consultantData.billableHrs).toFixed(1)}h</div>
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Internal</div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    );
  }

  return null;
};

export default DashboardView;