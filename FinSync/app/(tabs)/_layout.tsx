import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";

import { HapticTab } from "@/components/template/HapticTab";
import { Ionicons } from "@expo/vector-icons";
import TabBarBackground from "@/components/template/ui/TabBarBackground";
import { useColors } from "../../src/design-system";
export default function TabLayout() {
  const colors = useColors();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          ...Platform.select({
            ios: {
              position: "absolute",
            },
            default: {},
          }),
        },
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <Ionicons size={28} name="home" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: "Transactions",
          tabBarIcon: ({ color }) => (
            <Ionicons size={28} name="wallet" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="add-transaction"
        options={{
          title: "Add",
          tabBarIcon: ({ color }) => (
            <Ionicons size={32} name="add-circle" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Stocks",
          tabBarIcon: ({ color }) => (
            <Ionicons size={28} name="trending-up" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
