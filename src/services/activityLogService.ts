import { supabase } from '../lib/supabase';

export type ActionType = 
  | 'company_created' 
  | 'company_updated' 
  | 'compliance_generated' 
  | 'compliance_completed' 
  | 'compliance_created'
  | 'compliance_updated'
  | 'document_uploaded' 
  | 'document_linked' 
  | 'document_viewed'
  | 'setup_started'
  | 'setup_completed' 
  | 'score_calculated'
  | 'user_login'
  | 'report_exported'
  | 'report_printed'
  | 'settings_updated'
  | 'record_created';

export interface ActivityLog {
  id: string;
  owner_id: string;
  companyId?: string;
  complianceId?: string;
  documentId?: string;
  actionType: ActionType;
  description: string;
  metadata?: any;
  createdAt: string;
  company_name?: string;
}

export class ActivityLogService {
  /**
   * Logs a new activity to the audit trail
   */
  static async logActivity(params: {
    action_type?: ActionType; // Allow both for migration
    actionType?: ActionType;
    description: string;
    companyId?: string;
    company_id?: string;
    complianceId?: string;
    documentId?: string;
    metadata?: any;
  }) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('activity_log')
        .insert({
          owner_id: user.id,
          actionType: params.actionType || params.action_type,
          description: params.description,
          companyId: params.companyId || params.company_id,
          complianceId: params.complianceId,
          documentId: params.documentId,
          metadata: params.metadata,
          createdAt: new Date().toISOString()
        });

      if (error) throw error;
    } catch (err) {
      console.error('Failed to log activity:', err);
    }
  }

  /**
   * Fetches recent activity for a user
   */
  static async getRecentActivity(userId: string, limit: number = 10): Promise<ActivityLog[]> {
    try {
      const { data, error } = await supabase
        .from('activity_log')
        .select(`
          *,
          companies!companyId ( name )
        `)
        .eq('owner_id', userId)
        .order('createdAt', { ascending: false })
        .limit(limit);

      if (error) {
        console.warn('activity_log fetch with camelCase failed, trying fallback...');
        const fallbackRes = await supabase
          .from('activity_log')
          .select(`
            *,
            companies!company_id ( name )
          `)
          .eq('owner_id', userId)
          .order('created_at', { ascending: false })
          .limit(limit);
        
        if (fallbackRes.error) throw fallbackRes.error;
        return (fallbackRes.data || []).map(log => ({
          ...log,
          companyId: log.companyId || log.company_id,
          actionType: log.actionType || log.action_type,
          createdAt: log.createdAt || log.created_at,
          company_name: (log as any).companies?.name
        })) as ActivityLog[];
      }

      return (data || []).map(log => ({
        ...log,
        company_name: (log as any).companies?.name
      }));
    } catch (err) {
      console.error('Failed to fetch recent activity:', err);
      return [];
    }
  }

  /**
   * Fetches all activity for a user
   */
  static async getAllActivity(userId: string): Promise<ActivityLog[]> {
    try {
      const { data, error } = await supabase
        .from('activity_log')
        .select(`
          *,
          companies!companyId ( name )
        `)
        .eq('owner_id', userId)
        .order('createdAt', { ascending: false });

      if (error) {
        const fallbackRes = await supabase
          .from('activity_log')
          .select(`
            *,
            companies!company_id ( name )
          `)
          .eq('owner_id', userId)
          .order('created_at', { ascending: false });
        
        if (fallbackRes.error) throw fallbackRes.error;
        return (fallbackRes.data || []).map(log => ({
          ...log,
          companyId: log.companyId || log.company_id,
          actionType: log.actionType || log.action_type,
          createdAt: log.createdAt || log.created_at,
          company_name: (log as any).companies?.name
        })) as ActivityLog[];
      }

      return (data || []).map(log => ({
        ...log,
        company_name: (log as any).companies?.name
      }));
    } catch (err) {
      console.error('Failed to fetch all activity:', err);
      return [];
    }
  }
}
