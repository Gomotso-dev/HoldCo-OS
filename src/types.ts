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
  full_name: string;
  email: string;
  role: 'Owner' | 'Admin' | 'Accountant' | 'Manager';
  created_at: string;
}

export interface Company {
  id: string;
  name: string;
  trading_name?: string;
  legal_entity_type: CompanyLegalType;
  group_role: CompanyGroupRole;
  registration_number: string;
  incorporation_date: string;
  tax_number?: string;
  vat_number?: string;
  paye_number?: string;
  uif_number?: string;
  industry?: string;
  financial_year_end: string;
  status: CompanyStatus;
  notes?: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface CompanyRelationship {
  id: string;
  parent_company_id: string;
  child_company_id: string;
  ownership_percentage: number;
  relationship_type: string;
  effective_date: string;
  notes?: string;
}

export interface Director {
  id: string;
  company_id: string;
  full_name: string;
  id_number?: string;
  passport_number?: string;
  appointment_date: string;
  resignation_date?: string;
  role_title: string;
  email?: string;
  phone?: string;
}

export interface Shareholder {
  id: string;
  company_id: string;
  name: string;
  type: 'Person' | 'Entity';
  ownership_percentage: number;
  share_class: string;
  issue_date: string;
  notes?: string;
}

export interface BeneficialOwner {
  id: string;
  company_id: string;
  full_name: string;
  control_type: string;
  ownership_percentage: number;
  effective_date: string;
  status: 'Active' | 'Inactive';
  notes?: string;
}

export interface Document {
  id: string;
  company_id: string;
  category: string;
  title: string;
  file_url: string;
  file_type: string;
  version_number: number;
  issue_date?: string;
  expiry_date?: string;
  uploaded_by: string;
  notes?: string;
  created_at: string;
}

export interface ComplianceItem {
  id: string;
  company_id: string;
  category: 'SARS' | 'CIPC' | 'Labour' | 'POPIA' | 'Governance' | 'Other';
  type: string;
  title: string;
  due_date: string;
  reminder_date?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: ComplianceStatus;
  required_documents?: string[];
  linked_document_id?: string;
  notes?: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface FinanceTransaction {
  id: string;
  company_id: string;
  related_company_id?: string; // For intercompany transfers/loans
  intercompany?: boolean;
  compliance?: boolean; // For tax, legal, CIPC filing etc.
  date: string;
  type: TransactionType;
  category: string;
  amount: number;
  description: string;
  payment_method: string;
  counterparty?: string;
  reference_number?: string;
  linked_document_id?: string;
  notes?: string;
  owner_id: string;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  owner_id: string;
  event_type: string;
  entity_type: string;
  entity_id: string;
  description: string;
  company_id?: string;
  created_at: string;
}
