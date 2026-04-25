import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';  // ← différent de navigation.navigate !

export default function AccueilScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ma Bible</Text>
      <Text style={styles.subtitle}>Verset du jour</Text>
      <View style={styles.verseCard}>
        <Text style={styles.verseText}>
          "Car Dieu a tant aimé le monde qu'il a donné son Fils unique..."
        </Text>
        <Text style={styles.verseRef}>Jean 3:16</Text>
      </View>

      {/* Link = navigation vers un autre écran */}
      <Link href="/(tabs)/livres" asChild>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Lire la Bible →</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F0',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#3B2A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#8B7355',
    marginBottom: 20,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  verseCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  verseText: {
    fontSize: 18,
    lineHeight: 28,
    color: '#3B2A1A',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  verseRef: {
    fontSize: 14,
    color: '#8B4513',
    fontWeight: '600',
    textAlign: 'right',
  },
  button: {
    backgroundColor: '#8B4513',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});