/**
 * Recurring Transaction Form Component
 * Allows users to set up recurring transactions like salary, rent, bills, etc.
 */

import React, { useState } from 'react';
import { View, Text, Switch, Alert } from 'react-native';
import { Card, Button, Input, Typography } from '../../design-system';
import { useTheme } from '../../design-system/ThemeProvider';
import { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import DateTimePicker from '@react-native-community/datetimepicker';

export interface RecurringOptions {
  isRecurring: boolean;
  interval: 'monthly' | 'weekly' | 'yearly';
  dayOfMonth?: number; // For monthly (1-31)
  dayOfWeek?: number; // For weekly (0-6, Sunday-Saturday)
  endDate?: Date;
}

interface RecurringTransactionFormProps {
  value: RecurringOptions;
  onChange: (options: RecurringOptions) => void;
  transactionType: 'income' | 'expense';
}

export const RecurringTransactionForm: React.FC<RecurringTransactionFormProps> = ({
  value,
  onChange,
  transactionType,
}) => {
  const theme = useTheme();
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const handleToggleRecurring = (isRecurring: boolean) => {
    onChange({
      ...value,
      isRecurring,
      interval: isRecurring ? 'monthly' : value.interval,
    });
  };

  const handleIntervalChange = (interval: 'monthly' | 'weekly' | 'yearly') => {
    onChange({
      ...value,
      interval,
      dayOfMonth: interval === 'monthly' ? (value.dayOfMonth || 1) : undefined,
      dayOfWeek: interval === 'weekly' ? (value.dayOfWeek || 0) : undefined,
    });
  };

  const handleDayOfMonthChange = (day: string) => {
    const dayNumber = parseInt(day, 10);
    if (!isNaN(dayNumber) && dayNumber >= 1 && dayNumber <= 31) {
      onChange({
        ...value,
        dayOfMonth: dayNumber,
      });
    }
  };

  const handleDayOfWeekChange = (day: number) => {
    onChange({
      ...value,
      dayOfWeek: day,
    });
  };

  const handleEndDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      onChange({
        ...value,
        endDate: selectedDate,
      });
    }
  };

  const handleRemoveEndDate = () => {
    onChange({
      ...value,
      endDate: undefined,
    });
  };

  const dayOfWeekOptions = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
  ];

  const intervalOptions = [
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' },
  ];

  if (!value.isRecurring) {
    return (
      <Card style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Typography variant="h6" style={{ color: theme.colors.text }}>
              Make this recurring
            </Typography>
            <Typography variant="body2" style={{ color: theme.colors.textSecondary, marginTop: 4 }}>
              {transactionType === 'income' ? 'Perfect for salary, freelance payments' : 'Great for rent, utilities, subscriptions'}
            </Typography>
          </View>
          <Switch
            value={value.isRecurring}
            onValueChange={handleToggleRecurring}
            thumbColor={value.isRecurring ? theme.colors.primary : theme.colors.surface}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary + '40' }}
          />
        </View>
      </Card>
    );
  }

  return (
    <Card style={{ marginBottom: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Typography variant="h6" style={{ color: theme.colors.text }}>
          Recurring Transaction
        </Typography>
        <Switch
          value={value.isRecurring}
          onValueChange={handleToggleRecurring}
          thumbColor={value.isRecurring ? theme.colors.primary : theme.colors.surface}
          trackColor={{ false: theme.colors.border, true: theme.colors.primary + '40' }}
        />
      </View>

      {/* Interval Selection */}
      <View style={{ marginBottom: 16 }}>
        <Typography variant="body1" style={{ color: theme.colors.text, marginBottom: 8 }}>
          Frequency
        </Typography>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {intervalOptions.map((option) => (
            <Button
              key={option.value}
              variant={value.interval === option.value ? 'primary' : 'outline'}
              onPress={() => handleIntervalChange(option.value as any)}
              style={{ flex: 1, marginHorizontal: 4 }}
            >
              {option.label}
            </Button>
          ))}
        </View>
      </View>

      {/* Day Selection for Monthly */}
      {value.interval === 'monthly' && (
        <View style={{ marginBottom: 16 }}>
          <Typography variant="body1" style={{ color: theme.colors.text, marginBottom: 8 }}>
            Day of Month
          </Typography>
          <Input
            placeholder="Enter day (1-31)"
            value={value.dayOfMonth?.toString() || ''}
            onChangeText={handleDayOfMonthChange}
            keyboardType="numeric"
            style={{ width: 100 }}
          />
          <Typography variant="body2" style={{ color: theme.colors.textSecondary, marginTop: 4 }}>
            Transaction will occur on the {value.dayOfMonth || 1}
            {value.dayOfMonth === 1 || value.dayOfMonth === 21 || value.dayOfMonth === 31 ? 'st' : 
             value.dayOfMonth === 2 || value.dayOfMonth === 22 ? 'nd' : 
             value.dayOfMonth === 3 || value.dayOfMonth === 23 ? 'rd' : 'th'} of each month
          </Typography>
        </View>
      )}

      {/* Day Selection for Weekly */}
      {value.interval === 'weekly' && (
        <View style={{ marginBottom: 16 }}>
          <Typography variant="body1" style={{ color: theme.colors.text, marginBottom: 8 }}>
            Day of Week
          </Typography>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {dayOfWeekOptions.map((option) => (
              <Button
                key={option.value}
                variant={value.dayOfWeek === option.value ? 'primary' : 'outline'}
                onPress={() => handleDayOfWeekChange(option.value)}
                style={{ marginBottom: 8 }}
              >
                {option.label.substring(0, 3)}
              </Button>
            ))}
          </View>
        </View>
      )}

      {/* End Date */}
      <View style={{ marginBottom: 16 }}>
        <Typography variant="body1" style={{ color: theme.colors.text, marginBottom: 8 }}>
          End Date (Optional)
        </Typography>
        {value.endDate ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Typography variant="body2" style={{ color: theme.colors.text }}>
              Ends on: {value.endDate.toLocaleDateString()}
            </Typography>
            <Button variant="outline" onPress={handleRemoveEndDate}>
              Remove
            </Button>
          </View>
        ) : (
          <Button variant="outline" onPress={() => setShowEndDatePicker(true)}>
            Set End Date
          </Button>
        )}
      </View>

      {/* Summary */}
      <Card style={{ backgroundColor: theme.colors.surface, padding: 12 }}>
        <Typography variant="body2" style={{ color: theme.colors.textSecondary }}>
          This transaction will repeat{' '}
          {value.interval === 'weekly' && value.dayOfWeek !== undefined
            ? `every ${dayOfWeekOptions.find(d => d.value === value.dayOfWeek)?.label}`
            : value.interval === 'monthly' && value.dayOfMonth
            ? `on the ${value.dayOfMonth}${value.dayOfMonth === 1 || value.dayOfMonth === 21 || value.dayOfMonth === 31 ? 'st' : 
               value.dayOfMonth === 2 || value.dayOfMonth === 22 ? 'nd' : 
               value.dayOfMonth === 3 || value.dayOfMonth === 23 ? 'rd' : 'th'} of each month`
            : value.interval === 'yearly'
            ? 'every year on the same date'
            : value.interval}
          {value.endDate ? ` until ${value.endDate.toLocaleDateString()}` : ' indefinitely'}.
        </Typography>
      </Card>

      {showEndDatePicker && (
        <DateTimePicker
          value={value.endDate || new Date()}
          mode="date"
          display="default"
          onChange={handleEndDateChange}
          minimumDate={new Date()}
        />
      )}
    </Card>
  );
};

export default RecurringTransactionForm;