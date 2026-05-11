import { supabase } from './supabase';

export type ActivityType = 'create' | 'update' | 'delete' | 'upload' | 'login';
export type EntityType = 'company' | 'compliance' | 'document' | 'finance' | 'user';

export async function logActivity(params: {
  eventType: ActivityType;
  entityType: EntityType;
  entityId: string;
  description: string;
  companyId?: string;
}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const timestamp = new Date().toISOString();
    const { error } = await supabase
      .from('activity_log')
      .insert([{
        owner_id: user.id,
        action_type: params.eventType,
        description: params.description,
        company_id: params.companyId,
        created_at: timestamp
      }]);

    if (error) console.error('Error logging activity:', error.message);
  } catch (err) {
    console.error('Activity logging failed:', err);
  }
}
