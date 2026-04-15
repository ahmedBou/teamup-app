import { useState } from 'react'
import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import RiderProfileModal from '../profile/RiderProfileModal'

type HomeRideParticipant = {
  id: string
  name: string | null
  avatarUrl: string | null
  city?: string | null
  cyclingLevel?: string | null
  ridingStyle?: string | null
  bio?: string | null
  reviews?: {
    id: string
    authorName: string
    rating: number
    comment: string
  }[]
  canReview?: boolean
}

type HomeRidePuzzleOverlayProps = {
  participants: HomeRideParticipant[]
  maxParticipants: number
  activityId?: string | null
}

function getInitials(name: string | null): string {
  if (!name?.trim()) return '?'
  const parts = name.trim().split(' ')
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
}

export default function HomeRidePuzzleOverlay({
  participants,
  maxParticipants,
  activityId = null,
}: HomeRidePuzzleOverlayProps) {
  const [selectedRider, setSelectedRider] = useState<HomeRideParticipant | null>(null)

  const visualMax = Math.min(maxParticipants, 6)

  const slots = Array.from({ length: visualMax }, (_, index) => ({
    key: String(index),
    participant: participants[index] ?? null,
  }))

  return (
    <>
      <View style={styles.wrapper}>
        <View style={styles.grid}>
          {slots.map((slot) => (
            <View key={slot.key} style={styles.slot}>
              {slot.participant ? (
                <Pressable
                  onPress={() => setSelectedRider(slot.participant)}
                  style={styles.avatarPressable}
                >
                  {slot.participant.avatarUrl ? (
                    <Image
                      source={{ uri: slot.participant.avatarUrl }}
                      style={styles.avatar}
                    />
                  ) : (
                    <View style={[styles.avatar, styles.avatarFilled]}>
                      <Text style={styles.initials}>
                        {getInitials(slot.participant.name)}
                      </Text>
                    </View>
                  )}
                </Pressable>
              ) : (
                <View style={[styles.avatar, styles.avatarEmpty]}>
                  <Text style={styles.emptyPlus}>+</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </View>

      <RiderProfileModal
        rider={selectedRider}
        visible={!!selectedRider}
        onClose={() => setSelectedRider(null)}
        activityId={activityId}
      />
    </>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'center',
    width: '86%',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 22,
    backgroundColor: 'rgba(8, 15, 28, 0.26)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  slot: {
    width: 56,
    height: 56,
  },
  avatarPressable: {
    borderRadius: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarFilled: {
    backgroundColor: '#0B1220',
  },
  avatarEmpty: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.42)',
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  initials: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  emptyPlus: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
  },
})