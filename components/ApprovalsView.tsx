
import React, { useState, useMemo } from 'react';
import { 
  ClipboardCheck, 
  Search, 
  ThumbsUp, 
  ThumbsDown, 
  Clock, 
  Calendar, 
  User, 
  MessageSquare, 
  X,
  AlertCircle,
  ChevronRight,
  Info,
  Quote,
  ShieldCheck,
  UserCheck,
  Briefcase,
  Globe,
  Lock,
  History,
  CheckCircle
} from 'lucide-react';
import { Employee, Project, InternalCode, TimesheetData, ProjectType } from '../types';

interface ApprovalsViewProps {
  employees: Employee[];
  projects: Project[];
  internalRegistry: InternalCode[];
  timesheets: Record<string, TimesheetData>;
  onApprove: (key: string) => void;
  onReject: (key: string, comment: string) => void;
  currentUserId: string;
}

const SmallAvatar: React.FC<{ employee?: Employee }> = ({ employee }) => {
  if (!employee) return <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200" />;
  const initials = employee.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  const colors = ['bg-[#6366f1]', 'bg-[#8b5cf6]', 'bg-[#ec4899]', 'bg-[#06b6d4]', 'bg-[#10b981]', 'bg-[#f59e0b]'];
  const bgColor = colors[employee.name.length % colors.length];

  return (
    <div className={`w-6 h-6 rounded-full ${bgColor} flex items-center justify-center text-white text-[8px] font-black border border-white shadow-sm`}>
      {initials}
    </div>
  );
};

const ApprovalsView: React.FC<ApprovalsViewProps> = ({ 
  employees, 
  projects, 
  internalRegistry, 
  timesheets, 
  onApprove, 
  onReject, 
  currentUserId 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSheetKey, setSelectedSheetKey] = useState<string | null>(null);
  const [rejectModalKey, setRejectModalKey] = useState<string | null>(null);
  const [rejectComment, setRejectComment] = useState('');

  const pendingApprovals = useMemo(() => {
    return Object.entries(timesheets)
      .filter(([key, data]) => {
        const timesheet = data as TimesheetData;
        if (timesheet.status !== 'Submitted') return false;

        // Hide if the current user has already signed off on this sheet
        if (timesheet.approvals?.includes(currentUserId)) return false;

        const firstDash = key.indexOf('-');
        const empId = key.substring(0, firstDash);
        const emp = employees.find(e => e.id === empId);
        
        const isLineManager = emp?.managerId === currentUserId;
        const isProjectManager = timesheet.manualProjectIds.some(pId => {
          const proj = projects.find(p => p.id === pId);
          return proj?.managerId === currentUserId;
        });

        return isLineManager || isProjectManager;
      })
      .map(([key, data]) => {
        const firstDash = key.indexOf('-');
        const empId = key.substring(0, firstDash);
        const weekStart = key.substring(firstDash + 1);
        const emp = employees.find(e => e.id === empId);
        const timesheet = data as TimesheetData;
        
        const totalHours = Object.values(timesheet.timeEntries).reduce((sum, h) => (sum as number) + (h as number), 0);
        const isLineManager = emp?.managerId === currentUserId;
        const managedProjectIds = timesheet.manualProjectIds.filter(pId => {
          const proj = projects.find(p => p.id === pId);
          return proj?.managerId === currentUserId;
        });

        return { key, emp, weekStart, totalHours, data: timesheet, isLineManager, managedProjectIds };
      })
      .filter(item => item.emp?.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [timesheets, employees, projects, currentUserId, searchTerm]);

  const handleReject = () => {
    if (rejectModalKey && rejectComment.trim()) {
      onReject(rejectModalKey, rejectComment);
      setRejectModalKey(null);
      setRejectComment('');
      setSelectedSheetKey(null);
    }
  };

  const selectedSheet = selectedSheetKey ? pendingApprovals.find(p => p.key === selectedSheetKey) : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between px-1">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Team Approvals</h1>
          <p className="text-sm text-slate-500 font-medium">Authorizations are recorded per authority. All stakeholders must sign off for finalization.</p>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100 shadow-sm">
           <ClipboardCheck size={18} />
           <span className="text-xs font-black uppercase tracking-widest">{pendingApprovals.length} Sheets Pending Your Sign-off</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 bg-slate-50/30">
           <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-lg border border-slate-200 max-w-sm w-full">
              <Search size={14} className="text-slate-400" />
              <input type="text" placeholder="Search team member..." className="bg-transparent border-none outline-none text-xs w-full text-slate-600 font-medium focus:ring-0" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <th className="p-4 text-left border-r border-slate-200/50">Consultant</th>
                <th className="p-4 text-center border-r border-slate-200/50">Your Responsibility</th>
                <th className="p-4 text-center border-r border-slate-200/50">Progress</th>
                <th className="p-4 text-center border-r border-slate-200/50">Total Hrs</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pendingApprovals.map(item => {
                const required = new Set([item.emp?.managerId]);
                item.data.manualProjectIds.forEach(id => {
                  const p = projects.find(pr => pr.id === id);
                  if (p?.managerId) required.add(p.managerId);
                });
                const approvedCount = item.data.approvals?.length || 0;
                
                return (
                  <tr key={item.key} className="group hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => setSelectedSheetKey(item.key)}>
                    <td className="p-4 border-r border-slate-200/50">
                      <div className="flex items-center gap-4">
                        <SmallAvatar employee={item.emp} />
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{item.emp?.name}</div>
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Week: {item.weekStart}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center border-r border-slate-200/50">
                      <div className="flex flex-col items-center gap-1">
                        {item.isLineManager && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-600 text-[8px] font-black uppercase border border-indigo-100"><UserCheck size={10} /> Line Manager</span>}
                        {item.managedProjectIds.length > 0 && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase border border-emerald-100"><Briefcase size={10} /> Project PM</span>}
                      </div>
                    </td>
                    <td className="p-4 text-center border-r border-slate-200/50">
                      <div className="flex flex-col items-center gap-1">
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{approvedCount}/{required.size} Sign-offs</div>
                        <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                          <div className="bg-indigo-600 h-full" style={{ width: `${(approvedCount / required.size) * 100}%` }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center border-r border-slate-200/50">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-black bg-slate-50 text-slate-600 border border-slate-200">{item.totalHours}h</div>
                    </td>
                    <td className="p-4 text-center">
                       <ChevronRight size={18} className="text-slate-300 mx-auto group-hover:text-indigo-600 transition-colors" />
                    </td>
                  </tr>
                );
              })}
              {pendingApprovals.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-24 text-center">
                    <div className="flex flex-col items-center gap-3">
                       <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 border border-slate-100"><ClipboardCheck size={32} /></div>
                       <p className="text-slate-400 font-bold italic">Everything is up-to-date.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedSheet && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setSelectedSheetKey(null)}></div>
          <div className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 border-l border-slate-200">
             <div className="p-8 bg-slate-950 text-white flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center font-bold text-white shadow-lg text-lg">{selectedSheet.emp?.name[0]}</div>
                   <div>
                      <h2 className="text-xl font-bold leading-none">{selectedSheet.emp?.name}</h2>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-indigo-400 text-[10px] uppercase tracking-widest font-black">Period: {selectedSheet.weekStart}</span>
                      </div>
                   </div>
                </div>
                <button onClick={() => setSelectedSheetKey(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24}/></button>
             </div>

             <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {/* Sign-off Status Checklist */}
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 space-y-4">
                   <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 mb-2"><History size={14} /> Approval Chain Status</h4>
                   <div className="space-y-3">
                      {/* Line Manager Sign-off */}
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedSheet.data.approvals?.includes(selectedSheet.emp?.managerId || '') ? 'bg-emerald-100 text-emerald-600' : 'bg-white border border-slate-200 text-slate-300'}`}>
                               <UserCheck size={16} />
                            </div>
                            <div className="flex flex-col">
                               <span className="text-xs font-bold text-slate-700">Line Manager Sign-off</span>
                               <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight">{employees.find(e => e.id === selectedSheet.emp?.managerId)?.name}</span>
                            </div>
                         </div>
                         {selectedSheet.data.approvals?.includes(selectedSheet.emp?.managerId || '') ? <CheckCircle size={18} className="text-emerald-500" /> : <Clock size={18} className="text-slate-200" />}
                      </div>

                      {/* Project Sign-offs */}
                      {Array.from(new Set(selectedSheet.data.manualProjectIds.map(id => projects.find(p => p.id === id)?.managerId).filter(Boolean))).map(pmId => {
                         const pm = employees.find(e => e.id === pmId);
                         const hasApproved = selectedSheet.data.approvals?.includes(pmId || '');
                         return (
                            <div key={pmId} className="flex items-center justify-between">
                               <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${hasApproved ? 'bg-emerald-100 text-emerald-600' : 'bg-white border border-slate-200 text-slate-300'}`}>
                                     <Briefcase size={16} />
                                  </div>
                                  <div className="flex flex-col">
                                     <span className="text-xs font-bold text-slate-700">Project Authorization</span>
                                     <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight">{pm?.name}</span>
                                  </div>
                               </div>
                               {hasApproved ? <CheckCircle size={18} className="text-emerald-500" /> : <Clock size={18} className="text-slate-200" />}
                            </div>
                         );
                      })}
                   </div>
                </div>

                {selectedSheet.data.userComment && (
                   <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl relative">
                      <Quote className="absolute -top-3 -left-3 w-8 h-8 text-indigo-100 fill-indigo-50" />
                      <p className="text-sm text-slate-700 font-medium italic leading-relaxed">"{selectedSheet.data.userComment}"</p>
                   </div>
                )}

                <div className="space-y-4">
                   <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><Briefcase size={14} /> Relevant Line Items</h4>
                   <div className="space-y-3">
                      {selectedSheet.data.manualProjectIds.map(pId => {
                        const proj = projects.find(p => p.id === pId) || (internalRegistry.find(ir => ir.id === pId) as any);
                        const isProj = projects.some(p => p.id === pId);
                        const isManagedByMe = isProj && (proj as Project)?.managerId === currentUserId;
                        
                        const rowTotal = [0,1,2,3,4,5,6].reduce((sum, i) => {
                          const d = new Date(selectedSheet.weekStart + 'T12:00:00');
                          d.setDate(d.getDate() + i);
                          const dateStr = d.toISOString().split('T')[0];
                          return sum + (selectedSheet.data.timeEntries[`${pId}-${dateStr}`] || 0);
                        }, 0);

                        if (rowTotal === 0) return null;

                        return (
                          <div key={pId} className={`p-4 rounded-xl flex items-center justify-between border ${isManagedByMe ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-50' : 'bg-white border-slate-200'}`}>
                             <div>
                                <div className={`text-[10px] font-black uppercase tracking-tight ${isProj ? 'text-indigo-600' : 'text-amber-600'}`}>{proj?.code}</div>
                                <div className="text-xs font-bold text-slate-900">{proj?.name || proj?.description}</div>
                             </div>
                             <div className="text-sm font-black text-slate-900">{rowTotal}h</div>
                          </div>
                        );
                      })}
                   </div>
                </div>

                <div className="p-5 bg-slate-900 rounded-3xl text-white">
                   <div className="flex items-start gap-4">
                      <ShieldCheck className="text-indigo-400 mt-1" size={20} />
                      <p className="text-xs text-indigo-100 font-medium leading-relaxed">
                         {selectedSheet.isLineManager 
                           ? "As Line Manager, you authorize internal overhead (PTO/Admin) and verify overall performance. Your approval is a master signature."
                           : "As Project Manager, you authorize specific hours for your engagements. The timesheet remains pending until the Line Manager and other PMs sign off."
                         }
                      </p>
                   </div>
                </div>
             </div>

             <div className="p-8 border-t border-slate-100 bg-slate-50 flex gap-4 flex-shrink-0">
                <button onClick={() => setRejectModalKey(selectedSheet.key)} className="flex-1 py-4 bg-white border border-rose-200 text-rose-600 font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-rose-50 transition-all flex items-center justify-center gap-2"><ThumbsDown size={16}/> Reject</button>
                <button onClick={() => { onApprove(selectedSheet.key); setSelectedSheetKey(null); }} className="flex-[2] py-4 bg-indigo-600 text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"><ThumbsUp size={16}/> Record Sign-off</button>
             </div>
          </div>
        </div>
      )}

      {rejectModalKey && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
              <div className="p-6 bg-rose-600 text-white flex justify-between items-center"><h3 className="text-xl font-bold">Reject Submission</h3><button onClick={() => setRejectModalKey(null)} className="hover:bg-white/10 p-2 rounded-full transition-all"><X size={20} /></button></div>
              <div className="p-8 space-y-6">
                 <textarea value={rejectComment} onChange={(e) => setRejectComment(e.target.value)} placeholder="Reason for rejection..." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-medium text-sm outline-none focus:ring-2 focus:ring-rose-500 min-h-[120px] transition-all" />
                 <div className="flex gap-4">
                    <button onClick={() => setRejectModalKey(null)} className="flex-1 py-3 text-slate-600 font-bold bg-slate-100 rounded-xl">Cancel</button>
                    <button disabled={!rejectComment.trim()} onClick={handleReject} className="flex-[2] py-3 bg-rose-600 text-white font-black uppercase tracking-widest text-[11px] rounded-xl disabled:opacity-50">Reject Sheet</button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalsView;
