export type CompanyLegalType = 
  | 'Private Company (Pty) Ltd' 
  | 'Public Company (Ltd)' 
  | 'Personal Liability Company (Inc)' 
  | 'Non-Profit Company (NPC)' 
  | 'State-Owned Company (SOC Ltd)' 
  | 'Close Corporation (CC)' 
  | 'Partnership' 
  | 'Sole Proprietorship' 
  | 'Other';

export type CompanyGroupRole = 
  | 'Holding Company' 
  | 'Subsidiary' 
  | 'Associate' 
  | 'Operating Company' 
  | 'SPV' 
  | 'Dormant Entity' 
  | 'Other';

export type CompanyStatus = 'Active' | 'Dormant' | 'Pending' | 'Closed';
export type ComplianceStatus = 'Pending' | 'In Progress' | 'Submitted' | 'Completed' | 'Overdue' | 'Cancelled';
export type TransactionType = 'Income' | 'Expense' | 'Transfer' | 'Loan' | 'Investment' | 'Tax' | 'Salary' | 'Dividend' | 'Bank Charge' | 'Other';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: 'Owner' | 'Admin' | 'Accountant' | 'Manager';
  createdAt: string;
}

export interface Company {
  id: string;
  name: string;
  tradingName?: string;
  legalEntityType: CompanyLegalType;
  groupRole: CompanyGroupRole;
  registrationNumber: string;
  incorporationDate: string;
  taxNumber?: string;
  vatNumber?: string;
  payeNumber?: string;
  uifNumber?: string;
  industry?: string;
  financialYearEnd: string;
  status: CompanyStatus;
  notes?: string;
  owner_id: string;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyRelationship {
  id: string;
  parentCompanyId: string;
  childCompanyId: string;
  ownershipPercentage: number;
  relationshipType: string;
  effectiveDate: string;
  notes?: string;
}

export interface Director {
  id: string;
  companyId: string;
  fullName: string;
  idNumber?: string;
  passportNumber?: string;
  appointmentDate: string;
  resignationDate?: string;
  roleTitle: string;
  email?: string;
  phone?: string;
}

export interface Shareholder {
  id: string;
  companyId: string;
  name: string;
  type: 'Person' | 'Entity';
  ownershipPercentage: number;
  shareClass: string;
  issueDate: string;
  notes?: string;
}

export interface BeneficialOwner {
  id: string;
  companyId: string;
  fullName: string;
  controlType: string;
  ownershipPercentage: number;
  effectiveDate: string;
  status: 'Active' | 'Inactive';
  notes?: string;
}

export interface Document {
  id: string;
  companyId: string;
  category: string;
  title: string;
  fileUrl: string;
  fileType: string;
  versionNumber: number;
  issueDate?: string;
  expiryDate?: string;
  uploadedBy: string;
  notes?: string;
  createdAt: string;
}

export interface ComplianceItem {
  id: string;
  companyId: string;
  category: 'SARS' | 'CIPC' | 'Labour' | 'POPIA' | 'Governance' | 'Other';
  type: string;
  title: string;
  dueDate: string;
  reminderDate?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: ComplianceStatus;
  required_documents?: string[];
  linkedDocumentId?: string;
  notes?: string;
  owner_id: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinanceTransaction {
  id: string;
  companyId: string;
  relatedCompanyId?: string; // For intercompany transfers/loans
  intercompany?: boolean;
  compliance?: boolean; // For tax, legal, CIPC filing etc.
  date: string;
  type: TransactionType;
  category: string;
  amount: number;
  description: string;
  paymentMethod: string;
  counterparty?: string;
  referenceNumber?: string;
  linkedDocumentId?: string;
  notes?: string;
  owner_id: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  owner_id: string;
  eventType: string;
  entityType: string;
  entityId: string;
  description: string;
  companyId?: string;
  createdAt: string;
}
