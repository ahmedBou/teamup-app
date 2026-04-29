import { Feather, MaterialCommunityIcons } from '@expo/vector-icons'
import { Redirect, Tabs } from 'expo-router'
import { ActivityIndicator, Platform, Text, View } from 'react-native'
import { useAuth } from '../../hooks/useAuth'

const ACTIVE_COLOR = '#22c55e'
const INACTIVE_COLOR = '#94a3b8'

function TabLabel({
  focused,
  label,
}: {
  focused: boolean
  label: string
}) {
  return (
    <Text
      style={{
        fontSize: 10,
        fontWeight: '800',
        color: focused ? ACTIVE_COLOR : INACTIVE_COLOR,
        textTransform: 'uppercase',
        marginTop: 2,
      }}
    >
      {label}
    </Text>
  )
}

function FeatherTabIcon({
  focused,
  name,
}: {
  focused: boolean
  name: React.ComponentProps<typeof Feather>['name']
}) {
  return (
    <Feather
      name={name}
      size={24}
      color={focused ? ACTIVE_COLOR : INACTIVE_COLOR}
      strokeWidth={focused ? 2.5 : 2}
    />
  )
}

function BikeTabIcon({ focused }: { focused: boolean }) {
  return (
    <MaterialCommunityIcons
      name="bike"
      size={25}
      color={focused ? ACTIVE_COLOR : INACTIVE_COLOR}
    />
  )
}

export default function TabsLayout() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#fff',
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
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarLabelPosition: 'below-icon',
        tabBarActiveTintColor: ACTIVE_COLOR,
        tabBarInactiveTintColor: INACTIVE_COLOR,
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 78 : 68,
          paddingTop: 7,
          paddingBottom: Platform.OS === 'ios' ? 18 : 7,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          elevation: 8,
          shadowColor: '#000',
          shadowOpacity: 0.06,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: -2 },
        },
        tabBarItemStyle: {
          paddingVertical: 2,
          justifyContent: 'center',
          alignItems: 'center',
        },
        tabBarIconStyle: {
          marginBottom: -1,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'RIDES',
          tabBarIcon: ({ focused }) => <BikeTabIcon focused={focused} />,
          tabBarLabel: ({ focused }) => (
            <TabLabel focused={focused} label="RIDES" />
          ),
        }}
      />

      <Tabs.Screen
        name="create"
        options={{
          title: 'CREATE',
          tabBarIcon: ({ focused }) => (
            <FeatherTabIcon focused={focused} name="plus-circle" />
          ),
          tabBarLabel: ({ focused }) => (
            <TabLabel focused={focused} label="CREATE" />
          ),
        }}
      />

      <Tabs.Screen
        name="my-activities"
        options={{
          title: 'MY RIDES',
          tabBarIcon: ({ focused }) => (
            <FeatherTabIcon focused={focused} name="grid" />
          ),
          tabBarLabel: ({ focused }) => (
            <TabLabel focused={focused} label="MY RIDES" />
          ),
        }}
      />

      <Tabs.Screen
        name="notifications"
        options={{
          title: 'MESSAGES',
          tabBarIcon: ({ focused }) => (
            <FeatherTabIcon focused={focused} name="message-circle" />
          ),
          tabBarLabel: ({ focused }) => (
            <TabLabel focused={focused} label="MESSAGES" />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'PROFILE',
          tabBarIcon: ({ focused }) => (
            <FeatherTabIcon focused={focused} name="user" />
          ),
          tabBarLabel: ({ focused }) => (
            <TabLabel focused={focused} label="PROFILE" />
          ),
        }}
      />
    </Tabs>
  )
}