import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, SPACING, FONTS } from '@/constants';

const SettingsScreen = () => {
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [biometricEnabled, setBiometricEnabled] = React.useState(false);

  const SettingItem = ({
    icon,
    title,
    subtitle,
    onPress,
    showArrow = true,
    rightComponent,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    showArrow?: boolean;
    rightComponent?: React.ReactNode;
  }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingLeft}>
        <Ionicons name={icon} size={24} color={COLORS.PRIMARY} />
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.settingRight}>
        {rightComponent}
        {showArrow && !rightComponent && (
          <Ionicons
            name='chevron-forward'
            size={20}
            color={COLORS.TEXT_SECONDARY}
          />
        )}
      </View>
    </TouchableOpacity>
  );

  const SettingSection = ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <SettingSection title='Account'>
        <SettingItem
          icon='person-outline'
          title='Profile'
          subtitle='Manage your account information'
          onPress={() => {}}
        />
        <SettingItem
          icon='card-outline'
          title='Accounts & Cards'
          subtitle='Manage your bank accounts'
          onPress={() => {}}
        />
      </SettingSection>

      <SettingSection title='Preferences'>
        <SettingItem
          icon='notifications-outline'
          title='Notifications'
          subtitle='Enable spending reminders'
          showArrow={false}
          rightComponent={
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: COLORS.BORDER, true: COLORS.PRIMARY }}
            />
          }
        />
        <SettingItem
          icon='finger-print-outline'
          title='Biometric Authentication'
          subtitle='Use Face ID or Touch ID'
          showArrow={false}
          rightComponent={
            <Switch
              value={biometricEnabled}
              onValueChange={setBiometricEnabled}
              trackColor={{ false: COLORS.BORDER, true: COLORS.PRIMARY }}
            />
          }
        />
        <SettingItem
          icon='color-palette-outline'
          title='Currency'
          subtitle='CAD - Canadian Dollar'
          onPress={() => {}}
        />
      </SettingSection>

      <SettingSection title='Data'>
        <SettingItem
          icon='cloud-outline'
          title='Backup & Sync'
          subtitle='Sync data across devices'
          onPress={() => {}}
        />
        <SettingItem
          icon='download-outline'
          title='Export Data'
          subtitle='Download your financial data'
          onPress={() => {}}
        />
      </SettingSection>

      <SettingSection title='Support'>
        <SettingItem
          icon='help-circle-outline'
          title='Help & Support'
          subtitle='Get help and send feedback'
          onPress={() => {}}
        />
        <SettingItem
          icon='information-circle-outline'
          title='About'
          subtitle='Version 1.0.0'
          onPress={() => {}}
        />
      </SettingSection>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  section: {
    marginBottom: SPACING.LG,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.MD,
    paddingHorizontal: SPACING.MD,
    fontFamily: FONTS.BOLD,
  },
  sectionContent: {
    backgroundColor: COLORS.SURFACE,
    marginHorizontal: SPACING.MD,
    borderRadius: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: SPACING.MD,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.SEMIBOLD,
  },
  settingSubtitle: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 2,
    fontFamily: FONTS.REGULAR,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default SettingsScreen;
