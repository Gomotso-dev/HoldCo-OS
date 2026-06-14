import { addMonths, startOfMonth, endOfMonth, setYear, getYear, addYears, format, parseISO, addDays } from 'date-fns';
import { supabase } from '../lib/supabase';
import { ActivityLogService } from './activityLogService';

// --- TYPES ---

export type Frequency = 'monthly' | 'bi-monthly' | 'bi-annual' | 'annual' | 'ad-hoc';
export type Regulator = 'CIPC' | 'SARS' | 'Labour' | 'POPIA';
export type TriggerType = 'registration_based' | 'financial_year_end_based' | 'flag_based';

export interface ComplianceTemplate {
  name: string;
  type: Regulator;
  applies_to_company_types: string[];
  frequency: Frequency;
  trigger_type: TriggerType;
  due_date_rule: {
    months_offset?: number;
    day_target?: number; // e.g. 7th for PAYE
    fixed_month?: number; // 0-indexed (0 = Jan)
  };
  penalty_risk_level: 'Low' | 'Medium' | 'High';
  required_documents: string[];
  auto_create: boolean;
}

// --- SEED DATA (SOUTH AFRICA) ---

export const SouthAfricanComplianceTemplates: ComplianceTemplate[] = [
  {
    name: 'CIPC Annual Return',
    type: 'CIPC',
    applies_to_company_types: ['Private Company (Pty) Ltd', 'Public Company (Ltd)', 'Non-Profit Company (NPC)'],
    frequency: 'annual',
    trigger_type: 'registration_based',
    due_date_rule: { months_offset: 1 }, // 30 days after anniversary
    penalty_risk_level: 'High',
    required_documents: ['Financial Accountability Supplement', 'FAS Form'],
    auto_create: true
  },
  {
    name: 'Provisional Tax (1st Period)',
    type: 'SARS',
    applies_to_company_types: ['Private Company (Pty) Ltd', 'Public Company (Ltd)', 'Non-Profit Company (NPC)', 'Sole Proprietorship'],
    frequency: 'bi-annual',
    trigger_type: 'financial_year_end_based',
    due_date_rule: { months_offset: -6 }, // 6 months before FY end
    penalty_risk_level: 'High',
    required_documents: ['Management Accounts'],
    auto_create: true
  },
  {
    name: 'Income Tax Return (ITR14)',
    type: 'SARS',
    applies_to_company_types: ['Private Company (Pty) Ltd', 'Public Company (Ltd)', 'Non-Profit Company (NPC)'],
    frequency: 'annual',
    trigger_type: 'financial_year_end_based',
    due_date_rule: { months_offset: 12 }, // 12 months after FY end
    penalty_risk_level: 'High',
    required_documents: ['Audited Financial Statements', 'Tax Computation'],
    auto_create: true
  },
  {
    name: 'EMP201 (PAYE/UIF/SDL)',
    type: 'SARS',
    applies_to_company_types: ['Private Company (Pty) Ltd', 'Sole Proprietorship'],
    frequency: 'monthly',
    trigger_type: 'flag_based', // Triggered by 'paye_registered'
    due_date_rule: { day_target: 7 }, // 7th of every month
    penalty_risk_level: 'High',
    required_documents: ['Payroll Report'],
    auto_create: true
  },
  {
    name: 'UIF Declaration',
    type: 'Labour',
    applies_to_company_types: ['Private Company (Pty) Ltd', 'Sole Proprietorship'],
    frequency: 'monthly',
    trigger_type: 'flag_based', // Triggered by 'uif_registered'
    due_date_rule: { day_target: 7 },
    penalty_risk_level: 'Medium',
    required_documents: ['UIF Return'],
    auto_create: true
  }
];

// --- THE ENGINE ---

export class ComplianceEngine {
  
  /**
   * Calculates the next due date based on template rules
   */
  static calculateDueDate(
    template: ComplianceTemplate, 
    context: { 
      registrationDate: string; 
      financialYearEnd: string; // e.g. "February"
      currentCycleYear?: number 
    }
  ): Date {
    const year = context.currentCycleYear || new Date().getFullYear();
    
    if (template.trigger_type === 'registration_based') {
      const regDate = parseISO(context.registrationDate);
      // Anniversary in the target year
      const anniversary = addMonths(setYear(regDate, year), template.due_date_rule.months_offset || 0);
      return anniversary;
    }

    if (template.trigger_type === 'financial_year_end_based') {
      // Logic for FY end (e.g. "February")
      const months: { [key: string]: number } = {
        January: 0, February: 1, March: 2, April: 3, May: 4, June: 5,
        July: 6, August: 7, September: 8, October: 9, November: 10, December: 11
      };
      
      const fyMonth = months[context.financialYearEnd];
      let fyDate = endOfMonth(new Date(year, fyMonth, 1));
      
      return addMonths(fyDate, template.due_date_rule.months_offset || 0);
    }

    if (template.frequency === 'monthly') {
      // Calculate for the next coming 7th
      const nextMonth = addMonths(new Date(), 1);
      return new Date(nextMonth.getFullYear(), nextMonth.getMonth(), template.due_date_rule.day_target || 7);
    }

    return addDays(new Date(), 30); // Fallback
  }

  /**
   * Matches templates to a company and creates compliance items
   */
  static async generateComplianceForCompany(company: any, taxProfile: any) {
    const matchedTemplates = SouthAfricanComplianceTemplates.filter(template => {
      // Check company type
      const typeMatch = template.applies_to_company_types.includes(company.legal_entity_type);
      if (!typeMatch) return false;
      // Check specific flags
      if (template.name.includes('PAYE') && !taxProfile.is_paye_registered) return false;
      if (template.name.includes('VAT') && !taxProfile.is_vat_registered) return false;
      if (template.name.includes('UIF') && !taxProfile.is_uif_registered) return false;

      return true;
    });

    // Fetch existing items to avoid duplicates
    const { data: existingItems } = await supabase
      .from('compliance')
      .select('title, due_date')
      .eq('company_id', company.id);

    const itemsToCreate = matchedTemplates.map(template => {
      const dueDate = this.calculateDueDate(template, {
        registrationDate: company.incorporation_date,
        financialYearEnd: company.financial_year_end
      });

      // Check if duplicate exists
      const isDuplicate = existingItems?.some(item =>
        item.title === template.name &&
        format(parseISO(item.due_date), 'yyyy-MM-dd') === format(dueDate, 'yyyy-MM-dd')
      );

      if (isDuplicate) return null;

      return {
        company_id: company.id,
        owner_id: company.owner_id,
        title: template.name,
        type: template.type,
        category: template.type,
        due_date: dueDate.toISOString(),
        status: 'Pending',
        priority: template.penalty_risk_level === 'High' ? 'High' : 'Medium',
        risk_level: template.penalty_risk_level,
        required_documents: template.required_documents,
      };
    }).filter(Boolean);

    if (itemsToCreate.length > 0) {
      const { error } = await supabase.from('compliance').insert(itemsToCreate);
      if (error) throw error;

      await ActivityLogService.logActivity({
        action_type: 'compliance_generated',
        description: `Generated ${itemsToCreate.length} compliance items for ${company.name}`,
        company_id: company.id,
        metadata: { items_count: itemsToCreate.length }
      });

      return itemsToCreate;
    }
    
    return [];
  }

  /**
   * Returns what would be generated for a preview
   */
  static getPreview(company: any, taxProfile: any) {
    return SouthAfricanComplianceTemplates.filter(template => {
      const typeMatch = template.applies_to_company_types.includes(company.legal_entity_type);
      if (!typeMatch) return false;

      if (template.name.includes('PAYE') && !taxProfile.is_paye_registered) return false;
      if (template.name.includes('VAT') && !taxProfile.is_vat_registered) return false;
      if (template.name.includes('UIF') && !taxProfile.is_uif_registered) return false;

      return true;
    });
  }
}
