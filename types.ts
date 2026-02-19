
export enum ProjectType {
  BILLABLE = 'Billable',
  INTERNAL = 'Internal',
  NON_BILLABLE = 'Non-Billable'
}

export enum ClientStatus {
  PENDING = 'Pending Compliance',
  ACTIVE = 'Active'
}

export interface Client {
  id: string;
  name: string;
  prefix: string;
  serviceLine: string;
  location: string;
  natureOfBusiness: string;
  contactPerson: string;
  contactNo: string;
  contactEmail: string;
  status: ClientStatus;
  sequence: number;
}

export interface Project {
  id: string;
  clientId: string;
  name: string;
  code: string;
  type: ProjectType;
  isActive: boolean;
  managerId?: string; // Links to Employee ID
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Consultant';
  designation: string;
  department: string;
  gender: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
  chargeRate: number;
  managerId?: string;
  skills: string[];
  isActive: boolean;
  lastLogin?: string;
  systemStatus?: 'Active' | 'Revoked' | 'Pending';
}

export interface Department {
  id: string;
  name: string;
}

export interface ServiceLine {
  id: string;
  name: string;
  code: string;
}

export interface Assignment {
  id: string;
  employeeId: string;
  projectId: string;
  date: string; // ISO format YYYY-MM-DD
  hours: number;
  note?: string;
}

export type TimesheetStatus = 'Draft' | 'Submitted' | 'Approved' | 'Rejected';

export interface TimesheetData {
  manualProjectIds: string[];
  timeEntries: Record<string, number>;
  status: TimesheetStatus;
  approvals?: string[]; // Array of Employee IDs who have signed off
  managerComment?: string;
  userComment?: string;
}

export interface InternalCode {
  id: string;
  code: string;
  description: string;
  category: 'ADM' | 'PTO' | 'L&D' | 'AL' | 'SL' | 'CL';
  isActive: boolean;
}

export type PeriodStatus = 'CLOSED' | 'OPEN' | 'NEVER OPENED';

export interface TimesheetPeriod {
  year: number;
  week: number;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  monthTag: string;  // e.g. "Jan-26"
  status: PeriodStatus;
}

// Global App Configuration for UI/UX customization
export interface AppConfig {
  brandColor: string;
  radius: 'sharp' | 'soft' | 'round';
  density: 'compact' | 'standard' | 'spacious';
  fontScale: number;
  enableGlassmorphism: boolean;
  sidebarTheme: 'dark' | 'light' | 'brand';
  topBarTheme: 'white' | 'glass' | 'accent';
  // New Dashboard aesthetic controls
  dashboardTileStyle: 'classic' | 'glass' | 'minimal' | 'soft';
  dashboardKpiColoring: 'standard' | 'branded';
}

// Invoicing & Ledger Types
export type InvoiceStatus = 'Draft' | 'Issued' | 'Paid' | 'Revoked' | 'Cancelled';

export interface InvoiceStatusEntry {
  status: InvoiceStatus;
  date: string;
  user: string;
}

export interface InvoiceLineItem {
  id: string;
  projectId: string;
  description: string;
  hours: number;
  rate: number;
  amount: number;
}

export interface Invoice {
  id: string;
  invoiceNo: string;
  clientId: string;
  date: string;
  dueDate: string;
  items: InvoiceLineItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: InvoiceStatus;
  statusHistory: InvoiceStatusEntry[];
  billedAssignmentIds: string[]; // List of specific assignment IDs consumed by this invoice
}
