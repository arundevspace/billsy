import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Text, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
// expo-splash-screen controls the native splash visibility

import DashboardScreen from './src/screens/DashboardScreen';
import AddSubscriptionScreen from './src/screens/AddSubscriptionScreen';
import SubscriptionDetailScreen from './src/screens/SubscriptionDetailScreen';
import AnalyticsScreen from './src/screens/AnalyticsScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import AnimatedSplash from './src/components/AnimatedSplash';

import { useSubscriptionStore } from './src/store/subscriptionStore';
import { requestPermissions } from './src/utils/notifications';
import { colors } from './src/constants/theme';

// Keep native splash visible while app loads
SplashScreen.preventAutoHideAsync();

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TabIcon = ({ emoji, focused }) => (
  <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
);

function HomeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.primary,
        headerTitleStyle: { color: colors.text, fontWeight: '700' },
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ headerShown: false }} />
      <Stack.Screen name="SubscriptionDetail" component={SubscriptionDetailScreen} options={{ title: 'Details' }} />
      <Stack.Screen
        name="AddSubscription"
        component={AddSubscriptionScreen}
        options={({ route }) => ({
          title: route.params?.subscription ? 'Edit Subscription' : 'Add Subscription',
          presentation: 'modal',
        })}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  const loadSubscriptions = useSubscriptionStore(s => s.loadSubscriptions);
  const [appReady, setAppReady] = useState(false);
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    async function prepare() {
      await loadSubscriptions();
      await requestPermissions();
      // Hide native splash — our animated one takes over
      await SplashScreen.hideAsync();
      setAppReady(true);
    }
    prepare();
  }, []);

  // Show nothing until app is ready
  if (!appReady) return <View style={{ flex: 1, backgroundColor: '#5B5FEF' }} />;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: colors.card,
              borderTopColor: colors.border,
              height: 60,
              paddingBottom: 8,
              paddingTop: 6,
            },
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.textLight,
            tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
          }}
        >
          <Tab.Screen
            name="Home"
            component={HomeStack}
            options={{
              tabBarIcon: ({ focused }) => <TabIcon emoji="💳" focused={focused} />,
              tabBarLabel: 'Subscriptions',
            }}
          />
          <Tab.Screen
            name="Analytics"
            component={AnalyticsScreen}
            options={{
              tabBarIcon: ({ focused }) => <TabIcon emoji="📊" focused={focused} />,
              tabBarLabel: 'Analytics',
            }}
          />
          <Tab.Screen
            name="Calendar"
            component={CalendarScreen}
            options={{
              tabBarIcon: ({ focused }) => <TabIcon emoji="📅" focused={focused} />,
              tabBarLabel: 'Calendar',
            }}
          />
          <Tab.Screen
            name="Settings"
            component={SettingsScreen}
            options={{
              tabBarIcon: ({ focused }) => <TabIcon emoji="⚙️" focused={focused} />,
              tabBarLabel: 'Settings',
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>

      {/* Animated splash renders on top until dismissed */}
      {!splashDone && (
        <AnimatedSplash onFinish={() => setSplashDone(true)} />
      )}
    </GestureHandlerRootView>
  );
}
