import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Lock, 
  Unlock, 
  UserCog, 
  ShieldAlert, 
  Calendar,
  ChevronDown,
  X,
  RefreshCw,
  Activity,
  CheckCircle2,
  Settings,
  TrendingUp,
  CheckCircle,
  Plus,
  Trash2,
  Building2,
  Building,
  LayoutGrid,
  Layers,
  Hash,
  Users,
  FileText,
  ClipboardCheck,
  ListFilter,
  FileTerminal,
  Clock,
  ArrowRight,
  Zap,
  Layout,
  Globe,
  Palette,
  Type,
  Maximize2,
  Square,
  Sparkles,
  Monitor,
  PanelLeft,
  PanelTop,
  Paintbrush,
  Rocket,
  Sun,
  Moon,
  ToggleRight,
  Circle
} from 'lucide-react';
import { Employee, TimesheetPeriod, Department, ServiceLine, TimesheetData, Client, Project, InternalCode, AppConfig } from '../types';
import CodeGenerator from './CodeGenerator';

interface UserManagementProps {
  employees: Employee[];
  departments: Department[];
  serviceLines: ServiceLine[];
  onUpdateDepartments: (depts: Department[]) => void;
  onUpdateServiceLines: (sls: ServiceLine[]) => void;
  onUpdateUser: (emp: Employee) => void;
  periods: TimesheetPeriod[];
  firstOpenYear: number | null;
  onOpenNextYear: () => void;
  onUpdatePeriodStatus: (year: number, week: number, status: TimesheetPeriod['status']) => void;
  timesheets: Record<string, TimesheetData>;
  clients: Client[];
  projects: Project[];
  internalRegistry: InternalCode[];
  setInternalRegistry: React.Dispatch<React.SetStateAction<InternalCode[]>>;
  appConfig: AppConfig;
  onUpdateAppConfig: (config: AppConfig) => void;
}

interface ValidationException {
  userName: string;
  status: string;
}

const Avatar: React.FC<{ employee: Employee; size?: string; shape?: string }> = ({ employee, size = "w-10 h-10", shape = "rounded-full" }) => {
  const initials = employee.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  const colors = [
    'bg-indigo-600', 'bg-violet-600', 'bg-emerald-600', 'bg-blue-600', 'bg-rose-600', 'bg-amber-600',
  ];
  const colorIndex = employee.name.length % colors.length;
  const bgColor = colors[colorIndex];

  return (
    <div className={`${size} ${shape} ${bgColor} flex items-center justify-center text-white text-[10px] font-black ring-2 ring-white shadow-sm flex-shrink-0 transition-all`}>
      {initials}
    </div>
  );
};

const UserManagement: React.FC<UserManagementProps> = ({ 
  employees, 
  departments,
  serviceLines,
  onUpdateDepartments,
  onUpdateServiceLines,
  onUpdateUser, 
  periods, 
  firstOpenYear, 
  onOpenNextYear, 
  onUpdatePeriodStatus,
  timesheets,
  clients,
  projects,
  internalRegistry,
  setInternalRegistry,
  appConfig,
  onUpdateAppConfig
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'periods' | 'departments' | 'servicelines' | 'codes' | 'setup'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<Employee | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'warning' } | null>(null);

  const [newDeptName, setNewDeptName] = useState('');
  const [newSLName, setNewSLName] = useState('');
  const [newSLCode, setNewSLCode] = useState('');

  const [validationExceptions, setValidationExceptions] = useState<ValidationException[]>([]);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showValidationDetails, setShowValidationDetails] = useState(false);
  const [exceptionTab, setExceptionTab] = useState<'draft' | 'approval'>('draft');
  const [pendingFinalization, setPendingFinalization] = useState<{year: number, week: number} | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const filteredUsers = useMemo(() => {
    return employees.filter(e => 
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [employees, searchTerm]);

  const managedYears = useMemo(() => {
    const years = Array.from(new Set(periods.map(p => p.year))).sort((a: number, b: number) => a - b);
    return years;
  }, [periods]);

  const toggleStatus = (user: Employee) => {
    const nextStatus = user.systemStatus === 'Active' ? 'Revoked' : 'Active';
    onUpdateUser({ ...user, systemStatus: nextStatus as any });
    showToast(`Access ${nextStatus === 'Active' ? 'restored' : 'revoked'}`, nextStatus === 'Active' ? 'success' : 'warning');
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    return `${String(date.getDate()).padStart(2, '0')}-${date.toLocaleString('en-US', { month: 'short' })}-${String(date.getFullYear()).slice(-2)}`;
  };

  const handleStatusChange = (period: TimesheetPeriod, newStatus: TimesheetPeriod['status']) => {
    if (newStatus === 'CLOSED') {
      const exceptions: ValidationException[] = [];
      const activeResources = employees.filter(e => e.isActive);

      activeResources.forEach(emp => {
        const key = `${emp.id}-${period.startDate}`;
        const sheet = timesheets[key];
        
        if (sheet && sheet.status !== 'Approved') {
          exceptions.push({
            userName: emp.name,
            status: sheet.status
          });
        }
      });

      if (exceptions.length > 0) {
        setValidationExceptions(exceptions);
        setPendingFinalization({ year: period.year, week: period.week });
        setShowValidationModal(true);
        setShowValidationDetails(false); 
        setExceptionTab(exceptions.some(ex => ex.status === 'Submitted') ? 'approval' : 'draft');
        return;
      }
    }

    onUpdatePeriodStatus(period.year, period.week, newStatus);
  };

  const validationSummary = useMemo(() => {
    const draft = validationExceptions.filter(ex => ex.status === 'Draft' || ex.status === 'Rejected').length;
    const approval = validationExceptions.filter(ex => ex.status === 'Submitted').length;
    return { draft, approval };
  }, [validationExceptions]);

  const handleAddDept = () => {
    if (!newDeptName.trim()) return;
    const newDept: Department = { id: `D-${Date.now()}`, name: newDeptName.trim() };
    onUpdateDepartments([...departments, newDept]);
    setNewDeptName('');
    showToast(`${newDept.name} added`);
  };

  const updateAppConfig = (changes: Partial<AppConfig>) => {
    onUpdateAppConfig({ ...appConfig, ...changes });
    showToast('Configuration Updated');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      {toast && (
        <div className="fixed top-24 right-8 z-[110] animate-in slide-in-from-right-10 fade-in duration-300">
          <div className={`px-6 py-3 rounded-2xl shadow-2xl border flex items-center gap-3 ${
            toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-indigo-50 border-indigo-200 text-indigo-800'
          }`}>
            <span className="text-[10px] font-black uppercase tracking-widest">{toast.message}</span>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-end justify-between px-1 gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Layout className="text-brand" size={24} />
            {activeTab === 'users' ? 'User Access' : activeTab === 'periods' ? 'Period Control' : activeTab === 'setup' ? 'Global Setup' : 'Registry Management'}
          </h1>
          <p className="text-sm text-slate-500 font-medium">Core platform governance and UI/UX configuration.</p>
        </div>
        <div className="flex bg-white p-1.5 rounded-[1.25rem] border border-slate-200 shadow-sm overflow-x-auto tab-switcher">
           {[
             { id: 'users', label: 'Users', icon: Users },
             { id: 'periods', label: 'Periods', icon: Calendar },
             { id: 'departments', label: 'Units', icon: Building2 },
             { id: 'servicelines', label: 'Lines', icon: Layers },
             { id: 'setup', label: 'Setup', icon: Settings },
             { id: 'codes', label: 'Codes', icon: FileTerminal }
           ].map(tab => (
             <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === tab.id ? 'bg-brand text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'}`}>
               <tab.icon size={14} /> {tab.label}
             </button>
           ))}
        </div>
      </div>

      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row items-center justify-between gap-4">
             <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-2xl border border-slate-200 max-w-sm w-full">
                <Search size={16} className="text-slate-400" />
                <input type="text" placeholder="Filter users..." className="bg-transparent border-none outline-none text-xs w-full text-slate-600 font-bold" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
             </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                  <th className="p-5 text-left border-r border-slate-200/50">Identity</th>
                  <th className="p-5 text-left border-r border-slate-200/50">Privileges</th>
                  <th className="p-5 text-center border-r border-slate-200/50">Status</th>
                  <th className="p-5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map(user => (
                  <tr key={user.id} className="group hover:bg-brand/5">
                    <td className="p-5 border-r border-slate-200/50">
                      <div className="flex items-center gap-4">
                        <Avatar employee={user} shape="rounded-2xl" size="w-11 h-11" />
                        <div className="min-w-0">
                          <div className="font-black text-slate-900 text-[13px]">{user.name}</div>
                          <div className="text-[10px] text-slate-400 font-bold truncate">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-5 border-r border-slate-200/50">
                       <div className="text-[11px] font-black text-slate-700">{user.designation}</div>
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{user.role}</span>
                    </td>
                    <td className="p-5 border-r border-slate-200/50 text-center">
                       <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border ${user.systemStatus === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>{user.systemStatus || 'Active'}</span>
                    </td>
                    <td className="p-5 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <button onClick={() => { setSelectedUser(user); setIsEditing(true); }} className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-brand"><Settings size={14} /></button>
                        <button onClick={() => toggleStatus(user)} className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-rose-500"><Lock size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'periods' && (
        <div className="space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-6">
               <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center border border-indigo-100 shadow-inner">
                  <Rocket size={28} />
               </div>
               <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Year Lifecycle Control</h3>
                  <div className="flex items-center gap-3 mt-1.5">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Currently Managed:</span>
                     <div className="flex gap-2">
                        {managedYears.map(year => (
                           <span key={year} className="px-2 py-0.5 bg-indigo-600 text-white rounded-lg text-[10px] font-black shadow-lg shadow-indigo-100">{year}</span>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
            <button 
              onClick={onOpenNextYear}
              className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl hover:bg-brand transition-all flex items-center gap-3 active:scale-95"
            >
               <Plus size={18} /> Provision {managedYears[managedYears.length - 1] + 1} Cycles
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto max-h-[60vh]">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 z-20 bg-slate-50 border-b">
                  <tr className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                    <th className="p-5 text-center w-24">Cycle</th>
                    <th className="p-5 text-center">Logic Range</th>
                    <th className="p-5 text-left">Status Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {periods.map((period) => (
                    <tr key={`${period.year}-${period.week}`} className="hover:bg-slate-50/50">
                      <td className="p-5 text-center font-black text-slate-900 text-sm">
                        <span className="text-[10px] text-slate-300 mr-1">{period.year}</span>W{period.week}
                      </td>
                      <td className="p-5 text-center">
                         <div className="flex items-center justify-center gap-3 text-[11px] font-bold text-slate-500">
                            <span>{formatDate(period.startDate)}</span>
                            <ArrowRight size={10} className="text-slate-300" />
                            <span>{formatDate(period.endDate)}</span>
                         </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-between px-4">
                          <div className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-2xl border ${period.status === 'OPEN' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>{period.status}</div>
                          <select value={period.status} onChange={(e) => handleStatusChange(period, e.target.value as any)} className="appearance-none bg-white border border-slate-200 rounded-2xl px-4 py-2 text-[10px] font-black uppercase tracking-widest outline-none shadow-sm pr-10 relative">
                             <option value="OPEN">Unlock</option>
                             <option value="CLOSED">Finalize</option>
                             <option value="NEVER OPENED">Lock</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'setup' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           <div className="lg:col-span-8 space-y-8 pb-20">
              {/* SECTION: FIRM IDENTITY */}
              <div className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-sm space-y-10">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white bg-brand shadow-xl"><Palette size={24} /></div>
                    <div>
                       <h3 className="text-xl font-black text-slate-900">Firm Identity</h3>
                       <p className="text-xs text-slate-500 font-medium">Define your corporate visual DNA.</p>
                    </div>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8 border-t border-slate-100">
                    <div className="space-y-6">
                       <div className="flex justify-between items-end">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Primary Brand HEX</h4>
                          <span className="text-[10px] font-black text-brand uppercase">{appConfig.brandColor}</span>
                       </div>
                       <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                          <input 
                             type="color" 
                             value={appConfig.brandColor} 
                             onChange={(e) => updateAppConfig({ brandColor: e.target.value })}
                             className="w-12 h-12 rounded-xl bg-transparent cursor-pointer border-none"
                          />
                          <input 
                             type="text" 
                             value={appConfig.brandColor} 
                             onChange={(e) => updateAppConfig({ brandColor: e.target.value })}
                             className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-brand/10"
                          />
                       </div>
                       <div className="flex flex-wrap gap-2 pt-2">
                          {['#4f46e5', '#0891b2', '#059669', '#dc2626', '#d97706', '#7c3aed', '#db2777'].map(color => (
                            <button 
                              key={color} 
                              onClick={() => updateAppConfig({ brandColor: color })}
                              className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${appConfig.brandColor === color ? 'border-slate-900 scale-110 shadow-lg' : 'border-transparent shadow-sm'}`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                       </div>
                    </div>

                    <div className="space-y-6">
                       <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Corner Mechanics</h4>
                       <div className="grid grid-cols-3 gap-3 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                          {(['sharp', 'soft', 'round'] as const).map(r => (
                             <button key={r} onClick={() => updateAppConfig({ radius: r })} className={`py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${appConfig.radius === r ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>{r}</button>
                          ))}
                       </div>
                       <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">Applies dynamic border-radius variables firm-wide.</p>
                    </div>
                 </div>
              </div>

              {/* SECTION: LAYOUT & DENSITY */}
              <div className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-sm space-y-10">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white bg-slate-900 shadow-xl"><Maximize2 size={24} /></div>
                    <div>
                       <h3 className="text-xl font-black text-slate-900">Layout & Density</h3>
                       <p className="text-xs text-slate-500 font-medium">Calibrate interface breathing room.</p>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8 border-t border-slate-100">
                    <div className="space-y-6">
                       <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">UI Grid Density</h4>
                       <div className="grid grid-cols-3 gap-3 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                          {(['compact', 'standard', 'spacious'] as const).map(d => (
                             <button key={d} onClick={() => updateAppConfig({ density: d })} className={`py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${appConfig.density === d ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>{d}</button>
                          ))}
                       </div>
                    </div>

                    <div className="space-y-6">
                       <div className="flex justify-between items-end">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Typography Scale</h4>
                          <span className="text-[10px] font-black text-brand uppercase">{(appConfig.fontScale * 100).toFixed(0)}%</span>
                       </div>
                       <input 
                         type="range" min="0.8" max="1.2" step="0.05" 
                         value={appConfig.fontScale}
                         onChange={(e) => updateAppConfig({ fontScale: parseFloat(e.target.value) })}
                         className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-brand" 
                       />
                       <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase tracking-widest">
                          <span>Focus</span>
                          <span>Accessibility</span>
                       </div>
                    </div>
                 </div>
              </div>

              {/* SECTION: INTERFACE STYLES */}
              <div className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-sm space-y-10">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white bg-indigo-600 shadow-xl"><Paintbrush size={24} /></div>
                    <div>
                       <h3 className="text-xl font-black text-slate-900">Interface Styles</h3>
                       <p className="text-xs text-slate-500 font-medium">Control specific UI module themes.</p>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8 border-t border-slate-100">
                    <div className="space-y-6">
                       <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sidebar Theme</h4>
                       <div className="grid grid-cols-3 gap-3 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                          {(['dark', 'light', 'brand'] as const).map(t => (
                             <button key={t} onClick={() => updateAppConfig({ sidebarTheme: t })} className={`py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${appConfig.sidebarTheme === t ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>{t}</button>
                          ))}
                       </div>
                    </div>

                    <div className="space-y-6">
                       <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Top Navigation Theme</h4>
                       <div className="grid grid-cols-3 gap-3 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                          {(['white', 'glass', 'accent'] as const).map(t => (
                             <button key={t} onClick={() => updateAppConfig({ topBarTheme: t })} className={`py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${appConfig.topBarTheme === t ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>{t}</button>
                          ))}
                       </div>
                    </div>

                    <div className="space-y-6">
                       <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Dashboard Tile Style</h4>
                       <div className="grid grid-cols-2 gap-3 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                          {(['classic', 'glass', 'minimal', 'soft'] as const).map(style => (
                             <button key={style} onClick={() => updateAppConfig({ dashboardTileStyle: style })} className={`py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${appConfig.dashboardTileStyle === style ? 'bg-white text-brand shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>{style}</button>
                          ))}
                       </div>
                    </div>

                    <div className="space-y-6">
                       <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Overlays</h4>
                       <button 
                         onClick={() => updateAppConfig({ enableGlassmorphism: !appConfig.enableGlassmorphism })}
                         className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${appConfig.enableGlassmorphism ? 'bg-brand/5 border-brand text-brand shadow-md' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                       >
                          <div className="flex items-center gap-3">
                             <Sparkles size={18} />
                             <span className="text-[10px] font-black uppercase tracking-widest">Enable Glassmorphism</span>
                          </div>
                          {appConfig.enableGlassmorphism ? <ToggleRight size={24} /> : <Circle size={20} className="mr-0.5 opacity-20" />}
                       </button>
                    </div>
                 </div>
              </div>
           </div>

           {/* SIDE PANEL: PREVIEW PRESETS */}
           <div className="lg:col-span-4 space-y-6">
              <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl sticky top-8 border border-slate-800">
                 <div className="flex items-center gap-4 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center"><Monitor size={20} /></div>
                    <h3 className="text-lg font-black uppercase tracking-widest">System Preview</h3>
                 </div>
                 
                 <div className="space-y-8">
                    <div className="p-5 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                       <div className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-4">Sidebar Hook</div>
                       <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px]`} style={{ backgroundColor: appConfig.brandColor }}>TP</div>
                          <div className="h-2 w-24 bg-slate-700 rounded-full"></div>
                       </div>
                    </div>

                    <div className="p-5 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                       <div className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-4">Tile Projection</div>
                       <div className="aspect-video w-full rounded-xl border border-slate-700 bg-slate-900/50 flex flex-col justify-end p-4">
                          <div className="h-1 w-8 bg-brand mb-2" style={{ backgroundColor: appConfig.brandColor }}></div>
                          <div className="h-2 w-16 bg-white/20 rounded-full mb-1"></div>
                          <div className="h-1 w-10 bg-white/10 rounded-full"></div>
                       </div>
                    </div>

                    <div className="pt-4 border-t border-slate-800 space-y-4">
                       <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Configuration Payload</h4>
                       <div className="bg-black/40 p-4 rounded-xl font-mono text-[9px] text-emerald-400/80 leading-relaxed overflow-hidden">
                          {JSON.stringify(appConfig, null, 2)}
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {showValidationModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-[440px] overflow-hidden border border-white">
              <div className="p-8 bg-rose-600 text-white flex justify-between items-center relative">
                 <div className="flex items-center gap-5 relative z-10">
                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center border border-white/30"><ShieldAlert size={32} /></div>
                    <div>
                      <h2 className="text-2xl font-black uppercase">Governance Audit</h2>
                      <p className="text-rose-100 text-[10px] font-black uppercase mt-1">Period: W{pendingFinalization?.week}</p>
                    </div>
                 </div>
                 <button onClick={() => setShowValidationModal(false)} className="p-2 hover:bg-white/10 rounded-full"><X size={24} /></button>
              </div>
              <div className="p-8 space-y-8">
                 <p className="text-center text-sm font-bold text-slate-500">Firm-wide finalization is <span className="text-rose-600 font-black">STALLED</span> due to pending sheets.</p>
                 <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => setExceptionTab('draft')} className={`p-6 bg-white border rounded-[2rem] flex flex-col items-center justify-center transition-all ${exceptionTab === 'draft' ? 'ring-4 ring-rose-500/20 border-rose-600 shadow-xl' : 'border-slate-100'}`}>
                       <div className="text-5xl font-black text-slate-900 leading-none mb-1.5">{validationSummary.draft}</div>
                       <div className="text-[10px] font-black text-slate-400 uppercase">In Draft</div>
                    </button>
                    <button onClick={() => setExceptionTab('approval')} className={`p-6 bg-white border rounded-[2rem] flex flex-col items-center justify-center transition-all ${exceptionTab === 'approval' ? 'ring-4 ring-brand/20 border-brand shadow-xl' : 'border-slate-100'}`}>
                       <div className="text-5xl font-black text-slate-900 leading-none mb-1.5">{validationSummary.approval}</div>
                       <div className="text-[10px] font-black text-slate-400 uppercase">Submitted</div>
                    </button>
                 </div>
                 <button onClick={() => setShowValidationModal(false)} className="w-full py-5 bg-slate-950 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl">Acknowledge Protocol</button>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'departments' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-10 shadow-sm space-y-8">
           <div className="flex gap-4 p-8 bg-slate-50 rounded-[2rem] border border-slate-100 shadow-inner">
              <input value={newDeptName} onChange={(e) => setNewDeptName(e.target.value)} placeholder="Unit name..." className="flex-1 px-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold shadow-sm" />
              <button onClick={handleAddDept} className="px-10 bg-brand text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl">Add Unit</button>
           </div>
           <div className="grid grid-cols-3 gap-6">
              {departments.map(d => (
                <div key={d.id} className="p-6 bg-white border border-slate-100 rounded-3xl flex justify-between items-center group hover:border-brand/30 transition-all">
                  <span className="font-black text-slate-900">{d.name}</span>
                  <button onClick={() => onUpdateDepartments(departments.filter(x => x.id !== d.id))} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16}/></button>
                </div>
              ))}
           </div>
        </div>
      )}

      {activeTab === 'codes' && <CodeGenerator clients={clients} projects={projects} serviceLines={serviceLines} internalRegistry={internalRegistry} setInternalRegistry={setInternalRegistry} />}
    </div>
  );
};

export default UserManagement;