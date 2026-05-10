import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { HomeScreen } from '../screens/HomeScreen';
import { FavoritesScreen } from '../screens/FavoritesScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { AdminPanelScreen } from '../screens/AdminPanelScreen';
import { useAuth } from '../context/AuthContext';

export type MainTabParamList = {
  Home: undefined;
  Favorites: undefined;
  Panel: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

function CitoyenTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any = 'home';
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Favorites') iconName = focused ? 'heart' : 'heart-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#60a5fa',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: { backgroundColor: '#1e293b', borderTopColor: '#334155' },
        headerStyle: { backgroundColor: '#1e293b' },
        headerTintColor: '#f1f5f9',
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Accueil' }} />
      <Tab.Screen name="Favorites" component={FavoritesScreen} options={{ title: 'Favoris' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profil' }} />
    </Tab.Navigator>
  );
}

function ModeratorTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any = 'home';
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Favorites') iconName = focused ? 'heart' : 'heart-outline';
          else if (route.name === 'Panel') iconName = focused ? 'shield-checkmark' : 'shield-checkmark-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#60a5fa',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: { backgroundColor: '#1e293b', borderTopColor: '#334155' },
        headerStyle: { backgroundColor: '#1e293b' },
        headerTintColor: '#f1f5f9',
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Accueil' }} />
      <Tab.Screen name="Favorites" component={FavoritesScreen} options={{ title: 'Favoris' }} />
      <Tab.Screen name="Panel" component={AdminPanelScreen} options={{ title: 'Gestion' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profil' }} />
    </Tab.Navigator>
  );
}

function VisitorTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any = 'home';
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#60a5fa',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: { backgroundColor: '#1e293b', borderTopColor: '#334155' },
        headerStyle: { backgroundColor: '#1e293b' },
        headerTintColor: '#f1f5f9',
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Accueil' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profil' }} />
    </Tab.Navigator>
  );
}

export function MainTabNavigator() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <VisitorTabs />;
  }

  const roles = user?.roles || [];
  const isModerator = roles.some((r: string) =>
    ['ROLE_MODERATOR', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN'].includes(r)
  );

  if (isModerator) {
    return <ModeratorTabs />;
  }

  return <CitoyenTabs />;
}
