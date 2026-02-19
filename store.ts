import { Client, Project, Employee, Assignment, ProjectType, ClientStatus, InternalCode, Department, ServiceLine } from './types';

export const MOCK_CLIENTS: Client[] = [
  {
    id: 'C1',
    name: 'Global Tech Solutions',
    prefix: 'GTS-TT-01',
    serviceLine: 'Technology',
    location: 'New York, USA',
    natureOfBusiness: 'Software development and cloud infrastructure',
    contactPerson: 'Sarah Jenkins',
    contactNo: '+1-555-010-2233',
    contactEmail: 'billing@gts.com',
    status: ClientStatus.ACTIVE,
    sequence: 1
  },
  {
    id: 'C2',
    name: 'Azure Finance Group',
    prefix: 'AFG-FS-02',
    serviceLine: 'Financial Services',
    location: 'London, UK',
    natureOfBusiness: 'Investment banking and asset management',
    contactPerson: 'Robert Miller',
    contactNo: '+44-20-7946-0123',
    contactEmail: 'accounts@azurefinance.co.uk',
    status: ClientStatus.ACTIVE,
    sequence: 2
  },
  {
    id: 'C3',
    name: 'Internal - TimeTrack Pro',
    prefix: 'TT-CORP-03',
    serviceLine: 'Corporate',
    location: 'Remote',
    natureOfBusiness: 'Internal tools and corporate services',
    contactPerson: 'Admin Team',
    contactNo: 'N/A',
    contactEmail: 'admin@timetrackpro.com',
    status: ClientStatus.ACTIVE,
    sequence: 3
  },
  {
    id: 'C4',
    name: 'Jersey Solution Limited',
    prefix: 'JSL-CON-04-TEMP',
    serviceLine: 'Consulting',
    location: 'Jersey City, USA',
    natureOfBusiness: 'Business process outsourcing and verification',
    contactPerson: 'Mark Thompson',
    contactNo: '+1-201-555-0199',
    contactEmail: 'contact@jsl.com',
    status: ClientStatus.PENDING,
    sequence: 4
  },
  {
    id: 'C5',
    name: 'Nexus Limited',
    prefix: 'NL-ENG-05-TEMP',
    serviceLine: 'Engineering',
    location: 'Dubai, UAE',
    natureOfBusiness: 'Industrial engineering and design consultancy',
    contactPerson: 'Zayn Malik',
    contactNo: '+971-4-1234567',
    contactEmail: 'ops@nexus.ae',
    status: ClientStatus.PENDING,
    sequence: 5
  }
];

export const MOCK_PROJECTS: Project[] = [
  { id: 'P1', clientId: 'C1', name: 'Cloud Migration Strategy', code: 'GTS-TT-PRJ-01', type: ProjectType.BILLABLE, isActive: true, managerId: 'E1' },
  { id: 'P2', clientId: 'C2', name: 'Regulatory Audit Q4', code: 'AFG-FS-PRJ-01', type: ProjectType.BILLABLE, isActive: true, managerId: 'E3' },
  { id: 'P5', clientId: 'C4', name: 'KYC Verification', code: 'JSL-CON-PRJ-01', type: ProjectType.NON_BILLABLE, isActive: true, managerId: 'E3' }
];

export const MOCK_DEPARTMENTS: Department[] = [
  { id: 'D1', name: 'Engineering' },
  { id: 'D2', name: 'Infrastructure' },
  { id: 'D3', name: 'Management' },
  { id: 'D4', name: 'HR' },
  { id: 'D5', name: 'Legal' },
  { id: 'D6', name: 'Design' }
];

export const MOCK_SERVICE_LINES: ServiceLine[] = [
  { id: 'SL1', name: 'Audit', code: 'AUD' },
  { id: 'SL2', name: 'Tax', code: 'TAX' },
  { id: 'SL3', name: 'Advisory', code: 'ADV' },
  { id: 'SL4', name: 'Consulting', code: 'CON' },
  { id: 'SL5', name: 'Engineering', code: 'ENG' },
  { id: 'SL6', name: 'Technology', code: 'TT' },
  { id: 'SL7', name: 'Architecture', code: 'ARCH' },
  { id: 'SL8', name: 'Human Resources', code: 'HR' },
  { id: 'SL9', name: 'Information Tech', code: 'IT' },
  { id: 'SL10', name: 'Financial Services', code: 'FS' }
];

export const MOCK_EMPLOYEES: Employee[] = [
  { id: 'E1', name: 'Hamza Mehmood', email: 'hamza@proedge.com', role: 'Admin', designation: 'Sr. Manager', department: 'Engineering', gender: 'Male', chargeRate: 250, skills: ['React', 'TypeScript', 'Node.js'], isActive: true, systemStatus: 'Active', lastLogin: '2026-05-22 09:15 AM' },
  { id: 'E2', name: 'Muhammad Salman', email: 'salman@proedge.com', role: 'Consultant', designation: 'Manager', department: 'Infrastructure', gender: 'Male', chargeRate: 300, skills: ['AWS', 'Docker', 'Kubernetes'], managerId: 'E1', isActive: true, systemStatus: 'Active', lastLogin: '2026-05-22 08:45 AM' },
  { id: 'E3', name: 'Rahat Kaleem', email: 'rahat@proedge.com', role: 'Consultant', designation: 'Sr. Manager', department: 'Management', gender: 'Male', chargeRate: 180, skills: ['Agile', 'Jira'], managerId: 'E1', isActive: true, systemStatus: 'Pending', lastLogin: 'Never' }
];

export const MOCK_INTERNAL_REGISTRY: InternalCode[] = [
  { id: 'I1', code: 'TT-INT-ADM-1', description: 'General Administrative Tasks', category: 'ADM', isActive: true },
  { id: 'I2', code: 'TT-INT-PTO-1', description: 'Vacation and Personal Time Off', category: 'PTO', isActive: true },
  { id: 'I3', code: 'TT-INT-L&D-1', description: 'Learning and Development', category: 'L&D', isActive: true },
  { id: 'I4', code: 'TT-INT-ADM-2', description: 'internal admin', category: 'ADM', isActive: true },
  { id: 'I5', code: 'TT-INT-AL-1', description: 'Annual Leave', category: 'AL', isActive: true },
  { id: 'I6', code: 'TT-INT-SL-1', description: 'Sick Leave', category: 'SL', isActive: true },
  { id: 'I7', code: 'TT-INT-CL-1', description: 'Casual Leave', category: 'CL', isActive: true }
];

// Seed data emptied to satisfy the requirement for zero WIP/Revenue on first load
export const MOCK_ASSIGNMENTS: Assignment[] = [];
