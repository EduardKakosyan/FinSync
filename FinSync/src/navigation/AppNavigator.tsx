import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { CardStyleInterpolators } from '@react-navigation/stack';

// Import screens
import HomeScreen from '@/screens/home/HomeScreen';
import TransactionListScreen from '@/screens/transaction/TransactionListScreen';
import AddTransactionScreen from '@/screens/transaction/AddTransactionScreen';
import TransactionDetailsScreen from '@/screens/transaction/TransactionDetailsScreen';
import ReceiptScannerScreen from '@/screens/receipt/ReceiptScannerScreen';
import ReceiptDetailsScreen from '@/screens/receipt/ReceiptDetailsScreen';
import InvestmentScreen from '@/screens/investment/InvestmentScreen';
import AnalyticsScreen from '@/screens/analytics/AnalyticsScreen';
import SettingsScreen from '@/screens/settings/SettingsScreen';

import { RootStackParamList, TransactionStackParamList, HomeStackParamList, ReceiptStackParamList } from '@/types';
import { COLORS } from '@/constants';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();
const TransactionStack = createStackNavigator<TransactionStackParamList>();
const HomeStack = createStackNavigator<HomeStackParamList>();
const ReceiptStack = createStackNavigator<ReceiptStackParamList>();

const TransactionStackNavigator = () => (
  <TransactionStack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: COLORS.PRIMARY,
      },
      headerTintColor: '#fff',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}
  >
    <TransactionStack.Screen
      name='TransactionList'
      component={TransactionListScreen}
      options={{ title: 'Transactions' }}
    />
    <TransactionStack.Screen
      name='AddTransaction'
      component={AddTransactionScreen}
      options={{ title: 'Add Transaction' }}
    />
    <TransactionStack.Screen
      name='TransactionDetails'
      component={TransactionDetailsScreen}
      options={{ title: 'Transaction Details' }}
    />
    <TransactionStack.Screen
      name='EditTransaction'
      component={TransactionDetailsScreen}
      options={{ title: 'Edit Transaction' }}
      initialParams={{ mode: 'edit' }}
    />
  </TransactionStack.Navigator>
);

const ReceiptStackNavigator = () => (
  <ReceiptStack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: COLORS.PRIMARY,
      },
      headerTintColor: '#fff',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}
  >
    <ReceiptStack.Screen
      name='ReceiptScanner'
      component={ReceiptScannerScreen}
      options={{ title: 'Scan Receipt' }}
    />
    <ReceiptStack.Screen
      name='ReceiptDetails'
      component={ReceiptDetailsScreen}
      options={{ title: 'Receipt Details' }}
    />
    <ReceiptStack.Screen
      name='ReceiptCapture'
      component={ReceiptScannerScreen}
      options={{ title: 'Capture Receipt' }}
    />
  </ReceiptStack.Navigator>
);

const HomeStackNavigator = () => (
  <HomeStack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: COLORS.PRIMARY,
      },
      headerTintColor: '#fff',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}
  >
    <HomeStack.Screen
      name='Home'
      component={HomeScreen}
      options={{ title: 'FinSync' }}
    />
    <HomeStack.Screen
      name='TransactionDetails'
      component={TransactionDetailsScreen}
      options={{ title: 'Transaction Details' }}
    />
    <HomeStack.Screen
      name='CategoryDetails'
      component={HomeScreen} // Placeholder - would be CategoryDetailsScreen
      options={{ title: 'Category Details' }}
    />
  </HomeStack.Navigator>
);

const MainTabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName: keyof typeof Ionicons.glyphMap;

        switch (route.name) {
          case 'HomeTab':
            iconName = focused ? 'home' : 'home-outline';
            break;
          case 'TransactionTab':
            iconName = focused ? 'list' : 'list-outline';
            break;
          case 'ReceiptTab':
            iconName = focused ? 'camera' : 'camera-outline';
            break;
          case 'InvestmentTab':
            iconName = focused ? 'trending-up' : 'trending-up-outline';
            break;
          case 'AnalyticsTab':
            iconName = focused ? 'stats-chart' : 'stats-chart-outline';
            break;
          default:
            iconName = 'home-outline';
        }

        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: COLORS.PRIMARY,
      tabBarInactiveTintColor: COLORS.TEXT_SECONDARY,
      tabBarStyle: {
        backgroundColor: COLORS.BACKGROUND,
        borderTopColor: COLORS.BORDER,
        paddingBottom: 5,
        height: 60,
      },
      headerShown: false,
    })}
  >
    <Tab.Screen
      name='HomeTab'
      component={HomeStackNavigator}
      options={{ title: 'Home', tabBarLabel: 'Home' }}
    />
    <Tab.Screen
      name='TransactionTab'
      component={TransactionStackNavigator}
      options={{
        title: 'Transactions',
        tabBarLabel: 'Transactions',
      }}
    />
    <Tab.Screen
      name='ReceiptTab'
      component={ReceiptStackNavigator}
      options={{
        title: 'Receipts',
        tabBarLabel: 'Receipts',
      }}
    />
    <Tab.Screen
      name='InvestmentTab'
      component={InvestmentScreen}
      options={{ title: 'Investments', tabBarLabel: 'Investments' }}
    />
    <Tab.Screen
      name='AnalyticsTab'
      component={AnalyticsScreen}
      options={{ title: 'Analytics', tabBarLabel: 'Analytics' }}
    />
  </Tab.Navigator>
);

const AppNavigator = () => (
  <NavigationContainer>
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        cardStyleInterpolator: ({ current }) => ({
          cardStyle: {
            opacity: current.progress,
          },
        }),
      }}
    >
      <Stack.Screen name='Main' component={MainTabNavigator} />
      
      {/* Modal Screens */}
      <Stack.Screen
        name='Settings'
        component={SettingsScreen}
        options={{
          headerShown: true,
          title: 'Settings',
          headerStyle: {
            backgroundColor: COLORS.PRIMARY,
          },
          headerTintColor: '#fff',
          presentation: 'modal',
        }}
      />
      
      <Stack.Screen
        name='TransactionDetails'
        component={TransactionDetailsScreen}
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />
      
      <Stack.Screen
        name='AddTransaction'
        component={AddTransactionScreen}
        options={{
          headerShown: true,
          title: 'Add Transaction',
          headerStyle: {
            backgroundColor: COLORS.PRIMARY,
          },
          headerTintColor: '#fff',
          presentation: 'modal',
        }}
      />
      
      <Stack.Screen
        name='EditTransaction'
        component={TransactionDetailsScreen}
        options={{
          headerShown: false,
          presentation: 'card',
        }}
        initialParams={{ mode: 'edit' }}
      />
      
      <Stack.Screen
        name='CategoryDetails'
        component={HomeScreen} // Placeholder
        options={{
          headerShown: true,
          title: 'Category Details',
          headerStyle: {
            backgroundColor: COLORS.PRIMARY,
          },
          headerTintColor: '#fff',
        }}
      />
    </Stack.Navigator>
  </NavigationContainer>
);

export default AppNavigator;
