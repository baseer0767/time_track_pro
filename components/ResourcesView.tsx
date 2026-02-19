
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Mail, 
  Briefcase, 
  DollarSign, 
  MoreVertical, 
  X,
  Trash2,
  Edit2,
  ChevronDown,
  Info,
  Tag,
  UserCircle,
  Power,
  ShieldCheck,
  UserPlus,
  Trophy,
  List,
  LayoutGrid,
  ChevronRight,
  Globe
} from 'lucide-react';
import { Employee, Department } from '../types';

interface ResourcesViewProps {
  employees: Employee[];
  departments: Department[];
  onAddEmployee: (emp: Employee) => void;
  onUpdateEmployee: (emp: Employee) => void;
  onToggleEmployeeStatus: (id: string) => void;
}

const DESIGNATIONS = [
  'CEO', 'CFO', 'CIO', 'Sr. Manager', 'Manager', 'Assistant Manager', 'Executive', 'Junior Executive'
];

const Avatar: React.FC<{ employee: Employee; size?: string }> = ({ employee, size = "w-10 h-10" }) => {
  const initials = employee.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  const colors = [
    'bg-emerald-600', 'bg-teal-600', 'bg-emerald-700', 'bg-teal-500', 'bg-cyan-600', 'bg-emerald-500'
  ];
  const colorIndex = employee.name.length % colors.length;
  const bgColor = colors[colorIndex];

  return (
    <div className={`${size} rounded-full ${bgColor} flex items-center justify-center text-white text-[11px] font-black ring-2 ring-white shadow-sm flex-shrink-0 ${!employee.isActive ? 'grayscale opacity-50' : ''}`}>
      {initials}
    </div>
  );
};

const ResourcesView: React.FC<ResourcesViewProps> = ({ 
  employees, 
  departments,
  onAddEmployee, 
  onUpdateEmployee, 
  onToggleEmployeeStatus 
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'Admin' | 'Consultant'>('Consultant');
  const [designation, setDesignation] = useState(DESIGNATIONS[DESIGNATIONS.length - 1]);
  const [gender, setGender] = useState<Employee['gender']>('Prefer not to say');
  const [department, setDepartment] = useState('');
  const [chargeRate, setChargeRate] = useState(150);
  const [skillsInput, setSkillsInput] = useState('');
  const [managerId, setManagerId] = useState('');

  useEffect(() => {
    if (editingEmployee) {
      setName(editingEmployee.name);
      setEmail(editingEmployee.email);
      setRole(editingEmployee.role);
      setDesignation(editingEmployee.designation);
      setGender(editingEmployee.gender || 'Prefer not to say');
      setDepartment(editingEmployee.department);
      setChargeRate(editingEmployee.chargeRate);
      setSkillsInput(editingEmployee.skills.join(', '));
      setManagerId(editingEmployee.managerId || '');
    } else {
      setName('');
      setEmail('');
      setRole('Consultant');
      setDesignation(DESIGNATIONS[7]); 
      setGender('Prefer not to say');
      setDepartment(departments[0]?.name || '');
      setChargeRate(150);
      setSkillsInput('');
      setManagerId('');
    }
  }, [editingEmployee, showModal, departments]);

  const handleEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setShowModal(true);
  };

  const handleAddNew = () => {
    setEditingEmployee(null);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const skills = skillsInput.split(',').map(s => s.trim()).filter(s => s !== '');
    const empData: Employee = {
      id: editingEmployee ? editingEmployee.id : `E-${Date.now()}`,
      name, email, role, designation, department, gender, chargeRate, skills,
      managerId: managerId || undefined,
      isActive: editingEmployee ? editingEmployee.isActive : true
    };
    if (editingEmployee) onUpdateEmployee(empData);
    else onAddEmployee(empData);
    setShowModal(false);
  };

  const filteredEmployees = employees.filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.skills.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between px-1">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Team Resources</h1>
          <p className="text-sm text-slate-500 font-medium">Manage your human capital, reporting hierarchy, and billing rates.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
             <button 
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-emerald-50 text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              title="Table View"
             >
                <List size={18} />
             </button>
             <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-emerald-50 text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              title="Grid View"
             >
                <LayoutGrid size={18} />
             </button>
          </div>
          <button 
            onClick={handleAddNew}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95"
          >
            <UserPlus size={18} /> Add New Resource
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 bg-slate-50/30 flex items-center gap-4">
           <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-lg border border-slate-200 max-w-sm w-full">
              <Search size={14} className="text-slate-400" />
              <input 
                 type="text" 
                 placeholder="Search by name, role, or skill..."
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="bg-transparent border-none outline-none text-xs w-full text-slate-600 font-medium focus:ring-0"
              />
           </div>
           <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
             {employees.length} Total Resources
           </div>
        </div>

        {viewMode === 'table' ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <th className="p-4 text-left border-r border-slate-200/50">Full Name & Identifier</th>
                  <th className="p-4 text-left border-r border-slate-200/50">Designation & Role</th>
                  <th className="p-4 text-left border-r border-slate-200/50">Status & Dept</th>
                  <th className="p-4 text-center border-r border-slate-200/50">Charge Rate</th>
                  <th className="p-4 text-left">Top Skills</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEmployees.map(emp => {
                  const manager = employees.find(m => m.id === emp.managerId);
                  return (
                    <tr key={emp.id} className={`group hover:bg-slate-50/50 transition-colors ${!emp.isActive ? 'bg-slate-50/40' : ''}`}>
                      <td className="p-4 border-r border-slate-200/50">
                        <div className="flex items-center gap-4">
                          <Avatar employee={emp} />
                          <div className="flex flex-col min-w-0">
                            <span className={`font-bold text-sm truncate ${!emp.isActive ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{emp.name}</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{emp.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 border-r border-slate-200/50">
                        <div className="flex flex-col">
                          <span className={`font-bold text-sm ${!emp.isActive ? 'text-slate-400' : 'text-slate-700'}`}>{emp.designation}</span>
                          <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">{emp.role}</span>
                        </div>
                      </td>
                      <td className="p-4 border-r border-slate-200/50">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                             <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                               emp.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-400 border-slate-200'
                             }`}>
                               {emp.isActive ? 'Active' : 'Inactive'}
                             </span>
                             <span className="text-[10px] text-slate-400 font-black uppercase tracking-tight">{emp.department}</span>
                          </div>
                          {manager && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Mgr:</span>
                              <span className="text-[10px] font-bold text-slate-600">{manager.name}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4 border-r border-slate-200/50 text-center">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-black border shadow-sm ${
                          emp.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'
                        }`}>
                          <DollarSign size={12} className="opacity-60" />
                          {emp.chargeRate}/hr
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1.5">
                          {emp.skills.slice(0, 3).map(skill => (
                            <span key={skill} className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-black uppercase tracking-widest">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                           <button onClick={() => handleEdit(emp)} className="p-2 hover:bg-slate-100 text-slate-400 hover:text-emerald-600 rounded-xl transition-all"><Edit2 size={14} /></button>
                           <button onClick={() => onToggleEmployeeStatus(emp.id)} className={`p-2 rounded-xl transition-all ${emp.isActive ? 'hover:bg-rose-50 text-slate-400 hover:text-rose-500' : 'hover:bg-emerald-50 text-slate-400 hover:text-emerald-600'}`} title={emp.isActive ? 'Inactivate Resource' : 'Reactivate Resource'}><Power size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in zoom-in-95 duration-300">
             {filteredEmployees.map(emp => {
               const manager = employees.find(m => m.id === emp.managerId);
               return (
                <div key={emp.id} className={`bg-white rounded-[1.5rem] p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all group flex flex-col ${!emp.isActive ? 'opacity-70 grayscale-[0.5]' : ''}`}>
                   <div className="flex justify-between items-start mb-6">
                      <Avatar employee={emp} size="w-14 h-14" />
                      <div className="flex flex-col items-end gap-2">
                         <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                           emp.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-200'
                         }`}>
                           {emp.isActive ? 'Active' : 'Inactive'}
                         </span>
                         <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">${emp.chargeRate}/HR</div>
                      </div>
                   </div>

                   <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-600 transition-colors mb-1 truncate">{emp.name}</h3>
                   <div className="flex items-center gap-2 mb-4">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{emp.designation}</span>
                      <span className="text-slate-300 text-[10px]">•</span>
                      <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{emp.role}</span>
                   </div>

                   <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-2">
                         <Briefcase size={12} className="text-slate-400" />
                         <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">{emp.department}</span>
                      </div>
                      {manager && (
                         <div className="flex items-center gap-2">
                            <UserCircle size={12} className="text-slate-400" />
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">Lead: {manager.name}</span>
                         </div>
                      )}
                   </div>

                   <div className="flex flex-wrap gap-1.5 mb-6">
                      {emp.skills.slice(0, 4).map(skill => (
                         <span key={skill} className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[8px] font-black uppercase tracking-tighter border border-slate-200/50">
                            {skill}
                         </span>
                      ))}
                   </div>

                   <div className="mt-auto pt-5 border-t border-slate-100 flex items-center justify-between">
                      <button onClick={() => handleEdit(emp)} className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:text-emerald-700 transition-colors">
                         <Edit2 size={12} /> Edit Profile
                      </button>
                      <button onClick={() => onToggleEmployeeStatus(emp.id)} className={`p-2 rounded-xl transition-all ${emp.isActive ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-600'}`}>
                         <Power size={14} />
                      </button>
                   </div>
                </div>
               );
             })}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 ring-1 ring-black/5 flex flex-col animate-in zoom-in-95 duration-200">
              <div className="p-5 bg-slate-950 text-white flex justify-between items-start">
                 <div className="flex items-center gap-4">
                   <div className="w-10 h-10 bg-emerald-600/20 text-emerald-400 rounded-xl flex items-center justify-center border border-emerald-400/30">
                      <Users size={20} />
                   </div>
                   <div>
                     <h2 className="text-xl font-bold tracking-tight">{editingEmployee ? 'Edit Profile' : 'Add Resource'}</h2>
                     <p className="text-slate-400 text-[11px] mt-0.5 uppercase font-medium tracking-widest">Global Talent Protocol v2.1</p>
                   </div>
                 </div>
                 <button onClick={() => setShowModal(false)} className="hover:bg-white/10 p-2 rounded-full transition-colors"><X size={20} /></button>
              </div>
              
              <div className="overflow-y-auto max-h-[85vh]">
                 <form onSubmit={handleSubmit} className="p-8 space-y-5 bg-white">
                    <div className="grid grid-cols-2 gap-5">
                       <div className="col-span-2 space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-slate-400 px-1 tracking-widest">Full Name</label>
                          <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Alice Wonderland" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none transition-all" />
                       </div>
                       
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-slate-400 px-1 tracking-widest">Email Address</label>
                          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="alice@proedge.com" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none transition-all" />
                       </div>

                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-slate-400 px-1 tracking-widest">Charge Rate ($/hr)</label>
                          <input required type="number" value={chargeRate} onChange={(e) => setChargeRate(parseInt(e.target.value))} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none text-base" />
                       </div>

                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-slate-400 px-1 tracking-widest">Reporting Manager</label>
                          <div className="relative">
                            <select value={managerId} onChange={(e) => setManagerId(e.target.value)} className="w-full appearance-none p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none transition-all pr-10">
                               <option value="">No Manager (Direct Lead)</option>
                               {employees.filter(e => e.id !== editingEmployee?.id && e.isActive).map(e => <option key={e.id} value={e.id}>{e.name} ({e.designation})</option>)}
                            </select>
                            <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                          </div>
                       </div>

                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-slate-400 px-1 tracking-widest">Designation</label>
                          <div className="relative">
                            <select value={designation} onChange={(e) => setDesignation(e.target.value)} className="w-full appearance-none p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none transition-all pr-10">
                               {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                            <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                          </div>
                       </div>

                       <div className="col-span-2 space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-slate-400 px-1 tracking-widest">Expertise & Skills (CSV)</label>
                          <div className="relative">
                            <input value={skillsInput} onChange={(e) => setSkillsInput(e.target.value)} placeholder="React, AWS, Node.js..." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none transition-all pl-12" />
                            <Tag size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                          </div>
                       </div>
                    </div>

                    <button type="submit" className="w-full py-5 bg-emerald-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-[0.98] mt-4 flex items-center justify-center gap-3">
                       <ShieldCheck size={20} /> {editingEmployee ? 'Update Profile Data' : 'Finalize Onboarding'}
                    </button>
                 </form>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ResourcesView;
