import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  X, 
  Calendar, 
  Clock, 
  Search,
  Info,
  ChevronDown,
  Briefcase,
  Trash2
} from 'lucide-react';
import { Employee, Project, Assignment, InternalCode, ProjectType, TimesheetPeriod } from '../types';

interface ResourceGridProps {
  employees: Employee[];
  projects: Project[];
  internalRegistry: InternalCode[];
  assignments: Assignment[];
  onAddAssignments: (asgns: Assignment[]) => void;
  onDeleteAssignment: (id: string) => void;
  onDeleteWeekAssignments: (eId: string, pId: string, dr: string[]) => void;
  periods: TimesheetPeriod[];
}

const Avatar: React.FC<{ employee: Employee; size?: string }> = ({ employee, size = "w-10 h-10" }) => {
  const initials = employee.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  const colors = [
    'bg-indigo-600', 'bg-emerald-600', 'bg-rose-600', 'bg-amber-600', 'bg-violet-600', 'bg-cyan-600'
  ];
  const colorIndex = employee.name.length % colors.length;
  const bgColor = colors[colorIndex];

  return (
    <div className={`${size} rounded-full ${bgColor} flex items-center justify-center text-white text-[11px] font-black ring-2 ring-white shadow-md flex-shrink-0 ${!employee.isActive ? 'grayscale opacity-50' : ''}`}>
      {initials}
    </div>
  );
};

const ResourceGrid: React.FC<ResourceGridProps> = ({ 
  employees, 
  projects, 
  internalRegistry,
  assignments, 
  onAddAssignments, 
  onDeleteAssignment,
  periods
}) => {
  // Initialize to current week if available, otherwise first week
  const [currentPeriodIdx, setCurrentPeriodIdx] = useState(() => {
    if (periods.length === 0) return 0;
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const idx = periods.findIndex(p => today >= p.startDate && today <= p.endDate);
    return idx !== -1 ? idx : 0;
  });

  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [hours, setHours] = useState(8);
  const [isFullWeek, setIsFullWeek] = useState(true);

  const activePeriod = periods[currentPeriodIdx] || null;

  const weekDates = useMemo(() => {
    if (!activePeriod) return [];
    const dates = [];
    const start = new Date(activePeriod.startDate + 'T12:00:00');
    for (let i = 0; i < 7; i++) { 
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      dates.push(`${year}-${month}-${day}`); 
    }
    return dates;
  }, [activePeriod]);

  // Combine both actual projects and active internal registry codes for use in the planner
  const allAvailableProjects = useMemo(() => {
    const internalAsProjects: Project[] = internalRegistry
      .filter(item => item.isActive) // Only active codes for new bookings
      .map(item => ({
        id: item.id,
        clientId: 'INTERNAL',
        name: item.description,
        code: item.code,
        type: ProjectType.INTERNAL,
        isActive: true
      }));
    
    const projectCodes = new Set(projects.map(p => p.code));
    const uniqueInternals = internalAsProjects.filter(p => !projectCodes.has(p.code));

    return [...projects.filter(p => p.isActive), ...uniqueInternals];
  }, [projects, internalRegistry]);

  // For displaying existing assignments, we need to be able to find even inactive projects/internal codes
  const displayProjectLookup = useMemo(() => {
    const internalAsProjects: Project[] = internalRegistry.map(item => ({
      id: item.id,
      clientId: 'INTERNAL',
      name: item.description,
      code: item.code,
      type: ProjectType.INTERNAL,
      isActive: item.isActive
    }));
    return [...projects, ...internalAsProjects];
  }, [projects, internalRegistry]);

  const filteredEmployees = useMemo(() => {
    return employees.filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [employees, searchTerm]);

  const handleSubmit = () => {
    if (!selectedEmpId || !selectedProjectId) return;
    
    const newAsgns: Assignment[] = [];
    const datesToBook = isFullWeek 
      ? weekDates // Book all 7 days Monday to Sunday
      : [selectedDate || weekDates[0]];
    
    datesToBook.forEach(date => {
      newAsgns.push({ 
        id: `A-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, 
        employeeId: selectedEmpId, 
        projectId: selectedProjectId, 
        date: date, 
        hours 
      });
    });
    
    onAddAssignments(newAsgns);
    setShowModal(false);
  };

  const calculateFinancialImpact = () => {
    const emp = employees.find(e => e.id === selectedEmpId);
    if (!emp) return 0;
    
    const proj = allAvailableProjects.find(p => p.id === selectedProjectId);
    if (proj?.type === ProjectType.INTERNAL || proj?.type === ProjectType.NON_BILLABLE) return 0;

    const factor = isFullWeek ? 7 : 1;
    return emp.chargeRate * hours * factor;
  };

  const getCapacityPercent = (empId: string) => {
    const total = assignments
      .filter(a => a.employeeId === empId && weekDates.includes(a.date))
      .reduce((s, a) => s + a.hours, 0);
    return Math.round((total / 40) * 100);
  };

  const currentAllocations = useMemo(() => {
    if (!selectedEmpId) return [];
    
    const empAssignments = assignments.filter(a => 
      a.employeeId === selectedEmpId && weekDates.includes(a.date)
    );

    const grouped: Record<string, { code: string, name: string, totalHours: number, type: ProjectType }> = {};
    empAssignments.forEach(asgn => {
      if (!grouped[asgn.projectId]) {
        const proj = displayProjectLookup.find(p => p.id === asgn.projectId);
        grouped[asgn.projectId] = {
          code: proj?.code || 'UNK',
          name: proj?.name || 'Unknown Item',
          totalHours: 0,
          type: proj?.type || ProjectType.NON_BILLABLE
        };
      }
      grouped[asgn.projectId].totalHours += asgn.hours;
    });

    return Object.values(grouped);
  }, [selectedEmpId, assignments, displayProjectLookup, weekDates]);

  const handleOpenModal = (empId: string, date: string | null = null, fullWeek: boolean = true) => {
    setSelectedEmpId(empId);
    setSelectedDate(date);
    setIsFullWeek(fullWeek);
    setSelectedProjectId('');
    setHours(8);
    setShowModal(true);
  };

  const formatDateRangeLabel = (startStr: string, endStr: string) => {
    const start = new Date(startStr + 'T12:00:00');
    const end = new Date(endStr + 'T12:00:00');
    const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'short' });
    return `${monthFormatter.format(start)} ${start.getDate()} - ${monthFormatter.format(end)} ${end.getDate()}`;
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onDeleteAssignment(id);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between px-1">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Resource Planner</h1>
          <p className="text-sm text-slate-500 font-medium">Schedule work and manage team bandwidth with financial visibility.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white border border-slate-200 rounded-xl px-2 py-2 shadow-sm">
            <button 
              disabled={currentPeriodIdx === 0}
              onClick={() => setCurrentPeriodIdx(prev => Math.max(0, prev - 1))} 
              className="p-1 text-slate-400 hover:text-brand transition-colors disabled:opacity-20"
            >
              <ChevronLeft size={20}/>
            </button>
            <span className="px-6 text-sm font-bold text-slate-700 min-w-[160px] text-center">
              {activePeriod ? formatDateRangeLabel(activePeriod.startDate, activePeriod.endDate) : 'Loading...'}
            </span>
            <button 
              disabled={currentPeriodIdx === periods.length - 1}
              onClick={() => setCurrentPeriodIdx(prev => Math.min(periods.length - 1, prev + 1))} 
              className="p-1 text-slate-400 hover:text-brand transition-colors disabled:opacity-20"
            >
              <ChevronRight size={20}/>
            </button>
          </div>
          <button 
            onClick={() => handleOpenModal('', null, true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand text-white rounded-lg text-sm font-bold shadow-lg shadow-brand/20 hover:brightness-110 transition-all active:scale-95"
          >
            <Plus size={18} /> New Booking
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="sticky left-0 bg-slate-50 z-20 p-4 text-left w-72 border-r border-slate-200/50">
                  <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-lg border border-slate-200 max-w-[240px]">
                    <Search size={14} className="text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search by name or skill..." 
                      className="bg-transparent border-none outline-none text-xs w-full text-slate-600 font-medium" 
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                  </div>
                </th>
                {weekDates.map(d => {
                  const parts = d.split('-');
                  const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), 12, 0, 0);
                  return (
                    <th key={d} className="p-4 text-center border-l border-slate-100 min-w-[120px]">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                      <div className="text-sm font-bold text-slate-600 mt-0.5">{date.getDate()}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEmployees.map(emp => {
                const cap = getCapacityPercent(emp.id);
                return (
                  <tr key={emp.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="sticky left-0 bg-white z-20 p-4 border-r border-slate-200/50 group-hover:bg-slate-50/80 transition-colors">
                      <div className="flex items-center gap-4">
                        <Avatar employee={emp} />
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-slate-900 text-sm truncate">{emp.name}</div>
                          <div className="flex items-center gap-2 mt-1">
                             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-1.5 py-0.5 rounded">{emp.designation}</span>
                             <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${cap > 100 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                               {cap}% cap
                             </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    {weekDates.map(date => {
                      const dayAsgns = assignments.filter(a => a.employeeId === emp.id && a.date === date);
                      return (
                        <td 
                          key={date} 
                          className="p-1 border-l border-slate-100 align-top h-24 hover:bg-slate-50/80 transition-all cursor-pointer group/cell relative"
                          onClick={() => handleOpenModal(emp.id, date, false)}
                        >
                          <div className="flex flex-col gap-1.5 relative z-10">
                            {dayAsgns.map(a => {
                              const proj = displayProjectLookup.find(p => p.id === a.projectId);
                              const isInternal = proj?.type === ProjectType.INTERNAL || proj?.type === ProjectType.NON_BILLABLE;
                              return (
                                <div key={a.id} className={`p-2 rounded-md flex items-center justify-between text-[10px] font-bold shadow-sm group/chip transition-colors relative z-10 ${isInternal ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-brand text-white hover:brightness-110'}`}>
                                  <span className="truncate pr-2">{proj?.code}</span>
                                  <div className="flex items-center gap-1">
                                    <span className="opacity-80 flex-shrink-0">{a.hours}h</span>
                                    <button 
                                      onClick={(e) => handleDelete(e, a.id)}
                                      className="ml-1 p-0.5 rounded-full hover:bg-white/20 transition-colors"
                                      title="Remove booking"
                                    >
                                      <X size={10} />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/cell:opacity-100 transition-opacity pointer-events-none z-20">
                            <div className="bg-emerald-500 text-white p-1 rounded-full shadow-lg transform scale-90 group-hover/cell:scale-100 transition-transform pointer-events-auto">
                              <Plus size={16} />
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 ring-1 ring-black/5 flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-brand/20 text-brand rounded-lg flex items-center justify-center border border-brand/30">
                  <Calendar size={16} />
                </div>
                <div>
                  <h2 className="text-lg font-bold tracking-tight leading-none">{isFullWeek ? 'Full Week' : 'Single Day'} Booking</h2>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="hover:bg-white/10 p-1.5 rounded-full transition-colors"><X size={18}/></button>
            </div>

            <div className="flex h-[420px] overflow-hidden">
              <div className="flex-[1.2] p-5 space-y-4 overflow-y-auto border-r border-slate-100">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 px-0.5 tracking-widest">Resource</label>
                    <div className="relative">
                      <select 
                        value={selectedEmpId} 
                        onChange={e => setSelectedEmpId(e.target.value)}
                        className="w-full appearance-none p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-brand outline-none transition-all pr-8"
                      >
                        <option value="">Select an employee...</option>
                        {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-end px-0.5">
                      <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Schedule</label>
                      <button 
                        onClick={() => setIsFullWeek(!isFullWeek)}
                        className="text-brand text-[9px] font-black uppercase tracking-tight hover:underline"
                      >
                        {isFullWeek ? 'Single Day' : 'Full Week'}
                      </button>
                    </div>
                    <div className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span className="truncate">
                        {isFullWeek ? (
                           `Week: ${new Date(weekDates[0] + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(weekDates[6] + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                        ) : (
                           new Date((selectedDate || weekDates[0]) + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                        )}
                      </span>
                      <Calendar size={14} className="text-slate-400 flex-shrink-0" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 px-0.5 tracking-widest">Engagement</label>
                    <div className="relative">
                      <select 
                        value={selectedProjectId}
                        onChange={e => setSelectedProjectId(e.target.value)}
                        className="w-full appearance-none p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-brand outline-none transition-all pr-8"
                      >
                        <option value="">Select an engagement...</option>
                        {allAvailableProjects.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.code} - {p.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="w-20 space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-400 px-0.5 tracking-widest">Hours</label>
                      <input 
                        type="number" 
                        value={hours} 
                        onChange={e => setHours(parseFloat(e.target.value))}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:ring-2 focus:ring-brand outline-none text-base text-center" 
                      />
                    </div>
                    <div className="flex-1 p-3 bg-brand/10 rounded-xl border border-brand/20 flex flex-col justify-center">
                       <span className="text-[8px] font-black uppercase text-brand/60 tracking-widest">Impact</span>
                       <div className="text-lg font-black text-brand mt-0.5">$ +{calculateFinancialImpact().toLocaleString()}</div>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleSubmit}
                  className="w-full py-3 bg-brand text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-brand/20 hover:brightness-110 transition-all active:scale-[0.98]"
                >
                  Confirm Booking
                </button>
              </div>

              <div className="flex-1 bg-slate-50 flex flex-col h-full overflow-hidden">
                <div className="p-5 space-y-4 flex-shrink-0">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-slate-900">
                      <div className="w-5 h-5 flex items-center justify-center text-brand">
                        <Info size={14} />
                      </div>
                      <h4 className="text-[9px] font-black uppercase tracking-widest">Bandwidth</h4>
                    </div>
                    
                    <div className="space-y-1.5">
                      {(() => {
                          const billableHours = currentAllocations
                            .filter(a => a.type === ProjectType.BILLABLE)
                            .reduce((sum, item) => sum + item.totalHours, 0);
                          const internalHours = currentAllocations
                            .filter(a => a.type === ProjectType.INTERNAL || a.type === ProjectType.NON_BILLABLE)
                            .reduce((sum, item) => sum + item.totalHours, 0);
                          
                          const totalHours = billableHours + internalHours;
                          
                          return (
                            <>
                              <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden p-0.5 border border-slate-300/30 flex">
                                <div 
                                  className="h-full rounded-l-full transition-all duration-1000 bg-brand" 
                                  style={{ width: `${(billableHours / Math.max(40, totalHours)) * 100}%` }}
                                ></div>
                                <div 
                                  className={`h-full transition-all duration-1000 bg-amber-500 ${internalHours + billableHours >= 40 ? 'rounded-r-full' : ''}`} 
                                  style={{ width: `${(internalHours / Math.max(40, totalHours)) * 100}%` }}
                                ></div>
                              </div>
                              <div className="flex justify-between text-[9px] font-bold text-slate-400">
                                <span className={totalHours > 40 ? 'text-rose-600 font-black' : 'text-slate-600 font-black'}>
                                  {totalHours}h / 40h Load 
                                  <span className="ml-1 opacity-60">({billableHours}B + {internalHours}I)</span>
                                </span>
                              </div>
                            </>
                          );
                      })()}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-1 border-t border-slate-200/60">
                    <div className="flex items-center gap-1.5">
                       <div className="w-2 h-2 rounded-full bg-brand"></div>
                       <span className="text-[8px] font-bold text-slate-600 uppercase">Billable</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                       <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                       <span className="text-[8px] font-bold text-slate-600 uppercase">Leave/Internal</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col flex-1 min-h-0 border-t border-slate-200 bg-white shadow-sm">
                  <div className="px-5 pt-3 pb-1.5 flex items-center gap-2 text-slate-900 flex-shrink-0">
                    <div className="w-5 h-5 flex items-center justify-center text-brand">
                      <Briefcase size={14} />
                    </div>
                    <h4 className="text-[9px] font-black uppercase tracking-widest">Current Items</h4>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                    {currentAllocations.length > 0 ? currentAllocations.map(alloc => (
                      <div key={alloc.code} className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between group flex-shrink-0 hover:border-brand/30 transition-colors shadow-sm">
                        <div className="min-w-0 pr-2">
                          <div className={`text-[8px] font-black uppercase tracking-widest ${(alloc.type === ProjectType.INTERNAL || alloc.type === ProjectType.NON_BILLABLE) ? 'text-amber-600' : 'text-brand'}`}>{alloc.code}</div>
                          <div className="text-[10px] font-bold text-slate-800 truncate">{alloc.name}</div>
                        </div>
                        <div className="flex-shrink-0 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 text-[10px] font-black text-slate-600">
                          {alloc.totalHours}h
                        </div>
                      </div>
                    )) : (
                      <div className="p-6 text-center border border-dashed border-slate-200 rounded-xl flex-shrink-0">
                         <p className="text-[10px] font-bold text-slate-400 italic">No allocations.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourceGrid;