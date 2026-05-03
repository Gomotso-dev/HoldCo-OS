import { supabase } from '../lib/supabase';

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
    try {
      // In production, the "send-email" function handles Resend communication.
      // Requires RESEND_API_KEY to be set as a Supabase Secret.
      
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: payload,
      });

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      // Graceful error handling: log the error but don't crash the calling flow
      console.error('[EmailService] Error sending email via Edge Function:', error);
      
      // Fallback for development if edge functions are not reachable/configured
      if (import.meta.env.DEV) {
        console.group('📧 [DEV FALLBACK] Email would have been sent:');
        console.info(`To: ${payload.to}`);
        console.info(`Subject: ${payload.subject}`);
        console.groupEnd();
      }

      return { success: false, error };
    }
  }
}
