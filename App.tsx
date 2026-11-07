import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PaperProvider, MD3LightTheme as DefaultTheme } from 'react-native-paper';
import { ActivityIndicator } from 'react-native';
import { Layout, Calendar, GraduationCap, Mail, LogIn } from 'lucide-react-native';
import { useVulcanStore } from './src/state/useVulcanStore';
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import TimetableScreen from './src/screens/TimetableScreen';
import GradesScreen from './src/screens/GradesScreen';
import MessagesScreen from './src/screens/MessagesScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#6750A4',
    secondary: '#625b71',
    tertiary: '#7d5260',
  },
};

function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#6750A4',
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Pulpit"
        component={DashboardScreen}
        options={{ tabBarIcon: ({ color, size }) => <Layout color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Plan"
        component={TimetableScreen}
        options={{ tabBarIcon: ({ color, size }) => <Calendar color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Oceny"
        component={GradesScreen}
        options={{ tabBarIcon: ({ color, size }) => <GraduationCap color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Wiadomości"
        component={MessagesScreen}
        options={{ tabBarIcon: ({ color, size }) => <Mail color={color} size={size} /> }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isInitializing, setIsInitializing] = useState(true);
  const context = useVulcanStore((state) => state.context);
  const initializeSession = useVulcanStore((state) => state.initializeSession);

  useEffect(() => {
    initializeSession().finally(() => setIsInitializing(false));
  }, [initializeSession]);

  if (isInitializing) {
    return (
      <PaperProvider theme={theme}>
        <ActivityIndicator style={{ flex: 1, alignSelf: 'center' }} />
      </PaperProvider>
    );
  }

  return (
    <PaperProvider theme={theme}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!context ? (
            <Stack.Screen name="Login" component={LoginScreen} />
          ) : (
            <Stack.Screen name="Home" component={HomeTabs} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}
