import { supabase } from '../lib/supabase';
import { differenceInDays, isPast, isToday, parseISO, startOfDay } from 'date-fns';
import { ActivityLogService } from './activityLogService';

export interface ComplianceScore {
  score: number;
  label: 'Healthy' | 'Needs Attention' | 'At Risk' | 'Critical';
  total_items: number;
  overdue_count: number;
  due_soon_count: number;
  missing_documents_count: number;
  riskReasons: string[];
}

export class ComplianceScoreService {
  
  static getLabel(score: number): ComplianceScore['label'] {
    if (score >= 80) return 'Healthy';
    if (score >= 60) return 'Needs Attention';
    if (score >= 40) return 'At Risk';
    return 'Critical';
  }

  /**
   * Calculates score for all companies belonging to a user
   */
  static async getGroupComplianceScore(userId: string): Promise<ComplianceScore> {
    try {
      const today = startOfDay(new Date());

      // 1. Fetch all pending and overdue compliance items
      const { data: items, error } = await supabase
        .from('compliance')
        .select('title, due_date, status, priority, risk_level, required_documents, company_id')
        .eq('owner_id', userId)
        .neq('status', 'Completed');

      // 2. Fetch company count and tax profiles to check setup completeness
      const { data: profiles } = await supabase
        .from('company_tax_profiles')
        .select('company_id')
        .eq('owner_id', userId);

      if (error) {
        console.warn('Compliance score fetch failed with camelCase, trying fallback...', error.message);
        const { data: fallbackItems, error: fallbackError } = await supabase
          .from('compliance')
          .select('title, due_date, status, priority, risk_level, required_documents, company_id')
          .eq('owner_id', userId)
          .neq('status', 'Completed');
        
        if (fallbackError) throw fallbackError;
        
        const mappedItems = (fallbackItems || []).map((item: any) => ({
          ...item,
          dueDate: item.dueDate || item.due_date,
          companyId: item.companyId || item.company_id
        }));
        return this.calculateFromItems(mappedItems, profiles || [], userId);
      }

      return this.calculateFromItems(items || [], profiles || [], userId);
    } catch (error) {
      console.error('Error calculating health score:', error);
      throw error;
    }
  }

  private static async calculateFromItems(items: any[], profiles: any[], userId: string): Promise<ComplianceScore> {
    const today = startOfDay(new Date());
    let score = 100;
    let overdueCount = 0;
    let dueSoonCount = 0;
    let missingDocsCount = 0;
    const riskReasons: string[] = [];

    if (items.length === 0) {
      // If no items exist, check if companies exist at all
      const { count } = await supabase.from('companies').select('*', { count: 'exact', head: true }).eq('owner_id', userId);
      if (count && count > 0 && (!profiles || profiles.length === 0)) {
         score -= 15;
         riskReasons.push('Compliance setup incomplete for some companies');
      }
      return {
        score: Math.max(0, score),
        label: this.getLabel(score),
        total_items: 0,
        overdue_count: 0,
        due_soon_count: 0,
        missing_documents_count: 0,
        riskReasons: riskReasons
      };
    }

    items.forEach(item => {
      const dueDateStr = item.due_date;
      if (!dueDateStr) return;
      
      const dueDate = parseISO(dueDateStr);
      const daysUntilDue = differenceInDays(dueDate, today);
      const isOverdue = isPast(dueDate) && !isToday(dueDate);

      // Scoring Logic
      if (isOverdue) {
        overdueCount++;
        const risk = item.risk_level?.toLowerCase();
        if (risk === 'high') score -= 25;
        else if (risk === 'medium') score -= 15;
        else score -= 10;
      } else if (isToday(dueDate)) {
        score -= 10;
      } else if (daysUntilDue <= 7) {
        dueSoonCount++;
        score -= 5;
      }

      if (item.required_documents && item.required_documents.length > 0) {
        missingDocsCount++;
        score -= 2; 
      }
    });

    if (overdueCount > 0) riskReasons.push(`${overdueCount} overdue items`);
    if (dueSoonCount > 0) riskReasons.push(`${dueSoonCount} items due within 7 days`);
    
    const finalScore = Math.max(0, score);

    await ActivityLogService.logActivity({
      action_type: 'score_calculated',
      description: `Compliance health score recalculated: ${finalScore}%`,
      metadata: { score: finalScore, label: this.getLabel(finalScore) }
    });

    return {
      score: finalScore,
      label: this.getLabel(finalScore),
      total_items: items.length,
      overdue_count: overdueCount,
      due_soon_count: dueSoonCount,
      missing_documents_count: missingDocsCount,
      riskReasons: riskReasons.slice(0, 3)
    };
  }
}
