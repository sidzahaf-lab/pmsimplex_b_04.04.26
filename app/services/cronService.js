// app/services/cronService.js
import cron from 'node-cron';
import authService from './authService.js';
import emissionPeriodService from './emissionPeriodService.js';

class CronService {
  constructor() {
    this.jobs = [];
  }

  // Initialize all cron jobs
  initializeJobs() {
    console.log('⏰ Initializing cron jobs...');

    // Session cleanup - daily at 2:00 AM
    this.addJob(
      'session-cleanup',
      '0 2 * * *',
      this.runSessionCleanup
    );

    // Compliance check - daily at 2:30 AM
    this.addJob(
      'compliance-check',
      '30 2 * * *',
      this.runComplianceCheck
    );

    // Weekly report - every Monday at 8:00 AM
    this.addJob(
      'weekly-report',
      '0 8 * * 1',
      this.runWeeklyReport
    );

    console.log(`✅ Initialized ${this.jobs.length} cron jobs`);
  }

  // Add a new cron job
  addJob(name, schedule, task) {
    try {
      const job = cron.schedule(schedule, async () => {
        console.log(`⏰ Running cron job: ${name} at ${new Date().toISOString()}`);
        try {
          await task.bind(this)();
          console.log(`✅ Cron job completed: ${name}`);
        } catch (error) {
          console.error(`❌ Cron job failed: ${name}`, error);
        }
      });
      
      this.jobs.push({ name, schedule, job });
      console.log(`✅ Scheduled job: ${name} (${schedule})`);
    } catch (error) {
      console.error(`❌ Failed to schedule job: ${name}`, error);
    }
  }

  // Run session cleanup
  async runSessionCleanup() {
    try {
      console.log('🧹 Running session cleanup...');
      const cleaned = await authService.cleanupExpiredSessions();
      console.log(`✅ Session cleanup completed: ${cleaned} expired sessions removed`);
      return cleaned;
    } catch (error) {
      console.error('❌ Session cleanup failed:', error);
      throw error;
    }
  }

  // Run compliance check
  async runComplianceCheck() {
    try {
      console.log('🔍 Running compliance check...');
      
      const result = await emissionPeriodService.checkAndUpdateCompliance(false);
      
      console.log(`📊 Compliance check results:`, {
        checked: result.checked,
        overdue_without_revisions: result.overdue_without_revisions,
        overdue_with_revisions: result.overdue_with_revisions
      });

      // Send alerts if there are overdue periods
      if (result.overdue_without_revisions > 0) {
        await this.sendComplianceAlerts(result);
      }

      return result;
    } catch (error) {
      console.error('❌ Compliance check failed:', error);
      throw error;
    }
  }

  // Run weekly report
  async runWeeklyReport() {
    try {
      console.log('📈 Running weekly report generation...');
      
      const stats = await emissionPeriodService.getPeriodStatistics({
        from_date: this.getDateDaysAgo(7)
      });

      console.log('📊 Weekly statistics:', stats);

      // Generate and save report (optional)
      // await this.saveWeeklyReport(stats);
      
      return stats;
    } catch (error) {
      console.error('❌ Weekly report failed:', error);
      throw error;
    }
  }

  // Send compliance alerts
  async sendComplianceAlerts(result) {
    console.log(`⚠️ Sending alerts for ${result.overdue_without_revisions} overdue periods`);
    
    // TODO: Implement email notifications
    // await emailService.sendComplianceAlert(result.periods);
    
    // TODO: Implement Slack notifications
    // await slackService.postMessage(`⚠️ ${result.overdue_without_revisions} periods are overdue without documents`);
  }

  // Helper: Get date from X days ago
  getDateDaysAgo(days) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  }

  // Stop all jobs
  stopAllJobs() {
    console.log('⏰ Stopping all cron jobs...');
    this.jobs.forEach(({ name, job }) => {
      job.stop();
      console.log(`✅ Stopped job: ${name}`);
    });
  }

  // List all jobs
  listJobs() {
    return this.jobs.map(({ name, schedule }) => ({ name, schedule }));
  }

  // Run a specific job manually
  async runJobManually(jobName) {
    const job = this.jobs.find(j => j.name === jobName);
    if (!job) {
      throw new Error(`Job not found: ${jobName}`);
    }

    console.log(`🔄 Manually running job: ${jobName}`);
    
    if (jobName === 'session-cleanup') {
      return await this.runSessionCleanup();
    } else if (jobName === 'compliance-check') {
      return await this.runComplianceCheck();
    } else if (jobName === 'weekly-report') {
      return await this.runWeeklyReport();
    }
  }
}

export default new CronService();