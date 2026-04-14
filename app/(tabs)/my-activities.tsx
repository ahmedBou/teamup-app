import { useFocusEffect } from '@react-navigation/native'
import { Redirect, useRouter } from 'expo-router'
import { useCallback, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useAuth } from '../../hooks/useAuth'
import { useMyActivities } from '../../hooks/useMyActivities'
import type { Activity } from '../../src/types/activity'

type MyActivitiesTab = 'created' | 'joined'

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleString()
}

function ActivityCard({
  activity,
  onPress,
  role,
}: {
  activity: Activity
  onPress: () => void
  role: 'host' | 'participant'
}) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{activity.title}</Text>
        <View
          style={[
            styles.roleBadge,
            role === 'host' ? styles.hostBadge : styles.participantBadge,
          ]}
        >
          <Text style={styles.roleBadgeText}>
            {role === 'host' ? 'Hosting' : 'Joined'}
          </Text>
        </View>
      </View>

      <Text style={styles.label}>Type</Text>
      <Text style={styles.value}>{activity.activity_type}</Text>

      <Text style={styles.label}>City</Text>
      <Text style={styles.value}>{activity.city}</Text>

      <Text style={styles.label}>Start time</Text>
      <Text style={styles.value}>{formatDate(activity.start_time)}</Text>

      <Text style={styles.label}>Max participants</Text>
      <Text style={styles.value}>{activity.max_participants}</Text>

      <Text style={styles.label}>Status</Text>
      <Text style={styles.value}>{activity.status}</Text>

      {activity.description ? (
        <>
          <Text style={styles.label}>Description</Text>
          <Text style={styles.value}>{activity.description}</Text>
        </>
      ) : null}

      <Text style={styles.openHint}>Tap to view details</Text>
    </Pressable>
  )
}

export default function MyActivitiesScreen() {
  const router = useRouter()
  const { session, loading: authLoading } = useAuth()
  const userId = session?.user?.id ?? null
  const [activeTab, setActiveTab] = useState<MyActivitiesTab>('created')

  const {
    hostedActivities,
    joinedActivities,
    loading,
    error,
    refreshMyActivities,
  } = useMyActivities(userId)

  useFocusEffect(
    useCallback(() => {
      void refreshMyActivities()
    }, [refreshMyActivities])
  )

  const visibleActivities = useMemo(() => {
    return activeTab === 'created' ? hostedActivities : joinedActivities
  }, [activeTab, hostedActivities, joinedActivities])

  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator />
      </View>
    )
  }

  if (!session) {
    return <Redirect href="/" />
  }

  if (loading && hostedActivities.length === 0 && joinedActivities.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator />
      </View>
    )
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={refreshMyActivities} />
      }
    >
      <Text style={styles.title}>My rides</Text>
      <Text style={styles.subtitle}>See the rides you created and joined.</Text>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{hostedActivities.length}</Text>
          <Text style={styles.statLabel}>Hosting</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statValue}>{joinedActivities.length}</Text>
          <Text style={styles.statLabel}>Joined</Text>
        </View>
      </View>

      <View style={styles.tabRow}>
        <Pressable
          onPress={() => setActiveTab('created')}
          style={[
            styles.tabButton,
            activeTab === 'created' && styles.tabButtonActive,
          ]}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'created' && styles.tabButtonTextActive,
            ]}
          >
            Hosting
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('joined')}
          style={[
            styles.tabButton,
            activeTab === 'joined' && styles.tabButtonActive,
          ]}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'joined' && styles.tabButtonTextActive,
            ]}
          >
            Joined
          </Text>
        </Pressable>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {visibleActivities.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>
            {activeTab === 'created'
              ? 'No rides hosted yet'
              : 'No rides joined yet'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {activeTab === 'created'
              ? 'Create your first ride and invite people nearby.'
              : 'Join a ride from Discover to see it here.'}
          </Text>
        </View>
      ) : (
        visibleActivities.map((activity) => (
          <ActivityCard
            key={activity.id}
            activity={activity}
            role={activeTab === 'created' ? 'host' : 'participant'}
            onPress={() => router.push(`/activity/${activity.id}`)}
          />
        ))
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  container: {
    padding: 24,
    paddingBottom: 40,
    gap: 16,
    backgroundColor: '#fff',
    minHeight: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 16,
    padding: 18,
    backgroundColor: '#fafafa',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111',
  },
  statLabel: {
    marginTop: 6,
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  tabRow: {
    flexDirection: 'row',
    gap: 10,
  },
  tabButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  tabButtonActive: {
    backgroundColor: '#0B1220',
    borderColor: '#0B1220',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111',
  },
  tabButtonTextActive: {
    color: '#fff',
  },
  card: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 16,
    padding: 18,
    gap: 8,
    backgroundColor: '#fafafa',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center',
  },
  cardTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  hostBadge: {
    backgroundColor: '#dbeafe',
  },
  participantBadge: {
    backgroundColor: '#dcfce7',
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#555',
    marginTop: 6,
  },
  value: {
    fontSize: 16,
    color: '#111',
  },
  openHint: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  emptyCard: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 16,
    padding: 20,
    backgroundColor: '#fafafa',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptySubtitle: {
    marginTop: 8,
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  errorText: {
    color: 'red',
    fontSize: 14,
  },
})