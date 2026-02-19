import React, { useState, useMemo, useEffect } from 'react';
import { 
  Save, 
  Send, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Trash2, 
  Clock, 
  CheckCircle2,
  Calendar,
  AlertCircle,
  Search,
  ChevronDown,
  X,
  FileCheck,
  ShieldAlert,
  Globe,
  MessageSquare,
  User,
  Lock,
  Layers
} from 'lucide-react';
import { Employee, Project, Assignment, InternalCode, ProjectType, TimesheetData, TimesheetStatus, TimesheetPeriod } from '../types';

interface TimesheetAppProps {
  employees: Employee[];
  assignments: Assignment[];
  projects: Project[];
  internalRegistry: InternalCode[];
  drafts: Record<string, TimesheetData>;
  onSaveDraft: (empId: string, weekStart: string, data: TimesheetData) => void;
  periods: TimesheetPeriod[];
  currentUserId: string;
}

const Avatar: React.FC<{ employee?: Employee; size?: string }> = ({ employee, size = "w-10 h-10" }) => {
  if (!employee) return <div className={`${size} rounded-full bg-slate-200 animate-pulse`} />;
  
  const initials = employee.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  const colors = [
    'bg-[#06b6d4]', // Cyan
    'bg-[#6366f1]', // Indigo
    'bg-[#8b5cf6]', // Violet/Purple
    'bg-[#ec4899]', // Pink
    'bg-[#10b981]', // Emerald
    'bg-[#f59e0b]', // Amber
  ];
  const colorIndex = employee.name.length % colors.length;
  const bgColor = colors[colorIndex];

  return (
    <div className={`${size} rounded-full ${bgColor} flex items-center justify-center text-white text-[11px] font-black ring-2 ring-white shadow-md flex-shrink-0 transition-all`}>
      {initials}
    </div>
  );
};

const TimesheetApp: React.FC<TimesheetAppProps> = ({ 
  employees, 
  assignments, 
  projects, 
  internalRegistry,
  drafts,
  onSaveDraft,
  periods,
  currentUserId
}) => {
  const formatDateRangeLabel = (startStr: string, endStr: string) => {
    const start = new Date(startStr + 'T12:00:00');
    const end = new Date(endStr + 'T12:00:00');
    const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'short' });
    return `${monthFormatter.format(start)} ${start.getDate()} - ${monthFormatter.format(end)} ${end.getDate()}`;
  };

  const openPeriods = useMemo(() => periods.filter(p => p.status === 'OPEN'), [periods]);
  const [currentPeriodIdx, setCurrentPeriodIdx] = useState(0);
  
  const activePeriod = openPeriods[currentPeriodIdx] || null;
  const currentWeekStart = activePeriod ? new Date(activePeriod.startDate + 'T12:00:00') : null;

  const [status, setStatus] = useState<TimesheetStatus>('Draft');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [userComment, setUserComment] = useState('');
  
  const [manualProjectIds, setManualProjectIds] = useState<string[]>([]);
  const [timeEntries, setTimeEntries] = useState<Record<string, number>>({});
  const [selectedToAdd, setSelectedToAdd] = useState('');
  const [isSaved, setIsSaved] = useState(true);

  const selectedEmployee = useMemo(() => employees.find(e => e.id === currentUserId), [employees, currentUserId]);
  const weekStartStr = useMemo(() => activePeriod?.startDate || '', [activePeriod]);
  const draftKey = `${currentUserId}-${weekStartStr}`;

  const weekDates = useMemo(() => {
    if (!currentWeekStart) return [];
    const dates = [];
    const temp = new Date(currentWeekStart);
    for (let i = 0; i < 7; i++) {
      const y = temp.getFullYear();
      const m = String(temp.getMonth() + 1).padStart(2, '0');
      const d = String(temp.getDate()).padStart(2, '0');
      dates.push(`${y}-${m}-${d}`);
      temp.setDate(temp.getDate() + 1);
    }
    return dates;
  }, [currentWeekStart]);

  // Robustly identify only the billable projects assigned to this user in the planner FOR THE SPECIFIC SELECTED WEEK
  const userAssignedProjectIds = useMemo(() => {
    if (!currentUserId || !assignments || weekDates.length === 0) return new Set<string>();
    const assignedIds = new Set<string>();
    const weekSet = new Set(weekDates);
    
    assignments.forEach(a => {
      // Must match user AND must be within the currently selected week dates
      if (a.employeeId === currentUserId && weekSet.has(a.date)) {
        assignedIds.add(String(a.projectId).trim());
      }
    });
    return assignedIds;
  }, [assignments, currentUserId, weekDates]);

  useEffect(() => {
    if (!activePeriod) return;
    
    const existingDraft = drafts[draftKey];
    if (existingDraft) {
      setManualProjectIds(existingDraft.manualProjectIds || []);
      setTimeEntries(existingDraft.timeEntries || {});
      setStatus(existingDraft.status || 'Draft');
      setUserComment(existingDraft.userComment || '');
    } else {
      setManualProjectIds([]);
      setTimeEntries({});
      setStatus('Draft');
      setUserComment('');
    }
    setIsSaved(true);
  }, [draftKey, drafts, activePeriod]);

  // Restricted Logic: Internal tasks (PTO/Admin) are Global. Projects are strictly per Assignment for the viewed week.
  const restrictedDropdownItems = useMemo(() => {
    const internalTasks: Project[] = internalRegistry
      .filter(item => item.isActive) // Only show active internal codes for selection
      .map(item => ({
        id: item.id,
        clientId: 'C3',
        name: item.description,
        code: item.code,
        type: ProjectType.INTERNAL,
        isActive: true
      }));

    const assignedProjects = projects.filter(p => p.isActive && userAssignedProjectIds.has(String(p.id).trim()));

    return {
      billable: assignedProjects,
      internal: internalTasks
    };
  }, [projects, internalRegistry, userAssignedProjectIds]);

  const activeProjectsList = useMemo(() => {
    // Need to find projects/internal tasks even if they are now inactive, for existing timesheet rows
    const flatInternal: Project[] = internalRegistry.map(item => ({
      id: item.id,
      clientId: 'C3',
      name: item.description,
      code: item.code,
      type: ProjectType.INTERNAL,
      isActive: item.isActive
    }));
    const flatItems = [...projects, ...flatInternal];
    return flatItems.filter(p => manualProjectIds.includes(p.id));
  }, [manualProjectIds, projects, internalRegistry]);

  const stats = useMemo(() => {
    let rt = 0;
    let ot = 0;
    let billable = 0;
    let nonBillable = 0;

    weekDates.forEach(date => {
      let dayTotal = 0;
      activeProjectsList.forEach(p => {
        const hours = timeEntries[`${p.id}-${date}`] || 0;
        dayTotal += hours;
        
        if (p.type === ProjectType.BILLABLE) {
          billable += hours;
        } else {
          nonBillable += hours;
        }
      });
      
      rt += Math.min(8, dayTotal);
      ot += Math.max(0, dayTotal - 8);
    });

    return { rt, ot, billable, nonBillable, total: rt + ot };
  }, [weekDates, activeProjectsList, timeEntries]);

  const isLocked = status === 'Submitted' || status === 'Approved';

  const handleAddRow = () => {
    if (isLocked) return;
    if (selectedToAdd && !manualProjectIds.includes(selectedToAdd)) {
      setManualProjectIds(prev => [...prev, selectedToAdd]);
      setSelectedToAdd('');
      setIsSaved(false);
    }
  };

  const handleRemoveRow = (id: string) => {
    if (isLocked) return;
    setManualProjectIds(prev => prev.filter(pId => pId !== id));
    const newEntries = { ...timeEntries };
    weekDates.forEach(date => {
      delete newEntries[`${id}-${date}`];
    });
    setTimeEntries(newEntries);
    setIsSaved(false);
  };

  const handleInputChange = (projectId: string, date: string, value: string) => {
    if (isLocked) return;
    const val = parseFloat(value) || 0;
    setTimeEntries(prev => ({
      ...prev,
      [`${projectId}-${date}`]: val
    }));
    setIsSaved(false);
  };

  const handleSave = () => {
    if (isLocked || !activePeriod) return;
    onSaveDraft(currentUserId, weekStartStr, {
      manualProjectIds,
      timeEntries,
      status: 'Draft',
      userComment: userComment
    });
    setIsSaved(true);
  };

  const handleConfirmSubmit = () => {
    if (!activePeriod) return;
    onSaveDraft(currentUserId, weekStartStr, {
      manualProjectIds,
      timeEntries,
      status: 'Submitted',
      userComment: userComment
    });
    setStatus('Submitted');
    setIsSaved(true);
    setShowSubmitModal(false);
  };

  const calculateRowTotal = (projectId: string) => {
    return weekDates.reduce((acc, date) => acc + (timeEntries[`${projectId}-${date}`] || 0), 0);
  };

  const calculateDayTotal = (date: string) => {
    return activeProjectsList.reduce((acc, p) => acc + (timeEntries[`${p.id}-${date}`] || 0), 0);
  };

  const weeklyGoal = 40;

  if (openPeriods.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 bg-white rounded-3xl border border-slate-200 shadow-sm animate-in fade-in zoom-in-95">
        <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-rose-100">
          <ShieldAlert size={40} />
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Access Denied</h2>
        <p className="text-slate-500 font-medium mt-2 text-center max-w-sm">
          There are currently no <span className="text-rose-600 font-black">OPEN</span> fiscal periods.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="px-1 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Timesheet</h1>
          <p className="text-sm text-slate-500 font-medium">Record strictly assigned contributions and global firm tasks.</p>
        </div>
        <div className="flex gap-2">
          {!isSaved && !isLocked && (
            <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-amber-100 animate-pulse">
              <AlertCircle size={12} /> Unsaved Changes
            </div>
          )}
          {status === 'Approved' && (
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-100">
              <CheckCircle2 size={12} /> Approved
            </div>
          )}
          {status === 'Submitted' && (
            <div className="flex items-center gap-2 px-3 py-1 bg-brand/10 text-brand rounded-lg text-[10px] font-black uppercase tracking-widest border border-brand/20">
              <FileCheck size={12} /> Submitted
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap lg:flex-nowrap items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm min-h-[80px]">
        <div className="flex items-center gap-3 pr-4 border-r border-slate-100">
           <Avatar employee={selectedEmployee} />
           <div className="min-w-0">
              <div className="text-[13px] font-black text-slate-900 leading-none truncate flex items-center gap-1.5">
                {selectedEmployee?.name}
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full flex-shrink-0"></span>
              </div>
             <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1.5">{selectedEmployee?.role} Session</div>
           </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-1.5 px-3 shadow-inner">
          <button 
            disabled={currentPeriodIdx === 0}
            onClick={() => setCurrentPeriodIdx(prev => Math.max(0, prev - 1))}
            className="text-slate-300 hover:text-brand transition-all disabled:opacity-20"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="relative group px-4">
            <select 
              value={currentPeriodIdx}
              onChange={e => setCurrentPeriodIdx(parseInt(e.target.value))}
              className="bg-transparent text-[11px] font-black text-slate-700 text-center border-none outline-none focus:ring-0 appearance-none cursor-pointer pr-5"
            >
              {openPeriods.map((p, idx) => (
                <option key={`${p.year}-${p.week}`} value={idx}>
                  {formatDateRangeLabel(p.startDate, p.endDate)}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
          </div>
          <button 
            disabled={currentPeriodIdx === openPeriods.length - 1}
            onClick={() => setCurrentPeriodIdx(prev => Math.min(openPeriods.length - 1, prev + 1))}
            className="text-slate-300 hover:text-brand transition-all disabled:opacity-20"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="flex flex-1 items-center justify-end gap-x-8 px-4 overflow-hidden">
           <div className="flex items-center gap-2 whitespace-nowrap">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Time:</span>
              <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">RT {stats.rt}H / OT {stats.ot}H</span>
           </div>
           <div className="flex items-center gap-2 whitespace-nowrap">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Weekly Goal:</span>
              <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{stats.total}H / {weeklyGoal}H</span>
           </div>
        </div>
           
        <div className="flex items-center gap-2 flex-shrink-0">
          {!isLocked && (
            <>
              <button 
                onClick={handleSave} 
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all border ${
                  isSaved 
                    ? 'text-slate-400 bg-slate-50 border-slate-200 cursor-default shadow-sm' 
                    : 'text-slate-600 bg-white border-slate-200 hover:bg-slate-50 shadow-sm'
                }`}
              >
                <Save size={16} className={isSaved ? "text-slate-300" : "text-brand"} />
                <span className="text-[10px] font-black uppercase tracking-widest">Save</span>
              </button>
              <button 
                disabled={!isSaved || activeProjectsList.length === 0} 
                onClick={() => setShowSubmitModal(true)} 
                className="flex items-center gap-2 px-5 py-2.5 bg-brand text-white rounded-xl shadow-lg shadow-brand/20 hover:brightness-110 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale"
              >
                <Send size={16} className="rotate-45" />
                <span className="text-[10px] font-black uppercase tracking-widest">Submit</span>
              </button>
            </>
          )}
          {isLocked && (
             <div className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                {status === 'Approved' ? 'Approved' : 'Submitted'}
             </div>
          )}
        </div>
      </div>

      {!isLocked && (
        <div className="p-4 rounded-2xl border flex items-center gap-4 shadow-sm bg-brand/5 border-brand/10">
           <div className="flex-1 relative">
              <select 
                value={selectedToAdd}
                onChange={e => setSelectedToAdd(e.target.value)}
                className="w-full appearance-none bg-white border border-brand/20 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-brand outline-none transition-all shadow-sm"
              >
                <option value="">Add Firm Activity or Assignment...</option>
                <optgroup label="Global Firm Tasks (Available to All)">
                  {restrictedDropdownItems.internal.map(item => (
                    <option key={item.id} value={item.id} disabled={manualProjectIds.includes(item.id)}>
                      {item.code} - {item.name} {manualProjectIds.includes(item.id) ? '✓' : ''}
                    </option>
                  ))}
                </optgroup>
                <optgroup label={`Active Assignments for Week ${activePeriod?.week || ''}`}>
                  {restrictedDropdownItems.billable.length > 0 ? (
                    restrictedDropdownItems.billable.map(item => (
                      <option key={item.id} value={item.id} disabled={manualProjectIds.includes(item.id)}>
                        {item.code} - {item.name} {manualProjectIds.includes(item.id) ? '✓' : ''}
                      </option>
                    ))
                  ) : (
                    <option disabled>No assignments found for this week in Planner</option>
                  )}
                </optgroup>
              </select>
              <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
           </div>
           <button disabled={!selectedToAdd} onClick={handleAddRow} className="px-6 py-3 bg-brand text-white rounded-xl text-sm font-black uppercase tracking-widest shadow-lg shadow-brand/20 hover:brightness-110 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2">
              <Plus size={18} /> Add Row
           </button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col ring-1 ring-slate-200/50">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse table-fixed min-w-[1100px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <th className="p-4 text-left w-72 border-r border-slate-200/50">Project & Activity</th>
                <th className="p-4 text-center w-24 border-r border-slate-200/50">Status</th>
                {weekDates.map(date => {
                  const parts = date.split('-');
                  const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), 12, 0, 0);
                  const isToday = new Date().toISOString().split('T')[0] === date;
                  return (
                    <th key={date} className={`p-4 text-center border-r border-slate-200/50 ${isToday ? 'bg-brand/5 text-brand' : ''}`}>
                      <div className="uppercase tracking-tighter">{d.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                      <div className="text-sm font-black text-slate-900">{d.getDate()}</div>
                    </th>
                  );
                })}
                <th className="p-4 text-center w-24">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeProjectsList.map(project => {
                const isGlobal = project.type === ProjectType.INTERNAL;
                return (
                  <tr key={project.id} className="group hover:bg-slate-50/30 transition-colors">
                    <td className="p-4 border-r border-slate-200/50">
                      <div className="flex items-start gap-3">
                         <div className={`w-2 h-10 rounded-full mt-1 flex-shrink-0 shadow-sm ${isGlobal ? 'bg-amber-500' : 'bg-brand'}`}></div>
                         <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 mb-1">
                              <div className={`text-[10px] font-black uppercase truncate leading-none ${isGlobal ? 'text-amber-600' : 'text-brand'}`}>
                                {project.code}
                              </div>
                            </div>
                            <div className="text-[11px] font-bold text-slate-900 truncate">{project.name}</div>
                         </div>
                         {!isLocked && (
                          <button onClick={() => handleRemoveRow(project.id)} className="p-1 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100">
                            <Trash2 size={14} />
                          </button>
                         )}
                      </div>
                    </td>
                    <td className="p-4 border-r border-slate-200/50 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {status}
                    </td>
                    {weekDates.map(date => (
                      <td key={date} className="p-2 border-r border-slate-100 group-hover:bg-white/50 transition-all">
                         <input 
                          disabled={isLocked}
                          type="number" min="0" max="24" placeholder="0"
                          className={`w-full h-12 text-center text-sm font-black transition-all rounded-xl border-2 outline-none focus:border-brand focus:ring-0 ${(timeEntries[`${project.id}-${date}`] || 0) > 0 ? 'bg-brand/5 border-brand/20 text-brand' : 'bg-slate-50/50 border-transparent text-slate-400 hover:border-slate-200'}`}
                          onChange={(e) => handleInputChange(project.id, date, e.target.value)}
                          value={timeEntries[`${project.id}-${date}`] || ''}
                         />
                      </td>
                    ))}
                    <td className="p-4 text-center font-black text-sm text-slate-900">{calculateRowTotal(project.id)}h</td>
                  </tr>
                );
              })}
              {activeProjectsList.length === 0 && (
                <tr>
                  <td colSpan={10} className="p-24 text-center">
                    <div className="max-w-md mx-auto space-y-4">
                       <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-300 mx-auto border border-dashed border-slate-200"><Layers size={32} /></div>
                       <div className="space-y-2">
                          <p className="text-slate-900 font-bold text-base">Your current board is empty</p>
                          <p className="text-slate-500 text-xs font-medium leading-relaxed">
                            {userAssignedProjectIds.size > 0 
                              ? "Add internal tasks or your assigned client projects from the dropdown above to begin tracking time." 
                              : "No client assignments found for your account for this specific week in the firm's Resource Planner. Please contact your Admin to be booked for client work."}
                          </p>
                       </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest">
              <tr>
                <td colSpan={2} className="p-5 border-r border-white/5">Daily Summaries</td>
                {weekDates.map(date => {
                  const dailyTotal = calculateDayTotal(date);
                  return (
                    <td key={date} className={`p-4 text-center border-r border-white/5 ${dailyTotal > 8 ? 'text-rose-400' : 'text-brand'}`}>
                      {dailyTotal}h
                    </td>
                  );
                })}
                <td className="p-5 text-center text-emerald-400 bg-black/30">{stats.total}h</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {showSubmitModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
              <div className="p-8 bg-brand text-white flex justify-between items-center">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center border border-white/30 shadow-lg">
                       <Send size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold tracking-tight">Finalize Submission</h2>
                      <p className="text-indigo-100 text-[10px] font-black uppercase tracking-widest mt-1">Ready for Review</p>
                    </div>
                 </div>
                 <button onClick={() => setShowSubmitModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-all"><X size={24} /></button>
              </div>
              <div className="p-8 space-y-6">
                 <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3">
                    <AlertCircle className="text-brand shrink-0 mt-0.5" size={18} />
                    <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                       This action will lock your entries for the current week and route them to your project managers and line manager for authorization.
                    </p>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 px-1 tracking-widest">Submission Note (Optional)</label>
                    <textarea 
                      value={userComment}
                      onChange={(e) => setUserComment(e.target.value)}
                      placeholder="e.g. Completed all deliverables for the week..." 
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand min-h-[100px] transition-all"
                    />
                 </div>

                 <div className="flex gap-4">
                    <button 
                      onClick={() => setShowSubmitModal(false)}
                      className="flex-1 py-4 text-slate-600 font-bold bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all"
                    >
                       Go Back
                    </button>
                    <button 
                      onClick={handleConfirmSubmit}
                      className="flex-[2] py-4 bg-brand text-white font-black uppercase tracking-widest text-[11px] rounded-2xl shadow-xl shadow-brand/20 hover:brightness-110 transition-all active:scale-95"
                    >
                       Confirm Submission
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default TimesheetApp;