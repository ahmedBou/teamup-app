import { StyleSheet, Text, View } from 'react-native'

type PuzzlePreviewProps = {
  participantCount: number
  maxParticipants: number
  status?: string
}

export default function PuzzlePreview({
  participantCount,
  maxParticipants,
  status,
}: PuzzlePreviewProps) {
  const safeMax = Math.max(maxParticipants, 0)
  const safeCount = Math.min(participantCount, safeMax)
  const isFull = status === 'full' || safeCount >= safeMax

  const slots = Array.from({ length: safeMax }, (_, index) => index < safeCount)

  return (
    <View style={styles.wrapper}>
      <Text style={styles.text}>
        {isFull
          ? 'Team complete'
          : `${safeCount} / ${safeMax} spots filled`}
      </Text>

      <View style={styles.row}>
        {slots.map((filled, index) => (
          <View
            key={index}
            style={[styles.slot, filled ? styles.slotFilled : styles.slotEmpty]}
          />
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
    marginTop: 10,
  },
  text: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  slot: {
    width: 14,
    height: 14,
    borderRadius: 999,
  },
  slotFilled: {
    backgroundColor: '#22c55e',
  },
  slotEmpty: {
    backgroundColor: '#e5e7eb',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
})