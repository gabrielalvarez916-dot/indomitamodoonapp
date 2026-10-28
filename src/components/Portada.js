import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { colores } from '../theme';

// Portada 16:9 del curso (con respaldo negro si todavía no tiene imagen).
export default function Portada({ uri, style }) {
  return (
    <View style={[styles.caja, style]}>
      {uri ? (
        <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" transition={200} />
      ) : (
        <Ionicons name="play-circle" size={44} color={colores.lima} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  caja: { width: '100%', aspectRatio: 16 / 9, backgroundColor: colores.negro, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
