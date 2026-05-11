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
  company_id?: string;
  compliance_id?: string;
  document_id?: string;
  action_type: ActionType;
  description: string;
  metadata?: any;
  created_at: string;
  company_name?: string;
}

export class ActivityLogService {
  /**
   * Logs a new activity to the audit trail
   */
  static async logActivity(params: {
    action_type: ActionType;
    description: string;
    company_id?: string;
    compliance_id?: string;
    document_id? : string;
    metadata?: any;
  }) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('activity_log')
        .insert({
          owner_id: user.id,
          action_type: params.action_type,
          description: params.description,
          company_id: params.company_id,
          compliance_id: params.compliance_id,
          document_id: params.document_id,
          metadata: params.metadata,
          created_at: new Date().toISOString()
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
          companies!company_id ( name )
        `)
        .eq('owner_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map(log => ({
        ...log,
        company_name: (log as any).companies?.name
      })) as ActivityLog[];
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
          companies!company_id ( name )
        `)
        .eq('owner_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(log => ({
        ...log,
        company_name: (log as any).companies?.name
      })) as ActivityLog[];
    } catch (err) {
      console.error('Failed to fetch all activity:', err);
      return [];
    }
  }
}
