import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  CalendarRange, 
  Clock, 
  Users, 
  Briefcase, 
  FileTerminal, 
  TrendingUp,
  Bell,
  Search,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldAlert,
  ClipboardCheck,
  Calendar,
  Lock,
  LogIn,
  LogOut,
  User as UserIcon,
  ChevronRight,
  Key,
  Maximize,
  Minimize,
  RefreshCw,
  MonitorSmartphone,
  Receipt,
  BarChart4,
  Rocket,
  ShieldCheck,
  Zap,
  ArrowRight
} from 'lucide-react';
import DashboardView from './components/DashboardView';
import ResourceGrid from './components/ResourceGrid';
import TimesheetApp from './components/TimesheetApp';
import ClientsView from './components/ClientsView';
import ResourcesView from './components/ResourcesView';
import CodeGenerator from './components/CodeGenerator';
import WIPLedger from './components/WIPLedger';
import UserManagement from './components/UserManagement';
import ApprovalsView from './components/ApprovalsView';
import InvoicesView from './components/InvoicesView';
import ReportsView from './components/ReportsView';
import { 
  MOCK_CLIENTS, 
  MOCK_PROJECTS, 
  MOCK_EMPLOYEES, 
  MOCK_ASSIGNMENTS,
  MOCK_INTERNAL_REGISTRY,
  MOCK_DEPARTMENTS,
  MOCK_SERVICE_LINES
} from './store';
import { Client, Project, Employee, Assignment, ClientStatus, TimesheetData, TimesheetPeriod, Department, ServiceLine, Invoice, InvoiceStatus, InvoiceStatusEntry, AppConfig } from './types';

// Add global window types for aistudio helpers
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
}

const generateWeeksForYear = (year: number): TimesheetPeriod[] => {
  const periods: TimesheetPeriod[] = [];
  const firstDay = new Date(year, 0, 1, 12, 0, 0);
  let firstThursday = new Date(firstDay);
  while (firstThursday.getDay() !== 4) {
    firstThursday.setDate(firstThursday.getDate() + 1);
  }
  const firstMonday = new Date(firstThursday);
  firstMonday.setDate(firstMonday.getDate() - 3);

  const current = new Date(firstMonday);
  for (let w = 1; w <= 52; w++) {
    const start = new Date(current);
    const end = new Date(current);
    end.setDate(end.getDate() + 6);
    
    const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'short' });
    const startMonth = monthFormatter.format(start);
    const endMonth = monthFormatter.format(end);
    const startYearSuffix = String(start.getFullYear()).slice(-2);
    const endYearSuffix = String(end.getFullYear()).slice(-2);
    
    let monthTag = `${startMonth}-${startYearSuffix}`;
    if (startMonth !== endMonth || startYearSuffix !== endYearSuffix) {
      monthTag = `${startMonth}-${startYearSuffix}, ${endMonth}-${endYearSuffix}`;
    }

    const toISODate = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    periods.push({
      year,
      week: w,
      startDate: toISODate(start),
      endDate: toISODate(end),
      monthTag,
      status: 'NEVER OPENED'
    });
    current.setDate(current.getDate() + 7);
  }
  return periods;
};

const App: React.FC = () => {
  const [loggedInUser, setLoggedInUser] = useState<Employee | null>(null);
  const [activeView, setActiveView] = useState<'dashboard' | 'planner' | 'timesheets' | 'approvals' | 'clients' | 'resources' | 'ledger' | 'users' | 'invoices' | 'reports'>('dashboard');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // UI Config State
  const [appConfig, setAppConfig] = useState<AppConfig>({
    brandColor: '#4f46e5', // Indigo-600 default
    radius: 'soft',
    density: 'standard',
    fontScale: 1,
    enableGlassmorphism: true,
    sidebarTheme: 'dark',
    topBarTheme: 'white',
    dashboardTileStyle: 'classic',
    dashboardKpiColoring: 'standard'
  });

  // Apply UI Config via CSS Variables
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--brand-primary', appConfig.brandColor);
    
    const radiusMap = { sharp: '0px', soft: '16px', round: '32px' };
    root.style.setProperty('--app-radius', radiusMap[appConfig.radius]);
    
    const paddingMap = { compact: '0.75rem', standard: '1.5rem', spacious: '2.5rem' };
    root.style.setProperty('--app-padding', paddingMap[appConfig.density]);
    
    root.style.setProperty('--app-font-scale', `${appConfig.fontScale}rem`);

    // Sidebar Themes
    if (appConfig.sidebarTheme === 'dark') {
      root.style.setProperty('--sidebar-bg', '#0f172a');
      root.style.setProperty('--sidebar-text', '#94a3b8');
      root.style.setProperty('--sidebar-active-bg', appConfig.brandColor);
    } else if (appConfig.sidebarTheme === 'light') {
      root.style.setProperty('--sidebar-bg', '#ffffff');
      root.style.setProperty('--sidebar-text', '#64748b');
      root.style.setProperty('--sidebar-active-bg', `${appConfig.brandColor}15`);
    } else if (appConfig.sidebarTheme === 'brand') {
      root.style.setProperty('--sidebar-bg', appConfig.brandColor);
      root.style.setProperty('--sidebar-text', '#ffffffcc');
      root.style.setProperty('--sidebar-active-bg', 'rgba(255,255,255,0.15)');
    }

    // Top Bar Themes
    if (appConfig.topBarTheme === 'white') {
      root.style.setProperty('--topbar-bg', '#ffffff');
      root.style.setProperty('--topbar-border', '#e2e8f0');
      root.style.setProperty('--topbar-text', '#0f172a');
    } else if (appConfig.topBarTheme === 'glass') {
      root.style.setProperty('--topbar-bg', 'rgba(255, 255, 255, 0.7)');
      root.style.setProperty('--topbar-border', 'rgba(255, 255, 255, 0.4)');
      root.style.setProperty('--topbar-text', '#0f172a');
    } else if (appConfig.topBarTheme === 'accent') {
      root.style.setProperty('--topbar-bg', appConfig.brandColor);
      root.style.setProperty('--topbar-border', 'rgba(255, 255, 255, 0.1)');
      root.style.setProperty('--topbar-text', '#ffffff');
    }
    
    if (appConfig.enableGlassmorphism) {
      root.classList.add('glass-enabled');
    } else {
      root.classList.remove('glass-enabled');
    }
  }, [appConfig]);
  
  // Primary States
  const [clients, setClients] = useState<Client[]>(MOCK_CLIENTS);
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [employees, setEmployees] = useState<Employee[]>(MOCK_EMPLOYEES);
  const [departments, setDepartments] = useState<Department[]>(MOCK_DEPARTMENTS);
  const [serviceLines, setServiceLines] = useState<ServiceLine[]>(MOCK_SERVICE_LINES);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [internalRegistry, setInternalRegistry] = useState(MOCK_INTERNAL_REGISTRY);
  
  // Invoicing States
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [billedAssignmentIds, setBilledAssignmentIds] = useState<Set<string>>(new Set());

  // Timesheet Period and Data States
  const [firstOpenYear, setFirstOpenYear] = useState<number | null>(null);
  const [periods, setPeriods] = useState<TimesheetPeriod[]>([]);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [setupYearInput, setSetupYearInput] = useState('2026');
  const [timesheetDrafts, setTimesheetDrafts] = useState<Record<string, TimesheetData>>({});

  // Derive Unbilled Assignments for use in all Financial/Ledger views
  const unbilledAssignments = useMemo(() => {
    return assignments.filter(a => !billedAssignmentIds.has(a.id));
  }, [assignments, billedAssignmentIds]);

  // Login Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    if (loggedInUser && firstOpenYear === null) setShowSetupModal(true);
  }, [loggedInUser, firstOpenYear]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if ((elem as any).webkitRequestFullscreen) {
        (elem as any).webkitRequestFullscreen();
      } else if ((elem as any).msRequestFullscreen) {
        (elem as any).msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
    }
  };

  const handleSyncData = () => {
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 1200);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const userMap: Record<string, string> = {
      'hamza.mehmood': 'E1',
      'muhammad.salman': 'E2',
      'rahat.kaleem': 'E3' 
    };

    const empId = userMap[username.toLowerCase()];
    if (empId && password === '1234') {
      const user = employees.find(e => e.id === empId);
      if (user) {
        setLoggedInUser(user);
        setLoginError('');
      } else {
        setLoginError('User profile not found in system.');
      }
    } else {
      setLoginError('Invalid credentials. Please use provided PRD logins.');
    }
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    setUsername('');
    setPassword('');
    setActiveView('dashboard');
  };

  const handleInitializePeriods = () => {
    const yr = parseInt(setupYearInput);
    if (!isNaN(yr)) {
      const initialPeriods = generateWeeksForYear(yr);
      const initialDrafts: Record<string, TimesheetData> = {};

      if (initialPeriods.length >= 4) {
        // Auto-close first 3 weeks
        initialPeriods[0].status = 'CLOSED';
        initialPeriods[1].status = 'CLOSED';
        initialPeriods[2].status = 'CLOSED';
        initialPeriods[3].status = 'OPEN'; // Week 4

        // Fulfill the requirement for zero WIP/Revenue on load by initializing periods as empty.
        // We no longer pre-approve any cycles with data.
      }
      setFirstOpenYear(yr);
      setPeriods(initialPeriods);
      setTimesheetDrafts(initialDrafts);
      setShowSetupModal(false);
    }
  };

  const handleOpenNextYear = () => {
    const latestYear = Math.max(...periods.map(p => p.year));
    setPeriods([...periods, ...generateWeeksForYear(latestYear + 1)]);
  };

  const handleUpdatePeriodStatus = (year: number, week: number, status: TimesheetPeriod['status']) => {
    setPeriods(prev => prev.map(p => p.year === year && p.week === week ? { ...p, status } : p));
  };

  const handleSaveTimesheet = (empId: string, weekStart: string, data: TimesheetData) => {
    const key = `${empId}-${weekStart}`;
    setTimesheetDrafts(prev => ({
      ...prev,
      [key]: {
        ...data,
        approvals: data.status === 'Submitted' ? [] : (prev[key]?.approvals || [])
      }
    }));
  };

  const handleApproveTimesheet = (key: string, approverId: string) => {
    setTimesheetDrafts(prev => {
      const sheet = prev[key];
      if (!sheet) return prev;

      const currentApprovals = sheet.approvals || [];
      if (currentApprovals.includes(approverId)) return prev;

      const updatedApprovals = [...currentApprovals, approverId];
      
      const firstDash = key.indexOf('-');
      const empId = key.substring(0, firstDash);
      const weekStartStr = key.substring(firstDash + 1);
      const employee = employees.find(e => e.id === empId);
      
      const requiredApprovers = new Set<string>();
      if (employee?.managerId) requiredApprovers.add(employee.managerId);
      
      sheet.manualProjectIds.forEach(pId => {
        const proj = projects.find(p => p.id === pId);
        if (proj?.managerId) requiredApprovers.add(proj.managerId);
      });

      const isComplete = Array.from(requiredApprovers).every(id => updatedApprovals.includes(id));

      if (isComplete) {
          // SYNC ACTUALS TO WIP LEDGER
          setAssignments(currentAssignments => {
              const weekStart = new Date(weekStartStr + 'T12:00:00');
              const weekDates = Array.from({length: 7}, (_, i) => {
                  const d = new Date(weekStart);
                  d.setDate(weekStart.getDate() + i);
                  return d.toISOString().split('T')[0];
              });

              const filteredAssignments = currentAssignments.filter(a => 
                  !(a.employeeId === empId && weekDates.includes(a.date))
              );

              const actualAssignments: Assignment[] = [];
              (Object.entries(sheet.timeEntries) as [string, number][]).forEach(([entryKey, hours]) => {
                  if (hours <= 0) return;
                  const datePart = entryKey.slice(-10);
                  const projectIdPart = entryKey.slice(0, -11);

                  actualAssignments.push({
                      id: `ACTUAL-${empId}-${projectIdPart}-${datePart}-${Date.now()}`,
                      employeeId: empId,
                      projectId: projectIdPart,
                      date: datePart,
                      hours: hours
                  });
              });

              return [...filteredAssignments, ...actualAssignments];
          });
      }

      return {
        ...prev,
        [key]: { 
          ...sheet, 
          approvals: updatedApprovals,
          status: isComplete ? 'Approved' : 'Submitted' 
        }
      };
    });
  };

  const handleRejectTimesheet = (key: string, comment: string) => {
    setTimesheetDrafts(prev => ({
      ...prev,
      [key]: { ...prev[key], status: 'Rejected', managerComment: comment, approvals: [] }
    }));
  };

  // Billing Handlers with Robust Split Reconciliation
  const handleCreateInvoice = (invoice: Invoice, consumptionMap: Record<string, number>) => {
    const now = new Date().toISOString().split('T')[0];
    const initialEntry: InvoiceStatusEntry = {
        status: 'Draft',
        date: now,
        user: loggedInUser?.name || 'System'
    };

    const finalBilledAssignmentIds: string[] = [];
    
    // Use functional update for assignments to ensure split parts are tracked correctly
    setAssignments(currentAssignments => {
      const nextAssignments = [...currentAssignments];
      const newlyBilled = new Set<string>();

      Object.entries(consumptionMap).forEach(([asgnId, hoursToBill]) => {
        const idx = nextAssignments.findIndex(a => a.id === asgnId);
        if (idx !== -1) {
          const asgn = nextAssignments[idx];
          const roundedToBill = Math.round(hoursToBill * 100) / 100;
          const roundedOriginal = Math.round(asgn.hours * 100) / 100;

          if (roundedToBill >= roundedOriginal) {
            newlyBilled.add(asgn.id);
            finalBilledAssignmentIds.push(asgn.id);
          } else {
            const billedPartId = `B-${asgn.id}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
            const billedPart: Assignment = { ...asgn, id: billedPartId, hours: roundedToBill };
            const unbilledPart: Assignment = { 
              ...asgn, 
              hours: Math.max(0, Math.round((asgn.hours - roundedToBill) * 100) / 100) 
            };
            nextAssignments[idx] = unbilledPart;
            nextAssignments.push(billedPart);
            newlyBilled.add(billedPartId);
            finalBilledAssignmentIds.push(billedPartId);
          }
        }
      });

      // Synchronously update global billed ID set
      setBilledAssignmentIds(old => {
        const next = new Set(old);
        newlyBilled.forEach(id => next.add(id));
        return next;
      });

      return nextAssignments;
    });

    const finalInvoice: Invoice = {
        ...invoice,
        statusHistory: [initialEntry],
        billedAssignmentIds: finalBilledAssignmentIds
    };
    setInvoices(prev => [...prev, finalInvoice]);
  };

  const handleUpdateInvoiceStatus = (id: string, status: InvoiceStatus) => {
    const targetInvoice = invoices.find(inv => inv.id === id);
    if (!targetInvoice) return;

    const now = new Date().toISOString().split('T')[0];
    const historyEntry: InvoiceStatusEntry = {
        status: status,
        date: now,
        user: loggedInUser?.name || 'System'
    };

    // If revoking, perform WIP reconciliation by returning billed IDs to unbilled pool
    if (status === 'Revoked') {
      setBilledAssignmentIds(prevBilled => {
        const next = new Set(prevBilled);
        targetInvoice.billedAssignmentIds.forEach(bid => next.delete(bid));
        return next;
      });
    }

    // Update invoice list status and history
    setInvoices(prev => prev.map(inv => {
      if (inv.id === id) {
        return { 
          ...inv, 
          status, 
          statusHistory: [...(inv.statusHistory || []), historyEntry] 
        };
      }
      return inv;
    }));
  };

  const handleUpdateProject = (updated: Project) => {
    setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, role: 'All' },
    { id: 'planner', label: 'Resource Planner', icon: CalendarRange, role: 'Admin' },
    { id: 'timesheets', label: 'My Timesheet', icon: Clock, role: 'All' },
    { id: 'approvals', label: 'Team Approvals', icon: ClipboardCheck, role: 'All' },
    { id: 'clients', label: 'Clients & Projects', icon: Briefcase, role: 'Admin' },
    { id: 'resources', label: 'Team Resources', icon: Users, role: 'Admin' },
    { id: 'ledger', label: 'WIP Ledger', icon: TrendingUp, role: 'Admin' },
    { id: 'invoices', label: 'Firm Invoices', icon: Receipt, role: 'Admin' },
    { id: 'reports', label: 'Reports', icon: BarChart4, role: 'Admin' },
    { id: 'users', label: 'System Admin', icon: ShieldAlert, role: 'Admin' },
  ];

  const filteredMenuItems = menuItems.filter(item => item.role === 'All' || item.role === loggedInUser?.role);

  if (!loggedInUser) {
    return (
      <div className="flex h-[100dvh] bg-[#F1F5F9] items-center justify-center p-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-300 rounded-full blur-[120px]"></div>
        </div>
        
        <div className="w-full max-w-[400px] animate-in zoom-in-95 duration-500">
          <div className="bg-white rounded-[2.5rem] shadow-2xl border border-white overflow-hidden flex flex-col p-10 space-y-8">
            <div className="flex flex-col items-center text-center space-y-4">
               <div className="w-16 h-16 bg-brand rounded-3xl flex items-center justify-center shadow-xl shadow-brand/20 rotate-3 group">
                  <CheckCircle2 className="text-white w-8 h-8" />
               </div>
               <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">TimeTrack Pro</h1>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Professional Services Management</p>
               </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              {loginError && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 animate-in slide-in-from-top-2">
                  <AlertCircle size={18} />
                  <span className="text-[11px] font-black uppercase tracking-tight leading-none">{loginError}</span>
                </div>
              )}

              <div className="space-y-4">
                 <div className="space-y-1.5 group">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Login Id</label>
                    <div className="relative">
                       <input 
                        required
                        type="text" 
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        placeholder="e.g. hamza.mehmood" 
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:ring-4 focus:ring-brand/10 focus:border-brand outline-none transition-all placeholder:text-slate-300" 
                       />
                       <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand transition-colors" size={18} />
                    </div>
                 </div>

                 <div className="space-y-1.5 group">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Password</label>
                    <div className="relative">
                       <input 
                        required
                        type="password" 
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••" 
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:ring-4 focus:ring-brand/10 focus:border-brand outline-none transition-all placeholder:text-slate-300" 
                       />
                       <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand transition-colors" size={18} />
                    </div>
                 </div>
              </div>

              <button 
                type="submit"
                className="w-full py-4.5 bg-brand text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-brand/20 hover:brightness-110 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                Authenticate <LogIn size={14} />
              </button>
            </form>

            <div className="pt-2 border-t border-slate-100">
               <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider text-center flex flex-col gap-1">
                  <span>Authorized Personnel Only</span>
                  <span className="opacity-60 italic lowercase">psst... password is 1234</span>
               </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] bg-[#F8FAFC] overflow-hidden text-sm animate-in fade-in duration-700">
      {showSetupModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/70 backdrop-blur-xl animate-in fade-in duration-700">
          <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
             <div className="absolute top-[20%] left-[10%] w-[30%] h-[30%] bg-indigo-600 rounded-full blur-[150px]"></div>
             <div className="absolute bottom-[20%] right-[10%] w-[30%] h-[30%] bg-emerald-600 rounded-full blur-[150px]"></div>
          </div>
          
          <div className="bg-white rounded-[2rem] p-0 shadow-2xl w-full max-w-[380px] border border-white overflow-hidden animate-in zoom-in-95 duration-500 flex flex-col">
            <div className="bg-slate-950 p-6 text-white relative overflow-hidden">
               <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/20 rounded-full blur-3xl -mr-12 -mt-12"></div>
               <div className="relative z-10 space-y-4">
                  <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center shadow-2xl shadow-brand/50 group">
                    <Rocket className="text-white w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black tracking-tight leading-none">Firm Setup</h2>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Platform Initialization v4.0</p>
                  </div>
               </div>
            </div>
            
            <div className="p-6 space-y-5 bg-white">
               <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                     <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm border border-slate-200">
                        <Zap size={14} className="text-amber-500" />
                     </div>
                     <div>
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Target Fiscal Year</div>
                        <div className="text-[11px] font-bold text-slate-500">Define your operational base.</div>
                     </div>
                  </div>

                  <div className="relative group">
                    <input 
                      type="number" 
                      value={setupYearInput}
                      onChange={e => setSetupYearInput(e.target.value)}
                      className="w-full py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl text-2xl font-black text-center text-brand outline-none focus:border-brand focus:bg-white transition-all shadow-inner"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand/20 transition-colors">
                       <Calendar size={20} />
                    </div>
                  </div>
               </div>

               <div className="space-y-3">
                  <div className="flex items-center gap-2 text-emerald-600">
                     <ShieldCheck size={14} />
                     <span className="text-[9px] font-black uppercase tracking-widest">Automatic Provisioning</span>
                  </div>
                  <ul className="grid grid-cols-1 gap-1.5">
                     {[
                        "Generate 52 fiscal cycles",
                        "Sync seed resource assignments",
                        "Initialize compliance identifiers",
                        "Configure global service lines"
                     ].map((item, i) => (
                        <li key={i} className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                           <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
                           {item}
                        </li>
                     ))}
                  </ul>
               </div>

               <button 
                  onClick={handleInitializePeriods} 
                  className="group w-full py-3.5 bg-brand text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl shadow-xl shadow-brand/20 hover:brightness-110 transition-all active:scale-95 flex items-center justify-center gap-2"
               >
                  Launch Operations <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
               </button>

               <p className="text-[8px] text-center text-slate-400 font-bold uppercase tracking-widest italic opacity-60">System status: Ready for payload</p>
            </div>
          </div>
        </div>
      )}

      {/* DYNAMIC SIDEBAR */}
      <aside 
        className="w-64 flex flex-col z-50 transition-all duration-500 border-r"
        style={{ 
          backgroundColor: 'var(--sidebar-bg)', 
          color: 'var(--sidebar-text)',
          borderColor: 'var(--topbar-border)'
        }}
      >
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center shadow-lg group">
            <CheckCircle2 className="text-white w-6 h-6" />
          </div>
          <span className="font-extrabold text-xl tracking-tight" style={{ color: appConfig.sidebarTheme === 'light' ? 'var(--topbar-text)' : 'inherit' }}>TimeTrack Pro</span>
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
          {filteredMenuItems.map((item) => {
             const isActive = activeView === item.id;
             return (
              <button 
                key={item.id} 
                onClick={() => setActiveView(item.id as any)} 
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all group ${
                  isActive 
                    ? 'shadow-lg' 
                    : 'hover:bg-white/5 opacity-80 hover:opacity-100'
                }`}
                style={{ 
                   backgroundColor: isActive ? 'var(--sidebar-active-bg)' : 'transparent',
                   color: isActive ? (appConfig.sidebarTheme === 'light' ? 'var(--brand-primary)' : '#fff') : 'inherit'
                }}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-current' : 'opacity-60 group-hover:opacity-100 transition-opacity'}`} />
                <span className="font-bold text-sm tracking-tight">{item.label}</span>
              </button>
             );
          })}
        </nav>

        <div className="p-5 bg-black/10 border-t border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs border border-white/10" style={{ backgroundColor: 'var(--brand-primary)', color: '#fff' }}>
                {loggedInUser.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold truncate leading-none" style={{ color: appConfig.sidebarTheme === 'light' ? 'var(--topbar-text)' : 'inherit' }}>{loggedInUser.name}</span>
                <span className="text-[9px] uppercase font-black tracking-wider mt-1.5 opacity-50">{loggedInUser.role}</span>
              </div>
            </div>
            <button onClick={handleLogout} className="p-2 opacity-40 hover:opacity-100 hover:text-rose-500 transition-all rounded-lg" title="Logout session">
               <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* DYNAMIC TOP BAR */}
        <header 
          className="h-16 border-b px-8 flex items-center justify-between z-40 flex-shrink-0 transition-all duration-500 backdrop-blur-md"
          style={{ 
             backgroundColor: 'var(--topbar-bg)',
             borderColor: 'var(--topbar-border)',
             color: 'var(--topbar-text)'
          }}
        >
          <div className="flex items-center gap-3 bg-black/5 px-4 py-2 rounded-full border border-black/5 focus-within:bg-white focus-within:shadow-sm transition-all group">
            <Search className="w-4 h-4 opacity-40 group-focus-within:opacity-100" />
            <input type="text" placeholder="Search resources, projects, or codes..." className="bg-transparent border-none outline-none text-xs w-64 font-bold placeholder:text-current/40" />
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center bg-black/5 border border-black/5 rounded-2xl p-1 gap-1 shadow-inner">
               <button className="p-2 opacity-50 hover:opacity-100 hover:bg-white/10 rounded-xl transition-all active:scale-90" title="Device Preview"><MonitorSmartphone size={16} /></button>
               <button onClick={handleSyncData} className={`p-2 rounded-xl transition-all active:scale-90 ${isSyncing ? 'text-emerald-500' : 'opacity-50 hover:opacity-100 hover:bg-white/10'}`} title="Force Sync Data"><RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} /></button>
               <button onClick={toggleFullScreen} className={`p-2 rounded-xl transition-all active:scale-90 ${isFullscreen ? 'opacity-100 text-brand' : 'opacity-50 hover:opacity-100'}`} title={isFullscreen ? "Minimize Screen" : "Maximize Screen"}>{isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}</button>
            </div>

            <button className="relative opacity-40 hover:opacity-100 transition-all p-2"><Bell className="w-5 h-5" /><span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span></button>
          </div>
        </header>

        <div className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto pb-20">
            {activeView === 'dashboard' && <DashboardView user={loggedInUser} clients={clients} projects={projects} assignments={unbilledAssignments} employees={employees} internalRegistry={internalRegistry} periods={periods} timesheets={timesheetDrafts} invoices={invoices} appConfig={appConfig} />}
            {activeView === 'planner' && <ResourceGrid employees={employees} projects={projects} internalRegistry={internalRegistry} assignments={assignments} onAddAssignments={newAsgns => setAssignments(prev => [...prev, ...newAsgns])} onDeleteAssignment={id => setAssignments(prev => prev.filter(a => id !== a.id))} onDeleteWeekAssignments={(eId, pId, dr) => setAssignments(prev => prev.filter(a => !(a.employeeId === eId && a.projectId === pId && dr.includes(a.date))))} periods={periods} />}
            {activeView === 'timesheets' && <TimesheetApp employees={employees} assignments={assignments} projects={projects} internalRegistry={internalRegistry} drafts={timesheetDrafts} onSaveDraft={handleSaveTimesheet} periods={periods} currentUserId={loggedInUser.id} />}
            {activeView === 'approvals' && <ApprovalsView employees={employees} projects={projects} internalRegistry={internalRegistry} timesheets={timesheetDrafts} onApprove={key => handleApproveTimesheet(key, loggedInUser.id)} onReject={handleRejectTimesheet} currentUserId={loggedInUser.id} />}
            {activeView === 'clients' && <ClientsView clients={clients} serviceLines={serviceLines} projects={projects} assignments={unbilledAssignments} employees={employees} invoices={invoices} onAddClient={c => setClients([...clients, c])} onAddProject={p => setProjects([...projects, p])} onUpdateProject={handleUpdateProject} onApproveCompliance={id => {
              setClients(prev => prev.map(c => {
                if (c.id === id) {
                  const finalPrefix = c.prefix.replace(/-TEMP$/, '');
                  return { ...c, prefix: finalPrefix, status: ClientStatus.ACTIVE };
                }
                return c;
              }));
            }} onUpdateClient={c => setClients(clients.map(old => old.id === c.id ? c : old))} onUpdateInvoiceStatus={handleUpdateInvoiceStatus} />}
            {activeView === 'resources' && <ResourcesView employees={employees} departments={departments} onAddEmployee={e => setEmployees([...employees, e])} onUpdateEmployee={e => setEmployees(employees.map(old => old.id === e.id ? e : old))} onToggleEmployeeStatus={id => setEmployees(employees.map(e => e.id === id ? {...e, isActive: !e.isActive} : e))} />}
            {activeView === 'ledger' && <WIPLedger clients={clients} projects={projects} assignments={unbilledAssignments} employees={employees} internalRegistry={internalRegistry} onCreateInvoice={handleCreateInvoice} />}
            {activeView === 'invoices' && <InvoicesView invoices={invoices} clients={clients} projects={projects} onUpdateStatus={handleUpdateInvoiceStatus} />}
            {activeView === 'reports' && <ReportsView employees={employees} assignments={unbilledAssignments} allAssignments={assignments} projects={projects} clients={clients} invoices={invoices} />}
            {activeView === 'users' && <UserManagement employees={employees} departments={departments} serviceLines={serviceLines} onUpdateDepartments={setDepartments} onUpdateServiceLines={setServiceLines} onUpdateUser={(updated) => setEmployees(employees.map(e => e.id === updated.id ? updated : e))} periods={periods} firstOpenYear={firstOpenYear} onOpenNextYear={handleOpenNextYear} onUpdatePeriodStatus={handleUpdatePeriodStatus} timesheets={timesheetDrafts} clients={clients} projects={projects} internalRegistry={internalRegistry} setInternalRegistry={setInternalRegistry} appConfig={appConfig} onUpdateAppConfig={setAppConfig} />}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;