/**
 * Utility functions for date formatting and calculations
 * Used for transaction dates, filtering, and display
 */

/**
 * Format date for display in transaction lists
 */
export const formatTransactionDate = (date: Date): string => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const transactionDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (transactionDate.getTime() === today.getTime()) {
    return 'Today';
  } else if (transactionDate.getTime() === yesterday.getTime()) {
    return 'Yesterday';
  } else if (now.getTime() - transactionDate.getTime() < 7 * 24 * 60 * 60 * 1000) {
    // Within last week
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  } else {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: now.getFullYear() !== date.getFullYear() ? 'numeric' : undefined
    });
  }
};

/**
 * Format date for detailed display
 */
export const formatFullDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Format date for form inputs (YYYY-MM-DD)
 */
export const formatDateForInput = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * Parse date from form input
 */
export const parseDateFromInput = (dateString: string): Date => {
  return new Date(dateString);
};

/**
 * Get start and end dates for different time periods
 */
export const getDateRange = (period: 'today' | 'week' | 'month' | 'year'): {
  startDate: Date;
  endDate: Date;
} => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (period) {
    case 'today':
      return {
        startDate: today,
        endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1), // End of today
      };
    
    case 'week':
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
      return {
        startDate: startOfWeek,
        endDate: new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000 - 1), // End of week
      };
    
    case 'month':
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      return {
        startDate: startOfMonth,
        endDate: endOfMonth,
      };
    
    case 'year':
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      return {
        startDate: startOfYear,
        endDate: endOfYear,
      };
    
    default:
      return {
        startDate: today,
        endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
      };
  }
};

/**
 * Get date range for last N days
 */
export const getLastNDaysRange = (days: number): {
  startDate: Date;
  endDate: Date;
} => {
  const now = new Date();
  const startDate = new Date(now.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);
  
  return { startDate, endDate };
};

/**
 * Get date range for current week
 */
export const getCurrentWeekRange = (): {
  startDate: Date;
  endDate: Date;
} => {
  return getDateRange('week');
};

/**
 * Get date range for current month
 */
export const getCurrentMonthRange = (): {
  startDate: Date;
  endDate: Date;
} => {
  return getDateRange('month');
};

/**
 * Check if date is within range
 */
export const isDateInRange = (date: Date, startDate: Date, endDate: Date): boolean => {
  return date >= startDate && date <= endDate;
};

/**
 * Get relative date description
 */
export const getRelativeDateDescription = (date: Date): string => {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) {
    return 'Today';
  } else if (diffInDays === 1) {
    return 'Yesterday';
  } else if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  } else if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
  } else if (diffInDays < 365) {
    const months = Math.floor(diffInDays / 30);
    return months === 1 ? '1 month ago' : `${months} months ago`;
  } else {
    const years = Math.floor(diffInDays / 365);
    return years === 1 ? '1 year ago' : `${years} years ago`;
  }
};

/**
 * Group dates by month for display
 */
export const groupDatesByMonth = (dates: Date[]): Record<string, Date[]> => {
  return dates.reduce((groups, date) => {
    const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    if (!groups[monthKey]) {
      groups[monthKey] = [];
    }
    groups[monthKey].push(date);
    return groups;
  }, {} as Record<string, Date[]>);
};

/**
 * Get month name from date
 */
export const getMonthName = (date: Date): string => {
  return date.toLocaleDateString('en-US', { month: 'long' });
};

/**
 * Get abbreviated month name from date
 */
export const getShortMonthName = (date: Date): string => {
  return date.toLocaleDateString('en-US', { month: 'short' });
};

/**
 * Check if date is today
 */
export const isToday = (date: Date): boolean => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

/**
 * Check if date is yesterday
 */
export const isYesterday = (date: Date): boolean => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  );
};

/**
 * Get time periods for filtering
 */
export const getFilterTimePeriods = (): Array<{
  label: string;
  value: string;
  startDate: Date;
  endDate: Date;
}> => {
  return [
    {
      label: 'Today',
      value: 'today',
      ...getDateRange('today'),
    },
    {
      label: 'This Week',
      value: 'week',
      ...getDateRange('week'),
    },
    {
      label: 'This Month',
      value: 'month',
      ...getDateRange('month'),
    },
    {
      label: 'This Year',
      value: 'year',
      ...getDateRange('year'),
    },
    {
      label: 'Last 7 Days',
      value: 'last7',
      ...getLastNDaysRange(7),
    },
    {
      label: 'Last 30 Days',
      value: 'last30',
      ...getLastNDaysRange(30),
    },
  ];
};