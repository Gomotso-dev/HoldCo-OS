import { supabase } from '../lib/supabase';
import { getTodaysActions, TodaysAction } from './complianceActions';
import { EmailService } from './emailService';
import { format } from 'date-fns';

/**
 * Notification Service (Email-based)
 * Handles daily summaries and urgent compliance alerts.
 */

export class NotificationService {
  
  /**
   * HELPERS
   */
  private static async sendEmail(payload: { to: string; subject: string; html: string; text: string }) {
    // We proxy to our real EmailService which handles backend communication
    return await EmailService.sendEmail(payload);
  }

  /**
   * FEATURE 1: Daily Summary Email
   * Aggregates tasks for the user and sends a single summary.
   */
  static async sendDailySummary(userId: string) {
    try {
      // 1. Fetch user email
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.id !== userId) return;

      // 2. Fetch urgent actions
      const allActions = await getTodaysActions(userId);
      
      // Filter for strictly urgent (≤ 3 days)
      const urgentActions = allActions.filter(action => 
        action.urgency_type === 'overdue' || 
        action.urgency_type === 'due_today' || 
        action.days_until_due <= 3
      );

      if (urgentActions.length === 0) return;

      const overdueCount = urgentActions.filter(a => a.urgency_type === 'overdue').length;
      const totalUrgent = urgentActions.length;

      // 3. Build Email Template
      const subject = `🚨 You have ${totalUrgent} urgent compliance items - HoldCo OS`;
      
      let itemsListText = '';
      let itemsListHtml = '';

      urgentActions.forEach(action => {
        const msg = action.urgency_type === 'overdue' 
          ? `Overdue by ${Math.abs(action.days_until_due)} days` 
          : action.urgency_type === 'due_today' ? 'Due today' : `Due in ${action.days_until_due} days`;
        
        itemsListText += `- ${action.compliance_name} (${action.company_name}): ${msg}\n`;
        itemsListHtml += `
          <div style="padding: 12px; border-bottom: 1px solid #f3f4f6;">
            <div style="font-weight: bold; color: #111827;">${action.compliance_name}</div>
            <div style="font-size: 12px; color: #6b7280; font-weight: bold; text-transform: uppercase;">${action.company_name}</div>
            <div style="font-size: 13px; margin-top: 4px; color: ${action.urgency_type === 'overdue' ? '#ef4444' : '#f59e0b'}; font-weight: 800;">${msg}</div>
          </div>
        `;
      });

      const text = `Hi ${user.email},\n\nYou have ${totalUrgent} urgent compliance items requiring attention:\n\n${itemsListText}\n\nLog in to your HoldCo OS dashboard to resolve these.`;
      
      const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #374151;">
          <h2 style="color: #111827; font-weight: 900; text-transform: uppercase; letter-spacing: -0.025em;">HoldCo OS Alert</h2>
          <p>Hi ${user.email},</p>
          <p>You have <strong>${totalUrgent} urgent compliance items</strong> that need your attention today.</p>
          <div style="background-color: #f9fafb; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden; margin: 20px 0;">
            ${itemsListHtml}
          </div>
          <a href="${window.location.origin}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">Open Dashboard</a>
          <p style="font-size: 12px; color: #9ca3af; margin-top: 40px;">This is an automated reminder from your HoldCo OS Compliance Engine.</p>
        </div>
      `;

      await this.sendEmail({ to: user.email!, subject, html, text });

    } catch (error) {
      console.error('Failed to send daily summary:', error);
    }
  }

  /**
   * FEATURE 2: Trigger Alerts
   * Scans items and sends individual alerts for 1-day warnings or newly overdue status.
   */
  static async processTriggers(userId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.id !== userId) return;

      const actions = await getTodaysActions(userId);
      
      for (const action of actions) {
        // Trigger alert if due in exactly 1 day
        if (action.days_until_due === 1) {
          await this.sendUrgentAlert(
            { title: action.compliance_name }, 
            action.company_name, 
            user.email!
          );
        }
        
        // Trigger alert if overdue (usually would track if already sent, but for now we follow simple logic)
        if (action.days_until_due === -1) {
          const subject = `❌ OVERDUE: ${action.compliance_name} is now late`;
          const text = `The compliance item "${action.compliance_name}" for ${action.company_name} is now overdue. Please log in immediately.`;
          const html = `<p>Item <strong>${action.compliance_name}</strong> is overdue.</p>`;
          await this.sendEmail({ to: user.email!, subject, html, text });
        }
      }
    } catch (error) {
      console.error('Failed to process notification triggers:', error);
    }
  }

  /**
   * FEATURE 2: Trigger Alert
   * Sends an alert for a specific milestone (e.g. 1 day left)
   */
  static async sendUrgentAlert(item: any, companyName: string, userEmail: string) {
    try {
      const subject = `⚠️ URGENT: ${item.title} due in 24 hours`;
      const text = `The compliance item "${item.title}" for ${companyName} is due tomorrow. Please ensure all documents are uploaded and ready for submission.`;
      const html = `
        <div style="font-family: sans-serif; max-width: 600px; color: #374151;">
          <h3 style="color: #ef4444; font-weight: 900;">LAST MINUTE REMINDER</h3>
          <p>The following obligation is due <strong>tomorrow</strong>:</p>
          <div style="padding: 16px; background: #fff7ed; border-left: 4px solid #f97316; margin: 16px 0;">
            <strong>${item.title}</strong><br/>
            <span style="font-size: 13px;">${companyName}</span>
          </div>
          <p>Please log in and complete this to avoid penalties.</p>
        </div>
      `;

      await this.sendEmail({ to: userEmail, subject, html, text });

    } catch (error) {
      console.error('Failed to send urgent alert:', error);
    }
  }
}
