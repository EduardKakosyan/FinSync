export const getDateRange = (period: 'daily' | 'weekly' | 'monthly') => {
  const now = new Date();
  const startDate = new Date();
  const endDate = new Date();
  
  // Set to start of day
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);
  
  switch (period) {
    case 'daily':
      // Already set to today
      break;
      
    case 'weekly':
      // Get start of week (Sunday)
      const dayOfWeek = now.getDay();
      startDate.setDate(now.getDate() - dayOfWeek);
      // End date is today
      endDate.setTime(now.getTime());
      endDate.setHours(23, 59, 59, 999);
      break;
      
    case 'monthly':
      // Get start of month
      startDate.setDate(1);
      // End date is today
      endDate.setTime(now.getTime());
      endDate.setHours(23, 59, 59, 999);
      break;
  }
  
  return { startDate, endDate };
};

export const formatCurrency = (amount: number): string => {
  const formatted = new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(amount);
  
  // Ensure consistent formatting across different environments
  return formatted.replace('$', 'CA$');
};

export const calculateHST = (amount: number, rate: number = 0.14): number => {
  return amount * rate;
};