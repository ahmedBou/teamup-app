import { StyleSheet, Text, View } from 'react-native'

type CircuitPuzzleOverlayProps = {
  participantCount: number
  maxParticipants: number
}

export default function CircuitPuzzleOverlay({
  participantCount,
  maxParticipants,
}: CircuitPuzzleOverlayProps) {
  const visualMax = Math.min(maxParticipants, 6)
  const safeCount = Math.min(participantCount, visualMax)

  const slots = Array.from({ length: visualMax }, (_, index) => index < safeCount)

  return (
    <View style={styles.wrapper}>
      <View style={styles.grid}>
        {slots.map((filled, index) => (
          <View
            key={index}
            style={[
              styles.piece,
              filled ? styles.pieceFilled : styles.pieceEmpty,
            ]}
          >
            <Text style={styles.pieceText}>{filled ? '✓' : '+'}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'center',
    width: '82%',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(8, 15, 28, 0.30)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  piece: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pieceFilled: {
    backgroundColor: 'rgba(34,197,94,0.95)',
  },
  pieceEmpty: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.42)',
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  pieceText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
  },
})