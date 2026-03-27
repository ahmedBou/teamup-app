import { useFocusEffect } from '@react-navigation/native'
import { useRouter } from 'expo-router'
import { useCallback } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useActivities } from '../../hooks/useActivities'

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleString()
}

export default function HomeScreen() {
  const router = useRouter()
  const { activities, loading, error, refreshActivities } = useActivities()

  useFocusEffect(
    useCallback(() => {
      refreshActivities()
    }, [refreshActivities])
  )

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator />
      </View>
    )
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Discover rides</Text>
      <Text style={styles.subtitle}>Find local cycling activities near you.</Text>

      <Pressable style={styles.refreshButton} onPress={refreshActivities}>
        <Text style={styles.refreshButtonText}>Refresh</Text>
      </Pressable>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {activities.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No upcoming rides yet</Text>
          <Text style={styles.emptySubtitle}>
            The feed is empty for now. Next step: create your first activity.
          </Text>
        </View>
      ) : (
        activities.map((activity) => (
          <Pressable
            key={activity.id}
            style={styles.card}
            onPress={() => router.push(`/activity/${activity.id}`)}
          >
            <Text style={styles.cardTitle}>{activity.title}</Text>

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
  },
  container: {
    padding: 24,
    paddingBottom: 40,
    gap: 16,
    backgroundColor: '#fff',
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
  refreshButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#0B1220',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  refreshButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  errorText: {
    color: 'red',
    fontSize: 14,
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
  card: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 16,
    padding: 18,
    gap: 8,
    backgroundColor: '#fafafa',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
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
})