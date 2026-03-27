import { useEffect, useRef } from 'react';
import { Tabs, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '@/store/auth-store';

export default function AdminLayout() {
  const isBusinessInfoCompleted = useAuthStore((s) => s.isBusinessInfoCompleted);
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const redirected = useRef(false);

  useEffect(() => {
    if (isAdmin && !isBusinessInfoCompleted && !redirected.current) {
      redirected.current = true;
      router.replace('/auth/business-info-form');
    }
  }, [isAdmin, isBusinessInfoCompleted]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#007AFF',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ana Sayfa',
          tabBarLabel: 'Ana Sayfa',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="randevular"
        options={{
          title: 'Randevular',
          tabBarLabel: 'Randevular',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
          tabBarLabel: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
