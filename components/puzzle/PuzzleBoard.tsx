import { Image, StyleSheet, Text, View } from 'react-native'

// --- TYPES (Lesson 4 — TypeScript contracts)
type PuzzleSlot = {
  id: string
  name: string | null      // string | null = might not exist yet
  avatarUrl: string | null // same
}

type PuzzleBoardProps = {
  participants: PuzzleSlot[]
  maxParticipants: number
  title?: string           // ? = optional prop
  emptyText?: string
  partialText?: string
  fullText?: string
}

// --- HELPER (pure function, no React)
function getInitials(name: string | null): string {
  if (!name?.trim()) return '?'
  const parts = name.trim().split(' ')
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
}

// --- COMPONENT
export default function PuzzleBoard({
  participants,
  maxParticipants,
  title = 'Complete the team',
  emptyText = 'No riders yet',
  partialText,
  fullText = 'Team complete',
}: PuzzleBoardProps) {

  // Build exactly maxParticipants slots (Lesson 1 — structured memory)
  const slots = Array.from({ length: maxParticipants }, (_, index) => ({
    key: String(index),
    participant: participants[index] ?? null,
  }))

  // State calculation (Lesson 4 — union logic)
  const filledCount = Math.min(participants.length, maxParticipants)
  const isEmpty = filledCount === 0
  const isFull = filledCount === maxParticipants
  const progressPercent = maxParticipants > 0 
    ? (filledCount / maxParticipants) * 100 
    : 0

  const statusText = isEmpty
    ? emptyText
    : isFull
    ? fullText
    : partialText ?? `${filledCount} / ${maxParticipants} spots filled`

  return (
    <View style={styles.wrapper}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.status}>{statusText}</Text>
      </View>

      {/* Progress bar — visual of fill rate */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
      </View>

      {/* Slots grid */}
      <View style={styles.grid}>
        {slots.map((slot, index) => (
          <View key={slot.key} style={styles.slot}>
            {slot.participant ? (
              // Filled slot
              slot.participant.avatarUrl ? (
                // Has avatar photo
                <Image
                  source={{ uri: slot.participant.avatarUrl }}
                  style={[styles.avatar, styles.avatarImage]}
                />
              ) : (
                // No photo — show initials
                <View style={[styles.avatar, styles.avatarFilled]}>
                  <Text style={styles.initials}>
                    {getInitials(slot.participant.name)}
                  </Text>
                </View>
              )
            ) : (
              // Empty slot
              <View style={[styles.avatar, styles.avatarEmpty]}>
                <Text style={styles.emptyPlus}>+</Text>
              </View>
            )}
            <Text style={styles.slotNumber}>{index + 1}</Text>
          </View>
        ))}
      </View>

    </View>
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
  header: { gap: 4 },
  title: { fontSize: 18, fontWeight: '700', color: '#111827' },
  status: { fontSize: 14, color: '#64748b', fontWeight: '500' },
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  slot: { width: 64, alignItems: 'center', gap: 4 },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {},
  avatarFilled: { backgroundColor: '#0B1220' },
  avatarEmpty: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#cbd5e1',
    backgroundColor: '#fff',
  },
  initials: { color: '#fff', fontSize: 18, fontWeight: '700' },
  emptyPlus: { color: '#94a3b8', fontSize: 24, fontWeight: '700' },
  slotNumber: { fontSize: 11, color: '#94a3b8', fontWeight: '600' },
})