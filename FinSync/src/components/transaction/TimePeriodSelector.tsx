import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS } from '@/constants';

export type TimePeriod = 'day' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

export interface TimePeriodOption {
  value: TimePeriod;
  label: string;
  shortLabel?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

interface TimePeriodSelectorProps {
  selectedPeriod: TimePeriod;
  onPeriodChange: (period: TimePeriod) => void;
  options?: TimePeriodOption[];
  style?: any;
  compact?: boolean;
  showIcons?: boolean;
  disabled?: boolean;
  variant?: 'segmented' | 'pills' | 'tabs';
}

const DEFAULT_OPTIONS: TimePeriodOption[] = [
  { value: 'day', label: 'Day', shortLabel: 'D', icon: 'today' },
  { value: 'week', label: 'Week', shortLabel: 'W', icon: 'calendar' },
  { value: 'month', label: 'Month', shortLabel: 'M', icon: 'calendar-outline' },
];

const QUARTER_YEAR_OPTIONS: TimePeriodOption[] = [
  { value: 'month', label: 'Month', shortLabel: 'M', icon: 'calendar-outline' },
  { value: 'quarter', label: 'Quarter', shortLabel: 'Q', icon: 'bar-chart' },
  { value: 'year', label: 'Year', shortLabel: 'Y', icon: 'time' },
];

const ALL_OPTIONS: TimePeriodOption[] = [
  { value: 'day', label: 'Day', shortLabel: 'D', icon: 'today' },
  { value: 'week', label: 'Week', shortLabel: 'W', icon: 'calendar' },
  { value: 'month', label: 'Month', shortLabel: 'M', icon: 'calendar-outline' },
  { value: 'quarter', label: 'Quarter', shortLabel: 'Q', icon: 'bar-chart' },
  { value: 'year', label: 'Year', shortLabel: 'Y', icon: 'time' },
  { value: 'custom', label: 'Custom', shortLabel: 'C', icon: 'options' },
];

const TimePeriodSelector: React.FC<TimePeriodSelectorProps> = ({
  selectedPeriod,
  onPeriodChange,
  options = DEFAULT_OPTIONS,
  style,
  compact = false,
  showIcons = false,
  disabled = false,
  variant = 'segmented',
}) => {
  const selectedIndex = options.findIndex(option => option.value === selectedPeriod);

  const renderSegmentedControl = () => (
    <View style={[styles.segmentedContainer, style]}>
      {options.map((option, index) => {
        const isSelected = option.value === selectedPeriod;
        const isFirst = index === 0;
        const isLast = index === options.length - 1;

        return (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.segmentedButton,
              isFirst && styles.segmentedButtonFirst,
              isLast && styles.segmentedButtonLast,
              isSelected && styles.segmentedButtonSelected,
              disabled && styles.segmentedButtonDisabled,
            ]}
            onPress={() => !disabled && onPeriodChange(option.value)}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`Select ${option.label} period`}
          >
            {showIcons && option.icon && (
              <Ionicons
                name={option.icon}
                size={compact ? 14 : 16}
                color={isSelected ? COLORS.PRIMARY : COLORS.TEXT_SECONDARY}
                style={styles.segmentedIcon}
              />
            )}
            <Text
              style={[
                styles.segmentedButtonText,
                compact && styles.segmentedButtonTextCompact,
                isSelected && styles.segmentedButtonTextSelected,
                disabled && styles.segmentedButtonTextDisabled,
              ]}
            >
              {compact && option.shortLabel ? option.shortLabel : option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderPillsControl = () => (
    <View style={[styles.pillsContainer, style]}>
      {options.map((option) => {
        const isSelected = option.value === selectedPeriod;

        return (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.pillButton,
              isSelected && styles.pillButtonSelected,
              disabled && styles.pillButtonDisabled,
            ]}
            onPress={() => !disabled && onPeriodChange(option.value)}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`Select ${option.label} period`}
          >
            {showIcons && option.icon && (
              <Ionicons
                name={option.icon}
                size={compact ? 14 : 16}
                color={isSelected ? 'white' : COLORS.TEXT_SECONDARY}
                style={styles.pillIcon}
              />
            )}
            <Text
              style={[
                styles.pillButtonText,
                compact && styles.pillButtonTextCompact,
                isSelected && styles.pillButtonTextSelected,
                disabled && styles.pillButtonTextDisabled,
              ]}
            >
              {compact && option.shortLabel ? option.shortLabel : option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderTabsControl = () => (
    <View style={[styles.tabsContainer, style]}>
      {options.map((option) => {
        const isSelected = option.value === selectedPeriod;

        return (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.tabButton,
              disabled && styles.tabButtonDisabled,
            ]}
            onPress={() => !disabled && onPeriodChange(option.value)}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`Select ${option.label} period`}
          >
            {showIcons && option.icon && (
              <Ionicons
                name={option.icon}
                size={compact ? 14 : 16}
                color={isSelected ? COLORS.PRIMARY : COLORS.TEXT_SECONDARY}
                style={styles.tabIcon}
              />
            )}
            <Text
              style={[
                styles.tabButtonText,
                compact && styles.tabButtonTextCompact,
                isSelected && styles.tabButtonTextSelected,
                disabled && styles.tabButtonTextDisabled,
              ]}
            >
              {compact && option.shortLabel ? option.shortLabel : option.label}
            </Text>
            {isSelected && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );

  switch (variant) {
    case 'pills':
      return renderPillsControl();
    case 'tabs':
      return renderTabsControl();
    default:
      return renderSegmentedControl();
  }
};

// Preset variations
export const BasicTimePeriodSelector: React.FC<{
  selectedPeriod: TimePeriod;
  onPeriodChange: (period: TimePeriod) => void;
  disabled?: boolean;
}> = ({ selectedPeriod, onPeriodChange, disabled }) => (
  <TimePeriodSelector
    selectedPeriod={selectedPeriod}
    onPeriodChange={onPeriodChange}
    options={DEFAULT_OPTIONS}
    disabled={disabled}
  />
);

export const ExtendedTimePeriodSelector: React.FC<{
  selectedPeriod: TimePeriod;
  onPeriodChange: (period: TimePeriod) => void;
  disabled?: boolean;
}> = ({ selectedPeriod, onPeriodChange, disabled }) => (
  <TimePeriodSelector
    selectedPeriod={selectedPeriod}
    onPeriodChange={onPeriodChange}
    options={QUARTER_YEAR_OPTIONS}
    disabled={disabled}
  />
);

export const CompactTimePeriodSelector: React.FC<{
  selectedPeriod: TimePeriod;
  onPeriodChange: (period: TimePeriod) => void;
  disabled?: boolean;
}> = ({ selectedPeriod, onPeriodChange, disabled }) => (
  <TimePeriodSelector
    selectedPeriod={selectedPeriod}
    onPeriodChange={onPeriodChange}
    options={DEFAULT_OPTIONS}
    compact={true}
    showIcons={true}
    disabled={disabled}
  />
);

export const PillsTimePeriodSelector: React.FC<{
  selectedPeriod: TimePeriod;
  onPeriodChange: (period: TimePeriod) => void;
  disabled?: boolean;
}> = ({ selectedPeriod, onPeriodChange, disabled }) => (
  <TimePeriodSelector
    selectedPeriod={selectedPeriod}
    onPeriodChange={onPeriodChange}
    options={DEFAULT_OPTIONS}
    variant="pills"
    disabled={disabled}
  />
);

export const TabsTimePeriodSelector: React.FC<{
  selectedPeriod: TimePeriod;
  onPeriodChange: (period: TimePeriod) => void;
  disabled?: boolean;
}> = ({ selectedPeriod, onPeriodChange, disabled }) => (
  <TimePeriodSelector
    selectedPeriod={selectedPeriod}
    onPeriodChange={onPeriodChange}
    options={DEFAULT_OPTIONS}
    variant="tabs"
    showIcons={true}
    disabled={disabled}
  />
);

const styles = StyleSheet.create({
  // Segmented Control Styles
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.SURFACE,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  segmentedButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.SM,
    paddingHorizontal: SPACING.SM,
    borderRadius: 8,
  },
  segmentedButtonFirst: {
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  segmentedButtonLast: {
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  segmentedButtonSelected: {
    backgroundColor: COLORS.PRIMARY,
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  segmentedButtonDisabled: {
    opacity: 0.5,
  },
  segmentedIcon: {
    marginRight: SPACING.XS,
  },
  segmentedButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_SECONDARY,
    fontFamily: FONTS.SEMIBOLD,
  },
  segmentedButtonTextCompact: {
    fontSize: 12,
  },
  segmentedButtonTextSelected: {
    color: 'white',
  },
  segmentedButtonTextDisabled: {
    opacity: 0.5,
  },

  // Pills Control Styles
  pillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.SM,
  },
  pillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.SM,
    paddingHorizontal: SPACING.MD,
    borderRadius: 20,
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  pillButtonSelected: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  pillButtonDisabled: {
    opacity: 0.5,
  },
  pillIcon: {
    marginRight: SPACING.XS,
  },
  pillButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.MEDIUM,
  },
  pillButtonTextCompact: {
    fontSize: 12,
  },
  pillButtonTextSelected: {
    color: 'white',
  },
  pillButtonTextDisabled: {
    opacity: 0.5,
  },

  // Tabs Control Styles
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.MD,
    paddingHorizontal: SPACING.SM,
    position: 'relative',
  },
  tabButtonDisabled: {
    opacity: 0.5,
  },
  tabIcon: {
    marginRight: SPACING.XS,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.TEXT_SECONDARY,
    fontFamily: FONTS.MEDIUM,
  },
  tabButtonTextCompact: {
    fontSize: 12,
  },
  tabButtonTextSelected: {
    color: COLORS.PRIMARY,
    fontWeight: '600',
    fontFamily: FONTS.SEMIBOLD,
  },
  tabButtonTextDisabled: {
    opacity: 0.5,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: COLORS.PRIMARY,
  },
});

export { ALL_OPTIONS, DEFAULT_OPTIONS, QUARTER_YEAR_OPTIONS };
export default TimePeriodSelector;