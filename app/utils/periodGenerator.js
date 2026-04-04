// backend/app/utils/periodGenerator.js
/**
 * Utility for generating emission periods based on policy
 * Used by emissionPolicyService to create periods automatically
 */

/**
 * Get week number for ISO week date
 * @param {Date} date - The date
 * @returns {number} Week number (1-53)
 */
function getWeekNumber(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  // Set to nearest Thursday (current date + 4 - current day number)
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

/**
 * Add days to a date
 * @param {Date} date - Starting date
 * @param {number} days - Number of days to add
 * @returns {Date} New date
 */
function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Add months to a date
 * @param {Date} date - Starting date
 * @param {number} months - Number of months to add
 * @returns {Date} New date
 */
function addMonths(date, months) {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

/**
 * Get end of month
 * @param {Date} date - Date in the month
 * @returns {Date} Last day of the month
 */
function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

/**
 * Format date as YYYY-MM-DD
 * @param {Date} date - The date
 * @returns {string} Formatted date
 */
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

/**
 * Generate periods for a policy
 * @param {Object} policy - The emission policy
 * @param {string} policy.frequency - daily, weekly, or monthly
 * @param {string} policy.anchor_date - Starting date (YYYY-MM-DD)
 * @param {number} policy.anchor_day - Reference day for weekly (1-7)
 * @param {string} policy.project_end_date - Project end date (YYYY-MM-DD)
 * @param {string} customEndDate - Optional custom end date
 * @returns {Array} Array of period objects
 */
export function generatePeriodsFromPolicy(policy, customEndDate = null) {
  console.log('\n📅 ===== GENERATE PERIODS FROM POLICY =====');
  console.log('Policy received:', JSON.stringify(policy, null, 2));
  console.log('Custom end date:', customEndDate);

  const periods = [];
  
  // Parse dates
  if (!policy.anchor_date) {
    console.error('❌ Policy missing anchor_date');
    throw new Error('Policy missing anchor_date');
  }

  const startDate = new Date(policy.anchor_date);
  
  // Use custom end date if provided, otherwise use policy project_end_date
  let endDateValue = customEndDate || policy.project_end_date;
  
  if (!endDateValue) {
    console.error('❌ No end date provided and policy has no project_end_date');
    return [];
  }

  const endDate = new Date(endDateValue);

  // Validate inputs
  if (isNaN(startDate.getTime())) {
    console.error('❌ Invalid anchor_date:', policy.anchor_date);
    throw new Error(`Invalid anchor_date: ${policy.anchor_date}`);
  }
  if (isNaN(endDate.getTime())) {
    console.error('❌ Invalid end date:', endDateValue);
    throw new Error(`Invalid end date: ${endDateValue}`);
  }

  // Ensure start date is at beginning of day
  startDate.setHours(0, 0, 0, 0);
  
  // Set end date to end of day
  const finalDate = new Date(endDate);
  finalDate.setHours(23, 59, 59, 999);

  console.log(`📅 Generating periods from ${startDate.toISOString()} to ${finalDate.toISOString()}`);
  console.log(`📊 Frequency: ${policy.frequency}`);

  let currentDate = new Date(startDate);
  let periodNumber = 1;

  // Safety check - max periods to prevent infinite loops
  const MAX_PERIODS = 1000;
  
  while (currentDate <= finalDate && periodNumber <= MAX_PERIODS) {
    let periodEnd, dueDate, label;

    switch (policy.frequency) {
      case 'daily':
        periodEnd = new Date(currentDate);
        dueDate = new Date(currentDate);
        dueDate.setDate(dueDate.getDate() + 1);
        dueDate.setHours(23, 59, 59, 999);
        label = currentDate.toISOString().split('T')[0];
        break;

      case 'weekly': {
        periodEnd = new Date(currentDate);
        periodEnd.setDate(periodEnd.getDate() + 6);
        periodEnd.setHours(23, 59, 59, 999);
        
        dueDate = new Date(periodEnd);
        dueDate.setDate(dueDate.getDate() + 2);
        dueDate.setHours(23, 59, 59, 999);
        
        const weekNumber = getWeekNumber(currentDate);
        label = `W${weekNumber}-${currentDate.getFullYear()}`;
        break;
      }

      case 'monthly': {
        // Last day of the month
        periodEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        periodEnd.setHours(23, 59, 59, 999);
        
        dueDate = new Date(periodEnd);
        dueDate.setDate(dueDate.getDate() + 5);
        dueDate.setHours(23, 59, 59, 999);
        
        label = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
        break;
      }

      default:
        throw new Error(`Unknown frequency: ${policy.frequency}`);
    }

    // Set period end to end of day
    periodEnd.setHours(23, 59, 59, 999);

    const period = {
      emission_id: policy.id,
      period_number: periodNumber,
      period_label: label,
      period_start: currentDate.toISOString().split('T')[0],
      period_end: periodEnd.toISOString().split('T')[0],
      due_date: dueDate.toISOString().split('T')[0],
      status: 'pending',
      created_at: new Date()
      // ✅ updated_at SUPPRIMÉ - n'existe pas dans la table
    };

    periods.push(period);

    // Log first period as sample
    if (periodNumber === 1) {
      console.log('📅 First period generated:', {
        period_number: period.period_number,
        period_label: period.period_label,
        period_start: period.period_start,
        period_end: period.period_end,
        due_date: period.due_date
      });
    }

    // Move to next period
    switch (policy.frequency) {
      case 'daily':
        currentDate.setDate(currentDate.getDate() + 1);
        break;
      case 'weekly':
        currentDate.setDate(currentDate.getDate() + 7);
        break;
      case 'monthly':
        currentDate.setMonth(currentDate.getMonth() + 1);
        // Ensure we're at the first day of the month
        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        break;
    }

    periodNumber++;
  }

  if (periodNumber >= MAX_PERIODS) {
    console.warn(`⚠️ Reached maximum periods (${MAX_PERIODS}) - possible infinite loop`);
  }

  console.log(`✅ Generated ${periods.length} periods total`);
  console.log('================================\n');
  
  return periods;
}

/**
 * Generate period label for a specific date
 * @param {Date} date - The date
 * @param {string} frequency - daily, weekly, or monthly
 * @returns {string} Period label
 */
export function generatePeriodLabel(date, frequency) {
  const d = new Date(date);
  
  switch (frequency) {
    case 'daily':
      return formatDate(d);
    case 'weekly':
      return `W${getWeekNumber(d)}-${d.getFullYear()}`;
    case 'monthly':
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    default:
      throw new Error(`Unknown frequency: ${frequency}`);
  }
}

/**
 * Calculate due date
 * @param {Date} periodEnd - End date of the period
 * @param {string} frequency - daily, weekly, or monthly
 * @returns {Date} Due date
 */
export function calculateDueDate(periodEnd, frequency) {
  const end = new Date(periodEnd);
  
  switch (frequency) {
    case 'daily':
      return addDays(end, 1);
    case 'weekly':
      return addDays(end, 2);
    case 'monthly':
      return addDays(end, 5);
    default:
      throw new Error(`Unknown frequency: ${frequency}`);
  }
}

/**
 * Check if a period is overdue
 * @param {string} dueDate - Due date (YYYY-MM-DD)
 * @param {string} currentDate - Current date (YYYY-MM-DD) - defaults to today
 * @returns {boolean} True if overdue
 */
export function isPeriodOverdue(dueDate, currentDate = null) {
  const today = currentDate ? new Date(currentDate) : new Date();
  const due = new Date(dueDate);
  
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  
  return today > due;
}

/**
 * Get period status based on due date and received flag
 * @param {string} dueDate - Due date
 * @param {boolean} isReceived - Whether the period has been received
 * @param {string} currentDate - Current date - defaults to today
 * @returns {string} Status: 'pending', 'received', 'overdue', or 'late'
 */
export function getPeriodStatus(dueDate, isReceived = false, currentDate = null) {
  if (isReceived) {
    return 'received';
  }
  
  const today = currentDate ? new Date(currentDate) : new Date();
  const due = new Date(dueDate);
  
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  
  // Calculate days difference
  const diffTime = today.getTime() - due.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays > 7) {
    return 'overdue'; // More than 7 days late
  } else if (diffDays > 0) {
    return 'late'; // 1-7 days late
  } else {
    return 'pending'; // Not due yet
  }
}

/**
 * Get date range for a period
 * @param {string} periodLabel - Period label (e.g., "W12-2025")
 * @param {string} frequency - daily, weekly, or monthly
 * @returns {Object} Start and end dates
 */
export function getDateRangeFromLabel(periodLabel, frequency) {
  switch (frequency) {
    case 'weekly': {
      // Format: W{week}-{year}
      const matches = periodLabel.match(/^W(\d+)-(\d{4})$/);
      if (!matches) throw new Error(`Invalid weekly label: ${periodLabel}`);
      
      const week = parseInt(matches[1]);
      const year = parseInt(matches[2]);
      
      // Simple calculation - assumes week 1 starts on first Thursday of year
      const start = new Date(year, 0, 1);
      start.setDate(start.getDate() + (week - 1) * 7);
      
      const end = addDays(start, 6);
      
      return {
        start: formatDate(start),
        end: formatDate(end)
      };
    }
    
    case 'monthly': {
      // Format: {year}-{month}
      const matches = periodLabel.match(/^(\d{4})-(\d{2})$/);
      if (!matches) throw new Error(`Invalid monthly label: ${periodLabel}`);
      
      const year = parseInt(matches[1]);
      const month = parseInt(matches[2]) - 1;
      
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0);
      
      return {
        start: formatDate(start),
        end: formatDate(end)
      };
    }
    
    case 'daily': {
      // Format: YYYY-MM-DD
      const date = new Date(periodLabel);
      if (isNaN(date.getTime())) {
        throw new Error(`Invalid daily label: ${periodLabel}`);
      }
      
      return {
        start: periodLabel,
        end: periodLabel
      };
    }
    
    default:
      throw new Error(`Unknown frequency: ${frequency}`);
  }
}

/**
 * Get next period date based on frequency
 * @param {Date} currentDate - Current date
 * @param {string} frequency - daily, weekly, or monthly
 * @param {number} anchorDay - Anchor day for weekly (1-7)
 * @returns {Date} Next period date
 */
export function getNextPeriodDate(currentDate, frequency, anchorDay = null) {
  const date = new Date(currentDate);
  
  switch (frequency) {
    case 'daily':
      return addDays(date, 1);
      
    case 'weekly':
      date.setDate(date.getDate() + 7);
      if (anchorDay) {
        const currentDay = date.getDay() || 7;
        const dayDiff = anchorDay - currentDay;
        if (dayDiff !== 0) {
          date.setDate(date.getDate() + dayDiff);
        }
      }
      return date;
      
    case 'monthly':
      return addMonths(date, 1);
      
    default:
      throw new Error(`Unknown frequency: ${frequency}`);
  }
}

/**
 * Check if a date falls within a period
 * @param {Date} date - Date to check
 * @param {Object} period - Period object with period_start and period_end
 * @returns {boolean} True if date is within period
 */
export function isDateInPeriod(date, period) {
  const checkDate = new Date(date);
  const start = new Date(period.period_start);
  const end = new Date(period.period_end);
  
  checkDate.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  
  return checkDate >= start && checkDate <= end;
}

export default {
  generatePeriodsFromPolicy,
  generatePeriodLabel,
  calculateDueDate,
  isPeriodOverdue,
  getPeriodStatus,
  getDateRangeFromLabel,
  getNextPeriodDate,
  isDateInPeriod,
  getWeekNumber,
  addDays,
  addMonths,
  endOfMonth,
  formatDate
};