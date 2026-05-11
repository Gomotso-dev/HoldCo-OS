import { supabase } from '../lib/supabase';
import { differenceInDays, isPast, isToday, parseISO, startOfDay } from 'date-fns';

export type UrgencyType = 'overdue' | 'due_today' | 'due_soon';
export type DocumentReadiness = 'No Documents Required' | 'Missing Documents' | 'Ready to Submit';

export interface TodaysAction {
  id: string;
  compliance_name: string;
  regulator: string;
  company_id: string;
  company_name: string;
  due_date: string;
  status: string;
  priority: string;
  risk_level: string;
  days_until_due: number;
  urgency_type: UrgencyType;
  required_documents: string[];
  document_readiness: DocumentReadiness;
}

/**
 * Fetches the most urgent pending compliance items for the logged-in user.
 * Limit: Top 5 items due within the next 7 days or overdue.
 */
export async function getTodaysActions(userId: string): Promise<TodaysAction[]> {
  console.log('[complianceActions] Fetching actions for userId:', userId);
  try {
    const today = startOfDay(new Date());
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);

    // Fetch pending compliance items with related company info
    const query = supabase
      .from('compliance')
      .select(`
        id,
        title,
        type,
        category,
        company_id,
        due_date,
        status,
        priority,
        risk_level,
        required_documents,
        companies!company_id (
          name
        )
      `)
      .eq('owner_id', userId)
      .neq('status', 'Completed')
      .lte('due_date', sevenDaysFromNow.toISOString())
      .order('due_date', { ascending: true });

    const { data, error } = await query;

    if (error) {
      throw error;
    }
    
    console.log('[complianceActions] Data received:', data?.length, 'items');

    if (!data || data.length === 0) return [];

    // Fetch all documents for these companies to check readiness
    const companyIds = Array.from(new Set(data.map((item: any) => item.company_id)));
    const { data: documents, error: docsError } = await supabase
      .from('documents')
      .select('company_id, title, category')
      .in('company_id', companyIds);

    if (docsError) console.warn('[complianceActions] Failed to fetch documents for readiness check:', docsError);

    return processActions(data, today, documents || []);

  } catch (error) {
    console.error('[complianceActions] Fatal error fetching actions:', error);
    return []; // Return empty array instead of throwing to prevent UI crash
  }
}

/**
 * Common processing logic for actions
 */
function processActions(data: any[], today: Date, documents: any[]): TodaysAction[] {
  const actions: TodaysAction[] = data.map((item: any) => {
    const dueDate = parseISO(item.due_date);
    const daysUntilDue = differenceInDays(dueDate, today);
    
    let urgency: UrgencyType = 'due_soon';
    if (isPast(dueDate) && !isToday(dueDate)) {
      urgency = 'overdue';
    } else if (isToday(dueDate)) {
      urgency = 'due_today';
    }

    // Document Readiness Logic
    const requiredDocs = item.required_documents || [];
    const companyDocs = documents?.filter(doc => (doc.company_id === item.company_id || doc.companyId === item.company_id)) || [];
    
    let readiness: DocumentReadiness = 'No Documents Required';
    if (requiredDocs.length > 0) {
      const foundAll = requiredDocs.every((req: string) => 
        companyDocs.some(doc => 
          (doc.title && doc.title.toLowerCase().includes(req.toLowerCase())) || 
          (doc.category && doc.category.toLowerCase().includes(req.toLowerCase()))
        )
      );

      readiness = foundAll ? 'Ready to Submit' : 'Missing Documents';
    }

    return {
      id: item.id,
      compliance_name: item.title,
      regulator: item.type || item.category || 'Unknown',
      company_id: item.company_id,
      company_name: item.companies?.name || 'Unknown Entity',
      due_date: item.due_date,
      status: item.status,
      priority: item.priority || 'Medium',
      risk_level: item.risk_level || 'Medium',
      days_until_due: daysUntilDue,
      urgency_type: urgency,
      required_documents: requiredDocs,
      document_readiness: readiness,
    };
  });

  // Final sorting:
  // 1. Overdue first
  // 2. Due Today
  // 3. Due Soon
  // 4. Highest Priority (Critical/High)
  // 5. Soonest Due Date
  return actions.sort((a, b) => {
    // Urgency Score
    const getUrgencyScore = (type: UrgencyType) => {
      if (type === 'overdue') return 3;
      if (type === 'due_today') return 2;
      return 1;
    };

    const urgencyDiff = getUrgencyScore(b.urgency_type) - getUrgencyScore(a.urgency_type);
    if (urgencyDiff !== 0) return urgencyDiff;

    // Priority Score
    const getPriorityScore = (p: string) => {
      if (p === 'Critical') return 3;
      if (p === 'High') return 2;
      if (p === 'Medium') return 1;
      return 0;
    };

    const priorityDiff = getPriorityScore(b.priority) - getPriorityScore(a.priority);
    if (priorityDiff !== 0) return priorityDiff;

    // Due Date (soonest first)
    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
  }).slice(0, 5); // Return only top 5
}
