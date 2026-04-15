import { useState } from 'react'
import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import RiderProfileModal from '../profile/RiderProfileModal'

export type RiderReview = {
  id: string
  authorName: string
  rating: number
  comment: string
}

export type PuzzleSlot = {
  id: string
  name: string | null
  avatarUrl: string | null
  city?: string | null
  cyclingLevel?: string | null
  ridingStyle?: string | null
  bio?: string | null
  reviews?: RiderReview[]
  canReview?: boolean
}

type PuzzleBoardProps = {
  participants: PuzzleSlot[]
  maxParticipants: number
  title?: string
  emptyText?: string
  partialText?: string
  fullText?: string
  activityId?: string | null
}

function getInitials(name: string | null): string {
  if (!name?.trim()) return '?'
  const parts = name.trim().split(' ')
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
}

export default function PuzzleBoard({
  participants,
  maxParticipants,
  title = 'Complete the team',
  emptyText = 'No riders yet',
  partialText,
  fullText = 'Team complete',
  activityId = null,
}: PuzzleBoardProps) {
  const [selectedRider, setSelectedRider] = useState<PuzzleSlot | null>(null)

  const slots = Array.from({ length: maxParticipants }, (_, index) => ({
    key: String(index),
    participant: participants[index] ?? null,
  }))

  const filledCount = Math.min(participants.length, maxParticipants)
  const isEmpty = filledCount === 0
  const isFull = filledCount === maxParticipants
  const progressPercent =
    maxParticipants > 0 ? (filledCount / maxParticipants) * 100 : 0

  const statusText = isEmpty
    ? emptyText
    : isFull
      ? fullText
      : partialText ?? `${filledCount} / ${maxParticipants} spots filled`

  return (
    <>
      <View style={styles.wrapper}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.status}>{statusText}</Text>
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
        </View>

        <View style={styles.grid}>
          {slots.map((slot, index) => (
            <View key={slot.key} style={styles.slot}>
              {slot.participant ? (
                <Pressable
                  onPress={() => {
                    setSelectedRider(slot.participant)
                  }}
                  style={styles.avatarPressable}
                >
                  {slot.participant.avatarUrl ? (
                    <Image
                      source={{ uri: slot.participant.avatarUrl }}
                      style={[styles.avatar, styles.avatarImage]}
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
              <Text style={styles.slotNumber}>{index + 1}</Text>
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
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 20,
    padding: 18,
    backgroundColor: '#fafafa',
    gap: 14,
  },
  header: {
    gap: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  status: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  progressTrack: {
    width: '100%',
    height: 8,
    borderRadius: 999,
    backgroundColor: '#e5e7eb',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#22c55e',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  slot: {
    width: 64,
    alignItems: 'center',
    gap: 6,
  },
  avatarPressable: {
    borderRadius: 18,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {},
  avatarFilled: {
    backgroundColor: '#0B1220',
  },
  avatarEmpty: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#cbd5e1',
    backgroundColor: '#fff',
  },
  initials: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
  },
  emptyPlus: {
    color: '#94a3b8',
    fontSize: 24,
    fontWeight: '800',
  },
  slotNumber: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '700',
  },
})