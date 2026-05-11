import { supabase, isSupabaseConfigured } from '../lib/supabase';

/**
 * Email Service
 * Handles communication with Supabase Edge Functions for real email delivery.
 */

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  /**
   * Sends an email via Supabase Edge Functions
   */
  static async sendEmail(payload: EmailPayload) {
    // Fallback for development if edge functions are not reachable/configured
    const logManualEmail = () => {
      console.group('📧 [EMAIL MOCK] Email would have been sent:');
      console.info(`To: ${payload.to}`);
      console.info(`Subject: ${payload.subject}`);
      if (!isSupabaseConfigured) {
        console.warn('Note: Connect Supabase in Secrets to enable real email sending.');
      }
      console.groupEnd();
    };

    if (!isSupabaseConfigured) {
      logManualEmail();
      return { success: true, mocked: true };
    }

    try {
      // In production, the "send-email" function handles Resend communication.
      // Requires RESEND_API_KEY to be set as a Supabase Secret.
      
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: payload,
      });

      if (error) {
        // If it's the specific "Failed to send request" error on a real URL, 
        // it might be a local dev issue or function not deployed yet.
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      // Graceful error handling: log the error but don't crash the calling flow
      console.error('[EmailService] Error sending email via Edge Function:', error);
      
      logManualEmail();

      return { success: false, error };
    }
  }
}
