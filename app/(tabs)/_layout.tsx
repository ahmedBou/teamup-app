import { Redirect, Tabs } from 'expo-router'
import { ActivityIndicator, View } from 'react-native'
import { useAuth } from '../../hooks/useAuth'
import { useNotifications } from '../../hooks/useNotifications'

export default function TabsLayout() {
  const { session, loading } = useAuth()
  const { unreadCount } = useNotifications()

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator />
      </View>
    )
  }

  if (!session) {
    return <Redirect href="/" />
  }

  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="home"
        options={{ title: 'Rides' }}
      />

      <Tabs.Screen
        name="create"
        options={{ title: 'Create' }}
      />

      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Messages',
          tabBarBadge:
            unreadCount > 0 ? (unreadCount > 99 ? '99+' : unreadCount) : undefined,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile' }}
      />
    </Tabs>
  )
}