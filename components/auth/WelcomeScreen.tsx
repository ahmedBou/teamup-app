import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

type WelcomeScreenProps = {
  onGooglePress: () => void
  onApplePress: () => void
  onEmailPress: () => void
}

export default function WelcomeScreen({
  onGooglePress,
  onApplePress,
  onEmailPress,
}: WelcomeScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.hero}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>T</Text>
          </View>

          <Text style={styles.title}>TeamUp</Text>
          <Text style={styles.tagline}>
            Create or join local group rides and watch the squad fill up piece by piece.
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.googleButton} onPress={onGooglePress} activeOpacity={0.8}>
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={onApplePress} activeOpacity={0.8}>
            <Text style={styles.secondaryButtonText}>Continue with Apple</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={onEmailPress} activeOpacity={0.8}>
            <Text style={styles.secondaryButtonText}>Continue with Email</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>
          Meet cyclists nearby, join rides, and build your group visually.
        </Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B1220',
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22C55E',
    marginBottom: 20,
  },
  logoText: {
    fontSize: 36,
    fontWeight: '800',
    color: '#0B1220',
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  tagline: {
    fontSize: 16,
    lineHeight: 24,
    color: '#CBD5E1',
    textAlign: 'center',
    maxWidth: 320,
  },
  actions: {
    gap: 12,
  },
  googleButton: {
    height: 56,
    borderRadius: 16,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0B1220',
  },
  secondaryButton: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  footer: {
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 20,
    color: '#64748B',
    marginTop: 24,
  },
})