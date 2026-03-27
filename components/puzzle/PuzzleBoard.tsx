import { Image, StyleSheet, Text, View } from 'react-native'

type PuzzleSlot = {
  id: string
  name: string | null
  avatarUrl: string | null
}

type PuzzleBoardProps = {
  participants: PuzzleSlot[]
  maxParticipants: number
}

export default function PuzzleBoard({
  participants,
  maxParticipants,
}: PuzzleBoardProps) {
  const slots = Array.from({ length: maxParticipants }, (_, index) => {
    const participant = participants[index] ?? null
    return {
      key: String(index),
      participant,
    }
  })

  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>Group formation</Text>
      <View style={styles.grid}>
        {slots.map((slot) => (
          <View key={slot.key} style={styles.slot}>
            {slot.participant ? (
              slot.participant.avatarUrl ? (
                <Image
                  source={{ uri: slot.participant.avatarUrl }}
                  style={styles.avatar}
                />
              ) : (
                <View style={[styles.avatar, styles.fallbackFilled]}>
                  <Text style={styles.fallbackText}>
                    {slot.participant.name?.[0]?.toUpperCase() ?? '?'}
                  </Text>
                </View>
              )
            ) : (
              <View style={[styles.avatar, styles.emptySlot]}>
                <Text style={styles.emptyText}>+</Text>
              </View>
            )}
          </View>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 16,
    padding: 18,
    backgroundColor: '#fafafa',
    gap: 14,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  slot: {
    width: 64,
    height: 64,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackFilled: {
    backgroundColor: '#0B1220',
  },
  fallbackText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  emptySlot: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#cbd5e1',
    backgroundColor: '#fff',
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 26,
    fontWeight: '700',
  },
})