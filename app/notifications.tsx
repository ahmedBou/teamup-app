import { Redirect, useRouter } from 'expo-router'
import {
    ActivityIndicator,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native'
import { useAuth } from '../hooks/useAuth'
import { useNotifications } from '../hooks/useNotifications'
import type { AppNotification } from '../src/services/notificationService'

function formatRelativeDate(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()

  const minutes = Math.floor(diffMs / (1000 * 60))
  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} min ago`
  if (hours < 24) return `${hours} h ago`
  if (days < 7) return `${days} d ago`

  return date.toLocaleDateString()
}

export default function NotificationsScreen() {
  const router = useRouter()
  const { session, loading: authLoading } = useAuth()
  const {
    notifications,
    unreadCount,
    loading,
    refreshing,
    error,
    refresh,
    markAsRead,
    markAllAsRead,
  } = useNotifications()

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

  const handleOpen = async (notification: AppNotification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id)
    }

    if (notification.activity_id) {
      if (notification.type === 'activity_joined') {
        router.push(`/activity/${notification.activity_id}`)
        return
      }

      if (notification.type === 'new_message') {
        router.push(`/group/${notification.activity_id}`)
        return
      }
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator />
      </View>
    )
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
    >
      <View style={styles.headerRow}>
        <View style={styles.headerTextBlock}>
          <Text style={styles.title}>Notifications</Text>
          <Text style={styles.subtitle}>
            {unreadCount > 0
              ? `${unreadCount} unread`
              : 'Everything is up to date'}
          </Text>
        </View>

        {unreadCount > 0 ? (
            <Pressable style={styles.markAllButton} onPress={markAllAsRead}>
                <Text style={styles.markAllButtonText}>Mark all as read</Text>
            </Pressable>
            ) : null}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {notifications.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No updates yet</Text>
          <Text style={styles.emptySubtitle}>
            New joins and group messages will show up here.
          </Text>
        </View>
      ) : (
        notifications.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => void handleOpen(item)}
            style={[
              styles.card,
              !item.is_read && styles.cardUnread,
            ]}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                {!item.is_read ? (
                  <View style={styles.unreadPill}>
                    <Text style={styles.unreadPillText}>New</Text>
                  </View>
                ) : null}
              </View>

              <Text style={styles.dateText}>{formatRelativeDate(item.created_at)}</Text>
            </View>

            <Text style={styles.cardBody}>{item.body}</Text>

            {item.actor_profile?.first_name ? (
              <Text style={styles.actorText}>
                From: {item.actor_profile.first_name}
              </Text>
            ) : null}
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
    backgroundColor: '#fff',
  },
  container: {
    padding: 24,
    paddingBottom: 40,
    gap: 16,
    backgroundColor: '#fff',
    minHeight: '100%',
  },
  headerRow: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  headerTextBlock: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 16,
    color: '#666',
  },
  markAllButton: {
    backgroundColor: '#0B1220',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  markAllButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  card: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 16,
    padding: 18,
    gap: 10,
    backgroundColor: '#fafafa',
  },
  cardUnread: {
    borderColor: '#86efac',
    backgroundColor: '#f0fdf4',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'flex-start',
  },
  cardHeaderLeft: {
    flex: 1,
    gap: 8,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111',
  },
  dateText: {
    fontSize: 12,
    color: '#666',
  },
  cardBody: {
    fontSize: 15,
    color: '#111',
    lineHeight: 22,
  },
  actorText: {
    fontSize: 13,
    color: '#555',
    fontWeight: '600',
  },
  unreadPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#16a34a',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  unreadPillText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
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